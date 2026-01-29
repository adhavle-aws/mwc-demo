import React, { useEffect, useRef, useState } from 'react';
import Prism from 'prismjs';
import 'prismjs/themes/prism-tomorrow.css';
import 'prismjs/components/prism-yaml';
import 'prismjs/components/prism-json';
import type { TemplateTabProps } from '../types';

/**
 * TemplateTab Component
 * 
 * Displays CloudFormation templates with syntax highlighting, line numbers,
 * and copy/download functionality.
 * 
 * Features:
 * - Syntax highlighting for YAML and JSON using Prism.js
 * - Automatic format detection
 * - Line numbers
 * - Copy to clipboard button with confirmation
 * - Download as file button
 * - Scrollable content for long templates
 * - Preserves formatting and indentation
 * 
 * Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6
 */
const TemplateTab: React.FC<TemplateTabProps> = ({ template, format }) => {
  const codeRef = useRef<HTMLElement>(null);
  const [copySuccess, setCopySuccess] = useState(false);
  const [detectedFormat, setDetectedFormat] = useState<'yaml' | 'json'>(format);

  /**
   * Detect template format if not explicitly provided
   */
  useEffect(() => {
    if (!format) {
      // Try to detect format from content
      const trimmed = template.trim();
      if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
        setDetectedFormat('json');
      } else {
        setDetectedFormat('yaml');
      }
    } else {
      setDetectedFormat(format);
    }
  }, [template, format]);

  /**
   * Apply syntax highlighting when template or format changes
   */
  useEffect(() => {
    if (codeRef.current) {
      Prism.highlightElement(codeRef.current);
    }
  }, [template, detectedFormat]);

  /**
   * Copy template to clipboard
   */
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(template);
      setCopySuccess(true);
      
      // Reset success message after 2 seconds
      setTimeout(() => {
        setCopySuccess(false);
      }, 2000);
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
    }
  };

  /**
   * Download template as file
   */
  const handleDownload = () => {
    const fileExtension = detectedFormat === 'json' ? 'json' : 'yaml';
    const fileName = `cloudformation-template.${fileExtension}`;
    const mimeType = detectedFormat === 'json' ? 'application/json' : 'text/yaml';

    // Create blob and download link
    const blob = new Blob([template], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    
    // Trigger download
    document.body.appendChild(link);
    link.click();
    
    // Cleanup
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  /**
   * Get language class for Prism
   */
  const getLanguageClass = (): string => {
    return `language-${detectedFormat}`;
  };

  /**
   * Generate line numbers
   */
  const getLineNumbers = (): string => {
    const lines = template.split('\n');
    return lines.map((_, index) => index + 1).join('\n');
  };

  return (
    <div className="flex flex-col h-full bg-[#0a0e1a]">
      {/* Header with action buttons */}
      <div className="flex items-center justify-between px-3 sm:px-4 py-2 sm:py-3 border-b border-[#2d3548] bg-[#151b2d] flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <span className="text-xs sm:text-sm font-medium text-[#9ca3af]">
            CloudFormation Template
          </span>
          <span className="px-2 py-0.5 text-xs font-medium text-[#3b82f6] bg-[#3b82f6]/10 rounded">
            {detectedFormat.toUpperCase()}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Copy button */}
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
              active:scale-95
              transition-all duration-200
              transform
              focus:outline-none focus:ring-2 focus:ring-[#3b82f6]
              flex items-center gap-1 sm:gap-2
              shadow-sm hover:shadow-md
            "
            aria-label="Copy template to clipboard"
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

          {/* Download button */}
          <button
            onClick={handleDownload}
            className="
              px-2 sm:px-3 py-1.5
              text-xs sm:text-sm font-medium
              text-[#e4e7eb]
              bg-[#1e2638]
              border border-[#2d3548]
              rounded
              hover:bg-[#2d3548]
              active:scale-95
              transition-all duration-200
              transform
              focus:outline-none focus:ring-2 focus:ring-[#3b82f6]
              flex items-center gap-1 sm:gap-2
              shadow-sm hover:shadow-md
            "
            aria-label="Download template as file"
          >
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
                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
              />
            </svg>
            <span className="hidden xs:inline">Download</span>
          </button>
        </div>
      </div>

      {/* Code display with line numbers */}
      <div className="flex-1 overflow-auto">
        <div className="flex min-h-full">
          {/* Line numbers - hidden on very small screens */}
          <pre
            className="
              py-4 px-2 sm:px-3
              text-xs sm:text-sm
              text-[#6b7280]
              bg-[#0a0e1a]
              border-r border-[#2d3548]
              select-none
              user-select-none
              font-mono
              text-right
              min-w-[2.5rem] sm:min-w-[3rem]
              hidden xs:block
            "
            aria-hidden="true"
          >
            {getLineNumbers()}
          </pre>

          {/* Code content with syntax highlighting */}
          <pre
            className="
              flex-1
              py-4 px-3 sm:px-4
              text-xs sm:text-sm
              font-mono
              bg-[#0a0e1a]
              overflow-x-auto
            "
          >
            <code
              ref={codeRef}
              className={getLanguageClass()}
              style={{
                background: 'transparent',
                padding: 0,
                margin: 0,
                fontSize: 'inherit',
                fontFamily: 'inherit',
              }}
            >
              {template}
            </code>
          </pre>
        </div>
      </div>
    </div>
  );
};

export default TemplateTab;
