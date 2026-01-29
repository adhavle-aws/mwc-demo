# ResponseViewer Component

## Overview

The ResponseViewer component displays agent responses in a tabbed interface with appropriate content rendering based on agent type and response sections. It integrates the TabBar component for navigation and dynamically renders different tab content components based on the section type.

## Features

- **Tabbed Interface**: Integrates TabBar component for tab navigation
- **Dynamic Content Rendering**: Renders appropriate tab content based on section type
- **Response Parsing**: Uses response parser utility to structure agent responses
- **Tab Generation**: Creates tabs based on agent type and detected sections
- **State Preservation**: Preserves active tab state across response updates
- **Empty State Handling**: Displays helpful message when no response is available
- **Accessibility**: Full ARIA support for screen readers

## Props

```typescript
interface ResponseViewerProps {
  response: ParsedResponse;      // Parsed agent response with sections and tabs
  agentType: AgentType;          // Type of agent ('onboarding' | 'provisioning' | 'orchestrator')
  onTabChange?: (tabId: string) => void;  // Optional callback when tab changes
}
```

## Usage

### Basic Usage

```tsx
import { ResponseViewer } from './components';
import { parseAgentResponse } from './utils/responseParser';

function MyComponent() {
  const rawResponse = "..."; // Agent response text
  const parsedResponse = parseAgentResponse(rawResponse, 'onboarding');

  return (
    <ResponseViewer
      response={parsedResponse}
      agentType="onboarding"
    />
  );
}
```

### With Tab Change Callback

```tsx
function MyComponent() {
  const [activeTab, setActiveTab] = useState('');

  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId);
    console.log('User switched to tab:', tabId);
  };

  return (
    <ResponseViewer
      response={parsedResponse}
      agentType="onboarding"
      onTabChange={handleTabChange}
    />
  );
}
```

### Different Agent Types

```tsx
// OnboardingAgent - shows Architecture, Cost, Template, Summary tabs
<ResponseViewer
  response={onboardingResponse}
  agentType="onboarding"
/>

// ProvisioningAgent - shows Progress, Resources, Summary tabs
<ResponseViewer
  response={provisioningResponse}
  agentType="provisioning"
/>

// MWCAgent (Orchestrator) - shows Summary, Architecture, Cost, Resources tabs
<ResponseViewer
  response={orchestratorResponse}
  agentType="orchestrator"
/>
```

## Tab Content Rendering

The ResponseViewer automatically selects the appropriate tab component based on section type:

| Section Type | Component | Description |
|-------------|-----------|-------------|
| `template` | TemplateTab | CloudFormation templates with syntax highlighting |
| `progress` | SummaryTab | Deployment progress (or ProgressTab with structured data) |
| `architecture` | ArchitectureTab | Architecture diagrams and descriptions |
| `cost` | CostOptimizationTab | Cost optimization recommendations |
| `resources` | ResourcesTab | Resource lists (or SummaryTab for text) |
| `summary` | SummaryTab | General summary content with markdown |

## State Management

### Active Tab Initialization

When a new response is loaded:
1. Checks if current active tab exists in new response
2. If yes, preserves the active tab
3. If no or no tab is active, selects the first tab

This ensures tab state persists when switching between agents and returning.

### Tab Change Handling

```typescript
const handleTabChange = (tabId: string) => {
  setActiveTabId(tabId);
  
  // Notify parent component
  if (onTabChange) {
    onTabChange(tabId);
  }
};
```

## Empty State

When no response is available (empty tabs array), displays:
- Document icon
- "No response content available" message
- Helpful hint to send a message

## Accessibility

- **ARIA Roles**: Uses `tabpanel` role for content area
- **ARIA Labels**: Links tab panels to tab buttons via `aria-labelledby`
- **Keyboard Navigation**: Full keyboard support via TabBar component
- **Screen Reader Support**: Announces tab changes and content updates

## Styling

Uses Tailwind CSS with the application's dark theme:
- Background: `#0a0e1a`
- Surface: `#151b2d`
- Borders: `#2d3548`
- Text: `#e4e7eb`
- Accent: `#3b82f6`

## Requirements Validation

This component validates the following requirements:

- **3.1**: Parses agent responses into logical sections
- **3.2**: Displays response sections in separate tabs
- **3.5**: Handles tab click events to display corresponding content
- **3.7**: Preserves tab state when switching between agents

## Related Components

- **TabBar**: Provides tab navigation UI
- **TemplateTab**: Displays CloudFormation templates
- **ProgressTab**: Shows deployment progress
- **ArchitectureTab**: Displays architecture content
- **CostOptimizationTab**: Shows cost recommendations
- **SummaryTab**: Renders markdown summary content
- **ResourcesTab**: Lists provisioned resources

## Examples

See `ResponseViewer.example.tsx` for complete working examples including:
- OnboardingAgent response with multiple tabs
- ProvisioningAgent response with progress
- Empty response handling
- Tab state persistence demonstration
