/**
 * Circuit Breaker
 * FinHealth Squad — Pipeline Resilience
 *
 * Prevents repeated calls to failing agents by tracking consecutive failures.
 * Three states: closed (normal) → open (fail-fast) → half-open (probe after cooldown).
 */

export type CircuitState = 'closed' | 'open' | 'half-open';

export interface CircuitBreakerConfig {
  failureThreshold: number;
  resetTimeoutMs: number;
  halfOpenMaxAttempts: number;
}

interface CircuitData {
  state: CircuitState;
  failureCount: number;
  lastFailureAt: number;
  halfOpenAttempts: number;
}

const DEFAULT_CONFIG: CircuitBreakerConfig = {
  failureThreshold: 3,
  resetTimeoutMs: 30_000,
  halfOpenMaxAttempts: 1,
};

export class CircuitBreaker {
  private circuits: Map<string, CircuitData> = new Map();
  private config: CircuitBreakerConfig;

  constructor(config?: Partial<CircuitBreakerConfig>) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  canExecute(key: string): boolean {
    const circuit = this.circuits.get(key);
    if (!circuit) return true;

    if (circuit.state === 'closed') return true;

    if (circuit.state === 'open') {
      // Check if cooldown has elapsed → transition to half-open
      if (Date.now() - circuit.lastFailureAt >= this.config.resetTimeoutMs) {
        circuit.state = 'half-open';
        circuit.halfOpenAttempts = 0;
        return true;
      }
      return false;
    }

    // half-open: allow limited probes
    return circuit.halfOpenAttempts < this.config.halfOpenMaxAttempts;
  }

  recordSuccess(key: string): void {
    const circuit = this.circuits.get(key);
    if (!circuit) return;

    // Reset to closed on success
    circuit.state = 'closed';
    circuit.failureCount = 0;
    circuit.halfOpenAttempts = 0;
  }

  recordFailure(key: string): void {
    let circuit = this.circuits.get(key);
    if (!circuit) {
      circuit = { state: 'closed', failureCount: 0, lastFailureAt: 0, halfOpenAttempts: 0 };
      this.circuits.set(key, circuit);
    }

    circuit.failureCount++;
    circuit.lastFailureAt = Date.now();

    if (circuit.state === 'half-open') {
      circuit.halfOpenAttempts++;
      if (circuit.halfOpenAttempts >= this.config.halfOpenMaxAttempts) {
        circuit.state = 'open';
      }
    } else if (circuit.failureCount >= this.config.failureThreshold) {
      circuit.state = 'open';
    }
  }

  getState(key: string): CircuitState {
    return this.circuits.get(key)?.state || 'closed';
  }

  reset(key?: string): void {
    if (key) {
      this.circuits.delete(key);
    } else {
      this.circuits.clear();
    }
  }
}
