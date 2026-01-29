/**
 * Example usage of AppContext and state management hooks
 * 
 * This file demonstrates how to use the application state management system.
 */

import React from 'react';
import { AppProvider, useAgent, useConversation } from './index';
import type { Message } from '../types';

// ============================================================================
// Example Component: Agent Selector
// ============================================================================

const AgentSelector: React.FC = () => {
  const { agents, selectedAgentId, selectAgent } = useAgent();

  return (
    <div>
      <h2>Select an Agent</h2>
      <ul>
        {agents.map(agent => (
          <li key={agent.id}>
            <button
              onClick={() => selectAgent(agent.id)}
              style={{
                fontWeight: selectedAgentId === agent.id ? 'bold' : 'normal'
              }}
            >
              {agent.icon} {agent.name} - {agent.status}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
};

// ============================================================================
// Example Component: Conversation Display
// ============================================================================

const ConversationDisplay: React.FC = () => {
  const { selectedAgentId } = useAgent();
  const { messages, addMessage, clearConversation, messageCount } = useConversation();

  const handleSendMessage = () => {
    const newMessage: Message = {
      id: `msg-${Date.now()}`,
      role: 'user',
      content: 'Hello, agent!',
      timestamp: new Date(),
      agentId: selectedAgentId
    };
    addMessage(newMessage);
  };

  return (
    <div>
      <h2>Conversation ({messageCount} messages)</h2>
      <div>
        {messages.map(msg => (
          <div key={msg.id}>
            <strong>{msg.role}:</strong> {msg.content}
          </div>
        ))}
      </div>
      <button onClick={handleSendMessage}>Send Message</button>
      <button onClick={clearConversation}>Clear Conversation</button>
    </div>
  );
};

// ============================================================================
// Example Component: Tab State
// ============================================================================

const TabStateExample: React.FC = () => {
  const { activeTab, setActiveTab, lastResponse } = useConversation();

  const tabs = lastResponse?.tabs || [];

  return (
    <div>
      <h2>Response Tabs</h2>
      {tabs.length === 0 ? (
        <p>No response yet</p>
      ) : (
        <div>
          <div>
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  fontWeight: activeTab === tab.id ? 'bold' : 'normal'
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>
          <div>
            <p>Active Tab: {activeTab || 'None'}</p>
          </div>
        </div>
      )}
    </div>
  );
};

// ============================================================================
// Example App
// ============================================================================

const ExampleApp: React.FC = () => {
  return (
    <AppProvider>
      <div style={{ padding: '20px' }}>
        <h1>State Management Example</h1>
        <AgentSelector />
        <hr />
        <ConversationDisplay />
        <hr />
        <TabStateExample />
      </div>
    </AppProvider>
  );
};

export default ExampleApp;

// ============================================================================
// Usage Notes
// ============================================================================

/**
 * How to use the state management system:
 * 
 * 1. Wrap your app with AppProvider:
 *    ```tsx
 *    <AppProvider>
 *      <App />
 *    </AppProvider>
 *    ```
 * 
 * 2. Use hooks in your components:
 *    ```tsx
 *    const { agents, selectAgent } = useAgent();
 *    const { messages, addMessage } = useConversation();
 *    ```
 * 
 * 3. State is automatically persisted to localStorage
 * 
 * 4. State is restored on page refresh
 * 
 * 5. Each agent has its own conversation history
 * 
 * 6. Tab state is preserved per agent
 */
