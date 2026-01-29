# SummaryTab Component

## Overview

The SummaryTab component displays summary information from agent responses with full markdown rendering using the `marked` library. It provides a comprehensive overview with rich formatting support.

## Features

- Full markdown rendering (headers, lists, tables, code blocks)
- Syntax highlighting for code blocks
- Table rendering with proper formatting
- List formatting with proper indentation
- HTML sanitization for security (via marked library)
- Copy to clipboard functionality
- Responsive prose styling

## Props

```typescript
interface SummaryTabProps {
  content: string;  // Summary content in markdown format
}
```

## Usage

```tsx
import { SummaryTab } from './components';

function MyComponent() {
  const summaryContent = `
# Quick Summary

## What Was Created

A serverless infrastructure with:
- Lambda functions
- API Gateway
- DynamoDB tables

## Next Steps

1. Review the architecture
2. Check cost estimates
3. Deploy the infrastructure
  `;

  return <SummaryTab content={summaryContent} />;
}
```

## Markdown Support

The component supports full GitHub Flavored Markdown including:
- Headers (h1-h6)
- Bold and italic text
- Unordered and ordered lists
- Code blocks with syntax highlighting
- Inline code
- Tables
- Blockquotes
- Horizontal rules
- Links
- Images

## Styling

Uses Tailwind's prose plugin with custom dark theme styling:
- Comprehensive typography styles
- Code block styling with borders
- Table styling with hover effects
- Link styling with hover underlines
- Proper spacing and hierarchy

## Security

- Uses `marked` library for parsing
- Configured with safe defaults
- HTML sanitization enabled
- XSS protection via React's built-in escaping

## Accessibility

- Copy button includes `aria-label`
- Semantic HTML from markdown parser
- Proper heading hierarchy
- Keyboard navigation support

## Requirements

Validates: Requirements 3.3, 10.1, 10.2, 10.3, 10.4
