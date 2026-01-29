# Agent UI Backend API

Backend API service for the Agent UI application. Provides endpoints for interacting with AWS Bedrock AgentCore agents and CloudFormation stacks.

## Features

- **Agent Management**: List agents, check status, invoke agents with streaming responses
- **CloudFormation Integration**: Query stack status, resources, and events
- **CORS Support**: Configurable CORS for frontend integration
- **Error Handling**: Comprehensive error handling with detailed error messages
- **TypeScript**: Fully typed with TypeScript for type safety

## Prerequisites

- Node.js 18+ or 20+
- AWS credentials configured (via AWS CLI or environment variables)
- Access to AWS Bedrock AgentCore agents
- Access to CloudFormation stacks (if using stack status endpoint)

## Installation

```bash
npm install
```

## Configuration

Create a `.env` file based on `.env.example`:

```bash
cp .env.example .env
```

Edit `.env` and configure:

```env
PORT=3001
NODE_ENV=development
AWS_REGION=us-east-1

# AWS Credentials (Optional)
# The AWS SDK will automatically use credentials from:
# 1. Environment variables (AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY)
# 2. Shared credentials file (~/.aws/credentials)
# 3. IAM role (when running on EC2, Lambda, ECS, etc.)
# AWS_ACCESS_KEY_ID=your_access_key_id
# AWS_SECRET_ACCESS_KEY=your_secret_access_key
# AWS_SESSION_TOKEN=your_session_token

# Agent ARNs (required)
ONBOARDING_AGENT_ARN=arn:aws:bedrock:us-east-1:ACCOUNT_ID:agent/AGENT_ID
PROVISIONING_AGENT_ARN=arn:aws:bedrock:us-east-1:ACCOUNT_ID:agent/AGENT_ID
MWC_AGENT_ARN=arn:aws:bedrock:us-east-1:ACCOUNT_ID:agent/AGENT_ID

# Agent Alias IDs (optional - defaults to TSTALIASID)
ONBOARDING_AGENT_ALIAS_ID=TSTALIASID
PROVISIONING_AGENT_ALIAS_ID=TSTALIASID
MWC_AGENT_ALIAS_ID=TSTALIASID

# CORS (adjust for your frontend URL)
CORS_ORIGIN=http://localhost:5173
```

### AWS Credential Configuration

The API uses the AWS SDK default credential chain, which checks for credentials in the following order:

1. **Environment Variables**: `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_SESSION_TOKEN`
2. **Shared Credentials File**: `~/.aws/credentials` (configured via `aws configure`)
3. **IAM Role**: Automatically used when running on AWS services (EC2, Lambda, ECS, etc.)

**For Local Development:**
- Use `aws configure` to set up credentials in `~/.aws/credentials`
- Or set environment variables in `.env` file

**For Production (AWS):**
- Use IAM roles attached to Lambda functions, ECS tasks, or EC2 instances
- Never hardcode credentials in production

## Development

Start the development server with hot reload:

```bash
npm run dev
```

## Production

Build and start the production server:

```bash
npm run build
npm start
```

## API Endpoints

### Health Check

```
GET /health
```

Returns server health status.

### List Agents

```
GET /api/agents/list
```

Returns list of available agents.

**Response:**
```json
{
  "agents": [
    {
      "id": "onboarding",
      "name": "OnboardingAgent",
      "description": "Helps design AWS infrastructure architecture",
      "arn": "arn:aws:bedrock:...",
      "capabilities": ["architecture", "cost-optimization", "cloudformation"]
    }
  ]
}
```

### Get Agent Status

```
GET /api/agents/status/:agentId
```

Returns agent availability status.

**Response:**
```json
{
  "agentId": "onboarding",
  "status": "available",
  "arn": "arn:aws:bedrock:..."
}
```

### Invoke Agent (Streaming)

```
POST /api/agents/invoke
```

Invokes an agent and streams the response using Server-Sent Events (SSE).

**Request Body:**
```json
{
  "agentId": "onboarding",
  "prompt": "Design a serverless API architecture",
  "sessionId": "optional-session-id"
}
```

**Response:** Server-Sent Events stream
```
data: {"chunk":"Response text..."}

data: {"chunk":"More response..."}

data: {"done":true}
```

### Get Stack Status

```
GET /api/stacks/status/:stackName
```

Returns CloudFormation stack status, resources, and events.

**Response:**
```json
{
  "stackName": "my-stack",
  "stackId": "arn:aws:cloudformation:...",
  "status": "CREATE_COMPLETE",
  "resources": [...],
  "outputs": {...},
  "events": [...],
  "creationTime": "2024-01-29T...",
  "lastUpdatedTime": "2024-01-29T..."
}
```

## Error Handling

All errors return a consistent format:

```json
{
  "error": "ErrorType",
  "message": "Human-readable error message",
  "details": {}
}
```

Common HTTP status codes:
- `400`: Bad Request (invalid input)
- `404`: Not Found (agent or stack not found)
- `500`: Internal Server Error (AWS SDK errors, unexpected errors)

## Architecture

```
api/
├── src/
│   ├── config/          # Configuration management
│   ├── middleware/      # Express middleware (error handling)
│   ├── routes/          # API route handlers
│   ├── services/        # Business logic (AWS SDK interactions)
│   ├── types/           # TypeScript type definitions
│   ├── app.ts           # Express app setup
│   └── index.ts         # Server entry point
├── .env.example         # Environment variable template
├── package.json
├── tsconfig.json
└── README.md
```

## AWS Permissions

The API requires the following AWS permissions:

**For Agent Invocation:**
- `bedrock:InvokeAgent` - Required to invoke Bedrock agents
- `bedrock:GetAgent` - Optional, for agent status checks

**For CloudFormation:**
- `cloudformation:DescribeStacks` - Required to get stack details
- `cloudformation:DescribeStackResources` - Required to list stack resources
- `cloudformation:DescribeStackEvents` - Required to get stack events

### Example IAM Policy

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "bedrock:InvokeAgent",
        "bedrock:GetAgent"
      ],
      "Resource": [
        "arn:aws:bedrock:us-east-1:ACCOUNT_ID:agent/*"
      ]
    },
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

### AWS SDK Error Handling

The API handles common AWS SDK errors:

- **ResourceNotFoundException**: Agent or stack not found
- **AccessDeniedException**: Insufficient IAM permissions
- **ThrottlingException**: API rate limit exceeded (automatic retry recommended)
- **ValidationException**: Invalid request parameters
- **ServiceQuotaExceededException**: AWS service quota exceeded

All AWS errors are logged with specific error types for debugging.

## Deployment

### AWS Lambda + API Gateway (Recommended)

Deploy using AWS SAM:

```bash
# Set agent ARNs
export ONBOARDING_AGENT_ARN="arn:aws:bedrock:us-east-1:ACCOUNT:agent/ID"
export PROVISIONING_AGENT_ARN="arn:aws:bedrock:us-east-1:ACCOUNT:agent/ID"
export MWC_AGENT_ARN="arn:aws:bedrock:us-east-1:ACCOUNT:agent/ID"

# Deploy
./deploy.sh
```

See [DEPLOYMENT-GUIDE.md](DEPLOYMENT-GUIDE.md) for detailed instructions.

### Docker

Build and run with Docker:

```bash
docker build -t agent-ui-api .
docker run -p 3001:3001 --env-file .env agent-ui-api
```

### ECS Fargate

Deploy as a containerized service on ECS Fargate for production workloads.

### Quick Reference

- **Deploy**: `./deploy.sh`
- **Test**: `./test-deployment.sh`
- **Logs**: `npm run logs`
- **Destroy**: `npm run destroy`

See [DEPLOYMENT-QUICK-REFERENCE.md](DEPLOYMENT-QUICK-REFERENCE.md) for more commands.

## Testing

Run tests:

```bash
npm test
```

## License

MIT
