import React from 'react';
import MarkdownRenderer from './MarkdownRenderer';

/**
 * MarkdownRenderer Component Examples
 * 
 * This file demonstrates various use cases for the MarkdownRenderer component.
 */

/**
 * Example 1: Basic Markdown Rendering
 */
export const BasicMarkdownExample: React.FC = () => {
  const markdown = `
# Welcome to MarkdownRenderer

This component renders **markdown** with *style* and ~~strikethrough~~.

You can also use \`inline code\` for technical terms.
  `.trim();

  return (
    <div className="p-6 bg-[#0a0e1a] min-h-screen">
      <h2 className="text-xl font-bold text-[#e4e7eb] mb-4">
        Example 1: Basic Markdown
      </h2>
      <div className="bg-[#151b2d] rounded-lg p-4 border border-[#2d3548]">
        <MarkdownRenderer content={markdown} />
      </div>
    </div>
  );
};

/**
 * Example 2: Code Blocks with Syntax Highlighting
 */
export const CodeBlockExample: React.FC = () => {
  const markdown = `
## Code Examples

### JavaScript

\`\`\`javascript
function fibonacci(n) {
  if (n <= 1) return n;
  return fibonacci(n - 1) + fibonacci(n - 2);
}

console.log(fibonacci(10)); // 55
\`\`\`

### Python

\`\`\`python
def factorial(n):
    if n <= 1:
        return 1
    return n * factorial(n - 1)

print(factorial(5))  # 120
\`\`\`

### TypeScript

\`\`\`typescript
interface User {
  id: number;
  name: string;
  email: string;
}

const user: User = {
  id: 1,
  name: "John Doe",
  email: "john@example.com"
};
\`\`\`
  `.trim();

  return (
    <div className="p-6 bg-[#0a0e1a] min-h-screen">
      <h2 className="text-xl font-bold text-[#e4e7eb] mb-4">
        Example 2: Code Blocks with Syntax Highlighting
      </h2>
      <div className="bg-[#151b2d] rounded-lg p-4 border border-[#2d3548]">
        <MarkdownRenderer content={markdown} />
      </div>
    </div>
  );
};

/**
 * Example 3: Tables
 */
export const TableExample: React.FC = () => {
  const markdown = `
## Resource Comparison

| Resource Type | Cost/Month | Performance | Scalability |
|--------------|------------|-------------|-------------|
| t3.micro     | $8.50      | Low         | Limited     |
| t3.medium    | $33.41     | Medium      | Moderate    |
| m5.large     | $69.35     | High        | Excellent   |
| c5.xlarge    | $153.88    | Very High   | Excellent   |

### Notes

- Prices are approximate and may vary by region
- Performance ratings are relative
- Scalability depends on workload type
  `.trim();

  return (
    <div className="p-6 bg-[#0a0e1a] min-h-screen">
      <h2 className="text-xl font-bold text-[#e4e7eb] mb-4">
        Example 3: Tables
      </h2>
      <div className="bg-[#151b2d] rounded-lg p-4 border border-[#2d3548]">
        <MarkdownRenderer content={markdown} />
      </div>
    </div>
  );
};

/**
 * Example 4: Lists and Nested Content
 */
export const ListExample: React.FC = () => {
  const markdown = `
## Deployment Checklist

### Pre-Deployment

1. **Code Review**
   - All PRs approved
   - No merge conflicts
   - Tests passing

2. **Infrastructure**
   - Resources provisioned
   - Security groups configured
   - IAM roles created

3. **Documentation**
   - README updated
   - API docs generated
   - Runbook prepared

### Post-Deployment

- [ ] Verify health checks
- [ ] Monitor error rates
- [ ] Check performance metrics
- [ ] Update status page

### Rollback Plan

- Identify rollback trigger conditions
- Document rollback steps
- Test rollback procedure
- Notify stakeholders
  `.trim();

  return (
    <div className="p-6 bg-[#0a0e1a] min-h-screen">
      <h2 className="text-xl font-bold text-[#e4e7eb] mb-4">
        Example 4: Lists and Nested Content
      </h2>
      <div className="bg-[#151b2d] rounded-lg p-4 border border-[#2d3548]">
        <MarkdownRenderer content={markdown} />
      </div>
    </div>
  );
};

/**
 * Example 5: Mixed Content (Real-World Agent Response)
 */
export const AgentResponseExample: React.FC = () => {
  const markdown = `
# Infrastructure Deployment Summary

## Overview

Your infrastructure has been successfully deployed to AWS. Below are the key details and resources created.

## Deployed Resources

### Compute

- **EC2 Instance**: \`i-0123456789abcdef0\`
  - Type: t3.medium
  - Region: us-east-1
  - Status: Running

### Networking

- **VPC**: \`vpc-0123456789abcdef0\`
- **Subnet**: \`subnet-0123456789abcdef0\`
- **Security Group**: \`sg-0123456789abcdef0\`

## Configuration

\`\`\`yaml
Resources:
  WebServer:
    Type: AWS::EC2::Instance
    Properties:
      InstanceType: t3.medium
      ImageId: ami-0c55b159cbfafe1f0
      SecurityGroupIds:
        - !Ref WebServerSecurityGroup
\`\`\`

## Cost Estimate

| Service | Monthly Cost |
|---------|-------------|
| EC2     | $33.41      |
| EBS     | $8.00       |
| Data Transfer | $5.00 |
| **Total** | **$46.41** |

## Next Steps

1. Configure your application
2. Set up monitoring and alerts
3. Configure backups
4. Review security settings

> **Note**: Remember to tag all resources for cost tracking and compliance.

For more information, visit the [AWS Console](https://console.aws.amazon.com).
  `.trim();

  return (
    <div className="p-6 bg-[#0a0e1a] min-h-screen">
      <h2 className="text-xl font-bold text-[#e4e7eb] mb-4">
        Example 5: Mixed Content (Real-World Agent Response)
      </h2>
      <div className="bg-[#151b2d] rounded-lg p-4 border border-[#2d3548]">
        <MarkdownRenderer content={markdown} />
      </div>
    </div>
  );
};

/**
 * Example 6: Security - XSS Prevention
 */
export const SecurityExample: React.FC = () => {
  const markdown = `
## Security Test

This content includes potentially dangerous HTML that should be sanitized:

<script>alert('XSS Attack!')</script>

<img src="x" onerror="alert('XSS')">

<a href="javascript:alert('XSS')">Click me</a>

The above attempts should be neutralized by DOMPurify.

### Safe HTML

Only safe HTML tags are allowed:

- **Bold text**
- *Italic text*
- \`Code\`
- [Safe links](https://example.com)

All dangerous scripts and event handlers are removed automatically.
  `.trim();

  return (
    <div className="p-6 bg-[#0a0e1a] min-h-screen">
      <h2 className="text-xl font-bold text-[#e4e7eb] mb-4">
        Example 6: Security - XSS Prevention
      </h2>
      <div className="bg-[#151b2d] rounded-lg p-4 border border-[#2d3548]">
        <MarkdownRenderer content={markdown} />
      </div>
      <div className="mt-4 p-4 bg-[#1e2638] rounded border border-[#3b82f6]">
        <p className="text-sm text-[#9ca3af]">
          ✓ All potentially dangerous HTML has been sanitized by DOMPurify.
          No scripts or event handlers will execute.
        </p>
      </div>
    </div>
  );
};

/**
 * Default export with all examples
 */
const MarkdownRendererExamples: React.FC = () => {
  return (
    <div className="space-y-8">
      <BasicMarkdownExample />
      <CodeBlockExample />
      <TableExample />
      <ListExample />
      <AgentResponseExample />
      <SecurityExample />
    </div>
  );
};

export default MarkdownRendererExamples;
