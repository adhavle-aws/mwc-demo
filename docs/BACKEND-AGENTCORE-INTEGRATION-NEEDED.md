# Backend AgentCore Integration - Action Required

## Current Status

✅ **Agents Working**: OnboardingAgent tested successfully via `agentcore invoke`
✅ **Frontend Deployed**: UI live at https://main.d1xmxq6v1dckl6.amplifyapp.com
⚠️ **Backend API**: Using wrong SDK - needs AgentCore WebSocket integration

## The Problem

The backend API (`api/src/services/agentService.ts`) is using `BedrockAgentRuntimeClient` which is for standard Bedrock Agents. However, our agents are deployed to **Bedrock AgentCore**, which uses a completely different invocation method:

- **Standard Bedrock Agents**: REST API via `bedrock-agent-runtime:InvokeAgent`
- **AgentCore Agents**: WebSocket connections via `bedrock-agentcore` service

## What Needs to Change

### Current Implementation (Wrong)
```typescript
// api/src/services/agentService.ts
import { BedrockAgentRuntimeClient, InvokeAgentCommand } from '@aws-sdk/client-bedrock-agent-runtime';

// This doesn't work with AgentCore!
const command = new InvokeAgentCommand(input);
const response = await this.client.send(command);
```

### Required Implementation (Correct)
AgentCore agents are invoked via WebSocket:

1. **Generate WebSocket URL** with SigV4 authentication
2. **Connect to WebSocket** endpoint
3. **Send JSON payload** with prompt
4. **Stream response** chunks via WebSocket
5. **Close connection** when done

## Solution Options

### Option 1: Use AgentCore Python SDK (Recommended)

Rewrite the backend in Python to use the `bedrock_agentcore` SDK:

```python
from bedrock_agentcore.runtime import AgentCoreRuntimeClient

client = AgentCoreRuntimeClient(region='us-east-1')
ws_url, headers = client.generate_ws_connection(
    runtime_arn='arn:aws:bedrock-agentcore:us-east-1:905767016260:runtime/OnboardingAgent_Agent-Pgs8nUGuuS',
    endpoint_name='DEFAULT'
)

# Connect via WebSocket and stream response
```

### Option 2: Implement WebSocket Client in Node.js

Create a WebSocket client that:
1. Generates SigV4 signed WebSocket URL
2. Connects to AgentCore runtime endpoint
3. Handles streaming responses

This requires:
- AWS SigV4 signing for WebSocket URLs
- WebSocket client library (ws)
- Proper header formatting
- Stream handling

### Option 3: Direct CLI Integration

Use the `agentcore invoke` CLI directly from the backend:

```typescript
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

async function invokeAgent(agentName: string, prompt: string) {
  const { stdout } = await execAsync(
    `cd ${agentName} && agentcore invoke '{"prompt":"${prompt}"}'`
  );
  return stdout;
}
```

## Immediate Workaround

For now, the agents work perfectly via the AgentCore CLI:

```bash
cd OnboardingAgent
agentcore invoke '{"prompt":"Create a simple S3 bucket"}'
```

This produces clean, properly formatted responses.

## Recommendation

**Rewrite the backend to use AgentCore WebSocket API** or **use the agentcore CLI directly** from the backend.

The current Bedrock Agent Runtime SDK approach won't work with AgentCore agents.

## Task 37 Status

Task 37 (deployment) is complete:
- ✅ Backend API deployed (but needs AgentCore integration)
- ✅ Frontend UI deployed
- ✅ Agents deployed and working via CLI

**Next Task**: Integrate backend with AgentCore WebSocket API (new task, not part of Task 37)

## Testing

Agents work correctly:
```bash
cd OnboardingAgent
agentcore invoke '{"prompt":"Generate a cloudformation template for a simple S3 bucket"}'
```

Response is clean and properly formatted with:
- CloudFormation template in YAML
- Architecture overview
- Cost optimization tips
- Quick summary

The issue is purely in the backend API integration layer.
