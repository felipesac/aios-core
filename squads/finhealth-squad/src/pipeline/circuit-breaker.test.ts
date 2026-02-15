import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { CircuitBreaker } from './circuit-breaker';

describe('CircuitBreaker', () => {
  let cb: CircuitBreaker;

  beforeEach(() => {
    cb = new CircuitBreaker({ failureThreshold: 3, resetTimeoutMs: 1000, halfOpenMaxAttempts: 1 });
  });

  it('allows execution in closed state', () => {
    expect(cb.canExecute('agent-a')).toBe(true);
    expect(cb.getState('agent-a')).toBe('closed');
  });

  it('transitions to open after threshold consecutive failures', () => {
    cb.recordFailure('agent-a');
    cb.recordFailure('agent-a');
    expect(cb.getState('agent-a')).toBe('closed');
    cb.recordFailure('agent-a');
    expect(cb.getState('agent-a')).toBe('open');
    expect(cb.canExecute('agent-a')).toBe(false);
  });

  it('rejects execution when open', () => {
    for (let i = 0; i < 3; i++) cb.recordFailure('agent-a');
    expect(cb.canExecute('agent-a')).toBe(false);
  });

  it('transitions to half-open after cooldown', () => {
    for (let i = 0; i < 3; i++) cb.recordFailure('agent-a');
    expect(cb.getState('agent-a')).toBe('open');

    // Advance time past resetTimeout
    vi.useFakeTimers();
    vi.advanceTimersByTime(1100);
    expect(cb.canExecute('agent-a')).toBe(true);
    expect(cb.getState('agent-a')).toBe('half-open');
    vi.useRealTimers();
  });

  it('resets to closed on success in half-open', () => {
    for (let i = 0; i < 3; i++) cb.recordFailure('agent-a');
    vi.useFakeTimers();
    vi.advanceTimersByTime(1100);
    cb.canExecute('agent-a'); // triggers transition to half-open
    cb.recordSuccess('agent-a');
    expect(cb.getState('agent-a')).toBe('closed');
    expect(cb.canExecute('agent-a')).toBe(true);
    vi.useRealTimers();
  });

  it('re-opens on failure in half-open', () => {
    for (let i = 0; i < 3; i++) cb.recordFailure('agent-a');
    vi.useFakeTimers();
    vi.advanceTimersByTime(1100);
    cb.canExecute('agent-a'); // triggers transition to half-open
    cb.recordFailure('agent-a');
    expect(cb.getState('agent-a')).toBe('open');
    vi.useRealTimers();
  });

  it('isolates circuits per key', () => {
    for (let i = 0; i < 3; i++) cb.recordFailure('agent-a');
    expect(cb.canExecute('agent-a')).toBe(false);
    expect(cb.canExecute('agent-b')).toBe(true);
  });

  it('resets a specific key or all keys', () => {
    for (let i = 0; i < 3; i++) {
      cb.recordFailure('agent-a');
      cb.recordFailure('agent-b');
    }
    cb.reset('agent-a');
    expect(cb.getState('agent-a')).toBe('closed');
    expect(cb.getState('agent-b')).toBe('open');
    cb.reset();
    expect(cb.getState('agent-b')).toBe('closed');
  });
});
