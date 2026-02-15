/**
 * Tests: Template Manager
 * FinHealth Squad
 */

import { describe, it, expect } from 'vitest';
import { TemplateManager, createTemplateManager } from './template-manager';
import type { AppealRenderInput, ReportRenderInput } from './types';

// ============================================================================
// Fixtures
// ============================================================================

const MOCK_DATE = new Date(2025, 2, 15, 10, 0, 0);

function createMockDeps() {
  return {
    dateProvider: { now: () => MOCK_DATE },
    idGenerator: { generate: (prefix: string) => `${prefix}-MOCK` },
  };
}

function makeAppealInput(): AppealRenderInput {
  return {
    tipo: 'administrativa',
    glosa: {
      codigoGlosa: 'GA001',
      descricaoGlosa: 'Guia sem autorizacao',
      valorGlosado: 1000,
      dataGlosa: new Date(2025, 1, 1),
      numeroGuia: 'G-001',
      itensGlosados: [],
    },
    guia: {
      tipo: 'SP/SADT',
      beneficiario: { nome: 'Joao', carteira: '123' },
      prestador: { nome: 'Hospital', cnes: 'C001' },
      dataAtendimento: new Date(2025, 0, 15),
    },
    operadora: { codigoAns: '111', nome: 'Operadora', prazoRecurso: 30, canalRecurso: 'Web' },
    evidencias: [],
    normas: [],
    argumentos: [{ ponto: 'Contestacao', fundamentacao: 'Indevida.' }],
    anexos: [],
    probabilidadeReversao: 0.7,
  };
}

function makeReportInput(): ReportRenderInput {
  return {
    nivel: 'gerencial',
    titulo: 'Relatorio Mensal',
    periodo: 'Janeiro 2025',
    metricasChave: {
      receitaBruta: 100000,
      receitaLiquida: 90000,
      despesasTotais: 50000,
      resultadoOperacional: 50000,
      margemOperacional: 50,
      faturamentoEmitido: 110000,
      taxaGlosa: 7,
      diasMedioRecebimento: 30,
      inadimplencia: 4,
    },
    secoes: [{ titulo: 'Resumo', conteudo: 'Periodo positivo.' }],
  };
}

// ============================================================================
// Tests — Construction
// ============================================================================

describe('TemplateManager — construction', () => {
  it('should create with default deps', () => {
    const manager = new TemplateManager();
    expect(manager).toBeInstanceOf(TemplateManager);
  });

  it('should accept custom deps', () => {
    const manager = new TemplateManager(createMockDeps());
    expect(manager).toBeInstanceOf(TemplateManager);
  });
});

// ============================================================================
// Tests — renderAppeal
// ============================================================================

describe('TemplateManager — renderAppeal', () => {
  it('should render appeal with specified format', () => {
    const manager = new TemplateManager(createMockDeps());
    const result = manager.renderAppeal(makeAppealInput(), 'markdown');

    expect(result.format).toBe('markdown');
    expect(result.content).toContain('RECURSO DE GLOSA');
  });

  it('should default to markdown format', () => {
    const manager = new TemplateManager(createMockDeps());
    const result = manager.renderAppeal(makeAppealInput());

    expect(result.format).toBe('markdown');
  });
});

// ============================================================================
// Tests — renderReport
// ============================================================================

describe('TemplateManager — renderReport', () => {
  it('should render report with specified format', () => {
    const manager = new TemplateManager(createMockDeps());
    const result = manager.renderReport(makeReportInput(), 'json');

    expect(result.format).toBe('json');
    const parsed = JSON.parse(result.content);
    expect(parsed.tipo).toBe('relatorio_financeiro');
  });
});

// ============================================================================
// Tests — render (generic dispatch)
// ============================================================================

describe('TemplateManager — render', () => {
  it('should dispatch appeal type', () => {
    const manager = new TemplateManager(createMockDeps());
    const result = manager.render('appeal', makeAppealInput(), 'plaintext');

    expect(result.content).toContain('RECURSO DE GLOSA');
  });

  it('should dispatch report type', () => {
    const manager = new TemplateManager(createMockDeps());
    const result = manager.render('report', makeReportInput(), 'markdown');

    expect(result.content).toContain('Relatorio Mensal');
  });

  it('should throw for unknown template type', () => {
    const manager = new TemplateManager(createMockDeps());

    expect(() => manager.render('unknown' as any, makeAppealInput())).toThrow('Unknown template type');
  });
});

// ============================================================================
// Tests — Supported formats/types
// ============================================================================

describe('TemplateManager — getSupportedFormats/Types', () => {
  it('should return correct supported formats and types', () => {
    const manager = new TemplateManager();

    expect(manager.getSupportedFormats()).toEqual(['markdown', 'json', 'plaintext']);
    expect(manager.getSupportedTypes()).toEqual(['appeal', 'report']);
  });
});

// ============================================================================
// Tests — Factory
// ============================================================================

describe('createTemplateManager', () => {
  it('should create TemplateManager instance', () => {
    const manager = createTemplateManager(createMockDeps());
    expect(manager).toBeInstanceOf(TemplateManager);
  });

  it('should accept no args', () => {
    const manager = createTemplateManager();
    expect(manager).toBeDefined();
  });
});
