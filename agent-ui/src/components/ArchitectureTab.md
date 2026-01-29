# ArchitectureTab Component

## Overview

The ArchitectureTab component displays architecture diagrams and descriptions from agent responses. It supports both text-based architecture descriptions and diagram rendering with markdown-like formatting.

## Features

- Markdown-style rendering for architecture descriptions
- Optional diagram display via URL
- Scrollable content for long descriptions
- Copy to clipboard functionality
- Syntax highlighting for code blocks
- Formatted headers, lists, and inline code

## Props

```typescript
interface ArchitectureTabProps {
  content: string;        // Architecture description text
  diagramUrl?: string;    // Optional URL to architecture diagram image
}
```

## Usage

```tsx
import { ArchitectureTab } from './components';

function MyComponent() {
  const architectureContent = `
# System Architecture

## Overview
This is a serverless architecture...

## Components
- Frontend Layer
- API Layer
- Agent Layer
  `;

  return (
    <ArchitectureTab
      content={architectureContent}
      diagramUrl="https://example.com/diagram.png"
    />
  );
}
```

## Styling

The component uses the application's dark theme with:
- Background: `#0a0e1a`
- Surface: `#151b2d`
- Border: `#2d3548`
- Primary text: `#e4e7eb`
- Accent: `#3b82f6`

## Accessibility

- Copy button includes `aria-label`
- Diagram includes `alt` text
- Semantic HTML structure
- Keyboard navigation support

## Requirements

Validates: Requirements 3.3, 10.1
