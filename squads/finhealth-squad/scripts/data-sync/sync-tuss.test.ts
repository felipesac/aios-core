/**
 * Tests for TUSS Sync Script
 * FinHealth Squad
 */

import { describe, it, expect } from 'vitest';
import { parseTussCsv } from './sync-tuss';

// ============================================================================
// Fixtures
// ============================================================================

const CSV_SEMICOLON = `"CODIGO";"DESCRICAO";"PORTE"
"10101012";"Consulta em consultório (no horário normal ou preestabelecido)";"1C"
"10101039";"Consulta em domicílio";"2C"
"20101015";"Avaliação nutricional";"1A"
"40201040";"Ecocardiograma transtorácico";"7B"
"40501020";"Hemograma completo";"1A"
"30101034";"Colecistectomia videolaparoscópica";"10A"
"90001001";"Taxa de sala cirúrgica";"";
`;

const CSV_COMMA = `codigo,descricao,tipo
10101012,Consulta em consultório,consulta
10101039,Consulta em domicílio,consulta
40501020,Hemograma completo,laboratorio
`;

const CSV_NO_HEADER = `10101012;Consulta em consultório;1C
10101039;Consulta em domicílio;2C
40501020;Hemograma completo;1A
`;

const CSV_WITH_INVALID_ROWS = `CODIGO;DESCRICAO
10101012;Consulta em consultório
INVALID;Invalid row
1234;Too short code
10101039;Consulta em domicílio
;Empty code row
40501020;Hemograma completo
`;

const CSV_ANS_FORMAT = `cd_termo;termo;dt_inicio_vigencia;dt_fim_vigencia;dt_implantacao
10101012;Consulta em consultório (no horário normal ou preestabelecido);2016-01-01;;2016-01-01
10101039;Consulta em domicílio;2016-01-01;;2016-01-01
20101015;Avaliação nutricional (inclui fluxograma, plano alimentar, avaliação de exames);2016-01-01;;2016-01-01
40201040;Ecocardiograma com Doppler;2016-01-01;;2016-01-01
40501020;Hemograma completo;2016-01-01;;2016-01-01
`;

// ============================================================================
// Tests
// ============================================================================

describe('parseTussCsv', () => {
  it('parses semicolon-separated CSV with header', () => {
    const result = parseTussCsv(CSV_SEMICOLON);
    expect(result.length).toBe(7);
    expect(result[0].codigo).toBe('10101012');
    expect(result[0].descricao).toContain('Consulta em consultório');
    expect(result[0].porte).toBe('1C');
  });

  it('parses comma-separated CSV', () => {
    const result = parseTussCsv(CSV_COMMA);
    expect(result.length).toBe(3);
    expect(result[0].codigo).toBe('10101012');
  });

  it('parses CSV without header row', () => {
    const result = parseTussCsv(CSV_NO_HEADER);
    expect(result.length).toBe(3);
    expect(result[0].codigo).toBe('10101012');
  });

  it('skips rows with invalid codes', () => {
    const result = parseTussCsv(CSV_WITH_INVALID_ROWS);
    expect(result.length).toBe(3);
    expect(result.every(p => /^\d{8}$/.test(p.codigo))).toBe(true);
  });

  it('parses ANS-format CSV with cd_termo/termo columns', () => {
    const result = parseTussCsv(CSV_ANS_FORMAT);
    expect(result.length).toBe(5);
    expect(result[0].codigo).toBe('10101012');
    expect(result[0].descricao).toContain('Consulta em consultório');
  });

  it('infers procedure type from code prefix', () => {
    const result = parseTussCsv(CSV_SEMICOLON);
    const consulta = result.find(p => p.codigo === '10101012');
    const exame = result.find(p => p.codigo === '40201040');
    const cirurgia = result.find(p => p.codigo === '30101034');
    const outros = result.find(p => p.codigo === '90001001');

    expect(consulta?.tipo).toBe('consulta');
    expect(exame?.tipo).toBe('exame');
    expect(cirurgia?.tipo).toBe('cirurgia');
    expect(outros?.tipo).toBe('outros');
  });

  it('returns empty array for empty input', () => {
    expect(parseTussCsv('')).toEqual([]);
    expect(parseTussCsv('\n\n')).toEqual([]);
  });

  it('validates 8-digit code format', () => {
    const result = parseTussCsv(CSV_WITH_INVALID_ROWS);
    for (const proc of result) {
      expect(proc.codigo).toMatch(/^\d{8}$/);
      expect(proc.descricao.length).toBeGreaterThan(0);
    }
  });
});
