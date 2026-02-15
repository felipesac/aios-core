/**
 * Error Classifier
 * FinHealth Squad — Pipeline Resilience
 *
 * Categorizes errors to determine retry strategy.
 * Transient errors (network, timeout) are retryable.
 * Permanent errors (validation, auth) are not.
 */

export type ErrorCategory = 'transient' | 'permanent' | 'unknown';

const TRANSIENT_PATTERNS = [
  'timeout', 'etimedout', 'econnreset', 'econnrefused', 'enotfound',
  'rate limit', 'too many requests', '429', '503', '502', '504',
  'service unavailable', 'gateway timeout', 'network',
];

const PERMANENT_PATTERNS = [
  'invalid', 'validation', 'not found', 'unauthorized', 'forbidden',
  '400', '401', '403', '404', '422',
  'missing required', 'schema', 'parse error',
];

export function classifyError(error: unknown): ErrorCategory {
  if (!(error instanceof Error)) return 'unknown';

  const msg = error.message.toLowerCase();

  for (const pattern of TRANSIENT_PATTERNS) {
    if (msg.includes(pattern)) return 'transient';
  }

  for (const pattern of PERMANENT_PATTERNS) {
    if (msg.includes(pattern)) return 'permanent';
  }

  return 'unknown';
}

export function isRetryable(error: unknown): boolean {
  return classifyError(error) !== 'permanent';
}
