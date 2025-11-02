const ivm = require('isolated-vm');

/**
 * ToolValidationHelper - Pre-execution validation in isolated sandbox
 *
 * Features:
 * - Validates command arguments before execution
 * - isolated-vm sandbox with 500ms timeout (target <50ms)
 * - 8MB memory limit per execution
 * - No-validator-pass-through (backward compatibility)
 * - Returns standardized {valid, errors} format
 *
 * Performance Target: <50ms execution
 * Safety Timeout: 500ms
 * Goal: 80%+ error prevention before MCP call
 */
class ToolValidationHelper {
  /**
   * @param {Array|Object} validators - Array of validator definitions OR executable_knowledge object
   */
  constructor(validators) {
    this.validators = new Map();

    // Support both formats:
    // 1. Array of validators (legacy)
    // 2. Object with validators property (executable_knowledge format)
    let validatorArray = validators;

    if (validators && !Array.isArray(validators) && validators.validators) {
      // Extract validators array from executable_knowledge object
      validatorArray = validators.validators;
    }

    if (validatorArray && Array.isArray(validatorArray)) {
      validatorArray.forEach(v => {
        if (v.validates && v.function) {
          // Map by command name for quick lookup
          this.validators.set(v.validates, v);
        }
      });
    }
  }

  /**
   * Validate command arguments before execution
   *
   * @param {string} commandName - Command to validate
   * @param {object} args - Arguments to validate
   * @returns {object} Validation result: {valid: boolean, errors: string[]}
   */
  async validate(commandName, args = {}) {
    const validator = this.validators.get(commandName);

    // No validator = auto-pass (backward compatibility)
    if (!validator) {
      return {
        valid: true,
        errors: [],
        _note: 'No validator configured - passed by default'
      };
    }

    // Validate validator has required fields
    if (!validator.function) {
      return {
        valid: false,
        errors: [`Validator for '${commandName}' has no function defined`]
      };
    }

    // Create isolated VM with 8MB memory limit
    const isolate = new ivm.Isolate({ memoryLimit: 8 });

    try {
      // Create execution context
      const context = await isolate.createContext();

      // Get global object for setting up sandbox
      const jail = context.global;

      // Transfer args to sandbox (wrapped in object for compatibility)
      await jail.set('args', new ivm.ExternalCopy({ args }).copyInto());

      // Compile validator function
      const script = await isolate.compileScript(validator.function);

      // Execute with 500ms safety timeout (target <50ms, copy: true to extract objects)
      const startTime = Date.now();
      const result = await script.run(context, { timeout: 500, copy: true });
      const duration = Date.now() - startTime;

      // Warn if execution exceeds target
      if (duration > 50) {
        console.warn(`Validator '${commandName}' took ${duration}ms (target: <50ms). Consider optimization.`);
      }

      // Ensure result has correct format
      if (!result || typeof result !== 'object') {
        return {
          valid: false,
          errors: [`Validator '${commandName}' returned invalid format. Expected {valid: boolean, errors: array}.`]
        };
      }

      // Standardize result format
      return {
        valid: !!result.valid,
        errors: Array.isArray(result.errors) ? result.errors : [],
        _duration: duration
      };
    } catch (error) {
      // Enhanced error handling
      if (error.message && (error.message.includes('timeout') || error.message.includes('timed out'))) {
        return {
          valid: false,
          errors: [`Validator '${commandName}' exceeded 500ms timeout. Validation failed for safety.`]
        };
      }

      if (error.message && error.message.includes('memory')) {
        return {
          valid: false,
          errors: [`Validator '${commandName}' exceeded 8MB memory limit.`]
        };
      }

      // Generic validation error = fail with error message
      return {
        valid: false,
        errors: [`Validation error in '${commandName}': ${error.message}`]
      };
    } finally {
      // Always dispose isolate to free resources
      isolate.dispose();
    }
  }

  /**
   * Validate multiple commands at once (batch validation)
   *
   * @param {Array<{command: string, args: object}>} validations - Array of validations to perform
   * @returns {Array<{command: string, result: object}>} Array of validation results
   */
  async validateBatch(validations) {
    const results = [];

    for (const { command, args } of validations) {
      const result = await this.validate(command, args);
      results.push({ command, result });
    }

    return results;
  }

  /**
   * Check if a validator exists for a command
   *
   * @param {string} commandName - Command name
   * @returns {boolean} True if validator exists
   */
  hasValidator(commandName) {
    return this.validators.has(commandName);
  }

  /**
   * Get list of commands with validators
   *
   * @returns {Array<string>} Array of command names
   */
  listValidators() {
    return Array.from(this.validators.keys());
  }

  /**
   * Get validator metadata (without function code)
   *
   * @param {string} commandName - Command name
   * @returns {object|null} Validator metadata or null if not found
   */
  getValidatorInfo(commandName) {
    const validator = this.validators.get(commandName);

    if (!validator) {
      return null;
    }

    return {
      id: validator.id,
      validates: validator.validates,
      language: validator.language || 'javascript',
      checks: validator.checks || [],
      hasFunction: !!validator.function
    };
  }

  /**
   * Add a new validator dynamically (useful for testing)
   *
   * @param {object} validator - Validator definition
   * @throws {Error} If validator is invalid
   */
  addValidator(validator) {
    if (!validator || !validator.validates || !validator.function) {
      throw new Error('Validator must have validates and function fields');
    }

    if (this.validators.has(validator.validates)) {
      throw new Error(`Validator for '${validator.validates}' already exists. Use replaceValidator() to override.`);
    }

    this.validators.set(validator.validates, validator);
  }

  /**
   * Replace an existing validator (useful for hot-reloading)
   *
   * @param {object} validator - Validator definition
   * @throws {Error} If validator is invalid
   */
  replaceValidator(validator) {
    if (!validator || !validator.validates || !validator.function) {
      throw new Error('Validator must have validates and function fields');
    }

    this.validators.set(validator.validates, validator);
  }

  /**
   * Remove a validator
   *
   * @param {string} commandName - Command name
   * @returns {boolean} True if validator was removed
   */
  removeValidator(commandName) {
    return this.validators.delete(commandName);
  }

  /**
   * Clear all validators
   */
  clearValidators() {
    this.validators.clear();
  }

  /**
   * Get statistics about loaded validators
   *
   * @returns {object} Validator statistics
   */
  getStats() {
    return {
      count: this.validators.size,
      validators: this.listValidators()
    };
  }

  /**
   * Run declarative checks only (without function execution)
   * Useful for quick validation without sandbox overhead
   *
   * @param {string} commandName - Command name
   * @param {object} args - Arguments to validate
   * @returns {object} Validation result: {valid: boolean, errors: string[]}
   */
  validateDeclarative(commandName, args = {}) {
    const validator = this.validators.get(commandName);

    if (!validator || !validator.checks) {
      return { valid: true, errors: [], _note: 'No declarative checks' };
    }

    const errors = [];

    // Process declarative checks
    for (const check of validator.checks) {
      if (check.required_fields) {
        for (const field of check.required_fields) {
          if (!args[field]) {
            errors.push(`Required field '${field}' is missing`);
          }
        }
      }

      if (check.format) {
        // Add format validation logic here
        // (email, url, etc.)
      }
    }

    return {
      valid: errors.length === 0,
      errors,
      _type: 'declarative'
    };
  }
}

module.exports = ToolValidationHelper;
