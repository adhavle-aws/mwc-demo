import React, { useState } from 'react';
import MarkdownRenderer from './MarkdownRenderer';

/**
 * SummaryTab Component
 * 
 * Displays summary information from agent responses with full markdown rendering.
 * Provides a comprehensive overview of the agent's response.
 * 
 * Features:
 * - Full markdown rendering using marked library
 * - Syntax highlighting for code blocks
 * - Table rendering
 * - List formatting
 * - HTML sanitization for security
 * - Copy to clipboard functionality
 * 
 * Requirements: 3.3, 10.1, 10.2, 10.3, 10.4
 */

export interface SummaryTabProps {
  content: string;
}

const SummaryTab: React.FC<SummaryTabProps> = ({ content }) => {
  const [copySuccess, setCopySuccess] = useState(false);

  /**
   * Copy summary content to clipboard
   */
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(content);
      setCopySuccess(true);
      
      setTimeout(() => {
        setCopySuccess(false);
      }, 2000);
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#0a0e1a]">
      {/* Header with copy button */}
      <div className="flex items-center justify-between px-3 sm:px-6 py-3 sm:py-4 border-b border-[#2d3548] bg-[#151b2d] flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <svg
            className="w-5 h-5 text-[#8b5cf6]"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
          <h3 className="text-base sm:text-lg font-semibold text-[#e4e7eb]">Summary</h3>
        </div>

        <button
          onClick={handleCopy}
          className="
            px-2 sm:px-3 py-1.5
            text-xs sm:text-sm font-medium
            text-[#e4e7eb]
            bg-[#1e2638]
            border border-[#2d3548]
            rounded
            hover:bg-[#2d3548]
            transition-colors
            focus:outline-none focus:ring-2 focus:ring-[#3b82f6]
            flex items-center gap-1 sm:gap-2
          "
          aria-label="Copy summary content to clipboard"
        >
          {copySuccess ? (
            <>
              <svg
                className="w-4 h-4 text-[#10b981]"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
              <span className="text-[#10b981] hidden xs:inline">Copied!</span>
            </>
          ) : (
            <>
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                />
              </svg>
              <span className="hidden xs:inline">Copy</span>
            </>
          )}
        </button>
      </div>

      {/* Content area with markdown rendering */}
      <div className="flex-1 overflow-auto p-3 sm:p-6">
        <MarkdownRenderer content={content} />
      </div>
    </div>
  );
};

export default SummaryTab;
