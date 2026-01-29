# ErrorMessage Component

## Overview

The `ErrorMessage` component displays error messages with categorization, details, and actionable next steps. It provides a consistent error display pattern across the application with support for retry functionality and dismissal.

## Features

- **Error Type Categorization**: Color-coded display based on error type (network, authentication, agent, deployment, client)
- **Detailed Information**: Shows error message, technical details (expandable), and timestamp
- **Actionable Steps**: Provides user-friendly next steps based on error type
- **Retry Functionality**: Displays retry button for retryable errors
- **Dismissible**: Optional dismiss button to clear the error
- **Accessible**: Proper ARIA attributes for screen readers

## Props

```typescript
interface ErrorMessageProps {
  error: ErrorInfo;
  onRetry?: () => void;
  onDismiss?: () => void;
}

interface ErrorInfo {
  type: ErrorType;
  message: string;
  details?: string;
  timestamp: Date;
  retryable: boolean;
  agentId?: string;
  operation?: string;
}

type ErrorType = 'network' | 'authentication' | 'agent' | 'deployment' | 'client';
```

## Usage

### Basic Error Display

```tsx
import ErrorMessage from './components/ErrorMessage';
import { createErrorInfo } from './utils/errorLogger';

const error = createErrorInfo(
  'network',
  'Unable to connect to agents. Check your network connection.',
  { retryable: true }
);

<ErrorMessage error={error} />
```

### With Retry Handler

```tsx
const handleRetry = () => {
  // Retry the failed operation
  console.log('Retrying operation...');
};

<ErrorMessage 
  error={error} 
  onRetry={handleRetry}
/>
```

### With Dismiss Handler

```tsx
const handleDismiss = () => {
  // Clear the error from state
  dispatch({ type: 'CLEAR_ERROR' });
};

<ErrorMessage 
  error={error} 
  onRetry={handleRetry}
  onDismiss={handleDismiss}
/>
```

## Error Types and Styling

| Error Type | Color | Use Case |
|------------|-------|----------|
| `network` | Yellow | Connection issues, timeouts, DNS failures |
| `authentication` | Red | Auth failures, expired sessions |
| `agent` | Orange | Agent unavailable, agent internal errors |
| `deployment` | Red | CloudFormation failures, resource errors |
| `client` | Blue | Invalid input, parsing errors |

## Accessibility

- Uses `role="alert"` for screen reader announcements
- Uses `aria-live="assertive"` for immediate error notifications
- Proper `aria-label` attributes on interactive elements
- Keyboard accessible buttons

## Requirements

Validates Requirements: 9.1, 9.2, 9.3, 9.4

- 9.1: Display clear error messages
- 9.2: Include error type and description
- 9.3: Provide actionable next steps
- 9.4: Distinguish between error types
