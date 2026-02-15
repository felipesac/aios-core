/**
 * Appeal Renderer
 * FinHealth Squad — Glosa Appeal Document Templates
 *
 * Renders formal appeal documents (recurso de glosa) in markdown, plaintext, or JSON.
 * Three appeal types: administrativa, tecnica, clinica.
 *
 * All functions are pure: input data in → formatted string out.
 */

import type {
  AppealRenderInput,
  AppealType,
  AppealEvidencia,
  AppealNorma,
  AppealAnexo,
  OutputFormat,
  RenderResult,
  RenderMetadata,
  DateProvider,
  IdGenerator,
} from './types';
import {
  formatCurrency,
  formatDate,
  formatPercent,
  heading,
  kvList,
  joinSections,
  horizontalRule,
  bulletList,
  renderMarkdownTable,
} from './template-helpers';

// ============================================================================
// DI Dependencies
// ============================================================================

export interface AppealRendererDeps {
  dateProvider: DateProvider;
  idGenerator: IdGenerator;
}

export function createDefaultDateProvider(): DateProvider {
  return { now: () => new Date() };
}

export function createDefaultIdGenerator(): IdGenerator {
  return {
    generate: (prefix: string) => {
      const date = new Date();
      const random = Math.random().toString(36).substring(2, 8).toUpperCase();
      return `${prefix}-${date.getFullYear()}-${random}`;
    },
  };
}

// ============================================================================
// Main Render Function
// ============================================================================

export function renderAppeal(
  input: AppealRenderInput,
  format: OutputFormat,
  deps: AppealRendererDeps,
): RenderResult {
  const now = deps.dateProvider.now();
  const refNumber = deps.idGenerator.generate('REC');

  let content: string;
  switch (format) {
    case 'markdown':
      content = renderAppealMarkdown(input, now, refNumber);
      break;
    case 'plaintext':
      content = renderAppealPlaintext(input, now, refNumber);
      break;
    case 'json':
      content = renderAppealJson(input, now, refNumber);
      break;
    default:
      content = renderAppealMarkdown(input, now, refNumber);
  }

  return {
    content,
    format,
    metadata: buildMetadata(input, now, refNumber, content),
  };
}

// ============================================================================
// Label Helpers
// ============================================================================

export function getAppealTypeLabel(tipo: AppealType): string {
  const labels: Record<AppealType, string> = {
    administrativa: 'Recurso Administrativo',
    tecnica: 'Recurso Tecnico',
    clinica: 'Recurso Clinico',
  };
  return labels[tipo];
}

function getNormaTypeLabel(tipo: AppealNorma['tipo']): string {
  const labels: Record<string, string> = {
    resolucao_ans: 'Resolucao ANS',
    lei: 'Lei Federal',
    contrato: 'Clausula Contratual',
    jurisprudencia: 'Jurisprudencia',
  };
  return labels[tipo] || tipo;
}

function getEvidenciaTypeLabel(tipo: AppealEvidencia['tipo']): string {
  const labels: Record<string, string> = {
    autorizacao: 'Autorizacao Previa',
    laudo: 'Laudo Medico',
    prontuario: 'Prontuario',
    protocolo: 'Protocolo Clinico',
    contrato: 'Contrato',
  };
  return labels[tipo] || tipo;
}

// ============================================================================
// Markdown Rendering
// ============================================================================

function renderAppealMarkdown(
  input: AppealRenderInput,
  now: Date,
  refNumber: string,
): string {
  const sections: string[] = [];

  sections.push(renderHeaderMarkdown(input, now, refNumber));
  sections.push(renderQualificationMarkdown(input));
  sections.push(renderGlosaDetailsMarkdown(input));
  sections.push(renderFundamentacaoMarkdown(input));

  if (input.evidencias.length > 0) {
    sections.push(renderEvidenciasMarkdown(input.evidencias));
  }

  if (input.anexos.length > 0) {
    sections.push(renderAnexosMarkdown(input.anexos));
  }

  sections.push(renderClosingMarkdown(input, now));

  return joinSections(...sections);
}

function renderHeaderMarkdown(
  input: AppealRenderInput,
  now: Date,
  refNumber: string,
): string {
  const appealTypeLabel = getAppealTypeLabel(input.tipo);
  return joinSections(
    heading('RECURSO DE GLOSA', 1),
    kvList([
      ['Tipo', appealTypeLabel],
      ['Referencia', refNumber],
      ['Data', formatDate(now)],
      ['Operadora', `${input.operadora.nome} (ANS: ${input.operadora.codigoAns})`],
      ['Guia', input.glosa.numeroGuia],
      ['Probabilidade de Reversao', formatPercent(input.probabilidadeReversao * 100, 0)],
    ]),
  );
}

function renderQualificationMarkdown(input: AppealRenderInput): string {
  return joinSections(
    heading('Dados do Atendimento', 2),
    kvList([
      ['Beneficiario', `${input.guia.beneficiario.nome} (Carteira: ${input.guia.beneficiario.carteira})`],
      ['Prestador', `${input.guia.prestador.nome} (CNES: ${input.guia.prestador.cnes})`],
      ['Data do Atendimento', formatDate(input.guia.dataAtendimento)],
      ['Tipo da Guia', input.guia.tipo],
    ]),
  );
}

function renderGlosaDetailsMarkdown(input: AppealRenderInput): string {
  const parts: string[] = [
    heading('Detalhes da Glosa', 2),
    kvList([
      ['Codigo', `${input.glosa.codigoGlosa} - ${input.glosa.descricaoGlosa}`],
      ['Valor Glosado', formatCurrency(input.glosa.valorGlosado)],
      ['Data da Glosa', formatDate(input.glosa.dataGlosa)],
    ]),
  ];

  if (input.glosa.itensGlosados.length > 0) {
    parts.push(
      renderMarkdownTable(
        ['Procedimento', 'Descricao', 'Valor (R$)', 'Motivo'],
        input.glosa.itensGlosados.map(item => [
          item.codigoProcedimento,
          item.descricao,
          item.valor,
          item.motivo,
        ]),
      ),
    );
  }

  return joinSections(...parts);
}

function renderFundamentacaoMarkdown(input: AppealRenderInput): string {
  const parts: string[] = [heading('Fundamentacao', 2)];

  if (input.argumentos.length > 0) {
    parts.push(heading('Argumentos', 3));
    for (const arg of input.argumentos) {
      parts.push(`**${arg.ponto}**\n\n${arg.fundamentacao}`);
      if (arg.evidencia) {
        parts.push(`*Evidencia: ${arg.evidencia}*`);
      }
    }
  }

  if (input.normas.length > 0) {
    parts.push(heading('Fundamentacao Normativa', 3));
    const normaItems = input.normas.map(n => {
      const artigo = n.artigo ? `, ${n.artigo}` : '';
      return `**${n.numero}${artigo}** (${getNormaTypeLabel(n.tipo)}): "${n.textoRelevante}"`;
    });
    parts.push(bulletList(normaItems));
  }

  return joinSections(...parts);
}

function renderEvidenciasMarkdown(evidencias: AppealEvidencia[]): string {
  return joinSections(
    heading('Evidencias Disponiveis', 2),
    renderMarkdownTable(
      ['Tipo', 'Descricao', 'Referencia'],
      evidencias.map(e => [getEvidenciaTypeLabel(e.tipo), e.descricao, e.referencia]),
    ),
  );
}

function renderAnexosMarkdown(anexos: AppealAnexo[]): string {
  return joinSections(
    heading('Anexos', 2),
    renderMarkdownTable(
      ['Documento', 'Obrigatorio', 'Disponivel'],
      anexos.map(a => [
        a.documento,
        a.obrigatorio ? 'Sim' : 'Nao',
        a.disponivel ? 'Sim' : 'Pendente',
      ]),
    ),
  );
}

function renderClosingMarkdown(input: AppealRenderInput, now: Date): string {
  return joinSections(
    horizontalRule(),
    'Diante do exposto, requeremos a **REVERSAO INTEGRAL** da glosa aplicada.',
    'Atenciosamente,',
    kvList([
      ['Prestador', input.guia.prestador.nome],
      ['CNES', input.guia.prestador.cnes],
      ['Data', formatDate(now)],
    ]),
  );
}

// ============================================================================
// Plaintext Rendering
// ============================================================================

function renderAppealPlaintext(
  input: AppealRenderInput,
  now: Date,
  _refNumber: string,
): string {
  let text = `RECURSO DE GLOSA\n\n`;
  text += `A ${input.operadora.nome.toUpperCase()}\n`;
  text += `REF: Guia no ${input.glosa.numeroGuia}\n\n`;
  text += `Prezados Senhores,\n\n`;
  text += `Vimos, respeitosamente, interpor RECURSO contra a glosa aplicada ao procedimento abaixo relacionado:\n\n`;
  text += `DADOS DO ATENDIMENTO:\n`;
  text += `- Beneficiario: ${input.guia.beneficiario.nome}\n`;
  text += `- Carteira: ${input.guia.beneficiario.carteira}\n`;
  text += `- Data do atendimento: ${formatDate(input.guia.dataAtendimento)}\n`;
  text += `- Valor glosado: ${formatCurrency(input.glosa.valorGlosado)}\n`;
  text += `- Codigo da glosa: ${input.glosa.codigoGlosa} - ${input.glosa.descricaoGlosa}\n\n`;
  text += `FUNDAMENTACAO:\n`;

  for (const arg of input.argumentos) {
    text += `\n${arg.ponto}\n${arg.fundamentacao}\n`;
    if (arg.evidencia) {
      text += `Evidencia: ${arg.evidencia}\n`;
    }
  }

  if (input.normas.length > 0) {
    text += `\nFUNDAMENTACAO NORMATIVA:\n`;
    for (const norma of input.normas) {
      text += `- ${norma.numero}`;
      if (norma.artigo) text += `, ${norma.artigo}`;
      text += `: "${norma.textoRelevante}"\n`;
    }
  }

  text += `\nDiante do exposto, requeremos a REVERSAO INTEGRAL da glosa aplicada.\n\n`;
  text += `Atenciosamente,\n\n`;
  text += `${input.guia.prestador.nome}\n`;
  text += `CNES: ${input.guia.prestador.cnes}\n`;
  text += `${formatDate(now)}\n`;

  return text;
}

// ============================================================================
// JSON Rendering
// ============================================================================

function renderAppealJson(
  input: AppealRenderInput,
  now: Date,
  refNumber: string,
): string {
  return JSON.stringify({
    tipo: 'recurso_glosa',
    subtipo: input.tipo,
    referencia: refNumber,
    dataGeracao: now.toISOString(),
    operadora: input.operadora,
    glosa: {
      ...input.glosa,
      dataGlosa: input.glosa.dataGlosa.toISOString(),
    },
    guia: {
      ...input.guia,
      dataAtendimento: input.guia.dataAtendimento.toISOString(),
    },
    fundamentacao: {
      argumentos: input.argumentos,
      normas: input.normas,
    },
    evidencias: input.evidencias,
    anexos: input.anexos,
    probabilidadeReversao: input.probabilidadeReversao,
  }, null, 2);
}

// ============================================================================
// Metadata
// ============================================================================

function buildMetadata(
  input: AppealRenderInput,
  now: Date,
  refNumber: string,
  content: string,
): RenderMetadata {
  let sectionCount = 4; // header, qualification, glosa details, closing
  if (input.argumentos.length > 0 || input.normas.length > 0) sectionCount++;
  if (input.evidencias.length > 0) sectionCount++;
  if (input.anexos.length > 0) sectionCount++;

  return {
    templateType: `appeal_${input.tipo}`,
    generatedAt: now,
    referenceNumber: refNumber,
    characterCount: content.length,
    sectionCount,
  };
}
