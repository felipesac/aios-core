const ivm = require('isolated-vm');

/**
 * ToolHelperExecutor - Executes JavaScript helpers in isolated sandbox
 *
 * Security Features:
 * - isolated-vm sandbox with 1s timeout
 * - 8MB memory limit per execution
 * - No external requires allowed
 * - Context isolation with args transfer
 *
 * Performance:
 * - Target: <1s execution (enforced timeout)
 * - Typical: <100ms for simple helpers
 * - Automatic isolate disposal after execution
 */
class ToolHelperExecutor {
  /**
   * @param {Array} helpers - Array of helper definitions from tool schema
   */
  constructor(helpers) {
    this.helpers = new Map();

    if (helpers && Array.isArray(helpers)) {
      helpers.forEach(h => {
        if (h.id && h.function) {
          this.helpers.set(h.id, h);
        }
      });
    }
  }

  /**
   * Execute a helper function by ID
   *
   * @param {string} helperId - Unique helper identifier
   * @param {object} args - Arguments to pass to helper
   * @returns {*} Helper execution result
   * @throws {Error} If helper not found or execution fails
   */
  async execute(helperId, args = {}) {
    const helper = this.helpers.get(helperId);

    if (!helper) {
      throw new Error(`Helper '${helperId}' not found. Available helpers: ${Array.from(this.helpers.keys()).join(', ')}`);
    }

    // Validate helper has required fields
    if (!helper.function) {
      throw new Error(`Helper '${helperId}' has no function defined`);
    }

    // Pre-execution optimization: check attachment size before isolate transfer
    if (helperId === 'format-email-attachment' && args.data) {
      const maxSize = 25 * 1024 * 1024; // 25MB Gmail limit
      if (args.data.length > maxSize) {
        return {
          error: 'Attachment exceeds 25MB limit',
          maxSize: maxSize
        };
      }
    }

    // Create isolated VM with 8MB memory limit
    const isolate = new ivm.Isolate({ memoryLimit: 8 });

    try {
      // Create execution context
      const context = await isolate.createContext();

      // Get global object for setting up sandbox
      const jail = context.global;

      // Transfer args to sandbox
      await jail.set('args', new ivm.ExternalCopy(args).copyInto());

      // Compile and execute helper function
      const script = await isolate.compileScript(helper.function);

      // Execute with 1 second timeout (copy: true to extract complex objects)
      const result = await script.run(context, { timeout: 1000, copy: true });

      return result;
    } catch (error) {
      // Enhanced error handling
      if (error.message && (error.message.includes('timeout') || error.message.includes('timed out'))) {
        throw new Error(`Helper '${helperId}' exceeded 1s timeout. Consider optimizing the helper function.`);
      }

      if (error.message && error.message.includes('memory')) {
        throw new Error(`Helper '${helperId}' exceeded 8MB memory limit. Consider reducing data processing.`);
      }

      // Generic execution error
      throw new Error(`Helper '${helperId}' execution failed: ${error.message}`);
    } finally {
      // Always dispose isolate to free resources (check if not already disposed)
      if (!isolate.isDisposed) {
        isolate.dispose();
      }
    }
  }

  /**
   * Check if a helper exists
   *
   * @param {string} helperId - Helper identifier
   * @returns {boolean} True if helper exists
   */
  hasHelper(helperId) {
    return this.helpers.has(helperId);
  }

  /**
   * Get list of available helper IDs
   *
   * @returns {Array<string>} Array of helper IDs
   */
  listHelpers() {
    return Array.from(this.helpers.keys());
  }

  /**
   * Get helper metadata (without function code)
   *
   * @param {string} helperId - Helper identifier
   * @returns {object|null} Helper metadata or null if not found
   */
  getHelperInfo(helperId) {
    const helper = this.helpers.get(helperId);

    if (!helper) {
      return null;
    }

    return {
      id: helper.id,
      language: helper.language || 'javascript',
      runtime: helper.runtime || 'isolated_vm',
      hasFunction: !!helper.function
    };
  }

  /**
   * Add a new helper dynamically (useful for testing)
   *
   * @param {object} helper - Helper definition
   * @throws {Error} If helper is invalid
   */
  addHelper(helper) {
    if (!helper || !helper.id || !helper.function) {
      throw new Error('Helper must have id and function fields');
    }

    if (this.helpers.has(helper.id)) {
      throw new Error(`Helper '${helper.id}' already exists. Use replaceHelper() to override.`);
    }

    this.helpers.set(helper.id, helper);
  }

  /**
   * Replace an existing helper (useful for hot-reloading)
   *
   * @param {object} helper - Helper definition
   * @throws {Error} If helper is invalid
   */
  replaceHelper(helper) {
    if (!helper || !helper.id || !helper.function) {
      throw new Error('Helper must have id and function fields');
    }

    this.helpers.set(helper.id, helper);
  }

  /**
   * Remove a helper
   *
   * @param {string} helperId - Helper identifier
   * @returns {boolean} True if helper was removed
   */
  removeHelper(helperId) {
    return this.helpers.delete(helperId);
  }

  /**
   * Clear all helpers
   */
  clearHelpers() {
    this.helpers.clear();
  }

  /**
   * Get statistics about loaded helpers
   *
   * @returns {object} Helper statistics
   */
  getStats() {
    return {
      count: this.helpers.size,
      helpers: this.listHelpers()
    };
  }
}

module.exports = ToolHelperExecutor;
