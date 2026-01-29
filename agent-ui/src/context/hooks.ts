import { useCallback, useMemo } from 'react';
import { useAppContext } from './AppContext';
import type { Agent, Conversation, Message, ParsedResponse, AgentStatus, ErrorInfo } from '../types';

// ============================================================================
// useAgent Hook
// ============================================================================

/**
 * Hook for accessing and managing agent-related state
 */
export const useAgent = () => {
  const { state, dispatch } = useAppContext();

  /**
   * Get all agents
   */
  const agents = useMemo(() => state.agents, [state.agents]);

  /**
   * Get currently selected agent
   */
  const selectedAgent = useMemo(
    () => state.agents.find(agent => agent.id === state.selectedAgentId),
    [state.agents, state.selectedAgentId]
  );

  /**
   * Get selected agent ID
   */
  const selectedAgentId = useMemo(
    () => state.selectedAgentId,
    [state.selectedAgentId]
  );

  /**
   * Select an agent
   */
  const selectAgent = useCallback(
    (agentId: string) => {
      dispatch({ type: 'SELECT_AGENT', payload: agentId });
    },
    [dispatch]
  );

  /**
   * Update agent status
   */
  const updateAgentStatus = useCallback(
    (agentId: string, status: AgentStatus) => {
      dispatch({ type: 'UPDATE_AGENT_STATUS', payload: { agentId, status } });
    },
    [dispatch]
  );

  /**
   * Get agent by ID
   */
  const getAgentById = useCallback(
    (agentId: string): Agent | undefined => {
      return state.agents.find(agent => agent.id === agentId);
    },
    [state.agents]
  );

  /**
   * Check if agent is available
   */
  const isAgentAvailable = useCallback(
    (agentId: string): boolean => {
      const agent = state.agents.find(a => a.id === agentId);
      return agent?.status === 'available';
    },
    [state.agents]
  );

  return {
    agents,
    selectedAgent,
    selectedAgentId,
    selectAgent,
    updateAgentStatus,
    getAgentById,
    isAgentAvailable
  };
};

// ============================================================================
// useConversation Hook
// ============================================================================

/**
 * Hook for accessing and managing conversation state
 */
export const useConversation = (agentId?: string) => {
  const { state, dispatch } = useAppContext();
  
  // Use provided agentId or fall back to selected agent
  const targetAgentId = agentId || state.selectedAgentId;

  /**
   * Get conversation for the target agent
   */
  const conversation = useMemo(
    (): Conversation => {
      return state.conversations[targetAgentId] || {
        agentId: targetAgentId,
        messages: []
      };
    },
    [state.conversations, targetAgentId]
  );

  /**
   * Get messages for the target agent
   */
  const messages = useMemo(
    () => conversation.messages,
    [conversation.messages]
  );

  /**
   * Get last response for the target agent
   */
  const lastResponse = useMemo(
    () => conversation.lastResponse,
    [conversation.lastResponse]
  );

  /**
   * Get active tab for the target agent
   */
  const activeTab = useMemo(
    () => conversation.activeTab,
    [conversation.activeTab]
  );

  /**
   * Add a message to the conversation
   */
  const addMessage = useCallback(
    (message: Message) => {
      dispatch({
        type: 'ADD_MESSAGE',
        payload: { agentId: targetAgentId, message }
      });
    },
    [dispatch, targetAgentId]
  );

  /**
   * Update a streaming message's content
   */
  const updateStreamingMessage = useCallback(
    (messageId: string, content: string) => {
      dispatch({
        type: 'UPDATE_STREAMING_MESSAGE',
        payload: { agentId: targetAgentId, messageId, content }
      });
    },
    [dispatch, targetAgentId]
  );

  /**
   * Set the last response for the agent
   */
  const setLastResponse = useCallback(
    (response: ParsedResponse) => {
      dispatch({
        type: 'SET_LAST_RESPONSE',
        payload: { agentId: targetAgentId, response }
      });
    },
    [dispatch, targetAgentId]
  );

  /**
   * Set the active tab
   */
  const setActiveTab = useCallback(
    (tabId: string) => {
      dispatch({
        type: 'SET_ACTIVE_TAB',
        payload: { agentId: targetAgentId, tabId }
      });
    },
    [dispatch, targetAgentId]
  );

  /**
   * Clear the conversation
   */
  const clearConversation = useCallback(() => {
    dispatch({
      type: 'CLEAR_CONVERSATION',
      payload: targetAgentId
    });
  }, [dispatch, targetAgentId]);

  /**
   * Get the last message
   */
  const lastMessage = useMemo(
    () => messages.length > 0 ? messages[messages.length - 1] : undefined,
    [messages]
  );

  /**
   * Check if conversation has messages
   */
  const hasMessages = useMemo(
    () => messages.length > 0,
    [messages.length]
  );

  /**
   * Get message count
   */
  const messageCount = useMemo(
    () => messages.length,
    [messages.length]
  );

  return {
    conversation,
    messages,
    lastResponse,
    activeTab,
    lastMessage,
    hasMessages,
    messageCount,
    addMessage,
    updateStreamingMessage,
    setLastResponse,
    setActiveTab,
    clearConversation
  };
};

// ============================================================================
// useAppState Hook
// ============================================================================

/**
 * Hook for accessing the entire application state
 * Use sparingly - prefer useAgent or useConversation for specific needs
 */
export const useAppState = () => {
  const { state, dispatch } = useAppContext();

  return {
    state,
    dispatch
  };
};

// ============================================================================
// useError Hook
// ============================================================================

/**
 * Hook for accessing and managing error state
 */
export const useError = () => {
  const { state, dispatch } = useAppContext();

  /**
   * Get current error
   */
  const error = useMemo(() => state.error, [state.error]);

  /**
   * Check if there is an error
   */
  const hasError = useMemo(() => !!state.error, [state.error]);

  /**
   * Set an error
   */
  const setError = useCallback(
    (errorInfo: ErrorInfo) => {
      dispatch({ type: 'SET_ERROR', payload: errorInfo });
    },
    [dispatch]
  );

  /**
   * Clear the current error
   */
  const clearError = useCallback(() => {
    dispatch({ type: 'CLEAR_ERROR' });
  }, [dispatch]);

  return {
    error,
    hasError,
    setError,
    clearError
  };
};
