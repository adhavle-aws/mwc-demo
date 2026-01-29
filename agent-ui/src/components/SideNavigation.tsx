import React, { useState, useEffect } from 'react';
import type { SideNavigationProps } from '../types';
import AgentStatusIndicator from './AgentStatusIndicator';
import { loadPreferences, savePreferences } from '../services/storageService';

/**
 * SideNavigation Component
 * 
 * Persistent navigation panel for agent selection with mobile support.
 * 
 * Features:
 * - Displays list of all available agents
 * - Visual status indicators for each agent
 * - Highlights currently selected agent
 * - Collapse/expand functionality for mobile screens
 * - Persists collapsed state in localStorage
 * 
 * Requirements: 1.1, 1.2, 1.3, 1.4, 7.2
 */
const SideNavigation: React.FC<SideNavigationProps> = ({
  agents,
  selectedAgentId,
  onAgentSelect,
}) => {
  // Load initial collapsed state from localStorage
  const [isCollapsed, setIsCollapsed] = useState<boolean>(() => {
    const preferences = loadPreferences();
    return preferences.sideNavCollapsed;
  });

  // Persist collapsed state to localStorage whenever it changes
  useEffect(() => {
    const preferences = loadPreferences();
    preferences.sideNavCollapsed = isCollapsed;
    savePreferences(preferences);
  }, [isCollapsed]);

  // Toggle collapse state
  const toggleCollapse = () => {
    setIsCollapsed(!isCollapsed);
  };

  // Handle agent selection
  const handleAgentClick = (agentId: string) => {
    onAgentSelect(agentId);
    
    // On mobile, auto-collapse after selection
    if (window.innerWidth < 768) {
      setIsCollapsed(true);
    }
  };

  return (
    <>
      {/* Mobile hamburger button - visible only on mobile */}
      <button
        onClick={toggleCollapse}
        className="
          fixed top-4 left-4 z-50
          md:hidden
          p-2 rounded-lg
          bg-gray-800 hover:bg-gray-700
          text-gray-300 hover:text-white
          active:scale-90
          transition-all duration-200
          transform
          shadow-sm hover:shadow-md
        "
        aria-label={isCollapsed ? 'Open navigation' : 'Close navigation'}
        aria-expanded={!isCollapsed}
      >
        {isCollapsed ? (
          // Hamburger icon
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 6h16M4 12h16M4 18h16"
            />
          </svg>
        ) : (
          // Close icon
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        )}
      </button>

      {/* Overlay for mobile when nav is open */}
      {!isCollapsed && (
        <div
          className="
            fixed inset-0 bg-black bg-opacity-50 z-30
            md:hidden
          "
          onClick={() => setIsCollapsed(true)}
          aria-hidden="true"
        />
      )}

      {/* Side navigation panel */}
      <nav
        className={`
          fixed top-0 left-0 h-full
          bg-gray-900 border-r border-gray-800
          transition-transform duration-300 ease-in-out
          z-40
          ${isCollapsed ? '-translate-x-full md:translate-x-0' : 'translate-x-0'}
          w-full md:w-72
        `}
        aria-label="Agent navigation"
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="p-6 border-b border-gray-800">
            <h1 className="text-xl font-semibold text-white">
              MWC Agents
            </h1>
            <p className="text-sm text-gray-400 mt-1">
              Multi-Agent Infrastructure System
            </p>
          </div>

          {/* Agent list */}
          <div className="flex-1 overflow-y-auto py-4">
            <ul className="space-y-1 px-3" role="list">
              {agents.map((agent) => {
                const isSelected = agent.id === selectedAgentId;
                
                return (
                  <li key={agent.id}>
                    <button
                      onClick={() => handleAgentClick(agent.id)}
                      className={`
                        w-full text-left px-4 py-3 rounded-lg
                        transition-all duration-200
                        transform
                        flex items-start gap-3
                        ${
                          isSelected
                            ? 'bg-blue-600 text-white shadow-lg scale-105'
                            : 'text-gray-300 hover:bg-gray-800 hover:text-white hover:scale-102'
                        }
                      `}
                      aria-current={isSelected ? 'page' : undefined}
                      aria-label={`Select ${agent.name}`}
                    >
                      {/* Status indicator */}
                      <div className="mt-1.5">
                        <AgentStatusIndicator
                          status={agent.status}
                          tooltip={`${agent.name} is ${agent.status}`}
                        />
                      </div>

                      {/* Agent info */}
                      <div className="flex-1 min-w-0">
                        <div className="font-medium truncate">
                          {agent.name}
                        </div>
                        <div
                          className={`
                            text-sm mt-0.5 line-clamp-2
                            ${isSelected ? 'text-blue-100' : 'text-gray-400'}
                          `}
                        >
                          {agent.description}
                        </div>
                      </div>

                      {/* Selected indicator */}
                      {isSelected && (
                        <div className="mt-1.5">
                          <svg
                            className="w-5 h-5"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path
                              fillRule="evenodd"
                              d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                              clipRule="evenodd"
                            />
                          </svg>
                        </div>
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-gray-800">
            <div className="text-xs text-gray-500 text-center">
              Agent UI v1.0.0
            </div>
          </div>
        </div>
      </nav>
    </>
  );
};

export default SideNavigation;
