# ADR 0008: Exponential Backoff for Retry Logic

## Status

Accepted

## Context

The system interacts with external services (AWS, Slack) that may experience transient failures due to:
- Network timeouts
- Rate limiting
- Temporary service unavailability
- Throttling

We need a retry strategy that:
- Handles transient failures gracefully
- Doesn't overwhelm failing services
- Provides reasonable recovery time
- Prevents cascading failures

## Decision

We will implement **exponential backoff with jitter** for all retry logic.

## Rationale

**Why Exponential Backoff:**
- Gives services time to recover
- Reduces load on failing services
- Industry standard pattern
- Prevents thundering herd problem
- Balances recovery speed with service protection

**Configuration:**
```typescript
{
  maxAttempts: 5,
  initialDelayMs: 1000,      // 1 second
  maxDelayMs: 60000,         // 60 seconds
  backoffMultiplier: 2       // Double each time
}
```

**Delay Calculation:**
```
delay = min(initialDelay * (multiplier ^ attemptNumber), maxDelay)
```

**Why Add Jitter:**
- Prevents synchronized retries from multiple clients
- Spreads load more evenly
- Reduces collision probability

**Alternatives Considered:**
- **Fixed Delay**: Doesn't adapt to severity, may retry too quickly
- **Linear Backoff**: Slower to back off, less effective
- **No Retry**: Poor user experience, doesn't handle transient failures
- **Immediate Retry**: Overwhelms failing services

## Consequences

**Positive:**
- Graceful handling of transient failures
- Protects downstream services
- Better success rate for operations
- Industry-proven pattern
- Configurable per operation type

**Negative:**
- Longer recovery time for persistent failures
- Complexity in error handling code
- Need to classify errors (transient vs permanent)
- May delay failure detection

## Implementation Notes

- Classify errors as transient, permanent, or critical
- Only retry transient errors
- Log each retry attempt with context
- Add correlation IDs for tracking retries
- Implement circuit breakers to prevent excessive retries
- Make retry config adjustable per operation
- Monitor retry rates and success rates
- Fail fast for permanent errors (don't retry)
