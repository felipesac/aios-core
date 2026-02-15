/**
 * Structured Logger
 * FinHealth Squad
 *
 * JSON-structured logging that implements the Logger interface from scrapers/types.ts.
 */

import type { Logger } from './scrapers/types';

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

const LOG_LEVELS: Record<LogLevel, number> = { debug: 0, info: 1, warn: 2, error: 3 };

function shouldLog(level: LogLevel): boolean {
  const minLevel = (process.env.LOG_LEVEL || 'info') as LogLevel;
  return LOG_LEVELS[level] >= (LOG_LEVELS[minLevel] ?? 1);
}

function emit(level: LogLevel, message: string, meta?: Record<string, unknown>): void {
  const entry = JSON.stringify({ level, message, timestamp: new Date().toISOString(), ...meta });
  if (level === 'error') console.error(entry);
  else if (level === 'warn') console.warn(entry);
  else console.log(entry);
}

export const logger = {
  debug(message: string, meta?: Record<string, unknown>) { if (shouldLog('debug')) emit('debug', message, meta); },
  info(message: string, meta?: Record<string, unknown>) { if (shouldLog('info')) emit('info', message, meta); },
  warn(message: string, meta?: Record<string, unknown>) { if (shouldLog('warn')) emit('warn', message, meta); },
  error(message: string, meta?: Record<string, unknown>) { if (shouldLog('error')) emit('error', message, meta); },
};

/**
 * Create a Logger instance (matches scrapers/types.ts interface) with agent context.
 */
export function createAgentLogger(agentId: string, taskName?: string): Logger {
  const ctx = { agentId, taskName };
  return {
    info: (msg: string) => logger.info(msg, ctx),
    warn: (msg: string) => logger.warn(msg, ctx),
    error: (msg: string) => logger.error(msg, ctx),
  };
}
