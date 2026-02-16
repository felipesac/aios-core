/**
 * Tests for SIGTAP Sync Script
 * FinHealth Squad
 */

import { describe, it, expect } from 'vitest';
import { parseSigtapCsv, parseSigtapTxt } from './sync-sigtap';

// ============================================================================
// Fixtures
// ============================================================================

const TXT_FIXED_WIDTH = `0301010064 Consulta médica em atenção básica                         0.00    10.00   10.00
0301010072 Consulta médica em atenção especializada                   0.00    10.00   10.00
0202010503 Hemograma completo                                         1.53     2.73    4.26
0407010033 Colecistectomia videolaparoscopica                       313.38   327.91  641.29
0802010016 Diária de UTI adulto tipo II                             428.91    82.10  511.01
`;

const CSV_SEMICOLON = `CODIGO;DESCRICAO;VALOR_SH;VALOR_SP;VALOR_TOTAL
0301010064;Consulta médica em atenção básica;0,00;10,00;10,00
0301010072;Consulta médica em atenção especializada;0,00;10,00;10,00
0202010503;Hemograma completo;1,53;2,73;4,26
0407010033;Colecistectomia videolaparoscopica;313,38;327,91;641,29
0802010016;Diária de UTI adulto tipo II;428,91;82,10;511,01
`;

const CSV_WITH_INVALID = `CODIGO;DESCRICAO;VALOR_SH;VALOR_SP
0301010064;Consulta médica em atenção básica;0,00;10,00
INVALID;Row inválido;0;0
12345;Code muito curto;0;0
0202010503;Hemograma completo;1,53;2,73
;Empty code;0;0
0407010033;Colecistectomia videolaparoscopica;313,38;327,91
`;

// ============================================================================
// Tests
// ============================================================================

describe('parseSigtapTxt', () => {
  it('parses fixed-width DATASUS format', () => {
    const result = parseSigtapTxt(TXT_FIXED_WIDTH);
    expect(result.length).toBe(5);
    expect(result[0].codigo).toBe('0301010064');
    expect(result[0].descricao).toContain('Consulta');
  });

  it('extracts correct value fields', () => {
    const result = parseSigtapTxt(TXT_FIXED_WIDTH);
    const hemograma = result.find(p => p.codigo === '0202010503');
    expect(hemograma).toBeDefined();
    expect(hemograma!.valor_sh).toBeCloseTo(1.53);
    expect(hemograma!.valor_sp).toBeCloseTo(2.73);
    expect(hemograma!.valor_total).toBeCloseTo(4.26);
  });

  it('infers complexidade from code prefix', () => {
    const result = parseSigtapTxt(TXT_FIXED_WIDTH);
    const consulta = result.find(p => p.codigo === '0301010064');
    const cirurgia = result.find(p => p.codigo === '0407010033');
    const diaria = result.find(p => p.codigo === '0802010016');

    expect(consulta?.complexidade).toBe('MC');
    expect(cirurgia?.complexidade).toBe('AC');
    expect(diaria?.complexidade).toBe('MC');
  });

  it('extracts grupo/subgrupo/forma_organizacao from code', () => {
    const result = parseSigtapTxt(TXT_FIXED_WIDTH);
    const proc = result[0];
    expect(proc.grupo).toBe('03');
    expect(proc.subgrupo).toBe('01');
    expect(proc.forma_organizacao).toBe('01');
  });

  it('returns empty for empty input', () => {
    expect(parseSigtapTxt('')).toEqual([]);
  });
});

describe('parseSigtapCsv', () => {
  it('parses semicolon-separated CSV with header', () => {
    const result = parseSigtapCsv(CSV_SEMICOLON);
    expect(result.length).toBe(5);
    expect(result[0].codigo).toBe('0301010064');
  });

  it('parses Brazilian decimal format (comma)', () => {
    const result = parseSigtapCsv(CSV_SEMICOLON);
    const hemograma = result.find(p => p.codigo === '0202010503');
    expect(hemograma!.valor_sh).toBeCloseTo(1.53);
    expect(hemograma!.valor_sp).toBeCloseTo(2.73);
    expect(hemograma!.valor_total).toBeCloseTo(4.26);
  });

  it('skips invalid codes', () => {
    const result = parseSigtapCsv(CSV_WITH_INVALID);
    expect(result.length).toBe(3);
    expect(result.every(p => /^\d{10}$/.test(p.codigo))).toBe(true);
  });

  it('validates 10-digit code format', () => {
    const result = parseSigtapCsv(CSV_SEMICOLON);
    for (const proc of result) {
      expect(proc.codigo).toMatch(/^\d{10}$/);
      expect(proc.descricao.length).toBeGreaterThan(0);
    }
  });

  it('returns empty for empty input', () => {
    expect(parseSigtapCsv('')).toEqual([]);
  });
});
