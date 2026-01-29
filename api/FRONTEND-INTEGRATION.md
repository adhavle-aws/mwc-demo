# Frontend Integration Guide

This guide explains how to connect the Agent UI frontend to the backend API.

## Backend Setup

1. **Start the backend API:**
   ```bash
   cd api
   npm run dev
   ```

   The API will be available at `http://localhost:3001`

2. **Verify the API is running:**
   ```bash
   curl http://localhost:3001/health
   ```

   You should see:
   ```json
   {
     "status": "healthy",
     "timestamp": "2024-01-29T...",
     "environment": "development"
   }
   ```

## Frontend Configuration

1. **Update frontend environment variables:**

   Edit `agent-ui/.env`:
   ```env
   VITE_API_ENDPOINT=http://localhost:3001
   ```

2. **Update the agent service:**

   The frontend's `agent-ui/src/services/agentService.ts` should use the API endpoint:

   ```typescript
   const API_ENDPOINT = import.meta.env.VITE_API_ENDPOINT || 'http://localhost:3001';

   // List agents
   export async function listAgents(): Promise<Agent[]> {
     const response = await fetch(`${API_ENDPOINT}/api/agents/list`);
     const data = await response.json();
     return data.agents;
   }

   // Get agent status
   export async function getAgentStatus(agentId: string): Promise<AgentStatusResponse> {
     const response = await fetch(`${API_ENDPOINT}/api/agents/status/${agentId}`);
     return response.json();
   }

   // Invoke agent with streaming
   export async function invokeAgent(
     agentId: string,
     prompt: string,
     onChunk: (chunk: string) => void,
     onComplete: () => void,
     onError: (error: string) => void
   ): Promise<void> {
     const response = await fetch(`${API_ENDPOINT}/api/agents/invoke`, {
       method: 'POST',
       headers: { 'Content-Type': 'application/json' },
       body: JSON.stringify({ agentId, prompt }),
     });

     const reader = response.body?.getReader();
     const decoder = new TextDecoder();

     if (!reader) {
       onError('No response stream');
       return;
     }

     try {
       while (true) {
         const { done, value } = await reader.read();
         if (done) break;

         const text = decoder.decode(value);
         const lines = text.split('\n');

         for (const line of lines) {
           if (line.startsWith('data: ')) {
             const data = JSON.parse(line.slice(6));
             
             if (data.chunk) {
               onChunk(data.chunk);
             } else if (data.done) {
               onComplete();
             } else if (data.error) {
               onError(data.error);
             }
           }
         }
       }
     } catch (error: any) {
       onError(error.message);
     }
   }

   // Get CloudFormation stack status
   export async function getStackStatus(stackName: string): Promise<StackStatusResponse> {
     const response = await fetch(`${API_ENDPOINT}/api/stacks/status/${stackName}`);
     return response.json();
   }
   ```

## Testing the Integration

1. **Start both servers:**

   Terminal 1 (Backend):
   ```bash
   cd api
   npm run dev
   ```

   Terminal 2 (Frontend):
   ```bash
   cd agent-ui
   npm run dev
   ```

2. **Open the frontend:**
   ```
   http://localhost:5173
   ```

3. **Test the flow:**
   - Select an agent from the side navigation
   - Type a message in the chat input
   - Click send
   - Watch the streaming response appear in real-time
   - Verify tabs are created based on the response

## API Endpoints Reference

### List Agents
```
GET /api/agents/list
Response: { agents: Agent[] }
```

### Get Agent Status
```
GET /api/agents/status/:agentId
Response: AgentStatusResponse
```

### Invoke Agent (Streaming)
```
POST /api/agents/invoke
Body: { agentId: string, prompt: string, sessionId?: string }
Response: Server-Sent Events stream
```

### Get Stack Status
```
GET /api/stacks/status/:stackName
Response: StackStatusResponse
```

## Error Handling

All API errors return:
```json
{
  "error": "ErrorType",
  "message": "Human-readable message",
  "details": {}
}
```

Handle errors in the frontend:
```typescript
try {
  const agents = await listAgents();
} catch (error: any) {
  if (error.response) {
    // API error
    const apiError = await error.response.json();
    console.error('API Error:', apiError.message);
  } else {
    // Network error
    console.error('Network Error:', error.message);
  }
}
```

## CORS Configuration

The backend is configured to accept requests from `http://localhost:5173` by default.

If you change the frontend port, update the backend `.env`:
```env
CORS_ORIGIN=http://localhost:YOUR_PORT
```

## Production Deployment

### Backend Deployment

Deploy the backend to AWS Lambda, ECS, or Amplify and get the production URL.

### Frontend Configuration

Update the frontend production environment:
```env
VITE_API_ENDPOINT=https://your-api-domain.com
```

### CORS Update

Update the backend production `.env`:
```env
CORS_ORIGIN=https://your-frontend-domain.com
```

## Troubleshooting

### CORS Errors
- Check that `CORS_ORIGIN` in backend `.env` matches frontend URL
- Restart backend after changing `.env`

### Connection Refused
- Verify backend is running on port 3001
- Check firewall settings

### Streaming Not Working
- Verify browser supports Server-Sent Events
- Check network tab for streaming response
- Ensure proper headers are set

### Agent Invocation Fails
- Verify agent ARNs are configured in backend `.env`
- Check AWS credentials are valid
- Verify IAM permissions for `bedrock:InvokeAgent`

## Example Integration Test

```typescript
// Test the complete flow
async function testIntegration() {
  // 1. List agents
  const agents = await listAgents();
  console.log('Agents:', agents);

  // 2. Check agent status
  const status = await getAgentStatus('onboarding');
  console.log('Status:', status);

  // 3. Invoke agent
  let response = '';
  await invokeAgent(
    'onboarding',
    'Design a simple serverless API',
    (chunk) => {
      response += chunk;
      console.log('Chunk:', chunk);
    },
    () => {
      console.log('Complete!');
      console.log('Full response:', response);
    },
    (error) => {
      console.error('Error:', error);
    }
  );
}
```

## Next Steps

1. Update frontend `agentService.ts` to use the backend API
2. Test all agent interactions
3. Implement error handling in the UI
4. Add loading states during API calls
5. Test CloudFormation stack monitoring
6. Deploy both frontend and backend to production
