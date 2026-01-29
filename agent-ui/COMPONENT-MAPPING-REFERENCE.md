# Component Mapping Reference

## Quick Reference Guide for React to LWC Conversion

This document provides a quick reference for converting React components to Lightning Web Components.

## Component Mapping Table

| React Component | LWC Name | SLDS Base | Props → @api | State → @track | Events | Complexity |
|----------------|----------|-----------|--------------|----------------|--------|------------|
| SideNavigation | c-agent-side-nav | lightning-vertical-navigation | agents, selectedAgentId | isCollapsed | agentselect | Medium |
| ChatWindow | c-agent-chat | Custom | messages, agentId, isLoading | streamingContent | sendmessage | High |
| ChatInput | c-chat-input | lightning-textarea | value, disabled | inputValue | submit | Low |
| Message | c-chat-message | lightning-card | message | - | - | Low |
| ResponseViewer | c-response-viewer | lightning-tabset | response, agentType | activeTab | tabchange | Medium |
| TabBar | c-tab-bar | lightning-tabset | tabs, activeTab | - | tabselect | Low |
| TemplateTab | c-template-viewer | lightning-formatted-text | template, format | - | copy, download | High |
| ProgressTab | c-deployment-progress | lightning-progress-bar | stackName, status, resources | - | refresh | Medium |
| ArchitectureTab | c-architecture-tab | Custom | content | - | - | Low |
| CostOptimizationTab | c-cost-optimization-tab | Custom | content | - | - | Low |
| SummaryTab | c-summary-tab | lightning-formatted-rich-text | content | - | - | Low |
| ResourcesTab | c-resources-tab | lightning-datatable | resources | - | - | Low |
| AgentStatusIndicator | c-status-indicator | Custom | status, tooltip | - | - | Low |
| ErrorMessage | c-error-message | lightning-formatted-text | error | - | retry | Low |
| LoadingSpinner | c-loading-spinner | lightning-spinner | size | - | - | Low |
| MarkdownRenderer | c-markdown-renderer | lightning-formatted-rich-text | content | - | - | High |
| MainContent | c-main-content | Custom | selectedAgent | - | - | Medium |
| ErrorBoundary | c-error-boundary | Custom | - | hasError, error | - | Medium |


## Detailed Component Conversions

### 1. SideNavigation → c-agent-side-nav

**React Props:**
```typescript
interface SideNavigationProps {
  agents: Agent[];
  selectedAgentId: string;
  onAgentSelect: (agentId: string) => void;
}
```

**LWC Properties:**
```javascript
@api agents;
@api selectedAgentId;
// Event: agentselect with detail: { agentId }
```

**SLDS Components Used:**
- `lightning-vertical-navigation`
- `lightning-icon`

**Migration Notes:**
- Replace `onAgentSelect` callback with custom event
- Use SLDS navigation classes for styling
- Implement mobile collapse with `@track isCollapsed`

---

### 2. ChatWindow → c-agent-chat

**React Props:**
```typescript
interface ChatWindowProps {
  agentId: string;
  messages: Message[];
  onSendMessage: (content: string) => void;
  isLoading: boolean;
}
```

**LWC Properties:**
```javascript
@api agentId;
@api messages;
@api isLoading;
@track streamingContent = '';
// Event: sendmessage with detail: { content }
```

**SLDS Components Used:**
- Custom message list
- `c-chat-input` (child component)
- `lightning-spinner`

**Migration Notes:**
- Implement virtual scrolling for long message lists
- Use `renderedCallback()` for auto-scroll
- Handle streaming with Platform Events or polling

---

### 3. ChatInput → c-chat-input

**React Props:**
```typescript
interface ChatInputProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  disabled: boolean;
}
```

**LWC Properties:**
```javascript
@api value;
@api disabled;
@track inputValue = '';
// Event: submit with detail: { value }
```

**SLDS Components Used:**
- `lightning-textarea`
- `lightning-button`

**Migration Notes:**
- Use `onkeydown` for Enter key handling
- Implement character count with computed property
- Disable during loading with `disabled` attribute


---

### 4. ResponseViewer → c-response-viewer

**React Props:**
```typescript
interface ResponseViewerProps {
  response: ParsedResponse;
  agentType: 'onboarding' | 'provisioning' | 'orchestrator';
}
```

**LWC Properties:**
```javascript
@api response;
@api agentType;
@track activeTab = '';
@track tabs = [];
// Event: tabchange with detail: { tabId }
```

**SLDS Components Used:**
- `lightning-tabset`
- `lightning-tab`

**Migration Notes:**
- Parse response in `connectedCallback()`
- Generate tabs dynamically based on agent type
- Use `activeTabValue` for tab selection

---

### 5. TemplateTab → c-template-viewer

**React Props:**
```typescript
interface TemplateTabProps {
  template: string;
  format: 'yaml' | 'json';
}
```

**LWC Properties:**
```javascript
@api template;
@api format;
// Events: copy, download
```

**SLDS Components Used:**
- `lightning-formatted-text`
- `lightning-button-icon`
- Custom syntax highlighting

**Migration Notes:**
- Use Prism.js as static resource
- Implement copy with `navigator.clipboard`
- Download with Blob and URL.createObjectURL()

---

### 6. ProgressTab → c-deployment-progress

**React Props:**
```typescript
interface ProgressTabProps {
  stackName: string;
  status: string;
  resources: ResourceStatus[];
  events: StackEvent[];
  startTime: Date;
}
```

**LWC Properties:**
```javascript
@api stackName;
@api status;
@api resources;
@api events;
@api startTime;
// Event: refresh
```

**SLDS Components Used:**
- `lightning-progress-bar`
- `lightning-datatable`
- `lightning-timeline`

**Migration Notes:**
- Use `@wire` for polling CloudFormation status
- Calculate progress percentage in getter
- Format dates with `Intl.DateTimeFormat`


---

### 7. AgentStatusIndicator → c-status-indicator

**React Props:**
```typescript
interface AgentStatusIndicatorProps {
  status: 'available' | 'busy' | 'error';
  tooltip?: string;
}
```

**LWC Properties:**
```javascript
@api status;
@api tooltip;
```

**SLDS Components Used:**
- Custom dot with SLDS colors
- `lightning-helptext` for tooltip

**Migration Notes:**
- Use CSS for status colors
- Implement pulse animation with CSS
- Use `title` attribute for tooltip

---

## Event Communication Patterns

### Parent to Child (Props)

**React:**
```jsx
<ChildComponent value={parentValue} />
```

**LWC:**
```html
<c-child-component value={parentValue}></c-child-component>
```

### Child to Parent (Events)

**React:**
```jsx
<ChildComponent onChange={(val) => setParentValue(val)} />
```

**LWC Child:**
```javascript
this.dispatchEvent(new CustomEvent('change', {
  detail: { value: newValue }
}));
```

**LWC Parent:**
```html
<c-child-component onchange={handleChange}></c-child-component>
```

```javascript
handleChange(event) {
  const value = event.detail.value;
  this.parentValue = value;
}
```

### Sibling Communication

**React:** Use shared state or Context

**LWC:** Use Lightning Message Service

```javascript
// Publisher
import { publish, MessageContext } from 'lightning/messageService';
import AGENT_CHANNEL from '@salesforce/messageChannel/AgentChannel__c';

@wire(MessageContext)
messageContext;

publishMessage() {
  const message = { agentId: this.selectedAgentId };
  publish(this.messageContext, AGENT_CHANNEL, message);
}

// Subscriber
import { subscribe, MessageContext } from 'lightning/messageService';
import AGENT_CHANNEL from '@salesforce/messageChannel/AgentChannel__c';

@wire(MessageContext)
messageContext;

connectedCallback() {
  this.subscription = subscribe(
    this.messageContext,
    AGENT_CHANNEL,
    (message) => this.handleMessage(message)
  );
}
```


## State Management Patterns

### Local Component State

**React:**
```javascript
const [count, setCount] = useState(0);
const increment = () => setCount(count + 1);
```

**LWC:**
```javascript
@track count = 0;
increment() {
  this.count = this.count + 1;
}
```

### Computed Values

**React:**
```javascript
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

### Side Effects

**React:**
```javascript
useEffect(() => {
  fetchData();
}, [dependency]);
```

**LWC:**
```javascript
@wire(getData, { param: '$dependency' })
wiredData({ error, data }) {
  if (data) {
    this.processData(data);
  }
}
```

## Styling Patterns

### Inline Styles

**React:**
```jsx
<div style={{ color: 'red', fontSize: '16px' }}>
```

**LWC:**
```html
<div style="color: red; font-size: 16px;">
```

### CSS Classes

**React:**
```jsx
<div className={`base ${isActive ? 'active' : ''}`}>
```

**LWC:**
```html
<div class={computedClass}>
```

```javascript
get computedClass() {
  return `base ${this.isActive ? 'active' : ''}`;
}
```

### CSS Modules

**React:** CSS Modules or styled-components

**LWC:** Component-scoped CSS (automatic)

```css
/* componentName.css */
.container {
  /* Automatically scoped to component */
}
```


## Common Gotchas and Solutions

### 1. Array Mutations

**Problem:** Direct array mutations don't trigger reactivity in LWC

**React (works):**
```javascript
const newItems = [...items, newItem];
setItems(newItems);
```

**LWC (doesn't work):**
```javascript
this.items.push(newItem); // Won't trigger re-render
```

**LWC (works):**
```javascript
this.items = [...this.items, newItem];
```

### 2. Object Mutations

**Problem:** Direct object property changes don't trigger reactivity

**LWC (doesn't work):**
```javascript
this.user.name = 'New Name'; // Won't trigger re-render
```

**LWC (works):**
```javascript
this.user = { ...this.user, name: 'New Name' };
```

### 3. Async Operations

**React:**
```javascript
const fetchData = async () => {
  const data = await api.getData();
  setData(data);
};
```

**LWC:**
```javascript
async fetchData() {
  try {
    const data = await getData();
    this.data = data;
  } catch (error) {
    this.error = error;
  }
}
```

### 4. Conditional Rendering

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

### 5. List Rendering

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

## Performance Optimization

### React Patterns

- `useMemo` for expensive computations
- `useCallback` for function memoization
- `React.memo` for component memoization
- Code splitting with `React.lazy`

### LWC Equivalents

- Getters for computed values (automatically cached)
- `@wire` with cacheable Apex methods
- Lazy loading with dynamic imports
- Use `renderedCallback` sparingly

```javascript
// Lazy loading in LWC
async loadComponent() {
  const { default: HeavyComponent } = await import('c/heavyComponent');
  // Use component
}
```

---

**Document Version**: 1.0  
**Last Updated**: January 2026
