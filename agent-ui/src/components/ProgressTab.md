# ProgressTab Component

## Overview

The `ProgressTab` component displays real-time CloudFormation deployment progress with a comprehensive view of resources, events, and overall deployment status. It provides visual feedback through progress bars, color-coded status indicators, and an auto-refreshing timeline.

## Features

- **Progress Bar**: Visual representation of deployment completion percentage
- **Resource List**: Displays all CloudFormation resources with color-coded status indicators
- **Event Timeline**: Chronological display of deployment events with timestamps
- **Auto-Refresh**: Automatically updates every 5 seconds during active deployments
- **Duration Display**: Shows elapsed time since deployment started
- **Color-Coded Statuses**: 
  - Green for successful completion
  - Yellow for in-progress operations
  - Red for failures or rollbacks
  - Gray for unknown states
- **Terminal Status Detection**: Stops auto-refresh when deployment completes or fails

## Props

```typescript
interface ProgressTabProps {
  stackName: string;        // CloudFormation stack name
  status: string;           // Current deployment status
  resources: ResourceStatus[]; // List of resources being deployed
  events: StackEvent[];     // Timeline of deployment events
  startTime: Date;          // Deployment start timestamp
}

interface ResourceStatus {
  logicalId: string;        // Logical resource ID from template
  physicalId: string;       // Physical AWS resource ID
  type: string;             // AWS resource type (e.g., AWS::S3::Bucket)
  status: string;           // Current resource status
  timestamp: Date;          // Last update timestamp
}

interface StackEvent {
  timestamp: Date;          // Event timestamp
  resourceType: string;     // AWS resource type
  logicalId: string;        // Logical resource ID
  status: string;           // Event status
  reason?: string;          // Optional reason/error message
}
```

## Usage

```tsx
import { ProgressTab } from './components';

function DeploymentView() {
  const resources = [
    {
      logicalId: 'MyBucket',
      physicalId: 'my-bucket-abc123',
      type: 'AWS::S3::Bucket',
      status: 'CREATE_COMPLETE',
      timestamp: new Date(),
    },
    {
      logicalId: 'MyFunction',
      physicalId: 'my-function-xyz789',
      type: 'AWS::Lambda::Function',
      status: 'CREATE_IN_PROGRESS',
      timestamp: new Date(),
    },
  ];

  const events = [
    {
      timestamp: new Date(),
      resourceType: 'AWS::S3::Bucket',
      logicalId: 'MyBucket',
      status: 'CREATE_COMPLETE',
    },
    {
      timestamp: new Date(),
      resourceType: 'AWS::Lambda::Function',
      logicalId: 'MyFunction',
      status: 'CREATE_IN_PROGRESS',
    },
  ];

  return (
    <ProgressTab
      stackName="my-infrastructure-stack"
      status="CREATE_IN_PROGRESS"
      resources={resources}
      events={events}
      startTime={new Date(Date.now() - 120000)} // 2 minutes ago
    />
  );
}
```

## Status Colors

The component uses color coding to indicate resource and event statuses:

| Status Pattern | Color | Meaning |
|---------------|-------|---------|
| `*_COMPLETE` (not ROLLBACK) | Green (#10b981) | Successful completion |
| `*_IN_PROGRESS` | Yellow (#f59e0b) | Operation in progress |
| `*_FAILED`, `*_ROLLBACK*` | Red (#ef4444) | Failure or rollback |
| Other | Gray (#9ca3af) | Unknown or pending |

## Status Icons

- **Success**: Checkmark in circle (green)
- **In Progress**: Spinning loader (yellow)
- **Failed**: X in circle (red)
- **Unknown**: Clock icon (gray)

## Auto-Refresh Behavior

The component automatically refreshes every 5 seconds when:
- Auto-refresh toggle is enabled (default: on)
- Deployment status is not terminal

Terminal statuses that stop auto-refresh:
- `CREATE_COMPLETE`
- `UPDATE_COMPLETE`
- `DELETE_COMPLETE`
- `CREATE_FAILED`
- `UPDATE_FAILED`
- `DELETE_FAILED`
- `ROLLBACK_COMPLETE`
- `ROLLBACK_FAILED`
- `UPDATE_ROLLBACK_COMPLETE`
- `UPDATE_ROLLBACK_FAILED`

Users can manually toggle auto-refresh using the checkbox in the header.

## Progress Calculation

Progress percentage is calculated based on the ratio of completed resources to total resources:

```
Progress = (Completed Resources / Total Resources) × 100
```

Completed statuses include:
- `CREATE_COMPLETE`
- `UPDATE_COMPLETE`
- `DELETE_COMPLETE`

## Duration Display

The component displays elapsed time since deployment started in the format:
- `Xh Ym Zs` for durations over 1 hour
- `Ym Zs` for durations over 1 minute
- `Zs` for durations under 1 minute

## Layout

The component uses a responsive grid layout:
- **Desktop (lg+)**: Two-column layout with resources on left, events on right
- **Mobile/Tablet**: Single-column stacked layout

## Accessibility

- Progress bar includes proper ARIA attributes (`role="progressbar"`, `aria-valuenow`, etc.)
- Status icons are marked with `aria-hidden="true"` since status is conveyed through text
- Color is not the only indicator of status (text labels are always present)
- Interactive elements (checkbox) are keyboard accessible

## Requirements Validation

This component satisfies the following requirements:

- **5.1**: Displays progress indicator when ProvisioningAgent deploys CloudFormation stack
- **5.2**: Shows current deployment status (IN_PROGRESS, COMPLETE, FAILED)
- **5.3**: Displays list of resources being created with individual statuses
- **5.6**: Shows timeline of deployment events
- **5.7**: Displays success message with deployment duration when complete

## Example with Mock Data

See `ProgressTab.example.tsx` for a complete example with mock data and state management.
