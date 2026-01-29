# ErrorBoundary Component

## Overview

The `ErrorBoundary` component is a React error boundary that catches JavaScript errors anywhere in the child component tree, logs those errors, and displays a fallback UI instead of crashing the entire application.

## Features

- **Error Catching**: Catches React rendering errors in child components
- **Error Logging**: Automatically logs errors with stack traces
- **Fallback UI**: Displays user-friendly error screen with recovery options
- **Reset Functionality**: Allows users to try again without page reload
- **Reload Option**: Provides page reload button for persistent errors
- **Custom Fallback**: Supports custom fallback UI components
- **Error Callback**: Optional callback for custom error handling

## Props

```typescript
interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}
```

### Props Description

- `children`: Child components to protect with error boundary
- `fallback`: Optional custom fallback UI to display when error occurs
- `onError`: Optional callback function called when error is caught

## Usage

### Basic Usage

Wrap any component tree that might throw errors:

```tsx
import ErrorBoundary from './components/ErrorBoundary';

<ErrorBoundary>
  <YourComponent />
</ErrorBoundary>
```

### With Custom Fallback

Provide a custom error UI:

```tsx
<ErrorBoundary
  fallback={
    <div className="error-container">
      <h1>Oops! Something went wrong</h1>
      <p>Please refresh the page</p>
    </div>
  }
>
  <YourComponent />
</ErrorBoundary>
```

### With Error Callback

Handle errors with custom logic:

```tsx
const handleError = (error: Error, errorInfo: ErrorInfo) => {
  // Send to error tracking service
  trackError(error, errorInfo);
  
  // Show notification
  showNotification('An error occurred');
};

<ErrorBoundary onError={handleError}>
  <YourComponent />
</ErrorBoundary>
```

### Nested Error Boundaries

Isolate errors to specific sections:

```tsx
<ErrorBoundary>
  <Header />
  
  <ErrorBoundary>
    <Sidebar />
  </ErrorBoundary>
  
  <ErrorBoundary>
    <MainContent />
  </ErrorBoundary>
  
  <Footer />
</ErrorBoundary>
```

## Default Fallback UI

When no custom fallback is provided, the error boundary displays:

- Large error icon
- "Something went wrong" heading
- User-friendly error message
- Expandable error details (message, stack trace, component stack)
- "Try Again" button (resets error boundary)
- "Reload Page" button (full page reload)
- Help text with support contact information

## Error Information

The error boundary captures:

- **Error Message**: The error message from the thrown error
- **Stack Trace**: JavaScript stack trace showing where error occurred
- **Component Stack**: React component tree showing which component threw the error
- **Timestamp**: When the error occurred

## Best Practices

1. **Placement**: Place error boundaries at strategic points in your component tree
   - Root level: Catch all errors and prevent app crash
   - Section level: Isolate errors to specific features
   - Component level: Protect critical components

2. **Granularity**: Use multiple error boundaries to prevent one error from breaking the entire app

3. **Logging**: Always log errors for debugging and monitoring

4. **User Experience**: Provide clear recovery options (retry, reload, contact support)

5. **Testing**: Test error boundaries by throwing errors in development

## Limitations

Error boundaries do NOT catch errors in:
- Event handlers (use try-catch)
- Asynchronous code (use try-catch)
- Server-side rendering
- Errors thrown in the error boundary itself

For these cases, use traditional try-catch blocks and the `useError` hook to display errors.

## Requirements

Validates Requirements: 9.1, 9.5

- 9.1: Display clear error messages when errors occur
- 9.5: Add error logging for debugging and monitoring

## Related Components

- `ErrorMessage`: For displaying non-React errors (API errors, validation errors)
- `useError` hook: For managing error state in the application
- `errorLogger` utility: For logging and categorizing errors
