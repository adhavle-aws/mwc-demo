import React from 'react';

/**
 * ArchitectureTab Component
 * 
 * Displays architecture diagrams and descriptions from agent responses.
 * Supports both text-based architecture descriptions and diagram rendering.
 * 
 * Features:
 * - Markdown rendering for architecture descriptions
 * - Diagram display (Mermaid, PlantUML, or image URLs)
 * - Scrollable content for long descriptions
 * - Copy to clipboard functionality
 * 
 * Requirements: 3.3, 10.1
 */

export interface ArchitectureTabProps {
  content: string;
  diagramUrl?: string;
}

const ArchitectureTab: React.FC<ArchitectureTabProps> = ({ content, diagramUrl }) => {
  const [copySuccess, setCopySuccess] = React.useState(false);

  /**
   * Copy architecture content to clipboard
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

  /**
   * Format content with basic markdown-like rendering
   * Handles headers, lists, and code blocks
   */
  const formatContent = (text: string): React.ReactElement[] => {
    const lines = text.split('\n');
    const elements: React.ReactElement[] = [];
    let inCodeBlock = false;
    let codeBlockContent: string[] = [];

    lines.forEach((line, index) => {
      // Code block detection
      if (line.trim().startsWith('```')) {
        if (!inCodeBlock) {
          inCodeBlock = true;
          // Extract language from code fence (e.g., ```yaml)
          line.trim().substring(3);
          codeBlockContent = [];
        } else {
          inCodeBlock = false;
          elements.push(
            <pre
              key={`code-${index}`}
              className="bg-[#1e2638] border border-[#2d3548] rounded p-4 my-3 overflow-x-auto"
            >
              <code className="text-sm font-mono text-[#e4e7eb]">
                {codeBlockContent.join('\n')}
              </code>
            </pre>
          );
          codeBlockContent = [];
        }
        return;
      }

      if (inCodeBlock) {
        codeBlockContent.push(line);
        return;
      }

      // Headers
      if (line.startsWith('### ')) {
        elements.push(
          <h3 key={`h3-${index}`} className="text-lg font-semibold text-[#e4e7eb] mt-6 mb-3">
            {line.substring(4)}
          </h3>
        );
      } else if (line.startsWith('## ')) {
        elements.push(
          <h2 key={`h2-${index}`} className="text-xl font-bold text-[#e4e7eb] mt-8 mb-4">
            {line.substring(3)}
          </h2>
        );
      } else if (line.startsWith('# ')) {
        elements.push(
          <h1 key={`h1-${index}`} className="text-2xl font-bold text-[#e4e7eb] mt-8 mb-4">
            {line.substring(2)}
          </h1>
        );
      }
      // Unordered lists
      else if (line.trim().startsWith('- ') || line.trim().startsWith('* ')) {
        elements.push(
          <li key={`li-${index}`} className="text-[#e4e7eb] ml-6 my-1 list-disc">
            {line.trim().substring(2)}
          </li>
        );
      }
      // Ordered lists
      else if (/^\d+\.\s/.test(line.trim())) {
        elements.push(
          <li key={`oli-${index}`} className="text-[#e4e7eb] ml-6 my-1 list-decimal">
            {line.trim().replace(/^\d+\.\s/, '')}
          </li>
        );
      }
      // Inline code
      else if (line.includes('`')) {
        const parts = line.split('`');
        elements.push(
          <p key={`p-${index}`} className="text-[#e4e7eb] my-2 leading-relaxed">
            {parts.map((part, i) =>
              i % 2 === 0 ? (
                part
              ) : (
                <code
                  key={`inline-${i}`}
                  className="bg-[#1e2638] px-1.5 py-0.5 rounded text-sm font-mono text-[#3b82f6]"
                >
                  {part}
                </code>
              )
            )}
          </p>
        );
      }
      // Regular paragraphs
      else if (line.trim()) {
        elements.push(
          <p key={`p-${index}`} className="text-[#e4e7eb] my-2 leading-relaxed">
            {line}
          </p>
        );
      }
      // Empty lines
      else {
        elements.push(<div key={`space-${index}`} className="h-2" />);
      }
    });

    return elements;
  };

  return (
    <div className="flex flex-col h-full bg-[#0a0e1a]">
      {/* Header with copy button */}
      <div className="flex items-center justify-between px-3 sm:px-6 py-3 sm:py-4 border-b border-[#2d3548] bg-[#151b2d] flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <svg
            className="w-5 h-5 text-[#3b82f6]"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
            />
          </svg>
          <h3 className="text-base sm:text-lg font-semibold text-[#e4e7eb]">Architecture Overview</h3>
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
          aria-label="Copy architecture content to clipboard"
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

      {/* Content area */}
      <div className="flex-1 overflow-auto p-3 sm:p-6">
        {/* Diagram display if URL provided */}
        {diagramUrl && (
          <div className="mb-6 bg-[#151b2d] border border-[#2d3548] rounded-lg p-3 sm:p-4">
            <img
              src={diagramUrl}
              alt="Architecture diagram"
              className="w-full h-auto rounded"
            />
          </div>
        )}

        {/* Architecture content */}
        <div className="prose prose-invert max-w-none">
          {formatContent(content)}
        </div>
      </div>
    </div>
  );
};

export default ArchitectureTab;
