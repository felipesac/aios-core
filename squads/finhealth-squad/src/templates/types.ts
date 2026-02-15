/**
 * Template Types
 * FinHealth Squad — Report/Appeal Output Templates
 *
 * Types, DI interfaces, and render contracts for document rendering.
 */

// ============================================================================
// DI Interfaces
// ============================================================================

export interface DateProvider {
  now(): Date;
}

export interface IdGenerator {
  generate(prefix: string): string;
}

// ============================================================================
// Output Types
// ============================================================================

export type OutputFormat = 'markdown' | 'json' | 'plaintext';

export interface RenderResult {
  content: string;
  format: OutputFormat;
  metadata: RenderMetadata;
}

export interface RenderMetadata {
  templateType: string;
  generatedAt: Date;
  referenceNumber: string;
  characterCount: number;
  sectionCount: number;
}

// ============================================================================
// Appeal Types
// ============================================================================

export type AppealType = 'administrativa' | 'tecnica' | 'clinica';

export interface AppealRenderInput {
  tipo: AppealType;
  glosa: AppealGlosaData;
  guia: AppealGuiaData;
  operadora: AppealOperadoraData;
  evidencias: AppealEvidencia[];
  normas: AppealNorma[];
  argumentos: AppealArgumento[];
  anexos: AppealAnexo[];
  probabilidadeReversao: number;
}

export interface AppealGlosaData {
  codigoGlosa: string;
  descricaoGlosa: string;
  valorGlosado: number;
  dataGlosa: Date;
  numeroGuia: string;
  numeroProtocolo?: string;
  itensGlosados: AppealGlosaItem[];
}

export interface AppealGlosaItem {
  codigoProcedimento: string;
  descricao: string;
  valor: number;
  motivo: string;
}

export interface AppealGuiaData {
  tipo: string;
  beneficiario: { nome: string; carteira: string };
  prestador: { nome: string; cnes: string; cnpj?: string };
  dataAtendimento: Date;
}

export interface AppealOperadoraData {
  codigoAns: string;
  nome: string;
  prazoRecurso: number;
  canalRecurso: string;
}

export interface AppealEvidencia {
  tipo: 'autorizacao' | 'laudo' | 'prontuario' | 'protocolo' | 'contrato';
  descricao: string;
  referencia: string;
}

export interface AppealNorma {
  tipo: 'resolucao_ans' | 'lei' | 'contrato' | 'jurisprudencia';
  numero: string;
  artigo?: string;
  textoRelevante: string;
}

export interface AppealArgumento {
  ponto: string;
  fundamentacao: string;
  evidencia?: string;
}

export interface AppealAnexo {
  documento: string;
  disponivel: boolean;
  obrigatorio: boolean;
}

// ============================================================================
// Report Types
// ============================================================================

export type ReportLevel = 'executivo' | 'gerencial' | 'operacional';

export interface ReportRenderInput {
  nivel: ReportLevel;
  titulo: string;
  periodo: string;
  metricasChave: ReportKeyMetrics;
  secoes: ReportSection[];
  graficos?: ReportChartReference[];
  comparativo?: ReportComparativo;
}

export interface ReportKeyMetrics {
  receitaBruta: number;
  receitaLiquida: number;
  despesasTotais: number;
  resultadoOperacional: number;
  margemOperacional: number;
  faturamentoEmitido: number;
  taxaGlosa: number;
  diasMedioRecebimento: number;
  inadimplencia: number;
}

export interface ReportSection {
  titulo: string;
  conteudo: string;
  tabelas?: ReportTable[];
  metricas?: Record<string, number | string>;
}

export interface ReportTable {
  titulo: string;
  colunas: string[];
  linhas: (string | number)[][];
}

export interface ReportChartReference {
  tipo: 'linha' | 'barra' | 'pizza';
  titulo: string;
  descricao: string;
}

export interface ReportComparativo {
  periodoAnterior: string;
  variacao: Record<string, number>;
}

// ============================================================================
// Manager Types
// ============================================================================

export type TemplateType = 'appeal' | 'report';

export interface TemplateManagerDeps {
  dateProvider: DateProvider;
  idGenerator: IdGenerator;
}
