# ChatInput Component

Multi-line text input component for chat messages with send button and character counter.

## Features

- **Multi-line textarea** with auto-resize (max 200px height)
- **Send button** with loading state and icon
- **Keyboard shortcuts**: Enter to submit, Shift+Enter for new line
- **Character count indicator** with color coding (gray → yellow → red)
- **Disabled state** during loading
- **Empty message prevention**
- **Visual feedback** for all interactions
- **Accessibility** support with ARIA labels

## Props

```typescript
interface ChatInputProps {
  onSendMessage: (content: string) => void;
  isLoading?: boolean;
  placeholder?: string;
  maxLength?: number;
}
```

### Prop Details

- **onSendMessage** (required): Callback function called when user submits a message
- **isLoading** (optional): Whether the component is in loading state (disables input)
- **placeholder** (optional): Placeholder text for the textarea (default: "Type your message...")
- **maxLength** (optional): Maximum character limit (default: 5000)

## Usage

### Basic Usage

```tsx
import { ChatInput } from './components';

function ChatWindow() {
  const handleSendMessage = (content: string) => {
    console.log('Message:', content);
    // Send message to agent
  };

  return (
    <ChatInput onSendMessage={handleSendMessage} />
  );
}
```

### With Loading State

```tsx
import { ChatInput } from './components';
import { useState } from 'react';

function ChatWindow() {
  const [isLoading, setIsLoading] = useState(false);

  const handleSendMessage = async (content: string) => {
    setIsLoading(true);
    try {
      await sendToAgent(content);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ChatInput 
      onSendMessage={handleSendMessage}
      isLoading={isLoading}
    />
  );
}
```

### Custom Configuration

```tsx
<ChatInput
  onSendMessage={handleSendMessage}
  placeholder="Ask the agent anything..."
  maxLength={1000}
  isLoading={false}
/>
```

## Behavior

### Keyboard Shortcuts

- **Enter**: Submit message (if not empty)
- **Shift+Enter**: Insert new line

### Auto-resize

The textarea automatically adjusts its height based on content:
- Minimum height: 44px (1 row)
- Maximum height: 200px (scrollable beyond this)
- Resets to minimum after sending

### Character Count

The character counter changes color based on usage:
- **Gray** (default): 0-74% of max length
- **Yellow**: 75-89% of max length
- **Red**: 90-100% of max length

### Send Button States

- **Enabled**: When input has non-whitespace content and not loading
- **Disabled**: When input is empty or loading
- **Loading**: Shows spinner and "Sending" text

## Styling

The component uses Tailwind CSS with the application's dark theme:
- Background: `#151b2d` (surface)
- Input background: `#0a0e1a` (background)
- Border: `#2d3548`
- Text: `#e4e7eb` (primary)
- Accent: `#3b82f6` (blue)

## Accessibility

- **ARIA labels** for textarea and button
- **ARIA live region** for character count
- **Keyboard navigation** fully supported
- **Focus indicators** visible
- **Disabled state** properly communicated

## Requirements Mapping

This component satisfies the following requirements:

- **2.2**: Text input field for user messages
- **2.6**: Multi-line text input support
- **15.2**: Enter key to submit messages

## Related Components

- **Message**: Displays individual chat messages
- **ChatWindow**: Container for message list and input
- **SideNavigation**: Agent selection interface

## Examples

See `ChatInput.example.tsx` for interactive examples demonstrating:
1. Default state
2. Loading state
3. Custom placeholder
4. Custom max length
5. Interactive demo with message history
