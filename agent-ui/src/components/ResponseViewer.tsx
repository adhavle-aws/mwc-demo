import React, { useState, useEffect } from 'react';
import TabBar from './TabBar';
import TemplateTab from './TemplateTab';
// import ProgressTab from './ProgressTab'; // TODO: Implement progress tab rendering
import ArchitectureTab from './ArchitectureTab';
import CostOptimizationTab from './CostOptimizationTab';
import SummaryTab from './SummaryTab';
import ResourcesTab from './ResourcesTab';
import type { ParsedResponse, AgentType, ResponseSection } from '../types';

/**
 * ResponseViewer Component
 * 
 * Displays agent responses in a tabbed interface with appropriate content
 * based on agent type and response sections.
 * 
 * Features:
 * - Integrates TabBar for tab navigation
 * - Dynamically renders tab content based on section type
 * - Parses agent responses using response parser
 * - Generates tabs based on agent type
 * - Preserves active tab state
 * - Handles empty responses gracefully
 * 
 * Requirements: 3.1, 3.2, 3.5, 3.7
 */

export interface ResponseViewerProps {
  response: ParsedResponse;
  agentType: AgentType;
  onTabChange?: (tabId: string) => void;
}

const ResponseViewer: React.FC<ResponseViewerProps> = ({
  response,
  agentType: _agentType, // Prefix with underscore to indicate intentionally unused
  onTabChange,
}) => {
  // State for active tab
  const [activeTabId, setActiveTabId] = useState<string>('');

  /**
   * Initialize active tab when response changes
   * Preserves tab state if the tab still exists in new response
   */
  useEffect(() => {
    if (response.tabs.length > 0) {
      // Check if current active tab exists in new response
      const tabExists = response.tabs.some(tab => tab.id === activeTabId);
      
      if (!tabExists || !activeTabId) {
        // Set to first tab if current tab doesn't exist or no tab is active
        setActiveTabId(response.tabs[0].id);
      }
    } else {
      setActiveTabId('');
    }
  }, [response.tabs]);

  /**
   * Handle tab change
   */
  const handleTabChange = (tabId: string) => {
    setActiveTabId(tabId);
    
    // Notify parent component of tab change
    if (onTabChange) {
      onTabChange(tabId);
    }
  };

  /**
   * Render tab content based on section type
   */
  const renderTabContent = (section: ResponseSection): React.ReactElement => {
    switch (section.type) {
      case 'template':
        return (
          <TemplateTab
            template={section.content}
            format={section.metadata?.format || 'yaml'}
          />
        );

      case 'progress':
        // For progress tab, we need to parse the content or use metadata
        // For now, render as summary until we have actual progress data
        return (
          <SummaryTab content={section.content} />
        );

      case 'architecture':
        return (
          <ArchitectureTab
            content={section.content}
            diagramUrl={section.metadata?.diagramUrl}
          />
        );

      case 'cost':
        return (
          <CostOptimizationTab content={section.content} />
        );

      case 'resources':
        // If we have structured resource data, use ResourcesTab
        if (section.metadata?.resources && Array.isArray(section.metadata.resources)) {
          return (
            <ResourcesTab resources={section.metadata.resources} />
          );
        }
        // Otherwise render as summary
        return (
          <SummaryTab content={section.content} />
        );

      case 'summary':
      default:
        return (
          <SummaryTab content={section.content} />
        );
    }
  };

  // Handle empty response
  if (!response.tabs || response.tabs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full bg-[#0a0e1a] p-8">
        <svg
          className="w-16 h-16 text-[#6b7280] mb-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
          />
        </svg>
        <p className="text-[#9ca3af] text-center">
          No response content available
        </p>
        <p className="text-[#6b7280] text-sm text-center mt-2">
          Send a message to the agent to see the response here
        </p>
      </div>
    );
  }

  // Find active tab content
  const activeTab = response.tabs.find(tab => tab.id === activeTabId);

  return (
    <div className="flex flex-col h-full bg-[#0a0e1a]">
      {/* Tab bar */}
      <TabBar
        tabs={response.tabs.map(tab => ({
          id: tab.id,
          label: tab.label,
          icon: tab.icon,
        }))}
        activeTabId={activeTabId}
        onTabChange={handleTabChange}
      />

      {/* Tab content */}
      <div
        className="flex-1 overflow-hidden"
        role="tabpanel"
        id={`tabpanel-${activeTabId}`}
        aria-labelledby={`tab-${activeTabId}`}
      >
        <div className="h-full animate-fade-in-up">
          {activeTab && renderTabContent(activeTab.content)}
        </div>
      </div>
    </div>
  );
};

export default ResponseViewer;
