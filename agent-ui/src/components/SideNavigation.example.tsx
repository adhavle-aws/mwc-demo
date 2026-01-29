import React, { useState } from 'react';
import SideNavigation from './SideNavigation';
import type { Agent } from '../types';

/**
 * Example usage of the SideNavigation component
 * 
 * This example demonstrates:
 * - Agent list display with status indicators
 * - Agent selection handling
 * - Selected agent highlighting
 * - Mobile collapse/expand functionality
 * - localStorage persistence of collapsed state
 */

// Mock agent data
const mockAgents: Agent[] = [
  {
    id: 'onboarding-agent',
    name: 'OnboardingAgent',
    description: 'Designs AWS infrastructure and generates CloudFormation templates',
    status: 'available',
    arn: 'arn:aws:bedrock:us-east-1:123456789:agent/onboarding',
    capabilities: ['architecture-design', 'cost-optimization', 'cfn-generation'],
  },
  {
    id: 'provisioning-agent',
    name: 'ProvisioningAgent',
    description: 'Deploys CloudFormation stacks and monitors deployment progress',
    status: 'busy',
    arn: 'arn:aws:bedrock:us-east-1:123456789:agent/provisioning',
    capabilities: ['stack-deployment', 'progress-monitoring', 'resource-management'],
  },
  {
    id: 'mwc-agent',
    name: 'MWCAgent',
    description: 'Orchestrates multi-agent workflows and coordinates complex tasks',
    status: 'available',
    arn: 'arn:aws:bedrock:us-east-1:123456789:agent/mwc',
    capabilities: ['workflow-orchestration', 'agent-coordination', 'task-management'],
  },
];

const SideNavigationExample: React.FC = () => {
  const [selectedAgentId, setSelectedAgentId] = useState<string>('onboarding-agent');

  const handleAgentSelect = (agentId: string) => {
    console.log('Agent selected:', agentId);
    setSelectedAgentId(agentId);
  };

  return (
    <div className="min-h-screen bg-gray-950">
      <SideNavigation
        agents={mockAgents}
        selectedAgentId={selectedAgentId}
        onAgentSelect={handleAgentSelect}
      />
      
      {/* Main content area - offset by side nav width on desktop */}
      <div className="md:ml-72 p-8">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-white mb-4">
            Selected Agent: {mockAgents.find(a => a.id === selectedAgentId)?.name}
          </h2>
          <p className="text-gray-400">
            This is the main content area. On mobile, the side navigation collapses
            into a hamburger menu. On desktop, it remains visible at all times.
          </p>
          <div className="mt-8 p-6 bg-gray-900 rounded-lg border border-gray-800">
            <h3 className="text-lg font-semibold text-white mb-2">
              Features Demonstrated:
            </h3>
            <ul className="space-y-2 text-gray-300">
              <li>✓ Agent list display with status indicators</li>
              <li>✓ Selected agent highlighting (blue background)</li>
              <li>✓ Hover effects on agent items</li>
              <li>✓ Mobile hamburger menu (resize window to see)</li>
              <li>✓ Collapsed state persisted in localStorage</li>
              <li>✓ Auto-collapse on mobile after selection</li>
              <li>✓ Smooth animations and transitions</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SideNavigationExample;
