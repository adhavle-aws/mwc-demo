# TabBar Component

## Overview

The `TabBar` component provides a horizontal navigation interface for switching between different content sections. It supports both mouse and keyboard interaction, making it accessible and user-friendly.

## Features

- **Tab List Display**: Shows all available tabs in a horizontal layout
- **Active Tab Highlighting**: Visually distinguishes the currently selected tab
- **Click Handling**: Allows users to switch tabs by clicking
- **Keyboard Navigation**: Supports arrow keys for tab navigation
  - `ArrowLeft`: Move to previous tab (wraps to last tab)
  - `ArrowRight`: Move to next tab (wraps to first tab)
  - `Home`: Jump to first tab
  - `End`: Jump to last tab
- **Focus Management**: Properly manages focus for accessibility
- **Optional Icons**: Supports icons alongside tab labels
- **Responsive**: Horizontal scrolling for many tabs on small screens

## Props

```typescript
interface TabBarProps {
  tabs: Array<{
    id: string;        // Unique identifier for the tab
    label: string;     // Display text for the tab
    icon?: string;     // Optional icon (emoji or text)
  }>;
  activeTabId: string;                    // ID of the currently active tab
  onTabChange: (tabId: string) => void;   // Callback when tab selection changes
}
```

## Usage

### Basic Example

```tsx
import TabBar from './components/TabBar';

function MyComponent() {
  const [activeTab, setActiveTab] = useState('overview');

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'details', label: 'Details' },
    { id: 'settings', label: 'Settings' }
  ];

  return (
    <div>
      <TabBar
        tabs={tabs}
        activeTabId={activeTab}
        onTabChange={setActiveTab}
      />
      
      {/* Tab content */}
      <div>
        {activeTab === 'overview' && <OverviewContent />}
        {activeTab === 'details' && <DetailsContent />}
        {activeTab === 'settings' && <SettingsContent />}
      </div>
    </div>
  );
}
```

### With Icons

```tsx
const tabs = [
  { id: 'architecture', label: 'Architecture', icon: '🏗️' },
  { id: 'cost', label: 'Cost', icon: '💰' },
  { id: 'template', label: 'Template', icon: '📄' }
];

<TabBar
  tabs={tabs}
  activeTabId={activeTab}
  onTabChange={setActiveTab}
/>
```

### With Agent Response Sections

```tsx
import { ParsedResponse } from '../types';

function ResponseViewer({ response }: { response: ParsedResponse }) {
  const [activeTab, setActiveTab] = useState(response.tabs[0]?.id || '');

  return (
    <div>
      <TabBar
        tabs={response.tabs.map(tab => ({
          id: tab.id,
          label: tab.label,
          icon: tab.icon
        }))}
        activeTabId={activeTab}
        onTabChange={setActiveTab}
      />
      
      <div className="p-6">
        {response.tabs.find(tab => tab.id === activeTab)?.content}
      </div>
    </div>
  );
}
```

## Accessibility

The TabBar component follows WAI-ARIA best practices for tab interfaces:

- Uses proper ARIA roles (`tablist`, `tab`)
- Implements `aria-selected` for active tab indication
- Uses `aria-controls` to link tabs with their panels
- Manages `tabIndex` for keyboard navigation (0 for active, -1 for inactive)
- Supports keyboard navigation with arrow keys
- Provides focus indicators for keyboard users

## Keyboard Navigation

| Key | Action |
|-----|--------|
| `ArrowLeft` | Move to previous tab (wraps around) |
| `ArrowRight` | Move to next tab (wraps around) |
| `Home` | Jump to first tab |
| `End` | Jump to last tab |
| `Tab` | Move focus to tab content |

## Styling

The component uses Tailwind CSS with custom color tokens matching the design system:

- **Background**: `#0a0e1a` (dark theme)
- **Border**: `#2d3548` (subtle separation)
- **Active Tab**: `#3b82f6` (blue accent)
- **Inactive Tab**: `#9ca3af` (muted gray)
- **Hover State**: `#e4e7eb` (light text) with `#151b2d` (surface)

## Requirements

Validates the following requirements:
- **3.5**: Tab selection and display
- **3.6**: Active tab highlighting

## Related Components

- `ResponseViewer`: Uses TabBar to display parsed agent responses
- `TemplateTab`: Content component for template display
- `ProgressTab`: Content component for deployment progress

## Notes

- The component automatically handles focus management when tabs change via keyboard
- Horizontal scrolling is enabled for cases with many tabs on small screens
- Tab refs are managed internally for keyboard navigation
- The component is fully controlled - parent manages active tab state
