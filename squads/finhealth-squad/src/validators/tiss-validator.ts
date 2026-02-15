/**
 * TISS Validator
 * FinHealth Squad
 *
 * Validates TISS guides against ANS structural rules, TUSS reference data,
 * CBHPM values, and configurable business rules.
 * All functions are pure and synchronous — reference data is passed in.
 */

import Decimal from 'decimal.js';
import * as fs from 'fs';
import * as path from 'path';
import type { TissGuia, TissProcedimento } from '../parsers/tiss-xml-parser';

// ============================================================================
// Types
// ============================================================================

export type ErrorSeverity = 'critico' | 'alerta' | 'info';

export interface ValidationError {
  campo: string;
  tipo: ErrorSeverity;
  codigo: string;
  mensagem: string;
  sugestaoCorrecao?: string;
  referenciaNormativa?: string;
}

export interface ValidationResult {
  valida: boolean;
  scoreConfianca: number;
  erros: ValidationError[];
  valorTotalCalculado: number;
  valorTotalInformado: number;
  divergenciaValor: number;
  tempoProcessamentoMs: number;
}

export interface TussEntry {
  codigo: string;
  descricao: string;
  tipo: string;
  porte?: string;
  valor_referencia: number;
  requer_autorizacao?: boolean;
}

export interface CbhpmPorte {
  uch: number;
  valor: number;
  co: number;
  filme: number;
}

export interface CbhpmData {
  uch_valor: number;
  portes: Record<string, CbhpmPorte>;
}

export interface ValidatorConfig {
  toleranciaValor?: number;
  maxProcedimentosPorGuia?: number;
  verificarAutorizacao?: boolean;
  verificarDuplicidade?: boolean;
  limiteQuantidade?: Record<string, number>;
}

// ============================================================================
// Error codes
// ============================================================================

export const ERROR_CODES = {
  E001: 'Campo obrigatório ausente',
  E002: 'Código TUSS inválido',
  E003: 'Código CID inválido',
  E004: 'Incompatibilidade CID-Procedimento',
  E005: 'Valor acima da tabela de referência',
  E006: 'Cobrança em duplicidade',
  E007: 'Limite de quantidade excedido',
  E008: 'Sem autorização prévia',
  E009: 'Carência não cumprida',
  E010: 'Formato de data incorreto',
  E011: 'Data de execução futura',
  E012: 'Quantidade inválida',
  E013: 'Valor unitário inválido',
  E014: 'Número máximo de procedimentos excedido',
} as const;

// ============================================================================
// Default config
// ============================================================================

const DEFAULT_CONFIG: Required<ValidatorConfig> = {
  toleranciaValor: 0.05,
  maxProcedimentosPorGuia: 99,
  verificarAutorizacao: true,
  verificarDuplicidade: true,
  limiteQuantidade: {},
};

// ============================================================================
// Main validator
// ============================================================================

/**
 * Validate a TISS guide completely.
 */
export function validateTissGuia(
  guia: TissGuia,
  tussTable: TussEntry[],
  cbhpmData?: CbhpmData,
  config?: ValidatorConfig,
): ValidationResult {
  const startTime = Date.now();
  const mergedConfig = { ...DEFAULT_CONFIG, ...config };
  const erros: ValidationError[] = [];

  // 1. Structural validation
  erros.push(...validateStructure(guia, mergedConfig));

  // 2. Code validation
  erros.push(...validateCodes(guia, tussTable));

  // 3. Business rules validation
  erros.push(...validateBusinessRules(guia, tussTable, mergedConfig));

  // 4. Financial validation
  const { valorCalculado, errosFinanceiros } = validateFinancial(
    guia,
    tussTable,
    cbhpmData,
    mergedConfig.toleranciaValor,
  );
  erros.push(...errosFinanceiros);

  const scoreConfianca = calculateConfidenceScore(erros);

  return {
    valida: erros.filter(e => e.tipo === 'critico').length === 0,
    scoreConfianca,
    erros,
    valorTotalCalculado: valorCalculado,
    valorTotalInformado: guia.valorTotal,
    divergenciaValor: new Decimal(valorCalculado).minus(guia.valorTotal).abs().toNumber(),
    tempoProcessamentoMs: Date.now() - startTime,
  };
}

// ============================================================================
// Structural validation
// ============================================================================

/**
 * Validate required fields based on guide type.
 */
export function validateStructure(
  guia: TissGuia,
  config?: ValidatorConfig,
): ValidationError[] {
  const erros: ValidationError[] = [];
  const mergedConfig = { ...DEFAULT_CONFIG, ...config };

  // Required for all guide types
  if (!guia.numeroGuiaPrestador) {
    erros.push({
      campo: 'numeroGuiaPrestador',
      tipo: 'critico',
      codigo: 'E001',
      mensagem: 'Número da guia do prestador é obrigatório',
      sugestaoCorrecao: 'Informar o número da guia',
    });
  }

  if (!guia.beneficiario?.numeroCarteira) {
    erros.push({
      campo: 'beneficiario.numeroCarteira',
      tipo: 'critico',
      codigo: 'E001',
      mensagem: 'Número da carteira do beneficiário é obrigatório',
    });
  }

  if (!guia.prestador?.codigoCnes) {
    erros.push({
      campo: 'prestador.codigoCnes',
      tipo: 'critico',
      codigo: 'E001',
      mensagem: 'CNES do prestador é obrigatório',
    });
  }

  if (!guia.procedimentos || guia.procedimentos.length === 0) {
    erros.push({
      campo: 'procedimentos',
      tipo: 'critico',
      codigo: 'E001',
      mensagem: 'Pelo menos um procedimento é obrigatório',
    });
  }

  // Check procedure count limit
  if (guia.procedimentos && guia.procedimentos.length > mergedConfig.maxProcedimentosPorGuia) {
    erros.push({
      campo: 'procedimentos',
      tipo: 'critico',
      codigo: 'E014',
      mensagem: `Número de procedimentos (${guia.procedimentos.length}) excede o máximo de ${mergedConfig.maxProcedimentosPorGuia}`,
    });
  }

  // Validate each procedure's basic fields
  if (guia.procedimentos) {
    for (const proc of guia.procedimentos) {
      if (proc.quantidade <= 0) {
        erros.push({
          campo: `procedimentos.${proc.codigoTuss}.quantidade`,
          tipo: 'critico',
          codigo: 'E012',
          mensagem: `Quantidade inválida para procedimento ${proc.codigoTuss}: ${proc.quantidade}`,
          sugestaoCorrecao: 'Informar quantidade maior que zero',
        });
      }

      if (proc.valorUnitario < 0) {
        erros.push({
          campo: `procedimentos.${proc.codigoTuss}.valorUnitario`,
          tipo: 'critico',
          codigo: 'E013',
          mensagem: `Valor unitário inválido para procedimento ${proc.codigoTuss}: ${proc.valorUnitario}`,
          sugestaoCorrecao: 'Informar valor unitário não negativo',
        });
      }
    }
  }

  // Internacao-specific checks
  if (guia.tipo === 'internacao') {
    if (!guia.internacao?.dataInternacao) {
      erros.push({
        campo: 'internacao.dataInternacao',
        tipo: 'critico',
        codigo: 'E001',
        mensagem: 'Data de internação é obrigatória para guia de internação',
      });
    }
    if (!guia.internacao?.dataAlta) {
      erros.push({
        campo: 'internacao.dataAlta',
        tipo: 'alerta',
        codigo: 'E001',
        mensagem: 'Data de alta não informada para guia de internação',
        sugestaoCorrecao: 'Informar data de alta quando disponível',
      });
    }
  }

  return erros;
}

// ============================================================================
// Code validation
// ============================================================================

/**
 * Validate TUSS and CID codes against reference tables.
 */
export function validateCodes(
  guia: TissGuia,
  tussTable: TussEntry[],
): ValidationError[] {
  const erros: ValidationError[] = [];

  if (!guia.procedimentos) return erros;

  for (const proc of guia.procedimentos) {
    // Validate TUSS code format (8 digits)
    if (!/^\d{8}$/.test(proc.codigoTuss)) {
      erros.push({
        campo: `procedimentos.${proc.codigoTuss}.codigoTuss`,
        tipo: 'critico',
        codigo: 'E002',
        mensagem: `Código TUSS '${proc.codigoTuss}' não possui formato válido (8 dígitos)`,
        sugestaoCorrecao: 'Verificar código na tabela TUSS vigente',
        referenciaNormativa: 'RN 465/2021 ANS',
      });
      continue;
    }

    // Validate TUSS code exists in reference table
    const tussEntry = tussTable.find(t => t.codigo === proc.codigoTuss);
    if (!tussEntry) {
      erros.push({
        campo: `procedimentos.${proc.codigoTuss}.codigoTuss`,
        tipo: 'critico',
        codigo: 'E002',
        mensagem: `Código TUSS ${proc.codigoTuss} não encontrado na tabela de referência`,
        sugestaoCorrecao: 'Verificar código na tabela TUSS vigente',
        referenciaNormativa: 'RN 465/2021 ANS',
      });
    }

    // Validate CID format if present (letter + 2-3 digits + optional .digit)
    if (proc.cidPrincipal && !/^[A-Z]\d{2}(\.\d{1,2})?$/i.test(proc.cidPrincipal)) {
      erros.push({
        campo: `procedimentos.${proc.codigoTuss}.cidPrincipal`,
        tipo: 'alerta',
        codigo: 'E003',
        mensagem: `Formato de CID inválido: '${proc.cidPrincipal}'`,
        sugestaoCorrecao: 'CID deve seguir formato: letra + 2-3 dígitos (ex: J18.0)',
      });
    }
  }

  return erros;
}

// ============================================================================
// Business rules validation
// ============================================================================

/**
 * Validate business rules (duplicates, authorization, quantities, dates).
 */
export function validateBusinessRules(
  guia: TissGuia,
  tussTable?: TussEntry[],
  config?: ValidatorConfig,
): ValidationError[] {
  const erros: ValidationError[] = [];
  const mergedConfig = { ...DEFAULT_CONFIG, ...config };

  if (!guia.procedimentos) return erros;

  // Check for duplicates (same code + same date)
  if (mergedConfig.verificarDuplicidade) {
    const procedimentosCounts = new Map<string, number>();
    for (const proc of guia.procedimentos) {
      const key = `${proc.codigoTuss}-${proc.dataExecucao || guia.dataAtendimento || 'sem-data'}`;
      procedimentosCounts.set(key, (procedimentosCounts.get(key) || 0) + 1);
    }

    for (const [key, count] of procedimentosCounts) {
      if (count > 1) {
        const code = key.split('-')[0];
        erros.push({
          campo: 'procedimentos',
          tipo: 'alerta',
          codigo: 'E006',
          mensagem: `Possível duplicidade: procedimento ${code} aparece ${count} vezes na mesma data`,
          sugestaoCorrecao: 'Verificar se a cobrança em duplicidade é intencional',
        });
      }
    }
  }

  // Check quantity limits
  if (Object.keys(mergedConfig.limiteQuantidade).length > 0) {
    for (const proc of guia.procedimentos) {
      const limit = mergedConfig.limiteQuantidade[proc.codigoTuss];
      if (limit !== undefined && proc.quantidade > limit) {
        erros.push({
          campo: `procedimentos.${proc.codigoTuss}.quantidade`,
          tipo: 'alerta',
          codigo: 'E007',
          mensagem: `Quantidade ${proc.quantidade} excede o limite de ${limit} para o procedimento ${proc.codigoTuss}`,
          sugestaoCorrecao: `Reduzir quantidade para ${limit} ou justificar excedente`,
        });
      }
    }
  }

  // Check authorization requirements
  if (mergedConfig.verificarAutorizacao && tussTable) {
    for (const proc of guia.procedimentos) {
      const tussEntry = tussTable.find(t => t.codigo === proc.codigoTuss);
      if (tussEntry?.requer_autorizacao) {
        erros.push({
          campo: `procedimentos.${proc.codigoTuss}`,
          tipo: 'alerta',
          codigo: 'E008',
          mensagem: `Procedimento ${proc.codigoTuss} (${tussEntry.descricao}) requer autorização prévia`,
          sugestaoCorrecao: 'Verificar se há autorização previamente concedida',
          referenciaNormativa: 'RN 395/2016 ANS',
        });
      }
    }
  }

  // Check for future execution dates
  const today = new Date().toISOString().split('T')[0];
  for (const proc of guia.procedimentos) {
    const execDate = proc.dataExecucao || guia.dataAtendimento;
    if (execDate && execDate > today) {
      erros.push({
        campo: `procedimentos.${proc.codigoTuss}.dataExecucao`,
        tipo: 'critico',
        codigo: 'E011',
        mensagem: `Data de execução ${execDate} é posterior à data atual`,
        sugestaoCorrecao: 'Corrigir data de execução do procedimento',
      });
    }
  }

  return erros;
}

// ============================================================================
// Financial validation
// ============================================================================

/**
 * Validate financial values against reference tables.
 */
export function validateFinancial(
  guia: TissGuia,
  tussTable: TussEntry[],
  cbhpmData?: CbhpmData,
  toleranciaValor?: number,
): { valorCalculado: number; errosFinanceiros: ValidationError[] } {
  const erros: ValidationError[] = [];
  const tolerancia = toleranciaValor ?? DEFAULT_CONFIG.toleranciaValor;
  let valorCalculado = new Decimal(0);

  if (!guia.procedimentos) {
    return { valorCalculado: 0, errosFinanceiros: erros };
  }

  for (const proc of guia.procedimentos) {
    const tussEntry = tussTable.find(t => t.codigo === proc.codigoTuss);
    if (!tussEntry) continue;

    const valorReferencia = new Decimal(tussEntry.valor_referencia || 0);
    const valorUnitario = new Decimal(proc.valorUnitario);
    const quantidade = new Decimal(proc.quantidade);

    // Use CBHPM porte value if available and more specific
    let valorRefFinal = valorReferencia;
    if (cbhpmData && tussEntry.porte) {
      const porte = cbhpmData.portes[tussEntry.porte];
      if (porte) {
        const cbhpmValor = new Decimal(porte.valor).plus(porte.co).plus(porte.filme);
        if (cbhpmValor.greaterThan(0)) {
          valorRefFinal = cbhpmValor;
        }
      }
    }

    const valorProcedimento = valorUnitario.times(quantidade);
    valorCalculado = valorCalculado.plus(valorRefFinal.times(quantidade));

    // Check if value is above reference
    if (valorRefFinal.greaterThan(0) && valorUnitario.greaterThan(valorRefFinal.times(1 + tolerancia))) {
      erros.push({
        campo: `procedimentos.${proc.codigoTuss}.valorUnitario`,
        tipo: 'alerta',
        codigo: 'E005',
        mensagem: `Valor R$ ${valorUnitario.toFixed(2)} acima da referência R$ ${valorRefFinal.toFixed(2)} (+${tolerancia * 100}% tolerância)`,
        sugestaoCorrecao: 'Ajustar para valor contratual ou justificar divergência',
      });
    }
  }

  return { valorCalculado: valorCalculado.toNumber(), errosFinanceiros: erros };
}

// ============================================================================
// Confidence score
// ============================================================================

/**
 * Calculate confidence score based on error severity.
 * Score: 100 - (criticos × 25) - (alertas × 10) - (infos × 2)
 */
export function calculateConfidenceScore(erros: ValidationError[]): number {
  const criticos = erros.filter(e => e.tipo === 'critico').length;
  const alertas = erros.filter(e => e.tipo === 'alerta').length;
  const infos = erros.filter(e => e.tipo === 'info').length;

  let score = 100;
  score -= criticos * 25;
  score -= alertas * 10;
  score -= infos * 2;

  return Math.max(0, Math.min(100, score));
}

// ============================================================================
// Reference data loaders
// ============================================================================

/**
 * Load TUSS reference table from data directory.
 */
export function loadTussTable(dataDir: string): TussEntry[] {
  const filePath = path.join(dataDir, 'tuss-procedures.json');
  const raw = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  return raw.procedures || [];
}

/**
 * Load CBHPM reference data from data directory.
 */
export function loadCbhpmData(dataDir: string): CbhpmData {
  const filePath = path.join(dataDir, 'cbhpm-values.json');
  const raw = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  return {
    uch_valor: raw.uch_valor || 0.55,
    portes: raw.portes || {},
  };
}
