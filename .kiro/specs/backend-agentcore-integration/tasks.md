# Implementation Plan: Backend AgentCore Integration

## Overview

This implementation plan addresses the backend integration with AWS Bedrock AgentCore Runtime. The current implementation uses `@aws-sdk/client-bedrock-agentcore` SDK which appears to work but does not follow the design's mandate for custom WebSocket implementation with SigV4 signing.

## Current Status

✅ **Completed:**
- Basic AgentCoreClient using SDK approach
- SSE message parsing
- Session ID generation (33+ characters)
- Streaming response handling via SDK
- Integration with AgentService and routes

⚠️ **Design Deviation:**
- Using SDK instead of custom WebSocket implementation
- No manual SigV4 signing for WebSocket URLs
- No direct WebSocket connection management
- May work in practice but doesn't match design specification

## Decision Point

Before proceeding, we need to validate:
1. Does the SDK approach work reliably in production?
2. Should we keep the SDK approach (simpler) or implement custom WebSocket (design-compliant)?
3. Are there specific AgentCore features that require custom WebSocket implementation?

## Tasks

- [x] 1. Basic SDK-based implementation (COMPLETED)
  - Installed `@aws-sdk/client-bedrock-agentcore`
  - Created AgentCoreClient with SDK
  - Implemented SSE parsing
  - Fixed session ID generation (33+ characters)
  - _Requirements: 1.3, 2.1, 3.2, 5.1_

- [ ] 2. Set up testing infrastructure
  - Install testing dependencies (Jest, fast-check for property-based testing)
  - Configure Jest for TypeScript
  - Create test directory structure
  - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5_

- [ ] 3. Test current SDK implementation
  - [ ]* 3.1 Write unit tests for AgentCoreClient
    - Test SSE message parsing with various formats
    - Test session ID generation (33+ character requirement)
    - Test error handling
    - _Requirements: 3.2, 5.1_

  - [ ]* 3.2 Write property test for SSE message parsing
    - **Property 6: SSE Message Parsing Idempotence**
    - **Validates: Requirements 3.2**

  - [ ]* 3.3 Write property test for session ID uniqueness
    - **Property 3: Session ID Uniqueness**
    - **Validates: Requirements 5.1**

  - [ ]* 3.4 Write integration tests with real AgentCore agents
    - Test all three agents (OnboardingAgent, ProvisioningAgent, MWCAgent)
    - Test session continuity
    - Verify responses are properly formatted
    - _Requirements: 2.5, 5.2, 8.1_

- [ ] 4. Deploy and validate SDK approach
  - [ ] 4.1 Deploy to staging environment
    - Update Lambda with current implementation
    - Configure environment variables with AgentCore ARNs
    - Verify IAM permissions for bedrock-agentcore
    - _Requirements: 4.3, 4.5_

  - [ ] 4.2 Test from frontend UI
    - Invoke all three agents through UI
    - Verify streaming responses work
    - Test multi-turn conversations
    - Verify error handling
    - _Requirements: 2.5, 3.4, 8.5_

  - [ ] 4.3 Monitor and measure performance
    - Check CloudWatch logs for errors
    - Measure response times
    - Verify session continuity works
    - _Requirements: 10.1, 10.2, 10.3_

- [ ] 5. Decision: Keep SDK or implement custom WebSocket?
  - Evaluate SDK reliability in production
  - Assess if custom WebSocket implementation is needed
  - Document decision and rationale
  - Update design document if keeping SDK approach

## Alternative Path: Custom WebSocket Implementation (If SDK Fails)

- [ ] 6. Implement WebSocket utilities and SigV4 signing (ONLY IF NEEDED)
  - [ ] 6.1 Install WebSocket dependencies (`ws`, `@aws-sdk/signature-v4`)
  - [ ] 6.2 Create WebSocket utility functions
  - [ ]* 6.3 Write unit tests for WebSocket utilities
  - [ ]* 6.4 Write property test for SigV4 signature consistency

- [ ] 7. Implement ARN parsing and endpoint resolution (ONLY IF NEEDED)
  - [ ] 7.1 Create `RuntimeArnComponents` interface and parser
  - [ ]* 7.2 Write unit tests for ARN parsing
  - [ ]* 7.3 Write property test for ARN parsing round-trip

- [ ] 8. Rewrite AgentCoreClient with WebSocket (ONLY IF NEEDED)
  - [ ] 8.1 Replace SDK with custom WebSocket implementation
  - [ ] 8.2 Implement streaming response handling
  - [ ] 8.3 Implement connection lifecycle management
  - [ ]* 8.4 Write comprehensive tests

- [ ] 9. Enhance error handling and logging (Current Implementation)
  - [ ] 9.1 Add comprehensive CloudWatch logging
    - Log agent invocation requests (agent ID, prompt length, session ID)
    - Log response streaming metrics (chunks, size, duration)
    - Log all errors with full details and stack traces
    - _Requirements: 10.1, 10.2, 10.3, 10.4_

  - [ ] 9.2 Implement retry logic with exponential backoff
    - Implement retry for transient errors (503, 504)
    - Configure maximum retry attempts (3)
    - Configure backoff parameters (1s initial, 2x multiplier, 8s max)
    - _Requirements: 6.5_

  - [ ]* 9.3 Write unit tests for error handling
    - Test retry logic with transient errors
    - Test error logging
    - Test error response formatting
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_

- [ ] 10. Performance optimization and monitoring
  - [ ] 10.1 Implement CloudWatch metrics
    - Emit metrics for invocation count, duration, error rate
    - Emit metrics for streaming chunk count
    - _Requirements: 10.5_

  - [ ] 10.2 Optimize Lambda cold start performance
    - Verify AgentCoreClient initialization outside handler
    - Monitor cold start times
    - _Requirements: 9.1, 9.4_

  - [ ]* 10.3 Conduct performance testing
    - Measure first chunk latency (target: < 2s)
    - Measure total response time (target: < 10s)
    - Test concurrent request handling (target: 10+ concurrent)
    - _Requirements: 9.4_

- [ ] 11. Production deployment and validation
  - [ ] 11.1 Deploy to production
    - Deploy updated backend to production
    - Verify environment variables are set
    - Verify IAM permissions are correct
    - _Requirements: 4.3, 4.5_

  - [ ] 11.2 Production smoke tests
    - Test all three agents in production
    - Verify frontend integration works
    - Monitor CloudWatch logs and metrics
    - Validate error handling
    - _Requirements: 2.5, 8.5, 10.1, 10.2, 10.3_

  - [ ] 11.3 Document final implementation
    - Document SDK vs WebSocket decision
    - Update deployment documentation
    - Document any deviations from original design
    - _Requirements: All_

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- **Current implementation uses SDK approach** - may deviate from design but could be pragmatic
- **Decision point at Task 5** - evaluate if custom WebSocket implementation is needed
- Property tests validate universal correctness properties
- Unit tests validate specific examples and edge cases
- Integration tests validate end-to-end functionality

