/**
 * ANS TUSS Scraper
 * FinHealth Squad
 *
 * Scrapes TUSS (Terminologia Unificada da Saúde Suplementar) procedure codes
 * from ANS (Agência Nacional de Saúde Suplementar) portal.
 */

import * as cheerio from 'cheerio';
import { BaseScraper } from './base-scraper';
import type { ScraperConfig, ScraperDeps, TussProcedure } from './types';

// ============================================================================
// Configuration
// ============================================================================

const DEFAULT_CONFIG: ScraperConfig = {
  name: 'ANS Scraper',
  urls: {
    tiss_portal: 'https://www.gov.br/ans/pt-br/assuntos/prestadores/padrao-para-troca-de-informacao-de-saude-suplementar-2013-tiss',
    tuss_table: 'https://www.gov.br/ans/pt-br/acesso-a-informacao/participacao-da-sociedade/consultas-publicas/terminologia-unificada-da-saude-suplementar-2013-tuss',
  },
  outputPath: '',
};

// ============================================================================
// Pure functions
// ============================================================================

/**
 * Infer procedure type from TUSS code prefix.
 */
export function inferProcedureType(codigo: string): string {
  const prefix = codigo.substring(0, 2);
  const typeMap: Record<string, string> = {
    '10': 'consulta',
    '20': 'procedimento_clinico',
    '30': 'cirurgia',
    '40': 'exame',
    '50': 'terapia',
    '60': 'material',
    '70': 'medicamento',
    '80': 'internacao',
    '90': 'outros',
  };
  return typeMap[prefix] || 'outros';
}

/**
 * Merge TUSS procedures avoiding duplicates, sorted by codigo.
 */
export function mergeTussProcedures(
  existing: TussProcedure[],
  newData: TussProcedure[],
): TussProcedure[] {
  const merged = new Map<string, TussProcedure>();

  for (const proc of existing) {
    merged.set(proc.codigo, proc);
  }
  for (const proc of newData) {
    merged.set(proc.codigo, proc);
  }

  return Array.from(merged.values()).sort((a, b) => a.codigo.localeCompare(b.codigo));
}

// ============================================================================
// ANS Scraper Class
// ============================================================================

export class AnsScraper extends BaseScraper<TussProcedure[]> {
  constructor(config: Partial<ScraperConfig> & { outputPath: string }, deps: ScraperDeps) {
    super({ ...DEFAULT_CONFIG, ...config }, deps);
  }

  protected parseHtml(html: string): TussProcedure[] {
    const procedures: TussProcedure[] = [];
    const $ = cheerio.load(html);

    // Parse TUSS table structure
    $('table.tuss-table tr, table[data-tuss] tr, .procedimentos-table tr').each((_, row) => {
      const cols = $(row).find('td');
      if (cols.length >= 2) {
        const codigo = $(cols[0]).text().trim();
        const descricao = $(cols[1]).text().trim();

        if (codigo && /^\d{8}$/.test(codigo)) {
          procedures.push({
            codigo,
            descricao,
            tipo: inferProcedureType(codigo),
            porte: cols.length > 2 ? $(cols[2]).text().trim() || undefined : undefined,
          });
        }
      }
    });

    // Also try to find procedures in other formats (lists, divs)
    $('.codigo-tuss, [data-codigo]').each((_, el) => {
      const codigo = $(el).attr('data-codigo') || $(el).text().trim();
      const descricao = $(el).next('.descricao').text() || $(el).parent().find('.descricao').text();

      if (codigo && descricao && /^\d{8}$/.test(codigo)) {
        // Avoid duplicates
        if (!procedures.some(p => p.codigo === codigo)) {
          procedures.push({
            codigo,
            descricao: descricao.trim(),
            tipo: inferProcedureType(codigo),
          });
        }
      }
    });

    return procedures;
  }

  protected getEmptyData(): TussProcedure[] {
    return [];
  }

  protected hasData(data: TussProcedure[]): boolean {
    return data.length > 0;
  }

  protected getValidationPrompt(data: TussProcedure[]) {
    const sample = data.slice(0, 10);
    return {
      system: `You are a healthcare data validator. Validate if the following TUSS procedure data looks correct.
Check for: valid 8-digit codes, reasonable descriptions in Portuguese, proper medical terminology.
Respond with JSON: { "isValid": boolean, "issues": string[] }`,
      user: JSON.stringify(sample, null, 2),
    };
  }

  protected getFallbackPrompt() {
    return {
      system: `You are a healthcare data specialist. Search for the current TUSS (Terminologia Unificada da Saúde Suplementar) procedure codes from ANS Brazil.
Return a JSON object with a "procedures" array. Each procedure has: codigo (8 digits), descricao, tipo.
Focus on common procedures: consultas, exames laboratoriais, exames de imagem, procedimentos cirúrgicos.
Return at least 20 common procedures.`,
      user: 'Please provide current TUSS procedure codes from ANS Brazil portal. Include common consultations, lab tests, imaging exams, and surgical procedures.',
    };
  }

  protected parseFallbackResponse(content: string): TussProcedure[] {
    const parsed = JSON.parse(content);
    const procedures = parsed.procedures || parsed.data || (Array.isArray(parsed) ? parsed : []);

    return procedures.map((p: Record<string, unknown>) => ({
      codigo: String(p.codigo || p.code || ''),
      descricao: String(p.descricao || p.description || ''),
      tipo: (p.tipo || p.type || inferProcedureType(String(p.codigo || p.code || ''))) as string,
    }));
  }

  protected buildCacheOutput(data: TussProcedure[]) {
    return {
      _meta: {
        description: 'Tabela TUSS - Terminologia Unificada da Saúde Suplementar',
        source: 'ANS - Agência Nacional de Saúde Suplementar',
        version: new Date().toISOString().split('T')[0].replace(/-/g, '.'),
        last_update: new Date().toISOString(),
        procedure_count: data.length,
        note: 'Synced from ANS official data sources',
      },
      procedures: data,
    };
  }

  protected mergeWithExisting(existingRaw: unknown, newData: TussProcedure[]): TussProcedure[] {
    const raw = existingRaw as Record<string, unknown>;
    const existing = (raw.procedures || []) as TussProcedure[];
    return mergeTussProcedures(existing, newData);
  }
}
