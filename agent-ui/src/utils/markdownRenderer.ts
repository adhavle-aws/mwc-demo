import { marked } from 'marked';
import DOMPurify from 'dompurify';
import Prism from 'prismjs';

// Import Prism language components for code highlighting
import 'prismjs/components/prism-javascript';
import 'prismjs/components/prism-typescript';
import 'prismjs/components/prism-jsx';
import 'prismjs/components/prism-tsx';
import 'prismjs/components/prism-python';
import 'prismjs/components/prism-java';
import 'prismjs/components/prism-bash';
import 'prismjs/components/prism-json';
import 'prismjs/components/prism-yaml';
import 'prismjs/components/prism-markdown';
import 'prismjs/components/prism-sql';
import 'prismjs/components/prism-css';

/**
 * MarkdownRenderer Utility
 * 
 * Provides secure markdown rendering with syntax highlighting and XSS protection.
 * 
 * Features:
 * - Markdown to HTML conversion using marked
 * - Syntax highlighting for code blocks using Prism.js
 * - HTML sanitization using DOMPurify to prevent XSS attacks
 * - Support for tables, lists, and other markdown features
 * - GitHub Flavored Markdown (GFM) support
 * 
 * Requirements: 10.1, 10.2, 10.3, 10.4
 */

/**
 * Configure marked with custom renderer for syntax highlighting
 */
const configureMarked = () => {
  const renderer = new marked.Renderer();

  // Override code block rendering to add Prism highlighting
  renderer.code = ({ text, lang }: { text: string; lang?: string }) => {
    // Determine language for Prism
    const language = lang || 'plaintext';
    
    // Check if Prism supports this language
    const prismLanguage = Prism.languages[language] ? language : 'plaintext';
    
    // Highlight the code
    const highlightedCode = Prism.languages[prismLanguage]
      ? Prism.highlight(text, Prism.languages[prismLanguage], prismLanguage)
      : text;

    return `<pre class="language-${prismLanguage}"><code class="language-${prismLanguage}">${highlightedCode}</code></pre>`;
  };

  marked.setOptions({
    renderer,
    breaks: true, // Convert \n to <br>
    gfm: true, // GitHub Flavored Markdown
  });
};

// Initialize marked configuration
configureMarked();

/**
 * Configure DOMPurify to allow necessary HTML elements and attributes
 */
const configureDOMPurify = () => {
  // Allow specific tags and attributes needed for markdown rendering
  DOMPurify.addHook('uponSanitizeElement', (node, data) => {
    // Allow Prism.js classes on code elements
    if (data.tagName === 'code' || data.tagName === 'pre') {
      const element = node as HTMLElement;
      const className = element.getAttribute('class');
      if (className && className.startsWith('language-')) {
        // Keep language classes for Prism
        return;
      }
    }
  });
};

// Initialize DOMPurify configuration
configureDOMPurify();

/**
 * Render markdown to sanitized HTML
 * 
 * @param markdown - The markdown string to render
 * @returns Sanitized HTML string safe for rendering
 */
export const renderMarkdown = async (markdown: string): Promise<string> => {
  try {
    // Parse markdown to HTML
    const rawHtml = await marked.parse(markdown);
    
    // Sanitize HTML to prevent XSS attacks
    const sanitizedHtml = DOMPurify.sanitize(rawHtml, {
      // Allow necessary tags for markdown rendering
      ALLOWED_TAGS: [
        'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
        'p', 'br', 'hr',
        'strong', 'em', 'u', 's', 'del', 'ins',
        'a', 'img',
        'ul', 'ol', 'li',
        'blockquote',
        'code', 'pre',
        'table', 'thead', 'tbody', 'tr', 'th', 'td',
        'div', 'span',
      ],
      // Allow necessary attributes
      ALLOWED_ATTR: [
        'href', 'title', 'target', 'rel',
        'src', 'alt', 'width', 'height',
        'class', 'id',
        'align', 'colspan', 'rowspan',
      ],
      // Allow data attributes for Prism
      ALLOW_DATA_ATTR: false,
      // Keep relative URLs
      ALLOW_UNKNOWN_PROTOCOLS: false,
    });
    
    return sanitizedHtml;
  } catch (error) {
    console.error('Failed to render markdown:', error);
    // Return escaped content as fallback
    return `<pre>${escapeHtml(markdown)}</pre>`;
  }
};

/**
 * Synchronous version of renderMarkdown for cases where async is not suitable
 * Note: This uses marked.parse() which is now async, so we use parseInline as fallback
 * 
 * @param markdown - The markdown string to render
 * @returns Sanitized HTML string safe for rendering
 */
export const renderMarkdownSync = (markdown: string): string => {
  try {
    // Use marked's synchronous inline parser for simple cases
    // For full markdown, use the async version
    const rawHtml = marked.parseInline(markdown) as string;
    
    // Sanitize HTML
    const sanitizedHtml = DOMPurify.sanitize(rawHtml, {
      ALLOWED_TAGS: [
        'strong', 'em', 'u', 's', 'del', 'ins',
        'a', 'code', 'span',
      ],
      ALLOWED_ATTR: ['href', 'title', 'class'],
    });
    
    return sanitizedHtml;
  } catch (error) {
    console.error('Failed to render markdown:', error);
    return escapeHtml(markdown);
  }
};

/**
 * Escape HTML special characters
 * 
 * @param text - Text to escape
 * @returns Escaped text safe for HTML
 */
const escapeHtml = (text: string): string => {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
};

/**
 * Strip markdown formatting and return plain text
 * 
 * @param markdown - Markdown string
 * @returns Plain text without markdown formatting
 */
export const stripMarkdown = (markdown: string): string => {
  // Remove markdown syntax
  return markdown
    .replace(/#{1,6}\s+/g, '') // Headers
    .replace(/\*\*(.+?)\*\*/g, '$1') // Bold
    .replace(/\*(.+?)\*/g, '$1') // Italic
    .replace(/__(.+?)__/g, '$1') // Bold
    .replace(/_(.+?)_/g, '$1') // Italic
    .replace(/~~(.+?)~~/g, '$1') // Strikethrough
    .replace(/`(.+?)`/g, '$1') // Inline code
    .replace(/\[(.+?)\]\(.+?\)/g, '$1') // Links
    .replace(/!\[(.+?)\]\(.+?\)/g, '$1') // Images
    .replace(/^>\s+/gm, '') // Blockquotes
    .replace(/^[-*+]\s+/gm, '') // Unordered lists
    .replace(/^\d+\.\s+/gm, '') // Ordered lists
    .replace(/```[\s\S]*?```/g, '') // Code blocks
    .trim();
};
