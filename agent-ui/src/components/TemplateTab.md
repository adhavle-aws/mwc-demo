# TemplateTab Component

## Overview

The `TemplateTab` component displays CloudFormation templates with syntax highlighting, line numbers, and copy/download functionality. It provides a professional code viewing experience with support for both YAML and JSON formats.

## Features

- **Syntax Highlighting**: Uses Prism.js for beautiful syntax highlighting
- **Format Detection**: Automatically detects YAML vs JSON format
- **Line Numbers**: Displays line numbers for easy reference
- **Copy to Clipboard**: One-click copy with visual confirmation
- **Download as File**: Download template with appropriate file extension
- **Scrollable Content**: Handles long templates with smooth scrolling
- **Format Preservation**: Maintains original formatting and indentation

## Props

```typescript
interface TemplateTabProps {
  template: string;      // The CloudFormation template content
  format: TemplateFormat; // 'yaml' or 'json'
}

type TemplateFormat = 'yaml' | 'json';
```

## Usage

### Basic Usage

```tsx
import { TemplateTab } from './components';

function MyComponent() {
  const template = `
AWSTemplateFormatVersion: '2010-09-09'
Description: Example template

Resources:
  MyBucket:
    Type: AWS::S3::Bucket
    Properties:
      BucketName: example-bucket
  `;

  return (
    <TemplateTab 
      template={template} 
      format="yaml" 
    />
  );
}
```

### With JSON Template

```tsx
import { TemplateTab } from './components';

function MyComponent() {
  const template = `{
  "AWSTemplateFormatVersion": "2010-09-09",
  "Resources": {
    "MyBucket": {
      "Type": "AWS::S3::Bucket"
    }
  }
}`;

  return (
    <TemplateTab 
      template={template} 
      format="json" 
    />
  );
}
```

### With Automatic Format Detection

```tsx
import { TemplateTab } from './components';

function MyComponent() {
  // Format will be auto-detected from content
  const template = getTemplateFromAgent();

  return (
    <TemplateTab 
      template={template} 
      format={detectFormat(template)} 
    />
  );
}
```

## Behavior

### Format Detection

The component automatically detects the template format if not explicitly provided:
- Content starting with `{` or `[` is detected as JSON
- All other content is treated as YAML

### Copy to Clipboard

When the user clicks the "Copy" button:
1. Template content is copied to clipboard
2. Button shows "Copied!" with a checkmark
3. Success message disappears after 2 seconds
4. If copy fails, error is logged to console

### Download as File

When the user clicks the "Download" button:
1. Creates a Blob with appropriate MIME type
2. Generates filename: `cloudformation-template.yaml` or `cloudformation-template.json`
3. Triggers browser download
4. Cleans up temporary resources

### Syntax Highlighting

- Uses Prism.js with the "tomorrow" theme
- Highlights YAML and JSON syntax
- Applies highlighting on mount and when template/format changes
- Preserves original formatting

## Styling

The component uses Tailwind CSS with the application's dark theme:

- **Background**: `#0a0e1a` (main) and `#151b2d` (header)
- **Borders**: `#2d3548`
- **Text**: `#e4e7eb` (primary), `#9ca3af` (secondary), `#6b7280` (muted)
- **Accent**: `#3b82f6` (blue)
- **Success**: `#10b981` (green)

## Accessibility

- Buttons have descriptive `aria-label` attributes
- Line numbers are marked with `aria-hidden="true"`
- Keyboard navigation supported for all interactive elements
- Focus indicators visible on all buttons

## Requirements Satisfied

- **4.1**: Syntax highlighting for CloudFormation templates
- **4.2**: Support for both YAML and JSON formats
- **4.3**: Copy to clipboard functionality
- **4.4**: Line numbers display
- **4.5**: Scrollable content for long templates
- **4.6**: Format and indentation preservation

## Dependencies

- `react`: ^19.2.0
- `prismjs`: ^1.30.0
- `@types/prismjs`: ^1.26.5

## Browser Compatibility

- Modern browsers with Clipboard API support
- Falls back gracefully if clipboard access is denied
- Download functionality works in all modern browsers

## Performance Considerations

- Syntax highlighting runs only when template or format changes
- Line numbers generated efficiently from template content
- Blob URLs properly cleaned up after download
- Component re-renders minimized with proper dependency arrays

## Future Enhancements

- Search within template
- Collapsible sections
- Diff view for template changes
- Export to other formats
- Template validation
