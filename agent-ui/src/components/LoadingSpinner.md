# LoadingSpinner Component

## Overview

The LoadingSpinner component provides a reusable, animated loading indicator with configurable size and color options. It uses a circular spinning animation to indicate loading or processing states.

## Features

- **Multiple Sizes**: Small, medium, and large variants
- **Color Options**: Primary blue, white, and gray
- **Smooth Animation**: CSS-based spinning animation
- **Accessible**: Includes proper ARIA attributes
- **Lightweight**: Pure SVG implementation

## Props

```typescript
interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  color?: 'primary' | 'white' | 'gray';
  className?: string;
}
```

### size
- **Type**: `'sm' | 'md' | 'lg'`
- **Default**: `'md'`
- **Description**: Controls the size of the spinner
  - `sm`: 16px (w-4 h-4)
  - `md`: 24px (w-6 h-6)
  - `lg`: 32px (w-8 h-8)

### color
- **Type**: `'primary' | 'white' | 'gray'`
- **Default**: `'primary'`
- **Description**: Controls the color of the spinner
  - `primary`: Blue (#3b82f6)
  - `white`: White
  - `gray`: Gray (#9ca3af)

### className
- **Type**: `string`
- **Default**: `''`
- **Description**: Additional CSS classes to apply to the spinner

## Usage Examples

### Basic Usage

```tsx
import { LoadingSpinner } from './components';

// Default spinner (medium, primary color)
<LoadingSpinner />
```

### Size Variations

```tsx
// Small spinner
<LoadingSpinner size="sm" />

// Medium spinner (default)
<LoadingSpinner size="md" />

// Large spinner
<LoadingSpinner size="lg" />
```

### Color Variations

```tsx
// Primary blue (default)
<LoadingSpinner color="primary" />

// White (for dark backgrounds)
<LoadingSpinner color="white" />

// Gray (for subtle loading)
<LoadingSpinner color="gray" />
```

### In Button

```tsx
<button className="px-4 py-2 bg-blue-600 text-white rounded flex items-center gap-2">
  <LoadingSpinner size="sm" color="white" />
  <span>Processing...</span>
</button>
```

### Centered Loading

```tsx
<div className="flex items-center justify-center h-64">
  <LoadingSpinner size="lg" />
</div>
```

### Inline Loading

```tsx
<p className="flex items-center gap-2">
  <LoadingSpinner size="sm" />
  <span>Loading data...</span>
</p>
```

## Accessibility

- Uses `role="status"` for screen reader announcements
- Includes `aria-label="Loading"` for context
- Respects `prefers-reduced-motion` media query

## Requirements

- **8.3**: Visual feedback for all user interactions

## Related Components

- **ChatInput**: Uses LoadingSpinner in send button during message submission
- **ChatWindow**: Uses LoadingSpinner in typing indicator
- **ProgressTab**: Uses LoadingSpinner for resource status
