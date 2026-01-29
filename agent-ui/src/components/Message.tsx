import React from 'react';
import type { Message as MessageType } from '../types';

/**
 * Message Component Props
 */
export interface MessageProps {
  message: MessageType;
  agentName?: string;
}

/**
 * Message Component
 * 
 * Displays a single chat message with role-based styling, timestamp, and avatar.
 * 
 * Features:
 * - Role-based styling (user vs agent messages)
 * - Timestamp display
 * - Avatar/icon for agent messages
 * - Different alignment for user vs agent
 * - Message bubble with appropriate styling
 * 
 * Requirements: 2.4, 2.7
 */
const Message: React.FC<MessageProps> = ({ message, agentName }) => {
  const isAgent = message.role === 'agent';

  /**
   * Format timestamp to readable format
   */
  const formatTimestamp = (date: Date): string => {
    const now = new Date();
    const messageDate = new Date(date);
    const diffInSeconds = Math.floor((now.getTime() - messageDate.getTime()) / 1000);

    // Less than a minute ago
    if (diffInSeconds < 60) {
      return 'Just now';
    }

    // Less than an hour ago
    if (diffInSeconds < 3600) {
      const minutes = Math.floor(diffInSeconds / 60);
      return `${minutes}m ago`;
    }

    // Less than a day ago
    if (diffInSeconds < 86400) {
      const hours = Math.floor(diffInSeconds / 3600);
      return `${hours}h ago`;
    }

    // Format as time if today, otherwise include date
    const isToday = messageDate.toDateString() === now.toDateString();
    if (isToday) {
      return messageDate.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      });
    }

    // Include date for older messages
    return messageDate.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  /**
   * Get agent avatar icon
   */
  const getAgentAvatar = (): React.ReactNode => {
    return (
      <div
        className="
          w-8 h-8 rounded-full
          bg-gradient-to-br from-blue-500 to-purple-600
          flex items-center justify-center
          text-white text-sm font-semibold
          flex-shrink-0
        "
        aria-label={`${agentName || 'Agent'} avatar`}
      >
        {agentName ? agentName.charAt(0).toUpperCase() : 'A'}
      </div>
    );
  };

  /**
   * Get user avatar icon
   */
  const getUserAvatar = (): React.ReactNode => {
    return (
      <div
        className="
          w-8 h-8 rounded-full
          bg-gradient-to-br from-gray-600 to-gray-700
          flex items-center justify-center
          text-white text-sm font-semibold
          flex-shrink-0
        "
        aria-label="User avatar"
      >
        U
      </div>
    );
  };

  return (
    <div
      className={`
        flex gap-3 mb-4
        ${isAgent ? 'flex-row animate-slide-in-left' : 'flex-row-reverse animate-slide-in-right'}
      `}
      role="article"
      aria-label={`${isAgent ? 'Agent' : 'User'} message`}
    >
      {/* Avatar */}
      <div className="flex-shrink-0">
        {isAgent ? getAgentAvatar() : getUserAvatar()}
      </div>

      {/* Message content */}
      <div
        className={`
          flex flex-col gap-1
          ${isAgent ? 'items-start' : 'items-end'}
          max-w-[85%] sm:max-w-[80%]
        `}
      >
        {/* Message bubble */}
        <div
          className={`
            px-3 sm:px-4 py-2 sm:py-2.5 rounded-2xl
            ${
              isAgent
                ? 'bg-[#151b2d] text-[#e4e7eb] rounded-tl-sm'
                : 'bg-[#3b82f6] text-white rounded-tr-sm'
            }
            break-words
          `}
        >
          <p className="text-sm leading-relaxed whitespace-pre-wrap">
            {message.content}
          </p>
        </div>

        {/* Timestamp */}
        <span
          className="text-xs text-[#6b7280] px-1"
          aria-label={`Sent ${formatTimestamp(message.timestamp)}`}
        >
          {formatTimestamp(message.timestamp)}
        </span>
      </div>
    </div>
  );
};

export default Message;
