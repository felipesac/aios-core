/**
 * Payment XML Parser
 * FinHealth Squad
 *
 * Parses payment/remittance XML files from health insurers
 * for reconciliation with sent guides. Handles multiple insurer formats.
 */

import { XMLParser } from 'fast-xml-parser';
import Decimal from 'decimal.js';
import { findInObject } from './tiss-xml-parser';

// ============================================================================
// Types
// ============================================================================

export type InsurerFormat = 'unimed' | 'amil' | 'bradesco' | 'sulamerica' | 'generic';

export interface PaymentGlosa {
  codigoGlosa: string;
  descricaoGlosa?: string;
  valorGlosa: number;
}

export interface PaymentItem {
  sequencial?: number;
  numeroGuia: string;
  numeroProtocolo?: string;
  codigoProcedimento?: string;
  descricaoProcedimento?: string;
  valorApresentado: number;
  valorProcessado: number;
  valorPago: number;
  valorGlosado: number;
  glosas: PaymentGlosa[];
  dataProcessamento?: string;
}

export interface PaymentFile {
  operadora: {
    codigoAns: string;
    nome: string;
  };
  prestador?: {
    codigoCnes?: string;
    nome?: string;
  };
  competencia: string;
  dataPagamento?: string;
  numeroLote?: string;
  valorTotalApresentado: number;
  valorTotalPago: number;
  valorTotalGlosado: number;
  itens: PaymentItem[];
}

export interface PaymentStats {
  totalApresentado: number;
  totalPago: number;
  totalGlosado: number;
  percentualGlosa: number;
}

export interface ParsePaymentResult {
  success: boolean;
  payment?: PaymentFile;
  errors: string[];
  warnings: string[];
  detectedFormat: InsurerFormat;
  itemCount: number;
  stats: PaymentStats;
}

// ============================================================================
// Field mappings per insurer
// ============================================================================

interface FieldMap {
  guia: string[];
  protocolo: string[];
  codigoProcedimento: string[];
  descricaoProcedimento: string[];
  valorApresentado: string[];
  valorProcessado: string[];
  valorPago: string[];
  valorGlosado: string[];
  codigoGlosa: string[];
  justificativaGlosa: string[];
  dataProcessamento: string[];
}

export const FIELD_MAPPINGS: Record<InsurerFormat, FieldMap> = {
  generic: {
    guia: ['numeroGuia', 'guia', 'nrGuia'],
    protocolo: ['numeroProtocolo', 'protocolo', 'nrProtocolo'],
    codigoProcedimento: ['codigoProcedimento', 'codProc', 'procedimento'],
    descricaoProcedimento: ['descricaoProcedimento', 'descProc', 'descricao'],
    valorApresentado: ['valorApresentado', 'vlApresentado', 'vrApresentado'],
    valorProcessado: ['valorProcessado', 'vlProcessado', 'vrProcessado'],
    valorPago: ['valorPago', 'vlPago', 'vrPago'],
    valorGlosado: ['valorGlosado', 'vlGlosado', 'vrGlosado'],
    codigoGlosa: ['codigoGlosa', 'codGlosa', 'glosa'],
    justificativaGlosa: ['justificativaGlosa', 'justificativa', 'motivoGlosa'],
    dataProcessamento: ['dataProcessamento', 'dtProcessamento', 'dtProc'],
  },
  unimed: {
    guia: ['nrGuia', 'numeroGuia', 'guia'],
    protocolo: ['nrProtocolo', 'protocolo'],
    codigoProcedimento: ['cdProcedimento', 'codigoProcedimento'],
    descricaoProcedimento: ['dsProcedimento', 'descricaoProcedimento'],
    valorApresentado: ['vlApresentado', 'valorApresentado'],
    valorProcessado: ['vlProcessado', 'valorProcessado'],
    valorPago: ['vlPago', 'valorPago'],
    valorGlosado: ['vlGlosa', 'vlGlosado', 'valorGlosado'],
    codigoGlosa: ['cdGlosa', 'codigoGlosa'],
    justificativaGlosa: ['dsGlosa', 'justificativaGlosa'],
    dataProcessamento: ['dtProcessamento', 'dataProcessamento'],
  },
  amil: {
    guia: ['guia', 'numeroGuia', 'nrGuia'],
    protocolo: ['protocolo', 'numeroProtocolo'],
    codigoProcedimento: ['codProc', 'codigoProcedimento'],
    descricaoProcedimento: ['descProc', 'descricaoProcedimento'],
    valorApresentado: ['vrApresentado', 'valorApresentado'],
    valorProcessado: ['vrProcessado', 'valorProcessado'],
    valorPago: ['vrPago', 'valorPago'],
    valorGlosado: ['vrGlosado', 'valorGlosado'],
    codigoGlosa: ['cdGlosa', 'codigoGlosa'],
    justificativaGlosa: ['justificativa', 'justificativaGlosa'],
    dataProcessamento: ['dtProc', 'dataProcessamento'],
  },
  bradesco: {
    guia: ['numeroGuia', 'guia'],
    protocolo: ['numeroProtocolo', 'protocolo'],
    codigoProcedimento: ['codigoProcedimento', 'codProc'],
    descricaoProcedimento: ['descricaoProcedimento', 'descProc'],
    valorApresentado: ['valorApresentado', 'vlApresentado'],
    valorProcessado: ['valorProcessado', 'vlProcessado'],
    valorPago: ['valorPago', 'vlPago'],
    valorGlosado: ['valorGlosado', 'vlGlosado'],
    codigoGlosa: ['codigoGlosa', 'codGlosa'],
    justificativaGlosa: ['justificativaGlosa', 'justificativa'],
    dataProcessamento: ['dataProcessamento', 'dtProcessamento'],
  },
  sulamerica: {
    guia: ['guia', 'numeroGuia'],
    protocolo: ['protocolo', 'numeroProtocolo'],
    codigoProcedimento: ['codigoProcedimento', 'codProc'],
    descricaoProcedimento: ['descricaoProcedimento', 'descProc'],
    valorApresentado: ['valorApresentado', 'vlApresentado'],
    valorProcessado: ['valorProcessado', 'vlProcessado'],
    valorPago: ['valorPago', 'vlPago'],
    valorGlosado: ['valorGlosado', 'vlGlosado'],
    codigoGlosa: ['codigoGlosa', 'codGlosa'],
    justificativaGlosa: ['justificativaGlosa', 'justificativa'],
    dataProcessamento: ['dataProcessamento', 'dtProcessamento'],
  },
};

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

// ============================================================================
// Main parser
// ============================================================================

/**
 * Parse a payment XML file from an insurer.
 */
export function parsePaymentXml(
  xmlContent: string,
  formatHint?: InsurerFormat,
): ParsePaymentResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const emptyStats: PaymentStats = { totalApresentado: 0, totalPago: 0, totalGlosado: 0, percentualGlosa: 0 };

  if (!xmlContent || !xmlContent.trim()) {
    return { success: false, errors: ['Empty XML content'], warnings, detectedFormat: 'generic', itemCount: 0, stats: emptyStats };
  }

  let parsed: Record<string, any>;
  try {
    const parser = new XMLParser(PARSER_OPTIONS);
    parsed = parser.parse(xmlContent.replace(/^\uFEFF/, ''));
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    return {
      success: false,
      errors: [`Payment XML parsing error: ${msg}`],
      warnings,
      detectedFormat: 'generic',
      itemCount: 0,
      stats: emptyStats,
    };
  }

  const detectedFormat = formatHint || detectInsurerFormat(parsed);
  const items = extractPaymentItems(parsed, detectedFormat);

  if (items.length === 0) {
    warnings.push('No payment items found in XML');
  }

  // Extract header info
  const demonstrativo = findInObject(parsed, 'demonstrativoPagamento')
    || findInObject(parsed, 'demonstrativoRetorno')
    || findInObject(parsed, 'loteGuias')
    || parsed;

  const operadoraNode = findInObject(demonstrativo, 'operadora')
    || findInObject(demonstrativo, 'dadosOperadora')
    || {};

  const prestadorNode = findInObject(demonstrativo, 'prestador')
    || findInObject(demonstrativo, 'dadosPrestador')
    || {};

  const stats = calculatePaymentStats(items);

  const payment: PaymentFile = {
    operadora: {
      codigoAns: String(operadoraNode.codigoAns || operadoraNode.registroANS || findInObject(operadoraNode, 'registroANS') || ''),
      nome: String(operadoraNode.nome || operadoraNode.nomeOperadora || findInObject(operadoraNode, 'nomeOperadora') || ''),
    },
    prestador: {
      codigoCnes: prestadorNode.codigoCnes ? String(prestadorNode.codigoCnes) : undefined,
      nome: prestadorNode.nome || prestadorNode.nomePrestador ? String(prestadorNode.nome || prestadorNode.nomePrestador) : undefined,
    },
    competencia: String(findInObject(demonstrativo, 'competencia') || findInObject(demonstrativo, 'mesCompetencia') || ''),
    dataPagamento: findInObject(demonstrativo, 'dataPagamento') != null
      ? String(findInObject(demonstrativo, 'dataPagamento'))
      : undefined,
    numeroLote: findInObject(demonstrativo, 'numeroLote') != null
      ? String(findInObject(demonstrativo, 'numeroLote'))
      : undefined,
    valorTotalApresentado: stats.totalApresentado,
    valorTotalPago: stats.totalPago,
    valorTotalGlosado: stats.totalGlosado,
    itens: items,
  };

  return {
    success: true,
    payment,
    errors,
    warnings,
    detectedFormat,
    itemCount: items.length,
    stats,
  };
}

// ============================================================================
// Format detection
// ============================================================================

/**
 * Detect insurer format from parsed XML structure.
 */
export function detectInsurerFormat(parsed: Record<string, any>): InsurerFormat {
  // Unimed uses specific field prefixes and structure
  if (findInObject(parsed, 'vlApresentado') !== undefined || findInObject(parsed, 'nrGuia') !== undefined) {
    return 'unimed';
  }

  // Bradesco uses standard TISS field names with specific root elements
  if (findInObject(parsed, 'demonstrativoRetorno') !== undefined) {
    return 'bradesco';
  }

  // Amil uses vr-prefixed values
  if (findInObject(parsed, 'vrApresentado') !== undefined || findInObject(parsed, 'vrPago') !== undefined) {
    return 'amil';
  }

  // SulAmerica detection
  if (findInObject(parsed, 'sulamerica') !== undefined) {
    return 'sulamerica';
  }

  return 'generic';
}

// ============================================================================
// Item extraction
// ============================================================================

/**
 * Extract payment items from parsed XML using format-specific field names.
 */
export function extractPaymentItems(
  parsed: Record<string, any>,
  format: InsurerFormat,
): PaymentItem[] {
  const items: PaymentItem[] = [];

  // Find the items container
  const container = findInObject(parsed, 'itensDemonstrativo')
    || findInObject(parsed, 'itens')
    || findInObject(parsed, 'guiasPagamento')
    || findInObject(parsed, 'procedimentosPagos');

  if (!container) return items;

  // Find item nodes
  const itemKey = findItemKey(container);
  if (!itemKey) return items;

  const rawItems = Array.isArray(container[itemKey]) ? container[itemKey] : [container[itemKey]];

  for (let i = 0; i < rawItems.length; i++) {
    if (!rawItems[i] || typeof rawItems[i] !== 'object') continue;
    items.push(normalizePaymentItem(rawItems[i], format, i + 1));
  }

  return items;
}

/**
 * Find the key containing item objects within the container.
 */
function findItemKey(container: Record<string, any>): string | null {
  const candidates = ['item', 'guia', 'procedimento', 'itemDemonstrativo', 'pagamento'];
  for (const key of candidates) {
    if (container[key] !== undefined) return key;
  }
  // If the container itself has array-like content, try first non-attribute key
  for (const key of Object.keys(container)) {
    if (!key.startsWith('@_') && (Array.isArray(container[key]) || typeof container[key] === 'object')) {
      return key;
    }
  }
  return null;
}

/**
 * Normalize a raw payment item using format-specific field mappings.
 */
export function normalizePaymentItem(
  raw: Record<string, any>,
  format: InsurerFormat,
  sequencial?: number,
): PaymentItem {
  const mapping = FIELD_MAPPINGS[format];

  const resolveField = (candidates: string[]): unknown => {
    for (const field of candidates) {
      if (raw[field] !== undefined) return raw[field];
    }
    return undefined;
  };

  const valorApresentado = parseFloat(String(resolveField(mapping.valorApresentado) || 0)) || 0;
  const valorPago = parseFloat(String(resolveField(mapping.valorPago) || 0)) || 0;
  const valorGlosado = parseFloat(String(resolveField(mapping.valorGlosado) || 0)) || 0;
  const valorProcessado = parseFloat(String(resolveField(mapping.valorProcessado) || valorApresentado)) || 0;

  // Extract glosas
  const glosas: PaymentGlosa[] = [];
  const codigoGlosa = resolveField(mapping.codigoGlosa);
  if (codigoGlosa) {
    glosas.push({
      codigoGlosa: String(codigoGlosa),
      descricaoGlosa: resolveField(mapping.justificativaGlosa)
        ? String(resolveField(mapping.justificativaGlosa))
        : undefined,
      valorGlosa: valorGlosado,
    });
  }

  return {
    sequencial,
    numeroGuia: String(resolveField(mapping.guia) || ''),
    numeroProtocolo: resolveField(mapping.protocolo) != null ? String(resolveField(mapping.protocolo)) : undefined,
    codigoProcedimento: resolveField(mapping.codigoProcedimento) != null
      ? String(resolveField(mapping.codigoProcedimento))
      : undefined,
    descricaoProcedimento: resolveField(mapping.descricaoProcedimento) != null
      ? String(resolveField(mapping.descricaoProcedimento))
      : undefined,
    valorApresentado,
    valorProcessado,
    valorPago,
    valorGlosado,
    glosas,
    dataProcessamento: resolveField(mapping.dataProcessamento) != null
      ? String(resolveField(mapping.dataProcessamento))
      : undefined,
  };
}

// ============================================================================
// Stats calculation
// ============================================================================

/**
 * Calculate payment statistics from items using precise decimal arithmetic.
 */
export function calculatePaymentStats(items: PaymentItem[]): PaymentStats {
  if (items.length === 0) {
    return { totalApresentado: 0, totalPago: 0, totalGlosado: 0, percentualGlosa: 0 };
  }

  let totalApresentado = new Decimal(0);
  let totalPago = new Decimal(0);
  let totalGlosado = new Decimal(0);

  for (const item of items) {
    totalApresentado = totalApresentado.plus(item.valorApresentado);
    totalPago = totalPago.plus(item.valorPago);
    totalGlosado = totalGlosado.plus(item.valorGlosado);
  }

  const percentualGlosa = totalApresentado.isZero()
    ? 0
    : totalGlosado.dividedBy(totalApresentado).times(100).toDecimalPlaces(2).toNumber();

  return {
    totalApresentado: totalApresentado.toNumber(),
    totalPago: totalPago.toNumber(),
    totalGlosado: totalGlosado.toNumber(),
    percentualGlosa,
  };
}
