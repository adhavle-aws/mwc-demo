import React, { useState, useRef, useEffect } from 'react';
import type { KeyboardEvent, ChangeEvent } from 'react';

/**
 * ChatInput Component Props
 */
export interface ChatInputProps {
  onSendMessage: (content: string) => void;
  isLoading?: boolean;
  placeholder?: string;
  maxLength?: number;
}

/**
 * ChatInput Component
 * 
 * Multi-line text input for chat messages with send button and character counter.
 * 
 * Features:
 * - Multi-line textarea with auto-resize
 * - Send button with loading state
 * - Enter to submit, Shift+Enter for new line
 * - Character count indicator
 * - Disabled state during loading
 * - Auto-focus on mount
 * 
 * Requirements: 2.2, 2.6, 15.2
 */
const ChatInput: React.FC<ChatInputProps> = ({
  onSendMessage,
  isLoading = false,
  placeholder = 'Type your message...',
  maxLength = 5000,
}) => {
  const [inputValue, setInputValue] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  /**
   * Auto-resize textarea based on content
   */
  useEffect(() => {
    if (textareaRef.current) {
      // Reset height to auto to get the correct scrollHeight
      textareaRef.current.style.height = 'auto';
      // Set height to scrollHeight (content height)
      const newHeight = Math.min(textareaRef.current.scrollHeight, 200); // Max 200px
      textareaRef.current.style.height = `${newHeight}px`;
    }
  }, [inputValue]);

  /**
   * Handle input change
   */
  const handleInputChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    // Enforce max length
    if (value.length <= maxLength) {
      setInputValue(value);
    }
  };

  /**
   * Handle message submission
   */
  const handleSubmit = () => {
    const trimmedValue = inputValue.trim();
    
    // Don't send empty messages
    if (!trimmedValue || isLoading) {
      return;
    }

    // Send message
    onSendMessage(trimmedValue);
    
    // Clear input
    setInputValue('');
    
    // Reset textarea height
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  /**
   * Handle keyboard shortcuts
   * - Enter: Submit message
   * - Shift+Enter: New line
   */
  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  /**
   * Calculate character count color based on usage
   */
  const getCharCountColor = (): string => {
    const percentage = (inputValue.length / maxLength) * 100;
    
    if (percentage >= 90) {
      return 'text-red-500';
    } else if (percentage >= 75) {
      return 'text-yellow-500';
    } else {
      return 'text-[#6b7280]';
    }
  };

  /**
   * Check if send button should be disabled
   */
  const isSendDisabled = !inputValue.trim() || isLoading;

  return (
    <div
      className="
        border-t border-[#2d3548]
        bg-[#151b2d]
        p-3 sm:p-4
      "
    >
      <div className="flex gap-2 sm:gap-3 items-end">
        {/* Textarea container */}
        <div className="flex-1 relative">
          <textarea
            ref={textareaRef}
            value={inputValue}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            disabled={isLoading}
            rows={1}
            className="
              w-full
              px-3 sm:px-4 py-2 sm:py-3
              bg-[#0a0e1a]
              border border-[#2d3548]
              rounded-lg
              text-[#e4e7eb] text-sm
              placeholder-[#6b7280]
              resize-none
              focus:outline-none focus:ring-2 focus:ring-[#3b82f6] focus:border-transparent
              disabled:opacity-50 disabled:cursor-not-allowed
              transition-all duration-200
            "
            style={{
              minHeight: '44px',
              maxHeight: '200px',
            }}
            aria-label="Message input"
            aria-describedby="char-count"
          />
          
          {/* Character count indicator - hidden on very small screens */}
          <div
            id="char-count"
            className={`
              absolute bottom-2 right-3
              text-xs font-medium
              ${getCharCountColor()}
              transition-colors duration-200
              hidden xs:block
            `}
            aria-live="polite"
            aria-atomic="true"
          >
            {inputValue.length}/{maxLength}
          </div>
        </div>

        {/* Send button */}
        <button
          onClick={handleSubmit}
          disabled={isSendDisabled}
          className="
            px-3 sm:px-5 py-2 sm:py-3
            bg-[#3b82f6]
            hover:bg-[#2563eb]
            active:scale-95
            disabled:bg-[#1e3a5f]
            disabled:cursor-not-allowed
            text-white text-sm font-medium
            rounded-lg
            transition-all duration-200
            transform
            flex items-center justify-center
            min-w-[60px] sm:min-w-[80px]
            focus:outline-none focus:ring-2 focus:ring-[#3b82f6] focus:ring-offset-2 focus:ring-offset-[#151b2d]
            shadow-lg hover:shadow-xl
          "
          aria-label="Send message"
          type="button"
        >
          {isLoading ? (
            <>
              {/* Loading spinner */}
              <svg
                className="animate-spin h-4 w-4 sm:mr-2"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
              <span className="hidden sm:inline">Sending</span>
            </>
          ) : (
            <>
              {/* Send icon */}
              <svg
                className="w-4 h-4 sm:mr-2"
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
                  d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                />
              </svg>
              <span className="hidden sm:inline">Send</span>
            </>
          )}
        </button>
      </div>

      {/* Keyboard shortcut hint - hidden on mobile */}
      <div className="mt-2 text-xs text-[#6b7280] hidden sm:block">
        Press <kbd className="px-1.5 py-0.5 bg-[#0a0e1a] border border-[#2d3548] rounded text-[#9ca3af]">Enter</kbd> to send, 
        <kbd className="ml-1 px-1.5 py-0.5 bg-[#0a0e1a] border border-[#2d3548] rounded text-[#9ca3af]">Shift+Enter</kbd> for new line
      </div>
    </div>
  );
};

export default ChatInput;
