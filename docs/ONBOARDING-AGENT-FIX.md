# OnboardingAgent Issue Resolution

## Problem Summary

The OnboardingAgent was deployed to AWS Bedrock AgentCore and working correctly via CLI, but responses through the AWS Console and backend API were showing messy SSE-formatted output like:

```
data: "Base"data: "d on your requirements"data: ", I'll create"...
```

## Root Cause Analysis

### Issue 1: Wrong SDK
The backend API was using `@aws-sdk/client-bedrock-agent-runtime` which is for **Bedrock Agents** (legacy service), NOT **Bedrock AgentCore**.

- ❌ BedrockAgentRuntimeClient doesn't work with AgentCore
- ❌ Different API endpoints and protocols
- ❌ AgentCore requires WebSocket connections with SigV4 signing

### Issue 2: SSE Format Not Parsed
AgentCore streams responses in Server-Sent Events (SSE) format:
```
data: "text chunk"
```

The backend was:
1. Receiving raw SSE chunks (which it couldn't because wrong SDK)
2. Not parsing the `data: ` prefix
3. Wrapping again in SSE format for frontend
4. Result: Double-wrapped messy output

## Solution Implemented

### 1. Created AgentCore WebSocket Client
**File**: `api/src/services/agentCoreClient.ts`

Features:
- ✅ WebSocket connection to AgentCore runtime endpoints
- ✅ SigV4 signing for authentication
- ✅ SSE message parsing (`data: "text"` → `text`)
- ✅ Async streaming generator
- ✅ Proper error handling

### 2. Updated Agent Service
**File**: `api/src/services/agentService.ts`

Changes:
- ❌ Removed `BedrockAgentRuntimeClient`
- ✅ Added `AgentCoreClient`
- ✅ Simplified invocation logic
- ✅ Clean text streaming

### 3. Updated Dependencies
**File**: `api/package.json`

Added:
- `@aws-sdk/signature-v4` - SigV4 signing
- `@aws-sdk/protocol-http` - HTTP request signing
- `@aws-sdk/credential-provider-node` - AWS credentials
- `@aws-crypto/sha256-js` - SHA256 hashing
- `ws` - WebSocket client
- `@types/ws` - TypeScript types

Removed:
- `@aws-sdk/client-bedrock-agent-runtime` - Wrong SDK

## How It Works Now

### Request Flow:
1. Frontend sends prompt to `/api/agents/invoke`
2. Backend creates WebSocket connection to AgentCore
3. Backend signs connection with SigV4
4. Backend sends prompt via WebSocket
5. AgentCore streams response in SSE format
6. Backend parses SSE chunks and extracts clean text
7. Backend streams clean text to frontend
8. Frontend displays properly formatted response

### SSE Parsing:
```typescript
// Input from AgentCore
"data: \"Based on your requirements\""

// Parsed output to frontend
"Based on your requirements"
```

## Next Steps

### 1. Install Dependencies
```bash
cd api
npm install
```

### 2. Set Environment Variables
Create `api/.env`:
```bash
AWS_REGION=us-east-1
ONBOARDING_AGENT_ARN=arn:aws:bedrock-agentcore:us-east-1:905767016260:runtime/OnboardingAgent_Agent-Pgs8nUGuuS
PROVISIONING_AGENT_ARN=arn:aws:bedrock-agentcore:us-east-1:ACCOUNT:runtime/ProvisioningAgent_Agent-ID
MWC_AGENT_ARN=arn:aws:bedrock-agentcore:us-east-1:ACCOUNT:runtime/MWCAgent_Agent-ID
CORS_ORIGIN=http://localhost:5173
```

### 3. Test Locally
```bash
cd api
npm run dev
```

Test with:
```bash
curl -X POST http://localhost:3001/api/agents/invoke \
  -H "Content-Type: application/json" \
  -d '{
    "agentId": "onboarding",
    "prompt": "Generate a simple S3 bucket CloudFormation template"
  }'
```

### 4. Deploy to AWS
```bash
cd api
npm run build
npm run deploy
```

## Verification

### Test OnboardingAgent:
```bash
# Via CLI (should work)
cd OnboardingAgent
agentcore invoke "Generate a simple S3 bucket template"

# Via API (should now work)
curl -X POST https://your-api-endpoint/api/agents/invoke \
  -H "Content-Type: application/json" \
  -d '{
    "agentId": "onboarding",
    "prompt": "Generate a simple S3 bucket template"
  }'
```

### Expected Output:
Clean, properly formatted CloudFormation template with:
- ✅ No `data: ` prefixes
- ✅ Proper markdown formatting
- ✅ Complete sentences
- ✅ Readable structure

## Technical Details

### AgentCore WebSocket URL Format:
```
wss://bedrock-agentcore-runtime.{region}.amazonaws.com/runtimes/{encoded_arn}/ws
```

### Required Headers:
- `x-amzn-bedrock-agentcore-session-id`: Session identifier
- SigV4 signature parameters in query string

### SSE Message Format:
```
data: "content chunk"

data: "another chunk"

```

## References

- [AgentCore Documentation](https://docs.aws.amazon.com/bedrock/latest/userguide/agentcore.html)
- [WebSocket SigV4 Signing](https://docs.aws.amazon.com/general/latest/gr/sigv4-signed-request-examples.html)
- [Server-Sent Events Spec](https://html.spec.whatwg.org/multipage/server-sent-events.html)

## Status

- ✅ Root cause identified
- ✅ Solution implemented
- ⏳ Dependencies need installation
- ⏳ Testing required
- ⏳ Deployment pending
