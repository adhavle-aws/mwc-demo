import React, { useRef, useEffect, useState } from 'react';
import type { Message as MessageType } from '../types';
import Message from './Message';
import ChatInput from './ChatInput';

/**
 * ChatWindow Component Props
 */
export interface ChatWindowProps {
  agentId: string;
  agentName?: string;
  messages: MessageType[];
  onSendMessage: (content: string) => void;
  isLoading: boolean;
  streamingContent?: string;
}

/**
 * ChatWindow Component
 * 
 * Interactive chat interface for agent communication with message history,
 * auto-scrolling, and real-time streaming support.
 * 
 * Features:
 * - Message list display with conversation history
 * - Auto-scroll to latest message
 * - Integrated ChatInput component
 * - Loading indicator for streaming responses
 * - Real-time streaming content display
 * - Empty state for new conversations
 * 
 * Requirements: 2.1, 2.4, 2.5, 11.1, 11.2, 11.3
 */
const ChatWindow: React.FC<ChatWindowProps> = ({
  agentName,
  messages,
  onSendMessage,
  isLoading,
  streamingContent = '',
}) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const [shouldAutoScroll, setShouldAutoScroll] = useState(true);

  /**
   * Auto-scroll to bottom when new messages arrive or streaming content updates
   */
  useEffect(() => {
    if (shouldAutoScroll && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, streamingContent, shouldAutoScroll]);

  /**
   * Detect if user has scrolled up manually
   * If so, disable auto-scroll until they scroll back to bottom
   */
  useEffect(() => {
    const container = messagesContainerRef.current;
    if (!container) return;

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = container;
      const isNearBottom = scrollHeight - scrollTop - clientHeight < 100;
      setShouldAutoScroll(isNearBottom);
    };

    container.addEventListener('scroll', handleScroll);
    return () => container.removeEventListener('scroll', handleScroll);
  }, []);

  /**
   * Handle message submission
   */
  const handleSendMessage = (content: string) => {
    // Re-enable auto-scroll when user sends a message
    setShouldAutoScroll(true);
    onSendMessage(content);
  };

  /**
   * Render empty state when no messages
   */
  const renderEmptyState = () => (
    <div className="flex-1 flex items-center justify-center p-8 animate-fade-in">
      <div className="text-center max-w-md">
        <div className="mb-4">
          <svg
            className="w-16 h-16 mx-auto text-[#2d3548]"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
            />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-[#e4e7eb] mb-2">
          Start a Conversation
        </h3>
        <p className="text-sm text-[#9ca3af]">
          Send a message to {agentName || 'the agent'} to begin. Ask questions about
          infrastructure, deployments, or get help with your AWS resources.
        </p>
      </div>
    </div>
  );

  /**
   * Render loading indicator for streaming
   */
  const renderLoadingIndicator = () => (
    <div className="flex gap-3 mb-4" role="status" aria-live="polite">
      <div className="flex-shrink-0">
        <div
          className="
            w-8 h-8 rounded-full
            bg-gradient-to-br from-blue-500 to-purple-600
            flex items-center justify-center
            text-white text-sm font-semibold
          "
          aria-label={`${agentName || 'Agent'} avatar`}
        >
          {agentName ? agentName.charAt(0).toUpperCase() : 'A'}
        </div>
      </div>
      <div className="flex flex-col gap-1 items-start max-w-[80%]">
        <div className="px-4 py-2.5 rounded-2xl bg-[#151b2d] rounded-tl-sm">
          <div className="flex items-center gap-2">
            {/* Animated typing indicator */}
            <div className="flex gap-1">
              <span
                className="w-2 h-2 bg-[#3b82f6] rounded-full animate-bounce"
                style={{ animationDelay: '0ms' }}
              />
              <span
                className="w-2 h-2 bg-[#3b82f6] rounded-full animate-bounce"
                style={{ animationDelay: '150ms' }}
              />
              <span
                className="w-2 h-2 bg-[#3b82f6] rounded-full animate-bounce"
                style={{ animationDelay: '300ms' }}
              />
            </div>
            <span className="text-xs text-[#9ca3af]">
              {agentName || 'Agent'} is typing...
            </span>
          </div>
        </div>
      </div>
    </div>
  );

  /**
   * Render streaming content as a temporary message
   */
  const renderStreamingContent = () => {
    if (!streamingContent) return null;

    return (
      <div className="flex gap-3 mb-4" role="status" aria-live="polite" aria-atomic="false">
        <div className="flex-shrink-0">
          <div
            className="
              w-8 h-8 rounded-full
              bg-gradient-to-br from-blue-500 to-purple-600
              flex items-center justify-center
              text-white text-sm font-semibold
            "
            aria-label={`${agentName || 'Agent'} avatar`}
          >
            {agentName ? agentName.charAt(0).toUpperCase() : 'A'}
          </div>
        </div>
        <div className="flex flex-col gap-1 items-start max-w-[80%]">
          <div className="px-4 py-2.5 rounded-2xl bg-[#151b2d] text-[#e4e7eb] rounded-tl-sm break-words">
            <p className="text-sm leading-relaxed whitespace-pre-wrap">
              {streamingContent}
              {/* Blinking cursor to indicate streaming */}
              <span className="inline-block w-1.5 h-4 bg-[#3b82f6] ml-0.5 animate-pulse" />
            </p>
          </div>
          <span className="text-xs text-[#6b7280] px-1">
            Streaming...
          </span>
        </div>
      </div>
    );
  };

  return (
    <div
      className="
        flex flex-col
        h-full
        bg-[#0a0e1a]
      "
      role="region"
      aria-label="Chat window"
    >
      {/* Messages container */}
      <div
        ref={messagesContainerRef}
        className="
          flex-1
          overflow-y-auto
          px-3 sm:px-6 py-3 sm:py-4
          scroll-smooth
        "
        role="log"
        aria-label="Message history"
        aria-live="polite"
        aria-atomic="false"
      >
        {/* Empty state */}
        {messages.length === 0 && !isLoading && !streamingContent && renderEmptyState()}

        {/* Message list */}
        {messages.map((message) => (
          <Message
            key={message.id}
            message={message}
            agentName={agentName}
          />
        ))}

        {/* Streaming content */}
        {streamingContent && renderStreamingContent()}

        {/* Loading indicator (shown when streaming starts but no content yet) */}
        {isLoading && !streamingContent && renderLoadingIndicator()}

        {/* Scroll anchor */}
        <div ref={messagesEndRef} />
      </div>

      {/* Scroll to bottom button (shown when user scrolls up) */}
      {!shouldAutoScroll && (
        <div className="absolute bottom-20 sm:bottom-24 right-4 sm:right-6">
          <button
            onClick={() => {
              setShouldAutoScroll(true);
              messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
            }}
            className="
              p-2 rounded-full
              bg-[#3b82f6] hover:bg-[#2563eb]
              active:scale-90
              text-white
              shadow-lg hover:shadow-xl
              transition-all duration-200
              transform
              focus:outline-none focus:ring-2 focus:ring-[#3b82f6] focus:ring-offset-2 focus:ring-offset-[#0a0e1a]
            "
            aria-label="Scroll to bottom"
            type="button"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 14l-7 7m0 0l-7-7m7 7V3"
              />
            </svg>
          </button>
        </div>
      )}

      {/* Chat input */}
      <ChatInput
        onSendMessage={handleSendMessage}
        isLoading={isLoading}
        placeholder={`Message ${agentName || 'agent'}...`}
      />
    </div>
  );
};

export default ChatWindow;
