import { useState } from 'react';
import ChatWindow from './ChatWindow';
import type { Message } from '../types';

/**
 * ChatWindow Component Examples
 * 
 * Demonstrates various usage scenarios for the ChatWindow component.
 */

// ============================================================================
// Example 1: Empty State
// ============================================================================

export function EmptyStateExample() {
  const [messages] = useState<Message[]>([]);
  const [isLoading] = useState(false);

  const handleSendMessage = (content: string) => {
    console.log('Message sent:', content);
  };

  return (
    <div style={{ height: '600px' }}>
      <ChatWindow
        agentId="onboarding-agent"
        agentName="OnboardingAgent"
        messages={messages}
        onSendMessage={handleSendMessage}
        isLoading={isLoading}
      />
    </div>
  );
}

// ============================================================================
// Example 2: With Message History
// ============================================================================

export function MessageHistoryExample() {
  const [messages] = useState<Message[]>([
    {
      id: '1',
      role: 'user',
      content: 'Hello! Can you help me set up a new infrastructure?',
      timestamp: new Date(Date.now() - 300000), // 5 minutes ago
      agentId: 'onboarding-agent',
    },
    {
      id: '2',
      role: 'agent',
      content: 'Of course! I\'d be happy to help you set up your infrastructure. Could you tell me more about what you\'re looking to build?',
      timestamp: new Date(Date.now() - 240000), // 4 minutes ago
      agentId: 'onboarding-agent',
    },
    {
      id: '3',
      role: 'user',
      content: 'I need a web application with a database and API backend.',
      timestamp: new Date(Date.now() - 180000), // 3 minutes ago
      agentId: 'onboarding-agent',
    },
    {
      id: '4',
      role: 'agent',
      content: 'Great! I can help you design that. Let me create a CloudFormation template for a web application with:\n\n- Application Load Balancer\n- ECS Fargate for your API\n- RDS PostgreSQL database\n- VPC with public and private subnets\n\nWould you like me to proceed with this architecture?',
      timestamp: new Date(Date.now() - 120000), // 2 minutes ago
      agentId: 'onboarding-agent',
    },
  ]);
  const [isLoading] = useState(false);

  const handleSendMessage = (content: string) => {
    console.log('Message sent:', content);
  };

  return (
    <div style={{ height: '600px' }}>
      <ChatWindow
        agentId="onboarding-agent"
        agentName="OnboardingAgent"
        messages={messages}
        onSendMessage={handleSendMessage}
        isLoading={isLoading}
      />
    </div>
  );
}

// ============================================================================
// Example 3: Loading State
// ============================================================================

export function LoadingStateExample() {
  const [messages] = useState<Message[]>([
    {
      id: '1',
      role: 'user',
      content: 'Create a CloudFormation template for a serverless API.',
      timestamp: new Date(Date.now() - 10000), // 10 seconds ago
      agentId: 'onboarding-agent',
    },
  ]);
  const [isLoading] = useState(true);

  const handleSendMessage = (content: string) => {
    console.log('Message sent:', content);
  };

  return (
    <div style={{ height: '600px' }}>
      <ChatWindow
        agentId="onboarding-agent"
        agentName="OnboardingAgent"
        messages={messages}
        onSendMessage={handleSendMessage}
        isLoading={isLoading}
      />
    </div>
  );
}

// ============================================================================
// Example 4: Streaming Content
// ============================================================================

export function StreamingContentExample() {
  const [messages] = useState<Message[]>([
    {
      id: '1',
      role: 'user',
      content: 'Explain the benefits of using ECS Fargate.',
      timestamp: new Date(Date.now() - 5000), // 5 seconds ago
      agentId: 'onboarding-agent',
    },
  ]);
  const [isLoading] = useState(true);
  const [streamingContent] = useState(
    'ECS Fargate is a serverless compute engine for containers that offers several key benefits:\n\n1. **No Server Management**: You don\'t need to provision, configure, or scale clusters of virtual machines...'
  );

  const handleSendMessage = (content: string) => {
    console.log('Message sent:', content);
  };

  return (
    <div style={{ height: '600px' }}>
      <ChatWindow
        agentId="onboarding-agent"
        agentName="OnboardingAgent"
        messages={messages}
        onSendMessage={handleSendMessage}
        isLoading={isLoading}
        streamingContent={streamingContent}
      />
    </div>
  );
}

// ============================================================================
// Example 5: Interactive Demo with Simulated Streaming
// ============================================================================

export function InteractiveDemoExample() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [streamingContent, setStreamingContent] = useState('');

  const simulateStreaming = async (text: string) => {
    setIsLoading(true);
    setStreamingContent('');

    // Simulate streaming by adding characters gradually
    for (let i = 0; i < text.length; i++) {
      await new Promise(resolve => setTimeout(resolve, 20)); // 20ms per character
      setStreamingContent(text.substring(0, i + 1));
    }

    // Add complete message
    const agentMessage: Message = {
      id: crypto.randomUUID(),
      role: 'agent',
      content: text,
      timestamp: new Date(),
      agentId: 'onboarding-agent',
    };
    setMessages(prev => [...prev, agentMessage]);
    setStreamingContent('');
    setIsLoading(false);
  };

  const handleSendMessage = async (content: string) => {
    // Add user message
    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      content,
      timestamp: new Date(),
      agentId: 'onboarding-agent',
    };
    setMessages(prev => [...prev, userMessage]);

    // Simulate agent response
    const responses = [
      'I can help you with that! Let me create a solution for you.',
      'Here\'s what I recommend:\n\n1. Start with a VPC for network isolation\n2. Add an Application Load Balancer for traffic distribution\n3. Use ECS Fargate for your containers\n4. Set up RDS for your database\n\nWould you like me to generate the CloudFormation template?',
      'Great question! The key benefits are:\n\n- **Scalability**: Automatically scales based on demand\n- **Cost-effective**: Pay only for what you use\n- **Secure**: Built-in security features and isolation\n- **Reliable**: High availability across multiple zones',
    ];

    const randomResponse = responses[Math.floor(Math.random() * responses.length)];
    await simulateStreaming(randomResponse);
  };

  return (
    <div style={{ height: '600px' }}>
      <ChatWindow
        agentId="onboarding-agent"
        agentName="OnboardingAgent"
        messages={messages}
        onSendMessage={handleSendMessage}
        isLoading={isLoading}
        streamingContent={streamingContent}
      />
    </div>
  );
}

// ============================================================================
// Example 6: Long Conversation with Auto-Scroll
// ============================================================================

export function LongConversationExample() {
  const generateMessages = (): Message[] => {
    const messages: Message[] = [];
    const now = Date.now();

    for (let i = 0; i < 20; i++) {
      messages.push({
        id: `user-${i}`,
        role: 'user',
        content: `User message ${i + 1}: This is a sample message to demonstrate scrolling behavior.`,
        timestamp: new Date(now - (20 - i) * 60000),
        agentId: 'onboarding-agent',
      });

      messages.push({
        id: `agent-${i}`,
        role: 'agent',
        content: `Agent response ${i + 1}: This is a response from the agent. It can be quite detailed and include multiple lines of text to show how the chat window handles longer messages.`,
        timestamp: new Date(now - (20 - i) * 60000 + 30000),
        agentId: 'onboarding-agent',
      });
    }

    return messages;
  };

  const [messages] = useState<Message[]>(generateMessages());
  const [isLoading] = useState(false);

  const handleSendMessage = (content: string) => {
    console.log('Message sent:', content);
  };

  return (
    <div style={{ height: '600px' }}>
      <ChatWindow
        agentId="onboarding-agent"
        agentName="OnboardingAgent"
        messages={messages}
        onSendMessage={handleSendMessage}
        isLoading={isLoading}
      />
    </div>
  );
}

// ============================================================================
// Example 7: Different Agent
// ============================================================================

export function DifferentAgentExample() {
  const [messages] = useState<Message[]>([
    {
      id: '1',
      role: 'user',
      content: 'Deploy the CloudFormation stack to production.',
      timestamp: new Date(Date.now() - 60000),
      agentId: 'provisioning-agent',
    },
    {
      id: '2',
      role: 'agent',
      content: 'I\'ll deploy the stack to production now. Monitoring the deployment progress...',
      timestamp: new Date(Date.now() - 30000),
      agentId: 'provisioning-agent',
    },
  ]);
  const [isLoading] = useState(false);

  const handleSendMessage = (content: string) => {
    console.log('Message sent:', content);
  };

  return (
    <div style={{ height: '600px' }}>
      <ChatWindow
        agentId="provisioning-agent"
        agentName="ProvisioningAgent"
        messages={messages}
        onSendMessage={handleSendMessage}
        isLoading={isLoading}
      />
    </div>
  );
}
