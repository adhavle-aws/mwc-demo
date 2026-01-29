# AWS AgentCore Integration Guide

This document provides detailed information about the AWS Bedrock AgentCore integration in the Agent UI Backend API.

## Overview

The backend API integrates with two primary AWS services:

1. **AWS Bedrock AgentCore** - For invoking AI agents and streaming responses
2. **AWS CloudFormation** - For monitoring infrastructure deployment status

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    Backend API (Express)                         │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │              AgentService                                   │ │
│  │  • BedrockAgentRuntimeClient                               │ │
│  │  • InvokeAgentCommand                                      │ │
│  │  • Streaming response handling                             │ │
│  └────────────────────────────────────────────────────────────┘ │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │         CloudFormationService                              │ │
│  │  • CloudFormationClient                                    │ │
│  │  • DescribeStacksCommand                                   │ │
│  │  • DescribeStackResourcesCommand                           │ │
│  │  • DescribeStackEventsCommand                              │ │
│  └────────────────────────────────────────────────────────────┘ │
└──────────────────────────┬───────────────────────────────────────┘
                           │ AWS SDK v3
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│                         AWS Services                             │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  AWS Bedrock AgentCore                                   │  │
│  │  • OnboardingAgent                                       │  │
│  │  • ProvisioningAgent                                     │  │
│  │  • MWCAgent                                              │  │
│  └──────────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  AWS CloudFormation                                      │  │
│  │  • Stack status monitoring                               │  │
│  │  • Resource tracking                                     │  │
│  │  • Event history                                         │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

## AWS SDK Configuration

### Credential Chain

The API uses the AWS SDK v3 default credential chain:

1. **Environment Variables**
   - `AWS_ACCESS_KEY_ID`
   - `AWS_SECRET_ACCESS_KEY`
   - `AWS_SESSION_TOKEN` (optional, for temporary credentials)

2. **Shared Credentials File**
   - Location: `~/.aws/credentials`
   - Configured via: `aws configure`

3. **IAM Role**
   - Automatically used when running on AWS services
   - EC2 instance profiles
   - ECS task roles
   - Lambda execution roles

### Configuration Code

```typescript
// In AgentService and CloudFormationService constructors
const clientConfig: any = {
  region: config.aws.region,
};

// Add explicit credentials if provided via environment variables
if (config.aws.credentials.accessKeyId && config.aws.credentials.secretAccessKey) {
  clientConfig.credentials = {
    accessKeyId: config.aws.credentials.accessKeyId,
    secretAccessKey: config.aws.credentials.secretAccessKey,
    sessionToken: config.aws.credentials.sessionToken,
  };
}
// Otherwise, AWS SDK will use default credential chain

this.client = new BedrockAgentRuntimeClient(clientConfig);
```

## Agent Invocation

### How It Works

1. **Request**: Client sends agent ID and prompt
2. **Validation**: Service validates agent exists and ARN is configured
3. **ARN Parsing**: Extract agent ID from ARN format
4. **Invocation**: Call `InvokeAgentCommand` with parameters
5. **Streaming**: Stream response chunks back to client via Server-Sent Events

### Code Flow

```typescript
// 1. Get agent configuration
const agent = this.getAgentById(agentId);

// 2. Extract agent ID from ARN
// ARN format: arn:aws:bedrock:region:account:agent/agentId
const arnParts = agent.arn.split('/');
const agentIdFromArn = arnParts[arnParts.length - 1];

// 3. Prepare invocation input
const input: InvokeAgentCommandInput = {
  agentId: agentIdFromArn,
  agentAliasId: agent.aliasId,
  sessionId: sessionId || this.generateSessionId(),
  inputText: prompt,
};

// 4. Invoke agent
const command = new InvokeAgentCommand(input);
const response = await this.client.send(command);

// 5. Stream response
for await (const event of response.completion) {
  if (event.chunk?.bytes) {
    const text = new TextDecoder().decode(event.chunk.bytes);
    yield text;
  }
}
```

### Session Management

- **Session ID**: Unique identifier for conversation continuity
- **Format**: `session-{timestamp}-{random}`
- **Purpose**: Maintains context across multiple agent invocations
- **Client Control**: Client can provide session ID or let server generate

## CloudFormation Integration

### Stack Status Polling

The API provides real-time CloudFormation stack status:

```typescript
// Get comprehensive stack information
const status = await cfnService.getStackStatus(stackName);

// Returns:
{
  stackName: string;
  stackId: string;
  status: string;              // CREATE_COMPLETE, UPDATE_IN_PROGRESS, etc.
  resources: ResourceStatus[]; // All stack resources with statuses
  outputs: Record<string, string>;
  events: StackEvent[];        // Recent 50 events
  creationTime: Date;
  lastUpdatedTime?: Date;
}
```

### Resource Tracking

Each resource includes:
- **Logical ID**: Resource name in template
- **Physical ID**: Actual AWS resource ID
- **Type**: AWS resource type (e.g., AWS::S3::Bucket)
- **Status**: Current status (CREATE_COMPLETE, UPDATE_IN_PROGRESS, etc.)
- **Timestamp**: Last update time
- **Status Reason**: Error message if failed

### Event Timeline

Events provide deployment history:
- Chronological order (most recent first)
- Limited to 50 most recent events
- Includes resource type, status, and reason
- Useful for debugging deployment failures

## Error Handling

### AWS SDK Error Types

The API handles specific AWS SDK errors:

#### Bedrock Agent Errors

| Error Type | Description | Handling |
|------------|-------------|----------|
| `ResourceNotFoundException` | Agent not found | Log error, return 404 |
| `AccessDeniedException` | Insufficient permissions | Log error, return 403 |
| `ThrottlingException` | Rate limit exceeded | Log error, suggest retry |
| `ValidationException` | Invalid parameters | Log error, return 400 |
| `ServiceQuotaExceededException` | Quota exceeded | Log error, return 429 |

#### CloudFormation Errors

| Error Type | Description | Handling |
|------------|-------------|----------|
| `ValidationError` | Invalid stack name | Log error, return 400 |
| `AccessDenied` | Insufficient permissions | Log error, return 403 |
| `Throttling` | Rate limit exceeded | Log error, suggest retry |

### Error Logging

All AWS errors are logged with:
- Error type/name
- Error message
- Context (agent ID or stack name)
- Timestamp

Example log output:
```
AWS Error invoking agent onboarding: AccessDeniedException
Access denied to agent: onboarding. Check IAM permissions.
```

## IAM Permissions

### Required Permissions

#### For Agent Invocation

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "bedrock:InvokeAgent"
      ],
      "Resource": [
        "arn:aws:bedrock:us-east-1:ACCOUNT_ID:agent/ONBOARDING_AGENT_ID",
        "arn:aws:bedrock:us-east-1:ACCOUNT_ID:agent/PROVISIONING_AGENT_ID",
        "arn:aws:bedrock:us-east-1:ACCOUNT_ID:agent/MWC_AGENT_ID"
      ]
    }
  ]
}
```

#### For CloudFormation Monitoring

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "cloudformation:DescribeStacks",
        "cloudformation:DescribeStackResources",
        "cloudformation:DescribeStackEvents"
      ],
      "Resource": "*"
    }
  ]
}
```

### Least Privilege Principle

For production, restrict CloudFormation permissions to specific stacks:

```json
{
  "Resource": [
    "arn:aws:cloudformation:us-east-1:ACCOUNT_ID:stack/allowed-stack-prefix-*/*"
  ]
}
```

## Configuration Reference

### Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `AWS_REGION` | No | `us-east-1` | AWS region for all services |
| `AWS_ACCESS_KEY_ID` | No | - | AWS access key (use credential chain) |
| `AWS_SECRET_ACCESS_KEY` | No | - | AWS secret key (use credential chain) |
| `AWS_SESSION_TOKEN` | No | - | AWS session token (temporary creds) |
| `ONBOARDING_AGENT_ARN` | Yes | - | OnboardingAgent ARN |
| `PROVISIONING_AGENT_ARN` | Yes | - | ProvisioningAgent ARN |
| `MWC_AGENT_ARN` | Yes | - | MWCAgent ARN |
| `ONBOARDING_AGENT_ALIAS_ID` | No | `TSTALIASID` | OnboardingAgent alias |
| `PROVISIONING_AGENT_ALIAS_ID` | No | `TSTALIASID` | ProvisioningAgent alias |
| `MWC_AGENT_ALIAS_ID` | No | `TSTALIASID` | MWCAgent alias |

### Agent ARN Format

```
arn:aws:bedrock:{region}:{account-id}:agent/{agent-id}
```

Example:
```
arn:aws:bedrock:us-east-1:123456789012:agent/ABCDEFGHIJ
```

## Testing

### Local Testing

1. **Configure AWS Credentials**:
   ```bash
   aws configure
   ```

2. **Set Agent ARNs**:
   ```bash
   export ONBOARDING_AGENT_ARN=arn:aws:bedrock:us-east-1:123456789012:agent/AGENT_ID
   export PROVISIONING_AGENT_ARN=arn:aws:bedrock:us-east-1:123456789012:agent/AGENT_ID
   export MWC_AGENT_ARN=arn:aws:bedrock:us-east-1:123456789012:agent/AGENT_ID
   ```

3. **Start Server**:
   ```bash
   npm run dev
   ```

4. **Test Agent Invocation**:
   ```bash
   curl -X POST http://localhost:3001/api/agents/invoke \
     -H "Content-Type: application/json" \
     -d '{"agentId":"onboarding","prompt":"Hello"}'
   ```

### Production Testing

1. **Verify IAM Role**: Ensure Lambda/ECS role has required permissions
2. **Test Endpoints**: Use health check and agent status endpoints
3. **Monitor Logs**: Check CloudWatch Logs for AWS SDK errors
4. **Test Streaming**: Verify Server-Sent Events work through API Gateway

## Troubleshooting

### Common Issues

#### 1. "Agent ARN not configured"

**Cause**: Missing environment variable
**Solution**: Set `ONBOARDING_AGENT_ARN`, `PROVISIONING_AGENT_ARN`, or `MWC_AGENT_ARN`

#### 2. "AccessDeniedException"

**Cause**: Insufficient IAM permissions
**Solution**: Add `bedrock:InvokeAgent` permission to IAM role/user

#### 3. "ResourceNotFoundException"

**Cause**: Invalid agent ARN or agent doesn't exist
**Solution**: Verify agent ARN format and agent exists in AWS console

#### 4. "ThrottlingException"

**Cause**: Too many requests to AWS API
**Solution**: Implement exponential backoff retry logic

#### 5. Streaming not working

**Cause**: API Gateway timeout or buffering
**Solution**: Configure API Gateway for streaming responses

### Debug Mode

Enable detailed logging:

```bash
export NODE_ENV=development
npm run dev
```

This will log:
- All AWS SDK calls
- Request/response details
- Error stack traces

## Performance Considerations

### Streaming Optimization

- **Chunk Size**: AWS returns variable-size chunks
- **Buffering**: Minimal buffering for low latency
- **Backpressure**: Handle slow clients gracefully

### CloudFormation Polling

- **Rate Limits**: CloudFormation has API rate limits
- **Caching**: Consider caching stack status for 5-10 seconds
- **Batch Requests**: Use `DescribeStacks` for multiple stacks

### Connection Pooling

AWS SDK v3 automatically manages HTTP connection pooling:
- Reuses connections for better performance
- Handles connection lifecycle
- No manual configuration needed

## Security Best Practices

1. **Never Hardcode Credentials**: Use IAM roles in production
2. **Least Privilege**: Grant minimum required permissions
3. **Rotate Credentials**: Regularly rotate access keys (if used)
4. **Audit Logs**: Enable CloudTrail for API call auditing
5. **Encrypt in Transit**: Use HTTPS for all API calls
6. **Validate Input**: Sanitize all user input before AWS calls

## References

- [AWS SDK for JavaScript v3](https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/)
- [AWS Bedrock AgentCore](https://docs.aws.amazon.com/bedrock/latest/userguide/agents.html)
- [AWS CloudFormation API](https://docs.aws.amazon.com/AWSCloudFormation/latest/APIReference/)
- [IAM Best Practices](https://docs.aws.amazon.com/IAM/latest/UserGuide/best-practices.html)
