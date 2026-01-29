import React from 'react';
import LoadingSpinner from './LoadingSpinner';

/**
 * LoadingSpinner Component Examples
 * 
 * This file demonstrates various use cases of the LoadingSpinner component.
 */

const LoadingSpinnerExample: React.FC = () => {
  return (
    <div className="p-8 bg-[#0a0e1a] min-h-screen">
      <h1 className="text-2xl font-bold text-[#e4e7eb] mb-8">
        LoadingSpinner Component Examples
      </h1>

      {/* Size variations */}
      <section className="mb-12">
        <h2 className="text-xl font-semibold text-[#e4e7eb] mb-4">
          Size Variations
        </h2>
        <div className="flex items-center gap-8 p-6 bg-[#151b2d] rounded-lg">
          <div className="flex flex-col items-center gap-2">
            <LoadingSpinner size="sm" />
            <span className="text-xs text-[#9ca3af]">Small</span>
          </div>
          <div className="flex flex-col items-center gap-2">
            <LoadingSpinner size="md" />
            <span className="text-xs text-[#9ca3af]">Medium</span>
          </div>
          <div className="flex flex-col items-center gap-2">
            <LoadingSpinner size="lg" />
            <span className="text-xs text-[#9ca3af]">Large</span>
          </div>
        </div>
      </section>

      {/* Color variations */}
      <section className="mb-12">
        <h2 className="text-xl font-semibold text-[#e4e7eb] mb-4">
          Color Variations
        </h2>
        <div className="flex items-center gap-8 p-6 bg-[#151b2d] rounded-lg">
          <div className="flex flex-col items-center gap-2">
            <LoadingSpinner color="primary" />
            <span className="text-xs text-[#9ca3af]">Primary</span>
          </div>
          <div className="flex flex-col items-center gap-2">
            <LoadingSpinner color="white" />
            <span className="text-xs text-[#9ca3af]">White</span>
          </div>
          <div className="flex flex-col items-center gap-2">
            <LoadingSpinner color="gray" />
            <span className="text-xs text-[#9ca3af]">Gray</span>
          </div>
        </div>
      </section>

      {/* In context examples */}
      <section className="mb-12">
        <h2 className="text-xl font-semibold text-[#e4e7eb] mb-4">
          In Context Examples
        </h2>
        
        {/* Button with spinner */}
        <div className="mb-6">
          <h3 className="text-sm font-medium text-[#9ca3af] mb-3">
            Button Loading State
          </h3>
          <button
            className="
              px-4 py-2 bg-[#3b82f6] text-white rounded-lg
              flex items-center gap-2
            "
            disabled
          >
            <LoadingSpinner size="sm" color="white" />
            <span>Processing...</span>
          </button>
        </div>

        {/* Centered loading */}
        <div className="mb-6">
          <h3 className="text-sm font-medium text-[#9ca3af] mb-3">
            Centered Loading
          </h3>
          <div className="h-32 bg-[#151b2d] rounded-lg flex items-center justify-center">
            <LoadingSpinner size="lg" />
          </div>
        </div>

        {/* Inline loading */}
        <div className="mb-6">
          <h3 className="text-sm font-medium text-[#9ca3af] mb-3">
            Inline Loading
          </h3>
          <div className="p-4 bg-[#151b2d] rounded-lg">
            <p className="text-[#e4e7eb] flex items-center gap-2">
              <LoadingSpinner size="sm" />
              <span>Loading data...</span>
            </p>
          </div>
        </div>
      </section>
    </div>
  );
};

export default LoadingSpinnerExample;
