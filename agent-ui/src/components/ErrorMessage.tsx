import React from 'react';
import type { ErrorMessageProps } from '../types';
import { getErrorActionableSteps } from '../utils/errorLogger';

/**
 * ErrorMessage Component
 * 
 * Displays error messages with categorization, details, and actionable next steps.
 * Provides retry functionality for retryable errors and dismiss functionality.
 * 
 * Features:
 * - Color-coded by error type
 * - Displays error message and details
 * - Shows actionable next steps
 * - Retry button for retryable errors
 * - Dismiss button
 * - Timestamp display
 * 
 * Requirements: 9.1, 9.2, 9.3, 9.4
 */
const ErrorMessage: React.FC<ErrorMessageProps> = ({ error, onRetry, onDismiss }) => {
  // Get error type styling
  const getErrorStyles = () => {
    switch (error.type) {
      case 'network':
        return {
          bg: 'bg-yellow-900/20',
          border: 'border-yellow-600',
          icon: 'text-yellow-500',
          title: 'Network Error',
        };
      case 'authentication':
        return {
          bg: 'bg-red-900/20',
          border: 'border-red-600',
          icon: 'text-red-500',
          title: 'Authentication Error',
        };
      case 'agent':
        return {
          bg: 'bg-orange-900/20',
          border: 'border-orange-600',
          icon: 'text-orange-500',
          title: 'Agent Error',
        };
      case 'deployment':
        return {
          bg: 'bg-red-900/20',
          border: 'border-red-600',
          icon: 'text-red-500',
          title: 'Deployment Error',
        };
      case 'client':
        return {
          bg: 'bg-blue-900/20',
          border: 'border-blue-600',
          icon: 'text-blue-500',
          title: 'Client Error',
        };
      default:
        return {
          bg: 'bg-gray-900/20',
          border: 'border-gray-600',
          icon: 'text-gray-500',
          title: 'Error',
        };
    }
  };

  const styles = getErrorStyles();
  const actionableSteps = getErrorActionableSteps(error);

  return (
    <div
      className={`${styles.bg} ${styles.border} border rounded-lg p-4 mb-4 animate-fade-in`}
      role="alert"
      aria-live="assertive"
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-start gap-3">
          {/* Error Icon */}
          <svg
            className={`${styles.icon} w-6 h-6 flex-shrink-0 mt-0.5`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>

          {/* Error Title and Message */}
          <div className="flex-1">
            <h3 className="text-[#e4e7eb] font-semibold text-sm mb-1">
              {styles.title}
            </h3>
            <p className="text-[#9ca3af] text-sm">{error.message}</p>
          </div>
        </div>

        {/* Dismiss Button */}
        {onDismiss && (
          <button
            onClick={onDismiss}
            className="text-[#6b7280] hover:text-[#9ca3af] transition-colors ml-2"
            aria-label="Dismiss error"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        )}
      </div>

      {/* Error Details */}
      {error.details && (
        <div className="ml-9 mb-3">
          <details className="text-[#6b7280] text-xs">
            <summary className="cursor-pointer hover:text-[#9ca3af] transition-colors">
              Technical Details
            </summary>
            <pre className="mt-2 p-2 bg-[#0a0e1a] rounded text-xs overflow-x-auto">
              {error.details}
            </pre>
          </details>
        </div>
      )}

      {/* Actionable Steps */}
      {actionableSteps.length > 0 && (
        <div className="ml-9 mb-3">
          <p className="text-[#9ca3af] text-xs font-medium mb-2">Next Steps:</p>
          <ul className="list-disc list-inside text-[#6b7280] text-xs space-y-1">
            {actionableSteps.map((step, index) => (
              <li key={index}>{step}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Footer with Timestamp and Actions */}
      <div className="ml-9 flex items-center justify-between gap-4">
        {/* Timestamp */}
        <span className="text-[#6b7280] text-xs">
          {error.timestamp.toLocaleTimeString()}
        </span>

        {/* Retry Button */}
        {error.retryable && onRetry && (
          <button
            onClick={onRetry}
            className="px-3 py-1.5 bg-[#3b82f6] hover:bg-[#2563eb] text-white text-xs font-medium rounded transition-colors"
            aria-label="Retry operation"
          >
            Retry
          </button>
        )}
      </div>
    </div>
  );
};

export default ErrorMessage;
