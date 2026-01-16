/**
 * Circuit Breaker Pattern Implementation
 * 
 * Prevents cascading failures by failing fast when a service is unavailable.
 * Implements three states: CLOSED (normal), OPEN (failing fast), and HALF_OPEN (testing recovery).
 * 
 * Requirements: 6.2
 */

/**
 * Circuit breaker states
 */
export enum CircuitState {
  /** Normal operation - requests pass through */
  CLOSED = 'CLOSED',
  /** Too many failures - requests fail immediately */
  OPEN = 'OPEN',
  /** Testing if service recovered - limited requests allowed */
  HALF_OPEN = 'HALF_OPEN',
}

/**
 * Configuration for circuit breaker behavior
 */
export interface CircuitBreakerConfig {
  /** Number of failures before opening circuit */
  failureThreshold: number;
  /** Number of successes needed to close circuit from half-open */
  successThreshold: number;
  /** Time in milliseconds before attempting to close an open circuit */
  timeout: number;
  /** Delay in milliseconds before retrying in half-open state */
  halfOpenRetryDelay: number;
}

/**
 * Default circuit breaker configuration
 */
export const DEFAULT_CIRCUIT_BREAKER_CONFIG: CircuitBreakerConfig = {
  failureThreshold: 5,
  successThreshold: 2,
  timeout: 60000,
  halfOpenRetryDelay: 30000,
};

/**
 * Circuit breaker error thrown when circuit is open
 */
export class CircuitBreakerOpenError extends Error {
  constructor(serviceName: string) {
    super(`Circuit breaker is OPEN for service: ${serviceName}`);
    this.name = 'CircuitBreakerOpenError';
  }
}

/**
 * Circuit breaker implementation
 */
export class CircuitBreaker {
  private state: CircuitState = CircuitState.CLOSED;
  private failureCount: number = 0;
  private successCount: number = 0;
  private lastFailureTime?: Date;
  private nextAttemptTime?: Date;
  private config: CircuitBreakerConfig;
  private serviceName: string;

  constructor(serviceName: string, config: Partial<CircuitBreakerConfig> = {}) {
    this.serviceName = serviceName;
    this.config = { ...DEFAULT_CIRCUIT_BREAKER_CONFIG, ...config };
  }

  /**
   * Execute an operation through the circuit breaker
   * 
   * @param operation - Async function to execute
   * @returns Result of the operation
   * @throws CircuitBreakerOpenError if circuit is open
   */
  async execute<T>(operation: () => Promise<T>): Promise<T> {
    // Check if we should attempt the operation
    if (!this.canAttempt()) {
      throw new CircuitBreakerOpenError(this.serviceName);
    }

    try {
      const result = await operation();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  /**
   * Check if an operation can be attempted based on circuit state
   */
  private canAttempt(): boolean {
    const now = new Date();

    switch (this.state) {
      case CircuitState.CLOSED:
        // Always allow in closed state
        return true;

      case CircuitState.OPEN:
        // Check if timeout has elapsed
        if (this.nextAttemptTime && now >= this.nextAttemptTime) {
          this.transitionToHalfOpen();
          return true;
        }
        return false;

      case CircuitState.HALF_OPEN:
        // Allow limited attempts in half-open state
        return true;

      default:
        return false;
    }
  }

  /**
   * Handle successful operation
   */
  private onSuccess(): void {
    this.failureCount = 0;

    if (this.state === CircuitState.HALF_OPEN) {
      this.successCount++;
      
      if (this.successCount >= this.config.successThreshold) {
        this.transitionToClosed();
      }
    }
  }

  /**
   * Handle failed operation
   */
  private onFailure(): void {
    this.failureCount++;
    this.lastFailureTime = new Date();

    if (this.state === CircuitState.HALF_OPEN) {
      // Immediately open on failure in half-open state
      this.transitionToOpen();
    } else if (this.state === CircuitState.CLOSED) {
      // Check if we've exceeded failure threshold
      if (this.failureCount >= this.config.failureThreshold) {
        this.transitionToOpen();
      }
    }
  }

  /**
   * Transition to CLOSED state
   */
  private transitionToClosed(): void {
    this.state = CircuitState.CLOSED;
    this.failureCount = 0;
    this.successCount = 0;
    this.lastFailureTime = undefined;
    this.nextAttemptTime = undefined;
  }

  /**
   * Transition to OPEN state
   */
  private transitionToOpen(): void {
    this.state = CircuitState.OPEN;
    this.successCount = 0;
    
    // Calculate when to attempt half-open
    const now = new Date();
    this.nextAttemptTime = new Date(now.getTime() + this.config.timeout);
  }

  /**
   * Transition to HALF_OPEN state
   */
  private transitionToHalfOpen(): void {
    this.state = CircuitState.HALF_OPEN;
    this.successCount = 0;
    this.failureCount = 0;
  }

  /**
   * Get current circuit state
   */
  getState(): CircuitState {
    return this.state;
  }

  /**
   * Get current failure count
   */
  getFailureCount(): number {
    return this.failureCount;
  }

  /**
   * Get current success count (relevant in half-open state)
   */
  getSuccessCount(): number {
    return this.successCount;
  }

  /**
   * Get last failure time
   */
  getLastFailureTime(): Date | undefined {
    return this.lastFailureTime;
  }

  /**
   * Get next attempt time (relevant in open state)
   */
  getNextAttemptTime(): Date | undefined {
    return this.nextAttemptTime;
  }

  /**
   * Manually reset the circuit breaker to closed state
   */
  reset(): void {
    this.transitionToClosed();
  }

  /**
   * Get circuit breaker statistics
   */
  getStats(): {
    state: CircuitState;
    failureCount: number;
    successCount: number;
    lastFailureTime?: Date;
    nextAttemptTime?: Date;
  } {
    return {
      state: this.state,
      failureCount: this.failureCount,
      successCount: this.successCount,
      lastFailureTime: this.lastFailureTime,
      nextAttemptTime: this.nextAttemptTime,
    };
  }
}

/**
 * Circuit breaker registry for managing multiple circuit breakers
 */
export class CircuitBreakerRegistry {
  private breakers: Map<string, CircuitBreaker> = new Map();
  private defaultConfig: Partial<CircuitBreakerConfig>;

  constructor(defaultConfig: Partial<CircuitBreakerConfig> = {}) {
    this.defaultConfig = defaultConfig;
  }

  /**
   * Get or create a circuit breaker for a service
   */
  getBreaker(serviceName: string, config?: Partial<CircuitBreakerConfig>): CircuitBreaker {
    if (!this.breakers.has(serviceName)) {
      const breakerConfig = { ...this.defaultConfig, ...config };
      this.breakers.set(serviceName, new CircuitBreaker(serviceName, breakerConfig));
    }
    return this.breakers.get(serviceName)!;
  }

  /**
   * Execute an operation through a circuit breaker
   */
  async execute<T>(
    serviceName: string,
    operation: () => Promise<T>,
    config?: Partial<CircuitBreakerConfig>
  ): Promise<T> {
    const breaker = this.getBreaker(serviceName, config);
    return breaker.execute(operation);
  }

  /**
   * Get all circuit breaker statistics
   */
  getAllStats(): Record<string, ReturnType<CircuitBreaker['getStats']>> {
    const stats: Record<string, ReturnType<CircuitBreaker['getStats']>> = {};
    
    for (const [serviceName, breaker] of this.breakers.entries()) {
      stats[serviceName] = breaker.getStats();
    }
    
    return stats;
  }

  /**
   * Reset all circuit breakers
   */
  resetAll(): void {
    for (const breaker of this.breakers.values()) {
      breaker.reset();
    }
  }

  /**
   * Reset a specific circuit breaker
   */
  reset(serviceName: string): void {
    const breaker = this.breakers.get(serviceName);
    if (breaker) {
      breaker.reset();
    }
  }
}
