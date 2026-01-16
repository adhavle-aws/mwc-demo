# ADR 0009: Circuit Breaker Pattern for External Service Calls

## Status

Accepted

## Context

The system makes calls to external services (AWS APIs, Slack API) that may fail or become slow. Without protection, we risk:
- Cascading failures across the system
- Resource exhaustion from waiting on slow services
- Poor user experience from hanging operations
- Difficulty recovering when services come back online

## Decision

We will implement the **Circuit Breaker pattern** for all external service calls.

## Rationale

**Why Circuit Breaker:**
- Prevents cascading failures
- Fails fast when service is known to be down
- Gives failing services time to recover
- Provides clear failure signals
- Industry-proven resilience pattern

**Circuit States:**

1. **Closed (Normal)**: Requests pass through normally
   - Monitor failure rate
   - Open circuit if threshold exceeded

2. **Open (Failing)**: Requests fail immediately
   - Don't call failing service
   - Return error immediately
   - Wait for timeout period
   - Transition to Half-Open after timeout

3. **Half-Open (Testing)**: Limited requests allowed
   - Test if service recovered
   - Allow small number of requests through
   - Close circuit if requests succeed
   - Re-open if requests fail

**Configuration:**
```typescript
{
  failureThreshold: 5,        // Open after 5 failures
  successThreshold: 2,        // Close after 2 successes in half-open
  timeout: 60000,             // 60 seconds before trying again
  halfOpenRetryDelay: 30000   // 30 seconds between half-open attempts
}
```

**Alternatives Considered:**
- **No Circuit Breaker**: Risk of cascading failures and resource exhaustion
- **Simple Timeout**: Doesn't prevent repeated calls to failing services
- **Manual Intervention**: Slow to respond, requires human monitoring

## Consequences

**Positive:**
- Prevents cascading failures
- Fast failure when service is down
- Automatic recovery testing
- Better resource utilization
- Clear failure boundaries
- Improved system resilience

**Negative:**
- Additional complexity in service calls
- May reject requests during recovery period
- Need to tune thresholds per service
- Requires monitoring and alerting
- False positives possible

## Implementation Notes

- Implement circuit breaker per external service
- Different thresholds for different services (AWS vs Slack)
- Monitor circuit state changes
- Alert when circuits open
- Log all state transitions
- Provide circuit status in health checks
- Allow manual circuit reset for operations
- Track metrics: open time, failure rate, recovery time
- Consider half-open request sampling strategy
