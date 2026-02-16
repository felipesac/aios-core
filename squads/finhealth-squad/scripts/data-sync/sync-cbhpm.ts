/**
 * CBHPM Sync / Validation
 * FinHealth Squad — Data Sync Pipeline
 *
 * Validates the existing 42-porte CBHPM table integrity and updates _meta.
 * Full CBHPM procedure data requires AMB (Associação Médica Brasileira)
 * institutional subscription, so this script only validates the porte table.
 */

import * as path from 'path';
import { loadExistingData, writeDataFile, getDataDir } from './shared';

// ============================================================================
// Expected portes (1A through 14C = 42 entries)
// ============================================================================

const EXPECTED_PORTES = [
  '1A', '1B', '1C',
  '2A', '2B', '2C',
  '3A', '3B', '3C',
  '4A', '4B', '4C',
  '5A', '5B', '5C',
  '6A', '6B', '6C',
  '7A', '7B', '7C',
  '8A', '8B', '8C',
  '9A', '9B', '9C',
  '10A', '10B', '10C',
  '11A', '11B', '11C',
  '12A', '12B', '12C',
  '13A', '13B', '13C',
  '14A', '14B', '14C',
];

// ============================================================================
// Validation
// ============================================================================

interface CbhpmPorte {
  uch: number;
  valor: number;
  co: number;
  filme: number;
}

interface CbhpmFile {
  _meta: Record<string, unknown>;
  uch_valor: number;
  portes: Record<string, CbhpmPorte>;
  componentes: Record<string, string>;
  auxiliares: Record<string, number>;
}

export function validateCbhpmPortes(data: CbhpmFile): { valid: boolean; issues: string[] } {
  const issues: string[] = [];

  // Check all 42 portes exist
  for (const porte of EXPECTED_PORTES) {
    if (!data.portes[porte]) {
      issues.push(`Missing porte: ${porte}`);
    }
  }

  // Check for unexpected portes
  for (const key of Object.keys(data.portes)) {
    if (!EXPECTED_PORTES.includes(key)) {
      issues.push(`Unexpected porte: ${key}`);
    }
  }

  // Validate UCH values are monotonically increasing
  let prevUch = 0;
  for (const porte of EXPECTED_PORTES) {
    const entry = data.portes[porte];
    if (entry) {
      if (entry.uch < prevUch) {
        issues.push(`UCH not monotonically increasing at ${porte}: ${entry.uch} < ${prevUch}`);
      }
      prevUch = entry.uch;

      // Validate valor = uch * uch_valor
      const expectedValor = entry.uch * data.uch_valor;
      if (Math.abs(entry.valor - expectedValor) > 0.01) {
        issues.push(`Porte ${porte}: valor ${entry.valor} != uch(${entry.uch}) * uch_valor(${data.uch_valor}) = ${expectedValor}`);
      }
    }
  }

  // Validate uch_valor
  if (!data.uch_valor || data.uch_valor <= 0) {
    issues.push('Invalid uch_valor');
  }

  return { valid: issues.length === 0, issues };
}

// ============================================================================
// Main sync
// ============================================================================

export async function syncCbhpm(): Promise<void> {
  const dataDir = getDataDir();
  const filePath = path.join(dataDir, 'cbhpm-values.json');

  console.log('[CBHPM] Starting CBHPM validation & meta update...');

  const data = loadExistingData<CbhpmFile>(filePath);
  if (!data) {
    throw new Error('cbhpm-values.json not found');
  }

  // Validate porte table integrity
  const validation = validateCbhpmPortes(data);
  if (!validation.valid) {
    console.warn('[CBHPM] Validation issues:');
    for (const issue of validation.issues) {
      console.warn(`  - ${issue}`);
    }
  } else {
    console.log(`  [CBHPM] All ${EXPECTED_PORTES.length} portes validated successfully`);
  }

  // Update _meta
  data._meta = {
    description: 'Tabela CBHPM - Classificação Brasileira Hierarquizada de Procedimentos Médicos',
    source: 'AMB - Associação Médica Brasileira',
    version: '5a edição',
    last_update: new Date().toISOString(),
    porte_count: Object.keys(data.portes).length,
    note: 'Tabela de portes completa (1A-14C). Procedimentos individuais requerem assinatura institucional AMB.',
  };

  writeDataFile(filePath, data);
  console.log(`[CBHPM] Done — validated ${Object.keys(data.portes).length} portes, updated _meta`);
}

// ============================================================================
// CLI entry point
// ============================================================================

if (require.main === module) {
  syncCbhpm().catch(err => {
    console.error('[CBHPM] Fatal error:', err);
    process.exit(1);
  });
}
