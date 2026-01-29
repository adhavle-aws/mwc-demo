import React from 'react';
import MainContent from './MainContent';
import { AppProvider } from '../context/AppContext';

/**
 * MainContent Component Examples
 * 
 * These examples demonstrate the MainContent component in various states.
 * The component integrates ChatWindow and ResponseViewer to provide
 * a complete agent interaction experience.
 */

/**
 * Example 1: Basic Usage
 * 
 * MainContent component within the application context.
 * This is the standard usage pattern.
 */
export const BasicExample: React.FC = () => {
  return (
    <AppProvider>
      <div className="h-screen w-screen bg-[#0a0e1a]">
        <MainContent />
      </div>
    </AppProvider>
  );
};

/**
 * Example 2: With Side Navigation
 * 
 * Complete layout showing MainContent alongside SideNavigation.
 * This demonstrates the typical application layout.
 */
export const WithSideNavigationExample: React.FC = () => {
  return (
    <AppProvider>
      <div className="h-screen w-screen flex bg-[#0a0e1a]">
        {/* Side Navigation would go here */}
        <div className="w-64 bg-[#151b2d] border-r border-[#2d3548] p-4">
          <div className="text-[#e4e7eb] font-semibold mb-4">Agents</div>
          <div className="space-y-2">
            <div className="p-2 bg-[#1e2638] rounded text-[#e4e7eb]">
              OnboardingAgent
            </div>
            <div className="p-2 text-[#9ca3af]">
              ProvisioningAgent
            </div>
            <div className="p-2 text-[#9ca3af]">
              MWCAgent
            </div>
          </div>
        </div>
        
        {/* Main Content */}
        <MainContent />
      </div>
    </AppProvider>
  );
};

/**
 * Example 3: Mobile Layout
 * 
 * MainContent in a mobile viewport.
 * The layout stacks vertically on smaller screens.
 */
export const MobileLayoutExample: React.FC = () => {
  return (
    <AppProvider>
      <div className="h-screen w-full max-w-md bg-[#0a0e1a]">
        <MainContent />
      </div>
    </AppProvider>
  );
};

/**
 * Example 4: Desktop Layout
 * 
 * MainContent in a desktop viewport.
 * The layout displays side-by-side on larger screens.
 */
export const DesktopLayoutExample: React.FC = () => {
  return (
    <AppProvider>
      <div className="h-screen w-full bg-[#0a0e1a]">
        <MainContent />
      </div>
    </AppProvider>
  );
};

/**
 * Example 5: Integration Test Setup
 * 
 * Setup for testing MainContent with controlled state.
 * Useful for integration tests and storybook stories.
 */
export const IntegrationTestExample: React.FC = () => {
  return (
    <AppProvider>
      <div className="h-screen w-screen bg-[#0a0e1a]">
        <div className="h-full flex flex-col">
          {/* Header */}
          <div className="bg-[#151b2d] border-b border-[#2d3548] p-4">
            <h1 className="text-[#e4e7eb] text-xl font-semibold">
              Agent UI - Integration Test
            </h1>
          </div>
          
          {/* Main Content */}
          <div className="flex-1 overflow-hidden">
            <MainContent />
          </div>
        </div>
      </div>
    </AppProvider>
  );
};

/**
 * Example 6: With Custom Styling
 * 
 * MainContent with additional custom styling applied.
 * Demonstrates how to customize the appearance.
 */
export const CustomStyledExample: React.FC = () => {
  return (
    <AppProvider>
      <div className="h-screen w-screen bg-gradient-to-br from-[#0a0e1a] to-[#151b2d]">
        <div className="h-full p-4">
          <div className="h-full rounded-lg overflow-hidden shadow-2xl">
            <MainContent />
          </div>
        </div>
      </div>
    </AppProvider>
  );
};

/**
 * Example 7: Responsive Container
 * 
 * MainContent in a responsive container that adapts to viewport size.
 */
export const ResponsiveContainerExample: React.FC = () => {
  return (
    <AppProvider>
      <div className="min-h-screen bg-[#0a0e1a] p-4 md:p-8">
        <div className="max-w-7xl mx-auto h-[calc(100vh-2rem)] md:h-[calc(100vh-4rem)]">
          <div className="h-full rounded-lg overflow-hidden border border-[#2d3548]">
            <MainContent />
          </div>
        </div>
      </div>
    </AppProvider>
  );
};

// Export all examples
export default {
  BasicExample,
  WithSideNavigationExample,
  MobileLayoutExample,
  DesktopLayoutExample,
  IntegrationTestExample,
  CustomStyledExample,
  ResponsiveContainerExample
};
