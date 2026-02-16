/**
 * SIGTAP Full Sync
 * FinHealth Squad — Data Sync Pipeline
 *
 * Downloads the complete SIGTAP (Sistema de Gerenciamento da Tabela de
 * Procedimentos do SUS) from DATASUS official sources.
 *
 * Strategy:
 *   1. Try DATASUS SIGTAP download (latest competência ZIP)
 *   2. Fallback: community mirrors with SIGTAP CSV/TXT data
 */

import { parse as csvParse } from 'csv-parse/sync';
import * as path from 'path';
import { inferComplexidade, mergeSigtapProcedures } from '../../src/scrapers/datasus-scraper';
import type { SigtapProcedure } from '../../src/scrapers/types';
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
 * DATASUS publishes monthly competência ZIPs via FTP.
 * URL pattern: TabelaUnificada_YYYYMM_vVERSION.zip
 * Contains fixed-width TXT files with procedure data.
 */
const DATASUS_FTP_URLS = [
  'ftp://ftp2.datasus.gov.br/pub/sistemas/tup/downloads/TabelaUnificada_202601_v2601291504.zip',
  'ftp://ftp2.datasus.gov.br/pub/sistemas/tup/downloads/TabelaUnificada_202512_v2601221256.zip',
  'http://sigtap.datasus.gov.br/tabela-unificada/app/download.jsp',
];

const FALLBACK_URLS = [
  'https://raw.githubusercontent.com/rdsilva/SIGTAP/master/Resultado/tabela-sigtap-2025-10-22.csv',
  'https://raw.githubusercontent.com/rdsilva/SIGTAP/master/Resultado/procedimentos.csv',
];

// ============================================================================
// Parsing
// ============================================================================

/**
 * Parse SIGTAP fixed-width TXT format (DATASUS standard).
 * The TXT from DATASUS is typically fixed-width or tab-separated.
 */
export function parseSigtapTxt(content: string): SigtapProcedure[] {
  const procedures: SigtapProcedure[] = [];
  const lines = content.split('\n').map(l => l.trim()).filter(l => l.length > 0);

  for (const line of lines) {
    // Try to extract a 10-digit code from the beginning
    const match = line.match(/^(\d{10})\s+(.+)/);
    if (match) {
      const codigo = match[1];
      const rest = match[2].trim();

      // Try to parse value columns from the end
      const valueParts = rest.match(/^(.+?)\s+([\d,.]+)\s+([\d,.]+)\s*([\d,.]+)?$/);

      let descricao = rest;
      let valor_sh = 0;
      let valor_sp = 0;
      let valor_total = 0;

      if (valueParts) {
        descricao = valueParts[1].trim();
        valor_sh = parseFloat(valueParts[2].replace(',', '.')) || 0;
        valor_sp = parseFloat(valueParts[3].replace(',', '.')) || 0;
        valor_total = valueParts[4]
          ? parseFloat(valueParts[4].replace(',', '.')) || 0
          : valor_sh + valor_sp;
      }

      procedures.push({
        codigo,
        descricao,
        grupo: codigo.substring(0, 2),
        subgrupo: codigo.substring(2, 4),
        forma_organizacao: codigo.substring(4, 6),
        valor_sh,
        valor_sp,
        valor_total,
        complexidade: inferComplexidade(codigo),
      });
    }
  }

  return procedures;
}

/**
 * Parse SIGTAP CSV content into SigtapProcedure[].
 * Handles multiple CSV formats including the rdsilva/SIGTAP GitHub format
 * where values are 12-digit integers representing centavos.
 */
export function parseSigtapCsv(content: string): SigtapProcedure[] {
  const procedures: SigtapProcedure[] = [];
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
    records = content
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0)
      .map(line => line.split(separator).map(col => col.trim().replace(/^"|"$/g, '')));
  }

  if (records.length === 0) return procedures;

  // Detect header
  const header = records[0].map(h =>
    h.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, ''),
  );
  const hasHeader = header.some(h =>
    h.includes('codigo') || h.includes('procedimento') || h.includes('cd_') || h.includes('co_'),
  );
  const startRow = hasHeader ? 1 : 0;

  // Detect rdsilva format (co_procedimento, no_procedimento, vl_sh, vl_sp, tp_complexidade)
  const isRdsilvaFormat = header.includes('co_procedimento') || header.includes('no_procedimento');

  if (isRdsilvaFormat) {
    return parseRdsilvaCsv(records, header);
  }

  const codeCol = findColumnIndex(header, ['codigo', 'cd_procedimento', 'codigo_sigtap']);
  const descCol = findColumnIndex(header, ['descricao', 'procedimento', 'nome', 'ds_procedimento']);
  const shCol = findColumnIndex(header, ['valor_sh', 'sh', 'servico_hospitalar']);
  const spCol = findColumnIndex(header, ['valor_sp', 'sp', 'servico_profissional']);
  const totalCol = findColumnIndex(header, ['valor_total', 'total', 'valor']);

  for (let i = startRow; i < records.length; i++) {
    const row = records[i];
    if (!row || row.length < 2) continue;

    const rawCode = (codeCol >= 0 ? row[codeCol] : row[0])?.trim().replace(/\D/g, '') || '';
    const rawDesc = (descCol >= 0 ? row[descCol] : row[1])?.trim() || '';

    if (/^\d{10}$/.test(rawCode) && rawDesc.length > 0) {
      const valor_sh = parseFloat((shCol >= 0 ? row[shCol] : '0').replace(',', '.')) || 0;
      const valor_sp = parseFloat((spCol >= 0 ? row[spCol] : '0').replace(',', '.')) || 0;
      const rawTotal = totalCol >= 0 ? row[totalCol] : undefined;
      const valor_total = rawTotal
        ? parseFloat(rawTotal.replace(',', '.')) || 0
        : valor_sh + valor_sp;

      procedures.push({
        codigo: rawCode,
        descricao: rawDesc,
        grupo: rawCode.substring(0, 2),
        subgrupo: rawCode.substring(2, 4),
        forma_organizacao: rawCode.substring(4, 6),
        valor_sh,
        valor_sp,
        valor_total,
        complexidade: inferComplexidade(rawCode),
      });
    }
  }

  return procedures;
}

/**
 * Parse rdsilva/SIGTAP format where values are 12-digit integers (centavos × 100).
 * Columns: co_grupo;co_sub_grupo;no_grupo;no_sub_grupo;co_forma_organizacao;
 *          no_forma_organizacao;co_procedimento;no_procedimento;tp_complexidade;
 *          ...;vl_sh;vl_sa;vl_sp;...
 */
function parseRdsilvaCsv(records: string[][], header: string[]): SigtapProcedure[] {
  const procedures: SigtapProcedure[] = [];
  const seen = new Set<string>();

  const codeIdx = header.indexOf('co_procedimento');
  const descIdx = header.indexOf('no_procedimento');
  const grupoIdx = header.indexOf('co_grupo');
  const subgrupoIdx = header.indexOf('co_sub_grupo');
  const foIdx = header.indexOf('co_forma_organizacao');
  const complexIdx = header.indexOf('tp_complexidade');
  const shIdx = header.indexOf('vl_sh');
  const spIdx = header.indexOf('vl_sp');

  if (codeIdx < 0 || descIdx < 0) return procedures;

  const complexidadeMap: Record<string, 'AB' | 'MC' | 'AC'> = {
    '0': 'AB', '1': 'AB', '2': 'MC', '3': 'AC',
  };

  for (let i = 1; i < records.length; i++) {
    const row = records[i];
    if (!row || row.length <= Math.max(codeIdx, descIdx)) continue;

    const rawCode = row[codeIdx]?.trim().replace(/\D/g, '') || '';
    const rawDesc = row[descIdx]?.trim() || '';

    if (/^\d{10}$/.test(rawCode) && rawDesc.length > 0 && !seen.has(rawCode)) {
      seen.add(rawCode);

      // Values are 12-digit strings like "000000000270" = 2.70 BRL
      const valor_sh = parseDatasusValue(shIdx >= 0 ? row[shIdx] : '0');
      const valor_sp = parseDatasusValue(spIdx >= 0 ? row[spIdx] : '0');

      const rawComplexidade = complexIdx >= 0 ? row[complexIdx]?.trim() : '';
      const complexidade = complexidadeMap[rawComplexidade] || inferComplexidade(rawCode);

      procedures.push({
        codigo: rawCode,
        descricao: rawDesc,
        grupo: grupoIdx >= 0 ? row[grupoIdx]?.trim().padStart(2, '0') : rawCode.substring(0, 2),
        subgrupo: subgrupoIdx >= 0 ? row[subgrupoIdx]?.trim().padStart(2, '0') : rawCode.substring(2, 4),
        forma_organizacao: foIdx >= 0 ? row[foIdx]?.trim().padStart(2, '0') : rawCode.substring(4, 6),
        valor_sh,
        valor_sp,
        valor_total: valor_sh + valor_sp,
        complexidade,
      });
    }
  }

  return procedures;
}

/**
 * Parse DATASUS 12-digit value string (centavos × 100) to BRL.
 * "000000000270" → 2.70
 */
function parseDatasusValue(raw: string | undefined): number {
  if (!raw) return 0;
  const cleaned = raw.trim().replace(/\D/g, '');
  if (cleaned.length === 0) return 0;
  return parseInt(cleaned, 10) / 100;
}

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

async function tryDatasusDownload(): Promise<SigtapProcedure[]> {
  for (const url of DATASUS_FTP_URLS) {
    try {
      console.log('  [SIGTAP] Trying DATASUS:', url);
      const buffer = await downloadFile(url, 120_000);

      // DATASUS may return a ZIP or direct TXT/CSV
      const isZip = buffer[0] === 0x50 && buffer[1] === 0x4b;

      if (isZip) {
        const files = extractZip(buffer);
        console.log(`  [SIGTAP] ZIP contains ${files.length} files`);

        // DATASUS ZIPs have many TXT files. Look for the main procedures file.
        // Common names: tb_procedimento.txt, procedimento.txt, etc.
        const procedureFile = files.find(f =>
          /procedimento/i.test(f.name) && /\.txt$/i.test(f.name),
        ) || files.find(f =>
          /\.(csv|txt|tsv)$/i.test(f.name) && !f.name.startsWith('__MACOSX'),
        );

        if (procedureFile) {
          const content = procedureFile.buffer.toString('latin1');
          console.log(`  [SIGTAP] Parsing ${procedureFile.name} (${content.length} bytes)`);
          const txtResult = parseSigtapTxt(content);
          if (txtResult.length > 0) return txtResult;
          const csvResult = parseSigtapCsv(content);
          if (csvResult.length > 0) return csvResult;
        }

        // Try all TXT files in the ZIP
        let allProcedures: SigtapProcedure[] = [];
        for (const f of files) {
          if (f.name.startsWith('__MACOSX') || f.name.endsWith('/')) continue;
          if (!/\.txt$/i.test(f.name)) continue;
          const content = f.buffer.toString('latin1');
          const procs = parseSigtapTxt(content);
          if (procs.length > allProcedures.length) {
            allProcedures = procs;
          }
        }
        if (allProcedures.length > 0) return allProcedures;
      } else {
        // Direct text response
        const content = buffer.toString('utf-8');
        const txtResult = parseSigtapTxt(content);
        if (txtResult.length > 100) return txtResult;
        const csvResult = parseSigtapCsv(content);
        if (csvResult.length > 100) return csvResult;
      }

      console.warn(`  [SIGTAP] No usable data from ${url}`);
    } catch (err) {
      console.warn(`  [SIGTAP] Failed for ${url}: ${err}`);
    }
  }
  throw new Error('All DATASUS sources failed');
}

async function tryFallbackDownload(): Promise<SigtapProcedure[]> {
  for (const url of FALLBACK_URLS) {
    try {
      console.log('  [SIGTAP] Trying fallback:', url);
      const buffer = await downloadFile(url, 30_000);
      const content = buffer.toString('utf-8');
      const procedures = parseSigtapCsv(content);
      if (procedures.length > 0) return procedures;
    } catch (err) {
      console.warn(`  [SIGTAP] Fallback failed for ${url}: ${err}`);
    }
  }
  throw new Error('All SIGTAP fallback sources failed');
}

// ============================================================================
// Main sync
// ============================================================================

export async function syncSigtap(): Promise<void> {
  const dataDir = getDataDir();
  const outputPath = path.join(dataDir, 'sigtap-procedures.json');

  console.log('[SIGTAP] Starting SIGTAP full sync...');

  const existing = loadExistingData<{ procedures: SigtapProcedure[] }>(outputPath);
  const existingProcedures = existing?.procedures || [];

  let newProcedures: SigtapProcedure[] = [];

  // Strategy 1: DATASUS
  try {
    newProcedures = await tryDatasusDownload();
    console.log(`  [SIGTAP] DATASUS: parsed ${newProcedures.length} procedures`);
  } catch (err) {
    console.warn(`  [SIGTAP] DATASUS failed: ${err}`);

    // Strategy 2: Fallback
    try {
      newProcedures = await tryFallbackDownload();
      console.log(`  [SIGTAP] Fallback: parsed ${newProcedures.length} procedures`);
    } catch (fallbackErr) {
      console.error(`  [SIGTAP] All sources failed: ${fallbackErr}`);
      if (existingProcedures.length > 0) {
        console.log('  [SIGTAP] Keeping existing data as-is');
        return;
      }
      throw new Error('SIGTAP sync failed: no data from any source and no existing data');
    }
  }

  const merged = mergeSigtapProcedures(existingProcedures, newProcedures);

  console.log(`  [SIGTAP] Merged: ${merged.length} total procedures`);

  const output = {
    _meta: buildMeta(
      'Tabela SIGTAP - Sistema de Gerenciamento da Tabela de Procedimentos do SUS',
      'DATASUS - Ministério da Saúde',
      merged.length,
      'Synced from DATASUS official sources',
    ),
    procedures: merged,
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

  writeDataFile(outputPath, output);
  console.log(`[SIGTAP] Done — wrote ${merged.length} procedures to ${outputPath}`);
}

// ============================================================================
// CLI entry point
// ============================================================================

if (require.main === module) {
  syncSigtap().catch(err => {
    console.error('[SIGTAP] Fatal error:', err);
    process.exit(1);
  });
}
