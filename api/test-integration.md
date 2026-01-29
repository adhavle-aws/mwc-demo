# AWS AgentCore Integration Testing Guide

## Prerequisites

1. **AWS Credentials**: Ensure AWS credentials are configured
   ```bash
   aws configure
   # OR set environment variables:
   export AWS_ACCESS_KEY_ID=your_key
   export AWS_SECRET_ACCESS_KEY=your_secret
   export AWS_REGION=us-east-1
   ```

2. **Agent ARNs**: Configure agent ARNs in `api/.env`
   ```bash
   cd api
   cp .env.example .env
   # Edit .env and add your agent ARNs
   ```

3. **Dependencies**: Install dependencies
   ```bash
   cd api
   npm install
   ```

## Running the Server

### Development Mode
```bash
cd api
npm run dev
```

The server will start on http://localhost:3001

### Production Mode
```bash
cd api
npm run build
npm start
```

## Testing Endpoints

### 1. Health Check
```bash
curl http://localhost:3001/health
```

**Expected Response:**
```json
{
  "status": "healthy",
  "timestamp": "2024-01-29T...",
  "environment": "development"
}
```

### 2. List Agents
```bash
curl http://localhost:3001/api/agents/list
```

**Expected Response:**
```json
{
  "agents": [
    {
      "id": "onboarding",
      "name": "OnboardingAgent",
      "description": "Helps design AWS infrastructure architecture",
      "arn": "arn:aws:bedrock:us-east-1:...",
      "capabilities": ["architecture", "cost-optimization", "cloudformation"]
    },
    {
      "id": "provisioning",
      "name": "ProvisioningAgent",
      "description": "Deploys CloudFormation stacks",
      "arn": "arn:aws:bedrock:us-east-1:...",
      "capabilities": ["deployment", "monitoring", "resources"]
    },
    {
      "id": "mwc",
      "name": "MWCAgent",
      "description": "Orchestrates multi-agent workflows",
      "arn": "arn:aws:bedrock:us-east-1:...",
      "capabilities": ["orchestration", "workflow"]
    }
  ]
}
```

### 3. Get Agent Status
```bash
curl http://localhost:3001/api/agents/status/onboarding
```

**Expected Response:**
```json
{
  "agentId": "onboarding",
  "status": "available",
  "arn": "arn:aws:bedrock:us-east-1:..."
}
```

**Error Response (ARN not configured):**
```json
{
  "agentId": "onboarding",
  "status": "error",
  "arn": "",
  "errorMessage": "Agent ARN not configured"
}
```

### 4. Invoke Agent (Streaming)
```bash
curl -X POST http://localhost:3001/api/agents/invoke \
  -H "Content-Type: application/json" \
  -d '{
    "agentId": "onboarding",
    "prompt": "Design a simple serverless API architecture"
  }'
```

**Expected Response (Server-Sent Events):**
```
data: {"chunk":"I'll help you design a serverless API architecture..."}

data: {"chunk":"Here's a recommended architecture:\n\n"}

data: {"chunk":"## Architecture Overview\n..."}

data: {"done":true}
```

**With Session ID:**
```bash
curl -X POST http://localhost:3001/api/agents/invoke \
  -H "Content-Type: application/json" \
  -d '{
    "agentId": "onboarding",
    "prompt": "What did we discuss?",
    "sessionId": "session-123"
  }'
```

### 5. Get CloudFormation Stack Status
```bash
curl http://localhost:3001/api/stacks/status/my-stack-name
```

**Expected Response:**
```json
{
  "stackName": "my-stack-name",
  "stackId": "arn:aws:cloudformation:us-east-1:...",
  "status": "CREATE_COMPLETE",
  "resources": [
    {
      "logicalId": "MyFunction",
      "physicalId": "my-stack-MyFunction-ABC123",
      "type": "AWS::Lambda::Function",
      "status": "CREATE_COMPLETE",
      "timestamp": "2024-01-29T..."
    }
  ],
  "outputs": {
    "ApiUrl": "https://api.example.com"
  },
  "events": [
    {
      "timestamp": "2024-01-29T...",
      "resourceType": "AWS::CloudFormation::Stack",
      "logicalId": "my-stack-name",
      "status": "CREATE_COMPLETE"
    }
  ],
  "creationTime": "2024-01-29T...",
  "lastUpdatedTime": "2024-01-29T..."
}
```

**Error Response (Stack not found):**
```json
{
  "error": "AppError",
  "message": "Failed to get stack status: Stack not found: my-stack-name"
}
```

## Testing with JavaScript/TypeScript

### Using fetch API
```typescript
// List agents
const agents = await fetch('http://localhost:3001/api/agents/list')
  .then(res => res.json());
console.log(agents);

// Invoke agent with streaming
const response = await fetch('http://localhost:3001/api/agents/invoke', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    agentId: 'onboarding',
    prompt: 'Design a serverless API'
  })
});

const reader = response.body.getReader();
const decoder = new TextDecoder();

while (true) {
  const { done, value } = await reader.read();
  if (done) break;
  
  const chunk = decoder.decode(value);
  const lines = chunk.split('\n');
  
  for (const line of lines) {
    if (line.startsWith('data: ')) {
      const data = JSON.parse(line.slice(6));
      if (data.chunk) {
        console.log(data.chunk);
      }
      if (data.done) {
        console.log('Stream complete');
      }
    }
  }
}
```

### Using EventSource (for SSE)
```typescript
// Note: EventSource doesn't support POST, so this is for GET endpoints only
const eventSource = new EventSource('http://localhost:3001/api/agents/status/onboarding');

eventSource.onmessage = (event) => {
  const data = JSON.parse(event.data);
  console.log('Status:', data);
};

eventSource.onerror = (error) => {
  console.error('Error:', error);
  eventSource.close();
};
```

## Error Testing

### 1. Missing Agent ID
```bash
curl -X POST http://localhost:3001/api/agents/invoke \
  -H "Content-Type: application/json" \
  -d '{"prompt": "Hello"}'
```

**Expected Response:**
```json
{
  "error": "AppError",
  "message": "Missing required fields: agentId and prompt"
}
```

### 2. Invalid Agent ID
```bash
curl -X POST http://localhost:3001/api/agents/invoke \
  -H "Content-Type: application/json" \
  -d '{"agentId": "invalid", "prompt": "Hello"}'
```

**Expected Response:**
```json
{
  "error": "AppError",
  "message": "Agent not found: invalid"
}
```

### 3. Missing Agent ARN
If agent ARN is not configured in .env:

```bash
curl -X POST http://localhost:3001/api/agents/invoke \
  -H "Content-Type: application/json" \
  -d '{"agentId": "onboarding", "prompt": "Hello"}'
```

**Expected Response:**
```json
{
  "error": "AppError",
  "message": "Agent ARN not configured for: onboarding"
}
```

### 4. AWS Permission Error
If AWS credentials don't have permission to invoke agents:

**Expected Response:**
```
data: {"error":"Access denied to invoke agent"}
```

## Automated Testing Script

Run the verification script:
```bash
cd api
./verify-integration.sh
```

This will test all endpoints and provide a summary of results.

## Monitoring Logs

The server logs all requests and errors:

```
2024-01-29T10:30:00.000Z GET /health
2024-01-29T10:30:05.000Z GET /api/agents/list
2024-01-29T10:30:10.000Z POST /api/agents/invoke
2024-01-29T10:30:15.000Z GET /api/stacks/status/my-stack
```

Errors are logged with full stack traces in development mode.

## Performance Testing

### Load Testing with Apache Bench
```bash
# Test health endpoint
ab -n 1000 -c 10 http://localhost:3001/health

# Test list agents endpoint
ab -n 1000 -c 10 http://localhost:3001/api/agents/list
```

### Streaming Performance
```bash
# Measure time to first byte
time curl -X POST http://localhost:3001/api/agents/invoke \
  -H "Content-Type: application/json" \
  -d '{"agentId":"onboarding","prompt":"Hello"}' \
  --output /dev/null
```

## Troubleshooting

### Server won't start
- Check if port 3001 is already in use: `lsof -i :3001`
- Check if .env file exists and is configured
- Check if dependencies are installed: `npm install`

### Agent invocation fails
- Verify AWS credentials: `aws sts get-caller-identity`
- Verify agent ARNs are correct in .env
- Check AWS permissions for bedrock:InvokeAgent
- Check CloudWatch logs for agent errors

### CloudFormation queries fail
- Verify AWS credentials have CloudFormation permissions
- Verify stack name is correct
- Check if stack exists: `aws cloudformation describe-stacks --stack-name my-stack`

### CORS errors
- Update CORS_ORIGIN in .env to match your frontend URL
- Restart the server after changing .env

## Next Steps

After verifying the integration:

1. **Frontend Integration**: Connect the React frontend to these endpoints
2. **Deployment**: Deploy to AWS Lambda or ECS
3. **Monitoring**: Set up CloudWatch logs and metrics
4. **Security**: Add authentication and rate limiting
5. **Testing**: Add unit and integration tests

## Resources

- [AWS Bedrock AgentCore Documentation](https://docs.aws.amazon.com/bedrock/latest/userguide/agents.html)
- [AWS CloudFormation API Reference](https://docs.aws.amazon.com/AWSCloudFormation/latest/APIReference/)
- [Server-Sent Events Specification](https://html.spec.whatwg.org/multipage/server-sent-events.html)
- [Express.js Documentation](https://expressjs.com/)
