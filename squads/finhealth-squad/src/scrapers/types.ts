/**
 * Scraper Types
 * FinHealth Squad
 *
 * Shared types, DI interfaces, and domain types for all data scrapers.
 */

// ============================================================================
// Dependency Injection Interfaces
// ============================================================================

export interface HttpClient {
  get(url: string, config?: { headers?: Record<string, string>; timeout?: number }): Promise<{ data: string }>;
}

export interface LlmClient {
  chatCompletion(params: {
    model: string;
    messages: Array<{ role: 'system' | 'user'; content: string }>;
    responseFormat?: { type: string };
    temperature?: number;
  }): Promise<{ content: string | null }>;
}

export interface FileSystem {
  readFile(filePath: string): Promise<string>;
  writeFile(filePath: string, data: string): Promise<void>;
  exists(filePath: string): Promise<boolean>;
}

export interface Logger {
  info(message: string): void;
  warn(message: string): void;
  error(message: string): void;
}

// ============================================================================
// Scraper Configuration & Results
// ============================================================================

export type ScrapeSource = 'scraper' | 'llm_fallback';

export interface ScrapeResult<TData> {
  success: boolean;
  source: ScrapeSource;
  data: TData;
  errors: string[];
  warnings: string[];
  timestamp: Date;
  needsMaintenance: boolean;
}

export interface ScraperConfig {
  urls: Record<string, string>;
  outputPath: string;
  name: string;
  userAgent?: string;
  timeout?: number;
  llmModel?: string;
}

export interface ScraperDeps {
  httpClient: HttpClient;
  llmClient: LlmClient;
  fileSystem: FileSystem;
  logger: Logger;
}

export interface ValidationResult {
  isValid: boolean;
  warnings: string[];
}

// ============================================================================
// Domain Types — ANS / TUSS
// ============================================================================

export interface TussProcedure {
  codigo: string;
  descricao: string;
  tipo: string;
  porte?: string;
  valor_referencia?: number;
  requer_autorizacao?: boolean;
}

// ============================================================================
// Domain Types — CBHPM
// ============================================================================

export interface CbhpmProcedure {
  codigo: string;
  descricao: string;
  porte: string;
  uch: number;
  valor_porte: number;
  custo_operacional: number;
  filme?: number;
  auxiliares?: number;
}

export interface PorteInfo {
  porte: string;
  uch: number;
  valor: number;
  co: number;
  filme: number;
}

export interface CbhpmData {
  procedures: CbhpmProcedure[];
  portes: Record<string, PorteInfo>;
  uch_valor: number;
}

// ============================================================================
// Domain Types — DATASUS / SIGTAP
// ============================================================================

export interface SigtapProcedure {
  codigo: string;
  descricao: string;
  grupo: string;
  subgrupo: string;
  forma_organizacao: string;
  valor_sh: number;
  valor_sp: number;
  valor_total: number;
  complexidade: 'AB' | 'MC' | 'AC';
}

// ============================================================================
// Scraper Manager Types
// ============================================================================

export interface ScraperManagerConfig {
  dataDir: string;
  httpClient?: HttpClient;
  llmClient?: LlmClient;
  fileSystem?: FileSystem;
  logger?: Logger;
  llmModel?: string;
}

export interface ScraperManagerResult {
  ans: ScrapeResult<TussProcedure[]>;
  cbhpm: ScrapeResult<CbhpmData>;
  datasus: ScrapeResult<SigtapProcedure[]>;
  summary: {
    totalScrapers: number;
    successCount: number;
    failureCount: number;
    maintenanceNeeded: string[];
    durationMs: number;
  };
}
