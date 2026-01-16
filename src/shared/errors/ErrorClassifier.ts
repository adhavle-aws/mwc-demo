/**
 * Error Classification System
 * 
 * Classifies errors into three categories to determine appropriate handling:
 * - TRANSIENT: Temporary failures that may succeed on retry
 * - PERMANENT: Failures that will not succeed on retry
 * - CRITICAL: System-level failures requiring immediate attention
 * 
 * Requirements: 6.1
 */

import { ErrorType } from '../types/models';

/**
 * Extended error context for comprehensive error tracking
 */
export interface ErrorContext {
  errorId: string;
  timestamp: Date;
  errorType: ErrorType;
  errorCode: string;
  errorMessage: string;
  stackTrace: string;
  agentId: string;
  workflowId: string;
  operationName: string;
  operationParameters: Record<string, any>;
  retryAttempt: number;
  previousErrors?: ErrorContext[];
}

/**
 * Error classification patterns for different error types
 */
const TRANSIENT_ERROR_PATTERNS = [
  /timeout/i,
  /ETIMEDOUT/i,
  /ECONNRESET/i,
  /ECONNREFUSED/i,
  /rate limit/i,
  /throttl/i,
  /temporarily unavailable/i,
  /service unavailable/i,
  /503/,
  /429/,
  /network/i,
  /ENETUNREACH/i,
  /EHOSTUNREACH/i,
];

const PERMANENT_ERROR_PATTERNS = [
  /invalid/i,
  /not found/i,
  /404/,
  /unauthorized/i,
  /forbidden/i,
  /401/,
  /403/,
  /permission denied/i,
  /access denied/i,
  /conflict/i,
  /409/,
  /already exists/i,
  /malformed/i,
  /bad request/i,
  /400/,
];

const CRITICAL_ERROR_PATTERNS = [
  /out of memory/i,
  /OOM/i,
  /segmentation fault/i,
  /SIGSEGV/i,
  /data corruption/i,
  /security breach/i,
  /authentication failed/i,
  /certificate/i,
  /encryption/i,
  /fatal/i,
];

/**
 * Classifies an error into one of three types based on error characteristics
 */
export class ErrorClassifier {
  /**
   * Classify an error based on its message, code, and other characteristics
   * 
   * @param error - The error to classify
   * @param errorCode - Optional error code
   * @returns The classified error type
   */
  static classify(error: Error, errorCode?: string): ErrorType {
    const errorMessage = error.message || '';
    const code = errorCode || '';
    const combinedText = `${errorMessage} ${code} ${error.name}`;

    // Check for critical errors first (highest priority)
    if (this.matchesPatterns(combinedText, CRITICAL_ERROR_PATTERNS)) {
      return 'CRITICAL';
    }

    // Check for permanent errors
    if (this.matchesPatterns(combinedText, PERMANENT_ERROR_PATTERNS)) {
      return 'PERMANENT';
    }

    // Check for transient errors
    if (this.matchesPatterns(combinedText, TRANSIENT_ERROR_PATTERNS)) {
      return 'TRANSIENT';
    }

    // Default to PERMANENT for unknown errors (safer to not retry)
    return 'PERMANENT';
  }

  /**
   * Create a full error context from an error and operation details
   * 
   * @param error - The error that occurred
   * @param agentId - ID of the agent where error occurred
   * @param workflowId - ID of the workflow where error occurred
   * @param operationName - Name of the operation that failed
   * @param operationParameters - Parameters passed to the operation
   * @param retryAttempt - Current retry attempt number
   * @param previousErrors - Array of previous error contexts if retrying
   * @returns Complete error context
   */
  static createErrorContext(
    error: Error,
    agentId: string,
    workflowId: string,
    operationName: string,
    operationParameters: Record<string, any>,
    retryAttempt: number = 0,
    previousErrors?: ErrorContext[]
  ): ErrorContext {
    const errorCode = (error as any).code || 'UNKNOWN';
    const errorType = this.classify(error, errorCode);

    return {
      errorId: this.generateErrorId(),
      timestamp: new Date(),
      errorType,
      errorCode,
      errorMessage: error.message,
      stackTrace: error.stack || '',
      agentId,
      workflowId,
      operationName,
      operationParameters,
      retryAttempt,
      previousErrors,
    };
  }

  /**
   * Check if text matches any of the provided patterns
   */
  private static matchesPatterns(text: string, patterns: RegExp[]): boolean {
    return patterns.some(pattern => pattern.test(text));
  }

  /**
   * Generate a unique error ID
   */
  private static generateErrorId(): string {
    return `err_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
  }

  /**
   * Determine if an error should be retried based on its type
   * 
   * @param errorType - The classified error type
   * @returns true if the error should be retried
   */
  static shouldRetry(errorType: ErrorType): boolean {
    return errorType === 'TRANSIENT';
  }

  /**
   * Determine if an error requires immediate escalation
   * 
   * @param errorType - The classified error type
   * @returns true if the error requires immediate attention
   */
  static requiresEscalation(errorType: ErrorType): boolean {
    return errorType === 'CRITICAL';
  }
}
