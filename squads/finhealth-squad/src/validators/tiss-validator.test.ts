/**
 * Tests: TISS Validator
 * FinHealth Squad
 */

import { describe, it, expect } from 'vitest';
import {
  validateTissGuia,
  validateStructure,
  validateCodes,
  validateBusinessRules,
  validateFinancial,
  calculateConfidenceScore,
  type TussEntry,
  type CbhpmData,
  type ValidationError,
} from './tiss-validator';
import type { TissGuia } from '../parsers/tiss-xml-parser';

// ============================================================================
// Fixtures
// ============================================================================

const SAMPLE_TUSS_TABLE: TussEntry[] = [
  { codigo: '10101012', descricao: 'Consulta em consultorio', tipo: 'consulta', porte: '1C', valor_referencia: 150.00 },
  { codigo: '40301010', descricao: 'Hemograma completo', tipo: 'exame', porte: '2A', valor_referencia: 25.00 },
  { codigo: '40302040', descricao: 'Glicose', tipo: 'exame', porte: '2A', valor_referencia: 15.00 },
  { codigo: '40201040', descricao: 'Ecocardiograma', tipo: 'exame', porte: '7B', valor_referencia: 450.00, requer_autorizacao: true },
  { codigo: '30101012', descricao: 'Cirurgia simples', tipo: 'cirurgia', porte: '5A', valor_referencia: 5000.00 },
];

const SAMPLE_CBHPM: CbhpmData = {
  uch_valor: 0.55,
  portes: {
    '1C': { uch: 60, valor: 33.00, co: 0, filme: 0 },
    '2A': { uch: 75, valor: 41.25, co: 0, filme: 0 },
    '5A': { uch: 600, valor: 330.00, co: 150, filme: 0 },
    '7B': { uch: 1800, valor: 990.00, co: 540, filme: 50 },
  },
};

function makeValidGuia(overrides?: Partial<TissGuia>): TissGuia {
  return {
    tipo: 'sp-sadt',
    numeroGuiaPrestador: 'G-2024-001',
    beneficiario: { numeroCarteira: '98765432100', nome: 'João da Silva' },
    prestador: { codigoCnes: 'CNES001', nome: 'Hospital ABC' },
    procedimentos: [
      {
        sequencial: 1,
        codigoTabela: '22',
        codigoTuss: '40301010',
        descricao: 'Hemograma completo',
        quantidade: 1,
        valorUnitario: 25.00,
        valorTotal: 25.00,
        dataExecucao: '2024-01-15',
      },
    ],
    valorTotal: 25.00,
    ...overrides,
  };
}

// ============================================================================
// Tests: Orchestrator
// ============================================================================

describe('validateTissGuia — orchestration', () => {
  it('should return valid for fully correct guide', () => {
    const result = validateTissGuia(makeValidGuia(), SAMPLE_TUSS_TABLE);
    expect(result.valida).toBe(true);
    expect(result.scoreConfianca).toBe(100);
    expect(result.erros.filter(e => e.tipo === 'critico').length).toBe(0);
  });

  it('should return invalid when critical errors exist', () => {
    const guia = makeValidGuia({ numeroGuiaPrestador: '' });
    const result = validateTissGuia(guia, SAMPLE_TUSS_TABLE);
    expect(result.valida).toBe(false);
  });

  it('should calculate confidence score', () => {
    const guia = makeValidGuia({
      procedimentos: [
        { sequencial: 1, codigoTabela: '22', codigoTuss: '99999999', descricao: 'Desconhecido', quantidade: 1, valorUnitario: 100, valorTotal: 100 },
      ],
    });
    const result = validateTissGuia(guia, SAMPLE_TUSS_TABLE);
    expect(result.scoreConfianca).toBeLessThan(100);
  });

  it('should measure processing time', () => {
    const result = validateTissGuia(makeValidGuia(), SAMPLE_TUSS_TABLE);
    expect(result.tempoProcessamentoMs).toBeGreaterThanOrEqual(0);
  });
});

// ============================================================================
// Tests: Structure validation
// ============================================================================

describe('validateStructure', () => {
  it('should error for missing numeroGuiaPrestador', () => {
    const guia = makeValidGuia({ numeroGuiaPrestador: '' });
    const erros = validateStructure(guia);
    expect(erros.some(e => e.campo === 'numeroGuiaPrestador' && e.tipo === 'critico')).toBe(true);
  });

  it('should error for missing beneficiario.numeroCarteira', () => {
    const guia = makeValidGuia({ beneficiario: { numeroCarteira: '', nome: 'João' } });
    const erros = validateStructure(guia);
    expect(erros.some(e => e.campo === 'beneficiario.numeroCarteira')).toBe(true);
  });

  it('should error for missing prestador.codigoCnes', () => {
    const guia = makeValidGuia({ prestador: { codigoCnes: '', nome: 'Hospital' } });
    const erros = validateStructure(guia);
    expect(erros.some(e => e.campo === 'prestador.codigoCnes')).toBe(true);
  });

  it('should error for empty procedimentos array', () => {
    const guia = makeValidGuia({ procedimentos: [] });
    const erros = validateStructure(guia);
    expect(erros.some(e => e.campo === 'procedimentos' && e.codigo === 'E001')).toBe(true);
  });

  it('should error for zero quantity', () => {
    const guia = makeValidGuia({
      procedimentos: [
        { sequencial: 1, codigoTabela: '22', codigoTuss: '40301010', descricao: 'Hemograma', quantidade: 0, valorUnitario: 25, valorTotal: 0 },
      ],
    });
    const erros = validateStructure(guia);
    expect(erros.some(e => e.codigo === 'E012')).toBe(true);
  });

  it('should error for negative valorUnitario', () => {
    const guia = makeValidGuia({
      procedimentos: [
        { sequencial: 1, codigoTabela: '22', codigoTuss: '40301010', descricao: 'Hemograma', quantidade: 1, valorUnitario: -10, valorTotal: -10 },
      ],
    });
    const erros = validateStructure(guia);
    expect(erros.some(e => e.codigo === 'E013')).toBe(true);
  });

  it('should error for internacao missing dataInternacao', () => {
    const guia = makeValidGuia({ tipo: 'internacao', internacao: {} });
    const erros = validateStructure(guia);
    expect(erros.some(e => e.campo === 'internacao.dataInternacao' && e.tipo === 'critico')).toBe(true);
  });

  it('should warn for internacao missing dataAlta', () => {
    const guia = makeValidGuia({ tipo: 'internacao', internacao: { dataInternacao: '2024-01-10' } });
    const erros = validateStructure(guia);
    expect(erros.some(e => e.campo === 'internacao.dataAlta' && e.tipo === 'alerta')).toBe(true);
  });

  it('should pass for valid SP/SADT guide', () => {
    const erros = validateStructure(makeValidGuia());
    expect(erros.length).toBe(0);
  });
});

// ============================================================================
// Tests: Code validation
// ============================================================================

describe('validateCodes', () => {
  it('should error for unknown TUSS code', () => {
    const guia = makeValidGuia({
      procedimentos: [
        { sequencial: 1, codigoTabela: '22', codigoTuss: '99999999', descricao: 'Desconhecido', quantidade: 1, valorUnitario: 100, valorTotal: 100 },
      ],
    });
    const erros = validateCodes(guia, SAMPLE_TUSS_TABLE);
    expect(erros.some(e => e.codigo === 'E002' && e.mensagem.includes('99999999'))).toBe(true);
  });

  it('should not error for valid TUSS code', () => {
    const erros = validateCodes(makeValidGuia(), SAMPLE_TUSS_TABLE);
    expect(erros.filter(e => e.codigo === 'E002').length).toBe(0);
  });

  it('should error for non-8-digit code', () => {
    const guia = makeValidGuia({
      procedimentos: [
        { sequencial: 1, codigoTabela: '22', codigoTuss: '12345', descricao: 'Short code', quantidade: 1, valorUnitario: 10, valorTotal: 10 },
      ],
    });
    const erros = validateCodes(guia, SAMPLE_TUSS_TABLE);
    expect(erros.some(e => e.codigo === 'E002' && e.mensagem.includes('formato válido'))).toBe(true);
  });

  it('should warn for invalid CID format', () => {
    const guia = makeValidGuia({
      procedimentos: [
        { sequencial: 1, codigoTabela: '22', codigoTuss: '40301010', descricao: 'Hemograma', quantidade: 1, valorUnitario: 25, valorTotal: 25, cidPrincipal: 'INVALID' },
      ],
    });
    const erros = validateCodes(guia, SAMPLE_TUSS_TABLE);
    expect(erros.some(e => e.codigo === 'E003')).toBe(true);
  });

  it('should not warn for valid CID format', () => {
    const guia = makeValidGuia({
      procedimentos: [
        { sequencial: 1, codigoTabela: '22', codigoTuss: '40301010', descricao: 'Hemograma', quantidade: 1, valorUnitario: 25, valorTotal: 25, cidPrincipal: 'J18.0' },
      ],
    });
    const erros = validateCodes(guia, SAMPLE_TUSS_TABLE);
    expect(erros.filter(e => e.codigo === 'E003').length).toBe(0);
  });
});

// ============================================================================
// Tests: Business rules
// ============================================================================

describe('validateBusinessRules', () => {
  it('should detect duplicate procedures on same date', () => {
    const guia = makeValidGuia({
      procedimentos: [
        { sequencial: 1, codigoTabela: '22', codigoTuss: '40301010', descricao: 'Hemograma', quantidade: 1, valorUnitario: 25, valorTotal: 25, dataExecucao: '2024-01-15' },
        { sequencial: 2, codigoTabela: '22', codigoTuss: '40301010', descricao: 'Hemograma', quantidade: 1, valorUnitario: 25, valorTotal: 25, dataExecucao: '2024-01-15' },
      ],
    });
    const erros = validateBusinessRules(guia, SAMPLE_TUSS_TABLE);
    expect(erros.some(e => e.codigo === 'E006')).toBe(true);
  });

  it('should not flag duplicates on different dates', () => {
    const guia = makeValidGuia({
      procedimentos: [
        { sequencial: 1, codigoTabela: '22', codigoTuss: '40301010', descricao: 'Hemograma', quantidade: 1, valorUnitario: 25, valorTotal: 25, dataExecucao: '2024-01-15' },
        { sequencial: 2, codigoTabela: '22', codigoTuss: '40301010', descricao: 'Hemograma', quantidade: 1, valorUnitario: 25, valorTotal: 25, dataExecucao: '2024-01-16' },
      ],
    });
    const erros = validateBusinessRules(guia, SAMPLE_TUSS_TABLE);
    expect(erros.filter(e => e.codigo === 'E006').length).toBe(0);
  });

  it('should detect quantity exceeding limit', () => {
    const guia = makeValidGuia({
      procedimentos: [
        { sequencial: 1, codigoTabela: '22', codigoTuss: '40301010', descricao: 'Hemograma', quantidade: 5, valorUnitario: 25, valorTotal: 125 },
      ],
    });
    const erros = validateBusinessRules(guia, SAMPLE_TUSS_TABLE, {
      limiteQuantidade: { '40301010': 3 },
    });
    expect(erros.some(e => e.codigo === 'E007')).toBe(true);
  });

  it('should flag procedure requiring authorization', () => {
    const guia = makeValidGuia({
      procedimentos: [
        { sequencial: 1, codigoTabela: '22', codigoTuss: '40201040', descricao: 'Ecocardiograma', quantidade: 1, valorUnitario: 450, valorTotal: 450 },
      ],
    });
    const erros = validateBusinessRules(guia, SAMPLE_TUSS_TABLE);
    expect(erros.some(e => e.codigo === 'E008')).toBe(true);
  });

  it('should flag future execution date', () => {
    const futureDate = new Date();
    futureDate.setFullYear(futureDate.getFullYear() + 1);
    const futureDateStr = futureDate.toISOString().split('T')[0];

    const guia = makeValidGuia({
      procedimentos: [
        { sequencial: 1, codigoTabela: '22', codigoTuss: '40301010', descricao: 'Hemograma', quantidade: 1, valorUnitario: 25, valorTotal: 25, dataExecucao: futureDateStr },
      ],
    });
    const erros = validateBusinessRules(guia, SAMPLE_TUSS_TABLE);
    expect(erros.some(e => e.codigo === 'E011')).toBe(true);
  });
});

// ============================================================================
// Tests: Financial validation
// ============================================================================

describe('validateFinancial', () => {
  it('should recalculate valorTotal correctly', () => {
    const guia = makeValidGuia({
      procedimentos: [
        { sequencial: 1, codigoTabela: '22', codigoTuss: '40301010', descricao: 'Hemograma', quantidade: 2, valorUnitario: 25, valorTotal: 50 },
        { sequencial: 2, codigoTabela: '22', codigoTuss: '40302040', descricao: 'Glicose', quantidade: 1, valorUnitario: 15, valorTotal: 15 },
      ],
      valorTotal: 65,
    });
    const { valorCalculado } = validateFinancial(guia, SAMPLE_TUSS_TABLE);
    // Reference: hemograma 25*2 + glicose 15*1 = 65
    expect(valorCalculado).toBe(65);
  });

  it('should flag value above reference with tolerance', () => {
    const guia = makeValidGuia({
      procedimentos: [
        { sequencial: 1, codigoTabela: '22', codigoTuss: '40301010', descricao: 'Hemograma', quantidade: 1, valorUnitario: 50.00, valorTotal: 50.00 },
      ],
    });
    const { errosFinanceiros } = validateFinancial(guia, SAMPLE_TUSS_TABLE, undefined, 0.05);
    // 50.00 > 25.00 * 1.05 = 26.25
    expect(errosFinanceiros.some(e => e.codigo === 'E005')).toBe(true);
  });

  it('should not flag value within tolerance', () => {
    const guia = makeValidGuia({
      procedimentos: [
        { sequencial: 1, codigoTabela: '22', codigoTuss: '40301010', descricao: 'Hemograma', quantidade: 1, valorUnitario: 26.00, valorTotal: 26.00 },
      ],
    });
    const { errosFinanceiros } = validateFinancial(guia, SAMPLE_TUSS_TABLE, undefined, 0.05);
    // 26.00 <= 25.00 * 1.05 = 26.25
    expect(errosFinanceiros.filter(e => e.codigo === 'E005').length).toBe(0);
  });

  it('should cross-validate against CBHPM when data provided', () => {
    const guia = makeValidGuia({
      procedimentos: [
        { sequencial: 1, codigoTabela: '22', codigoTuss: '40301010', descricao: 'Hemograma', quantidade: 1, valorUnitario: 100.00, valorTotal: 100.00 },
      ],
    });
    // With CBHPM: porte 2A = valor 41.25 + co 0 + filme 0 = 41.25
    // 100.00 > 41.25 * 1.05 = 43.31 → should flag
    const { errosFinanceiros } = validateFinancial(guia, SAMPLE_TUSS_TABLE, SAMPLE_CBHPM, 0.05);
    expect(errosFinanceiros.some(e => e.codigo === 'E005')).toBe(true);
  });
});

// ============================================================================
// Tests: Confidence score
// ============================================================================

describe('calculateConfidenceScore', () => {
  it('should return 100 for no errors', () => {
    expect(calculateConfidenceScore([])).toBe(100);
  });

  it('should decrement correctly per error type', () => {
    const erros: ValidationError[] = [
      { campo: 'a', tipo: 'critico', codigo: 'E001', mensagem: 'Erro critico' },
      { campo: 'b', tipo: 'alerta', codigo: 'E005', mensagem: 'Alerta' },
      { campo: 'c', tipo: 'info', codigo: 'E003', mensagem: 'Info' },
    ];
    // 100 - 25 - 10 - 2 = 63
    expect(calculateConfidenceScore(erros)).toBe(63);
  });

  it('should clamp to 0 minimum', () => {
    const erros: ValidationError[] = Array(10).fill(null).map((_, i) => ({
      campo: `field${i}`,
      tipo: 'critico' as const,
      codigo: 'E001',
      mensagem: `Erro ${i}`,
    }));
    // 100 - (10 * 25) = -150 → clamped to 0
    expect(calculateConfidenceScore(erros)).toBe(0);
  });
});
