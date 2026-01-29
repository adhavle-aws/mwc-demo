import React, { useEffect, useState } from 'react';
import { renderMarkdown } from '../utils/markdownRenderer';

/**
 * MarkdownRenderer Component Props
 */
export interface MarkdownRendererProps {
  /** Markdown content to render */
  content: string;
  /** Optional CSS class name for the container */
  className?: string;
}

/**
 * MarkdownRenderer Component
 * 
 * A React component that safely renders markdown content with syntax highlighting
 * and XSS protection.
 * 
 * Features:
 * - Markdown to HTML conversion
 * - Syntax highlighting for code blocks
 * - HTML sanitization to prevent XSS
 * - Support for tables, lists, and other markdown features
 * - Responsive typography with Tailwind prose classes
 * 
 * Requirements: 10.1, 10.2, 10.3, 10.4
 * 
 * @example
 * ```tsx
 * <MarkdownRenderer content="# Hello World\n\nThis is **bold** text." />
 * ```
 */
const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({
  content,
  className = '',
}) => {
  const [htmlContent, setHtmlContent] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  /**
   * Parse and sanitize markdown content
   */
  useEffect(() => {
    const parseContent = async () => {
      setIsLoading(true);
      try {
        const html = await renderMarkdown(content);
        setHtmlContent(html);
      } catch (error) {
        console.error('Failed to render markdown:', error);
        // Fallback to escaped plain text
        const div = document.createElement('div');
        div.textContent = content;
        setHtmlContent(`<pre>${div.innerHTML}</pre>`);
      } finally {
        setIsLoading(false);
      }
    };

    parseContent();
  }, [content]);

  if (isLoading) {
    return (
      <div className={`flex items-center justify-center p-4 ${className}`}>
        <div className="animate-pulse text-[#9ca3af]">Rendering...</div>
      </div>
    );
  }

  return (
    <div
      className={`
        prose prose-invert max-w-none
        prose-headings:text-[#e4e7eb]
        prose-h1:text-xl sm:prose-h1:text-2xl prose-h1:font-bold prose-h1:mb-4 prose-h1:mt-8
        prose-h2:text-lg sm:prose-h2:text-xl prose-h2:font-bold prose-h2:mb-3 prose-h2:mt-6
        prose-h3:text-base sm:prose-h3:text-lg prose-h3:font-semibold prose-h3:mb-2 prose-h3:mt-4
        prose-p:text-[#e4e7eb] prose-p:leading-relaxed prose-p:my-2 prose-p:text-sm sm:prose-p:text-base
        prose-a:text-[#3b82f6] prose-a:no-underline hover:prose-a:underline
        prose-strong:text-[#e4e7eb] prose-strong:font-semibold
        prose-em:text-[#9ca3af] prose-em:italic
        prose-code:text-[#3b82f6] prose-code:bg-[#1e2638] prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-xs sm:prose-code:text-sm prose-code:font-mono
        prose-pre:bg-[#1e2638] prose-pre:border prose-pre:border-[#2d3548] prose-pre:rounded prose-pre:p-3 sm:prose-pre:p-4 prose-pre:overflow-x-auto
        prose-pre:my-4 prose-pre:text-xs sm:prose-pre:text-sm
        prose-ul:text-[#e4e7eb] prose-ul:my-3 prose-ul:list-disc prose-ul:ml-4 sm:prose-ul:ml-6
        prose-ol:text-[#e4e7eb] prose-ol:my-3 prose-ol:list-decimal prose-ol:ml-4 sm:prose-ol:ml-6
        prose-li:my-1 prose-li:text-sm sm:prose-li:text-base
        prose-blockquote:border-l-4 prose-blockquote:border-[#3b82f6] prose-blockquote:pl-4 prose-blockquote:italic prose-blockquote:text-[#9ca3af]
        prose-table:w-full prose-table:border-collapse prose-table:my-4 prose-table:text-xs sm:prose-table:text-sm
        prose-thead:border-b-2 prose-thead:border-[#2d3548]
        prose-th:text-left prose-th:p-2 sm:prose-th:p-3 prose-th:text-[#e4e7eb] prose-th:font-semibold prose-th:bg-[#151b2d]
        prose-td:p-2 sm:prose-td:p-3 prose-td:text-[#e4e7eb] prose-td:border-t prose-td:border-[#2d3548]
        prose-tr:hover:bg-[#151b2d]/50
        prose-img:rounded prose-img:border prose-img:border-[#2d3548]
        prose-hr:border-[#2d3548] prose-hr:my-6
        ${className}
      `}
      dangerouslySetInnerHTML={{ __html: htmlContent }}
      aria-live="polite"
    />
  );
};

export default MarkdownRenderer;
