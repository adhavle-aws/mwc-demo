import React, { useState, useCallback, useMemo } from 'react';
import ChatWindow from './ChatWindow';
import ResponseViewer from './ResponseViewer';
import { useAgent, useConversation } from '../context/hooks';
import { parseAgentResponse } from '../utils/responseParser';
import { invokeAgent } from '../services/agentService';
import type { Message, AgentType } from '../types';

/**
 * MainContent Component
 * 
 * Main content area that displays the chat interface and response viewer
 * for the currently selected agent.
 * 
 * Features:
 * - Integrates ChatWindow for message interaction
 * - Integrates ResponseViewer for structured response display
 * - Handles agent selection changes
 * - Manages conversation state for selected agent
 * - Handles message sending and streaming
 * - Parses agent responses into structured tabs
 * 
 * Requirements: 1.3, 2.1
 */
const MainContent: React.FC = () => {
  const { selectedAgent, selectedAgentId } = useAgent();
  const {
    messages,
    lastResponse,
    addMessage,
    updateStreamingMessage,
    setLastResponse,
    setActiveTab
  } = useConversation(selectedAgentId);

  // Local state for loading and streaming
  const [isLoading, setIsLoading] = useState(false);
  const [streamingContent, setStreamingContent] = useState('');

  /**
   * Determine agent type for response parsing
   */
  const agentType = useMemo((): AgentType => {
    if (!selectedAgent) return 'onboarding';
    
    const agentName = selectedAgent.name.toLowerCase();
    if (agentName.includes('onboarding')) return 'onboarding';
    if (agentName.includes('provisioning')) return 'provisioning';
    if (agentName.includes('mwc') || agentName.includes('orchestrator')) return 'orchestrator';
    
    return 'onboarding';
  }, [selectedAgent]);

  /**
   * Handle sending a message to the agent
   */
  const handleSendMessage = useCallback(async (content: string) => {
    if (!selectedAgent || !content.trim()) {
      return;
    }

    // Create user message
    const userMessage: Message = {
      id: `msg-${Date.now()}-user`,
      role: 'user',
      content: content.trim(),
      timestamp: new Date(),
      agentId: selectedAgentId
    };

    // Add user message to conversation
    addMessage(userMessage);

    // Create placeholder agent message for streaming
    const agentMessageId = `msg-${Date.now()}-agent`;
    const agentMessage: Message = {
      id: agentMessageId,
      role: 'agent',
      content: '',
      timestamp: new Date(),
      agentId: selectedAgentId
    };

    // Add agent message placeholder
    addMessage(agentMessage);

    // Set loading state
    setIsLoading(true);
    setStreamingContent('');

    try {
      // Invoke agent via API
      const stream = invokeAgent({
        agentId: selectedAgentId,
        prompt: content.trim(),
      });

      let fullResponse = '';

      // Stream response chunks
      for await (const chunk of stream) {
        fullResponse += chunk;
        setStreamingContent(fullResponse);
        updateStreamingMessage(agentMessageId, fullResponse);
      }

      // Parse the complete response
      const parsed = parseAgentResponse(fullResponse, agentType);
      setLastResponse(parsed);

      // Clear streaming state
      setStreamingContent('');
    } catch (error) {
      console.error('Error sending message:', error);
      
      // Update message with error
      const errorContent = 'Sorry, I encountered an error processing your request. Please try again.';
      updateStreamingMessage(agentMessageId, errorContent);
      setStreamingContent('');
    } finally {
      setIsLoading(false);
    }
  }, [selectedAgent, selectedAgentId, addMessage, updateStreamingMessage, agentType, setLastResponse]);

  /**
   * Handle tab change in ResponseViewer
   */
  const handleTabChange = useCallback((tabId: string) => {
    setActiveTab(tabId);
  }, [setActiveTab]);

  /**
   * Get default empty response for display
   */
  const displayResponse = useMemo(() => {
    if (lastResponse) {
      return lastResponse;
    }

    // Return empty response structure
    return {
      raw: '',
      sections: [],
      tabs: []
    };
  }, [lastResponse]);

  // Handle case where no agent is selected
  if (!selectedAgent) {
    return (
      <div className="flex-1 flex items-center justify-center bg-[#0a0e1a]">
        <div className="text-center">
          <p className="text-[#9ca3af] text-lg">
            No agent selected
          </p>
          <p className="text-[#6b7280] text-sm mt-2">
            Select an agent from the sidebar to begin
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col lg:flex-row h-full overflow-hidden">
      {/* Chat Window - Left side on desktop, top on mobile */}
      <div className="
        flex flex-col
        h-1/2 lg:h-full
        lg:w-1/2
        border-b lg:border-b-0 lg:border-r border-[#2d3548]
        min-h-[300px] lg:min-h-0
      ">
        <ChatWindow
          agentId={selectedAgentId}
          agentName={selectedAgent.name}
          messages={messages}
          onSendMessage={handleSendMessage}
          isLoading={isLoading}
          streamingContent={streamingContent}
        />
      </div>

      {/* Response Viewer - Right side on desktop, bottom on mobile */}
      <div className="
        flex flex-col
        h-1/2 lg:h-full
        lg:w-1/2
        min-h-[300px] lg:min-h-0
      ">
        <ResponseViewer
          response={displayResponse}
          agentType={agentType}
          onTabChange={handleTabChange}
        />
      </div>
    </div>
  );
};

export default MainContent;
