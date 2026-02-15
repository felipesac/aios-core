/**
 * Tests: Appeal Renderer
 * FinHealth Squad
 */

import { describe, it, expect } from 'vitest';
import { renderAppeal, getAppealTypeLabel } from './appeal-renderer';
import type { AppealRendererDeps } from './appeal-renderer';
import type { AppealRenderInput } from './types';

// ============================================================================
// Fixtures
// ============================================================================

function createMockDeps(): AppealRendererDeps {
  return {
    dateProvider: { now: () => new Date(2025, 2, 15, 10, 0, 0) },
    idGenerator: { generate: (prefix: string) => `${prefix}-2025-TEST01` },
  };
}

function makeAppealInput(overrides?: Partial<AppealRenderInput>): AppealRenderInput {
  return {
    tipo: 'administrativa',
    glosa: {
      codigoGlosa: 'GA001',
      descricaoGlosa: 'Guia sem autorizacao previa',
      valorGlosado: 1500.00,
      dataGlosa: new Date(2025, 1, 20),
      numeroGuia: 'G-2025-001',
      itensGlosados: [
        { codigoProcedimento: '40301010', descricao: 'Hemograma completo', valor: 1500, motivo: 'Sem autorizacao' },
      ],
    },
    guia: {
      tipo: 'SP/SADT',
      beneficiario: { nome: 'Joao da Silva', carteira: '98765432100' },
      prestador: { nome: 'Hospital ABC', cnes: 'CNES001' },
      dataAtendimento: new Date(2025, 1, 10),
    },
    operadora: {
      codigoAns: '123456',
      nome: 'Unimed',
      prazoRecurso: 30,
      canalRecurso: 'Portal Web',
    },
    evidencias: [
      { tipo: 'autorizacao', descricao: 'Autorizacao previa concedida', referencia: 'AUT-2025-001' },
    ],
    normas: [
      { tipo: 'resolucao_ans', numero: 'RN 395/2016', artigo: 'Art. 3', textoRelevante: 'A operadora deve manter registro de todas as autorizacoes.' },
    ],
    argumentos: [
      { ponto: 'Contestacao da glosa', fundamentacao: 'A glosa foi aplicada indevidamente.' },
      { ponto: 'Autorizacao previa existente', fundamentacao: 'O procedimento possui autorizacao.', evidencia: 'AUT-2025-001' },
    ],
    anexos: [
      { documento: 'Copia da guia glosada', disponivel: true, obrigatorio: true },
      { documento: 'Comprovante de autorizacao', disponivel: true, obrigatorio: true },
    ],
    probabilidadeReversao: 0.85,
    ...overrides,
  };
}

// ============================================================================
// Tests — Markdown Format
// ============================================================================

describe('renderAppeal — markdown format', () => {
  it('should include RECURSO DE GLOSA heading', () => {
    const result = renderAppeal(makeAppealInput(), 'markdown', createMockDeps());

    expect(result.content).toContain('# RECURSO DE GLOSA');
  });

  it('should include operadora name and ANS code', () => {
    const result = renderAppeal(makeAppealInput(), 'markdown', createMockDeps());

    expect(result.content).toContain('Unimed (ANS: 123456)');
  });

  it('should include beneficiario and prestador data', () => {
    const result = renderAppeal(makeAppealInput(), 'markdown', createMockDeps());

    expect(result.content).toContain('Joao da Silva');
    expect(result.content).toContain('98765432100');
    expect(result.content).toContain('Hospital ABC');
    expect(result.content).toContain('CNES001');
  });

  it('should include glosa code and formatted value', () => {
    const result = renderAppeal(makeAppealInput(), 'markdown', createMockDeps());

    expect(result.content).toContain('GA001 - Guia sem autorizacao previa');
    expect(result.content).toContain('R$ 1.500,00');
  });

  it('should render itensGlosados as markdown table', () => {
    const result = renderAppeal(makeAppealInput(), 'markdown', createMockDeps());

    expect(result.content).toContain('40301010');
    expect(result.content).toContain('Hemograma completo');
    expect(result.content).toContain('Sem autorizacao');
  });

  it('should include all argumentos with fundamentacao', () => {
    const result = renderAppeal(makeAppealInput(), 'markdown', createMockDeps());

    expect(result.content).toContain('Contestacao da glosa');
    expect(result.content).toContain('A glosa foi aplicada indevidamente.');
    expect(result.content).toContain('Autorizacao previa existente');
    expect(result.content).toContain('*Evidencia: AUT-2025-001*');
  });

  it('should include normative references', () => {
    const result = renderAppeal(makeAppealInput(), 'markdown', createMockDeps());

    expect(result.content).toContain('RN 395/2016');
    expect(result.content).toContain('Art. 3');
    expect(result.content).toContain('Resolucao ANS');
  });

  it('should render evidencias table', () => {
    const result = renderAppeal(makeAppealInput(), 'markdown', createMockDeps());

    expect(result.content).toContain('Autorizacao Previa');
    expect(result.content).toContain('AUT-2025-001');
  });

  it('should render anexos table', () => {
    const result = renderAppeal(makeAppealInput(), 'markdown', createMockDeps());

    expect(result.content).toContain('Copia da guia glosada');
    expect(result.content).toContain('Comprovante de autorizacao');
  });

  it('should include REVERSAO INTEGRAL closing', () => {
    const result = renderAppeal(makeAppealInput(), 'markdown', createMockDeps());

    expect(result.content).toContain('**REVERSAO INTEGRAL**');
  });

  it('should use deterministic date from DateProvider', () => {
    const result = renderAppeal(makeAppealInput(), 'markdown', createMockDeps());

    expect(result.content).toContain('15/03/2025');
  });

  it('should use deterministic reference from IdGenerator', () => {
    const result = renderAppeal(makeAppealInput(), 'markdown', createMockDeps());

    expect(result.content).toContain('REC-2025-TEST01');
  });

  it('should skip evidencias section when empty', () => {
    const input = makeAppealInput({ evidencias: [] });
    const result = renderAppeal(input, 'markdown', createMockDeps());

    expect(result.content).not.toContain('Evidencias Disponiveis');
  });

  it('should skip anexos section when empty', () => {
    const input = makeAppealInput({ anexos: [] });
    const result = renderAppeal(input, 'markdown', createMockDeps());

    expect(result.content).not.toContain('## Anexos');
  });
});

// ============================================================================
// Tests — Plaintext Format
// ============================================================================

describe('renderAppeal — plaintext format', () => {
  it('should include formal letter structure', () => {
    const result = renderAppeal(makeAppealInput(), 'plaintext', createMockDeps());

    expect(result.content).toContain('RECURSO DE GLOSA');
    expect(result.content).toContain('A UNIMED');
    expect(result.content).toContain('REF: Guia no G-2025-001');
    expect(result.content).toContain('Prezados Senhores');
    expect(result.content).toContain('DADOS DO ATENDIMENTO:');
    expect(result.content).toContain('FUNDAMENTACAO:');
  });

  it('should include closing with prestador signature', () => {
    const result = renderAppeal(makeAppealInput(), 'plaintext', createMockDeps());

    expect(result.content).toContain('REVERSAO INTEGRAL');
    expect(result.content).toContain('Atenciosamente');
    expect(result.content).toContain('Hospital ABC');
    expect(result.content).toContain('CNES: CNES001');
  });
});

// ============================================================================
// Tests — JSON Format
// ============================================================================

describe('renderAppeal — json format', () => {
  it('should return valid parseable JSON', () => {
    const result = renderAppeal(makeAppealInput(), 'json', createMockDeps());

    const parsed = JSON.parse(result.content);
    expect(parsed.tipo).toBe('recurso_glosa');
    expect(parsed.subtipo).toBe('administrativa');
    expect(parsed.referencia).toBe('REC-2025-TEST01');
  });

  it('should include all structured data', () => {
    const result = renderAppeal(makeAppealInput(), 'json', createMockDeps());

    const parsed = JSON.parse(result.content);
    expect(parsed.operadora.nome).toBe('Unimed');
    expect(parsed.glosa.codigoGlosa).toBe('GA001');
    expect(parsed.fundamentacao.argumentos.length).toBe(2);
    expect(parsed.evidencias.length).toBe(1);
    expect(parsed.anexos.length).toBe(2);
  });
});

// ============================================================================
// Tests — Appeal Types
// ============================================================================

describe('renderAppeal — different appeal types', () => {
  it('should render tecnica appeal', () => {
    const input = makeAppealInput({ tipo: 'tecnica' });
    const result = renderAppeal(input, 'markdown', createMockDeps());

    expect(result.content).toContain('Recurso Tecnico');
    expect(result.metadata.templateType).toBe('appeal_tecnica');
  });

  it('should render clinica appeal', () => {
    const input = makeAppealInput({ tipo: 'clinica' });
    const result = renderAppeal(input, 'markdown', createMockDeps());

    expect(result.content).toContain('Recurso Clinico');
    expect(result.metadata.templateType).toBe('appeal_clinica');
  });
});

// ============================================================================
// Tests — Metadata
// ============================================================================

describe('renderAppeal — metadata', () => {
  it('should return correct RenderMetadata', () => {
    const result = renderAppeal(makeAppealInput(), 'markdown', createMockDeps());

    expect(result.format).toBe('markdown');
    expect(result.metadata.templateType).toBe('appeal_administrativa');
    expect(result.metadata.referenceNumber).toBe('REC-2025-TEST01');
    expect(result.metadata.characterCount).toBeGreaterThan(0);
    expect(result.metadata.sectionCount).toBeGreaterThanOrEqual(5);
    expect(result.metadata.generatedAt).toEqual(new Date(2025, 2, 15, 10, 0, 0));
  });
});

// ============================================================================
// Tests — Label Helpers
// ============================================================================

describe('getAppealTypeLabel', () => {
  it('should return Portuguese labels', () => {
    expect(getAppealTypeLabel('administrativa')).toBe('Recurso Administrativo');
    expect(getAppealTypeLabel('tecnica')).toBe('Recurso Tecnico');
    expect(getAppealTypeLabel('clinica')).toBe('Recurso Clinico');
  });
});
