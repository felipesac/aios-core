import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { logger, createAgentLogger } from './logger';

describe('logger', () => {
  beforeEach(() => {
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
    delete process.env.LOG_LEVEL;
  });

  afterEach(() => {
    vi.restoreAllMocks();
    delete process.env.LOG_LEVEL;
  });

  it('outputs JSON-structured entries with timestamp', () => {
    logger.info('hello');
    expect(console.log).toHaveBeenCalledOnce();
    const output = JSON.parse((console.log as ReturnType<typeof vi.fn>).mock.calls[0][0]);
    expect(output.level).toBe('info');
    expect(output.message).toBe('hello');
    expect(output.timestamp).toBeDefined();
  });

  it('routes error to console.error', () => {
    logger.error('fail');
    expect(console.error).toHaveBeenCalledOnce();
  });

  it('filters below LOG_LEVEL', () => {
    process.env.LOG_LEVEL = 'warn';
    logger.info('suppressed');
    expect(console.log).not.toHaveBeenCalled();
  });

  it('createAgentLogger adds agentId and taskName', () => {
    const agentLogger = createAgentLogger('billing', 'validate-tiss');
    agentLogger.info('starting');
    const output = JSON.parse((console.log as ReturnType<typeof vi.fn>).mock.calls[0][0]);
    expect(output.agentId).toBe('billing');
    expect(output.taskName).toBe('validate-tiss');
  });
});
