import React from 'react';
import SideNavigation from './components/SideNavigation';
import MainContent from './components/MainContent';
import ErrorMessage from './components/ErrorMessage';
import { useAgent, useError } from './context/hooks';
import { logError } from './utils/errorLogger';

/**
 * App Component
 * 
 * Root component that wires together the entire application.
 * 
 * Features:
 * - Integrates SideNavigation for agent selection
 * - Integrates MainContent for chat and response display
 * - Manages agent selection logic
 * - Displays global error messages
 * - Application state is initialized and persisted via AppProvider (in main.tsx)
 * 
 * Requirements: All
 */
const App: React.FC = () => {
  // Get agent-related state and actions from context
  const { agents, selectedAgentId, selectAgent } = useAgent();
  
  // Get error state and actions
  const { error, hasError, clearError } = useError();

  /**
   * Handle agent selection from side navigation
   */
  const handleAgentSelect = (agentId: string) => {
    selectAgent(agentId);
  };

  /**
   * Handle error retry
   */
  const handleErrorRetry = () => {
    if (error) {
      // Log the retry attempt
      console.log('Retrying operation:', error.operation);
      
      // Clear the error - the user will retry the operation manually
      clearError();
    }
  };

  /**
   * Handle error dismissal
   */
  const handleErrorDismiss = () => {
    clearError();
  };

  // Log errors when they occur
  React.useEffect(() => {
    if (error) {
      logError(error);
    }
  }, [error]);

  return (
    <div className="flex h-screen overflow-hidden bg-[#0a0e1a]">
      {/* Side Navigation */}
      <SideNavigation
        agents={agents}
        selectedAgentId={selectedAgentId}
        onAgentSelect={handleAgentSelect}
      />

      {/* Main Content Area - offset for side nav on desktop, full width on mobile */}
      <div className="flex-1 md:ml-72 flex flex-col overflow-hidden">
        {/* Global Error Display */}
        {hasError && error && (
          <div className="p-4 border-b border-[#2d3548]">
            <ErrorMessage
              error={error}
              onRetry={error.retryable ? handleErrorRetry : undefined}
              onDismiss={handleErrorDismiss}
            />
          </div>
        )}
        
        <MainContent />
      </div>
    </div>
  );
};

export default App;
