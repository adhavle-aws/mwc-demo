import type { AppState, StoredState, StoredConversation, Conversation } from '../types';

// ============================================================================
// Constants
// ============================================================================

const STORAGE_KEY = 'agent-ui-state';
const STORAGE_VERSION = '1.0.0';

// ============================================================================
// State Serialization
// ============================================================================

/**
 * Converts AppState to StoredState for localStorage
 */
export const serializeState = (state: AppState): StoredState => {
  const storedConversations: Record<string, StoredConversation> = {};

  // Convert conversations to storable format
  Object.entries(state.conversations).forEach(([agentId, conversation]) => {
    storedConversations[agentId] = {
      agentId: conversation.agentId,
      messages: conversation.messages.map(msg => ({
        ...msg,
        timestamp: msg.timestamp instanceof Date ? msg.timestamp : new Date(msg.timestamp)
      })),
      lastResponse: conversation.lastResponse,
      activeTab: conversation.activeTab,
      timestamp: new Date()
    };
  });

  return {
    version: STORAGE_VERSION,
    conversations: storedConversations,
    preferences: {
      theme: 'dark',
      sideNavCollapsed: false,
      codeTheme: 'vs-dark'
    },
    lastSelectedAgent: state.selectedAgentId
  };
};

/**
 * Converts StoredState to conversation format for AppState
 */
export const deserializeConversations = (
  storedConversations: Record<string, StoredConversation>
): Record<string, Conversation> => {
  const conversations: Record<string, Conversation> = {};

  Object.entries(storedConversations).forEach(([agentId, stored]) => {
    conversations[agentId] = {
      agentId: stored.agentId,
      messages: stored.messages.map(msg => ({
        ...msg,
        timestamp: new Date(msg.timestamp)
      })),
      lastResponse: stored.lastResponse,
      activeTab: stored.activeTab
    };
  });

  return conversations;
};

// ============================================================================
// LocalStorage Operations
// ============================================================================

/**
 * Saves application state to localStorage
 */
export const saveState = (state: AppState): void => {
  try {
    const storedState = serializeState(state);
    const serialized = JSON.stringify(storedState);
    localStorage.setItem(STORAGE_KEY, serialized);
  } catch (error) {
    console.error('Failed to save state to localStorage:', error);
    
    // Handle quota exceeded error
    if (error instanceof DOMException && error.name === 'QuotaExceededError') {
      console.warn('LocalStorage quota exceeded. Clearing old data...');
      clearOldConversations();
    }
  }
};

/**
 * Loads application state from localStorage
 */
export const loadState = (): StoredState | null => {
  try {
    const serialized = localStorage.getItem(STORAGE_KEY);
    
    if (!serialized) {
      return null;
    }

    const storedState = JSON.parse(serialized) as StoredState;

    // Version check - if version mismatch, return null to use default state
    if (storedState.version !== STORAGE_VERSION) {
      console.warn('State version mismatch. Using default state.');
      localStorage.removeItem(STORAGE_KEY);
      return null;
    }

    return storedState;
  } catch (error) {
    console.error('Failed to load state from localStorage:', error);
    return null;
  }
};

/**
 * Clears all stored state
 */
export const clearState = (): void => {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.error('Failed to clear state from localStorage:', error);
  }
};

/**
 * Clears old conversations to free up space
 * Keeps only the most recent conversation per agent
 */
const clearOldConversations = (): void => {
  try {
    const serialized = localStorage.getItem(STORAGE_KEY);
    
    if (!serialized) {
      return;
    }

    const storedState = JSON.parse(serialized) as StoredState;

    // Keep only the last 10 messages per agent
    Object.keys(storedState.conversations).forEach(agentId => {
      const conversation = storedState.conversations[agentId];
      if (conversation.messages.length > 10) {
        conversation.messages = conversation.messages.slice(-10);
      }
    });

    localStorage.setItem(STORAGE_KEY, JSON.stringify(storedState));
  } catch (error) {
    console.error('Failed to clear old conversations:', error);
    // If still failing, clear everything
    localStorage.removeItem(STORAGE_KEY);
  }
};

/**
 * Gets the size of stored state in bytes
 */
export const getStorageSize = (): number => {
  try {
    const serialized = localStorage.getItem(STORAGE_KEY);
    return serialized ? new Blob([serialized]).size : 0;
  } catch (error) {
    console.error('Failed to get storage size:', error);
    return 0;
  }
};
