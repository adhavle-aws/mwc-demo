# Salesforce Migration Steps

## Overview

This document provides a detailed, step-by-step guide for migrating the Agent UI from a standalone React application to Salesforce Lightning Web Components.

## Prerequisites

### Required Tools

- Salesforce CLI (sfdx)
- VS Code with Salesforce Extensions
- Node.js 18+ and npm
- Git
- Access to Salesforce Developer Org or Sandbox

### Required Knowledge

- Lightning Web Components fundamentals
- Apex programming
- Salesforce security model
- AWS Bedrock AgentCore API

### Salesforce Environment Setup

1. **Create Developer Org or Sandbox**
   ```bash
   # Authenticate with Salesforce
   sfdx auth:web:login -a MyDevOrg
   
   # Set default org
   sfdx config:set defaultusername=MyDevOrg
   ```

2. **Install VS Code Extensions**
   - Salesforce Extension Pack
   - Lightning Web Components
   - Apex Language Server

3. **Create SFDX Project**
   ```bash
   sfdx project:create -n agent-ui-salesforce
   cd agent-ui-salesforce
   ```


## Phase 1: Foundation (Week 1-2)

### Week 1: Project Setup and Configuration

#### Day 1-2: Salesforce Project Structure

1. **Create project structure**
   ```bash
   mkdir -p force-app/main/default/lwc
   mkdir -p force-app/main/default/classes
   mkdir -p force-app/main/default/objects
   mkdir -p force-app/main/default/messageChannels
   mkdir -p force-app/main/default/customMetadata
   ```

2. **Configure Named Credentials**
   
   Navigate to Setup → Named Credentials → New Named Credential
   
   **AWS Bedrock AgentCore:**
   - Label: `AWS Bedrock AgentCore`
   - Name: `AWS_Bedrock_AgentCore`
   - URL: `https://bedrock-agent-runtime.us-east-1.amazonaws.com`
   - Identity Type: `AWS Signature Version 4`
   - Authentication Protocol: `AWS Signature Version 4`
   - AWS Region: `us-east-1`
   - AWS Service: `bedrock`
   - AWS Access Key ID: (from AWS IAM)
   - AWS Secret Access Key: (from AWS IAM)

   **AWS CloudFormation:**
   - Label: `AWS CloudFormation`
   - Name: `AWS_CloudFormation`
   - URL: `https://cloudformation.us-east-1.amazonaws.com`
   - Identity Type: `AWS Signature Version 4`
   - AWS Region: `us-east-1`
   - AWS Service: `cloudformation`

3. **Configure Remote Site Settings**
   
   Navigate to Setup → Remote Site Settings → New Remote Site
   
   - Remote Site Name: `AWS_Bedrock`
   - Remote Site URL: `https://bedrock-agent-runtime.us-east-1.amazonaws.com`
   - Active: ✓

   - Remote Site Name: `AWS_CloudFormation`
   - Remote Site URL: `https://cloudformation.us-east-1.amazonaws.com`
   - Active: ✓


#### Day 3-4: Custom Metadata and Settings

1. **Create Custom Metadata Type: Agent_Configuration__mdt**
   
   ```bash
   sfdx force:cmdt:create -n Agent_Configuration -l "Agent Configuration"
   ```
   
   Add fields:
   - `Agent_Id__c` (Text, 255)
   - `Agent_Name__c` (Text, 255)
   - `Agent_ARN__c` (Text, 255)
   - `Agent_Description__c` (Long Text Area, 1000)

2. **Create Custom Metadata Records**
   
   ```xml
   <!-- Agent_Configuration.OnboardingAgent.md-meta.xml -->
   <?xml version="1.0" encoding="UTF-8"?>
   <CustomMetadata xmlns="http://soap.sforce.com/2006/04/metadata">
       <label>OnboardingAgent</label>
       <protected>false</protected>
       <values>
           <field>Agent_Id__c</field>
           <value xsi:type="xsd:string">onboarding-agent</value>
       </values>
       <values>
           <field>Agent_Name__c</field>
           <value xsi:type="xsd:string">OnboardingAgent</value>
       </values>
       <values>
           <field>Agent_ARN__c</field>
           <value xsi:type="xsd:string">arn:aws:bedrock-agent:us-east-1:ACCOUNT:agent/AGENT_ID</value>
       </values>
       <values>
           <field>Agent_Description__c</field>
           <value xsi:type="xsd:string">Helps with infrastructure onboarding and architecture design</value>
       </values>
   </CustomMetadata>
   ```

3. **Create Custom Settings: Agent_Settings__c**
   
   Navigate to Setup → Custom Settings → New
   
   - Label: `Agent Settings`
   - Object Name: `Agent_Settings`
   - Setting Type: `Hierarchy`
   
   Add fields:
   - `Polling_Interval__c` (Number, Default: 5000)
   - `Max_Retry_Attempts__c` (Number, Default: 3)
   - `Request_Timeout__c` (Number, Default: 120000)

#### Day 5: Platform Events

1. **Create Platform Event: Agent_Response__e**
   
   ```bash
   sfdx force:object:create -l "Agent Response" -p Agent_Response__e -t event
   ```
   
   Add fields via Setup → Platform Events → Agent Response → Fields:
   - `Request_Id__c` (Text, 255, Required)
   - `Chunk__c` (Long Text Area, 131072)
   - `Is_Complete__c` (Checkbox, Default: false)
   - `Is_Error__c` (Checkbox, Default: false)
   - `Sequence_Number__c` (Number, for ordering chunks)

2. **Create Message Channel: AgentResponseChannel**
   
   ```xml
   <!-- AgentResponseChannel.messageChannel-meta.xml -->
   <?xml version="1.0" encoding="UTF-8"?>
   <LightningMessageChannel xmlns="http://soap.sforce.com/2006/04/metadata">
       <description>Channel for agent response streaming</description>
       <isExposed>true</isExposed>
       <lightningMessageFields>
           <fieldName>requestId</fieldName>
           <description>Unique request identifier</description>
       </lightningMessageFields>
       <lightningMessageFields>
           <fieldName>chunk</fieldName>
           <description>Response chunk content</description>
       </lightningMessageFields>
       <lightningMessageFields>
           <fieldName>isComplete</fieldName>
           <description>Whether streaming is complete</description>
       </lightningMessageFields>
       <lightningMessageFields>
           <fieldName>isError</fieldName>
           <description>Whether this is an error message</description>
       </lightningMessageFields>
       <masterLabel>Agent Response Channel</masterLabel>
   </LightningMessageChannel>
   ```


### Week 2: Apex Controllers and Services

#### Day 1-3: Create Apex Controllers

1. **Create AgentController.cls**
   
   ```bash
   sfdx force:apex:class:create -n AgentController -d force-app/main/default/classes
   ```
   
   Implement methods:
   - `invokeAgent(String agentId, String prompt, String sessionId)`
   - `checkAgentStatus(String agentId)`
   - `checkAllAgentsStatus()`
   - `getStackStatus(String stackName)`

2. **Create AgentInvocationJob.cls (Queueable)**
   
   ```bash
   sfdx force:apex:class:create -n AgentInvocationJob -d force-app/main/default/classes
   ```
   
   Implement async agent invocation with Platform Event publishing

3. **Create AgentConfig.cls (Utility)**
   
   ```bash
   sfdx force:apex:class:create -n AgentConfig -d force-app/main/default/classes
   ```
   
   Implement configuration retrieval from Custom Metadata

#### Day 4-5: Apex Testing

1. **Create Test Classes**
   
   ```bash
   sfdx force:apex:class:create -n AgentControllerTest -d force-app/main/default/classes
   sfdx force:apex:class:create -n AgentInvocationJobTest -d force-app/main/default/classes
   ```

2. **Create Mock Classes**
   
   ```bash
   sfdx force:apex:class:create -n AgentCalloutMock -d force-app/main/default/classes
   ```

3. **Run Tests**
   
   ```bash
   sfdx force:apex:test:run -n AgentControllerTest,AgentInvocationJobTest -r human
   ```
   
   Ensure minimum 75% code coverage


## Phase 2: Component Migration (Week 3-6)

### Week 3: Simple Components

#### Day 1: LoadingSpinner

1. **Create LWC component**
   ```bash
   sfdx force:lightning:component:create -n loadingSpinner -d force-app/main/default/lwc
   ```

2. **Implement using `lightning-spinner`**
   ```html
   <template>
       <lightning-spinner alternative-text="Loading" size={size}></lightning-spinner>
   </template>
   ```

3. **Test component**
   ```bash
   npm run test:unit -- loadingSpinner
   ```

#### Day 2: AgentStatusIndicator

1. **Create LWC component**
   ```bash
   sfdx force:lightning:component:create -n statusIndicator -d force-app/main/default/lwc
   ```

2. **Implement status dot with SLDS colors**

3. **Test component**

#### Day 3: ErrorMessage

1. **Create LWC component**
   ```bash
   sfdx force:lightning:component:create -n errorMessage -d force-app/main/default/lwc
   ```

2. **Implement using `lightning-formatted-text`**

3. **Test component**

#### Day 4-5: Message Component

1. **Create LWC component**
   ```bash
   sfdx force:lightning:component:create -n chatMessage -d force-app/main/default/lwc
   ```

2. **Implement message bubble with role-based styling**

3. **Add timestamp formatting**

4. **Test component**

### Week 4: Medium Complexity Components

#### Day 1-2: ChatInput

1. **Create LWC component**
   ```bash
   sfdx force:lightning:component:create -n chatInput -d force-app/main/default/lwc
   ```

2. **Implement using `lightning-textarea`**

3. **Add keyboard shortcuts (Enter to submit)**

4. **Add character count**

5. **Test component**

#### Day 3-4: TabBar

1. **Create LWC component**
   ```bash
   sfdx force:lightning:component:create -n tabBar -d force-app/main/default/lwc
   ```

2. **Implement using `lightning-tabset`**

3. **Add keyboard navigation**

4. **Test component**

#### Day 5: Tab Content Components

1. **Create tab components**
   ```bash
   sfdx force:lightning:component:create -n architectureTab -d force-app/main/default/lwc
   sfdx force:lightning:component:create -n costOptimizationTab -d force-app/main/default/lwc
   sfdx force:lightning:component:create -n summaryTab -d force-app/main/default/lwc
   sfdx force:lightning:component:create -n resourcesTab -d force-app/main/default/lwc
   ```

2. **Implement each tab with appropriate SLDS components**

3. **Test components**


### Week 5: Complex Components Part 1

#### Day 1-2: TemplateTab

1. **Create LWC component**
   ```bash
   sfdx force:lightning:component:create -n templateViewer -d force-app/main/default/lwc
   ```

2. **Upload Prism.js as Static Resource**
   ```bash
   sfdx force:source:deploy -p force-app/main/default/staticresources/prismjs.resource-meta.xml
   ```

3. **Implement syntax highlighting**
   - Load Prism.js in `renderedCallback()`
   - Apply highlighting to code blocks
   - Add copy and download functionality

4. **Test component**

#### Day 3-4: ProgressTab

1. **Create LWC component**
   ```bash
   sfdx force:lightning:component:create -n deploymentProgress -d force-app/main/default/lwc
   ```

2. **Implement using multiple SLDS components**
   - `lightning-progress-bar` for overall progress
   - `lightning-datatable` for resource list
   - `lightning-timeline` for events

3. **Implement polling with `@wire` and refresh**

4. **Test component**

#### Day 5: MarkdownRenderer

1. **Create LWC component**
   ```bash
   sfdx force:lightning:component:create -n markdownRenderer -d force-app/main/default/lwc
   ```

2. **Upload markdown parser as Static Resource**

3. **Implement markdown rendering with XSS protection**

4. **Test component**

### Week 6: Complex Components Part 2

#### Day 1-2: SideNavigation

1. **Create LWC component**
   ```bash
   sfdx force:lightning:component:create -n agentSideNav -d force-app/main/default/lwc
   ```

2. **Implement navigation with `lightning-vertical-navigation`**

3. **Add mobile collapse functionality**

4. **Implement state persistence**

5. **Test component** (see LWC-CONVERSION-EXAMPLE.md)

#### Day 3-4: ChatWindow

1. **Create LWC component**
   ```bash
   sfdx force:lightning:component:create -n agentChat -d force-app/main/default/lwc
   ```

2. **Implement message list with virtual scrolling**

3. **Integrate ChatInput component**

4. **Implement streaming with Platform Events**

5. **Add auto-scroll functionality**

6. **Test component**

#### Day 5: ResponseViewer

1. **Create LWC component**
   ```bash
   sfdx force:lightning:component:create -n responseViewer -d force-app/main/default/lwc
   ```

2. **Implement tab generation from parsed responses**

3. **Integrate all tab content components**

4. **Implement tab state persistence**

5. **Test component**


## Phase 3: Integration and State Management (Week 7-8)

### Week 7: Component Integration

#### Day 1-2: Main Container Component

1. **Create agentApp component**
   ```bash
   sfdx force:lightning:component:create -n agentApp -d force-app/main/default/lwc
   ```

2. **Wire all components together**
   - Add `c-agent-side-nav`
   - Add `c-main-content`
   - Implement agent selection logic

3. **Test integration**

#### Day 3-4: State Management

1. **Implement Lightning Message Service**
   - Create message channels for component communication
   - Implement publish/subscribe patterns
   - Handle state synchronization

2. **Implement storage service**
   - Use Platform Cache for session data
   - Use Custom Settings for preferences
   - Implement conversation history storage

#### Day 5: Error Handling

1. **Create error handling service**
   - Centralized error categorization
   - Error logging
   - User-friendly error messages

2. **Implement error boundary pattern**

3. **Test error scenarios**

### Week 8: Testing and Polish

#### Day 1-3: Comprehensive Testing

1. **Unit Tests**
   ```bash
   npm run test:unit
   ```
   - Test all LWC components
   - Ensure 80%+ coverage

2. **Apex Tests**
   ```bash
   sfdx force:apex:test:run -r human -c
   ```
   - Ensure 75%+ coverage
   - Test all controller methods

3. **Integration Tests**
   - Test component communication
   - Test data flow
   - Test error handling

#### Day 4-5: Performance and Accessibility

1. **Performance Testing**
   - Test with large datasets
   - Optimize rendering
   - Implement lazy loading

2. **Accessibility Testing**
   - Test with screen readers
   - Verify keyboard navigation
   - Check color contrast
   - Validate ARIA labels


## Phase 4: Deployment (Week 9-10)

### Week 9: Prepare for Deployment

#### Day 1-2: Create Lightning App Page

1. **Create Lightning App**
   
   Navigate to Setup → App Manager → New Lightning App
   
   - App Name: `Agent UI`
   - Developer Name: `Agent_UI`
   - Navigation Style: `Standard`

2. **Create Lightning App Page**
   
   Navigate to Setup → Lightning App Builder → New
   
   - Label: `Agent UI Home`
   - Template: `App Page`
   - Add `c-agent-app` component to page

3. **Configure page layout**
   - Set component properties
   - Configure visibility rules

#### Day 3-4: Security Configuration

1. **Create Permission Set**
   
   ```bash
   sfdx force:permset:create -n Agent_UI_User -d force-app/main/default/permissionsets
   ```
   
   Grant permissions:
   - Apex Class Access: `AgentController`
   - Custom Object Access: `Agent_Response__e`
   - Custom Metadata Access: `Agent_Configuration__mdt`
   - Custom Settings Access: `Agent_Settings__c`

2. **Assign Permission Set**
   ```bash
   sfdx force:user:permset:assign -n Agent_UI_User
   ```

3. **Configure Field-Level Security**
   - Review all custom fields
   - Set appropriate FLS for profiles

#### Day 5: Documentation

1. **Create user documentation**
   - How to use the Agent UI
   - Troubleshooting guide
   - FAQ

2. **Create admin documentation**
   - Configuration guide
   - Maintenance procedures
   - Monitoring and logging

### Week 10: Deployment and Validation

#### Day 1-2: Deploy to Sandbox

1. **Create deployment package**
   ```bash
   sfdx force:source:deploy -p force-app/main/default -u SandboxOrg
   ```

2. **Verify deployment**
   ```bash
   sfdx force:source:deploy:report
   ```

3. **Run all tests in sandbox**
   ```bash
   sfdx force:apex:test:run -l RunLocalTests -r human -u SandboxOrg
   ```

#### Day 3: User Acceptance Testing

1. **Create test scenarios**
   - Agent selection and switching
   - Message sending and receiving
   - Deployment monitoring
   - Error handling

2. **Conduct UAT with stakeholders**

3. **Document issues and feedback**

#### Day 4: Production Deployment

1. **Create change set or deployment package**
   ```bash
   sfdx force:source:deploy -p force-app/main/default -u ProductionOrg --checkonly
   ```

2. **Validate deployment (checkonly)**

3. **Deploy to production**
   ```bash
   sfdx force:source:deploy -p force-app/main/default -u ProductionOrg
   ```

4. **Run production tests**
   ```bash
   sfdx force:apex:test:run -l RunLocalTests -r human -u ProductionOrg
   ```

#### Day 5: Post-Deployment

1. **Smoke testing in production**
   - Test critical workflows
   - Verify integrations
   - Check performance

2. **Monitor for issues**
   - Check debug logs
   - Monitor Platform Event delivery
   - Check API callout logs

3. **Create runbook for operations team**


## Detailed Task Breakdown

### Component Migration Priority

**Priority 1 (Week 3): Foundation Components**
1. LoadingSpinner → `c-loading-spinner`
2. AgentStatusIndicator → `c-status-indicator`
3. ErrorMessage → `c-error-message`
4. Message → `c-chat-message`

**Priority 2 (Week 4): Interactive Components**
5. ChatInput → `c-chat-input`
6. TabBar → `c-tab-bar`
7. ArchitectureTab → `c-architecture-tab`
8. CostOptimizationTab → `c-cost-optimization-tab`
9. SummaryTab → `c-summary-tab`
10. ResourcesTab → `c-resources-tab`

**Priority 3 (Week 5): Complex Components**
11. TemplateTab → `c-template-viewer`
12. ProgressTab → `c-deployment-progress`
13. MarkdownRenderer → `c-markdown-renderer`

**Priority 4 (Week 6): Container Components**
14. SideNavigation → `c-agent-side-nav`
15. ChatWindow → `c-agent-chat`
16. ResponseViewer → `c-response-viewer`
17. MainContent → `c-main-content`
18. App → `c-agent-app`

### Testing Checklist

For each component:

- [ ] Create component files (html, js, css, meta.xml)
- [ ] Implement component logic
- [ ] Apply SLDS styling
- [ ] Write Jest tests
- [ ] Test in Salesforce org
- [ ] Verify accessibility
- [ ] Document any issues
- [ ] Code review
- [ ] Deploy to sandbox

## Troubleshooting Common Issues

### Issue 1: Named Credential Authentication Fails

**Symptoms:** HTTP 403 errors when calling AWS APIs

**Solution:**
1. Verify AWS credentials are correct
2. Check IAM permissions for Bedrock and CloudFormation
3. Verify Named Credential configuration
4. Test with Postman or curl first

### Issue 2: Platform Events Not Received

**Symptoms:** Streaming responses don't appear in UI

**Solution:**
1. Check Platform Event definition
2. Verify event is being published in Apex
3. Check subscription in LWC component
4. Use Event Monitoring to debug
5. Check Platform Event limits

### Issue 3: Component Not Rendering

**Symptoms:** Component appears blank or doesn't load

**Solution:**
1. Check browser console for errors
2. Verify component is exposed in metadata
3. Check parent component integration
4. Verify all child components exist
5. Check CSS for display issues

### Issue 4: Apex Test Coverage Below 75%

**Symptoms:** Deployment fails due to insufficient test coverage

**Solution:**
1. Review untested code paths
2. Add test methods for edge cases
3. Use `Test.startTest()` and `Test.stopTest()`
4. Mock HTTP callouts properly
5. Test both success and error scenarios


## Rollback Plan

### If Migration Fails

1. **Keep React app running** during migration
2. **Use feature flags** to control which users see LWC version
3. **Monitor error rates** and user feedback
4. **Have rollback procedure** ready

### Rollback Procedure

1. **Disable Lightning App**
   ```bash
   sfdx force:source:deploy -p force-app/main/default/applications/Agent_UI.app-meta.xml --checkonly
   ```

2. **Redirect users to React app**
   - Update app navigation
   - Communicate to users

3. **Investigate issues**
   - Review error logs
   - Gather user feedback
   - Identify root causes

4. **Fix and redeploy**
   - Address issues
   - Test thoroughly
   - Redeploy when ready

## Success Criteria

### Functional Requirements

- [ ] All agents accessible and functional
- [ ] Chat interface works correctly
- [ ] Streaming responses display properly
- [ ] Tabs display correct content
- [ ] CloudFormation templates render with syntax highlighting
- [ ] Deployment progress updates in real-time
- [ ] Error handling works correctly
- [ ] State persists across sessions

### Performance Requirements

- [ ] Initial load < 3 seconds
- [ ] Agent switch < 300ms
- [ ] Tab switch < 150ms
- [ ] Message send feedback < 100ms
- [ ] Streaming starts < 1 second

### Quality Requirements

- [ ] Apex test coverage ≥ 75%
- [ ] LWC test coverage ≥ 80%
- [ ] Zero critical security issues
- [ ] WCAG 2.1 AA compliant
- [ ] Works on Chrome, Firefox, Safari, Edge
- [ ] Works on desktop, tablet, mobile

### User Acceptance

- [ ] Positive feedback from 80%+ of test users
- [ ] No critical bugs reported
- [ ] Performance meets expectations
- [ ] UI is intuitive and easy to use

## Post-Migration Tasks

### Week 11: Monitoring and Optimization

1. **Set up monitoring**
   - Enable Event Monitoring
   - Set up debug logs
   - Configure alerts

2. **Gather metrics**
   - User adoption rate
   - Error rates
   - Performance metrics
   - API usage

3. **Optimize based on data**
   - Address performance bottlenecks
   - Fix reported issues
   - Improve user experience

### Week 12: Documentation and Training

1. **Update documentation**
   - User guide
   - Admin guide
   - Developer guide
   - API documentation

2. **Create training materials**
   - Video tutorials
   - Quick start guide
   - Best practices

3. **Conduct training sessions**
   - End user training
   - Admin training
   - Developer training

---

**Document Version**: 1.0  
**Last Updated**: January 2026  
**Estimated Duration**: 10-12 weeks  
**Team Size**: 2-3 developers + 1 Salesforce admin
