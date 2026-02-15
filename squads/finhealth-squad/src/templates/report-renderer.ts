/**
 * Report Renderer
 * FinHealth Squad — Financial Report Templates
 *
 * Renders financial reports at three detail levels:
 * - executivo: KPIs only, summary narrative
 * - gerencial: sections with tables and charts
 * - operacional: full granular data
 *
 * All functions are pure: input data in → formatted string out.
 */

import type {
  ReportRenderInput,
  ReportLevel,
  ReportSection,
  ReportTable,
  ReportKeyMetrics,
  ReportChartReference,
  ReportComparativo,
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
  kvLine,
  joinSections,
  horizontalRule,
  bulletList,
  renderMarkdownTable,
} from './template-helpers';

// ============================================================================
// DI Dependencies
// ============================================================================

export interface ReportRendererDeps {
  dateProvider: DateProvider;
  idGenerator: IdGenerator;
}

// ============================================================================
// Main Render Function
// ============================================================================

export function renderReport(
  input: ReportRenderInput,
  format: OutputFormat,
  deps: ReportRendererDeps,
): RenderResult {
  const now = deps.dateProvider.now();
  const refNumber = deps.idGenerator.generate('REL');

  let content: string;
  switch (format) {
    case 'markdown':
      content = renderReportMarkdown(input, now, refNumber);
      break;
    case 'json':
      content = renderReportJson(input, now, refNumber);
      break;
    case 'plaintext':
      content = renderReportPlaintext(input, now, refNumber);
      break;
    default:
      content = renderReportMarkdown(input, now, refNumber);
  }

  return {
    content,
    format,
    metadata: buildReportMetadata(input, now, refNumber, content),
  };
}

// ============================================================================
// Label Helpers
// ============================================================================

export function getReportLevelLabel(nivel: ReportLevel): string {
  const labels: Record<ReportLevel, string> = {
    executivo: 'Executivo',
    gerencial: 'Gerencial',
    operacional: 'Operacional',
  };
  return labels[nivel];
}

// ============================================================================
// Markdown Rendering
// ============================================================================

function renderReportMarkdown(
  input: ReportRenderInput,
  now: Date,
  refNumber: string,
): string {
  const sections: string[] = [];

  sections.push(renderReportHeader(input, now, refNumber));
  sections.push(renderKpiDashboard(input.metricasChave));

  if (input.comparativo) {
    sections.push(renderComparativo(input.comparativo));
  }

  for (const secao of input.secoes) {
    sections.push(renderSection(secao, input.nivel));
  }

  if (input.nivel !== 'executivo' && input.graficos && input.graficos.length > 0) {
    sections.push(renderChartReferences(input.graficos));
  }

  sections.push(renderReportFooter(now, refNumber, input.nivel));

  return joinSections(...sections);
}

function renderReportHeader(
  input: ReportRenderInput,
  now: Date,
  refNumber: string,
): string {
  return joinSections(
    heading(input.titulo, 1),
    kvList([
      ['Nivel', getReportLevelLabel(input.nivel)],
      ['Periodo', input.periodo],
      ['Referencia', refNumber],
      ['Gerado em', formatDate(now)],
    ]),
  );
}

export function renderKpiDashboard(metrics: ReportKeyMetrics): string {
  return joinSections(
    heading('Indicadores-Chave', 2),
    renderMarkdownTable(
      ['Indicador', 'Valor'],
      [
        ['Receita Bruta', formatCurrency(metrics.receitaBruta)],
        ['Receita Liquida', formatCurrency(metrics.receitaLiquida)],
        ['Despesas Totais', formatCurrency(metrics.despesasTotais)],
        ['Resultado Operacional', formatCurrency(metrics.resultadoOperacional)],
        ['Margem Operacional', formatPercent(metrics.margemOperacional)],
        ['Faturamento Emitido', formatCurrency(metrics.faturamentoEmitido)],
        ['Taxa de Glosa', formatPercent(metrics.taxaGlosa)],
        ['Dias Medio Recebimento', `${metrics.diasMedioRecebimento} dias`],
        ['Inadimplencia', formatPercent(metrics.inadimplencia)],
      ],
    ),
  );
}

function renderComparativo(comp: ReportComparativo): string {
  const parts: string[] = [
    heading('Comparativo com Periodo Anterior', 2),
    kvLine('Periodo anterior', comp.periodoAnterior),
  ];

  const rows = Object.entries(comp.variacao).map(([key, value]) => [
    key,
    value > 0 ? `+${formatPercent(value)}` : formatPercent(value),
    value > 0 ? 'Crescimento' : value < 0 ? 'Reducao' : 'Estavel',
  ]);

  if (rows.length > 0) {
    parts.push(renderMarkdownTable(['Metrica', 'Variacao', 'Tendencia'], rows));
  }

  return joinSections(...parts);
}

export function renderSection(secao: ReportSection, nivel: ReportLevel): string {
  const parts: string[] = [heading(secao.titulo, 2)];

  if (secao.conteudo) {
    parts.push(secao.conteudo);
  }

  if (secao.metricas && Object.keys(secao.metricas).length > 0) {
    const metricPairs = Object.entries(secao.metricas).map(([k, v]) => {
      const formatted = typeof v === 'number' ? formatCurrency(v) : String(v);
      return [k, formatted] as [string, string];
    });
    parts.push(kvList(metricPairs));
  }

  if (nivel !== 'executivo' && secao.tabelas) {
    for (const tabela of secao.tabelas) {
      parts.push(renderTableBlock(tabela));
    }
  }

  return joinSections(...parts);
}

function renderTableBlock(tabela: ReportTable): string {
  return joinSections(
    heading(tabela.titulo, 3),
    renderMarkdownTable(tabela.colunas, tabela.linhas),
  );
}

function renderChartReferences(charts: ReportChartReference[]): string {
  return joinSections(
    heading('Graficos', 2),
    bulletList(charts.map(c => `**${c.titulo}** (${c.tipo}): ${c.descricao}`)),
  );
}

function renderReportFooter(now: Date, refNumber: string, nivel: ReportLevel): string {
  return joinSections(
    horizontalRule(),
    `*Relatorio gerado automaticamente em ${formatDate(now)} | Ref: ${refNumber} | Nivel: ${getReportLevelLabel(nivel)}*`,
  );
}

// ============================================================================
// Plaintext Rendering
// ============================================================================

function renderReportPlaintext(
  input: ReportRenderInput,
  now: Date,
  refNumber: string,
): string {
  let text = `${input.titulo}\n`;
  text += `${'='.repeat(input.titulo.length)}\n\n`;
  text += `Periodo: ${input.periodo}\n`;
  text += `Referencia: ${refNumber}\n`;
  text += `Gerado em: ${formatDate(now)}\n\n`;

  text += `INDICADORES-CHAVE:\n`;
  text += `  Receita Bruta:          ${formatCurrency(input.metricasChave.receitaBruta)}\n`;
  text += `  Receita Liquida:        ${formatCurrency(input.metricasChave.receitaLiquida)}\n`;
  text += `  Despesas Totais:        ${formatCurrency(input.metricasChave.despesasTotais)}\n`;
  text += `  Resultado Operacional:  ${formatCurrency(input.metricasChave.resultadoOperacional)}\n`;
  text += `  Margem Operacional:     ${formatPercent(input.metricasChave.margemOperacional)}\n`;
  text += `  Taxa de Glosa:          ${formatPercent(input.metricasChave.taxaGlosa)}\n`;
  text += `  Dias Medio Recebimento: ${input.metricasChave.diasMedioRecebimento} dias\n`;
  text += `  Inadimplencia:          ${formatPercent(input.metricasChave.inadimplencia)}\n\n`;

  for (const secao of input.secoes) {
    text += `${secao.titulo}\n`;
    text += `${'-'.repeat(secao.titulo.length)}\n`;
    text += `${secao.conteudo}\n\n`;
  }

  return text;
}

// ============================================================================
// JSON Rendering
// ============================================================================

function renderReportJson(
  input: ReportRenderInput,
  now: Date,
  refNumber: string,
): string {
  return JSON.stringify({
    tipo: 'relatorio_financeiro',
    nivel: input.nivel,
    referencia: refNumber,
    dataGeracao: now.toISOString(),
    titulo: input.titulo,
    periodo: input.periodo,
    metricasChave: input.metricasChave,
    secoes: input.secoes,
    graficos: input.graficos || [],
    comparativo: input.comparativo || null,
  }, null, 2);
}

// ============================================================================
// Metadata
// ============================================================================

function buildReportMetadata(
  input: ReportRenderInput,
  now: Date,
  refNumber: string,
  content: string,
): RenderMetadata {
  return {
    templateType: `report_${input.nivel}`,
    generatedAt: now,
    referenceNumber: refNumber,
    characterCount: content.length,
    sectionCount: input.secoes.length + 1, // +1 for KPI section
  };
}
