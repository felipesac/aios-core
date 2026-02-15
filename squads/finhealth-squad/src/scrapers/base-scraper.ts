/**
 * Base Scraper
 * FinHealth Squad
 *
 * Abstract base class implementing the 3-stage scraping pattern:
 * 1. Cheerio + HTTP scraping
 * 2. LLM validation of scraped data
 * 3. LLM fallback when scraping fails
 *
 * All I/O is injected via ScraperDeps for testability.
 */

import type {
  ScraperConfig,
  ScraperDeps,
  ScrapeResult,
  ScrapeSource,
  ValidationResult,
} from './types';

// ============================================================================
// Abstract Base Scraper
// ============================================================================

export abstract class BaseScraper<TData> {
  protected config: ScraperConfig;
  protected deps: ScraperDeps;

  constructor(config: ScraperConfig, deps: ScraperDeps) {
    this.config = config;
    this.deps = deps;
  }

  // --------------------------------------------------------------------------
  // Abstract methods — each subclass implements these
  // --------------------------------------------------------------------------

  /** Parse raw HTML into domain data */
  protected abstract parseHtml(html: string): TData;

  /** Return the empty/default value for this data type */
  protected abstract getEmptyData(): TData;

  /** Check if scraped data is non-empty */
  protected abstract hasData(data: TData): boolean;

  /** Build the system+user prompt for LLM validation */
  protected abstract getValidationPrompt(data: TData): { system: string; user: string };

  /** Build the system+user prompt for LLM fallback */
  protected abstract getFallbackPrompt(): { system: string; user: string };

  /** Parse LLM fallback response JSON into domain data */
  protected abstract parseFallbackResponse(content: string): TData;

  /** Build the JSON output object for caching to file */
  protected abstract buildCacheOutput(data: TData): Record<string, unknown>;

  /** Merge new data with existing cached data */
  protected abstract mergeWithExisting(existingRaw: unknown, newData: TData): TData;

  // --------------------------------------------------------------------------
  // Template method: orchestrates the 3-stage scraping
  // --------------------------------------------------------------------------

  async scrape(): Promise<ScrapeResult<TData>> {
    const errors: string[] = [];
    const warnings: string[] = [];
    const { name } = this.config;

    this.deps.logger.info(`[${name}] Starting scrape...`);

    // Stage 1: Try HTTP + Cheerio scraping
    try {
      const primaryUrl = Object.values(this.config.urls)[0];
      const html = await this.fetchHtml(primaryUrl);
      const scrapedData = this.parseHtml(html);

      if (this.hasData(scrapedData)) {
        // Stage 2: Validate with LLM
        const validation = await this.validateWithLlm(scrapedData);

        if (validation.isValid) {
          await this.cacheData(scrapedData);
          this.deps.logger.info(`[${name}] Scrape successful via scraper`);

          return this.buildResult(true, 'scraper', scrapedData, errors, [
            ...warnings,
            ...validation.warnings,
          ], false);
        }

        warnings.push('Scraped data failed validation');
        warnings.push(...validation.warnings);
      }
    } catch (error: any) {
      errors.push(`Scraping error: ${error.message || error}`);
      this.deps.logger.error(`[${name}] Cheerio scraping failed: ${error.message || error}`);
    }

    // Stage 3: Fallback to LLM
    this.deps.logger.warn(`[${name}] Falling back to LLM...`);
    warnings.push('MAINTENANCE ALERT: Scraper failed, using LLM fallback');

    try {
      const fallbackData = await this.fallbackWithLlm();

      if (this.hasData(fallbackData)) {
        await this.cacheData(fallbackData);
        this.deps.logger.info(`[${name}] Scrape successful via LLM fallback`);

        return this.buildResult(true, 'llm_fallback', fallbackData, errors, warnings, true);
      }
    } catch (fallbackError: any) {
      errors.push(`Fallback error: ${fallbackError.message || fallbackError}`);
    }

    // Complete failure
    this.deps.logger.error(`[${name}] All scraping methods failed`);

    return this.buildResult(false, 'scraper', this.getEmptyData(), errors, warnings, true);
  }

  // --------------------------------------------------------------------------
  // Shared implementations
  // --------------------------------------------------------------------------

  protected async fetchHtml(url: string): Promise<string> {
    const response = await this.deps.httpClient.get(url, {
      headers: {
        'User-Agent': this.config.userAgent || 'FinHealth-Squad/1.0 (Healthcare Financial Module)',
        'Accept': 'text/html,application/xhtml+xml',
      },
      timeout: this.config.timeout || 30000,
    });
    return response.data;
  }

  protected async validateWithLlm(data: TData): Promise<ValidationResult> {
    const warnings: string[] = [];
    const prompt = this.getValidationPrompt(data);

    try {
      const response = await this.deps.llmClient.chatCompletion({
        model: this.config.llmModel || 'gpt-4o-mini',
        messages: [
          { role: 'system', content: prompt.system },
          { role: 'user', content: prompt.user },
        ],
        responseFormat: { type: 'json_object' },
        temperature: 0.1,
      });

      if (response.content) {
        const parsed = JSON.parse(response.content);

        if (parsed.issues && Array.isArray(parsed.issues)) {
          warnings.push(...parsed.issues);
        }

        return {
          isValid: parsed.isValid !== false && warnings.length < 3,
          warnings,
        };
      }
    } catch (error: any) {
      warnings.push(`Validation API error: ${error.message || error}`);
    }

    return { isValid: warnings.length < 2, warnings };
  }

  protected async fallbackWithLlm(): Promise<TData> {
    const prompt = this.getFallbackPrompt();

    const response = await this.deps.llmClient.chatCompletion({
      model: this.config.llmModel || 'gpt-4o-mini',
      messages: [
        { role: 'system', content: prompt.system },
        { role: 'user', content: prompt.user },
      ],
      responseFormat: { type: 'json_object' },
      temperature: 0.2,
    });

    if (response.content) {
      return this.parseFallbackResponse(response.content);
    }

    return this.getEmptyData();
  }

  protected async cacheData(data: TData): Promise<void> {
    let merged = data;

    try {
      const fileExists = await this.deps.fileSystem.exists(this.config.outputPath);
      if (fileExists) {
        const existingContent = await this.deps.fileSystem.readFile(this.config.outputPath);
        const existingData = JSON.parse(existingContent);
        merged = this.mergeWithExisting(existingData, data);
      }
    } catch {
      // If loading existing data fails, just use new data
    }

    const output = this.buildCacheOutput(merged);
    await this.deps.fileSystem.writeFile(this.config.outputPath, JSON.stringify(output, null, 2));
    this.deps.logger.info(`[${this.config.name}] Data cached to ${this.config.outputPath}`);
  }

  private buildResult(
    success: boolean,
    source: ScrapeSource,
    data: TData,
    errors: string[],
    warnings: string[],
    needsMaintenance: boolean,
  ): ScrapeResult<TData> {
    return {
      success,
      source,
      data,
      errors,
      warnings,
      timestamp: new Date(),
      needsMaintenance,
    };
  }
}
