/**
 * Input Validation
 * Dashboard API Routes — Squad/Agent Execution
 *
 * All validation is done before any data reaches child processes.
 */

// ============================================================================
// Constants
// ============================================================================

const KEBAB_CASE_PATTERN = /^[a-z0-9][a-z0-9-]*[a-z0-9]$|^[a-z0-9]$/;
const AGENT_NAME_PATTERN = /^@?[a-z][a-z0-9-]*(?::[a-z][a-z0-9-]*)?$/;
const MAX_PARAM_SIZE = 10_000; // 10KB

// ============================================================================
// Types
// ============================================================================

export interface ValidationError {
  field: string;
  message: string;
}

// ============================================================================
// Validators
// ============================================================================

/**
 * Validate value is a kebab-case string (lowercase, digits, hyphens).
 */
export function validateKebabCase(
  value: unknown,
  fieldName: string,
): ValidationError | null {
  if (typeof value !== 'string') {
    return { field: fieldName, message: `${fieldName} must be a string` };
  }
  if (value.length === 0 || value.length > 100) {
    return { field: fieldName, message: `${fieldName} must be 1-100 characters` };
  }
  if (!KEBAB_CASE_PATTERN.test(value)) {
    return {
      field: fieldName,
      message: `${fieldName} must be kebab-case (lowercase letters, digits, hyphens)`,
    };
  }
  return null;
}

/**
 * Validate value is a plain object (parameters/context payload).
 */
export function validateParameters(
  value: unknown,
  fieldName: string,
): ValidationError | null {
  if (value === undefined || value === null) return null;
  if (typeof value !== 'object' || Array.isArray(value)) {
    return { field: fieldName, message: `${fieldName} must be a plain object` };
  }
  const json = JSON.stringify(value);
  if (json.length > MAX_PARAM_SIZE) {
    return { field: fieldName, message: `${fieldName} payload exceeds maximum size (10KB)` };
  }
  return null;
}

/**
 * Validate value is present (not null, undefined, or empty string).
 */
export function validateRequired(
  value: unknown,
  fieldName: string,
): ValidationError | null {
  if (value === undefined || value === null || value === '') {
    return { field: fieldName, message: `${fieldName} is required` };
  }
  return null;
}

/**
 * Validate agent name format: "name" or "prefix:name".
 * Allows optional @ prefix.
 */
export function validateAgentName(value: unknown): ValidationError | null {
  if (typeof value !== 'string') {
    return { field: 'agentName', message: 'agentName must be a string' };
  }
  if (!AGENT_NAME_PATTERN.test(value)) {
    return {
      field: 'agentName',
      message: 'agentName format is invalid. Use "name" or "prefix:name"',
    };
  }
  return null;
}

/**
 * Validate task path — blocks path traversal.
 */
export function validateTaskPath(value: unknown): ValidationError | null {
  if (typeof value !== 'string') {
    return { field: 'taskPath', message: 'taskPath must be a string' };
  }
  if (value.length === 0 || value.length > 200) {
    return { field: 'taskPath', message: 'taskPath must be 1-200 characters' };
  }
  if (value.includes('..') || value.includes('~')) {
    return { field: 'taskPath', message: 'taskPath must not contain path traversal characters' };
  }
  return null;
}

/**
 * Collect non-null validation errors from multiple validators.
 */
export function collectErrors(
  ...results: (ValidationError | null)[]
): ValidationError[] {
  return results.filter((r): r is ValidationError => r !== null);
}
