# Requirements Document: Backend AgentCore Integration

## Introduction

This document specifies the requirements for integrating the backend API with AWS Bedrock AgentCore Runtime. The current backend uses the Bedrock Agent Runtime SDK which is incompatible with AgentCore agents. This integration will enable the backend to properly invoke AgentCore agents via WebSocket connections and stream responses to the frontend.

## Glossary

- **AgentCore**: AWS Bedrock AgentCore platform for deploying and running AI agents
- **Backend_API**: The Express.js/Lambda API that mediates between frontend and agents
- **WebSocket**: Bidirectional communication protocol used by AgentCore Runtime
- **SigV4**: AWS Signature Version 4 authentication protocol
- **Runtime_ARN**: Amazon Resource Name for an AgentCore runtime instance
- **SSE**: Server-Sent Events format for streaming responses
- **Agent_Service**: Backend service responsible for agent invocation

## Requirements

### Requirement 1: WebSocket Connection to AgentCore

**User Story:** As a backend service, I want to connect to AgentCore agents via WebSocket, so that I can invoke agents and receive streaming responses.

#### Acceptance Criteria

1. THE Backend_API SHALL generate SigV4-signed WebSocket URLs for AgentCore runtime connections
2. WHEN connecting to an AgentCore agent, THE Backend_API SHALL include required headers (session ID, authorization, WebSocket upgrade headers)
3. THE Backend_API SHALL establish WebSocket connections to AgentCore runtime endpoints
4. WHEN a WebSocket connection fails, THE Backend_API SHALL return an appropriate error message
5. THE Backend_API SHALL close WebSocket connections after receiving complete responses

### Requirement 2: Agent Invocation via WebSocket

**User Story:** As a backend service, I want to send prompts to AgentCore agents via WebSocket, so that agents can process requests.

#### Acceptance Criteria

1. WHEN invoking an agent, THE Backend_API SHALL send a JSON payload containing the prompt via WebSocket
2. THE Backend_API SHALL include a session ID for conversation continuity
3. WHEN an agent is not found, THE Backend_API SHALL return a 404 error
4. WHEN an agent ARN is invalid, THE Backend_API SHALL return a 400 error with validation details
5. THE Backend_API SHALL support all three agents (OnboardingAgent, ProvisioningAgent, MWCAgent)

### Requirement 3: Streaming Response Handling

**User Story:** As a backend service, I want to receive and forward streaming responses from AgentCore agents, so that the frontend can display real-time updates.

#### Acceptance Criteria

1. WHEN an AgentCore agent streams a response, THE Backend_API SHALL receive WebSocket messages incrementally
2. THE Backend_API SHALL parse SSE-formatted messages from AgentCore (data: prefix format)
3. THE Backend_API SHALL concatenate streaming chunks into a complete response
4. WHEN streaming completes, THE Backend_API SHALL return the full response to the frontend
5. WHEN streaming is interrupted, THE Backend_API SHALL handle the error gracefully and return partial results

### Requirement 4: AWS Authentication and Authorization

**User Story:** As a backend service, I want to authenticate with AgentCore using AWS credentials, so that I can securely invoke agents.

#### Acceptance Criteria

1. THE Backend_API SHALL use AWS SigV4 to sign WebSocket connection requests
2. THE Backend_API SHALL include AWS security tokens in WebSocket headers when using temporary credentials
3. THE Backend_API SHALL have IAM permissions for bedrock-agentcore service
4. WHEN AWS credentials are invalid or expired, THE Backend_API SHALL return a 401 error
5. THE Backend_API SHALL use the Lambda execution role's credentials automatically

### Requirement 5: Session Management

**User Story:** As a backend service, I want to manage agent sessions, so that conversations can maintain context across multiple requests.

#### Acceptance Criteria

1. THE Backend_API SHALL generate unique session IDs for new conversations
2. WHEN a session ID is provided in the request, THE Backend_API SHALL use it for the AgentCore invocation
3. THE Backend_API SHALL return the session ID in the response for frontend tracking
4. THE Backend_API SHALL support multiple concurrent sessions for different users
5. WHEN a session ID is invalid, THE Backend_API SHALL create a new session

### Requirement 6: Error Handling and Resilience

**User Story:** As a backend service, I want to handle AgentCore errors gracefully, so that the frontend receives meaningful error messages.

#### Acceptance Criteria

1. WHEN an AgentCore runtime is unavailable, THE Backend_API SHALL return a 503 error with retry guidance
2. WHEN a WebSocket connection times out, THE Backend_API SHALL return a 504 error
3. WHEN an agent returns an error, THE Backend_API SHALL forward the error details to the frontend
4. THE Backend_API SHALL log all errors to CloudWatch for debugging
5. WHEN network errors occur, THE Backend_API SHALL implement retry logic with exponential backoff

### Requirement 7: Runtime Endpoint Resolution

**User Story:** As a backend service, I want to resolve AgentCore runtime endpoints from ARNs, so that I can connect to the correct agent instances.

#### Acceptance Criteria

1. THE Backend_API SHALL parse AgentCore runtime ARNs to extract region, account, and runtime ID
2. THE Backend_API SHALL construct WebSocket URLs in the format: wss://{endpoint}/runtimes/{encoded_arn}/ws
3. THE Backend_API SHALL use the correct data plane endpoint for the agent's region
4. WHEN an ARN format is invalid, THE Backend_API SHALL return a 400 error with validation details
5. THE Backend_API SHALL support the endpoint qualifier parameter (DEFAULT)

### Requirement 8: Response Format Compatibility

**User Story:** As a backend service, I want to return responses in a format compatible with the frontend, so that the UI can display agent responses correctly.

#### Acceptance Criteria

1. THE Backend_API SHALL return agent responses as JSON with a "response" field containing the full text
2. THE Backend_API SHALL include the session ID in the response
3. THE Backend_API SHALL preserve the original formatting of agent responses (markdown, code blocks, XML tags)
4. WHEN an agent returns structured data, THE Backend_API SHALL pass it through without modification
5. THE Backend_API SHALL maintain backward compatibility with the existing API contract

### Requirement 9: Performance and Scalability

**User Story:** As a backend service, I want to handle agent invocations efficiently, so that the system can scale to multiple users.

#### Acceptance Criteria

1. THE Backend_API SHALL reuse WebSocket connections when possible for the same session
2. THE Backend_API SHALL handle concurrent agent invocations without blocking
3. THE Backend_API SHALL implement connection pooling for AgentCore WebSocket connections
4. WHEN Lambda cold starts occur, THE Backend_API SHALL establish connections within 5 seconds
5. THE Backend_API SHALL close idle WebSocket connections after 5 minutes

### Requirement 10: Logging and Observability

**User Story:** As a developer, I want comprehensive logging of agent invocations, so that I can debug issues and monitor performance.

#### Acceptance Criteria

1. THE Backend_API SHALL log all agent invocation requests with agent ID, prompt length, and session ID
2. THE Backend_API SHALL log WebSocket connection establishment and closure
3. THE Backend_API SHALL log response streaming metrics (chunks received, total size, duration)
4. WHEN errors occur, THE Backend_API SHALL log full error details including stack traces
5. THE Backend_API SHALL emit CloudWatch metrics for invocation count, duration, and error rate

## Technical Constraints

1. **Language**: Backend must use a language with AgentCore SDK support (Python recommended, Node.js requires custom implementation)
2. **WebSocket Support**: Lambda + API Gateway has limitations for WebSocket connections (consider using Lambda with function URLs or ECS)
3. **Timeout**: Lambda has 15-minute maximum timeout for WebSocket connections
4. **Dependencies**: Must include AgentCore SDK and WebSocket client libraries
5. **IAM Permissions**: Requires `bedrock-agentcore:InvokeAgent` permission (not `bedrock:InvokeAgent`)

## Out of Scope

- Frontend changes (frontend already supports streaming)
- Agent modifications (agents work correctly)
- UI deployment (already complete)
- Authentication/authorization beyond AWS IAM

## Success Criteria

1. Backend can invoke all three AgentCore agents successfully
2. Streaming responses work end-to-end from agent to frontend
3. Error handling provides meaningful messages
4. Performance meets targets (< 2s for first chunk)
5. All existing API endpoints continue to work
6. Frontend requires no changes

## Dependencies

- AgentCore agents deployed and operational (✅ Complete)
- Frontend UI deployed (✅ Complete)
- AWS credentials with AgentCore permissions (✅ Complete)

## Priority

**HIGH** - The application is deployed but non-functional without this integration.
