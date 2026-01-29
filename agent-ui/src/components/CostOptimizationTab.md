# CostOptimizationTab Component

## Overview

The CostOptimizationTab component displays cost optimization recommendations and breakdowns from agent responses. It emphasizes cost-saving opportunities with special highlighting and formatting.

## Features

- Formatted cost recommendations
- Cost breakdown display
- Highlighting of cost-saving opportunities (green text)
- Special callout styling for important tips
- Copy to clipboard functionality
- Code block rendering for configuration examples

## Props

```typescript
interface CostOptimizationTabProps {
  content: string;  // Cost optimization content in markdown format
}
```

## Usage

```tsx
import { CostOptimizationTab } from './components';

function MyComponent() {
  const costContent = `
# Cost Optimization

## Estimated Cost: $247/month

### Savings Opportunities
- Reduce Lambda memory: Save $22/month
- Use S3 lifecycle policies: Save $8/month
  `;

  return <CostOptimizationTab content={costContent} />;
}
```

## Special Formatting

The component applies special styling to cost-related content:
- Lines containing `$`, `cost`, `save`, or `reduce` are highlighted in green
- Callouts (lines starting with `>`) are displayed in green boxes
- Code blocks show configuration examples

## Styling

Uses the application's dark theme with cost-specific accents:
- Success/savings color: `#10b981` (green)
- Banner background: `#10b981/10`
- Standard text: `#e4e7eb`

## Accessibility

- Copy button includes `aria-label`
- Semantic HTML structure
- Icon decorations marked with `aria-hidden`

## Requirements

Validates: Requirements 3.4, 10.1
