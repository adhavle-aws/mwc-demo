/**
 * Example usage of AgentStatusIndicator component
 * This file demonstrates how to use the component in different scenarios
 */

import React from 'react';
import { AgentStatusIndicator } from './index';

export const AgentStatusIndicatorExamples: React.FC = () => {
  return (
    <div className="p-8 space-y-8 bg-gray-900 min-h-screen">
      <h1 className="text-2xl font-bold text-white mb-8">
        AgentStatusIndicator Examples
      </h1>

      {/* Available Status */}
      <div className="space-y-2">
        <h2 className="text-lg font-semibold text-white">Available Status</h2>
        <div className="flex items-center gap-3 p-4 bg-gray-800 rounded">
          <AgentStatusIndicator status="available" />
          <span className="text-gray-300">Agent is ready to process requests</span>
        </div>
      </div>

      {/* Busy Status with Pulsing Animation */}
      <div className="space-y-2">
        <h2 className="text-lg font-semibold text-white">Busy Status (Pulsing)</h2>
        <div className="flex items-center gap-3 p-4 bg-gray-800 rounded">
          <AgentStatusIndicator status="busy" />
          <span className="text-gray-300">Agent is currently processing</span>
        </div>
      </div>

      {/* Error Status */}
      <div className="space-y-2">
        <h2 className="text-lg font-semibold text-white">Error Status</h2>
        <div className="flex items-center gap-3 p-4 bg-gray-800 rounded">
          <AgentStatusIndicator status="error" />
          <span className="text-gray-300">Agent encountered an error</span>
        </div>
      </div>

      {/* Unknown Status */}
      <div className="space-y-2">
        <h2 className="text-lg font-semibold text-white">Unknown Status</h2>
        <div className="flex items-center gap-3 p-4 bg-gray-800 rounded">
          <AgentStatusIndicator status="unknown" />
          <span className="text-gray-300">Agent status is unknown</span>
        </div>
      </div>

      {/* Custom Tooltip */}
      <div className="space-y-2">
        <h2 className="text-lg font-semibold text-white">Custom Tooltip</h2>
        <div className="flex items-center gap-3 p-4 bg-gray-800 rounded">
          <AgentStatusIndicator 
            status="available" 
            tooltip="OnboardingAgent - Last active 2 minutes ago"
          />
          <span className="text-gray-300">Hover to see custom tooltip</span>
        </div>
      </div>

      {/* In Agent List Context */}
      <div className="space-y-2">
        <h2 className="text-lg font-semibold text-white">In Agent List Context</h2>
        <div className="space-y-2">
          <div className="flex items-center gap-3 p-3 bg-gray-800 rounded hover:bg-gray-700 cursor-pointer">
            <AgentStatusIndicator status="available" tooltip="OnboardingAgent is available" />
            <span className="text-white font-medium">OnboardingAgent</span>
          </div>
          <div className="flex items-center gap-3 p-3 bg-gray-800 rounded hover:bg-gray-700 cursor-pointer">
            <AgentStatusIndicator status="busy" tooltip="ProvisioningAgent is deploying infrastructure" />
            <span className="text-white font-medium">ProvisioningAgent</span>
          </div>
          <div className="flex items-center gap-3 p-3 bg-gray-800 rounded hover:bg-gray-700 cursor-pointer">
            <AgentStatusIndicator status="error" tooltip="MWCAgent connection failed" />
            <span className="text-white font-medium">MWCAgent</span>
          </div>
        </div>
      </div>

      <div className="mt-8 p-4 bg-blue-900/20 border border-blue-500/30 rounded">
        <p className="text-blue-300 text-sm">
          <strong>Note:</strong> Hover over any status indicator to see the tooltip.
          The 'busy' status includes a pulsing animation to draw attention.
        </p>
      </div>
    </div>
  );
};

export default AgentStatusIndicatorExamples;
