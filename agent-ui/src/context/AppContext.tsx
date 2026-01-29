import React, { createContext, useContext, useReducer, useEffect } from 'react';
import type { ReactNode } from 'react';
import type { AppState } from '../types';
import { appReducer } from './appReducer';
import type { AppAction } from './appReducer';
import { loadState, saveState, deserializeConversations } from './statePersistence';

// ============================================================================
// Context Definition
// ============================================================================

interface AppContextType {
  state: AppState;
  dispatch: React.Dispatch<AppAction>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

// ============================================================================
// Initial State
// ============================================================================

const getDefaultAgents = () => [
  {
    id: 'onboarding',
    name: 'OnboardingAgent',
    description: 'Helps design and architect AWS infrastructure',
    status: 'unknown' as const,
    arn: import.meta.env.VITE_ONBOARDING_AGENT_ARN || '',
    capabilities: ['architecture', 'cost-optimization', 'cloudformation'],
    icon: '🏗️'
  },
  {
    id: 'provisioning',
    name: 'ProvisioningAgent',
    description: 'Deploys CloudFormation stacks and monitors progress',
    status: 'unknown' as const,
    arn: import.meta.env.VITE_PROVISIONING_AGENT_ARN || '',
    capabilities: ['deployment', 'monitoring', 'resources'],
    icon: '🚀'
  },
  {
    id: 'mwc',
    name: 'MWCAgent',
    description: 'Orchestrates multi-agent workflows',
    status: 'unknown' as const,
    arn: import.meta.env.VITE_MWC_AGENT_ARN || '',
    capabilities: ['orchestration', 'workflow', 'coordination'],
    icon: '🎯'
  }
];

const createInitialState = (initialAgents?: any[]): AppState => {
  // Try to load persisted state
  const persistedState = loadState();
  
  const agents = initialAgents || getDefaultAgents();
  
  if (persistedState) {
    return {
      selectedAgentId: persistedState.lastSelectedAgent || agents[0]?.id || 'onboarding',
      agents,
      conversations: deserializeConversations(persistedState.conversations),
      user: {}
    };
  }

  // Default initial state
  return {
    selectedAgentId: agents[0]?.id || 'onboarding',
    agents,
    conversations: {},
    user: {}
  };
};

// ============================================================================
// Provider Component
// ============================================================================

interface AppProviderProps {
  children: ReactNode;
  initialAgents?: any[]; // For testing purposes
}

export const AppProvider: React.FC<AppProviderProps> = ({ children, initialAgents }) => {
  const [state, dispatch] = useReducer(appReducer, createInitialState(initialAgents));

  // Persist state to localStorage whenever it changes
  useEffect(() => {
    saveState(state);
  }, [state]);

  return (
    <AppContext.Provider value={{ state, dispatch }}>
      {children}
    </AppContext.Provider>
  );
};

// ============================================================================
// Hook to use App Context
// ============================================================================

export const useAppContext = (): AppContextType => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
};
