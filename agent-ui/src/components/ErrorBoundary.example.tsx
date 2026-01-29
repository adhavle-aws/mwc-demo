import React, { useState } from 'react';
import ErrorBoundary from './ErrorBoundary';

/**
 * ErrorBoundary Component Examples
 * 
 * Demonstrates error boundary functionality with components that throw errors
 */

/**
 * Component that throws an error when button is clicked
 */
const BuggyComponent: React.FC<{ shouldThrow: boolean }> = ({ shouldThrow }) => {
  if (shouldThrow) {
    throw new Error('This is a simulated React error!');
  }

  return (
    <div className="p-4 bg-[#151b2d] border border-[#2d3548] rounded">
      <p className="text-[#e4e7eb]">This component is working fine.</p>
    </div>
  );
};

/**
 * Example container showing error boundary in action
 */
const ErrorBoundaryExample: React.FC = () => {
  const [shouldThrow, setShouldThrow] = useState(false);
  const [errorCount, setErrorCount] = useState(0);

  const handleThrowError = () => {
    setShouldThrow(true);
  };

  const handleErrorCaught = (error: Error) => {
    console.log('Error caught by boundary:', error.message);
    setErrorCount(prev => prev + 1);
  };

  return (
    <div className="min-h-screen bg-[#0a0e1a] p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-[#e4e7eb] mb-2">
          ErrorBoundary Component Example
        </h1>
        <p className="text-[#9ca3af] mb-8">
          Demonstrating React error boundary functionality
        </p>

        {/* Stats */}
        <div className="mb-6 p-4 bg-[#151b2d] border border-[#2d3548] rounded">
          <p className="text-[#9ca3af] text-sm">
            Errors caught: <span className="text-[#e4e7eb] font-semibold">{errorCount}</span>
          </p>
        </div>

        {/* Example 1: Basic Error Boundary */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-[#e4e7eb] mb-3">
            Example 1: Basic Error Boundary
          </h2>
          <p className="text-[#9ca3af] text-sm mb-4">
            Click the button to trigger an error. The error boundary will catch it and display a fallback UI.
          </p>

          <ErrorBoundary onError={handleErrorCaught}>
            <div className="space-y-4">
              <button
                onClick={handleThrowError}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded transition-colors"
              >
                Throw Error
              </button>

              <BuggyComponent shouldThrow={shouldThrow} />
            </div>
          </ErrorBoundary>
        </div>

        {/* Example 2: Custom Fallback */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-[#e4e7eb] mb-3">
            Example 2: Custom Fallback UI
          </h2>
          <p className="text-[#9ca3af] text-sm mb-4">
            Error boundary with a custom fallback component.
          </p>

          <ErrorBoundary
            fallback={
              <div className="p-6 bg-red-900/20 border border-red-600 rounded text-center">
                <p className="text-red-500 font-semibold mb-2">Custom Error UI</p>
                <p className="text-[#9ca3af] text-sm">
                  This is a custom fallback component instead of the default error UI.
                </p>
              </div>
            }
          >
            <div className="p-4 bg-[#151b2d] border border-[#2d3548] rounded">
              <p className="text-[#e4e7eb]">
                This section has a custom error fallback.
              </p>
            </div>
          </ErrorBoundary>
        </div>

        {/* Example 3: Nested Error Boundaries */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-[#e4e7eb] mb-3">
            Example 3: Nested Error Boundaries
          </h2>
          <p className="text-[#9ca3af] text-sm mb-4">
            Multiple error boundaries can be nested to isolate errors to specific sections.
          </p>

          <div className="grid grid-cols-2 gap-4">
            <ErrorBoundary>
              <div className="p-4 bg-[#151b2d] border border-[#2d3548] rounded">
                <p className="text-[#e4e7eb] text-sm">Section 1 - Protected</p>
              </div>
            </ErrorBoundary>

            <ErrorBoundary>
              <div className="p-4 bg-[#151b2d] border border-[#2d3548] rounded">
                <p className="text-[#e4e7eb] text-sm">Section 2 - Protected</p>
              </div>
            </ErrorBoundary>
          </div>
        </div>

        {/* Reset Instructions */}
        <div className="p-4 bg-blue-900/20 border border-blue-600 rounded">
          <p className="text-blue-400 text-sm">
            <strong>Note:</strong> After an error is thrown, you'll need to reload the page
            to reset the example. The error boundary's "Try Again" button will reset the
            boundary state.
          </p>
        </div>
      </div>
    </div>
  );
};

export default ErrorBoundaryExample;
