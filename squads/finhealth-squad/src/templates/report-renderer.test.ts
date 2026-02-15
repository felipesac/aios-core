/**
 * Tests: Report Renderer
 * FinHealth Squad
 */

import { describe, it, expect } from 'vitest';
import { renderReport, renderKpiDashboard, renderSection, getReportLevelLabel } from './report-renderer';
import type { ReportRendererDeps } from './report-renderer';
import type { ReportRenderInput, ReportKeyMetrics, ReportSection as SectionType } from './types';

// ============================================================================
// Fixtures
// ============================================================================

function createMockDeps(): ReportRendererDeps {
  return {
    dateProvider: { now: () => new Date(2025, 2, 15, 10, 0, 0) },
    idGenerator: { generate: (prefix: string) => `${prefix}-2025-TEST01` },
  };
}

function makeMetrics(overrides?: Partial<ReportKeyMetrics>): ReportKeyMetrics {
  return {
    receitaBruta: 150000,
    receitaLiquida: 135000,
    despesasTotais: 80000,
    resultadoOperacional: 70000,
    margemOperacional: 46.7,
    faturamentoEmitido: 160000,
    taxaGlosa: 8.5,
    diasMedioRecebimento: 35,
    inadimplencia: 5.2,
    ...overrides,
  };
}

function makeReportInput(overrides?: Partial<ReportRenderInput>): ReportRenderInput {
  return {
    nivel: 'gerencial',
    titulo: 'Relatorio Financeiro - Janeiro 2025',
    periodo: '01/01/2025 a 31/01/2025',
    metricasChave: makeMetrics(),
    secoes: [
      { titulo: 'Sumario Executivo', conteudo: 'Periodo com resultado positivo.' },
      {
        titulo: 'Receitas',
        conteudo: 'Analise detalhada das receitas.',
        tabelas: [
          {
            titulo: 'Receitas por Fonte',
            colunas: ['Fonte', 'Valor (R$)'],
            linhas: [['Consultas', 80000], ['Exames', 70000]],
          },
        ],
      },
    ],
    ...overrides,
  };
}

// ============================================================================
// Tests — Executivo Level
// ============================================================================

describe('renderReport — executivo level', () => {
  it('should render KPI dashboard', () => {
    const input = makeReportInput({ nivel: 'executivo' });
    const result = renderReport(input, 'markdown', createMockDeps());

    expect(result.content).toContain('Indicadores-Chave');
    expect(result.content).toContain('R$ 150.000,00');
    expect(result.content).toContain('46,7%');
  });

  it('should NOT include section tables at executivo level', () => {
    const input = makeReportInput({ nivel: 'executivo' });
    const result = renderReport(input, 'markdown', createMockDeps());

    expect(result.content).not.toContain('Receitas por Fonte');
  });

  it('should include report title and period', () => {
    const input = makeReportInput({ nivel: 'executivo' });
    const result = renderReport(input, 'markdown', createMockDeps());

    expect(result.content).toContain('# Relatorio Financeiro - Janeiro 2025');
    expect(result.content).toContain('01/01/2025 a 31/01/2025');
  });
});

// ============================================================================
// Tests — Gerencial Level
// ============================================================================

describe('renderReport — gerencial level', () => {
  it('should render complete report with tables', () => {
    const result = renderReport(makeReportInput(), 'markdown', createMockDeps());

    expect(result.content).toContain('Indicadores-Chave');
    expect(result.content).toContain('Receitas por Fonte');
    expect(result.content).toContain('Consultas');
    expect(result.content).toContain('Exames');
  });

  it('should include all sections with content', () => {
    const result = renderReport(makeReportInput(), 'markdown', createMockDeps());

    expect(result.content).toContain('## Sumario Executivo');
    expect(result.content).toContain('Periodo com resultado positivo.');
    expect(result.content).toContain('## Receitas');
  });

  it('should render section tables', () => {
    const result = renderReport(makeReportInput(), 'markdown', createMockDeps());

    expect(result.content).toContain('### Receitas por Fonte');
    expect(result.content).toContain('R$ 80.000,00');
    expect(result.content).toContain('R$ 70.000,00');
  });

  it('should format KPI values correctly', () => {
    const result = renderReport(makeReportInput(), 'markdown', createMockDeps());

    expect(result.content).toContain('R$ 150.000,00'); // receitaBruta
    expect(result.content).toContain('R$ 80.000,00');  // despesasTotais
    expect(result.content).toContain('8,5%');           // taxaGlosa
    expect(result.content).toContain('35 dias');        // diasMedioRecebimento
  });
});

// ============================================================================
// Tests — Operacional Level
// ============================================================================

describe('renderReport — operacional level', () => {
  it('should include all gerencial content plus chart references', () => {
    const input = makeReportInput({
      nivel: 'operacional',
      graficos: [
        { tipo: 'linha', titulo: 'Evolucao Receita', descricao: 'Receita mensal' },
      ],
    });
    const result = renderReport(input, 'markdown', createMockDeps());

    expect(result.content).toContain('Receitas por Fonte');
    expect(result.content).toContain('## Graficos');
    expect(result.content).toContain('Evolucao Receita');
  });
});

// ============================================================================
// Tests — Comparativo
// ============================================================================

describe('renderReport — comparativo', () => {
  it('should render comparative section when provided', () => {
    const input = makeReportInput({
      comparativo: {
        periodoAnterior: '01/12/2024 a 31/12/2024',
        variacao: { receitaBruta: 5.2, taxaGlosa: -1.3 },
      },
    });
    const result = renderReport(input, 'markdown', createMockDeps());

    expect(result.content).toContain('Comparativo com Periodo Anterior');
    expect(result.content).toContain('01/12/2024 a 31/12/2024');
  });

  it('should show growth and reduction indicators', () => {
    const input = makeReportInput({
      comparativo: {
        periodoAnterior: 'Dezembro 2024',
        variacao: { receitaBruta: 5.2, taxaGlosa: -1.3 },
      },
    });
    const result = renderReport(input, 'markdown', createMockDeps());

    expect(result.content).toContain('Crescimento');
    expect(result.content).toContain('Reducao');
  });
});

// ============================================================================
// Tests — Plaintext Format
// ============================================================================

describe('renderReport — plaintext format', () => {
  it('should render KPIs as aligned plaintext', () => {
    const result = renderReport(makeReportInput(), 'plaintext', createMockDeps());

    expect(result.content).toContain('INDICADORES-CHAVE:');
    expect(result.content).toContain('Receita Bruta:');
    expect(result.content).toContain('R$ 150.000,00');
  });

  it('should include section titles with underlines', () => {
    const result = renderReport(makeReportInput(), 'plaintext', createMockDeps());

    expect(result.content).toContain('Sumario Executivo\n-');
    expect(result.content).toContain('Periodo com resultado positivo.');
  });
});

// ============================================================================
// Tests — JSON Format
// ============================================================================

describe('renderReport — json format', () => {
  it('should return valid parseable JSON', () => {
    const result = renderReport(makeReportInput(), 'json', createMockDeps());

    const parsed = JSON.parse(result.content);
    expect(parsed.tipo).toBe('relatorio_financeiro');
    expect(parsed.nivel).toBe('gerencial');
    expect(parsed.referencia).toBe('REL-2025-TEST01');
  });

  it('should include all structured data', () => {
    const result = renderReport(makeReportInput(), 'json', createMockDeps());

    const parsed = JSON.parse(result.content);
    expect(parsed.metricasChave.receitaBruta).toBe(150000);
    expect(parsed.secoes.length).toBe(2);
    expect(parsed.periodo).toBe('01/01/2025 a 31/01/2025');
  });
});

// ============================================================================
// Tests — Exported Helpers
// ============================================================================

describe('renderKpiDashboard (exported)', () => {
  it('should render standalone KPI table', () => {
    const result = renderKpiDashboard(makeMetrics());

    expect(result).toContain('Indicadores-Chave');
    expect(result).toContain('R$ 150.000,00');
    expect(result).toContain('46,7%');
    expect(result).toContain('35 dias');
  });
});

describe('renderSection (exported)', () => {
  it('should render section with tables at gerencial level', () => {
    const section: SectionType = {
      titulo: 'Receitas',
      conteudo: 'Analise.',
      tabelas: [{ titulo: 'Por Fonte', colunas: ['Fonte', 'Valor (R$)'], linhas: [['A', 100]] }],
    };

    const result = renderSection(section, 'gerencial');

    expect(result).toContain('## Receitas');
    expect(result).toContain('### Por Fonte');
  });

  it('should render section without tables at executivo level', () => {
    const section: SectionType = {
      titulo: 'Receitas',
      conteudo: 'Analise.',
      tabelas: [{ titulo: 'Por Fonte', colunas: ['Fonte', 'Valor (R$)'], linhas: [['A', 100]] }],
    };

    const result = renderSection(section, 'executivo');

    expect(result).toContain('## Receitas');
    expect(result).not.toContain('### Por Fonte');
  });
});

// ============================================================================
// Tests — Metadata
// ============================================================================

describe('renderReport — metadata', () => {
  it('should return correct RenderMetadata', () => {
    const result = renderReport(makeReportInput(), 'markdown', createMockDeps());

    expect(result.format).toBe('markdown');
    expect(result.metadata.templateType).toBe('report_gerencial');
    expect(result.metadata.referenceNumber).toBe('REL-2025-TEST01');
    expect(result.metadata.characterCount).toBeGreaterThan(0);
    expect(result.metadata.sectionCount).toBe(3); // 2 secoes + 1 KPI
    expect(result.metadata.generatedAt).toEqual(new Date(2025, 2, 15, 10, 0, 0));
  });
});

// ============================================================================
// Tests — Label Helper
// ============================================================================

describe('getReportLevelLabel', () => {
  it('should return Portuguese labels', () => {
    expect(getReportLevelLabel('executivo')).toBe('Executivo');
    expect(getReportLevelLabel('gerencial')).toBe('Gerencial');
    expect(getReportLevelLabel('operacional')).toBe('Operacional');
  });
});
