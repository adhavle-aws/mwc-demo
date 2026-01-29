# Application State Management

This directory contains the application state management system using React Context API and hooks.

## Overview

The state management system provides:
- Centralized application state
- Agent selection and status management
- Per-agent conversation history
- Tab state preservation
- Automatic localStorage persistence
- Type-safe state updates

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        AppProvider                           │
│  ┌───────────────────────────────────────────────────────┐  │
│  │                    AppContext                          │  │
│  │  • state: AppState                                    │  │
│  │  • dispatch: React.Dispatch<AppAction>               │  │
│  └───────────────────────────────────────────────────────┘  │
│                           │                                  │
│                           ├─────────────────────────────────┤
│                           │                                  │
│  ┌────────────────────┐  │  ┌──────────────────────────┐   │
│  │   appReducer       │◄─┼─►│  statePersistence        │   │
│  │  • State updates   │  │  │  • Save to localStorage  │   │
│  │  • Action handlers │  │  │  • Load from localStorage│   │
│  └────────────────────┘  │  └──────────────────────────┘   │
│                           │                                  │
│  ┌────────────────────────────────────────────────────────┐ │
│  │                    Custom Hooks                         │ │
│  │  • useAgent()       - Agent management                 │ │
│  │  • useConversation() - Conversation management         │ │
│  │  • useAppState()    - Full state access               │ │
│  └────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

## Files

### AppContext.tsx
Main context provider and initialization logic.
- Creates React Context
- Initializes state (with persistence)
- Provides state and dispatch to children
- Auto-saves state on changes

### appReducer.ts
State reducer with action handlers.
- Defines action types
- Implements state update logic
- Ensures immutable updates

### statePersistence.ts
LocalStorage persistence layer.
- Serializes/deserializes state
- Handles storage quota errors
- Manages state versioning
- Cleans old data when needed

### hooks.ts
Custom hooks for accessing state.
- `useAgent()` - Agent-related operations
- `useConversation()` - Conversation operations
- `useAppState()` - Full state access

## Usage

### 1. Wrap your app with AppProvider

```tsx
import { AppProvider } from './context';

function App() {
  return (
    <AppProvider>
      <YourApp />
    </AppProvider>
  );
}
```

### 2. Use hooks in components

#### Agent Management

```tsx
import { useAgent } from './context';

function AgentSelector() {
  const { 
    agents, 
    selectedAgent, 
    selectAgent, 
    updateAgentStatus 
  } = useAgent();

  return (
    <div>
      {agents.map(agent => (
        <button 
          key={agent.id}
          onClick={() => selectAgent(agent.id)}
        >
          {agent.name} - {agent.status}
        </button>
      ))}
    </div>
  );
}
```

#### Conversation Management

```tsx
import { useConversation } from './context';

function ChatWindow() {
  const { 
    messages, 
    addMessage, 
    clearConversation,
    lastResponse,
    activeTab,
    setActiveTab
  } = useConversation();

  const handleSend = (content: string) => {
    const message: Message = {
      id: `msg-${Date.now()}`,
      role: 'user',
      content,
      timestamp: new Date(),
      agentId: selectedAgentId
    };
    addMessage(message);
  };

  return (
    <div>
      {messages.map(msg => (
        <div key={msg.id}>{msg.content}</div>
      ))}
    </div>
  );
}
```

#### Using conversation for specific agent

```tsx
// Get conversation for a specific agent (not the selected one)
const { messages } = useConversation('onboarding');
```

## State Structure

```typescript
interface AppState {
  selectedAgentId: string;
  agents: Agent[];
  conversations: Record<string, Conversation>;
  user: User;
}

interface Conversation {
  agentId: string;
  messages: Message[];
  lastResponse?: ParsedResponse;
  activeTab?: string;
}
```

## Actions

### Agent Actions
- `SELECT_AGENT` - Change selected agent
- `UPDATE_AGENT_STATUS` - Update agent availability status
- `SET_AGENTS` - Replace all agents

### Conversation Actions
- `ADD_MESSAGE` - Add message to conversation
- `UPDATE_STREAMING_MESSAGE` - Update streaming message content
- `SET_LAST_RESPONSE` - Set parsed response
- `SET_ACTIVE_TAB` - Set active tab for agent
- `CLEAR_CONVERSATION` - Clear agent conversation

### State Actions
- `RESTORE_STATE` - Restore partial state

## Persistence

State is automatically persisted to localStorage:
- Saves on every state change
- Loads on app initialization
- Handles storage quota errors
- Cleans old data when needed
- Version-aware (migrates on version change)

### Storage Key
`agent-ui-state`

### Stored Data
- Conversation history per agent
- Last response and active tab per agent
- Selected agent
- User preferences

### Storage Management

```typescript
import { clearState, getStorageSize } from './context';

// Clear all stored state
clearState();

// Get storage size in bytes
const size = getStorageSize();
console.log(`Storage size: ${size} bytes`);
```

## Best Practices

1. **Use specific hooks**: Prefer `useAgent()` or `useConversation()` over `useAppState()`
2. **Memoization**: Hooks use `useMemo` and `useCallback` for performance
3. **Immutability**: Reducer ensures immutable state updates
4. **Type safety**: All actions and state are fully typed
5. **Error handling**: Persistence handles quota and parsing errors gracefully

## Requirements Validation

This implementation satisfies:

- **Requirement 12.1**: Maintains conversation history for each agent separately ✓
- **Requirement 12.5**: Persists conversation history in browser storage across page refreshes ✓

## Testing

See `AppContext.example.tsx` for usage examples.

To test persistence:
1. Add messages to a conversation
2. Refresh the page
3. Verify messages are restored
4. Switch agents
5. Verify each agent has separate history
