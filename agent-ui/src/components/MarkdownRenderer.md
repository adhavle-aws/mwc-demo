# MarkdownRenderer Component

## Overview

The `MarkdownRenderer` component provides secure markdown rendering with syntax highlighting and XSS protection. It converts markdown text to HTML while sanitizing the output to prevent security vulnerabilities.

## Features

- **Markdown Parsing**: Converts markdown to HTML using the `marked` library
- **Syntax Highlighting**: Highlights code blocks using Prism.js
- **XSS Protection**: Sanitizes HTML output using DOMPurify
- **Table Support**: Renders markdown tables with proper styling
- **List Formatting**: Renders ordered and unordered lists with proper indentation
- **GitHub Flavored Markdown**: Supports GFM features like task lists and strikethrough
- **Responsive Typography**: Uses Tailwind prose classes for beautiful typography

## Requirements

- **10.1**: Markdown rendering with proper formatting
- **10.2**: Syntax highlighting for code blocks
- **10.3**: Table rendering from markdown
- **10.4**: List rendering with proper indentation
- **Security**: HTML sanitization to prevent XSS attacks

## Usage

### Basic Usage

```tsx
import { MarkdownRenderer } from './components';

function MyComponent() {
  const markdown = `
# Hello World

This is **bold** text and this is *italic* text.

## Code Example

\`\`\`javascript
function greet(name) {
  console.log(\`Hello, \${name}!\`);
}
\`\`\`
  `;

  return <MarkdownRenderer content={markdown} />;
}
```

### With Custom Styling

```tsx
<MarkdownRenderer 
  content={markdownContent} 
  className="custom-markdown-styles"
/>
```

## Supported Markdown Features

### Headers

```markdown
# H1 Header
## H2 Header
### H3 Header
```

### Text Formatting

```markdown
**Bold text**
*Italic text*
~~Strikethrough~~
`Inline code`
```

### Lists

```markdown
- Unordered list item 1
- Unordered list item 2
  - Nested item

1. Ordered list item 1
2. Ordered list item 2
```

### Code Blocks

````markdown
```javascript
const greeting = "Hello, World!";
console.log(greeting);
```
````

Supported languages:
- JavaScript/TypeScript
- Python
- Java
- Bash
- JSON
- YAML
- SQL
- CSS
- And many more via Prism.js

### Tables

```markdown
| Column 1 | Column 2 | Column 3 |
|----------|----------|----------|
| Data 1   | Data 2   | Data 3   |
| Data 4   | Data 5   | Data 6   |
```

### Links and Images

```markdown
[Link text](https://example.com)
![Alt text](https://example.com/image.png)
```

### Blockquotes

```markdown
> This is a blockquote
> It can span multiple lines
```

## Security

The component uses DOMPurify to sanitize all HTML output, preventing XSS attacks. Only safe HTML tags and attributes are allowed:

**Allowed Tags:**
- Headers: h1-h6
- Text: p, br, hr, strong, em, u, s, del, ins
- Links: a
- Images: img
- Lists: ul, ol, li
- Code: code, pre
- Tables: table, thead, tbody, tr, th, td
- Containers: div, span
- Quotes: blockquote

**Allowed Attributes:**
- Links: href, title, target, rel
- Images: src, alt, width, height
- Styling: class, id
- Tables: align, colspan, rowspan

## Props

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| content | string | Yes | - | The markdown content to render |
| className | string | No | '' | Additional CSS classes for the container |

## Styling

The component uses Tailwind's prose plugin for beautiful typography. All styles are scoped to work with the dark theme:

- Text colors optimized for dark backgrounds
- Code blocks with syntax highlighting
- Tables with hover effects
- Responsive font sizes
- Proper spacing and indentation

## Performance

- Async rendering to prevent blocking the UI
- Loading state while parsing markdown
- Memoized parsing to avoid unnecessary re-renders
- Efficient sanitization with DOMPurify

## Accessibility

- Semantic HTML structure
- ARIA live region for dynamic content updates
- Proper heading hierarchy
- Alt text support for images
- Keyboard-accessible links

## Related Components

- **SummaryTab**: Uses MarkdownRenderer to display agent summaries
- **Message**: Could be enhanced to support markdown in messages

## Utility Functions

The component is built on top of utility functions in `utils/markdownRenderer.ts`:

- `renderMarkdown(markdown: string)`: Async function to render and sanitize markdown
- `renderMarkdownSync(markdown: string)`: Synchronous version for inline markdown
- `stripMarkdown(markdown: string)`: Remove markdown formatting to get plain text
