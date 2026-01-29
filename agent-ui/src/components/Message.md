# Message Component

## Overview

The Message component displays individual chat messages with role-based styling, timestamps, and avatars. It provides a clear visual distinction between user and agent messages.

## Features

- **Role-based styling**: Different colors and alignment for user vs agent messages
- **Timestamp display**: Shows relative time (e.g., "5m ago") or absolute time for older messages
- **Avatar/icon**: Displays avatar for both user and agent messages
- **Responsive layout**: Message bubbles adapt to content with max-width constraint
- **Accessibility**: Proper ARIA labels and semantic HTML

## Props

```typescript
interface MessageProps {
  message: Message;      // The message object to display
  agentName?: string;    // Optional agent name for avatar display
}
```

## Usage

```tsx
import Message from './components/Message';

// Agent message
<Message 
  message={{
    id: '1',
    role: 'agent',
    content: 'Hello! How can I help you today?',
    timestamp: new Date(),
    agentId: 'onboarding-agent'
  }}
  agentName="OnboardingAgent"
/>

// User message
<Message 
  message={{
    id: '2',
    role: 'user',
    content: 'I need help setting up infrastructure',
    timestamp: new Date(),
    agentId: 'onboarding-agent'
  }}
/>
```

## Styling

### Agent Messages
- Background: Dark surface color (`#151b2d`)
- Text: Light primary color (`#e4e7eb`)
- Alignment: Left-aligned
- Avatar: Blue-purple gradient with first letter of agent name

### User Messages
- Background: Accent blue (`#3b82f6`)
- Text: White
- Alignment: Right-aligned
- Avatar: Gray gradient with "U"

### Timestamp
- Format: Relative time for recent messages, absolute time for older ones
- Color: Muted gray (`#6b7280`)
- Size: Extra small (12px)

## Accessibility

- Uses semantic HTML with `role="article"` for each message
- Includes `aria-label` attributes for avatars and timestamps
- Proper color contrast for readability
- Supports screen readers

## Requirements

Validates:
- **Requirement 2.4**: Display conversation history with messages
- **Requirement 2.7**: Display timestamps for each message

## Design Reference

See Design Document section "Components and Interfaces" for detailed specifications.
