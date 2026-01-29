import React from 'react';

/**
 * CostOptimizationTab Component
 * 
 * Displays cost optimization recommendations and breakdowns from agent responses.
 * Shows cost-saving tips, pricing estimates, and resource cost breakdowns.
 * 
 * Features:
 * - Formatted cost recommendations
 * - Cost breakdown tables
 * - Highlighting of cost-saving opportunities
 * - Copy to clipboard functionality
 * 
 * Requirements: 3.4, 10.1
 */

export interface CostOptimizationTabProps {
  content: string;
}

const CostOptimizationTab: React.FC<CostOptimizationTabProps> = ({ content }) => {
  const [copySuccess, setCopySuccess] = React.useState(false);

  /**
   * Copy cost optimization content to clipboard
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
   * Format content with markdown-like rendering
   * Emphasizes cost-related information
   */
  const formatContent = (text: string): React.ReactElement[] => {
    const lines = text.split('\n');
    const elements: React.ReactElement[] = [];
    let inCodeBlock = false;
    let codeBlockContent: string[] = [];
    let inList = false;

    lines.forEach((line, index) => {
      // Code block detection
      if (line.trim().startsWith('```')) {
        if (!inCodeBlock) {
          inCodeBlock = true;
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
        if (inList) {
          inList = false;
        }
        elements.push(
          <h3 key={`h3-${index}`} className="text-lg font-semibold text-[#e4e7eb] mt-6 mb-3 flex items-center gap-2">
            <svg
              className="w-5 h-5 text-[#10b981]"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            {line.substring(4)}
          </h3>
        );
      } else if (line.startsWith('## ')) {
        if (inList) {
          inList = false;
        }
        elements.push(
          <h2 key={`h2-${index}`} className="text-xl font-bold text-[#e4e7eb] mt-8 mb-4">
            {line.substring(3)}
          </h2>
        );
      } else if (line.startsWith('# ')) {
        if (inList) {
          inList = false;
        }
        elements.push(
          <h1 key={`h1-${index}`} className="text-2xl font-bold text-[#e4e7eb] mt-8 mb-4">
            {line.substring(2)}
          </h1>
        );
      }
      // Unordered lists with special styling for cost items
      else if (line.trim().startsWith('- ') || line.trim().startsWith('* ')) {
        const listContent = line.trim().substring(2);
        const hasCostIndicator = listContent.includes('$') || 
                                  listContent.toLowerCase().includes('cost') ||
                                  listContent.toLowerCase().includes('save') ||
                                  listContent.toLowerCase().includes('reduce');
        
        if (!inList) {
          inList = true;
        }

        elements.push(
          <li
            key={`li-${index}`}
            className={`
              ml-6 my-2 list-disc
              ${hasCostIndicator ? 'text-[#10b981] font-medium' : 'text-[#e4e7eb]'}
            `}
          >
            {listContent}
          </li>
        );
      }
      // Ordered lists
      else if (/^\d+\.\s/.test(line.trim())) {
        if (!inList) {
          inList = true;
        }
        elements.push(
          <li key={`oli-${index}`} className="text-[#e4e7eb] ml-6 my-2 list-decimal">
            {line.trim().replace(/^\d+\.\s/, '')}
          </li>
        );
      }
      // Highlight cost savings callouts
      else if (line.trim().startsWith('>')) {
        if (inList) {
          inList = false;
        }
        elements.push(
          <div
            key={`callout-${index}`}
            className="
              my-4 p-4
              bg-[#10b981]/10
              border-l-4 border-[#10b981]
              rounded-r
            "
          >
            <p className="text-[#10b981] font-medium">
              {line.trim().substring(1).trim()}
            </p>
          </div>
        );
      }
      // Inline code and emphasis
      else if (line.includes('`') || line.includes('**')) {
        if (inList) {
          inList = false;
        }
        let formattedLine = line;
        const parts: React.ReactNode[] = [];
        let currentText = '';
        let i = 0;

        while (i < formattedLine.length) {
          if (formattedLine[i] === '`') {
            if (currentText) {
              parts.push(currentText);
              currentText = '';
            }
            i++;
            let codeText = '';
            while (i < formattedLine.length && formattedLine[i] !== '`') {
              codeText += formattedLine[i];
              i++;
            }
            parts.push(
              <code
                key={`inline-${i}`}
                className="bg-[#1e2638] px-1.5 py-0.5 rounded text-sm font-mono text-[#3b82f6]"
              >
                {codeText}
              </code>
            );
            i++;
          } else if (formattedLine.substring(i, i + 2) === '**') {
            if (currentText) {
              parts.push(currentText);
              currentText = '';
            }
            i += 2;
            let boldText = '';
            while (i < formattedLine.length - 1 && formattedLine.substring(i, i + 2) !== '**') {
              boldText += formattedLine[i];
              i++;
            }
            parts.push(
              <strong key={`bold-${i}`} className="font-semibold text-[#3b82f6]">
                {boldText}
              </strong>
            );
            i += 2;
          } else {
            currentText += formattedLine[i];
            i++;
          }
        }

        if (currentText) {
          parts.push(currentText);
        }

        elements.push(
          <p key={`p-${index}`} className="text-[#e4e7eb] my-2 leading-relaxed">
            {parts}
          </p>
        );
      }
      // Regular paragraphs
      else if (line.trim()) {
        if (inList) {
          inList = false;
        }
        elements.push(
          <p key={`p-${index}`} className="text-[#e4e7eb] my-2 leading-relaxed">
            {line}
          </p>
        );
      }
      // Empty lines
      else {
        if (inList) {
          inList = false;
        }
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
            className="w-5 h-5 text-[#10b981]"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <h3 className="text-base sm:text-lg font-semibold text-[#e4e7eb]">Cost Optimization</h3>
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
            active:scale-95
            transition-all duration-200
            transform
            focus:outline-none focus:ring-2 focus:ring-[#3b82f6]
            flex items-center gap-1 sm:gap-2
            shadow-sm hover:shadow-md
          "
          aria-label="Copy cost optimization content to clipboard"
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
        {/* Cost savings banner */}
        <div className="mb-4 sm:mb-6 p-3 sm:p-4 bg-[#10b981]/10 border border-[#10b981]/30 rounded-lg">
          <div className="flex items-center gap-2 sm:gap-3">
            <svg
              className="w-5 h-5 sm:w-6 sm:h-6 text-[#10b981] flex-shrink-0"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
              />
            </svg>
            <div>
              <p className="text-xs sm:text-sm font-semibold text-[#10b981]">
                Cost Optimization Recommendations
              </p>
              <p className="text-xs text-[#9ca3af] mt-1">
                Review these suggestions to reduce infrastructure costs
              </p>
            </div>
          </div>
        </div>

        {/* Cost optimization content */}
        <div className="prose prose-invert max-w-none text-sm sm:text-base">
          {formatContent(content)}
        </div>
      </div>
    </div>
  );
};

export default CostOptimizationTab;
