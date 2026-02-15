import { describe, it, expect } from 'vitest';
import { classifyError, isRetryable } from './error-classifier';

describe('classifyError', () => {
  it('classifies timeout errors as transient', () => {
    expect(classifyError(new Error('Request timeout after 30000ms'))).toBe('transient');
  });

  it('classifies connection errors as transient', () => {
    expect(classifyError(new Error('ECONNRESET: connection reset by peer'))).toBe('transient');
  });

  it('classifies rate limit errors as transient', () => {
    expect(classifyError(new Error('429 Too Many Requests'))).toBe('transient');
  });

  it('classifies 503 as transient', () => {
    expect(classifyError(new Error('503 Service Unavailable'))).toBe('transient');
  });

  it('classifies validation errors as permanent', () => {
    expect(classifyError(new Error('Invalid input: missing required field'))).toBe('permanent');
  });

  it('classifies auth errors as permanent', () => {
    expect(classifyError(new Error('401 Unauthorized'))).toBe('permanent');
  });

  it('classifies not found as permanent', () => {
    expect(classifyError(new Error('Resource not found'))).toBe('permanent');
  });

  it('classifies unknown errors', () => {
    expect(classifyError(new Error('Something unexpected happened'))).toBe('unknown');
    expect(classifyError('not an error object')).toBe('unknown');
  });
});

describe('isRetryable', () => {
  it('returns true for transient errors', () => {
    expect(isRetryable(new Error('timeout'))).toBe(true);
  });

  it('returns false for permanent errors', () => {
    expect(isRetryable(new Error('401 Unauthorized'))).toBe(false);
  });

  it('returns true for unknown errors', () => {
    expect(isRetryable(new Error('weird error'))).toBe(true);
  });
});
