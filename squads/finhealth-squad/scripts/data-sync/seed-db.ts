/**
 * DB Seed Script
 * FinHealth Squad — Data Sync Pipeline
 *
 * Reads committed JSON data files and upserts to Supabase tables in batches.
 * Requires SUPABASE_URL + SUPABASE_SERVICE_KEY env vars.
 *
 * Tables:
 *   - tuss_procedures (code, description, procedure_type, unit_price, active)
 *   - sus_procedures (codigo_sigtap, nome, competencia, valor_ambulatorial,
 *     valor_hospitalar, complexidade, grupo, subgrupo, ...)
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import * as path from 'path';
import { loadExistingData, getDataDir } from './shared';
import type { TussProcedure, SigtapProcedure } from '../../src/scrapers/types';
import 'dotenv/config';

// ============================================================================
// Constants
// ============================================================================

const BATCH_SIZE = 500;

// ============================================================================
// Types
// ============================================================================

interface TussRow {
  code: string;
  description: string;
  procedure_type: string;
  unit_price: number;
  active: boolean;
}

interface SusRow {
  codigo_sigtap: string;
  nome: string;
  competencia: string;
  valor_ambulatorial: number;
  valor_hospitalar: number;
  complexidade: string;
  grupo: string;
  subgrupo: string;
  forma_organizacao: string;
}

// ============================================================================
// Field mapping
// ============================================================================

export function mapTussProcedure(proc: TussProcedure): TussRow {
  return {
    code: proc.codigo,
    description: proc.descricao,
    procedure_type: proc.tipo,
    unit_price: proc.valor_referencia ?? 0,
    active: true,
  };
}

export function mapSigtapProcedure(proc: SigtapProcedure, competencia: string): SusRow {
  return {
    codigo_sigtap: proc.codigo,
    nome: proc.descricao,
    competencia,
    valor_ambulatorial: proc.valor_sp,
    valor_hospitalar: proc.valor_sh,
    complexidade: proc.complexidade,
    grupo: proc.grupo,
    subgrupo: proc.subgrupo,
    forma_organizacao: proc.forma_organizacao,
  };
}

// ============================================================================
// Batch upsert
// ============================================================================

export async function upsertInBatches<T extends object>(
  supabase: SupabaseClient,
  table: string,
  rows: T[],
  conflictColumn: string,
): Promise<{ inserted: number; errors: string[] }> {
  let inserted = 0;
  const errors: string[] = [];

  for (let i = 0; i < rows.length; i += BATCH_SIZE) {
    const batch = rows.slice(i, i + BATCH_SIZE);
    const batchNum = Math.floor(i / BATCH_SIZE) + 1;
    const totalBatches = Math.ceil(rows.length / BATCH_SIZE);

    const { error } = await supabase
      .from(table)
      .upsert(batch, { onConflict: conflictColumn });

    if (error) {
      errors.push(`Batch ${batchNum}/${totalBatches}: ${error.message}`);
    } else {
      inserted += batch.length;
      console.log(`  [SEED] ${table}: batch ${batchNum}/${totalBatches} (${batch.length} rows)`);
    }
  }

  return { inserted, errors };
}

// ============================================================================
// Main seed
// ============================================================================

export async function seedDb(supabaseUrl?: string, supabaseKey?: string): Promise<void> {
  const url = supabaseUrl || process.env.SUPABASE_URL;
  const key = supabaseKey || process.env.SUPABASE_SERVICE_KEY;

  if (!url || !key) {
    throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_KEY environment variables');
  }

  const supabase = createClient(url, key);
  const dataDir = getDataDir();

  console.log('[SEED] Starting database seed...');

  // ---- TUSS procedures ----
  const tussPath = path.join(dataDir, 'tuss-procedures.json');
  const tussData = loadExistingData<{ procedures: TussProcedure[] }>(tussPath);

  if (tussData?.procedures?.length) {
    console.log(`  [SEED] TUSS: ${tussData.procedures.length} procedures to upsert`);
    const tussRows = tussData.procedures.map(mapTussProcedure);
    const tussResult = await upsertInBatches(supabase, 'tuss_procedures', tussRows, 'code');
    console.log(`  [SEED] TUSS: ${tussResult.inserted} inserted, ${tussResult.errors.length} errors`);
    if (tussResult.errors.length > 0) {
      console.warn('  [SEED] TUSS errors:', tussResult.errors);
    }
  } else {
    console.warn('  [SEED] TUSS: no data to seed');
  }

  // ---- SIGTAP / SUS procedures ----
  const sigtapPath = path.join(dataDir, 'sigtap-procedures.json');
  const sigtapData = loadExistingData<{
    _meta: { version?: string };
    procedures: SigtapProcedure[];
  }>(sigtapPath);

  if (sigtapData?.procedures?.length) {
    const competencia = sigtapData._meta?.version?.replace(/\./g, '') || new Date().toISOString().slice(0, 7).replace('-', '');
    console.log(`  [SEED] SIGTAP: ${sigtapData.procedures.length} procedures to upsert (competência: ${competencia})`);
    const susRows = sigtapData.procedures.map(p => mapSigtapProcedure(p, competencia));
    const susResult = await upsertInBatches(supabase, 'sus_procedures', susRows, 'codigo_sigtap');
    console.log(`  [SEED] SIGTAP: ${susResult.inserted} inserted, ${susResult.errors.length} errors`);
    if (susResult.errors.length > 0) {
      console.warn('  [SEED] SIGTAP errors:', susResult.errors);
    }
  } else {
    console.warn('  [SEED] SIGTAP: no data to seed');
  }

  console.log('[SEED] Done.');
}

// ============================================================================
// CLI entry point
// ============================================================================

if (require.main === module) {
  seedDb().catch(err => {
    console.error('[SEED] Fatal error:', err);
    process.exit(1);
  });
}
