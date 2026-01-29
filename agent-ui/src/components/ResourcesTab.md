# ResourcesTab Component

## Overview

The ResourcesTab component displays a searchable, filterable list of provisioned AWS resources with their details. It provides an organized view of infrastructure resources with status indicators and expandable details.

## Features

- Searchable resource list (by logical ID, physical ID, or type)
- Filterable by resource type
- Status indicators with color coding
- Expandable resource details
- Copy resource identifiers to clipboard
- Resource properties display
- Timestamp information

## Props

```typescript
interface Resource {
  logicalId: string;
  physicalId: string;
  type: string;
  status: string;
  timestamp?: Date;
  properties?: Record<string, any>;
}

interface ResourcesTabProps {
  resources: Resource[];
}
```

## Usage

```tsx
import { ResourcesTab } from './components';

function MyComponent() {
  const resources = [
    {
      logicalId: 'MyLambdaFunction',
      physicalId: 'my-lambda-abc123',
      type: 'AWS::Lambda::Function',
      status: 'CREATE_COMPLETE',
      timestamp: new Date(),
      properties: {
        Runtime: 'python3.11',
        MemorySize: 512,
      },
    },
  ];

  return <ResourcesTab resources={resources} />;
}
```

## Resource Status Colors

- **Green** (`#10b981`): CREATE_COMPLETE, UPDATE_COMPLETE
- **Yellow** (`#f59e0b`): IN_PROGRESS statuses
- **Red** (`#ef4444`): FAILED or ROLLBACK statuses
- **Gray** (`#9ca3af`): Unknown or pending statuses

## Interactive Features

1. **Search**: Filter resources by logical ID, physical ID, or type
2. **Type Filter**: Dropdown to filter by specific resource types
3. **Expand/Collapse**: Click resource to view detailed properties
4. **Copy IDs**: Quick copy buttons for resource identifiers

## Styling

- Dark theme consistent with application
- Hover effects on resource cards
- Smooth transitions for expand/collapse
- Status badges with icons
- Monospace font for IDs and properties

## Accessibility

- Search input with placeholder text
- Dropdown with semantic HTML
- Copy buttons with `aria-label`
- Icons marked with `aria-hidden`
- Keyboard navigation support

## Requirements

Validates: Requirements 3.3, 10.1
