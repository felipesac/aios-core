/**
 * DATASUS SIGTAP Scraper
 * FinHealth Squad
 *
 * Scrapes SIGTAP (Sistema de Gerenciamento da Tabela de Procedimentos)
 * procedures and SUS values from DATASUS.
 */

import * as cheerio from 'cheerio';
import { BaseScraper } from './base-scraper';
import type { ScraperConfig, ScraperDeps, SigtapProcedure } from './types';

// ============================================================================
// Configuration
// ============================================================================

const DEFAULT_CONFIG: ScraperConfig = {
  name: 'DATASUS Scraper',
  urls: {
    sigtap: 'http://sigtap.datasus.gov.br/tabela-unificada/app/sec/inicio.jsp',
    sigtap_consulta: 'http://sigtap.datasus.gov.br/tabela-unificada/app/sec/procedimento/publicados/consultar',
  },
  outputPath: '',
};

// ============================================================================
// Pure functions
// ============================================================================

/**
 * Infer SUS complexity from SIGTAP procedure code grupo.
 */
export function inferComplexidade(codigo: string): 'AB' | 'MC' | 'AC' {
  const grupo = codigo.substring(0, 2);

  // Grupos de alta complexidade
  if (['04', '05'].includes(grupo)) return 'AC';

  // Grupos de atenção básica
  if (['01'].includes(grupo)) return 'AB';

  // Default média complexidade
  return 'MC';
}

/**
 * Merge SIGTAP procedures avoiding duplicates, sorted by codigo.
 */
export function mergeSigtapProcedures(
  existing: SigtapProcedure[],
  newData: SigtapProcedure[],
): SigtapProcedure[] {
  const merged = new Map<string, SigtapProcedure>();

  for (const proc of existing) {
    merged.set(proc.codigo, proc);
  }
  for (const proc of newData) {
    merged.set(proc.codigo, proc);
  }

  return Array.from(merged.values()).sort((a, b) => a.codigo.localeCompare(b.codigo));
}

// ============================================================================
// DATASUS Scraper Class
// ============================================================================

export class DatasusScraper extends BaseScraper<SigtapProcedure[]> {
  constructor(config: Partial<ScraperConfig> & { outputPath: string }, deps: ScraperDeps) {
    super({ ...DEFAULT_CONFIG, ...config }, deps);
  }

  protected parseHtml(html: string): SigtapProcedure[] {
    const procedures: SigtapProcedure[] = [];
    const $ = cheerio.load(html);

    // Parse SIGTAP procedure tables
    $('table.sigtap-table tr, table[data-sigtap] tr, .procedimentos tr').each((_, row) => {
      const cols = $(row).find('td');
      if (cols.length >= 4) {
        const codigo = $(cols[0]).text().trim();

        if (codigo && /^\d{10}$/.test(codigo)) {
          procedures.push({
            codigo,
            descricao: $(cols[1]).text().trim(),
            grupo: codigo.substring(0, 2),
            subgrupo: codigo.substring(2, 4),
            forma_organizacao: codigo.substring(4, 6),
            valor_sh: parseFloat($(cols[2]).text().replace(',', '.')) || 0,
            valor_sp: parseFloat($(cols[3]).text().replace(',', '.')) || 0,
            valor_total: cols.length > 4
              ? parseFloat($(cols[4]).text().replace(',', '.')) || 0
              : (parseFloat($(cols[2]).text().replace(',', '.')) || 0) +
                (parseFloat($(cols[3]).text().replace(',', '.')) || 0),
            complexidade: inferComplexidade(codigo),
          });
        }
      }
    });

    // Try alternative selectors
    $('.codigo-sigtap, [data-codigo-sigtap]').each((_, el) => {
      const codigo = $(el).attr('data-codigo-sigtap') || $(el).text().trim();
      const row = $(el).closest('tr');

      if (codigo && /^\d{10}$/.test(codigo) && !procedures.some(p => p.codigo === codigo)) {
        procedures.push({
          codigo,
          descricao: row.find('.descricao, td:nth-child(2)').text().trim(),
          grupo: codigo.substring(0, 2),
          subgrupo: codigo.substring(2, 4),
          forma_organizacao: codigo.substring(4, 6),
          valor_sh: parseFloat(row.find('.valor-sh, td:nth-child(3)').text().replace(',', '.')) || 0,
          valor_sp: parseFloat(row.find('.valor-sp, td:nth-child(4)').text().replace(',', '.')) || 0,
          valor_total: parseFloat(row.find('.valor-total, td:nth-child(5)').text().replace(',', '.')) || 0,
          complexidade: inferComplexidade(codigo),
        });
      }
    });

    return procedures;
  }

  protected getEmptyData(): SigtapProcedure[] {
    return [];
  }

  protected hasData(data: SigtapProcedure[]): boolean {
    return data.length > 0;
  }

  protected getValidationPrompt(data: SigtapProcedure[]) {
    const sample = data.slice(0, 10);
    return {
      system: `You are a Brazilian healthcare data validator. Validate SIGTAP procedure data.
Check for: valid 10-digit codes, reasonable descriptions in Portuguese, valid SUS values.
Respond with JSON: { "isValid": boolean, "issues": string[] }`,
      user: JSON.stringify(sample, null, 2),
    };
  }

  protected getFallbackPrompt() {
    return {
      system: `You are a healthcare data specialist. Search for current SIGTAP procedure codes and values from DATASUS Brazil.
Return a JSON object with a "procedures" array. Each procedure has: codigo (10 digits), descricao, grupo, subgrupo, valor_sh, valor_sp, valor_total, complexidade (AB/MC/AC).
Include common SUS procedures: consultations, lab tests, hospitalizations, surgeries.
Return at least 20 procedures.`,
      user: 'Please provide current SIGTAP procedure codes with SUS values from DATASUS. Include common procedures across different complexity levels.',
    };
  }

  protected parseFallbackResponse(content: string): SigtapProcedure[] {
    const parsed = JSON.parse(content);
    const procedures = parsed.procedures || parsed.data || (Array.isArray(parsed) ? parsed : []);

    return procedures.map((p: Record<string, unknown>) => {
      const codigo = String(p.codigo || p.code || '');
      return {
        codigo,
        descricao: String(p.descricao || p.description || ''),
        grupo: p.grupo || codigo.substring(0, 2),
        subgrupo: p.subgrupo || codigo.substring(2, 4),
        forma_organizacao: p.forma_organizacao || '01',
        valor_sh: parseFloat(p.valor_sh) || 0,
        valor_sp: parseFloat(p.valor_sp) || 0,
        valor_total: parseFloat(p.valor_total) || 0,
        complexidade: p.complexidade || inferComplexidade(codigo),
      };
    });
  }

  protected buildCacheOutput(data: SigtapProcedure[]) {
    return {
      _meta: {
        description: 'Tabela SIGTAP - Sistema de Gerenciamento da Tabela de Procedimentos do SUS',
        source: 'DATASUS - Ministério da Saúde',
        version: new Date().toISOString().split('T')[0].replace(/-/g, '.'),
        last_update: new Date().toISOString(),
        procedure_count: data.length,
        note: 'Auto-updated by DATASUS Scraper',
      },
      procedures: data,
      grupos: [
        { codigo: '01', nome: 'Ações de promoção e prevenção em saúde' },
        { codigo: '02', nome: 'Procedimentos com finalidade diagnóstica' },
        { codigo: '03', nome: 'Procedimentos clínicos' },
        { codigo: '04', nome: 'Procedimentos cirúrgicos' },
        { codigo: '05', nome: 'Transplantes de órgãos, tecidos e células' },
        { codigo: '06', nome: 'Medicamentos' },
        { codigo: '07', nome: 'Órteses, próteses e materiais especiais' },
        { codigo: '08', nome: 'Ações complementares da atenção à saúde' },
      ],
      complexidades: {
        AB: 'Atenção Básica',
        MC: 'Média Complexidade',
        AC: 'Alta Complexidade',
      },
    };
  }

  protected mergeWithExisting(existingRaw: unknown, newData: SigtapProcedure[]): SigtapProcedure[] {
    const raw = existingRaw as Record<string, unknown>;
    const existing = (raw.procedures || []) as SigtapProcedure[];
    return mergeSigtapProcedures(existing, newData);
  }
}
