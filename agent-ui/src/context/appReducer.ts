import type { AppState, Agent, Message, ParsedResponse, AgentStatus } from '../types';

// ============================================================================
// Action Types
// ============================================================================

export type AppAction =
  | { type: 'SELECT_AGENT'; payload: string }
  | { type: 'UPDATE_AGENT_STATUS'; payload: { agentId: string; status: AgentStatus } }
  | { type: 'ADD_MESSAGE'; payload: { agentId: string; message: Message } }
  | { type: 'UPDATE_STREAMING_MESSAGE'; payload: { agentId: string; messageId: string; content: string } }
  | { type: 'SET_LAST_RESPONSE'; payload: { agentId: string; response: ParsedResponse } }
  | { type: 'SET_ACTIVE_TAB'; payload: { agentId: string; tabId: string } }
  | { type: 'CLEAR_CONVERSATION'; payload: string }
  | { type: 'SET_AGENTS'; payload: Agent[] }
  | { type: 'SET_ERROR'; payload: import('../types').ErrorInfo }
  | { type: 'CLEAR_ERROR' }
  | { type: 'RESTORE_STATE'; payload: Partial<AppState> };

// ============================================================================
// Reducer Function
// ============================================================================

export const appReducer = (state: AppState, action: AppAction): AppState => {
  switch (action.type) {
    case 'SELECT_AGENT':
      return {
        ...state,
        selectedAgentId: action.payload
      };

    case 'UPDATE_AGENT_STATUS': {
      const { agentId, status } = action.payload;
      return {
        ...state,
        agents: state.agents.map(agent =>
          agent.id === agentId ? { ...agent, status } : agent
        )
      };
    }

    case 'ADD_MESSAGE': {
      const { agentId, message } = action.payload;
      const conversation = state.conversations[agentId] || {
        agentId,
        messages: []
      };

      return {
        ...state,
        conversations: {
          ...state.conversations,
          [agentId]: {
            ...conversation,
            messages: [...conversation.messages, message]
          }
        }
      };
    }

    case 'UPDATE_STREAMING_MESSAGE': {
      const { agentId, messageId, content } = action.payload;
      const conversation = state.conversations[agentId];
      
      if (!conversation) {
        return state;
      }

      return {
        ...state,
        conversations: {
          ...state.conversations,
          [agentId]: {
            ...conversation,
            messages: conversation.messages.map(msg =>
              msg.id === messageId ? { ...msg, content } : msg
            )
          }
        }
      };
    }

    case 'SET_LAST_RESPONSE': {
      const { agentId, response } = action.payload;
      const conversation = state.conversations[agentId] || {
        agentId,
        messages: []
      };

      return {
        ...state,
        conversations: {
          ...state.conversations,
          [agentId]: {
            ...conversation,
            lastResponse: response
          }
        }
      };
    }

    case 'SET_ACTIVE_TAB': {
      const { agentId, tabId } = action.payload;
      const conversation = state.conversations[agentId] || {
        agentId,
        messages: []
      };

      return {
        ...state,
        conversations: {
          ...state.conversations,
          [agentId]: {
            ...conversation,
            activeTab: tabId
          }
        }
      };
    }

    case 'CLEAR_CONVERSATION': {
      const agentId = action.payload;
      return {
        ...state,
        conversations: {
          ...state.conversations,
          [agentId]: {
            agentId,
            messages: []
          }
        }
      };
    }

    case 'SET_AGENTS':
      return {
        ...state,
        agents: action.payload
      };

    case 'SET_ERROR':
      return {
        ...state,
        error: action.payload
      };

    case 'CLEAR_ERROR':
      return {
        ...state,
        error: null
      };

    case 'RESTORE_STATE':
      return {
        ...state,
        ...action.payload
      };

    default:
      return state;
  }
};
