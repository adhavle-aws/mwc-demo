import type { ErrorInfo, ErrorType } from '../types';

/**
 * Error Logger Utility
 * 
 * Provides centralized error logging functionality for the application.
 * Logs errors to console with structured formatting and can be extended
 * to send errors to external logging services.
 * 
 * Requirements: 9.5 (Add error logging)
 */

/**
 * Log an error with structured information
 */
export const logError = (error: ErrorInfo): void => {
  const logEntry = {
    timestamp: error.timestamp.toISOString(),
    type: error.type,
    message: error.message,
    details: error.details,
    retryable: error.retryable,
    agentId: error.agentId,
    operation: error.operation,
  };

  // Log to console with appropriate level
  if (error.type === 'client') {
    console.warn('[Error]', logEntry);
  } else {
    console.error('[Error]', logEntry);
  }

  // TODO: Send to external logging service (e.g., CloudWatch, Sentry)
  // This can be implemented when deploying to production
};

/**
 * Create an ErrorInfo object from various error sources
 */
export const createErrorInfo = (
  type: ErrorType,
  message: string,
  options?: {
    details?: string;
    retryable?: boolean;
    agentId?: string;
    operation?: string;
  }
): ErrorInfo => {
  return {
    type,
    message,
    details: options?.details,
    timestamp: new Date(),
    retryable: options?.retryable ?? false,
    agentId: options?.agentId,
    operation: options?.operation,
  };
};

/**
 * Parse and categorize errors from various sources
 */
export const parseError = (
  error: unknown,
  context?: { agentId?: string; operation?: string }
): ErrorInfo => {
  // Network errors
  if (error instanceof TypeError && error.message.includes('fetch')) {
    return createErrorInfo(
      'network',
      'Unable to connect to agents. Check your network connection.',
      {
        details: error.message,
        retryable: true,
        ...context,
      }
    );
  }

  // HTTP errors
  if (error instanceof Error && 'status' in error) {
    const status = (error as any).status;
    
    if (status === 401 || status === 403) {
      return createErrorInfo(
        'authentication',
        'Authentication failed. Please log in again.',
        {
          details: error.message,
          retryable: false,
          ...context,
        }
      );
    }

    if (status === 503 || status === 504) {
      return createErrorInfo(
        'agent',
        'Agent is currently unavailable. Please try again later.',
        {
          details: error.message,
          retryable: true,
          ...context,
        }
      );
    }

    if (status >= 500) {
      return createErrorInfo(
        'agent',
        'Agent encountered an internal error. Please try again.',
        {
          details: error.message,
          retryable: true,
          ...context,
        }
      );
    }

    if (status >= 400) {
      return createErrorInfo(
        'client',
        'Invalid request. Please check your input and try again.',
        {
          details: error.message,
          retryable: false,
          ...context,
        }
      );
    }
  }

  // Generic errors
  if (error instanceof Error) {
    return createErrorInfo(
      'client',
      error.message || 'An unexpected error occurred.',
      {
        details: error.stack,
        retryable: false,
        ...context,
      }
    );
  }

  // Unknown errors
  return createErrorInfo(
    'client',
    'An unexpected error occurred.',
    {
      details: String(error),
      retryable: false,
      ...context,
    }
  );
};

/**
 * Get user-friendly error message based on error type
 */
export const getErrorMessage = (error: ErrorInfo): string => {
  return error.message;
};

/**
 * Get actionable next steps for an error
 */
export const getErrorActionableSteps = (error: ErrorInfo): string[] => {
  const steps: string[] = [];

  switch (error.type) {
    case 'network':
      steps.push('Check your internet connection');
      steps.push('Verify the API endpoint is accessible');
      if (error.retryable) {
        steps.push('Click the retry button to try again');
      }
      break;

    case 'authentication':
      steps.push('Log in again to refresh your session');
      steps.push('Contact support if the issue persists');
      break;

    case 'agent':
      steps.push('Wait a moment and try again');
      if (error.retryable) {
        steps.push('Click the retry button to retry the operation');
      }
      steps.push('Contact support if the agent remains unavailable');
      break;

    case 'deployment':
      steps.push('Review the error details below');
      steps.push('Check CloudFormation console for more information');
      steps.push('Verify your AWS permissions');
      break;

    case 'client':
      steps.push('Check your input and try again');
      steps.push('Refresh the page if the issue persists');
      break;
  }

  return steps;
};
