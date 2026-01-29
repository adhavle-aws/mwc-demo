# AgentStatusIndicator Component

## Overview

The `AgentStatusIndicator` component displays a visual status indicator for AI agents with color-coded dots and hover tooltips.

## Features

- ✅ **Color-coded status dots**
  - 🟢 Green for `available` status
  - 🟡 Yellow for `busy` status (with pulsing animation)
  - 🔴 Red for `error` status
  - ⚪ Gray for `unknown` status

- ✅ **Pulsing animation** for busy status to draw attention
- ✅ **Hover tooltips** showing status details
- ✅ **Accessibility** with ARIA labels and roles
- ✅ **Responsive design** using Tailwind CSS

## Requirements Satisfied

- **14.1**: Display status indicator next to agent name
- **14.2**: Green dot for available agents
- **14.3**: Yellow dot for agents with warnings (busy)
- **14.4**: Red dot for unavailable agents (error)
- **14.5**: Tooltip on hover with status details

## Usage

```tsx
import { AgentStatusIndicator } from './components';

// Basic usage with default tooltip
<AgentStatusIndicator status="available" />

// With custom tooltip
<AgentStatusIndicator 
  status="busy" 
  tooltip="Agent is processing your request" 
/>

// In an agent list
<div className="flex items-center gap-2">
  <AgentStatusIndicator status="available" />
  <span>OnboardingAgent</span>
</div>
```

## Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `status` | `'available' \| 'busy' \| 'error' \| 'unknown'` | Yes | Current status of the agent |
| `tooltip` | `string` | No | Custom tooltip text (defaults to status-based message) |

## Status Mapping

| Status | Color | Animation | Default Tooltip |
|--------|-------|-----------|-----------------|
| `available` | Green | None | "Agent is available" |
| `busy` | Yellow | Pulsing | "Agent is busy processing" |
| `error` | Red | None | "Agent encountered an error" |
| `unknown` | Gray | None | "Agent status unknown" |

## Styling

The component uses Tailwind CSS classes and follows the design system:

- Status dot: `w-2.5 h-2.5` (10px diameter)
- Tooltip: Dark background with white text
- Animations: CSS `animate-pulse` for busy status
- Transitions: 200ms opacity transition for tooltip

## Accessibility

- Uses `role="status"` for the status indicator
- Includes `aria-label` describing the current status
- Tooltip has `role="tooltip"` for screen readers
- Keyboard accessible (tooltip appears on focus)

## Example

See `AgentStatusIndicator.example.tsx` for a complete demonstration of all status types and usage patterns.

## Integration with SideNavigation

This component is designed to be used within the `SideNavigation` component's agent list:

```tsx
<div className="agent-list-item">
  <AgentStatusIndicator 
    status={agent.status} 
    tooltip={`${agent.name} - ${getStatusMessage(agent)}`}
  />
  <span>{agent.name}</span>
</div>
```

## Future Enhancements

- Add status change animations (fade between colors)
- Support for additional status types (maintenance, updating)
- Configurable size variants (small, medium, large)
- Custom color schemes for different themes
