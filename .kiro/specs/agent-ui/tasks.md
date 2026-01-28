# Implementation Plan: Agent UI

## Overview

This implementation plan breaks down the Agent UI development into discrete, manageable tasks. The approach follows a bottom-up strategy, building core components first, then composing them into the complete application. Testing tasks are marked as optional (*) to allow for faster MVP delivery.

## Tasks

- [ ] 1. Project setup and configuration
  - Initialize React + TypeScript project with Vite
  - Configure Tailwind CSS
  - Set up project structure (components, services, types, utils)
  - Install dependencies (react, typescript, tailwindcss, prismjs)
  - Configure TypeScript with strict mode
  - Set up ESLint and Prettier
  - _Requirements: 6.1, 6.2_

- [ ]* 1.1 Write unit tests for project configuration
  - Test TypeScript configuration
  - Test build process
  - _Requirements: 6.1_

- [ ] 2. Implement core data models and types
  - Create TypeScript interfaces for Agent, Message, Conversation
  - Create interfaces for ParsedResponse, TabDefinition, ResponseSection
  - Create types for AgentStatus, DeploymentProgress, ResourceStatus
  - Create API request/response types
  - _Requirements: All (foundational)_

- [ ]* 2.1 Write property test for data model validation
  - **Property: Data models accept valid inputs**
  - **Validates: Requirements: All (foundational)**

- [ ] 3. Implement response parser utility
  - Create function to parse agent responses into sections
  - Implement XML tag extraction (e.g., `<cfn>` tags)
  - Implement markdown section detection (## headers)
  - Create tab generator based on agent type and sections
  - Handle YAML and JSON template detection
  - _Requirements: 3.1, 3.2, 10.5, 10.6_

- [ ]* 3.1 Write property tests for response parser
  - **Property 6: Response parsing creates appropriate tabs**
  - **Property 20: XML tag extraction works correctly**
  - **Validates: Requirements 3.1, 3.2, 10.5, 10.6**

- [ ] 4. Implement local storage service
  - Create service for saving/loading conversation history
  - Implement conversation persistence per agent
  - Create state serialization/deserialization functions
  - Handle storage quota exceeded errors
  - _Requirements: 12.5_

- [ ]* 4.1 Write property tests for storage service
  - **Property 13: Session storage preserves state across refreshes**
  - **Property 15: Session storage round-trip**
  - **Validates: Requirements 12.5**

- [ ] 5. Implement agent API service
  - Create service for invoking agents via HTTP
  - Implement streaming response handling
  - Create agent status check function
  - Implement error handling and retry logic
  - Add request/response logging
  - _Requirements: 2.3, 11.1, 14.6_

- [ ]* 5.1 Write unit tests for API service
  - Test request formatting
  - Test error handling
  - Test retry logic
  - _Requirements: 2.3, 9.1_

- [ ] 6. Create AgentStatusIndicator component
  - Implement status dot with color coding (green/yellow/red)
  - Add tooltip on hover
  - Create pulsing animation for 'busy' status
  - _Requirements: 14.1, 14.2, 14.3, 14.4, 14.5_

- [ ]* 6.1 Write unit tests for AgentStatusIndicator
  - Test status color mapping
  - Test tooltip display
  - _Requirements: 14.2, 14.3, 14.4_

- [ ] 7. Create SideNavigation component
  - Implement agent list display
  - Add agent selection handling
  - Implement selected agent highlighting
  - Add collapse/expand functionality for mobile
  - Persist collapsed state in localStorage
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 7.2_

- [ ]* 7.1 Write property test for SideNavigation
  - **Property 1: Side navigation displays all agents**
  - **Property 2: Agent selection updates main content**
  - **Property 3: Selected agent is highlighted**
  - **Validates: Requirements 1.2, 1.3, 1.4**

- [ ] 8. Create Message component
  - Implement message bubble with role-based styling
  - Add timestamp display
  - Add avatar/icon for agent messages
  - Style user vs agent messages differently
  - _Requirements: 2.4, 2.7_

- [ ]* 8.1 Write unit tests for Message component
  - Test message rendering
  - Test timestamp formatting
  - _Requirements: 2.4, 2.7_

- [ ] 9. Create ChatInput component
  - Implement multi-line textarea
  - Add send button
  - Handle Enter key to submit (Shift+Enter for new line)
  - Add character count indicator
  - Disable input during loading
  - _Requirements: 2.2, 2.6, 15.2_

- [ ]* 9.1 Write unit tests for ChatInput
  - Test input handling
  - Test keyboard shortcuts
  - _Requirements: 2.2, 15.2_

- [ ] 10. Create ChatWindow component
  - Implement message list display
  - Add auto-scroll to latest message
  - Integrate ChatInput component
  - Add loading indicator for streaming
  - Display streaming content in real-time
  - _Requirements: 2.1, 2.4, 2.5, 11.1, 11.2, 11.3_

- [ ]* 10.1 Write property tests for ChatWindow
  - **Property 4: Message submission creates conversation entry**
  - **Property 5: Conversation history displays all messages**
  - **Property 15: Streaming responses display incrementally**
  - **Validates: Requirements 2.3, 2.4, 11.1, 11.2**

- [ ] 11. Create TabBar component
  - Implement tab list display
  - Add tab selection handling
  - Highlight active tab
  - Support keyboard navigation (arrow keys)
  - _Requirements: 3.5, 3.6_

- [ ]* 11.1 Write unit tests for TabBar
  - Test tab rendering
  - Test tab selection
  - _Requirements: 3.5, 3.6_

- [ ] 12. Create TemplateTab component
  - Integrate Prism.js for syntax highlighting
  - Detect YAML vs JSON format
  - Add line numbers
  - Implement copy to clipboard button
  - Add download as file button
  - Make content scrollable
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6_

- [ ]* 12.1 Write property tests for TemplateTab
  - **Property 9: Template syntax highlighting applies correctly**
  - **Property 10: Copy to clipboard succeeds with confirmation**
  - **Validates: Requirements 4.1, 4.6, 13.5**

- [ ] 13. Create ProgressTab component
  - Implement progress bar with percentage
  - Create resource list with status indicators
  - Add event timeline display
  - Implement auto-refresh mechanism (5 second interval)
  - Color-code resource statuses
  - Display deployment duration
  - _Requirements: 5.1, 5.2, 5.3, 5.6, 5.7_

- [ ]* 13.1 Write property test for ProgressTab
  - **Property 11: Progress indicator reflects deployment state**
  - **Validates: Requirements 5.2, 5.3**

- [ ] 14. Create generic tab content components
  - Create ArchitectureTab for architecture diagrams
  - Create CostOptimizationTab for cost breakdowns
  - Create SummaryTab with markdown rendering
  - Create ResourcesTab for resource lists
  - _Requirements: 3.3, 3.4, 10.1_

- [ ]* 14.1 Write unit tests for tab content components
  - Test markdown rendering
  - Test content display
  - _Requirements: 10.1_

- [ ] 15. Create ResponseViewer component
  - Integrate TabBar component
  - Implement tab content switching
  - Parse agent responses using response parser
  - Generate tabs based on agent type
  - Preserve active tab state
  - _Requirements: 3.1, 3.2, 3.5, 3.7_

- [ ]* 15.1 Write property tests for ResponseViewer
  - **Property 6: Response parsing creates appropriate tabs**
  - **Property 7: Tab switching displays correct content**
  - **Property 8: Tab state persists across agent switches**
  - **Validates: Requirements 3.1, 3.2, 3.5, 3.7**

- [ ] 16. Implement application state management
  - Create React Context for app state
  - Implement state reducer for actions
  - Create hooks for accessing state (useAgent, useConversation)
  - Implement state persistence to localStorage
  - _Requirements: 12.1, 12.5_

- [ ]* 16.1 Write property tests for state management
  - **Property 12: Conversation history persists per agent**
  - **Property 13: Session storage preserves state across refreshes**
  - **Validates: Requirements 12.1, 12.5**

- [ ] 17. Create MainContent component
  - Integrate ChatWindow component
  - Integrate ResponseViewer component
  - Handle agent selection changes
  - Manage conversation state for selected agent
  - _Requirements: 1.3, 2.1_

- [ ]* 17.1 Write integration tests for MainContent
  - Test agent switching
  - Test conversation display
  - _Requirements: 1.3, 2.1_

- [ ] 18. Create App component and wire everything together
  - Integrate SideNavigation component
  - Integrate MainContent component
  - Implement agent selection logic
  - Initialize application state
  - Load persisted state on mount
  - _Requirements: All_

- [ ]* 18.1 Write integration tests for App component
  - Test complete user workflows
  - Test state persistence
  - _Requirements: All_

- [ ] 19. Implement keyboard shortcuts
  - Add global keyboard event listener
  - Implement Ctrl/Cmd + K for chat focus
  - Implement Ctrl/Cmd + 1/2/3 for agent switching
  - Implement Enter for message submit
  - Implement Escape for modal close
  - Create help panel with shortcut list (Ctrl/Cmd + /)
  - _Requirements: 15.1, 15.2, 15.3, 15.4, 15.5, 15.6_

- [ ]* 19.1 Write unit tests for keyboard shortcuts
  - Test shortcut registration
  - Test shortcut execution
  - _Requirements: 15.1, 15.2, 15.3, 15.4, 15.5_

- [ ] 20. Implement responsive design
  - Add media queries for breakpoints
  - Implement side navigation collapse on mobile
  - Adjust chat window layout for mobile
  - Stack tabs vertically on narrow screens
  - Test on various screen sizes
  - _Requirements: 7.1, 7.2, 7.4_

- [ ]* 20.1 Write property test for responsive behavior
  - **Property 14: Responsive layout adapts to screen size**
  - **Validates: Requirements 7.1, 7.2**

- [ ] 21. Implement error handling UI
  - Create ErrorMessage component
  - Add error boundary for React errors
  - Implement retry button for failed operations
  - Display error details with categorization
  - Add error logging
  - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5, 9.6_

- [ ]* 21.1 Write property tests for error handling
  - **Property 17: Error messages include required information**
  - **Property 18: Error types are distinguished**
  - **Validates: Requirements 9.1, 9.2, 9.4**

- [ ] 22. Implement markdown and code rendering
  - Integrate markdown parser (marked or react-markdown)
  - Add syntax highlighting for code blocks
  - Render tables from markdown
  - Render lists with proper indentation
  - Sanitize HTML to prevent XSS
  - _Requirements: 10.1, 10.2, 10.3, 10.4_

- [ ]* 22.1 Write property tests for markdown rendering
  - **Property 19: Markdown rendering formats correctly**
  - **Validates: Requirements 10.1, 10.2, 10.3, 10.4**

- [ ] 23. Implement visual feedback and animations
  - Add hover effects for interactive elements
  - Implement button click animations
  - Add loading spinners
  - Create smooth tab transitions
  - Add message fade-in animations
  - _Requirements: 8.2, 8.3_

- [ ]* 23.1 Write unit tests for visual feedback
  - Test hover states
  - Test click feedback
  - _Requirements: 8.3_

- [ ] 24. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 25. Create backend API service
  - Set up Express or FastAPI server
  - Implement /api/agents/list endpoint
  - Implement /api/agents/invoke endpoint with streaming
  - Implement /api/agents/status endpoint
  - Implement /api/stacks/status endpoint for CloudFormation
  - Add CORS configuration
  - Add error handling middleware
  - _Requirements: 2.3, 5.4, 14.6_

- [ ]* 25.1 Write unit tests for API endpoints
  - Test endpoint responses
  - Test error handling
  - _Requirements: 2.3, 9.1_

- [ ] 26. Integrate with AWS AgentCore
  - Implement boto3 calls to invoke agents
  - Handle streaming responses from AgentCore
  - Implement CloudFormation status polling
  - Add AWS credential configuration
  - Handle AWS SDK errors
  - _Requirements: 2.3, 5.4_

- [ ]* 26.1 Write integration tests for AWS integration
  - Test agent invocation
  - Test CloudFormation polling
  - _Requirements: 2.3, 5.4_

- [ ] 27. Implement deployment progress polling
  - Create polling service for CloudFormation stacks
  - Update progress state every 5 seconds
  - Stop polling on terminal status
  - Handle polling errors gracefully
  - _Requirements: 5.4, 5.7_

- [ ]* 27.1 Write unit tests for polling service
  - Test polling logic
  - Test terminal status detection
  - _Requirements: 5.4_

- [ ] 28. Add accessibility features
  - Add ARIA labels to all interactive elements
  - Implement focus management
  - Add keyboard navigation support
  - Test with screen readers
  - Ensure color contrast meets WCAG AA
  - _Requirements: 15.1_

- [ ]* 28.1 Write accessibility tests
  - Test ARIA labels
  - Test keyboard navigation
  - _Requirements: 15.1_

- [ ] 29. Implement Salesforce compatibility layer
  - Document component-to-LWC mapping
  - Create style guide with SLDS equivalents
  - Abstract API calls behind service interface
  - Document migration steps
  - Create example LWC component conversion
  - _Requirements: 6.1, 6.2, 6.3, 6.5, 6.6, 6.7_

- [ ] 30. Final integration and testing
  - Test complete user workflows
  - Test all three agents
  - Verify responsive design on multiple devices
  - Test error scenarios
  - Verify performance targets
  - _Requirements: All_

- [ ]* 30.1 Write end-to-end tests
  - Test complete user journeys
  - Test multi-agent workflows
  - _Requirements: All_

- [ ] 31. Checkpoint - Final verification
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 32. Create deployment documentation
  - Write README for UI project
  - Document environment variables
  - Create deployment guide
  - Document Salesforce migration path
  - _Requirements: 6.7_

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties
- Unit tests validate specific examples and edge cases
- The implementation follows a component-based approach suitable for Salesforce migration
