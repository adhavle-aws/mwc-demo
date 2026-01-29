import React from 'react';
import Message from './Message';
import type { Message as MessageType } from '../types';

/**
 * Message Component Examples
 * 
 * Demonstrates various use cases of the Message component
 */

// Example messages
const agentMessage: MessageType = {
  id: '1',
  role: 'agent',
  content: 'Hello! I\'m the OnboardingAgent. I can help you design and plan your AWS infrastructure. What would you like to build today?',
  timestamp: new Date(Date.now() - 5 * 60 * 1000), // 5 minutes ago
  agentId: 'onboarding-agent'
};

const userMessage: MessageType = {
  id: '2',
  role: 'user',
  content: 'I need to set up a web application with a database and load balancer.',
  timestamp: new Date(Date.now() - 3 * 60 * 1000), // 3 minutes ago
  agentId: 'onboarding-agent'
};

const longAgentMessage: MessageType = {
  id: '3',
  role: 'agent',
  content: `Great! I'll help you design a web application infrastructure. Here's what I recommend:

1. Application Load Balancer (ALB) for distributing traffic
2. EC2 instances or ECS containers for your application
3. RDS database for persistent storage
4. Auto Scaling for handling traffic spikes
5. CloudWatch for monitoring

Would you like me to create a detailed CloudFormation template for this architecture?`,
  timestamp: new Date(Date.now() - 2 * 60 * 1000), // 2 minutes ago
  agentId: 'onboarding-agent'
};

const recentMessage: MessageType = {
  id: '4',
  role: 'user',
  content: 'Yes, please create the template!',
  timestamp: new Date(Date.now() - 30 * 1000), // 30 seconds ago
  agentId: 'onboarding-agent'
};

const oldMessage: MessageType = {
  id: '5',
  role: 'agent',
  content: 'This is an older message from yesterday.',
  timestamp: new Date(Date.now() - 25 * 60 * 60 * 1000), // 25 hours ago
  agentId: 'provisioning-agent'
};

/**
 * Example: Basic Message Display
 */
export const BasicMessages: React.FC = () => {
  return (
    <div className="bg-[#0a0e1a] p-6 rounded-lg space-y-4">
      <h3 className="text-white text-lg font-semibold mb-4">Basic Messages</h3>
      <Message message={agentMessage} agentName="OnboardingAgent" />
      <Message message={userMessage} />
    </div>
  );
};

/**
 * Example: Long Message Content
 */
export const LongMessage: React.FC = () => {
  return (
    <div className="bg-[#0a0e1a] p-6 rounded-lg">
      <h3 className="text-white text-lg font-semibold mb-4">Long Message</h3>
      <Message message={longAgentMessage} agentName="OnboardingAgent" />
    </div>
  );
};

/**
 * Example: Conversation Flow
 */
export const ConversationFlow: React.FC = () => {
  return (
    <div className="bg-[#0a0e1a] p-6 rounded-lg space-y-4">
      <h3 className="text-white text-lg font-semibold mb-4">Conversation Flow</h3>
      <Message message={agentMessage} agentName="OnboardingAgent" />
      <Message message={userMessage} />
      <Message message={longAgentMessage} agentName="OnboardingAgent" />
      <Message message={recentMessage} />
    </div>
  );
};

/**
 * Example: Different Timestamps
 */
export const TimestampVariations: React.FC = () => {
  return (
    <div className="bg-[#0a0e1a] p-6 rounded-lg space-y-4">
      <h3 className="text-white text-lg font-semibold mb-4">Timestamp Variations</h3>
      <Message message={recentMessage} />
      <Message message={userMessage} />
      <Message message={agentMessage} agentName="OnboardingAgent" />
      <Message message={oldMessage} agentName="ProvisioningAgent" />
    </div>
  );
};

/**
 * Example: Different Agents
 */
export const DifferentAgents: React.FC = () => {
  const onboardingMsg: MessageType = {
    id: '6',
    role: 'agent',
    content: 'I\'m the OnboardingAgent, ready to help with infrastructure design.',
    timestamp: new Date(),
    agentId: 'onboarding-agent'
  };

  const provisioningMsg: MessageType = {
    id: '7',
    role: 'agent',
    content: 'I\'m the ProvisioningAgent, I handle deployments.',
    timestamp: new Date(),
    agentId: 'provisioning-agent'
  };

  const mwcMsg: MessageType = {
    id: '8',
    role: 'agent',
    content: 'I\'m the MWCAgent, orchestrating the entire workflow.',
    timestamp: new Date(),
    agentId: 'mwc-agent'
  };

  return (
    <div className="bg-[#0a0e1a] p-6 rounded-lg space-y-4">
      <h3 className="text-white text-lg font-semibold mb-4">Different Agents</h3>
      <Message message={onboardingMsg} agentName="OnboardingAgent" />
      <Message message={provisioningMsg} agentName="ProvisioningAgent" />
      <Message message={mwcMsg} agentName="MWCAgent" />
    </div>
  );
};

/**
 * Default export with all examples
 */
const MessageExamples: React.FC = () => {
  return (
    <div className="space-y-8 p-8 bg-[#0a0e1a] min-h-screen">
      <h1 className="text-white text-2xl font-bold mb-8">Message Component Examples</h1>
      <BasicMessages />
      <LongMessage />
      <ConversationFlow />
      <TimestampVariations />
      <DifferentAgents />
    </div>
  );
};

export default MessageExamples;
