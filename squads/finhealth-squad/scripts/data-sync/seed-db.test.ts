/**
 * Tests for DB Seed Script
 * FinHealth Squad
 */

import { describe, it, expect, vi } from 'vitest';
import { mapTussProcedure, mapSigtapProcedure, upsertInBatches } from './seed-db';
import type { TussProcedure, SigtapProcedure } from '../../src/scrapers/types';

// ============================================================================
// mapTussProcedure
// ============================================================================

describe('mapTussProcedure', () => {
  it('maps TussProcedure to DB row', () => {
    const proc: TussProcedure = {
      codigo: '10101012',
      descricao: 'Consulta em consultório',
      tipo: 'consulta',
      porte: '1C',
      valor_referencia: 150,
    };

    const row = mapTussProcedure(proc);
    expect(row).toEqual({
      code: '10101012',
      description: 'Consulta em consultório',
      procedure_type: 'consulta',
      unit_price: 150,
      active: true,
    });
  });

  it('defaults unit_price to 0 when missing', () => {
    const proc: TussProcedure = {
      codigo: '40501020',
      descricao: 'Hemograma completo',
      tipo: 'laboratorio',
    };

    const row = mapTussProcedure(proc);
    expect(row.unit_price).toBe(0);
  });
});

// ============================================================================
// mapSigtapProcedure
// ============================================================================

describe('mapSigtapProcedure', () => {
  it('maps SigtapProcedure to DB row', () => {
    const proc: SigtapProcedure = {
      codigo: '0301010064',
      descricao: 'Consulta médica em atenção básica',
      grupo: '03',
      subgrupo: '01',
      forma_organizacao: '01',
      valor_sh: 0,
      valor_sp: 10,
      valor_total: 10,
      complexidade: 'AB',
    };

    const row = mapSigtapProcedure(proc, '202601');
    expect(row).toEqual({
      codigo_sigtap: '0301010064',
      nome: 'Consulta médica em atenção básica',
      competencia: '202601',
      valor_ambulatorial: 10,
      valor_hospitalar: 0,
      complexidade: 'AB',
      grupo: '03',
      subgrupo: '01',
      forma_organizacao: '01',
    });
  });
});

// ============================================================================
// upsertInBatches
// ============================================================================

describe('upsertInBatches', () => {
  it('calls upsert in correct batch sizes', async () => {
    const upsertMock = vi.fn().mockResolvedValue({ error: null });
    const fromMock = vi.fn().mockReturnValue({ upsert: upsertMock });
    const mockSupabase = { from: fromMock } as unknown as Parameters<typeof upsertInBatches>[0];

    // Generate 1200 rows to test batching with BATCH_SIZE=500
    const rows = Array.from({ length: 1200 }, (_, i) => ({
      code: String(i).padStart(8, '0'),
      description: `Procedure ${i}`,
    }));

    const result = await upsertInBatches(mockSupabase, 'tuss_procedures', rows, 'code');

    expect(fromMock).toHaveBeenCalledWith('tuss_procedures');
    expect(upsertMock).toHaveBeenCalledTimes(3); // 500 + 500 + 200
    expect(result.inserted).toBe(1200);
    expect(result.errors).toHaveLength(0);
  });

  it('reports errors per batch', async () => {
    let callCount = 0;
    const upsertMock = vi.fn().mockImplementation(() => {
      callCount++;
      if (callCount === 2) {
        return Promise.resolve({ error: { message: 'Batch 2 failed' } });
      }
      return Promise.resolve({ error: null });
    });
    const fromMock = vi.fn().mockReturnValue({ upsert: upsertMock });
    const mockSupabase = { from: fromMock } as unknown as Parameters<typeof upsertInBatches>[0];

    const rows = Array.from({ length: 1000 }, (_, i) => ({
      code: String(i).padStart(8, '0'),
    }));

    const result = await upsertInBatches(mockSupabase, 'tuss_procedures', rows, 'code');

    expect(result.inserted).toBe(500); // Only batch 1 succeeded
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0]).toContain('Batch 2 failed');
  });

  it('handles empty rows array', async () => {
    const fromMock = vi.fn();
    const mockSupabase = { from: fromMock } as unknown as Parameters<typeof upsertInBatches>[0];

    const result = await upsertInBatches(mockSupabase, 'tuss_procedures', [], 'code');

    expect(fromMock).not.toHaveBeenCalled();
    expect(result.inserted).toBe(0);
    expect(result.errors).toHaveLength(0);
  });
});
