# Integration Test Checklist

This document provides a comprehensive checklist for manually testing the Agent UI application to verify all requirements are met.

## Test Environment Setup

1. Ensure backend API is running
2. Ensure AWS credentials are configured
3. Ensure all three agents are deployed and accessible
4. Open the application in a browser

## Complete User Workflows

### Workflow 1: OnboardingAgent - Design Infrastructure

- [ ] Select OnboardingAgent from side navigation
- [ ] Verify OnboardingAgent is highlighted
- [ ] Type message: "Design a simple S3 bucket with versioning"
- [ ] Click Send button
- [ ] Verify message appears in chat window
- [ ] Verify loading indicator appears
- [ ] Verify agent response streams in real-time
- [ ] Verify response is parsed into tabs:
  - [ ] Architecture tab
  - [ ] Cost Optimization tab
  - [ ] CloudFormation Template tab
  - [ ] Summary tab
- [ ] Click each tab and verify content displays correctly
- [ ] Verify CloudFormation template has syntax highlighting
- [ ] Click "Copy" button on template tab
- [ ] Verify clipboard contains template
- [ ] Verify confirmation message appears

### Workflow 2: ProvisioningAgent - Deploy Infrastructure

- [ ] Select ProvisioningAgent from side navigation
- [ ] Verify ProvisioningAgent is highlighted
- [ ] Verify OnboardingAgent conversation is preserved (not visible)
- [ ] Type message: "Deploy the CloudFormation stack"
- [ ] Click Send button
- [ ] Verify message appears in chat window
- [ ] Verify agent response appears
- [ ] Verify Progress tab shows deployment status
- [ ] Verify resource list updates in real-time
- [ ] Verify progress bar updates
- [ ] Verify event timeline displays
- [ ] Wait for deployment to complete
- [ ] Verify final status is displayed

### Workflow 3: MWCAgent - Orchestrate Workflow

- [ ] Select MWCAgent from side navigation
- [ ] Verify MWCAgent is highlighted
- [ ] Type message: "Orchestrate a complete infrastructure setup"
- [ ] Click Send button
- [ ] Verify message appears
- [ ] Verify agent response appears
- [ ] Verify response is displayed appropriately

### Workflow 4: Agent Switching with History Preservation

- [ ] Select OnboardingAgent
- [ ] Send message: "Message 1 to onboarding"
- [ ] Verify response appears
- [ ] Select ProvisioningAgent
- [ ] Send message: "Message 1 to provisioning"
- [ ] Verify response appears
- [ ] Select OnboardingAgent again
- [ ] Verify "Message 1 to onboarding" is still visible
- [ ] Verify "Message 1 to provisioning" is NOT visible
- [ ] Select ProvisioningAgent again
- [ ] Verify "Message 1 to provisioning" is visible
- [ ] Verify "Message 1 to onboarding" is NOT visible

## Responsive Design Testing

### Desktop (1920x1080)

- [ ] Open application at 1920x1080 resolution
- [ ] Verify side navigation is visible
- [ ] Verify side navigation width is 280px
- [ ] Verify main content area is properly sized
- [ ] Verify all components are readable
- [ ] Verify no horizontal scrolling

### Tablet (768x1024)

- [ ] Resize browser to 768x1024
- [ ] Verify side navigation is still visible
- [ ] Verify layout adapts appropriately
- [ ] Verify chat window is usable
- [ ] Verify tabs are accessible

### Mobile (375x667)

- [ ] Resize browser to 375x667
- [ ] Verify side navigation collapses to hamburger menu
- [ ] Click hamburger menu
- [ ] Verify side navigation slides in
- [ ] Verify overlay appears behind navigation
- [ ] Click overlay
- [ ] Verify navigation closes
- [ ] Select an agent
- [ ] Verify navigation auto-closes after selection
- [ ] Verify chat window is usable on mobile
- [ ] Verify send button is accessible
- [ ] Verify tabs stack appropriately

## Error Scenarios

### Network Error

- [ ] Disconnect from internet
- [ ] Try to send a message
- [ ] Verify error message appears
- [ ] Verify error type is "network"
- [ ] Verify error message includes actionable steps
- [ ] Verify retry button appears
- [ ] Reconnect to internet
- [ ] Click retry button
- [ ] Verify error clears
- [ ] Verify operation can be retried

### Agent Unavailable Error

- [ ] Stop backend API
- [ ] Try to send a message
- [ ] Verify error message appears
- [ ] Verify error indicates agent is unavailable
- [ ] Verify retry button appears
- [ ] Restart backend API
- [ ] Click retry button
- [ ] Verify operation succeeds

### Authentication Error (if applicable)

- [ ] Invalidate authentication credentials
- [ ] Try to send a message
- [ ] Verify authentication error appears
- [ ] Verify error message suggests logging in again
- [ ] Verify no retry button (not retryable)

### Deployment Error

- [ ] Send invalid CloudFormation template to ProvisioningAgent
- [ ] Verify deployment fails
- [ ] Verify error details are displayed
- [ ] Verify failed resources are highlighted
- [ ] Verify error message includes CloudFormation error details

## Performance Targets

### Initial Load Time

- [ ] Clear browser cache
- [ ] Open application
- [ ] Measure time to interactive
- [ ] Verify load time < 2 seconds

### Agent Switch Time

- [ ] Select OnboardingAgent
- [ ] Measure time to switch
- [ ] Select ProvisioningAgent
- [ ] Measure time to switch
- [ ] Verify switch time < 200ms

### Tab Switch Time

- [ ] Click Architecture tab
- [ ] Measure time to display content
- [ ] Click Cost tab
- [ ] Measure time to display content
- [ ] Verify tab switch time < 100ms

### Message Send Feedback

- [ ] Type a message
- [ ] Click send
- [ ] Measure time until message appears in chat
- [ ] Verify feedback time < 100ms

### Streaming Start Time

- [ ] Send a message
- [ ] Measure time until first chunk appears
- [ ] Verify streaming starts < 500ms

## Session Management

### Conversation Persistence

- [ ] Send messages to OnboardingAgent
- [ ] Send messages to ProvisioningAgent
- [ ] Refresh the page
- [ ] Verify OnboardingAgent conversation is restored
- [ ] Verify ProvisioningAgent conversation is restored
- [ ] Verify selected agent is restored
- [ ] Verify active tab is restored

### Clear Conversation

- [ ] Send several messages to an agent
- [ ] Click "Clear Conversation" button (if implemented)
- [ ] Verify conversation is cleared
- [ ] Verify localStorage is updated

## Input Validation

### Empty Message

- [ ] Click send button without typing anything
- [ ] Verify message is not sent
- [ ] Verify no API call is made

### Whitespace-Only Message

- [ ] Type only spaces: "     "
- [ ] Click send button
- [ ] Verify message is not sent
- [ ] Verify no API call is made

### Multi-line Message

- [ ] Type a message
- [ ] Press Shift+Enter
- [ ] Type more text
- [ ] Press Shift+Enter again
- [ ] Type more text
- [ ] Press Enter
- [ ] Verify entire multi-line message is sent

### Character Limit

- [ ] Type a very long message (> 5000 characters)
- [ ] Verify character counter turns red
- [ ] Verify input is limited to 5000 characters

## Keyboard Navigation

### Chat Input Focus

- [ ] Press Ctrl/Cmd + K
- [ ] Verify chat input receives focus

### Agent Switching

- [ ] Press Ctrl/Cmd + 1
- [ ] Verify OnboardingAgent is selected
- [ ] Press Ctrl/Cmd + 2
- [ ] Verify ProvisioningAgent is selected
- [ ] Press Ctrl/Cmd + 3
- [ ] Verify MWCAgent is selected

### Message Submit

- [ ] Focus chat input
- [ ] Type a message
- [ ] Press Enter
- [ ] Verify message is sent

### Help Panel

- [ ] Press Ctrl/Cmd + /
- [ ] Verify help panel appears with keyboard shortcuts
- [ ] Press Escape
- [ ] Verify help panel closes

## Visual Design Verification

### Dark Theme

- [ ] Verify background color is dark (#0a0e1a)
- [ ] Verify text is readable with high contrast
- [ ] Verify all colors match design specifications

### Animations

- [ ] Hover over agent in side navigation
- [ ] Verify smooth hover effect
- [ ] Click send button
- [ ] Verify button click animation
- [ ] Switch tabs
- [ ] Verify smooth tab transition
- [ ] Observe new messages appearing
- [ ] Verify fade-in animation

### Status Indicators

- [ ] Verify green dot for available agents
- [ ] Hover over status indicator
- [ ] Verify tooltip appears with status details
- [ ] If agent is busy, verify yellow pulsing indicator
- [ ] If agent has error, verify red indicator

## Accessibility

### Keyboard Navigation

- [ ] Tab through all interactive elements
- [ ] Verify focus indicators are visible
- [ ] Verify tab order is logical

### Screen Reader Support

- [ ] Enable screen reader
- [ ] Navigate through application
- [ ] Verify ARIA labels are present
- [ ] Verify roles are appropriate
- [ ] Verify announcements are made for dynamic content

### Color Contrast

- [ ] Use browser dev tools to check contrast ratios
- [ ] Verify all text meets WCAG AA (4.5:1 minimum)
- [ ] Verify interactive elements are distinguishable

## Browser Compatibility

### Chrome

- [ ] Test all workflows in Chrome
- [ ] Verify no console errors
- [ ] Verify all features work

### Firefox

- [ ] Test all workflows in Firefox
- [ ] Verify no console errors
- [ ] Verify all features work

### Safari

- [ ] Test all workflows in Safari
- [ ] Verify no console errors
- [ ] Verify all features work

### Edge

- [ ] Test all workflows in Edge
- [ ] Verify no console errors
- [ ] Verify all features work

## Test Results Summary

Date: _______________
Tester: _______________

Total Tests: _______________
Passed: _______________
Failed: _______________

Critical Issues Found:
1. _______________
2. _______________
3. _______________

Notes:
_______________________________________________
_______________________________________________
_______________________________________________
