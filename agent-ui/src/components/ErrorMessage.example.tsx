import React, { useState } from 'react';
import ErrorMessage from './ErrorMessage';
import { createErrorInfo } from '../utils/errorLogger';

/**
 * ErrorMessage Component Examples
 * 
 * Demonstrates various error types and configurations
 */
const ErrorMessageExample: React.FC = () => {
  const [dismissedErrors, setDismissedErrors] = useState<Set<string>>(new Set());

  const handleRetry = (errorType: string) => {
    console.log(`Retrying ${errorType} operation...`);
    alert(`Retry clicked for ${errorType} error`);
  };

  const handleDismiss = (errorId: string) => {
    setDismissedErrors(prev => new Set(prev).add(errorId));
  };

  const errors = [
    {
      id: 'network',
      error: createErrorInfo(
        'network',
        'Unable to connect to agents. Check your network connection.',
        {
          details: 'TypeError: Failed to fetch\n  at agentService.ts:45:12',
          retryable: true,
          operation: 'Agent Invocation',
        }
      ),
    },
    {
      id: 'authentication',
      error: createErrorInfo(
        'authentication',
        'Authentication failed. Please log in again.',
        {
          details: 'HTTP 401: Unauthorized - Token expired',
          retryable: false,
        }
      ),
    },
    {
      id: 'agent',
      error: createErrorInfo(
        'agent',
        'Agent is currently unavailable. Please try again later.',
        {
          details: 'HTTP 503: Service Unavailable - Agent timeout after 30s',
          retryable: true,
          agentId: 'onboarding-agent',
        }
      ),
    },
    {
      id: 'deployment',
      error: createErrorInfo(
        'deployment',
        'CloudFormation stack creation failed.',
        {
          details: 'Resource MyBucket failed to create: Access Denied (Service: Amazon S3; Status Code: 403)',
          retryable: false,
          operation: 'Stack Creation',
        }
      ),
    },
    {
      id: 'client',
      error: createErrorInfo(
        'client',
        'Invalid input. Please check your message and try again.',
        {
          details: 'Validation Error: Message cannot be empty',
          retryable: false,
        }
      ),
    },
  ];

  return (
    <div className="min-h-screen bg-[#0a0e1a] p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-[#e4e7eb] mb-2">
          ErrorMessage Component Examples
        </h1>
        <p className="text-[#9ca3af] mb-8">
          Demonstrating different error types and configurations
        </p>

        <div className="space-y-6">
          {errors.map(({ id, error }) => (
            !dismissedErrors.has(id) && (
              <div key={id}>
                <h2 className="text-xl font-semibold text-[#e4e7eb] mb-3 capitalize">
                  {id} Error
                </h2>
                <ErrorMessage
                  error={error}
                  onRetry={error.retryable ? () => handleRetry(id) : undefined}
                  onDismiss={() => handleDismiss(id)}
                />
              </div>
            )
          ))}

          {dismissedErrors.size > 0 && (
            <div className="mt-8 p-4 bg-[#151b2d] border border-[#2d3548] rounded">
              <p className="text-[#9ca3af] text-sm">
                Dismissed errors: {Array.from(dismissedErrors).join(', ')}
              </p>
              <button
                onClick={() => setDismissedErrors(new Set())}
                className="mt-2 text-[#3b82f6] hover:text-[#2563eb] text-sm"
              >
                Reset All
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ErrorMessageExample;
