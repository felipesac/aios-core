/**
 * TUSS Full Sync
 * FinHealth Squad — Data Sync Pipeline
 *
 * Downloads the complete TUSS (Terminologia Unificada da Saúde Suplementar)
 * procedure table from ANS official sources and writes to data/tuss-procedures.json.
 *
 * Strategy:
 *   1. Try ANS FTP (ZIP with CSV/ODS inside)
 *   2. Fallback: community GitHub CSV mirror
 */

import { parse as csvParse } from 'csv-parse/sync';
import * as path from 'path';
import { inferProcedureType, mergeTussProcedures } from '../../src/scrapers/ans-scraper';
import type { TussProcedure } from '../../src/scrapers/types';
import {
  downloadFile,
  extractZip,
  loadExistingData,
  writeDataFile,
  buildMeta,
  getDataDir,
} from './shared';

// ============================================================================
// Sources
// ============================================================================

/**
 * ANS publishes TUSS as part of TISS "Representação de Conceitos em Saúde" ZIPs.
 * These contain ODS/XLSX/CSV files — Tabela 22 has the procedure codes.
 * URL pattern: Padrao_TISS_Representacao_de_Conceitos_em_Saude_YYYYMM.zip
 */
const ANS_TISS_ZIP_URLS = [
  'https://www.ans.gov.br/arquivos/extras/tiss/Padrao_TISS_Representacao_de_Conceitos_em_Saude_202505.zip',
  'https://www.ans.gov.br/arquivos/extras/tiss/Padrao_TISS_Representacao_de_Conceitos_em_Saude_202501.zip',
  'http://ftp.dadosabertos.ans.gov.br/FTP/PDA/terminologia_unificada_saude_suplementar_TUSS/TUSS.zip',
];

const GITHUB_FALLBACK_URLS = [
  'https://raw.githubusercontent.com/charlesfgarcia/tabelas-ans/master/TUSS/tabela%2022/Tabela%2022%20-%20Terminologia%20de%20procedimentos%20e%20eventos%20em%20saude.csv',
  'https://raw.githubusercontent.com/charlesfgarcia/tabelas-ans/master/TUSS/tabela%2022/tabela_22.json',
];

// ============================================================================
// CSV Parsing
// ============================================================================

/**
 * Parse TUSS CSV content into TussProcedure[].
 * Handles multiple CSV column layouts commonly found in ANS data.
 */
export function parseTussCsv(content: string): TussProcedure[] {
  const procedures: TussProcedure[] = [];

  // Try to detect separator (semicolon is common in Brazilian CSVs)
  const separator = content.includes(';') ? ';' : ',';

  let records: string[][];
  try {
    records = csvParse(content, {
      delimiter: separator,
      relax_column_count: true,
      skip_empty_lines: true,
      bom: true,
    });
  } catch {
    // Fallback: manual line split
    records = content
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0)
      .map(line => line.split(separator).map(col => col.trim().replace(/^"|"$/g, '')));
  }

  if (records.length === 0) return procedures;

  // Detect header row — look for "codigo" or "cd_" patterns
  const header = records[0].map(h => h.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, ''));
  const startRow = header.some(h =>
    h.includes('codigo') || h.includes('cd_') || h.includes('code') || h.includes('termo'),
  )
    ? 1
    : 0;

  // Find column indices
  const codeCol = findColumnIndex(header, ['cd_termo', 'codigo', 'cd_procedimento', 'code', 'codigo_tuss']);
  const descCol = findColumnIndex(header, ['descricao', 'nm_termo', 'description', 'procedimento', 'ds_']);
  const porteCol = findColumnIndex(header, ['porte', 'cd_porte']);

  // Special handling: if codeCol found "cd_termo", descCol should be the next column named "termo"
  // but not "cd_termo". Use exact match for "termo" if descCol wasn't found.
  const termoExactIdx = descCol < 0 ? header.findIndex(h => h === 'termo') : -1;
  const finalDescCol = descCol >= 0 ? descCol : termoExactIdx;

  for (let i = startRow; i < records.length; i++) {
    const row = records[i];
    if (!row || row.length < 2) continue;

    const rawCode = (codeCol >= 0 ? row[codeCol] : row[0])?.trim().replace(/\D/g, '') || '';
    const rawDesc = (finalDescCol >= 0 ? row[finalDescCol] : row[1])?.trim() || '';
    const rawPorte = porteCol >= 0 ? row[porteCol]?.trim() : undefined;

    // Valid TUSS codes are 8 digits
    if (/^\d{8}$/.test(rawCode) && rawDesc.length > 0) {
      procedures.push({
        codigo: rawCode,
        descricao: rawDesc,
        tipo: inferProcedureType(rawCode),
        ...(rawPorte && rawPorte.length > 0 ? { porte: rawPorte } : {}),
      });
    }
  }

  return procedures;
}

/**
 * Find the best matching column index from a list of possible header names.
 */
function findColumnIndex(headers: string[], candidates: string[]): number {
  for (const candidate of candidates) {
    const idx = headers.findIndex(h => h.includes(candidate));
    if (idx >= 0) return idx;
  }
  return -1;
}

// ============================================================================
// Download strategies
// ============================================================================

async function tryAnsZip(): Promise<TussProcedure[]> {
  for (const url of ANS_TISS_ZIP_URLS) {
    try {
      console.log('  [TUSS] Trying ANS ZIP:', url);
      const buffer = await downloadFile(url, 120_000);
      const files = extractZip(buffer);

      console.log(`  [TUSS] ZIP contains ${files.length} files: ${files.map(f => f.name).join(', ')}`);

      // Look for CSV or TXT files inside the ZIP (prefer "tabela 22" or "procedimento")
      const dataFile = files.find(f =>
        /\.(csv|txt|tsv)$/i.test(f.name) &&
        !f.name.startsWith('__MACOSX'),
      ) || files.find(f =>
        /(tabela.?22|procedimento|tuss)/i.test(f.name) &&
        !f.name.startsWith('__MACOSX') &&
        !f.name.endsWith('/'),
      );

      if (dataFile) {
        const content = dataFile.buffer.toString('utf-8');
        console.log(`  [TUSS] Parsing ${dataFile.name} (${content.length} bytes)`);
        const procedures = parseTussCsv(content);
        if (procedures.length > 0) return procedures;
      }

      // Try all CSV/TXT files in the ZIP
      for (const f of files) {
        if (f.name.startsWith('__MACOSX') || f.name.endsWith('/')) continue;
        if (!/\.(csv|txt|tsv)$/i.test(f.name)) continue;
        const content = f.buffer.toString('utf-8');
        const procedures = parseTussCsv(content);
        if (procedures.length > 100) {
          console.log(`  [TUSS] Found ${procedures.length} procedures in ${f.name}`);
          return procedures;
        }
      }

      console.warn(`  [TUSS] No usable data in ${url}`);
    } catch (err) {
      console.warn(`  [TUSS] Failed for ${url}: ${err}`);
    }
  }
  throw new Error('All ANS ZIP sources failed');
}

async function tryGithubFallback(): Promise<TussProcedure[]> {
  for (const url of GITHUB_FALLBACK_URLS) {
    try {
      console.log('  [TUSS] Trying GitHub fallback:', url);
      const buffer = await downloadFile(url, 30_000);
      const content = buffer.toString('utf-8');

      // Handle JSON format (tabela_22.json)
      if (url.endsWith('.json')) {
        const procedures = parseGithubJson(content);
        if (procedures.length > 0) return procedures;
        continue;
      }

      const procedures = parseTussCsv(content);
      if (procedures.length > 0) return procedures;
    } catch (err) {
      console.warn(`  [TUSS] GitHub fallback failed for ${url}: ${err}`);
    }
  }
  throw new Error('All GitHub fallback sources failed');
}

/**
 * Parse TUSS JSON from GitHub mirror (charlesfgarcia/tabelas-ans).
 */
function parseGithubJson(content: string): TussProcedure[] {
  try {
    const data = JSON.parse(content);
    const items = Array.isArray(data) ? data : data.procedures || data.data || [];
    return items
      .map((item: Record<string, unknown>) => {
        const codigo = String(item.cd_termo || item.codigo || item.code || '').replace(/\D/g, '');
        const descricao = String(item.termo || item.descricao || item.description || '').trim();
        if (/^\d{8}$/.test(codigo) && descricao.length > 0) {
          return {
            codigo,
            descricao,
            tipo: inferProcedureType(codigo),
          };
        }
        return null;
      })
      .filter((p: TussProcedure | null): p is TussProcedure => p !== null);
  } catch {
    return [];
  }
}

// ============================================================================
// Main sync
// ============================================================================

export async function syncTuss(): Promise<void> {
  const dataDir = getDataDir();
  const outputPath = path.join(dataDir, 'tuss-procedures.json');

  console.log('[TUSS] Starting TUSS full sync...');

  // Load existing data for merge
  const existing = loadExistingData<{ procedures: TussProcedure[] }>(outputPath);
  const existingProcedures = existing?.procedures || [];

  let newProcedures: TussProcedure[] = [];

  // Strategy 1: ANS ZIP (HTTPS + FTP)
  try {
    newProcedures = await tryAnsZip();
    console.log(`  [TUSS] ANS ZIP: parsed ${newProcedures.length} procedures`);
  } catch (err) {
    console.warn(`  [TUSS] ANS ZIP failed: ${err}`);

    // Strategy 2: GitHub fallback
    try {
      newProcedures = await tryGithubFallback();
      console.log(`  [TUSS] GitHub fallback: parsed ${newProcedures.length} procedures`);
    } catch (fallbackErr) {
      console.error(`  [TUSS] All sources failed: ${fallbackErr}`);
      if (existingProcedures.length > 0) {
        console.log('  [TUSS] Keeping existing data as-is');
        return;
      }
      throw new Error('TUSS sync failed: no data from any source and no existing data');
    }
  }

  // Merge with existing (dedup + sort)
  const merged = mergeTussProcedures(existingProcedures, newProcedures);

  console.log(`  [TUSS] Merged: ${merged.length} total procedures (existing: ${existingProcedures.length}, new: ${newProcedures.length})`);

  // Build output
  const output = {
    _meta: buildMeta(
      'Tabela TUSS - Terminologia Unificada da Saúde Suplementar',
      'ANS - Agência Nacional de Saúde Suplementar',
      merged.length,
      'Synced from ANS official data sources',
    ),
    procedures: merged,
    categorias: [
      { codigo: '1', nome: 'Consultas' },
      { codigo: '2', nome: 'Procedimentos Clínicos' },
      { codigo: '3', nome: 'Procedimentos Cirúrgicos' },
      { codigo: '4', nome: 'Procedimentos Diagnósticos' },
      { codigo: '5', nome: 'Materiais e Medicamentos' },
      { codigo: '6', nome: 'Honorários' },
      { codigo: '7', nome: 'Taxas e Aluguéis' },
      { codigo: '8', nome: 'Diárias' },
    ],
  };

  writeDataFile(outputPath, output);
  console.log(`[TUSS] Done — wrote ${merged.length} procedures to ${outputPath}`);
}

// ============================================================================
// CLI entry point
// ============================================================================

if (require.main === module) {
  syncTuss().catch(err => {
    console.error('[TUSS] Fatal error:', err);
    process.exit(1);
  });
}
