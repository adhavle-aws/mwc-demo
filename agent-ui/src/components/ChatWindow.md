# ChatWindow Component

## Overview

The `ChatWindow` component provides an interactive chat interface for communicating with AI agents. It displays conversation history, handles real-time streaming responses, and integrates the `ChatInput` component for message submission.

## Features

- **Message History Display**: Shows all messages in chronological order with timestamps
- **Auto-Scroll**: Automatically scrolls to the latest message when new content arrives
- **Smart Scroll Detection**: Disables auto-scroll when user manually scrolls up to read history
- **Streaming Support**: Displays real-time streaming content as it arrives from the agent
- **Loading Indicators**: Shows typing indicator when agent is processing
- **Empty State**: Displays helpful message when starting a new conversation
- **Scroll to Bottom Button**: Appears when user scrolls up, allowing quick return to latest message
- **Accessibility**: Full ARIA labels and keyboard navigation support

## Props

```typescript
interface ChatWindowProps {
  agentId: string;           // Unique identifier for the agent
  agentName?: string;        // Display name of the agent (optional)
  messages: Message[];       // Array of conversation messages
  onSendMessage: (content: string) => void;  // Callback when user sends a message
  isLoading: boolean;        // Whether agent is currently processing
  streamingContent?: string; // Real-time streaming content from agent
}
```

## Usage

### Basic Usage

```tsx
import { ChatWindow } from './components';
import type { Message } from './types';

function App() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [streamingContent, setStreamingContent] = useState('');

  const handleSendMessage = async (content: string) => {
    // Add user message
    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      content,
      timestamp: new Date(),
      agentId: 'onboarding-agent',
    };
    setMessages([...messages, userMessage]);

    // Start streaming
    setIsLoading(true);
    setStreamingContent('');

    // Simulate streaming response
    // In real app, this would call the agent API
    let buffer = '';
    for await (const chunk of streamAgentResponse(content)) {
      buffer += chunk;
      setStreamingContent(buffer);
    }

    // Add complete agent message
    const agentMessage: Message = {
      id: crypto.randomUUID(),
      role: 'agent',
      content: buffer,
      timestamp: new Date(),
      agentId: 'onboarding-agent',
    };
    setMessages([...messages, userMessage, agentMessage]);
    setStreamingContent('');
    setIsLoading(false);
  };

  return (
    <ChatWindow
      agentId="onboarding-agent"
      agentName="OnboardingAgent"
      messages={messages}
      onSendMessage={handleSendMessage}
      isLoading={isLoading}
      streamingContent={streamingContent}
    />
  );
}
```

### With Agent Service Integration

```tsx
import { ChatWindow } from './components';
import { invokeAgent } from './services/agentService';
import type { Message } from './types';

function AgentChat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [streamingContent, setStreamingContent] = useState('');

  const handleSendMessage = async (content: string) => {
    // Add user message
    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      content,
      timestamp: new Date(),
      agentId: 'provisioning-agent',
    };
    setMessages(prev => [...prev, userMessage]);

    // Start streaming from agent
    setIsLoading(true);
    setStreamingContent('');

    try {
      let buffer = '';
      
      for await (const chunk of invokeAgent({
        agentId: 'provisioning-agent',
        prompt: content,
      })) {
        buffer += chunk;
        setStreamingContent(buffer);
      }

      // Add complete agent message
      const agentMessage: Message = {
        id: crypto.randomUUID(),
        role: 'agent',
        content: buffer,
        timestamp: new Date(),
        agentId: 'provisioning-agent',
      };
      setMessages(prev => [...prev, agentMessage]);
    } catch (error) {
      console.error('Failed to get agent response:', error);
      // Handle error appropriately
    } finally {
      setStreamingContent('');
      setIsLoading(false);
    }
  };

  return (
    <ChatWindow
      agentId="provisioning-agent"
      agentName="ProvisioningAgent"
      messages={messages}
      onSendMessage={handleSendMessage}
      isLoading={isLoading}
      streamingContent={streamingContent}
    />
  );
}
```

## Behavior

### Auto-Scroll Logic

The component implements smart auto-scrolling:

1. **Auto-scroll enabled** (default):
   - Automatically scrolls to bottom when new messages arrive
   - Automatically scrolls when streaming content updates
   - Re-enabled when user sends a new message

2. **Auto-scroll disabled**:
   - Triggered when user manually scrolls up (more than 100px from bottom)
   - Allows user to read message history without interruption
   - Shows "Scroll to bottom" button for easy return

### Streaming Display

When `streamingContent` is provided:
- Displays content in real-time as it arrives
- Shows blinking cursor to indicate active streaming
- Displays "Streaming..." label below the message
- Auto-scrolls to show new content as it arrives

### Loading States

1. **Initial loading** (isLoading=true, no streamingContent):
   - Shows animated typing indicator
   - Displays "{AgentName} is typing..." message

2. **Streaming** (isLoading=true, streamingContent present):
   - Shows streaming content with cursor
   - Updates in real-time as chunks arrive

3. **Complete** (isLoading=false):
   - Streaming content is converted to a permanent message
   - Ready for next interaction

## Styling

The component uses Tailwind CSS with the application's dark theme:

- Background: `#0a0e1a` (dark background)
- Message container: `#151b2d` (surface color)
- Text: `#e4e7eb` (primary text)
- Borders: `#2d3548` (border color)
- Accent: `#3b82f6` (blue accent)

## Accessibility

- **ARIA Labels**: All interactive elements have descriptive labels
- **Live Regions**: Message updates announced to screen readers
- **Keyboard Navigation**: Full keyboard support via ChatInput
- **Focus Management**: Proper focus indicators on all interactive elements
- **Semantic HTML**: Uses appropriate roles (region, log, status)

## Requirements Validation

This component satisfies the following requirements:

- **2.1**: Displays chat window when agent is selected
- **2.4**: Shows conversation history between user and agent
- **2.5**: Shows loading indicators while waiting for responses
- **11.1**: Displays response incrementally as it streams
- **11.2**: Auto-scrolls to show new content as it arrives
- **11.3**: Indicates when agent is actively generating a response

## Related Components

- **Message**: Displays individual chat messages
- **ChatInput**: Handles user input and message submission
- **AgentStatusIndicator**: Shows agent availability status

## Notes

- The component expects messages to be provided in chronological order
- Message IDs should be unique (use `crypto.randomUUID()` or similar)
- The `streamingContent` prop should be cleared when streaming completes
- The component handles both empty state and populated conversation history
- Scroll behavior is optimized for performance with smooth scrolling
