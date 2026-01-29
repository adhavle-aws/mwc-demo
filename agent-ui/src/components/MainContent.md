# MainContent Component

## Overview

The `MainContent` component is the primary content area of the Agent UI application. It integrates the chat interface and response viewer, managing the conversation flow for the currently selected agent.

## Features

- **Dual-pane layout**: Chat window on the left, response viewer on the right
- **Agent-aware**: Automatically adapts to the selected agent
- **Conversation management**: Maintains message history per agent
- **Streaming support**: Displays real-time streaming responses
- **Response parsing**: Automatically parses agent responses into structured tabs
- **Responsive design**: Adapts layout for mobile and desktop

## Props

This component does not accept props. It uses the application context to access:
- Selected agent information
- Conversation state
- Message history

## Usage

```tsx
import MainContent from './components/MainContent';

function App() {
  return (
    <div className="app">
      <SideNavigation />
      <MainContent />
    </div>
  );
}
```

## Layout Structure

```
┌─────────────────────────────────────────────────────────┐
│                     MainContent                          │
├──────────────────────────┬──────────────────────────────┤
│      ChatWindow          │     ResponseViewer           │
│                          │                              │
│  • Message History       │  • Tabbed Response           │
│  • Chat Input            │  • Architecture              │
│  • Streaming Display     │  • Cost Optimization         │
│                          │  • CloudFormation Template   │
│                          │  • Progress/Resources        │
└──────────────────────────┴──────────────────────────────┘
```

## State Management

The component uses React Context hooks to manage state:

- `useAgent()`: Access selected agent information
- `useConversation()`: Access and update conversation state

Local state:
- `isLoading`: Indicates when waiting for agent response
- `streamingContent`: Temporary storage for streaming content
- `streamingMessageId`: Tracks which message is being streamed

## Message Flow

1. User types message in ChatInput
2. `handleSendMessage` is called
3. User message is added to conversation
4. Placeholder agent message is created
5. API call is made to agent service (simulated for now)
6. Response streams in, updating `streamingContent`
7. Complete response is parsed into structured tabs
8. Parsed response is stored in conversation state

## Agent Type Detection

The component automatically detects the agent type based on the selected agent's name:

- **OnboardingAgent**: Architecture, cost optimization, CloudFormation templates
- **ProvisioningAgent**: Deployment progress, resources, outputs, events
- **MWCAgent/Orchestrator**: Workflow coordination, multi-agent orchestration

## Responsive Behavior

- **Desktop (≥1024px)**: Side-by-side layout with chat on left, response on right
- **Mobile (<1024px)**: Stacked layout with chat on top, response on bottom

## Integration Points

### ChatWindow Integration

```tsx
<ChatWindow
  agentId={selectedAgentId}
  agentName={selectedAgent.name}
  messages={messages}
  onSendMessage={handleSendMessage}
  isLoading={isLoading}
  streamingContent={streamingContent}
/>
```

### ResponseViewer Integration

```tsx
<ResponseViewer
  response={displayResponse}
  agentType={agentType}
  onTabChange={handleTabChange}
/>
```

## Future Enhancements

### API Integration

Currently uses simulated responses. Will be replaced with actual agent API calls:

```typescript
// Future implementation
const response = await agentService.invokeAgent({
  agentId: selectedAgentId,
  prompt: content,
  sessionId: conversation.sessionId
});

// Stream response
for await (const chunk of response.stream) {
  setStreamingContent(prev => prev + chunk);
}
```

### Error Handling

Will include comprehensive error handling for:
- Network failures
- Agent timeouts
- Invalid responses
- Authentication errors

### Progress Polling

For ProvisioningAgent, will implement CloudFormation stack polling:

```typescript
// Poll stack status every 5 seconds
const pollInterval = setInterval(async () => {
  const status = await getStackStatus(stackName);
  updateProgressDisplay(status);
  
  if (isTerminalStatus(status)) {
    clearInterval(pollInterval);
  }
}, 5000);
```

## Requirements Validation

This component satisfies the following requirements:

- **Requirement 1.3**: Displays selected agent's interface in main content area
- **Requirement 2.1**: Displays chat window when agent is selected
- **Requirement 2.3**: Sends messages to selected agent
- **Requirement 2.4**: Displays conversation history
- **Requirement 3.1**: Parses responses into logical sections
- **Requirement 3.2**: Displays response sections in separate tabs
- **Requirement 11.1**: Displays responses incrementally as they stream
- **Requirement 12.2**: Preserves conversation history when switching agents

## Accessibility

- Semantic HTML structure with proper ARIA labels
- Keyboard navigation support through child components
- Screen reader friendly with live regions for streaming content
- Focus management for modal interactions

## Performance Considerations

- Memoized agent type calculation
- Callback memoization to prevent unnecessary re-renders
- Efficient state updates during streaming
- Lazy loading of response tabs

## Testing

### Unit Tests

Test the following behaviors:
- Agent selection changes update displayed content
- Message sending creates user and agent messages
- Streaming content updates in real-time
- Response parsing creates appropriate tabs
- Tab state persists across agent switches

### Integration Tests

Test the following workflows:
- Complete message send and response flow
- Agent switching with history preservation
- Streaming response handling
- Error scenarios

## Related Components

- `ChatWindow`: Message display and input
- `ResponseViewer`: Tabbed response display
- `SideNavigation`: Agent selection
- `Message`: Individual message rendering
- `ChatInput`: Message input field
- `TabBar`: Tab navigation
- `TemplateTab`, `ProgressTab`, etc.: Tab content components

## Context Dependencies

- `AppContext`: Application state management
- `useAgent`: Agent selection and status
- `useConversation`: Conversation state management

## Styling

Uses Tailwind CSS with the application's dark theme:
- Background: `#0a0e1a`
- Border: `#2d3548`
- Responsive breakpoints: `lg:` prefix for desktop (1024px+)

## Notes

- The component handles agent selection changes automatically through context
- Conversation state is preserved when switching between agents
- Streaming content is displayed in real-time with visual indicators
- The layout adapts to screen size for optimal viewing on all devices
