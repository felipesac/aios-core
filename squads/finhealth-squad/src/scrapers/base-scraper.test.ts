/**
 * Tests: Base Scraper
 * FinHealth Squad
 */

import { describe, it, expect } from 'vitest';
import { BaseScraper } from './base-scraper';
import type { ScraperConfig, ScraperDeps, ValidationResult } from './types';

// ============================================================================
// Test helpers
// ============================================================================

function createMockDeps(overrides?: Partial<ScraperDeps>): ScraperDeps {
  return {
    httpClient: {
      get: async () => ({ data: '<html></html>' }),
    },
    llmClient: {
      chatCompletion: async () => ({ content: '{"isValid": true, "issues": []}' }),
    },
    fileSystem: {
      readFile: async () => '{}',
      writeFile: async () => {},
      exists: async () => false,
    },
    logger: {
      info: () => {},
      warn: () => {},
      error: () => {},
    },
    ...overrides,
  };
}

const TEST_CONFIG: ScraperConfig = {
  urls: { primary: 'https://example.com/data' },
  outputPath: '/tmp/test-output.json',
  name: 'TestScraper',
};

// Concrete test subclass
class TestScraper extends BaseScraper<string[]> {
  public parseHtmlFn: (html: string) => string[] = () => ['item1', 'item2'];
  public fallbackData: string[] = ['fallback1'];

  protected parseHtml(html: string): string[] {
    return this.parseHtmlFn(html);
  }

  protected getEmptyData(): string[] {
    return [];
  }

  protected hasData(data: string[]): boolean {
    return data.length > 0;
  }

  protected getValidationPrompt(data: string[]) {
    return {
      system: 'Validate this data',
      user: JSON.stringify(data),
    };
  }

  protected getFallbackPrompt() {
    return {
      system: 'Provide fallback data',
      user: 'Give me data',
    };
  }

  protected parseFallbackResponse(content: string): string[] {
    const parsed = JSON.parse(content);
    return parsed.data || parsed;
  }

  protected buildCacheOutput(data: string[]) {
    return { _meta: { name: 'test' }, data };
  }

  protected mergeWithExisting(existingRaw: any, newData: string[]): string[] {
    const existing = existingRaw.data || [];
    const merged = new Set([...existing, ...newData]);
    return Array.from(merged);
  }

  // Expose protected methods for testing
  public async testFetchHtml(url: string) {
    return this.fetchHtml(url);
  }

  public async testValidateWithLlm(data: string[]) {
    return this.validateWithLlm(data);
  }
}

// ============================================================================
// Tests
// ============================================================================

describe('BaseScraper — scrape() happy path', () => {
  it('should return success with scraper source when scraping succeeds', async () => {
    const deps = createMockDeps({
      httpClient: { get: async () => ({ data: '<html><div>content</div></html>' }) },
    });
    const scraper = new TestScraper(TEST_CONFIG, deps);

    const result = await scraper.scrape();

    expect(result.success).toBe(true);
    expect(result.source).toBe('scraper');
    expect(result.data).toEqual(['item1', 'item2']);
    expect(result.needsMaintenance).toBe(false);
  });

  it('should call cacheData on successful scrape', async () => {
    let writtenData = '';
    const deps = createMockDeps({
      fileSystem: {
        readFile: async () => '{}',
        writeFile: async (_path, data) => { writtenData = data; },
        exists: async () => false,
      },
    });
    const scraper = new TestScraper(TEST_CONFIG, deps);

    await scraper.scrape();

    expect(writtenData).toContain('"item1"');
    expect(writtenData).toContain('"item2"');
  });

  it('should include validation warnings in result', async () => {
    const deps = createMockDeps({
      llmClient: {
        chatCompletion: async () => ({
          content: '{"isValid": true, "issues": ["Minor issue found"]}',
        }),
      },
    });
    const scraper = new TestScraper(TEST_CONFIG, deps);

    const result = await scraper.scrape();

    expect(result.success).toBe(true);
    expect(result.warnings).toContain('Minor issue found');
  });
});

describe('BaseScraper — scrape() validation failure, fallback success', () => {
  it('should fall back to LLM when validation fails', async () => {
    const deps = createMockDeps({
      llmClient: {
        chatCompletion: async (params) => {
          if (params.temperature === 0.1) {
            // Validation call — return invalid
            return { content: '{"isValid": false, "issues": ["Bad data", "Bad data 2", "Bad data 3"]}' };
          }
          // Fallback call
          return { content: '{"data": ["fallback1"]}' };
        },
      },
    });
    const scraper = new TestScraper(TEST_CONFIG, deps);

    const result = await scraper.scrape();

    expect(result.success).toBe(true);
    expect(result.source).toBe('llm_fallback');
    expect(result.data).toEqual(['fallback1']);
    expect(result.needsMaintenance).toBe(true);
  });

  it('should include maintenance alert warning on fallback', async () => {
    const deps = createMockDeps({
      llmClient: {
        chatCompletion: async (params) => {
          if (params.temperature === 0.1) {
            return { content: '{"isValid": false, "issues": ["a","b","c"]}' };
          }
          return { content: '{"data": ["fb"]}' };
        },
      },
    });
    const scraper = new TestScraper(TEST_CONFIG, deps);

    const result = await scraper.scrape();

    expect(result.warnings).toContain('MAINTENANCE ALERT: Scraper failed, using LLM fallback');
  });

  it('should cache fallback data', async () => {
    let writtenData = '';
    const deps = createMockDeps({
      llmClient: {
        chatCompletion: async (params) => {
          if (params.temperature === 0.1) {
            return { content: '{"isValid": false, "issues": ["a","b","c"]}' };
          }
          return { content: '{"data": ["cached_fallback"]}' };
        },
      },
      fileSystem: {
        readFile: async () => '{}',
        writeFile: async (_path, data) => { writtenData = data; },
        exists: async () => false,
      },
    });
    const scraper = new TestScraper(TEST_CONFIG, deps);

    await scraper.scrape();

    expect(writtenData).toContain('cached_fallback');
  });
});

describe('BaseScraper — scrape() HTTP error, fallback success', () => {
  it('should fall back when HTTP request fails', async () => {
    const deps = createMockDeps({
      httpClient: { get: async () => { throw new Error('Network error'); } },
      llmClient: {
        chatCompletion: async () => ({ content: '{"data": ["network_fallback"]}' }),
      },
    });
    const scraper = new TestScraper(TEST_CONFIG, deps);

    const result = await scraper.scrape();

    expect(result.success).toBe(true);
    expect(result.source).toBe('llm_fallback');
    expect(result.errors).toContain('Scraping error: Network error');
  });

  it('should fall back when parsing returns empty data', async () => {
    const deps = createMockDeps({
      llmClient: {
        chatCompletion: async () => ({ content: '{"data": ["empty_fallback"]}' }),
      },
    });
    const scraper = new TestScraper(TEST_CONFIG, deps);
    scraper.parseHtmlFn = () => []; // Return empty from parsing

    const result = await scraper.scrape();

    expect(result.success).toBe(true);
    expect(result.source).toBe('llm_fallback');
  });
});

describe('BaseScraper — scrape() complete failure', () => {
  it('should return failure when both scraping and fallback fail', async () => {
    const deps = createMockDeps({
      httpClient: { get: async () => { throw new Error('HTTP fail'); } },
      llmClient: { chatCompletion: async () => { throw new Error('LLM fail'); } },
    });
    const scraper = new TestScraper(TEST_CONFIG, deps);

    const result = await scraper.scrape();

    expect(result.success).toBe(false);
    expect(result.data).toEqual([]);
    expect(result.needsMaintenance).toBe(true);
    expect(result.errors.length).toBeGreaterThanOrEqual(2);
  });

  it('should return failure when fallback returns empty data', async () => {
    const deps = createMockDeps({
      httpClient: { get: async () => { throw new Error('HTTP fail'); } },
      llmClient: { chatCompletion: async () => ({ content: '{"data": []}' }) },
    });
    const scraper = new TestScraper(TEST_CONFIG, deps);

    const result = await scraper.scrape();

    expect(result.success).toBe(false);
  });
});

describe('BaseScraper — fetchHtml()', () => {
  it('should pass correct headers and timeout', async () => {
    let capturedConfig: any;
    const deps = createMockDeps({
      httpClient: {
        get: async (_url, config) => {
          capturedConfig = config;
          return { data: '<html></html>' };
        },
      },
    });
    const scraper = new TestScraper(TEST_CONFIG, deps);

    await scraper.testFetchHtml('https://example.com');

    expect(capturedConfig.headers['User-Agent']).toContain('FinHealth-Squad');
    expect(capturedConfig.timeout).toBe(30000);
  });

  it('should propagate HTTP errors', async () => {
    const deps = createMockDeps({
      httpClient: { get: async () => { throw new Error('403 Forbidden'); } },
    });
    const scraper = new TestScraper(TEST_CONFIG, deps);

    await expect(scraper.testFetchHtml('https://example.com')).rejects.toThrow('403 Forbidden');
  });
});

describe('BaseScraper — validateWithLlm()', () => {
  it('should parse valid JSON response', async () => {
    const deps = createMockDeps({
      llmClient: {
        chatCompletion: async () => ({
          content: '{"isValid": true, "issues": []}',
        }),
      },
    });
    const scraper = new TestScraper(TEST_CONFIG, deps);

    const result = await scraper.testValidateWithLlm(['test']);

    expect(result.isValid).toBe(true);
    expect(result.warnings.length).toBe(0);
  });

  it('should handle malformed JSON response gracefully', async () => {
    const deps = createMockDeps({
      llmClient: {
        chatCompletion: async () => ({ content: 'not json' }),
      },
    });
    const scraper = new TestScraper(TEST_CONFIG, deps);

    const result = await scraper.testValidateWithLlm(['test']);

    // Falls back to warning-count based validation
    expect(result.warnings.length).toBeGreaterThan(0);
  });

  it('should handle LLM API error gracefully', async () => {
    const deps = createMockDeps({
      llmClient: { chatCompletion: async () => { throw new Error('API down'); } },
    });
    const scraper = new TestScraper(TEST_CONFIG, deps);

    const result = await scraper.testValidateWithLlm(['test']);

    expect(result.warnings).toContain('Validation API error: API down');
  });
});

describe('BaseScraper — caching', () => {
  it('should merge with existing data when file exists', async () => {
    let writtenData = '';
    const deps = createMockDeps({
      fileSystem: {
        readFile: async () => JSON.stringify({ data: ['existing'] }),
        writeFile: async (_path, data) => { writtenData = data; },
        exists: async () => true,
      },
    });
    const scraper = new TestScraper(TEST_CONFIG, deps);

    await scraper.scrape();

    const parsed = JSON.parse(writtenData);
    expect(parsed.data).toContain('existing');
    expect(parsed.data).toContain('item1');
  });
});
