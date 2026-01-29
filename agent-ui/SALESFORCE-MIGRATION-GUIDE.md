# Salesforce Migration Guide

## Overview

This guide provides comprehensive documentation for migrating the Agent UI React application to Salesforce Lightning Web Components (LWC). The application was designed with Salesforce compatibility in mind, using web standards and component patterns that align with LWC architecture.

## Table of Contents

1. [Component-to-LWC Mapping](#component-to-lwc-mapping)
2. [Style Guide with SLDS Equivalents](#style-guide-with-slds-equivalents)
3. [API Service Abstraction](#api-service-abstraction)
4. [Migration Steps](#migration-steps)
5. [Example LWC Conversion](#example-lwc-conversion)
6. [Testing Strategy](#testing-strategy)
7. [Deployment Considerations](#deployment-considerations)

## Component-to-LWC Mapping

### Core Components

| React Component | LWC Component Name | Base SLDS Component | Complexity | Notes |
|----------------|-------------------|---------------------|------------|-------|
| `SideNavigation` | `c-agent-side-nav` | `lightning-vertical-navigation` | Medium | Use SLDS navigation patterns |
| `ChatWindow` | `c-agent-chat` | Custom | High | Requires custom message list implementation |
| `ChatInput` | `c-chat-input` | `lightning-textarea` | Low | Direct mapping to SLDS textarea |
| `Message` | `c-chat-message` | `lightning-card` | Low | Use SLDS card for message bubbles |
| `ResponseViewer` | `c-response-viewer` | `lightning-tabset` | Medium | Direct mapping to SLDS tabs |
| `TabBar` | `c-tab-bar` | `lightning-tabset` | Low | Use SLDS tab component |
| `TemplateTab` | `c-template-viewer` | `lightning-formatted-text` | High | Requires Prism.js integration |
| `ProgressTab` | `c-deployment-progress` | `lightning-progress-bar` + `lightning-datatable` | Medium | Combine multiple SLDS components |
| `AgentStatusIndicator` | `c-status-indicator` | Custom | Low | Simple status dot with SLDS colors |
| `ErrorMessage` | `c-error-message` | `lightning-formatted-text` | Low | Use SLDS messaging patterns |
| `LoadingSpinner` | `c-loading-spinner` | `lightning-spinner` | Low | Direct mapping |
| `MarkdownRenderer` | `c-markdown-renderer` | `lightning-formatted-rich-text` | High | May need custom parser |


### Component Hierarchy in Salesforce

```
c-agent-app (Main Container)
├── c-agent-side-nav
│   ├── lightning-vertical-navigation
│   └── c-status-indicator (x3)
├── c-main-content
│   ├── c-agent-chat
│   │   ├── c-chat-message (multiple)
│   │   └── c-chat-input
│   │       └── lightning-textarea
│   └── c-response-viewer
│       ├── lightning-tabset
│       └── Tab Content Components
│           ├── c-architecture-tab
│           ├── c-cost-optimization-tab
│           ├── c-template-viewer
│           │   └── lightning-formatted-text
│           ├── c-deployment-progress
│           │   ├── lightning-progress-bar
│           │   ├── lightning-datatable
│           │   └── lightning-timeline
│           └── c-summary-tab
│               └── c-markdown-renderer
└── c-error-boundary
```

## Style Guide with SLDS Equivalents

### Color Palette Mapping

| React/Tailwind Class | SLDS Token | SLDS Class | Usage |
|---------------------|------------|------------|-------|
| `bg-gray-900` | `--slds-g-color-neutral-base-95` | `slds-theme_shade` | Primary background |
| `bg-gray-800` | `--slds-g-color-neutral-base-90` | `slds-box` | Surface background |
| `bg-blue-600` | `--slds-g-color-brand-base-60` | `slds-theme_default` | Primary accent |
| `text-gray-300` | `--slds-g-color-neutral-base-30` | `slds-text-color_default` | Primary text |
| `text-gray-400` | `--slds-g-color-neutral-base-40` | `slds-text-color_weak` | Secondary text |
| `border-gray-800` | `--slds-g-color-border-base-1` | `slds-border_top` | Borders |
| `text-green-500` | `--slds-g-color-success-base-50` | `slds-text-color_success` | Success state |
| `text-yellow-500` | `--slds-g-color-warning-base-50` | `slds-text-color_warning` | Warning state |
| `text-red-500` | `--slds-g-color-error-base-50` | `slds-text-color_error` | Error state |


### Typography Mapping

| React/Tailwind | SLDS Class | SLDS Token | Usage |
|---------------|------------|------------|-------|
| `text-xl font-semibold` | `slds-text-heading_medium` | `--slds-g-font-size-7` | Section headers |
| `text-lg font-medium` | `slds-text-heading_small` | `--slds-g-font-size-6` | Subsection headers |
| `text-base` | `slds-text-body_regular` | `--slds-g-font-size-5` | Body text |
| `text-sm` | `slds-text-body_small` | `--slds-g-font-size-4` | Small text |
| `text-xs` | `slds-text-body_x-small` | `--slds-g-font-size-3` | Extra small text |
| `font-mono` | `slds-text-font_monospace` | `--slds-g-font-family-monospace` | Code blocks |

### Spacing System Mapping

| React/Tailwind | SLDS Class | SLDS Token | Value |
|---------------|------------|------------|-------|
| `p-2` | `slds-p-around_x-small` | `--slds-g-spacing-2` | 0.5rem |
| `p-4` | `slds-p-around_small` | `--slds-g-spacing-4` | 1rem |
| `p-6` | `slds-p-around_medium` | `--slds-g-spacing-6` | 1.5rem |
| `p-8` | `slds-p-around_large` | `--slds-g-spacing-8` | 2rem |
| `gap-3` | `slds-grid_vertical-stretch slds-gutters_small` | `--slds-g-spacing-3` | 0.75rem |
| `space-y-4` | `slds-grid_vertical slds-gutters` | `--slds-g-spacing-4` | 1rem |

### Component-Specific Styles

#### Button Styles

```css
/* React/Tailwind */
.button-primary {
  @apply bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg;
}

/* SLDS Equivalent */
<button class="slds-button slds-button_brand">
```

#### Card Styles

```css
/* React/Tailwind */
.card {
  @apply bg-gray-800 rounded-lg shadow-lg p-6 border border-gray-700;
}

/* SLDS Equivalent */
<div class="slds-card">
  <div class="slds-card__body slds-card__body_inner">
```


#### Input Styles

```css
/* React/Tailwind */
.input {
  @apply bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 text-white;
}

/* SLDS Equivalent */
<lightning-input class="slds-input">
```

## API Service Abstraction

### Service Interface Pattern

The application uses a service layer pattern that abstracts API calls, making it easy to swap implementations for Salesforce.

#### Current Architecture (React)

```typescript
// agentService.ts
export async function* invokeAgent(request: AgentInvocationRequest) {
  const response = await fetch(`${API_BASE_URL}/agents/invoke`, {
    method: 'POST',
    body: JSON.stringify(request)
  });
  // ... streaming logic
}
```

#### Salesforce Architecture (LWC + Apex)

```javascript
// agentService.js (LWC)
import invokeAgentApex from '@salesforce/apex/AgentController.invokeAgent';

export async function* invokeAgent(request) {
  const result = await invokeAgentApex({ 
    agentId: request.agentId,
    prompt: request.prompt 
  });
  // ... process result
}
```


### Service Layer Interface

Create a common interface that both React and Salesforce implementations follow:

```typescript
// IAgentService.ts (Interface)
export interface IAgentService {
  invokeAgent(request: AgentInvocationRequest): AsyncGenerator<string>;
  checkAgentStatus(agentId: string): Promise<AgentStatusResponse>;
  checkAllAgentsStatus(): Promise<Record<string, AgentStatus>>;
  getStackStatus(stackName: string): Promise<StackStatusResponse>;
}
```

### Apex Controller for Salesforce

```apex
// AgentController.cls
public with sharing class AgentController {
    
    @AuraEnabled
    public static String invokeAgent(String agentId, String prompt) {
        // Call AWS Bedrock AgentCore via Named Credentials
        HttpRequest req = new HttpRequest();
        req.setEndpoint('callout:AWS_Bedrock_AgentCore/agents/invoke');
        req.setMethod('POST');
        req.setHeader('Content-Type', 'application/json');
        
        Map<String, Object> body = new Map<String, Object>{
            'agentId' => agentId,
            'prompt' => prompt
        };
        req.setBody(JSON.serialize(body));
        
        Http http = new Http();
        HttpResponse res = http.send(req);
        
        if (res.getStatusCode() == 200) {
            return res.getBody();
        } else {
            throw new AuraHandledException('Agent invocation failed: ' + res.getStatus());
        }
    }
    
    @AuraEnabled(cacheable=true)
    public static Map<String, Object> checkAgentStatus(String agentId) {
        // Implementation for checking agent status
        HttpRequest req = new HttpRequest();
        req.setEndpoint('callout:AWS_Bedrock_AgentCore/agents/status?agentId=' + agentId);
        req.setMethod('GET');
        
        Http http = new Http();
        HttpResponse res = http.send(req);
        
        if (res.getStatusCode() == 200) {
            return (Map<String, Object>) JSON.deserializeUntyped(res.getBody());
        } else {
            throw new AuraHandledException('Status check failed: ' + res.getStatus());
        }
    }
    
    @AuraEnabled(cacheable=true)
    public static Map<String, Object> getStackStatus(String stackName) {
        // Implementation for CloudFormation stack status
        HttpRequest req = new HttpRequest();
        req.setEndpoint('callout:AWS_CloudFormation/stacks/status?stackName=' + stackName);
        req.setMethod('GET');
        
        Http http = new Http();
        HttpResponse res = http.send(req);
        
        if (res.getStatusCode() == 200) {
            return (Map<String, Object>) JSON.deserializeUntyped(res.getBody());
        } else {
            throw new AuraHandledException('Stack status check failed: ' + res.getStatus());
        }
    }
}
```


### Named Credentials Configuration

Configure Named Credentials in Salesforce for AWS API access:

1. **AWS_Bedrock_AgentCore**
   - URL: `https://bedrock-agent-runtime.us-east-1.amazonaws.com`
   - Identity Type: AWS Signature Version 4
   - AWS Region: us-east-1
   - AWS Service: bedrock

2. **AWS_CloudFormation**
   - URL: `https://cloudformation.us-east-1.amazonaws.com`
   - Identity Type: AWS Signature Version 4
   - AWS Region: us-east-1
   - AWS Service: cloudformation

## Migration Steps

### Phase 1: Preparation (Week 1-2)

1. **Audit Current Components**
   - Review all React components
   - Identify third-party dependencies
   - Document component props and state
   - Map components to SLDS equivalents

2. **Set Up Salesforce Environment**
   - Create Salesforce Developer Org or Sandbox
   - Install Salesforce CLI
   - Set up VS Code with Salesforce Extensions
   - Configure Named Credentials for AWS

3. **Create Component Stubs**
   - Create empty LWC components for each React component
   - Define component metadata files
   - Set up component folder structure


### Phase 2: Core Component Migration (Week 3-6)

1. **Convert Simple Components First**
   - Start with `LoadingSpinner`, `AgentStatusIndicator`
   - Convert to LWC with SLDS styling
   - Test in Salesforce org

2. **Convert Medium Complexity Components**
   - `Message`, `ChatInput`, `TabBar`
   - Implement event handling with LWC patterns
   - Use `@api` decorators for props
   - Use `@track` for reactive state

3. **Convert Complex Components**
   - `ChatWindow`, `ResponseViewer`, `SideNavigation`
   - Implement parent-child communication
   - Handle state management with LWC patterns
   - Integrate with Apex controllers

4. **Implement Apex Controllers**
   - Create `AgentController.cls`
   - Implement all service methods
   - Add error handling
   - Write Apex tests (minimum 75% coverage)

### Phase 3: Integration & Testing (Week 7-8)

1. **Wire Components Together**
   - Create main container component
   - Implement component communication
   - Test data flow between components

2. **Implement State Management**
   - Use Lightning Message Service for cross-component communication
   - Implement local storage using Platform Cache or Custom Settings
   - Handle session state

3. **Testing**
   - Write Jest tests for LWC components
   - Write Apex tests for controllers
   - Perform manual testing
   - Test on different devices and browsers


### Phase 4: Deployment (Week 9-10)

1. **Create Lightning App**
   - Create Lightning App Page
   - Add components to page
   - Configure page layout

2. **Security Configuration**
   - Set up user permissions
   - Configure field-level security
   - Set up sharing rules

3. **Deploy to Production**
   - Create change set or use SFDX
   - Deploy to production org
   - Perform smoke tests

## Example LWC Conversion

### React Component: SideNavigation

**Original React Component** (`SideNavigation.tsx`):

```typescript
import React, { useState, useEffect } from 'react';
import type { SideNavigationProps } from '../types';
import AgentStatusIndicator from './AgentStatusIndicator';

const SideNavigation: React.FC<SideNavigationProps> = ({
  agents,
  selectedAgentId,
  onAgentSelect,
}) => {
  const [isCollapsed, setIsCollapsed] = useState<boolean>(false);

  const handleAgentClick = (agentId: string) => {
    onAgentSelect(agentId);
  };

  return (
    <nav className="bg-gray-900 border-r border-gray-800">
      <div className="p-6 border-b border-gray-800">
        <h1 className="text-xl font-semibold text-white">MWC Agents</h1>
      </div>
      <ul className="space-y-1 px-3">
        {agents.map((agent) => (
          <li key={agent.id}>
            <button
              onClick={() => handleAgentClick(agent.id)}
              className={selectedAgentId === agent.id ? 'bg-blue-600' : 'hover:bg-gray-800'}
            >
              <AgentStatusIndicator status={agent.status} />
              <div>{agent.name}</div>
            </button>
          </li>
        ))}
      </ul>
    </nav>
  );
};

export default SideNavigation;
```


### Converted LWC Component

**LWC HTML Template** (`agentSideNav.html`):

```html
<template>
    <nav class="slds-nav-vertical slds-theme_shade">
        <!-- Header -->
        <div class="slds-p-around_medium slds-border_bottom">
            <h1 class="slds-text-heading_medium slds-text-color_inverse">
                MWC Agents
            </h1>
            <p class="slds-text-body_small slds-text-color_inverse-weak slds-m-top_x-small">
                Multi-Agent Infrastructure System
            </p>
        </div>

        <!-- Agent List -->
        <div class="slds-nav-vertical__section">
            <ul>
                <template for:each={agents} for:item="agent">
                    <li key={agent.id} class="slds-nav-vertical__item">
                        <a
                            href="javascript:void(0);"
                            class={getNavItemClass}
                            data-agent-id={agent.id}
                            onclick={handleAgentClick}
                            aria-current={getAriaCurrent}
                        >
                            <!-- Status Indicator -->
                            <c-status-indicator
                                status={agent.status}
                                tooltip={agent.statusTooltip}
                            ></c-status-indicator>

                            <!-- Agent Info -->
                            <div class="slds-m-left_small">
                                <div class="slds-text-body_regular slds-text-color_inverse">
                                    {agent.name}
                                </div>
                                <div class="slds-text-body_small slds-text-color_inverse-weak">
                                    {agent.description}
                                </div>
                            </div>

                            <!-- Selected Indicator -->
                            <template if:true={agent.isSelected}>
                                <lightning-icon
                                    icon-name="utility:check"
                                    size="x-small"
                                    class="slds-m-left_auto"
                                ></lightning-icon>
                            </template>
                        </a>
                    </li>
                </template>
            </ul>
        </div>
    </nav>
</template>
```


**LWC JavaScript** (`agentSideNav.js`):

```javascript
import { LightningElement, api, track } from 'lwc';

export default class AgentSideNav extends LightningElement {
    // Public properties (equivalent to React props)
    @api agents = [];
    @api selectedAgentId;

    // Computed property for nav item class
    getNavItemClass(agentId) {
        const baseClass = 'slds-nav-vertical__action';
        return agentId === this.selectedAgentId
            ? `${baseClass} slds-is-active`
            : baseClass;
    }

    // Computed property for aria-current
    getAriaCurrent(agentId) {
        return agentId === this.selectedAgentId ? 'page' : null;
    }

    // Event handler
    handleAgentClick(event) {
        const agentId = event.currentTarget.dataset.agentId;
        
        // Dispatch custom event (equivalent to calling onAgentSelect prop)
        this.dispatchEvent(
            new CustomEvent('agentselect', {
                detail: { agentId },
                bubbles: true,
                composed: true
            })
        );
    }

    // Lifecycle hook (equivalent to useEffect)
    connectedCallback() {
        // Component initialization logic
        this.loadPreferences();
    }

    disconnectedCallback() {
        // Cleanup logic
    }

    // Helper method
    loadPreferences() {
        // Load from Platform Cache or Custom Settings
    }
}
```


**LWC Metadata** (`agentSideNav.js-meta.xml`):

```xml
<?xml version="1.0" encoding="UTF-8"?>
<LightningComponentBundle xmlns="http://soap.sforce.com/2006/04/metadata">
    <apiVersion>59.0</apiVersion>
    <isExposed>true</isExposed>
    <targets>
        <target>lightning__AppPage</target>
        <target>lightning__RecordPage</target>
        <target>lightning__HomePage</target>
    </targets>
    <targetConfigs>
        <targetConfig targets="lightning__AppPage">
            <property name="agents" type="String" label="Agents JSON" 
                      description="JSON array of agent objects" />
            <property name="selectedAgentId" type="String" label="Selected Agent ID" 
                      description="ID of currently selected agent" />
        </targetConfig>
    </targetConfigs>
</LightningComponentBundle>
```

**LWC CSS** (`agentSideNav.css`):

```css
/* Custom styles that complement SLDS */
:host {
    display: block;
    height: 100%;
}

.slds-nav-vertical {
    height: 100%;
    display: flex;
    flex-direction: column;
}

.slds-nav-vertical__section {
    flex: 1;
    overflow-y: auto;
}

/* Custom hover effects */
.slds-nav-vertical__action:hover {
    background-color: var(--slds-g-color-neutral-base-90);
}

.slds-nav-vertical__action.slds-is-active {
    background-color: var(--slds-g-color-brand-base-60);
    color: var(--slds-g-color-neutral-base-100);
}
```


### Key Conversion Patterns

#### 1. Props to @api Properties

```javascript
// React
interface Props {
  agents: Agent[];
  selectedAgentId: string;
  onAgentSelect: (id: string) => void;
}

// LWC
export default class MyComponent extends LightningElement {
  @api agents;
  @api selectedAgentId;
  // Events replace callback props
}
```

#### 2. State to @track Properties

```javascript
// React
const [isCollapsed, setIsCollapsed] = useState(false);

// LWC
@track isCollapsed = false;
// Update directly: this.isCollapsed = true;
```

#### 3. useEffect to Lifecycle Hooks

```javascript
// React
useEffect(() => {
  // Component mounted
  return () => {
    // Component unmounted
  };
}, []);

// LWC
connectedCallback() {
  // Component mounted
}

disconnectedCallback() {
  // Component unmounted
}
```

#### 4. Event Handlers

```javascript
// React
const handleClick = (id: string) => {
  onAgentSelect(id);
};

// LWC
handleClick(event) {
  const id = event.currentTarget.dataset.id;
  this.dispatchEvent(new CustomEvent('agentselect', {
    detail: { id }
  }));
}
```


## Testing Strategy

### LWC Component Testing

Use Jest for LWC component testing:

```javascript
// agentSideNav.test.js
import { createElement } from 'lwc';
import AgentSideNav from 'c/agentSideNav';

describe('c-agent-side-nav', () => {
    afterEach(() => {
        while (document.body.firstChild) {
            document.body.removeChild(document.body.firstChild);
        }
    });

    it('renders agent list', () => {
        const element = createElement('c-agent-side-nav', {
            is: AgentSideNav
        });
        
        element.agents = [
            { id: '1', name: 'Agent 1', status: 'available' },
            { id: '2', name: 'Agent 2', status: 'busy' }
        ];
        
        document.body.appendChild(element);

        const items = element.shadowRoot.querySelectorAll('.slds-nav-vertical__item');
        expect(items.length).toBe(2);
    });

    it('dispatches agentselect event on click', () => {
        const element = createElement('c-agent-side-nav', {
            is: AgentSideNav
        });
        
        element.agents = [
            { id: '1', name: 'Agent 1', status: 'available' }
        ];
        
        document.body.appendChild(element);

        const handler = jest.fn();
        element.addEventListener('agentselect', handler);

        const link = element.shadowRoot.querySelector('a');
        link.click();

        expect(handler).toHaveBeenCalled();
        expect(handler.mock.calls[0][0].detail.agentId).toBe('1');
    });
});
```


### Apex Testing

```apex
// AgentControllerTest.cls
@isTest
private class AgentControllerTest {
    
    @isTest
    static void testInvokeAgent() {
        // Set up mock response
        Test.setMock(HttpCalloutMock.class, new AgentCalloutMock());
        
        // Test
        Test.startTest();
        String result = AgentController.invokeAgent('agent-1', 'test prompt');
        Test.stopTest();
        
        // Assert
        System.assertNotEquals(null, result);
        System.assert(result.contains('response'));
    }
    
    @isTest
    static void testCheckAgentStatus() {
        Test.setMock(HttpCalloutMock.class, new AgentStatusMock());
        
        Test.startTest();
        Map<String, Object> status = AgentController.checkAgentStatus('agent-1');
        Test.stopTest();
        
        System.assertEquals('available', status.get('status'));
    }
    
    // Mock class for HTTP callouts
    private class AgentCalloutMock implements HttpCalloutMock {
        public HttpResponse respond(HttpRequest req) {
            HttpResponse res = new HttpResponse();
            res.setHeader('Content-Type', 'application/json');
            res.setBody('{"response": "test response"}');
            res.setStatusCode(200);
            return res;
        }
    }
}
```

## Deployment Considerations

### Salesforce Limits

Be aware of Salesforce governor limits:

- **Heap Size**: 6 MB (synchronous), 12 MB (asynchronous)
- **CPU Time**: 10,000 ms (synchronous), 60,000 ms (asynchronous)
- **Callout Limits**: 100 callouts per transaction
- **Callout Timeout**: 120 seconds maximum

### Performance Optimization

1. **Lazy Loading**: Use dynamic imports for heavy components
2. **Caching**: Use `@AuraEnabled(cacheable=true)` for read-only data
3. **Batch Processing**: Use Platform Events for long-running operations
4. **CDN**: Use Salesforce CDN for static resources


### Security Considerations

1. **Field-Level Security**: Ensure proper FLS for all custom objects
2. **Sharing Rules**: Configure appropriate sharing rules
3. **CRUD Permissions**: Check CRUD before DML operations
4. **Input Sanitization**: Use `String.escapeSingleQuotes()` for user input
5. **SOQL Injection Prevention**: Use bind variables in SOQL queries

### Deployment Checklist

- [ ] All LWC components created and tested
- [ ] Apex controllers implemented with 75%+ test coverage
- [ ] Named Credentials configured for AWS
- [ ] Custom Settings/Objects created
- [ ] Permission Sets created and assigned
- [ ] Lightning App Page created
- [ ] Security review completed
- [ ] Performance testing completed
- [ ] User acceptance testing completed
- [ ] Documentation updated
- [ ] Training materials prepared

## Additional Resources

### Salesforce Documentation

- [Lightning Web Components Developer Guide](https://developer.salesforce.com/docs/component-library/documentation/en/lwc)
- [Salesforce Lightning Design System](https://www.lightningdesignsystem.com/)
- [Apex Developer Guide](https://developer.salesforce.com/docs/atlas.en-us.apexcode.meta/apexcode/)
- [Named Credentials](https://help.salesforce.com/s/articleView?id=sf.named_credentials_about.htm)

### Migration Tools

- [Salesforce CLI](https://developer.salesforce.com/tools/sfdxcli)
- [VS Code Salesforce Extensions](https://marketplace.visualstudio.com/items?itemName=salesforce.salesforcedx-vscode)
- [LWC Jest Testing](https://github.com/salesforce/sfdx-lwc-jest)

### Support

For questions or issues during migration:
- Salesforce Developer Forums
- Salesforce Stack Exchange
- Internal team documentation

---

**Document Version**: 1.0  
**Last Updated**: January 2026  
**Maintained By**: Agent UI Development Team
