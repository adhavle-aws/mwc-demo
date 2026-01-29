# SideNavigation Component

## Overview

The `SideNavigation` component provides a persistent navigation panel for agent selection in the MWC Multi-Agent Infrastructure Provisioning System. It features a responsive design that adapts to mobile and desktop screens, with localStorage persistence for user preferences.

## Features

- **Agent List Display**: Shows all available agents with their names, descriptions, and status indicators
- **Visual Status Indicators**: Color-coded dots showing agent availability (green=available, yellow=busy, red=error)
- **Selected Agent Highlighting**: Clearly indicates the currently active agent with blue background and checkmark
- **Mobile Responsive**: Collapses into a hamburger menu on screens below 768px width
- **State Persistence**: Saves collapsed/expanded state to localStorage
- **Auto-collapse**: Automatically collapses on mobile after agent selection
- **Smooth Animations**: Transitions for collapse/expand and hover effects
- **Accessibility**: Full ARIA labels and keyboard navigation support

## Requirements

Validates the following requirements:
- **1.1**: Display side navigation panel on left side
- **1.2**: List all available agents
- **1.3**: Display selected agent's interface in main content
- **1.4**: Highlight currently selected agent
- **7.2**: Collapse into hamburger menu on mobile

## Props

```typescript
interface SideNavigationProps {
  agents: Agent[];           // Array of agent objects to display
  selectedAgentId: string;   // ID of the currently selected agent
  onAgentSelect: (agentId: string) => void;  // Callback when agent is selected
}
```

## Usage

```tsx
import { SideNavigation } from './components';
import { Agent } from './types';

const agents: Agent[] = [
  {
    id: 'onboarding-agent',
    name: 'OnboardingAgent',
    description: 'Designs AWS infrastructure',
    status: 'available',
    arn: 'arn:aws:bedrock:...',
    capabilities: ['architecture-design'],
  },
  // ... more agents
];

function App() {
  const [selectedAgentId, setSelectedAgentId] = useState('onboarding-agent');

  return (
    <div>
      <SideNavigation
        agents={agents}
        selectedAgentId={selectedAgentId}
        onAgentSelect={setSelectedAgentId}
      />
      <main className="md:ml-72">
        {/* Main content */}
      </main>
    </div>
  );
}
```

## Styling

The component uses Tailwind CSS with the following key classes:

- **Width**: 280px (72 in Tailwind units) on desktop, full width on mobile
- **Background**: Dark theme with `bg-gray-900`
- **Selected State**: Blue background (`bg-blue-600`) with white text
- **Hover State**: Gray background (`bg-gray-800`) on unselected items
- **Transitions**: 300ms for collapse/expand, 200ms for hover effects

## Responsive Behavior

### Desktop (≥768px)
- Side navigation always visible
- Fixed width of 280px
- Main content offset by navigation width

### Mobile (<768px)
- Navigation hidden by default
- Hamburger button in top-left corner
- Full-screen overlay when open
- Auto-collapse after agent selection
- Backdrop overlay for dismissal

## localStorage Integration

The component persists the collapsed state using the `storageService`:

```typescript
// Collapsed state is stored in user preferences
interface UserPreferences {
  sideNavCollapsed: boolean;
  // ... other preferences
}
```

The state is:
- Loaded on component mount
- Saved whenever the collapsed state changes
- Shared across browser sessions

## Accessibility

- **ARIA Labels**: All interactive elements have descriptive labels
- **ARIA Expanded**: Hamburger button indicates expanded state
- **ARIA Current**: Selected agent marked with `aria-current="page"`
- **Keyboard Navigation**: Full keyboard support for agent selection
- **Focus Management**: Visible focus indicators on all interactive elements
- **Screen Reader Support**: Semantic HTML with proper roles

## Component Structure

```
SideNavigation
├── Hamburger Button (mobile only)
├── Overlay (mobile only, when open)
└── Navigation Panel
    ├── Header
    │   ├── Title
    │   └── Subtitle
    ├── Agent List
    │   └── Agent Items
    │       ├── Status Indicator
    │       ├── Agent Info (name + description)
    │       └── Selected Checkmark
    └── Footer
        └── Version Info
```

## Integration with Other Components

The `SideNavigation` component integrates with:

- **AgentStatusIndicator**: Displays status dots for each agent
- **storageService**: Persists collapsed state
- **MainContent**: Parent component offsets content by navigation width

## Future Enhancements

Potential improvements for future iterations:

1. **Search/Filter**: Add search box to filter agents by name
2. **Grouping**: Group agents by category or capability
3. **Badges**: Show notification badges for agent activity
4. **Drag-to-Reorder**: Allow users to customize agent order
5. **Favorites**: Pin frequently used agents to the top
6. **Keyboard Shortcuts**: Quick agent switching with Ctrl+1/2/3

## Testing

The component should be tested for:

1. **Agent List Display**: All agents render correctly
2. **Selection Handling**: Clicking an agent triggers callback
3. **Highlighting**: Selected agent has correct styling
4. **Mobile Collapse**: Hamburger menu works on small screens
5. **State Persistence**: Collapsed state saves to localStorage
6. **Accessibility**: ARIA labels and keyboard navigation work

## Related Components

- `AgentStatusIndicator`: Status dot component used within agent items
- `ChatWindow`: Main content component that displays selected agent's chat
- `MainContent`: Parent component that manages layout

## Design Decisions

1. **Fixed Width**: 280px provides enough space for agent names and descriptions without being too wide
2. **Auto-collapse on Mobile**: Improves UX by automatically hiding navigation after selection
3. **Overlay Backdrop**: Provides clear visual separation and easy dismissal on mobile
4. **localStorage Persistence**: Remembers user preference across sessions
5. **Status Indicators**: Provides at-a-glance agent availability information
