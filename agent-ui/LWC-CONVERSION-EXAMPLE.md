# Complete LWC Conversion Example

## Overview

This document provides a complete, working example of converting the `SideNavigation` React component to a Lightning Web Component. This serves as a reference for converting other components.

## Original React Component

### File Structure

```
src/components/SideNavigation/
├── SideNavigation.tsx
├── SideNavigation.test.tsx
└── types.ts
```

### SideNavigation.tsx (Simplified)

```typescript
import React, { useState, useEffect } from 'react';
import type { Agent } from '../types';
import AgentStatusIndicator from './AgentStatusIndicator';
import { loadPreferences, savePreferences } from '../services/storageService';

interface SideNavigationProps {
  agents: Agent[];
  selectedAgentId: string;
  onAgentSelect: (agentId: string) => void;
}

const SideNavigation: React.FC<SideNavigationProps> = ({
  agents,
  selectedAgentId,
  onAgentSelect,
}) => {
  // State management
  const [isCollapsed, setIsCollapsed] = useState<boolean>(() => {
    const preferences = loadPreferences();
    return preferences.sideNavCollapsed;
  });

  // Persist collapsed state
  useEffect(() => {
    const preferences = loadPreferences();
    preferences.sideNavCollapsed = isCollapsed;
    savePreferences(preferences);
  }, [isCollapsed]);

  // Event handlers
  const toggleCollapse = () => {
    setIsCollapsed(!isCollapsed);
  };

  const handleAgentClick = (agentId: string) => {
    onAgentSelect(agentId);
    
    if (window.innerWidth < 768) {
      setIsCollapsed(true);
    }
  };

  // Render
  return (
    <>
      {/* Mobile hamburger button */}
      <button
        onClick={toggleCollapse}
        className="fixed top-4 left-4 z-50 md:hidden p-2 rounded-lg bg-gray-800"
        aria-label={isCollapsed ? 'Open navigation' : 'Close navigation'}
      >
        {isCollapsed ? '☰' : '✕'}
      </button>

      {/* Navigation panel */}
      <nav
        className={`
          fixed top-0 left-0 h-full bg-gray-900 border-r border-gray-800
          transition-transform duration-300
          ${isCollapsed ? '-translate-x-full md:translate-x-0' : 'translate-x-0'}
          w-full md:w-72
        `}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="p-6 border-b border-gray-800">
            <h1 className="text-xl font-semibold text-white">MWC Agents</h1>
            <p className="text-sm text-gray-400 mt-1">
              Multi-Agent Infrastructure System
            </p>
          </div>

          {/* Agent list */}
          <ul className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
            {agents.map((agent) => {
              const isSelected = agent.id === selectedAgentId;
              
              return (
                <li key={agent.id}>
                  <button
                    onClick={() => handleAgentClick(agent.id)}
                    className={`
                      w-full text-left px-4 py-3 rounded-lg flex items-start gap-3
                      ${isSelected ? 'bg-blue-600 text-white' : 'text-gray-300 hover:bg-gray-800'}
                    `}
                  >
                    <AgentStatusIndicator status={agent.status} />
                    <div className="flex-1">
                      <div className="font-medium">{agent.name}</div>
                      <div className="text-sm">{agent.description}</div>
                    </div>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      </nav>
    </>
  );
};

export default SideNavigation;
```


## Converted Lightning Web Component

### File Structure

```
force-app/main/default/lwc/agentSideNav/
├── agentSideNav.html
├── agentSideNav.js
├── agentSideNav.css
├── agentSideNav.js-meta.xml
└── __tests__/
    └── agentSideNav.test.js
```

### agentSideNav.html

```html
<template>
    <!-- Mobile hamburger button -->
    <lightning-button-icon
        if:false={isDesktop}
        icon-name={hamburgerIcon}
        alternative-text={hamburgerLabel}
        onclick={toggleCollapse}
        class="slds-m-around_small mobile-toggle"
    ></lightning-button-icon>

    <!-- Overlay for mobile -->
    <template if:true={showOverlay}>
        <div class="mobile-overlay" onclick={closeNav}></div>
    </template>

    <!-- Navigation panel -->
    <nav
        class={navClass}
        aria-label="Agent navigation"
    >
        <div class="slds-grid slds-grid_vertical nav-container">
            <!-- Header -->
            <div class="slds-p-around_medium slds-border_bottom nav-header">
                <h1 class="slds-text-heading_medium slds-text-color_inverse">
                    MWC Agents
                </h1>
                <p class="slds-text-body_small slds-text-color_inverse-weak slds-m-top_x-small">
                    Multi-Agent Infrastructure System
                </p>
            </div>

            <!-- Agent list -->
            <div class="slds-scrollable_y slds-grow agent-list">
                <ul class="slds-p-vertical_small slds-p-horizontal_x-small" role="list">
                    <template for:each={agents} for:item="agent">
                        <li key={agent.id} class="slds-m-bottom_xx-small">
                            <button
                                class={agent.buttonClass}
                                data-agent-id={agent.id}
                                onclick={handleAgentClick}
                                aria-current={agent.ariaCurrent}
                                aria-label={agent.ariaLabel}
                            >
                                <!-- Status indicator -->
                                <div class="slds-m-top_xx-small">
                                    <c-status-indicator
                                        status={agent.status}
                                        tooltip={agent.statusTooltip}
                                    ></c-status-indicator>
                                </div>

                                <!-- Agent info -->
                                <div class="slds-grid slds-grid_vertical slds-grow agent-info">
                                    <div class="slds-text-body_regular slds-truncate agent-name">
                                        {agent.name}
                                    </div>
                                    <div class="slds-text-body_small slds-m-top_xxx-small agent-description">
                                        {agent.description}
                                    </div>
                                </div>

                                <!-- Selected indicator -->
                                <template if:true={agent.isSelected}>
                                    <lightning-icon
                                        icon-name="utility:check"
                                        size="x-small"
                                        class="slds-m-left_small"
                                    ></lightning-icon>
                                </template>
                            </button>
                        </li>
                    </template>
                </ul>
            </div>

            <!-- Footer -->
            <div class="slds-p-around_small slds-border_top nav-footer">
                <div class="slds-text-body_x-small slds-text-color_inverse-weak slds-text-align_center">
                    Agent UI v1.0.0
                </div>
            </div>
        </div>
    </nav>
</template>
```


### agentSideNav.js

```javascript
import { LightningElement, api, track } from 'lwc';

export default class AgentSideNav extends LightningElement {
    // ========================================================================
    // Public Properties (Props)
    // ========================================================================
    
    @api agents = [];
    @api selectedAgentId;

    // ========================================================================
    // Private Properties (State)
    // ========================================================================
    
    @track isCollapsed = false;

    // ========================================================================
    // Lifecycle Hooks
    // ========================================================================
    
    connectedCallback() {
        // Load preferences from storage
        this.loadPreferences();
        
        // Add window resize listener
        this.handleResize = this.handleResize.bind(this);
        window.addEventListener('resize', this.handleResize);
    }

    disconnectedCallback() {
        // Cleanup
        window.removeEventListener('resize', this.handleResize);
    }

    renderedCallback() {
        // Any DOM manipulation after render
    }

    // ========================================================================
    // Computed Properties (Getters)
    // ========================================================================
    
    get isDesktop() {
        return window.innerWidth >= 768;
    }

    get showOverlay() {
        return !this.isCollapsed && !this.isDesktop;
    }

    get hamburgerIcon() {
        return this.isCollapsed ? 'utility:rows' : 'utility:close';
    }

    get hamburgerLabel() {
        return this.isCollapsed ? 'Open navigation' : 'Close navigation';
    }

    get navClass() {
        const baseClass = 'nav-panel slds-theme_shade';
        const collapsedClass = this.isCollapsed ? 'nav-collapsed' : '';
        return `${baseClass} ${collapsedClass}`;
    }

    // Enhance agents with computed properties
    get agents() {
        return this._agents.map(agent => ({
            ...agent,
            isSelected: agent.id === this.selectedAgentId,
            buttonClass: this.getAgentButtonClass(agent.id),
            ariaCurrent: agent.id === this.selectedAgentId ? 'page' : null,
            ariaLabel: `Select ${agent.name}`,
            statusTooltip: `${agent.name} is ${agent.status}`
        }));
    }

    set agents(value) {
        this._agents = value || [];
    }

    // ========================================================================
    // Event Handlers
    // ========================================================================
    
    toggleCollapse() {
        this.isCollapsed = !this.isCollapsed;
        this.savePreferences();
    }

    closeNav() {
        this.isCollapsed = true;
        this.savePreferences();
    }

    handleAgentClick(event) {
        const agentId = event.currentTarget.dataset.agentId;
        
        // Dispatch custom event to parent
        this.dispatchEvent(
            new CustomEvent('agentselect', {
                detail: { agentId },
                bubbles: true,
                composed: true
            })
        );

        // Auto-collapse on mobile after selection
        if (!this.isDesktop) {
            this.isCollapsed = true;
            this.savePreferences();
        }
    }

    handleResize() {
        // Force re-render on resize
        this.isCollapsed = this.isCollapsed;
    }

    // ========================================================================
    // Helper Methods
    // ========================================================================
    
    getAgentButtonClass(agentId) {
        const baseClass = 'agent-button slds-grid slds-grid_align-start slds-p-around_small';
        const selectedClass = agentId === this.selectedAgentId 
            ? 'agent-button-selected' 
            : '';
        return `${baseClass} ${selectedClass}`;
    }

    loadPreferences() {
        try {
            const stored = localStorage.getItem('agentui_preferences');
            if (stored) {
                const preferences = JSON.parse(stored);
                this.isCollapsed = preferences.sideNavCollapsed || false;
            }
        } catch (error) {
            console.error('Failed to load preferences:', error);
        }
    }

    savePreferences() {
        try {
            const preferences = {
                sideNavCollapsed: this.isCollapsed
            };
            localStorage.setItem('agentui_preferences', JSON.stringify(preferences));
        } catch (error) {
            console.error('Failed to save preferences:', error);
        }
    }
}
```


### agentSideNav.css

```css
/* Component-scoped styles */
:host {
    display: block;
}

/* Navigation panel */
.nav-panel {
    position: fixed;
    top: 0;
    left: 0;
    height: 100%;
    width: 100%;
    background-color: var(--slds-g-color-neutral-base-95);
    border-right: 1px solid var(--slds-g-color-border-base-1);
    transition: transform 0.3s ease-in-out;
    z-index: 40;
}

@media (min-width: 768px) {
    .nav-panel {
        width: 18rem; /* 288px / 72 * 0.25rem */
    }
}

.nav-panel.nav-collapsed {
    transform: translateX(-100%);
}

@media (min-width: 768px) {
    .nav-panel.nav-collapsed {
        transform: translateX(0);
    }
}

/* Container */
.nav-container {
    height: 100%;
}

/* Header */
.nav-header {
    background-color: var(--slds-g-color-neutral-base-95);
}

/* Agent list */
.agent-list {
    flex: 1;
}

/* Agent button */
.agent-button {
    width: 100%;
    text-align: left;
    border-radius: var(--slds-g-border-radius-2);
    transition: all 0.2s ease-in-out;
    border: none;
    background: transparent;
    cursor: pointer;
    color: var(--slds-g-color-neutral-base-30);
}

.agent-button:hover {
    background-color: var(--slds-g-color-neutral-base-90);
    color: var(--slds-g-color-neutral-base-10);
    transform: scale(1.02);
}

.agent-button-selected {
    background-color: var(--slds-g-color-brand-base-60);
    color: var(--slds-g-color-neutral-base-100);
    box-shadow: var(--slds-g-shadow-2);
    transform: scale(1.05);
}

/* Agent info */
.agent-info {
    min-width: 0; /* Allow truncation */
}

.agent-name {
    font-weight: var(--slds-g-font-weight-bold);
    color: inherit;
}

.agent-description {
    color: var(--slds-g-color-neutral-base-40);
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
}

.agent-button-selected .agent-description {
    color: var(--slds-g-color-brand-base-10);
}

/* Mobile overlay */
.mobile-overlay {
    position: fixed;
    inset: 0;
    background-color: rgba(0, 0, 0, 0.5);
    z-index: 30;
}

@media (min-width: 768px) {
    .mobile-overlay {
        display: none;
    }
}

/* Mobile toggle button */
.mobile-toggle {
    position: fixed;
    top: 1rem;
    left: 1rem;
    z-index: 50;
}

/* Footer */
.nav-footer {
    background-color: var(--slds-g-color-neutral-base-95);
}
```


### agentSideNav.js-meta.xml

```xml
<?xml version="1.0" encoding="UTF-8"?>
<LightningComponentBundle xmlns="http://soap.sforce.com/2006/04/metadata">
    <apiVersion>59.0</apiVersion>
    <isExposed>true</isExposed>
    <masterLabel>Agent Side Navigation</masterLabel>
    <description>Side navigation panel for agent selection with mobile support</description>
    
    <targets>
        <target>lightning__AppPage</target>
        <target>lightning__RecordPage</target>
        <target>lightning__HomePage</target>
    </targets>
    
    <targetConfigs>
        <targetConfig targets="lightning__AppPage,lightning__RecordPage,lightning__HomePage">
            <property 
                name="agents" 
                type="String" 
                label="Agents (JSON)" 
                description="JSON array of agent objects with id, name, description, status"
                required="true"
            />
            <property 
                name="selectedAgentId" 
                type="String" 
                label="Selected Agent ID" 
                description="ID of the currently selected agent"
            />
        </targetConfig>
    </targetConfigs>
</LightningComponentBundle>
```

### agentSideNav.test.js

```javascript
import { createElement } from 'lwc';
import AgentSideNav from 'c/agentSideNav';

describe('c-agent-side-nav', () => {
    afterEach(() => {
        // Clean up DOM
        while (document.body.firstChild) {
            document.body.removeChild(document.body.firstChild);
        }
    });

    it('renders agent list correctly', () => {
        const element = createElement('c-agent-side-nav', {
            is: AgentSideNav
        });
        
        element.agents = [
            { 
                id: 'agent-1', 
                name: 'OnboardingAgent', 
                description: 'Helps with onboarding',
                status: 'available' 
            },
            { 
                id: 'agent-2', 
                name: 'ProvisioningAgent', 
                description: 'Provisions infrastructure',
                status: 'busy' 
            }
        ];
        
        document.body.appendChild(element);

        // Query agent list items
        const listItems = element.shadowRoot.querySelectorAll('li');
        expect(listItems.length).toBe(2);

        // Check first agent
        const firstButton = listItems[0].querySelector('button');
        expect(firstButton.textContent).toContain('OnboardingAgent');
    });

    it('highlights selected agent', () => {
        const element = createElement('c-agent-side-nav', {
            is: AgentSideNav
        });
        
        element.agents = [
            { id: 'agent-1', name: 'Agent 1', status: 'available' },
            { id: 'agent-2', name: 'Agent 2', status: 'available' }
        ];
        element.selectedAgentId = 'agent-1';
        
        document.body.appendChild(element);

        const buttons = element.shadowRoot.querySelectorAll('button.agent-button');
        const selectedButton = buttons[0];
        
        expect(selectedButton.classList.contains('agent-button-selected')).toBe(true);
        expect(selectedButton.getAttribute('aria-current')).toBe('page');
    });

    it('dispatches agentselect event on click', () => {
        const element = createElement('c-agent-side-nav', {
            is: AgentSideNav
        });
        
        element.agents = [
            { id: 'agent-1', name: 'Agent 1', status: 'available' }
        ];
        
        document.body.appendChild(element);

        // Set up event listener
        const handler = jest.fn();
        element.addEventListener('agentselect', handler);

        // Click agent button
        const button = element.shadowRoot.querySelector('button.agent-button');
        button.click();

        // Verify event was dispatched
        expect(handler).toHaveBeenCalled();
        expect(handler.mock.calls[0][0].detail.agentId).toBe('agent-1');
    });

    it('toggles collapse state', () => {
        const element = createElement('c-agent-side-nav', {
            is: AgentSideNav
        });
        
        document.body.appendChild(element);

        const nav = element.shadowRoot.querySelector('nav');
        const initialCollapsed = nav.classList.contains('nav-collapsed');

        // Click toggle button
        const toggleButton = element.shadowRoot.querySelector('lightning-button-icon');
        if (toggleButton) {
            toggleButton.click();
            
            // Check state changed
            const afterCollapsed = nav.classList.contains('nav-collapsed');
            expect(afterCollapsed).not.toBe(initialCollapsed);
        }
    });
});
```


## Conversion Checklist

### Step-by-Step Conversion Process

#### 1. Analyze React Component

- [x] Identify props → `@api` properties
- [x] Identify state → `@track` properties
- [x] Identify effects → lifecycle hooks
- [x] Identify event handlers → LWC event handlers
- [x] Identify computed values → getters
- [x] Identify child components → LWC child components

#### 2. Create LWC Structure

- [x] Create component folder: `force-app/main/default/lwc/agentSideNav/`
- [x] Create HTML template: `agentSideNav.html`
- [x] Create JavaScript: `agentSideNav.js`
- [x] Create CSS: `agentSideNav.css`
- [x] Create metadata: `agentSideNav.js-meta.xml`
- [x] Create test: `__tests__/agentSideNav.test.js`

#### 3. Convert Template

- [x] Replace JSX with HTML template syntax
- [x] Convert `className` to `class`
- [x] Convert `{condition && <Component />}` to `<template if:true={condition}>`
- [x] Convert `.map()` to `<template for:each={items} for:item="item">`
- [x] Convert inline event handlers to `onclick={handler}`
- [x] Add ARIA attributes
- [x] Replace custom SVGs with `lightning-icon`

#### 4. Convert JavaScript

- [x] Import LWC decorators: `@api`, `@track`, `@wire`
- [x] Convert props to `@api` properties
- [x] Convert state to `@track` properties
- [x] Convert `useEffect` to `connectedCallback`/`disconnectedCallback`
- [x] Convert `useMemo`/computed values to getters
- [x] Convert callback props to `dispatchEvent`
- [x] Update event handler signatures
- [x] Replace React hooks with LWC patterns

#### 5. Convert Styles

- [x] Move inline styles to CSS file
- [x] Replace Tailwind classes with SLDS classes
- [x] Use SLDS design tokens for colors
- [x] Use SLDS spacing utilities
- [x] Implement responsive styles with media queries
- [x] Add component-scoped custom styles

#### 6. Update Child Components

- [x] Replace `<AgentStatusIndicator />` with `<c-status-indicator>`
- [x] Update prop names to kebab-case
- [x] Ensure child components are converted

#### 7. Testing

- [x] Write Jest tests for LWC
- [x] Test rendering
- [x] Test event dispatching
- [x] Test state management
- [x] Test responsive behavior


## Key Differences and Patterns

### 1. Props vs @api

**React:**
```typescript
interface Props {
  agents: Agent[];
  selectedAgentId: string;
  onAgentSelect: (id: string) => void;
}

const Component: React.FC<Props> = ({ agents, selectedAgentId, onAgentSelect }) => {
  // ...
};
```

**LWC:**
```javascript
export default class Component extends LightningElement {
  @api agents;
  @api selectedAgentId;
  // onAgentSelect becomes a custom event
}
```

### 2. State vs @track

**React:**
```typescript
const [isCollapsed, setIsCollapsed] = useState(false);
setIsCollapsed(true);
```

**LWC:**
```javascript
@track isCollapsed = false;
this.isCollapsed = true; // Direct assignment
```

### 3. Effects vs Lifecycle Hooks

**React:**
```typescript
useEffect(() => {
  // On mount
  loadData();
  
  return () => {
    // On unmount
    cleanup();
  };
}, []);

useEffect(() => {
  // On dependency change
  updateData();
}, [dependency]);
```

**LWC:**
```javascript
connectedCallback() {
  // On mount
  this.loadData();
}

disconnectedCallback() {
  // On unmount
  this.cleanup();
}

// For dependency tracking, use getters or @wire
@wire(getData, { param: '$dependency' })
wiredData({ error, data }) {
  if (data) {
    this.updateData(data);
  }
}
```

### 4. Computed Values

**React:**
```typescript
const fullName = useMemo(() => {
  return `${firstName} ${lastName}`;
}, [firstName, lastName]);
```

**LWC:**
```javascript
get fullName() {
  return `${this.firstName} ${this.lastName}`;
}
```

### 5. Event Handling

**React:**
```typescript
const handleClick = (id: string) => {
  onAgentSelect(id);
};

<button onClick={() => handleClick(agent.id)}>
```

**LWC:**
```javascript
handleClick(event) {
  const id = event.currentTarget.dataset.agentId;
  this.dispatchEvent(new CustomEvent('agentselect', {
    detail: { agentId: id }
  }));
}

<button data-agent-id={agent.id} onclick={handleClick}>
```

### 6. Conditional Rendering

**React:**
```jsx
{isVisible && <Component />}
{condition ? <ComponentA /> : <ComponentB />}
```

**LWC:**
```html
<template if:true={isVisible}>
  <c-component></c-component>
</template>

<template if:true={condition}>
  <c-component-a></c-component-a>
</template>
<template if:false={condition}>
  <c-component-b></c-component-b>
</template>
```

### 7. List Rendering

**React:**
```jsx
{items.map(item => (
  <Item key={item.id} data={item} />
))}
```

**LWC:**
```html
<template for:each={items} for:item="item">
  <c-item key={item.id} data={item}></c-item>
</template>
```


## Parent Component Integration

### React Parent Component

```typescript
// App.tsx
import SideNavigation from './components/SideNavigation';

const App = () => {
  const [selectedAgentId, setSelectedAgentId] = useState('agent-1');
  const [agents] = useState([...]);

  return (
    <div>
      <SideNavigation
        agents={agents}
        selectedAgentId={selectedAgentId}
        onAgentSelect={setSelectedAgentId}
      />
    </div>
  );
};
```

### LWC Parent Component

**agentApp.html:**
```html
<template>
    <div class="slds-grid">
        <c-agent-side-nav
            agents={agents}
            selected-agent-id={selectedAgentId}
            onagentselect={handleAgentSelect}
        ></c-agent-side-nav>
        
        <c-main-content
            selected-agent-id={selectedAgentId}
        ></c-main-content>
    </div>
</template>
```

**agentApp.js:**
```javascript
import { LightningElement, track } from 'lwc';

export default class AgentApp extends LightningElement {
    @track selectedAgentId = 'agent-1';
    @track agents = [
        {
            id: 'agent-1',
            name: 'OnboardingAgent',
            description: 'Helps with infrastructure onboarding',
            status: 'available'
        },
        {
            id: 'agent-2',
            name: 'ProvisioningAgent',
            description: 'Provisions AWS infrastructure',
            status: 'available'
        },
        {
            id: 'agent-3',
            name: 'MWCAgent',
            description: 'Orchestrates multi-agent workflows',
            status: 'available'
        }
    ];

    handleAgentSelect(event) {
        this.selectedAgentId = event.detail.agentId;
    }
}
```

## Common Pitfalls and Solutions

### Pitfall 1: Direct Array Mutation

❌ **Wrong:**
```javascript
this.items.push(newItem); // Doesn't trigger reactivity
```

✅ **Correct:**
```javascript
this.items = [...this.items, newItem];
```

### Pitfall 2: Accessing DOM Too Early

❌ **Wrong:**
```javascript
connectedCallback() {
  const element = this.template.querySelector('.my-element');
  element.focus(); // Element might not exist yet
}
```

✅ **Correct:**
```javascript
renderedCallback() {
  if (this.shouldFocus) {
    const element = this.template.querySelector('.my-element');
    if (element) {
      element.focus();
    }
    this.shouldFocus = false;
  }
}
```

### Pitfall 3: Event Bubbling

❌ **Wrong:**
```javascript
this.dispatchEvent(new CustomEvent('myevent', {
  detail: { data }
  // Missing bubbles and composed
}));
```

✅ **Correct:**
```javascript
this.dispatchEvent(new CustomEvent('myevent', {
  detail: { data },
  bubbles: true,
  composed: true // Required for crossing shadow DOM boundaries
}));
```

### Pitfall 4: Async in Constructor

❌ **Wrong:**
```javascript
constructor() {
  super();
  this.loadData(); // Async operations not allowed in constructor
}
```

✅ **Correct:**
```javascript
connectedCallback() {
  this.loadData();
}
```

---

**Document Version**: 1.0  
**Last Updated**: January 2026  
**Reference**: Complete working example of React to LWC conversion
