import React, { useState } from 'react';
import ChatInput from './ChatInput';

/**
 * ChatInput Component Examples
 * 
 * Demonstrates various states and configurations of the ChatInput component.
 */
const ChatInputExample: React.FC = () => {
  const [messages, setMessages] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const handleSendMessage = (content: string) => {
    console.log('Message sent:', content);
    setMessages([...messages, content]);
    
    // Simulate loading state
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
    }, 2000);
  };

  return (
    <div className="min-h-screen bg-[#0a0e1a] p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <h1 className="text-3xl font-bold text-[#e4e7eb] mb-8">
          ChatInput Component Examples
        </h1>

        {/* Example 1: Default State */}
        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-[#e4e7eb]">
            1. Default State
          </h2>
          <div className="bg-[#151b2d] rounded-lg overflow-hidden">
            <ChatInput
              onSendMessage={handleSendMessage}
              placeholder="Type your message..."
            />
          </div>
        </section>

        {/* Example 2: Loading State */}
        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-[#e4e7eb]">
            2. Loading State
          </h2>
          <div className="bg-[#151b2d] rounded-lg overflow-hidden">
            <ChatInput
              onSendMessage={handleSendMessage}
              isLoading={true}
            />
          </div>
        </section>

        {/* Example 3: Custom Placeholder */}
        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-[#e4e7eb]">
            3. Custom Placeholder
          </h2>
          <div className="bg-[#151b2d] rounded-lg overflow-hidden">
            <ChatInput
              onSendMessage={handleSendMessage}
              placeholder="Ask the agent anything..."
            />
          </div>
        </section>

        {/* Example 4: Custom Max Length */}
        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-[#e4e7eb]">
            4. Custom Max Length (100 characters)
          </h2>
          <div className="bg-[#151b2d] rounded-lg overflow-hidden">
            <ChatInput
              onSendMessage={handleSendMessage}
              maxLength={100}
            />
          </div>
        </section>

        {/* Example 5: Interactive Demo */}
        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-[#e4e7eb]">
            5. Interactive Demo
          </h2>
          <div className="bg-[#151b2d] rounded-lg overflow-hidden">
            <div className="p-4 border-b border-[#2d3548]">
              <h3 className="text-sm font-medium text-[#9ca3af] mb-2">
                Sent Messages:
              </h3>
              {messages.length === 0 ? (
                <p className="text-sm text-[#6b7280]">No messages yet</p>
              ) : (
                <ul className="space-y-1">
                  {messages.map((msg, idx) => (
                    <li key={idx} className="text-sm text-[#e4e7eb]">
                      {idx + 1}. {msg}
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <ChatInput
              onSendMessage={handleSendMessage}
              isLoading={isLoading}
            />
          </div>
        </section>

        {/* Usage Notes */}
        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-[#e4e7eb]">
            Usage Notes
          </h2>
          <div className="bg-[#151b2d] rounded-lg p-6 space-y-3 text-sm text-[#9ca3af]">
            <p>
              <strong className="text-[#e4e7eb]">Keyboard Shortcuts:</strong>
            </p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>Press <kbd className="px-1.5 py-0.5 bg-[#0a0e1a] border border-[#2d3548] rounded text-[#9ca3af]">Enter</kbd> to send message</li>
              <li>Press <kbd className="px-1.5 py-0.5 bg-[#0a0e1a] border border-[#2d3548] rounded text-[#9ca3af]">Shift+Enter</kbd> to add new line</li>
            </ul>
            <p className="mt-4">
              <strong className="text-[#e4e7eb]">Features:</strong>
            </p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>Auto-resizing textarea (max 200px height)</li>
              <li>Character count indicator with color coding</li>
              <li>Disabled state during loading</li>
              <li>Empty message prevention</li>
              <li>Visual feedback for all interactions</li>
            </ul>
          </div>
        </section>
      </div>
    </div>
  );
};

export default ChatInputExample;
