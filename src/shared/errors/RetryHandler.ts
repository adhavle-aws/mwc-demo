/**
 * Retry Handler with Exponential Backoff
 * 
 * Implements automatic retry logic for transient failures with exponentially
 * increasing delays between attempts.
 * 
 * Requirements: 4.3, 6.2
 */

import { ErrorClassifier, ErrorContext } from './ErrorClassifier';

/**
 * Configuration for retry behavior
 */
export interface RetryConfig {
  /** Maximum number of retry attempts */
  maxAttempts: number;
  /** Initial delay in milliseconds before first retry */
  initialDelayMs: number;
  /** Maximum delay in milliseconds between retries */
  maxDelayMs: number;
  /** Multiplier for exponential backoff (delay *= backoffMultiplier) */
  backoffMultiplier: number;
}

/**
 * Default retry configuration
 */
export const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxAttempts: 5,
  initialDelayMs: 1000,
  maxDelayMs: 60000,
  backoffMultiplier: 2,
};

/**
 * Result of a retry operation
 */
export interface RetryResult<T> {
  /** Whether the operation succeeded */
  success: boolean;
  /** Result value if successful */
  value?: T;
  /** Error if all retries failed */
  error?: Error;
  /** Number of attempts made */
  attempts: number;
  /** Error contexts from all attempts */
  errorContexts: ErrorContext[];
}

/**
 * Retry handler that implements exponential backoff for transient errors
 */
export class RetryHandler {
  private config: RetryConfig;

  constructor(config: Partial<RetryConfig> = {}) {
    this.config = { ...DEFAULT_RETRY_CONFIG, ...config };
  }

  /**
   * Execute an operation with automatic retry on transient failures
   * 
   * @param operation - Async function to execute
   * @param agentId - ID of the agent executing the operation
   * @param workflowId - ID of the workflow
   * @param operationName - Name of the operation for logging
   * @param operationParameters - Parameters for the operation
   * @returns RetryResult containing success status and value or error
   */
  async executeWithRetry<T>(
    operation: () => Promise<T>,
    agentId: string,
    workflowId: string,
    operationName: string,
    operationParameters: Record<string, any> = {}
  ): Promise<RetryResult<T>> {
    const errorContexts: ErrorContext[] = [];
    let lastError: Error | undefined;

    for (let attempt = 0; attempt < this.config.maxAttempts; attempt++) {
      try {
        // Attempt the operation
        const result = await operation();
        
        return {
          success: true,
          value: result,
          attempts: attempt + 1,
          errorContexts,
        };
      } catch (error) {
        const err = error instanceof Error ? error : new Error(String(error));
        lastError = err;

        // Create error context
        const errorContext = ErrorClassifier.createErrorContext(
          err,
          agentId,
          workflowId,
          operationName,
          operationParameters,
          attempt,
          errorContexts.length > 0 ? errorContexts : undefined
        );

        errorContexts.push(errorContext);

        // Check if we should retry
        const shouldRetry = ErrorClassifier.shouldRetry(errorContext.errorType);
        const isLastAttempt = attempt === this.config.maxAttempts - 1;

        if (!shouldRetry || isLastAttempt) {
          // Don't retry permanent/critical errors, or if we've exhausted attempts
          return {
            success: false,
            error: err,
            attempts: attempt + 1,
            errorContexts,
          };
        }

        // Calculate delay for next retry
        const delay = this.calculateBackoffDelay(attempt);
        
        // Wait before retrying
        await this.sleep(delay);
      }
    }

    // Should never reach here, but TypeScript needs this
    return {
      success: false,
      error: lastError || new Error('Unknown error'),
      attempts: this.config.maxAttempts,
      errorContexts,
    };
  }

  /**
   * Calculate the delay for the next retry attempt using exponential backoff
   * 
   * @param attemptNumber - Current attempt number (0-indexed)
   * @returns Delay in milliseconds
   */
  calculateBackoffDelay(attemptNumber: number): number {
    const exponentialDelay = 
      this.config.initialDelayMs * Math.pow(this.config.backoffMultiplier, attemptNumber);
    
    // Cap at maxDelayMs
    return Math.min(exponentialDelay, this.config.maxDelayMs);
  }

  /**
   * Sleep for specified milliseconds
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Create a retry decorator that can wrap any async function
   * 
   * @param config - Retry configuration
   * @returns Decorator function
   */
  static createRetryDecorator(config: Partial<RetryConfig> = {}) {
    const handler = new RetryHandler(config);

    return function <T>(
      target: any,
      propertyKey: string,
      descriptor: PropertyDescriptor
    ) {
      const originalMethod = descriptor.value;

      descriptor.value = async function (this: any, ...args: any[]): Promise<T> {
        // Extract context from 'this' if available
        const agentId = (this as any).agentId || 'unknown';
        const workflowId = (this as any).workflowId || 'unknown';
        
        const result = await handler.executeWithRetry(
          () => originalMethod.apply(this, args),
          agentId,
          workflowId,
          propertyKey,
          { args }
        );

        if (result.success) {
          return result.value as T;
        } else {
          throw result.error;
        }
      };

      return descriptor;
    };
  }
}

/**
 * Convenience function to execute an operation with default retry config
 */
export async function withRetry<T>(
  operation: () => Promise<T>,
  agentId: string,
  workflowId: string,
  operationName: string,
  operationParameters: Record<string, any> = {},
  config: Partial<RetryConfig> = {}
): Promise<T> {
  const handler = new RetryHandler(config);
  const result = await handler.executeWithRetry(
    operation,
    agentId,
    workflowId,
    operationName,
    operationParameters
  );

  if (result.success) {
    return result.value as T;
  } else {
    throw result.error;
  }
}
