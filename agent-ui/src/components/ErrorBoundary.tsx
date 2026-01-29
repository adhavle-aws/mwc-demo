import { Component, type ErrorInfo, type ReactNode } from 'react';
import { logError, createErrorInfo } from '../utils/errorLogger';

/**
 * ErrorBoundary Component Props
 */
interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

/**
 * ErrorBoundary Component State
 */
interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

/**
 * ErrorBoundary Component
 * 
 * React Error Boundary that catches JavaScript errors anywhere in the child
 * component tree, logs those errors, and displays a fallback UI.
 * 
 * Features:
 * - Catches React rendering errors
 * - Logs errors with stack traces
 * - Displays user-friendly error UI
 * - Provides reset functionality
 * - Prevents entire app crash
 * 
 * Requirements: 9.1, 9.5 (Error boundary for React errors, error logging)
 * 
 * Usage:
 * ```tsx
 * <ErrorBoundary>
 *   <YourComponent />
 * </ErrorBoundary>
 * ```
 */
class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  /**
   * Update state when an error is caught
   */
  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return {
      hasError: true,
      error,
    };
  }

  /**
   * Log error details when an error is caught
   */
  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // Log the error
    const errorDetails = createErrorInfo('client', error.message, {
      details: `${error.stack}\n\nComponent Stack:\n${errorInfo.componentStack}`,
      retryable: true,
    });

    logError(errorDetails);

    // Store error info in state
    this.setState({
      errorInfo,
    });

    // Call optional error handler
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  /**
   * Reset error boundary state
   */
  handleReset = (): void => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  /**
   * Reload the page
   */
  handleReload = (): void => {
    window.location.reload();
  };

  render(): ReactNode {
    if (this.state.hasError) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default error UI
      return (
        <div className="min-h-screen bg-[#0a0e1a] flex items-center justify-center p-4">
          <div className="max-w-2xl w-full bg-[#151b2d] border border-[#2d3548] rounded-lg p-8">
            {/* Error Icon */}
            <div className="flex justify-center mb-6">
              <div className="w-16 h-16 bg-red-900/20 rounded-full flex items-center justify-center">
                <svg
                  className="w-8 h-8 text-red-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
              </div>
            </div>

            {/* Error Title */}
            <h1 className="text-2xl font-bold text-[#e4e7eb] text-center mb-4">
              Something went wrong
            </h1>

            {/* Error Message */}
            <p className="text-[#9ca3af] text-center mb-6">
              We encountered an unexpected error. The error has been logged and we'll look into it.
            </p>

            {/* Error Details */}
            {this.state.error && (
              <div className="mb-6">
                <details className="bg-[#0a0e1a] border border-[#2d3548] rounded p-4">
                  <summary className="text-[#9ca3af] text-sm cursor-pointer hover:text-[#e4e7eb] transition-colors">
                    Error Details
                  </summary>
                  <div className="mt-4 space-y-2">
                    <div>
                      <p className="text-xs text-[#6b7280] mb-1">Error Message:</p>
                      <p className="text-sm text-[#e4e7eb] font-mono">
                        {this.state.error.message}
                      </p>
                    </div>
                    {this.state.error.stack && (
                      <div>
                        <p className="text-xs text-[#6b7280] mb-1">Stack Trace:</p>
                        <pre className="text-xs text-[#9ca3af] font-mono overflow-x-auto whitespace-pre-wrap">
                          {this.state.error.stack}
                        </pre>
                      </div>
                    )}
                    {this.state.errorInfo?.componentStack && (
                      <div>
                        <p className="text-xs text-[#6b7280] mb-1">Component Stack:</p>
                        <pre className="text-xs text-[#9ca3af] font-mono overflow-x-auto whitespace-pre-wrap">
                          {this.state.errorInfo.componentStack}
                        </pre>
                      </div>
                    )}
                  </div>
                </details>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-4 justify-center">
              <button
                onClick={this.handleReset}
                className="px-6 py-2.5 bg-[#3b82f6] hover:bg-[#2563eb] active:scale-95 text-white font-medium rounded transition-all duration-200 transform shadow-lg hover:shadow-xl"
              >
                Try Again
              </button>
              <button
                onClick={this.handleReload}
                className="px-6 py-2.5 bg-[#1e2638] hover:bg-[#2d3548] active:scale-95 text-[#e4e7eb] font-medium rounded border border-[#2d3548] transition-all duration-200 transform shadow-sm hover:shadow-md"
              >
                Reload Page
              </button>
            </div>

            {/* Help Text */}
            <p className="text-[#6b7280] text-sm text-center mt-6">
              If this problem persists, please contact support with the error details above.
            </p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
