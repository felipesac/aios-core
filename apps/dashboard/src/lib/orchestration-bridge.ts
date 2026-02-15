/**
 * Orchestration Bridge
 * Dashboard → AIOS Core CommonJS Interop
 *
 * Bridges Next.js TypeScript API routes to AIOS Core CommonJS
 * orchestration modules (SquadExecutor, AgentInvoker, SquadLoader).
 *
 * Uses require() for CommonJS interop and lazy singleton pattern
 * to avoid re-initialization on every request.
 */

import path from 'path';

// ============================================================================
// TypeScript Interfaces for Orchestration Return Types
// ============================================================================

export interface SquadTaskResult {
  success: boolean;
  output: unknown;
  errors?: string[];
  metadata?: Record<string, unknown>;
}

export interface AgentInvocationResult {
  success: boolean;
  invocationId: string;
  agentName: string;
  taskPath: string;
  result?: unknown;
  error?: string;
  duration: number;
}

export interface AgentConfig {
  name: string;
  displayName: string;
  file: string;
  capabilities: string[];
  isSquadAgent?: boolean;
  squadName?: string;
  squadAgentId?: string;
}

export interface SquadInfo {
  name: string;
  path: string;
  manifestPath: string;
}

export interface SquadManifest {
  name: string;
  version: string;
  description: string;
  slashPrefix: string;
  components: {
    agents: string[];
    tasks: string[];
    workflows: string[];
  };
  tags?: string[];
}

export interface InvocationSummary {
  total: number;
  byStatus: Record<string, number>;
  byAgent: Record<string, number>;
  totalDuration: number;
  averageDuration: number;
}

// ============================================================================
// Project Root Resolution
// ============================================================================

export function getProjectRoot(): string {
  if (process.env.AIOS_PROJECT_ROOT) {
    return process.env.AIOS_PROJECT_ROOT;
  }
  // Default: assume running from apps/dashboard/
  return path.resolve(process.cwd(), '..', '..');
}

// ============================================================================
// Module Loaders
// ============================================================================

// Dynamic require that webpack cannot statically analyze at build time.
// These modules live outside the dashboard package (in .aios-core/) and
// are only available at runtime when the AIOS project is present.
// eslint-disable-next-line @typescript-eslint/no-implied-eval, no-new-func
const dynamicRequire = new Function('id', 'return require(id)') as NodeRequire;

function requireOrchestration(moduleName: string) {
  const projectRoot = getProjectRoot();
  const modulePath = path.join(
    projectRoot,
    '.aios-core',
    'core',
    'orchestration',
    moduleName,
  );
  return dynamicRequire(modulePath);
}

function requireSquadLoader() {
  const projectRoot = getProjectRoot();
  const loaderPath = path.join(
    projectRoot,
    '.aios-core',
    'development',
    'scripts',
    'squad',
    'squad-loader',
  );
  return dynamicRequire(loaderPath);
}

// ============================================================================
// Lazy Singleton Instances
// ============================================================================

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let cachedInvoker: any = null;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let cachedSquadExecutor: any = null;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let cachedSquadLoader: any = null;
let squadsLoaded = false;

/**
 * Get or create AgentInvoker singleton.
 * Auto-loads squads on first access.
 */
export async function getAgentInvoker() {
  if (!cachedInvoker) {
    const { AgentInvoker } = requireOrchestration('agent-invoker');
    const projectRoot = getProjectRoot();
    cachedInvoker = new AgentInvoker({ projectRoot });
  }

  if (!squadsLoaded) {
    await cachedInvoker.loadSquads();
    squadsLoaded = true;
  }

  return cachedInvoker;
}

/**
 * Get or create SquadExecutor singleton.
 */
export function getSquadExecutor() {
  if (!cachedSquadExecutor) {
    const { SquadExecutor } = requireOrchestration('squad-executor');
    const projectRoot = getProjectRoot();
    cachedSquadExecutor = new SquadExecutor({ projectRoot });
  }
  return cachedSquadExecutor;
}

/**
 * Get or create SquadLoader singleton.
 */
export function getSquadLoader() {
  if (!cachedSquadLoader) {
    const { SquadLoader } = requireSquadLoader();
    const projectRoot = getProjectRoot();
    cachedSquadLoader = new SquadLoader({
      squadsPath: path.join(projectRoot, 'squads'),
    });
  }
  return cachedSquadLoader;
}

/**
 * Reset all cached instances (useful for testing).
 */
export function resetBridge() {
  cachedInvoker = null;
  cachedSquadExecutor = null;
  cachedSquadLoader = null;
  squadsLoaded = false;
}
