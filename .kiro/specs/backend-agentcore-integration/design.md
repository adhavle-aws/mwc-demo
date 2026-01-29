# Design Document: Backend AgentCore Integration

## Overview

This design document specifies the architecture and implementation approach for integrating the backend API with AWS Bedrock AgentCore Runtime. The current implementation uses the Bedrock Agent Runtime SDK (`@aws-sdk/client-bedrock-agent-runtime`), which is incompatible with AgentCore agents that require WebSocket connections.

### Current State

The backend currently:
- Uses `BedrockAgentRuntimeClient` from AWS SDK v3
- Attempts to invoke agents using `InvokeAgentCommand`
- Expects streaming responses via the SDK's async iterator pattern
- Extracts agent IDs from AgentCore ARNs incorrectly

### Target State

The backend will:
- Establish WebSocket connections to AgentCore runtime endpoints
- Use SigV4 signing for WebSocket authentication
- Send prompts as JSON payloads over WebSocket
- Receive and parse SSE-formatted streaming responses
- Maintain session continuity across requests
- Provide the same API contract to the frontend (no frontend changes required)

### Design Rationale

**Why WebSocket instead of HTTP?** AgentCore Runtime uses WebSocket for bidirectional streaming communication. This allows agents to send incremental responses and maintain long-running conversations.

**Why custom implementation instead of SDK?** As of this design, there is no official AWS SDK for AgentCore Runtime WebSocket connections. The Bedrock Agent Runtime SDK only supports the older agent architecture.

**Why keep the same API contract?** The frontend is already deployed and working. Maintaining backward compatibility eliminates the need for frontend changes and reduces deployment risk.

## Architecture

### High-Level Architecture

```
┌─────────────┐         HTTPS          ┌──────────────────┐
│   Frontend  │ ◄──────────────────────► │   API Gateway   │
│   (React)   │      (REST/SSE)         │   + Lambda      │
└─────────────┘                         └────────┬─────────┘
                                                 │
                                                 │ WebSocket
                                                 │ (SigV4 signed)
                                                 ▼
                                        ┌──────────────────┐
                                        │  AgentCore       │
                                        │  Runtime         │
                                        │  (WebSocket)     │
                                        └────────┬─────────┘
                                                 │
                                    ┌────────────┼────────────┐
                                    ▼            ▼            ▼
                              ┌──────────┐ ┌──────────┐ ┌──────────┐
                              │Onboarding│ │Provision │ │   MWC    │
                              │  Agent   │ │  Agent   │ │  Agent   │
                              └──────────┘ └──────────┘ └──────────┘
```

### Component Interaction Flow

```
Frontend                Backend API              AgentCore Runtime
   │                        │                           │
   │  POST /api/agents/     │                           │
   │  invoke                │                           │
   ├───────────────────────►│                           │
   │                        │                           │
   │                        │  1. Generate SigV4        │
   │                        │     signed WS URL         │
   │                        │                           │
   │                        │  2. Establish WebSocket   │
   │                        ├──────────────────────────►│
   │                        │                           │
   │                        │  3. Send JSON payload     │
   │                        │     with prompt           │
   │                        ├──────────────────────────►│
   │                        │                           │
   │                        │  4. Receive SSE chunks    │
   │                        │◄──────────────────────────┤
   │                        │     (streaming)           │
   │                        │                           │
   │  5. Return complete    │                           │
   │     response           │                           │
   │◄───────────────────────┤                           │
   │                        │                           │
   │                        │  6. Close WebSocket       │
   │                        ├──────────────────────────►│
```

## Components and Interfaces

### 1. AgentCoreClient

A new client class that handles WebSocket communication with AgentCore Runtime.

**Responsibilities:**
- Generate SigV4-signed WebSocket URLs
- Establish and manage WebSocket connections
- Send invocation requests
- Receive and parse streaming responses
- Handle connection lifecycle (open, message, error, close)

**Interface:**
```typescript
class AgentCoreClient {
  constructor(region: string, credentials?: AWSCredentials);
  
  /**
   * Invoke an AgentCore agent via WebSocket
   * @param runtimeArn - Full ARN of the AgentCore runtime
   * @param prompt - User prompt to send to the agent
   * @param sessionId - Optional session ID for conversation continuity
   * @returns Promise resolving to the complete agent response
   */
  async invokeAgent(
    runtimeArn: string,
    prompt: string,
    sessionId?: string
  ): Promise<AgentInvocationResponse>;
  
  /**
   * Generate a SigV4-signed WebSocket URL
   * @param runtimeArn - Full ARN of the AgentCore runtime
   * @param sessionId - Session ID for the connection
   * @returns Signed WebSocket URL
   */
  private generateSignedWebSocketUrl(
    runtimeArn: string,
    sessionId: string
  ): string;
  
  /**
   * Parse AgentCore runtime ARN to extract components
   * @param arn - Full runtime ARN
   * @returns Parsed ARN components
   */
  private parseRuntimeArn(arn: string): RuntimeArnComponents;
  
  /**
   * Establish WebSocket connection
   * @param url - Signed WebSocket URL
   * @param sessionId - Session ID for headers
   * @returns WebSocket connection
   */
  private async connectWebSocket(
    url: string,
    sessionId: string
  ): Promise<WebSocket>;
  
  /**
   * Send invocation payload via WebSocket
   * @param ws - WebSocket connection
   * @param payload - Invocation payload
   */
  private sendInvocationPayload(
    ws: WebSocket,
    payload: InvocationPayload
  ): void;
  
  /**
   * Receive and parse streaming response
   * @param ws - WebSocket connection
   * @returns Promise resolving to complete response
   */
  private async receiveStreamingResponse(
    ws: WebSocket
  ): Promise<string>;
  
  /**
   * Parse SSE-formatted message
   * @param message - Raw message from WebSocket
   * @returns Parsed content or null
   */
  private parseSSEMessage(message: string): string | null;
}
```

### 2. Updated AgentService

The existing `AgentService` will be refactored to use `AgentCoreClient` instead of `BedrockAgentRuntimeClient`.

**Changes:**
- Replace `BedrockAgentRuntimeClient` with `AgentCoreClient`
- Update `invokeAgent()` to use WebSocket-based invocation
- Remove streaming iterator pattern (AgentCore returns complete responses)
- Keep the same public interface for backward compatibility

**Interface (unchanged from frontend perspective):**
```typescript
class AgentService {
  constructor();
  
  getAgents(): Agent[];
  getAgentById(agentId: string): Agent | undefined;
  
  /**
   * Invoke an agent and return response
   * Note: Return type changes from AsyncIterable to Promise
   */
  async invokeAgent(
    agentId: string,
    prompt: string,
    sessionId?: string
  ): Promise<string>;
  
  async getAgentStatus(agentId: string): Promise<AgentStatusResponse>;
  
  private generateSessionId(): string;
  private handleError(error: any, agentId: string): void;
}
```

### 3. WebSocket Utilities

Helper functions for WebSocket operations and SigV4 signing.

**Functions:**
```typescript
/**
 * Generate SigV4 signature for WebSocket URL
 */
function generateSigV4Signature(
  url: string,
  region: string,
  credentials: AWSCredentials,
  sessionId: string
): string;

/**
 * Encode ARN for URL path
 */
function encodeArnForUrl(arn: string): string;

/**
 * Create WebSocket connection with timeout
 */
function createWebSocketWithTimeout(
  url: string,
  headers: Record<string, string>,
  timeoutMs: number
): Promise<WebSocket>;

/**
 * Wait for WebSocket message with timeout
 */
function waitForMessage(
  ws: WebSocket,
  timeoutMs: number
): Promise<string>;
```

### 4. Updated Route Handler

The `/api/agents/invoke` endpoint will be updated to handle the new response format.

**Changes:**
- Remove SSE streaming logic (AgentCore returns complete responses)
- Add error handling for WebSocket-specific errors
- Maintain the same request/response format

**Handler:**
```typescript
router.post('/invoke', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { agentId, prompt, sessionId } = req.body;
    
    // Validate request
    if (!agentId || !prompt) {
      return res.status(400).json({
        error: 'ValidationError',
        message: 'agentId and prompt are required'
      });
    }
    
    // Invoke agent (now returns complete response)
    const response = await agentService.invokeAgent(agentId, prompt, sessionId);
    
    // Return response
    res.json({
      response,
      sessionId: sessionId || agentService.generateSessionId()
    });
  } catch (error) {
    next(error);
  }
});
```

## Data Models

### RuntimeArnComponents

```typescript
interface RuntimeArnComponents {
  region: string;        // e.g., "us-east-1"
  accountId: string;     // e.g., "123456789012"
  runtimeId: string;     // e.g., "OnboardingAgent_Agent-Pgs8nUGuuS"
  encodedArn: string;    // URL-encoded full ARN
}
```

### InvocationPayload

```typescript
interface InvocationPayload {
  prompt: string;
  sessionId: string;
  // Additional fields as required by AgentCore
}
```

### AgentInvocationResponse

```typescript
interface AgentInvocationResponse {
  response: string;      // Complete agent response
  sessionId: string;     // Session ID for continuity
  metadata?: {
    chunks: number;      // Number of chunks received
    duration: number;    // Total duration in ms
  };
}
```

### WebSocket Message Format

**Outgoing (to AgentCore):**
```json
{
  "prompt": "User prompt text",
  "sessionId": "session-1234567890-abc123"
}
```

**Incoming (from AgentCore):**
```
data: {"chunk": "First part of response"}

data: {"chunk": "Second part of response"}

data: {"chunk": "Final part of response"}

data: [DONE]
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: WebSocket URL Generation Consistency
*For any* valid AgentCore runtime ARN and session ID, generating a signed WebSocket URL twice with the same credentials and timestamp should produce identical URLs.

**Validates: Requirements 1.1, 7.2**

### Property 2: ARN Parsing Round-Trip
*For any* valid AgentCore runtime ARN, parsing the ARN to extract components and then reconstructing the URL path should preserve the original ARN structure.

**Validates: Requirements 7.1, 7.4**

### Property 3: Session ID Uniqueness
*For any* two consecutive calls to generate a session ID, the generated IDs should be distinct.

**Validates: Requirements 5.1**

### Property 4: Session ID Preservation
*For any* agent invocation with a provided session ID, the response should contain the same session ID that was sent in the request.

**Validates: Requirements 5.2, 5.3**

### Property 5: Error Response Structure
*For any* error condition (invalid ARN, connection failure, timeout), the error response should contain an error code, message, and appropriate HTTP status code.

**Validates: Requirements 6.1, 6.2, 6.3**

### Property 6: SSE Message Parsing Idempotence
*For any* valid SSE-formatted message, parsing it multiple times should yield the same extracted content.

**Validates: Requirements 3.2**

### Property 7: Response Concatenation Order
*For any* sequence of streaming chunks, concatenating them in the order received should produce a coherent response that preserves the original message structure.

**Validates: Requirements 3.3**

### Property 8: WebSocket Connection Cleanup
*For any* agent invocation (successful or failed), the WebSocket connection should be closed after the operation completes.

**Validates: Requirements 1.5**

### Property 9: Backward Compatibility
*For any* valid request to the `/api/agents/invoke` endpoint, the response structure should match the existing API contract (containing `response` and `sessionId` fields).

**Validates: Requirements 8.1, 8.2, 8.5**

### Property 10: Concurrent Invocation Independence
*For any* two concurrent agent invocations with different session IDs, the responses should not interfere with each other and should be correctly associated with their respective sessions.

**Validates: Requirements 5.4, 9.2**

## Error Handling

### Error Categories

1. **Validation Errors (400)**
   - Invalid agent ID
   - Missing required fields (prompt, agentId)
   - Malformed ARN format
   - Invalid session ID format

2. **Authentication Errors (401)**
   - Invalid AWS credentials
   - Expired credentials
   - Missing credentials

3. **Authorization Errors (403)**
   - Insufficient IAM permissions
   - Access denied to AgentCore runtime

4. **Not Found Errors (404)**
   - Agent ID not found in configuration
   - AgentCore runtime not found

5. **Timeout Errors (504)**
   - WebSocket connection timeout
   - Response streaming timeout
   - No response within timeout period

6. **Service Errors (503)**
   - AgentCore runtime unavailable
   - WebSocket connection refused
   - Service temporarily unavailable

7. **Internal Errors (500)**
   - Unexpected exceptions
   - WebSocket protocol errors
   - Message parsing failures

### Error Handling Strategy

**Retry Logic:**
- Implement exponential backoff for transient errors (503, 504)
- Maximum 3 retry attempts
- Initial delay: 1 second
- Backoff multiplier: 2x
- Maximum delay: 8 seconds

**Error Logging:**
- Log all errors to CloudWatch with full context
- Include: agent ID, session ID, error type, stack trace, request details
- Emit CloudWatch metrics for error rates by type

**Error Response Format:**
```typescript
interface ErrorResponse {
  error: string;           // Error code (e.g., "ValidationError")
  message: string;         // Human-readable message
  details?: {
    agentId?: string;
    sessionId?: string;
    retryable?: boolean;
    retryAfter?: number;   // Seconds to wait before retry
  };
}
```

### Graceful Degradation

- If WebSocket connection fails, return partial response if any chunks were received
- If streaming is interrupted, mark response as incomplete
- Provide meaningful error messages for debugging
- Never expose internal implementation details in error messages

## Testing Strategy

### Unit Tests

**AgentCoreClient Tests:**
- Test ARN parsing with valid and invalid ARNs
- Test SigV4 URL generation with various credentials
- Test SSE message parsing with different formats
- Test error handling for each error category
- Test session ID generation uniqueness
- Test WebSocket connection timeout handling

**AgentService Tests:**
- Test agent lookup by ID
- Test invocation with valid and invalid agents
- Test session ID handling (provided vs. generated)
- Test error propagation from AgentCoreClient
- Test backward compatibility with existing API

**Utility Function Tests:**
- Test ARN encoding for URLs
- Test WebSocket timeout wrapper
- Test message waiting with timeout
- Test SigV4 signature generation

### Property-Based Tests

Each correctness property must be implemented as a property-based test using a suitable testing library (e.g., `fast-check` for TypeScript).

**Configuration:**
- Minimum 100 iterations per property test
- Each test must reference its design document property number
- Tag format: `Feature: backend-agentcore-integration, Property {number}: {property_text}`

**Example Property Test:**
```typescript
// Feature: backend-agentcore-integration, Property 3: Session ID Uniqueness
test('generated session IDs are unique', () => {
  fc.assert(
    fc.property(fc.nat(1000), (iterations) => {
      const sessionIds = new Set<string>();
      for (let i = 0; i < iterations; i++) {
        const sessionId = generateSessionId();
        expect(sessionIds.has(sessionId)).toBe(false);
        sessionIds.add(sessionId);
      }
      return true;
    }),
    { numRuns: 100 }
  );
});
```

### Integration Tests

- Test end-to-end invocation with real AgentCore agents (in test environment)
- Test WebSocket connection establishment and closure
- Test streaming response handling
- Test concurrent invocations
- Test session continuity across multiple requests
- Test error scenarios (invalid credentials, network failures)

### Manual Testing

- Verify frontend can invoke all three agents
- Verify streaming responses display correctly in UI
- Verify error messages are user-friendly
- Verify session continuity in multi-turn conversations
- Verify performance meets targets (< 2s for first chunk)

## Implementation Notes

### WebSocket Library Selection

**Recommended:** `ws` library for Node.js
- Mature and well-maintained
- Supports custom headers for SigV4
- Works in Lambda environment
- Good error handling and timeout support

**Alternative:** `websocket` library
- More feature-rich but heavier
- May have compatibility issues in Lambda

### SigV4 Signing

**Recommended:** `@aws-sdk/signature-v4` package
- Official AWS SDK component
- Handles all SigV4 complexity
- Supports WebSocket URL signing
- Integrates with AWS credential providers

### Lambda Considerations

**Cold Start Optimization:**
- Initialize AgentCoreClient outside handler
- Reuse WebSocket connections when possible (same session)
- Use Lambda function URLs instead of API Gateway for WebSocket support

**Timeout Management:**
- Set Lambda timeout to 30 seconds (sufficient for most agent responses)
- Implement client-side timeout (25 seconds) to allow graceful error handling
- Close WebSocket connections before Lambda timeout

**Memory Configuration:**
- Minimum 512 MB for WebSocket operations
- Monitor memory usage and adjust if needed

### Environment Variables

```bash
# Required
AWS_REGION=us-east-1
ONBOARDING_AGENT_ARN=arn:aws:bedrock-agentcore:us-east-1:123456789012:runtime/OnboardingAgent_Agent-Pgs8nUGuuS
PROVISIONING_AGENT_ARN=arn:aws:bedrock-agentcore:us-east-1:123456789012:runtime/ProvisioningAgent_Agent-Abc123XyZ
MWC_AGENT_ARN=arn:aws:bedrock-agentcore:us-east-1:123456789012:runtime/MWCAgent_Agent-Def456UvW

# Optional (for local development)
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...
AWS_SESSION_TOKEN=...
```

### IAM Permissions

The Lambda execution role must have:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "bedrock-agentcore:InvokeAgent"
      ],
      "Resource": [
        "arn:aws:bedrock-agentcore:*:*:runtime/*"
      ]
    }
  ]
}
```

**Note:** The service name is `bedrock-agentcore`, not `bedrock`.

## Deployment Strategy

### Phase 1: Development and Testing
1. Implement `AgentCoreClient` class
2. Write unit tests for all components
3. Test locally with AgentCore agents
4. Verify WebSocket connections work

### Phase 2: Integration
1. Update `AgentService` to use `AgentCoreClient`
2. Update route handlers
3. Run integration tests
4. Verify backward compatibility

### Phase 3: Deployment
1. Update Lambda IAM permissions
2. Deploy to staging environment
3. Test with frontend in staging
4. Monitor CloudWatch logs and metrics
5. Deploy to production

### Phase 4: Validation
1. Verify all three agents work in production
2. Monitor error rates and latency
3. Validate session continuity
4. Confirm frontend requires no changes

### Rollback Plan

If issues occur:
1. Revert Lambda deployment to previous version
2. Verify frontend still works with old backend
3. Investigate issues in staging
4. Fix and redeploy

## Performance Targets

- **First Chunk Latency:** < 2 seconds from request to first response chunk
- **Total Response Time:** < 10 seconds for typical agent responses
- **WebSocket Connection Time:** < 1 second to establish connection
- **Concurrent Requests:** Support 10+ concurrent agent invocations
- **Error Rate:** < 1% for transient errors, 0% for implementation errors

## Monitoring and Observability

### CloudWatch Metrics

- `AgentInvocationCount` - Total invocations per agent
- `AgentInvocationDuration` - Time from request to complete response
- `AgentInvocationErrors` - Error count by type
- `WebSocketConnectionTime` - Time to establish WebSocket connection
- `StreamingChunkCount` - Number of chunks received per invocation
- `SessionContinuityRate` - Percentage of requests with valid session IDs

### CloudWatch Logs

Log the following events:
- Agent invocation start (agent ID, session ID, prompt length)
- WebSocket connection established
- Streaming chunks received (count, size)
- Agent invocation complete (duration, response size)
- Errors (full details, stack trace)
- WebSocket connection closed

### Alarms

- High error rate (> 5% over 5 minutes)
- High latency (> 5 seconds average over 5 minutes)
- WebSocket connection failures (> 10% over 5 minutes)
- Lambda timeout rate (> 1% over 5 minutes)

## Security Considerations

### Authentication
- Use AWS SigV4 for all WebSocket connections
- Never expose AWS credentials in logs or error messages
- Use Lambda execution role credentials (no hardcoded credentials)

### Authorization
- Verify IAM permissions before attempting invocation
- Use least-privilege IAM policies
- Restrict AgentCore access to specific runtime ARNs

### Data Protection
- Do not log sensitive user prompts or agent responses
- Sanitize error messages to remove internal details
- Use HTTPS for all frontend-backend communication

### Input Validation
- Validate all user inputs (agent ID, prompt, session ID)
- Sanitize prompts to prevent injection attacks
- Limit prompt length to prevent abuse

## Dependencies

### NPM Packages

```json
{
  "dependencies": {
    "ws": "^8.14.0",
    "@aws-sdk/signature-v4": "^3.0.0",
    "@aws-sdk/credential-providers": "^3.0.0"
  },
  "devDependencies": {
    "@types/ws": "^8.5.0",
    "fast-check": "^3.0.0"
  }
}
```

### AWS Services

- AWS Lambda (compute)
- API Gateway (HTTP endpoints)
- CloudWatch (logging and metrics)
- IAM (authentication and authorization)
- Bedrock AgentCore (agent runtime)

## Open Questions

1. **WebSocket Connection Pooling:** Should we implement connection pooling for the same session, or create a new connection for each request?
   - **Recommendation:** Start with new connection per request for simplicity. Add pooling if performance requires it.

2. **Streaming vs. Complete Response:** Should we maintain streaming to the frontend, or return complete responses?
   - **Recommendation:** Return complete responses initially. AgentCore responses are typically fast enough. Add streaming later if needed.

3. **Session Timeout:** How long should sessions remain valid?
   - **Recommendation:** Let AgentCore handle session timeout. Backend should not enforce timeout.

4. **Error Retry Strategy:** Should retries be automatic or require user action?
   - **Recommendation:** Automatic retries for transient errors (503, 504). User action for validation errors (400, 404).

## Future Enhancements

1. **Connection Pooling:** Reuse WebSocket connections for the same session
2. **Response Caching:** Cache agent responses for identical prompts
3. **Rate Limiting:** Implement per-user rate limiting
4. **Streaming to Frontend:** Add SSE streaming from backend to frontend
5. **Multi-Region Support:** Support AgentCore agents in multiple regions
6. **Metrics Dashboard:** Create CloudWatch dashboard for monitoring
7. **Load Testing:** Conduct load tests to determine scaling limits
