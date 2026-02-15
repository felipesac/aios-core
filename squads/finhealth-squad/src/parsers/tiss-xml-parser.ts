/**
 * TISS XML Parser
 * FinHealth Squad
 *
 * Parses TISS (Troca de Informação em Saúde Suplementar) XML files
 * following ANS standards. Handles namespace prefixes and multiple guide types.
 */

import { XMLParser } from 'fast-xml-parser';

// ============================================================================
// Types
// ============================================================================

export type TissGuiaType = 'consulta' | 'sp-sadt' | 'internacao' | 'honorarios' | 'odontologia';

export interface TissCabecalho {
  tipoTransacao: string;
  sequencialTransacao?: string;
  dataRegistroTransacao?: string;
  horaRegistroTransacao?: string;
  versaoPadrao: string;
}

export interface TissBeneficiario {
  numeroCarteira: string;
  nome: string;
  dataNascimento?: string;
  atendimentoRN?: string;
}

export interface TissPrestador {
  codigoCnes: string;
  nome: string;
  codigoOperadora?: string;
  registroANS?: string;
}

export interface TissProcedimento {
  sequencial: number;
  codigoTabela: string;
  codigoTuss: string;
  descricao: string;
  quantidade: number;
  valorUnitario: number;
  valorTotal: number;
  dataExecucao?: string;
  cidPrincipal?: string;
  viaAcesso?: string;
  tecnicaUtilizada?: string;
}

export interface TissGuia {
  tipo: TissGuiaType;
  numeroGuiaPrestador: string;
  numeroGuiaOperadora?: string;
  registroANS?: string;
  dataAtendimento?: string;
  beneficiario: TissBeneficiario;
  prestador: TissPrestador;
  procedimentos: TissProcedimento[];
  valorTotal: number;
  internacao?: {
    dataInternacao?: string;
    dataAlta?: string;
    tipoInternacao?: string;
    regimeInternacao?: string;
    diarias?: number;
  };
  consulta?: {
    tipoConsulta?: string;
    indicacaoAcidente?: string;
  };
}

export interface ParseTissResult {
  success: boolean;
  guias: TissGuia[];
  cabecalho?: TissCabecalho;
  errors: string[];
  warnings: string[];
}

// ============================================================================
// Parser configuration
// ============================================================================

const PARSER_OPTIONS = {
  ignoreAttributes: false,
  attributeNamePrefix: '@_',
  parseAttributeValue: true,
  trimValues: true,
  removeNSPrefix: true,
};

// Guide type detection keys
const GUIA_TYPE_KEYS: Record<string, TissGuiaType> = {
  guiaSP_SADT: 'sp-sadt',
  guiaConsulta: 'consulta',
  guiaResumoInternacao: 'internacao',
  guiaHonorarios: 'honorarios',
  guiaOdontologia: 'odontologia',
};

// ============================================================================
// Main parser
// ============================================================================

/**
 * Parse a TISS XML string into structured guide objects.
 */
export function parseTissXml(xmlContent: string): ParseTissResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!xmlContent || !xmlContent.trim()) {
    return { success: false, guias: [], errors: ['Empty XML content'], warnings };
  }

  // Strip BOM if present
  const cleanXml = xmlContent.replace(/^\uFEFF/, '');

  let parsed: Record<string, any>; // eslint-disable-line @typescript-eslint/no-explicit-any -- XML parser output
  try {
    const parser = new XMLParser(PARSER_OPTIONS);
    parsed = parser.parse(cleanXml);
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    return {
      success: false,
      guias: [],
      errors: [`XML parsing error: ${msg}`],
      warnings,
    };
  }

  // Navigate to TISS root (handles both namespaced and plain)
  const tissRoot = parsed.mensagemTISS || parsed;

  // Extract cabecalho
  const cabecalho = extractCabecalho(tissRoot);

  // Navigate to guides
  const prestador = findInObject(tissRoot, 'prestadorParaOperadora');
  if (!prestador) {
    return {
      success: false,
      guias: [],
      cabecalho: cabecalho || undefined,
      errors: ['Missing prestadorParaOperadora section'],
      warnings,
    };
  }

  const loteGuias = findInObject(prestador, 'loteGuias');
  const guiasTISS = loteGuias ? findInObject(loteGuias, 'guiasTISS') : prestador;

  if (!guiasTISS) {
    return {
      success: false,
      guias: [],
      cabecalho: cabecalho || undefined,
      errors: ['No guides found in XML'],
      warnings,
    };
  }

  // Extract guides by type
  const guias: TissGuia[] = [];

  for (const [key, tipo] of Object.entries(GUIA_TYPE_KEYS)) {
    const guiaData = guiasTISS[key];
    if (!guiaData) continue;

    const guiaArray = Array.isArray(guiaData) ? guiaData : [guiaData];
    for (const node of guiaArray) {
      try {
        guias.push(extractGuia(node, tipo));
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : String(e);
        warnings.push(`Failed to extract ${tipo} guide: ${msg}`);
      }
    }
  }

  if (guias.length === 0) {
    warnings.push('No recognized guide types found in XML');
  }

  return {
    success: true,
    guias,
    cabecalho: cabecalho || undefined,
    errors,
    warnings,
  };
}

// ============================================================================
// Field extractors
// ============================================================================

/**
 * Extract cabecalho (header) from TISS root.
 */
export function extractCabecalho(data: Record<string, any>): TissCabecalho | null {
  const cab = findInObject(data, 'cabecalho');
  if (!cab || typeof cab !== 'object') return null;

  const id = cab.identificacaoTransacao || {};

  return {
    tipoTransacao: String(id.tipoTransacao || ''),
    sequencialTransacao: id.sequencialTransacao != null ? String(id.sequencialTransacao) : undefined,
    dataRegistroTransacao: id.dataRegistroTransacao != null ? String(id.dataRegistroTransacao) : undefined,
    horaRegistroTransacao: id.horaRegistroTransacao != null ? String(id.horaRegistroTransacao) : undefined,
    versaoPadrao: String(cab.versaoPadrao || findInObject(cab, 'versaoPadrao') || ''),
  };
}

/**
 * Detect guide type from XML node keys.
 */
export function detectGuiaType(guiaNode: Record<string, any>): TissGuiaType {
  for (const [key, tipo] of Object.entries(GUIA_TYPE_KEYS)) {
    if (guiaNode[key] !== undefined) return tipo;
  }
  // Default based on content heuristics
  if (findInObject(guiaNode, 'dadosInternacao')) return 'internacao';
  if (findInObject(guiaNode, 'tipoConsulta')) return 'consulta';
  return 'sp-sadt';
}

/**
 * Extract beneficiario data from a guide node.
 */
export function extractBeneficiario(guiaNode: Record<string, any>): TissBeneficiario {
  const ben = findInObject(guiaNode, 'dadosBeneficiario') || {};

  return {
    numeroCarteira: String(ben.numeroCarteira || findInObject(ben, 'numeroCarteira') || ''),
    nome: String(ben.nomeBeneficiario || findInObject(ben, 'nomeBeneficiario') || ''),
    dataNascimento: ben.dataNascimento != null ? String(ben.dataNascimento) : undefined,
    atendimentoRN: ben.atendimentoRN != null ? String(ben.atendimentoRN) : undefined,
  };
}

/**
 * Extract prestador (provider) data from a guide node.
 */
export function extractPrestador(guiaNode: Record<string, any>): TissPrestador {
  const sol = findInObject(guiaNode, 'dadosSolicitante') || {};
  const cab = findInObject(guiaNode, 'cabecalhoGuia') || {};
  const contratado = findInObject(sol, 'contratadoSolicitante') || {};

  return {
    codigoCnes: String(contratado.codigoPrestadorNaOperadora || findInObject(guiaNode, 'codigoPrestadorNaOperadora') || ''),
    nome: String(contratado.nomeContratado || findInObject(guiaNode, 'nomeContratado') || ''),
    codigoOperadora: cab.registroANS != null ? String(cab.registroANS) : undefined,
    registroANS: cab.registroANS != null ? String(cab.registroANS) : undefined,
  };
}

/**
 * Extract procedures from a guide node.
 * Handles both single and array procedure elements.
 * Coerces numeric codes to strings.
 */
export function extractProcedimentos(guiaNode: Record<string, any>): TissProcedimento[] {
  const procedimentos: TissProcedimento[] = [];

  const execContainer = findInObject(guiaNode, 'procedimentosExecutados');
  if (!execContainer) return procedimentos;

  const execItems = execContainer.procedimentoExecutado;
  if (!execItems) return procedimentos;

  const items = Array.isArray(execItems) ? execItems : [execItems];

  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    const proc = item.procedimento || {};

    procedimentos.push({
      sequencial: parseInt(String(item.sequencialItem || i + 1)) || i + 1,
      codigoTabela: String(proc.codigoTabela || '22'),
      codigoTuss: String(proc.codigoProcedimento || ''),
      descricao: String(proc.descricaoProcedimento || ''),
      quantidade: parseFloat(String(item.quantidadeExecutada || 1)) || 1,
      valorUnitario: parseFloat(String(item.valorUnitario || 0)) || 0,
      valorTotal: parseFloat(String(item.valorTotal || 0)) || 0,
      dataExecucao: item.dataExecucao != null ? String(item.dataExecucao) : undefined,
      cidPrincipal: proc.cidPrincipal != null ? String(proc.cidPrincipal) : undefined,
      viaAcesso: item.viaAcesso != null ? String(item.viaAcesso) : undefined,
      tecnicaUtilizada: item.tecnicaUtilizada != null ? String(item.tecnicaUtilizada) : undefined,
    });
  }

  return procedimentos;
}

/**
 * Extract a complete guide from an XML node.
 */
export function extractGuia(guiaNode: Record<string, any>, tipo: TissGuiaType): TissGuia {
  const cabGuia = findInObject(guiaNode, 'cabecalhoGuia') || {};
  const beneficiario = extractBeneficiario(guiaNode);
  const prestador = extractPrestador(guiaNode);
  const procedimentos = extractProcedimentos(guiaNode);

  // Calculate valorTotal from procedures (reliable source)
  const calculatedTotal = procedimentos.reduce((sum, p) => sum + p.valorTotal, 0);

  // Only use guide-level valorTotal (e.g. valorTotalGeral) if no procedures exist
  let valorTotal = calculatedTotal;
  if (procedimentos.length === 0) {
    const valorTotalNode = findInObject(guiaNode, 'valorTotal');
    if (typeof valorTotalNode === 'object') {
      valorTotal = parseFloat(String((valorTotalNode as any).valorTotalGeral || 0)) || 0;
    } else {
      valorTotal = parseFloat(String(valorTotalNode || 0)) || 0;
    }
  }

  const guia: TissGuia = {
    tipo,
    numeroGuiaPrestador: String(cabGuia.numeroGuiaPrestador || findInObject(guiaNode, 'numeroGuiaPrestador') || ''),
    numeroGuiaOperadora: cabGuia.numeroGuiaOperadora != null ? String(cabGuia.numeroGuiaOperadora) : undefined,
    registroANS: cabGuia.registroANS != null ? String(cabGuia.registroANS) : undefined,
    dataAtendimento: findInObject(guiaNode, 'dataAtendimento') != null
      ? String(findInObject(guiaNode, 'dataAtendimento'))
      : undefined,
    beneficiario,
    prestador,
    procedimentos,
    valorTotal,
  };

  // Internacao-specific fields
  if (tipo === 'internacao') {
    const dadosInt = findInObject(guiaNode, 'dadosInternacao') || {};
    guia.internacao = {
      dataInternacao: dadosInt.dataInternacao != null ? String(dadosInt.dataInternacao) : undefined,
      dataAlta: dadosInt.dataAlta != null ? String(dadosInt.dataAlta) : undefined,
      tipoInternacao: dadosInt.tipoInternacao != null ? String(dadosInt.tipoInternacao) : undefined,
      regimeInternacao: dadosInt.regimeInternacao != null ? String(dadosInt.regimeInternacao) : undefined,
      diarias: dadosInt.diarias != null ? parseInt(String(dadosInt.diarias)) : undefined,
    };
  }

  // Consulta-specific fields
  if (tipo === 'consulta') {
    const dadosCon = findInObject(guiaNode, 'dadosAtendimento') || {};
    guia.consulta = {
      tipoConsulta: dadosCon.tipoConsulta != null ? String(dadosCon.tipoConsulta) : undefined,
      indicacaoAcidente: dadosCon.indicacaoAcidente != null ? String(dadosCon.indicacaoAcidente) : undefined,
    };
  }

  return guia;
}

// ============================================================================
// Utilities
// ============================================================================

/**
 * Recursively find a field in a nested object.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- XML traversal returns dynamic structures
export function findInObject(obj: unknown, field: string): any {
  if (!obj || typeof obj !== 'object') return undefined;
  const record = obj as Record<string, unknown>;
  if (record[field] !== undefined) return record[field];

  for (const key of Object.keys(record)) {
    if (key.startsWith('@_')) continue; // Skip XML attributes
    const result = findInObject(record[key], field);
    if (result !== undefined) return result;
  }

  return undefined;
}
