/**
 * CBHPM Scraper
 * FinHealth Squad
 *
 * Scrapes CBHPM (Classificação Brasileira Hierarquizada de Procedimentos Médicos)
 * procedure codes and porte table from AMB portal.
 */

import * as cheerio from 'cheerio';
import { BaseScraper } from './base-scraper';
import type { CbhpmData, CbhpmProcedure, PorteInfo, ScraperConfig, ScraperDeps } from './types';

// ============================================================================
// Constants
// ============================================================================

export const UCH_VALOR_BASE = 0.55;

const DEFAULT_CONFIG: ScraperConfig = {
  name: 'CBHPM Scraper',
  urls: {
    amb: 'https://amb.org.br/cbhpm/',
    consulta: 'https://www.portalmedico.org.br/cbhpm/',
  },
  outputPath: '',
};

// ============================================================================
// Pure functions
// ============================================================================

/**
 * Default CBHPM porte table (5th edition reference).
 */
export function getDefaultPortes(): Record<string, PorteInfo> {
  return {
    '1A': { porte: '1A', uch: 40, valor: 22.00, co: 0, filme: 0 },
    '1B': { porte: '1B', uch: 50, valor: 27.50, co: 0, filme: 0 },
    '1C': { porte: '1C', uch: 60, valor: 33.00, co: 0, filme: 0 },
    '2A': { porte: '2A', uch: 75, valor: 41.25, co: 10, filme: 0 },
    '2B': { porte: '2B', uch: 100, valor: 55.00, co: 15, filme: 0 },
    '2C': { porte: '2C', uch: 130, valor: 71.50, co: 20, filme: 0 },
    '3A': { porte: '3A', uch: 170, valor: 93.50, co: 30, filme: 0 },
    '3B': { porte: '3B', uch: 200, valor: 110.00, co: 40, filme: 0 },
    '3C': { porte: '3C', uch: 250, valor: 137.50, co: 50, filme: 0 },
    '4A': { porte: '4A', uch: 300, valor: 165.00, co: 70, filme: 0 },
    '4B': { porte: '4B', uch: 350, valor: 192.50, co: 90, filme: 0 },
    '4C': { porte: '4C', uch: 420, valor: 231.00, co: 110, filme: 0 },
    '5A': { porte: '5A', uch: 500, valor: 275.00, co: 140, filme: 0 },
    '5B': { porte: '5B', uch: 600, valor: 330.00, co: 170, filme: 0 },
    '5C': { porte: '5C', uch: 700, valor: 385.00, co: 200, filme: 0 },
    '6A': { porte: '6A', uch: 850, valor: 467.50, co: 250, filme: 0 },
    '6B': { porte: '6B', uch: 1000, valor: 550.00, co: 300, filme: 0 },
    '6C': { porte: '6C', uch: 1200, valor: 660.00, co: 360, filme: 0 },
    '7A': { porte: '7A', uch: 1500, valor: 825.00, co: 450, filme: 0 },
    '7B': { porte: '7B', uch: 1800, valor: 990.00, co: 540, filme: 50 },
    '7C': { porte: '7C', uch: 2200, valor: 1210.00, co: 660, filme: 70 },
    '8A': { porte: '8A', uch: 2700, valor: 1485.00, co: 810, filme: 100 },
    '8B': { porte: '8B', uch: 3300, valor: 1815.00, co: 990, filme: 150 },
    '8C': { porte: '8C', uch: 4000, valor: 2200.00, co: 1200, filme: 200 },
    '9A': { porte: '9A', uch: 5000, valor: 2750.00, co: 1500, filme: 0 },
    '9B': { porte: '9B', uch: 6500, valor: 3575.00, co: 1950, filme: 0 },
    '9C': { porte: '9C', uch: 8000, valor: 4400.00, co: 2400, filme: 0 },
    '10A': { porte: '10A', uch: 10000, valor: 5500.00, co: 3000, filme: 0 },
    '10B': { porte: '10B', uch: 12500, valor: 6875.00, co: 3750, filme: 0 },
    '10C': { porte: '10C', uch: 16000, valor: 8800.00, co: 4800, filme: 0 },
    '11A': { porte: '11A', uch: 20000, valor: 11000.00, co: 6000, filme: 0 },
    '11B': { porte: '11B', uch: 25000, valor: 13750.00, co: 7500, filme: 0 },
    '11C': { porte: '11C', uch: 30000, valor: 16500.00, co: 9000, filme: 0 },
    '12A': { porte: '12A', uch: 38000, valor: 20900.00, co: 11400, filme: 0 },
    '12B': { porte: '12B', uch: 47000, valor: 25850.00, co: 14100, filme: 0 },
    '12C': { porte: '12C', uch: 58000, valor: 31900.00, co: 17400, filme: 0 },
    '13A': { porte: '13A', uch: 72000, valor: 39600.00, co: 21600, filme: 0 },
    '13B': { porte: '13B', uch: 90000, valor: 49500.00, co: 27000, filme: 0 },
    '13C': { porte: '13C', uch: 110000, valor: 60500.00, co: 33000, filme: 0 },
    '14A': { porte: '14A', uch: 140000, valor: 77000.00, co: 42000, filme: 0 },
    '14B': { porte: '14B', uch: 175000, valor: 96250.00, co: 52500, filme: 0 },
    '14C': { porte: '14C', uch: 220000, valor: 121000.00, co: 66000, filme: 0 },
  };
}

export function getUchForPorte(porte: string): number {
  return getDefaultPortes()[porte]?.uch || 100;
}

export function getValorForPorte(porte: string): number {
  return getDefaultPortes()[porte]?.valor || 55;
}

export function getCoForPorte(porte: string): number {
  return getDefaultPortes()[porte]?.co || 0;
}

// ============================================================================
// CBHPM Scraper Class
// ============================================================================

export class CbhpmScraper extends BaseScraper<CbhpmData> {
  constructor(config: Partial<ScraperConfig> & { outputPath: string }, deps: ScraperDeps) {
    super({ ...DEFAULT_CONFIG, ...config }, deps);
  }

  protected parseHtml(html: string): CbhpmData {
    const procedures: CbhpmProcedure[] = [];
    const portes: Record<string, PorteInfo> = {};
    const $ = cheerio.load(html);

    // Parse procedure tables
    $('table.cbhpm-table tr, table[data-cbhpm] tr, .procedimentos-cbhpm tr').each((_, row) => {
      const cols = $(row).find('td');
      if (cols.length >= 3) {
        const codigo = $(cols[0]).text().trim();
        const descricao = $(cols[1]).text().trim();
        const porte = $(cols[2]).text().trim().toUpperCase();

        if (codigo && descricao && /^\d{2}\.\d{2}\.\d{2}\.\d{2}$/.test(codigo)) {
          procedures.push({
            codigo,
            descricao,
            porte,
            uch: getUchForPorte(porte),
            valor_porte: getValorForPorte(porte),
            custo_operacional: getCoForPorte(porte),
          });
        }
      }
    });

    // Parse porte table if available
    $('table.portes tr, .tabela-portes tr').each((_, row) => {
      const cols = $(row).find('td');
      if (cols.length >= 4) {
        const porte = $(cols[0]).text().trim().toUpperCase();
        const uch = parseInt($(cols[1]).text().replace(/\D/g, '')) || 0;

        if (porte && /^\d{1,2}[A-C]$/.test(porte)) {
          portes[porte] = {
            porte,
            uch,
            valor: uch * UCH_VALOR_BASE,
            co: parseInt($(cols[2]).text().replace(/\D/g, '')) || 0,
            filme: parseInt($(cols[3]).text().replace(/\D/g, '')) || 0,
          };
        }
      }
    });

    // If no portes found from HTML, use default table
    const finalPortes = Object.keys(portes).length > 0 ? portes : getDefaultPortes();

    return { procedures, portes: finalPortes, uch_valor: UCH_VALOR_BASE };
  }

  protected getEmptyData(): CbhpmData {
    return { procedures: [], portes: {}, uch_valor: UCH_VALOR_BASE };
  }

  protected hasData(data: CbhpmData): boolean {
    return data.procedures.length > 0 || Object.keys(data.portes).length > 0;
  }

  protected getValidationPrompt(data: CbhpmData) {
    return {
      system: `You are a Brazilian healthcare billing expert. Validate CBHPM data.
Check for: valid procedure codes (XX.XX.XX.XX format), valid porte codes (1A-14C), reasonable UCH values.
Respond with JSON: { "isValid": boolean, "issues": string[] }`,
      user: JSON.stringify({
        procedures: data.procedures.slice(0, 5),
        portes_sample: Object.values(data.portes).slice(0, 5),
      }, null, 2),
    };
  }

  protected getFallbackPrompt() {
    return {
      system: `You are a healthcare billing specialist. Search for current CBHPM procedure codes and porte values.
Return JSON with:
- procedures: array of { codigo, descricao, porte }
- portes: object mapping porte code to { porte, uch, valor, co, filme }
- uch_valor: current UCH monetary value
Include common procedures across different specialties.`,
      user: 'Please provide current CBHPM 5th edition procedure codes and complete porte table with UCH values.',
    };
  }

  protected parseFallbackResponse(content: string): CbhpmData {
    const parsed = JSON.parse(content);

    const procedures: CbhpmProcedure[] = (parsed.procedures || []).map((p: any) => ({
      codigo: String(p.codigo || ''),
      descricao: String(p.descricao || ''),
      porte: String(p.porte || ''),
      uch: getUchForPorte(String(p.porte || '')),
      valor_porte: getValorForPorte(String(p.porte || '')),
      custo_operacional: getCoForPorte(String(p.porte || '')),
    }));

    return {
      procedures,
      portes: parsed.portes || getDefaultPortes(),
      uch_valor: parsed.uch_valor || UCH_VALOR_BASE,
    };
  }

  protected buildCacheOutput(data: CbhpmData) {
    return {
      _meta: {
        description: 'Tabela CBHPM - Classificação Brasileira Hierarquizada de Procedimentos Médicos',
        source: 'AMB - Associação Médica Brasileira',
        version: '5a edição',
        last_update: new Date().toISOString(),
        procedure_count: data.procedures.length,
        note: 'Auto-updated by CBHPM Scraper',
      },
      uch_valor: data.uch_valor,
      portes: data.portes,
      procedures: data.procedures,
      componentes: {
        co: 'Custo Operacional',
        filme: 'Custo de Filmes',
        uch: 'Unidade de Custo Hospitalar',
      },
      auxiliares: {
        primeiro_auxiliar: 0.30,
        segundo_auxiliar: 0.20,
        terceiro_auxiliar: 0.10,
        instrumentador: 0.10,
        anestesista_base: 1.00,
      },
    };
  }

  protected mergeWithExisting(existingRaw: any, newData: CbhpmData): CbhpmData {
    const existingProcs: CbhpmProcedure[] = existingRaw.procedures || [];
    const mergedProcs = new Map<string, CbhpmProcedure>();

    for (const proc of existingProcs) mergedProcs.set(proc.codigo, proc);
    for (const proc of newData.procedures) mergedProcs.set(proc.codigo, proc);

    return {
      procedures: Array.from(mergedProcs.values()).sort((a, b) => a.codigo.localeCompare(b.codigo)),
      portes: { ...(existingRaw.portes || {}), ...newData.portes },
      uch_valor: newData.uch_valor,
    };
  }
}
