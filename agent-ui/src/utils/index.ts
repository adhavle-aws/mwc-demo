// Utility functions and helpers
// This file serves as the central export point for all utilities

export {
  parseAgentResponse,
  extractXmlTag,
  extractMarkdownSections,
  detectTemplateFormat,
  generateTabs,
  removeXmlTag,
  extractAllXmlTags,
} from './responseParser';

export {
  logError,
  createErrorInfo,
  parseError,
  getErrorMessage,
  getErrorActionableSteps,
} from './errorLogger';

export {
  renderMarkdown,
  renderMarkdownSync,
  stripMarkdown,
} from './markdownRenderer';
