/**
 * Local Storage Service
 * 
 * Provides functionality for persisting and retrieving conversation history,
 * user preferences, and application state using browser localStorage.
 * 
 * Features:
 * - Conversation persistence per agent
 * - State serialization/deserialization
 * - Storage quota exceeded error handling
 * - Automatic data migration for version changes
 */

import type {
  StoredState,
  StoredConversation,
  Conversation,
  UserPreferences,
} from '../types';

// ============================================================================
// Constants
// ============================================================================

const STORAGE_KEY = 'agent-ui-state';
const STORAGE_VERSION = '1.0.0';
const MAX_MESSAGES_PER_CONVERSATION = 500; // Limit message history

// ============================================================================
// Error Classes
// ============================================================================

/**
 * Custom error for storage quota exceeded
 */
export class StorageQuotaExceededError extends Error {
  constructor(message: string = 'Storage quota exceeded') {
    super(message);
    this.name = 'StorageQuotaExceededError';
  }
}

/**
 * Custom error for storage parsing failures
 */
export class StorageParseError extends Error {
  constructor(message: string = 'Failed to parse stored data') {
    super(message);
    this.name = 'StorageParseError';
  }
}

// ============================================================================
// Default State
// ============================================================================

/**
 * Default stored state structure
 */
const DEFAULT_STATE: StoredState = {
  version: STORAGE_VERSION,
  conversations: {},
  preferences: {
    theme: 'dark',
    sideNavCollapsed: false,
    codeTheme: 'dracula',
  },
  lastSelectedAgent: '',
};

// ============================================================================
// Serialization/Deserialization Helpers
// ============================================================================

/**
 * Serialize a conversation for storage
 * Converts Date objects to ISO strings for JSON compatibility
 */
function serializeConversation(conversation: Conversation): StoredConversation {
  return {
    agentId: conversation.agentId,
    messages: conversation.messages.map((msg) => ({
      ...msg,
      timestamp: msg.timestamp,
    })),
    lastResponse: conversation.lastResponse,
    activeTab: conversation.activeTab,
    timestamp: new Date(),
  };
}

/**
 * Deserialize a stored conversation
 * Converts ISO strings back to Date objects
 */
function deserializeConversation(stored: StoredConversation): Conversation {
  return {
    agentId: stored.agentId,
    messages: stored.messages.map((msg) => ({
      ...msg,
      timestamp: new Date(msg.timestamp),
    })),
    lastResponse: stored.lastResponse,
    activeTab: stored.activeTab,
  };
}

/**
 * Serialize the complete state for storage
 */
function serializeState(state: Partial<StoredState>): string {
  const stateToStore: StoredState = {
    version: STORAGE_VERSION,
    conversations: state.conversations || {},
    preferences: state.preferences || DEFAULT_STATE.preferences,
    lastSelectedAgent: state.lastSelectedAgent || '',
  };

  return JSON.stringify(stateToStore);
}

/**
 * Deserialize stored state from JSON
 */
function deserializeState(json: string): StoredState {
  try {
    const parsed = JSON.parse(json);
    
    // Validate structure
    if (!parsed || typeof parsed !== 'object') {
      throw new StorageParseError('Invalid state structure');
    }

    // Handle version migration if needed
    if (parsed.version !== STORAGE_VERSION) {
      return migrateState(parsed);
    }

    return parsed as StoredState;
  } catch (error) {
    if (error instanceof StorageParseError) {
      throw error;
    }
    throw new StorageParseError(`Failed to parse state: ${error}`);
  }
}

/**
 * Migrate state from older versions
 */
function migrateState(oldState: any): StoredState {
  // For now, just return default state with version updated
  // In future, implement actual migration logic
  console.warn(`Migrating state from version ${oldState.version} to ${STORAGE_VERSION}`);
  return {
    ...DEFAULT_STATE,
    ...oldState,
    version: STORAGE_VERSION,
  };
}

// ============================================================================
// Storage Operations
// ============================================================================

/**
 * Check if localStorage is available
 */
function isStorageAvailable(): boolean {
  try {
    const test = '__storage_test__';
    localStorage.setItem(test, test);
    localStorage.removeItem(test);
    return true;
  } catch {
    return false;
  }
}

/**
 * Get the current storage usage in bytes
 */
function getStorageSize(): number {
  let total = 0;
  for (const key in localStorage) {
    if (localStorage.hasOwnProperty(key)) {
      total += localStorage[key].length + key.length;
    }
  }
  return total;
}

/**
 * Trim old conversations to free up space
 */
function trimConversations(conversations: Record<string, StoredConversation>): Record<string, StoredConversation> {
  const trimmed: Record<string, StoredConversation> = {};
  
  for (const [agentId, conversation] of Object.entries(conversations)) {
    // Limit messages per conversation
    const messages = conversation.messages.slice(-MAX_MESSAGES_PER_CONVERSATION);
    
    trimmed[agentId] = {
      ...conversation,
      messages,
    };
  }
  
  return trimmed;
}

// ============================================================================
// Public API
// ============================================================================

/**
 * Load the complete state from localStorage
 */
export function loadState(): StoredState {
  if (!isStorageAvailable()) {
    console.warn('localStorage is not available, using default state');
    return DEFAULT_STATE;
  }

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    
    if (!stored) {
      return DEFAULT_STATE;
    }

    return deserializeState(stored);
  } catch (error) {
    console.error('Failed to load state from localStorage:', error);
    return DEFAULT_STATE;
  }
}

/**
 * Save the complete state to localStorage
 */
export function saveState(state: Partial<StoredState>): void {
  if (!isStorageAvailable()) {
    console.warn('localStorage is not available, state not saved');
    return;
  }

  try {
    // Trim conversations if needed
    const conversations = state.conversations 
      ? trimConversations(state.conversations)
      : {};

    const stateToSave = {
      ...state,
      conversations,
    };

    const serialized = serializeState(stateToSave);
    localStorage.setItem(STORAGE_KEY, serialized);
  } catch (error) {
    // Check if it's a quota exceeded error
    if (
      error instanceof DOMException &&
      (error.name === 'QuotaExceededError' || error.name === 'NS_ERROR_DOM_QUOTA_REACHED')
    ) {
      throw new StorageQuotaExceededError(
        'Storage quota exceeded. Try clearing old conversations or browser data.'
      );
    }
    throw error;
  }
}

/**
 * Load a specific conversation for an agent
 */
export function loadConversation(agentId: string): Conversation | null {
  const state = loadState();
  const stored = state.conversations[agentId];
  
  if (!stored) {
    return null;
  }

  return deserializeConversation(stored);
}

/**
 * Save a conversation for a specific agent
 */
export function saveConversation(conversation: Conversation): void {
  const state = loadState();
  const serialized = serializeConversation(conversation);
  
  state.conversations[conversation.agentId] = serialized;
  saveState(state);
}

/**
 * Delete a conversation for a specific agent
 */
export function deleteConversation(agentId: string): void {
  const state = loadState();
  delete state.conversations[agentId];
  saveState(state);
}

/**
 * Clear all conversations
 */
export function clearAllConversations(): void {
  const state = loadState();
  state.conversations = {};
  saveState(state);
}

/**
 * Load user preferences
 */
export function loadPreferences(): UserPreferences {
  const state = loadState();
  return state.preferences;
}

/**
 * Save user preferences
 */
export function savePreferences(preferences: UserPreferences): void {
  const state = loadState();
  state.preferences = preferences;
  saveState(state);
}

/**
 * Get the last selected agent ID
 */
export function getLastSelectedAgent(): string {
  const state = loadState();
  return state.lastSelectedAgent;
}

/**
 * Save the last selected agent ID
 */
export function saveLastSelectedAgent(agentId: string): void {
  const state = loadState();
  state.lastSelectedAgent = agentId;
  saveState(state);
}

/**
 * Clear all stored data
 */
export function clearAllData(): void {
  if (!isStorageAvailable()) {
    return;
  }

  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.error('Failed to clear localStorage:', error);
  }
}

/**
 * Get storage statistics
 */
export function getStorageStats(): {
  available: boolean;
  totalSize: number;
  conversationCount: number;
  version: string;
} {
  const state = loadState();
  
  return {
    available: isStorageAvailable(),
    totalSize: getStorageSize(),
    conversationCount: Object.keys(state.conversations).length,
    version: state.version,
  };
}

/**
 * Export all data as JSON string (for backup/export)
 */
export function exportData(): string {
  const state = loadState();
  return JSON.stringify(state, null, 2);
}

/**
 * Import data from JSON string (for restore/import)
 */
export function importData(jsonData: string): void {
  try {
    const state = deserializeState(jsonData);
    saveState(state);
  } catch (error) {
    throw new StorageParseError(`Failed to import data: ${error}`);
  }
}
