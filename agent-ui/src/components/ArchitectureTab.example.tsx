import React from 'react';
import ArchitectureTab from './ArchitectureTab';

/**
 * Example usage of ArchitectureTab component
 */

const sampleArchitectureContent = `# System Architecture

## Overview

This architecture implements a serverless multi-agent infrastructure provisioning system using AWS services.

## Components

### 1. Frontend Layer
- **React Application**: User interface for agent interaction
- **AWS Amplify**: Hosting and deployment
- **CloudFront**: Content delivery network

### 2. API Layer
- **API Gateway**: RESTful API endpoints
- **Lambda Functions**: Serverless compute for agent communication
- **WebSocket API**: Real-time streaming support

### 3. Agent Layer
- **AWS Bedrock AgentCore**: AI agent runtime
- **OnboardingAgent**: Architecture design and recommendations
- **ProvisioningAgent**: Infrastructure deployment
- **MWCAgent**: Orchestration and coordination

### 4. Infrastructure Layer
- **CloudFormation**: Infrastructure as Code
- **S3**: Template and artifact storage
- **DynamoDB**: State management
- **CloudWatch**: Monitoring and logging

## Data Flow

1. User submits request through UI
2. API Gateway routes to Lambda function
3. Lambda invokes appropriate agent via Bedrock
4. Agent processes request and generates response
5. Response streams back to UI in real-time
6. For deployments, CloudFormation creates resources
7. Progress updates stream to UI via WebSocket

## Security

- **IAM Roles**: Least privilege access control
- **VPC**: Network isolation for sensitive resources
- **KMS**: Encryption for data at rest
- **WAF**: Web application firewall protection

## Scalability

- Serverless architecture scales automatically
- CloudFront provides global distribution
- DynamoDB handles high-throughput state management
- Lambda concurrency limits prevent runaway costs

## Code Example

\`\`\`typescript
// Agent invocation example
const response = await invokeAgent({
  agentId: 'onboarding-agent',
  prompt: 'Design a serverless API',
  sessionId: 'user-session-123'
});
\`\`\`

## Monitoring

- CloudWatch Logs for application logs
- CloudWatch Metrics for performance monitoring
- X-Ray for distributed tracing
- Custom dashboards for operational visibility
`;

const ArchitectureTabExample: React.FC = () => {
  return (
    <div className="h-screen bg-[#0a0e1a]">
      <ArchitectureTab
        content={sampleArchitectureContent}
        diagramUrl="https://via.placeholder.com/800x400/1e2638/3b82f6?text=Architecture+Diagram"
      />
    </div>
  );
};

export default ArchitectureTabExample;
