# ADR 0012: Comprehensive Audit Logging

## Status

Accepted

## Context

The system performs critical operations including:
- Creating AWS organizations and accounts
- Deploying infrastructure
- Modifying security policies
- Handling customer data

We need to maintain a complete audit trail for:
- Security compliance
- Debugging and troubleshooting
- Regulatory requirements
- Incident investigation
- Performance analysis

## Decision

We will implement **comprehensive audit logging** for all operations, capturing:
- All AWS API calls
- All agent actions
- All workflow state changes
- All user interactions through Slack
- All errors and exceptions

## Rationale

**Why Comprehensive Logging:**
- Security compliance and forensics
- Debugging production issues
- Understanding system behavior
- Performance monitoring
- Regulatory compliance (SOC2, ISO 27001)
- Customer support and troubleshooting

**What Gets Logged:**
- **Operation Details**: Action, parameters, result
- **Context**: Workflow ID, agent ID, user ID
- **Timing**: Timestamp, duration
- **Outcome**: Success/failure, error details
- **Actor**: Who/what initiated the action

**Log Structure:**
```typescript
interface AuditLogEntry {
  logId: string
  timestamp: Date
  operationType: string
  operationName: string
  agentId: string
  workflowId: string
  userId?: string
  parameters: Record<string, any>
  result: 'SUCCESS' | 'FAILURE'
  duration: number
  errorDetails?: ErrorInfo
  metadata: Record<string, any>
}
```

**Alternatives Considered:**
- **Minimal Logging**: Insufficient for debugging and compliance
- **CloudTrail Only**: Doesn't capture application-level events
- **Sampling**: Misses important events, not suitable for audit

## Consequences

**Positive:**
- Complete audit trail for compliance
- Easier debugging and troubleshooting
- Better incident investigation
- Performance insights
- Security forensics capability
- Customer support evidence

**Negative:**
- Storage costs for logs
- Performance overhead (minimal with async logging)
- Need to manage log retention
- Sensitive data handling in logs
- Log analysis complexity

## Implementation Notes

- Use structured logging (JSON format)
- Async logging to avoid performance impact
- Separate log streams:
  - Audit logs (all operations)
  - Error logs (failures only)
  - Performance logs (timing data)
  
- Log retention policy:
  - Audit logs: 7 years (compliance)
  - Error logs: 1 year
  - Performance logs: 90 days
  
- Sensitive data handling:
  - Redact credentials and tokens
  - Hash PII where possible
  - Encrypt logs at rest
  
- Integration points:
  - CloudWatch Logs for AWS operations
  - Custom log store for application events
  - CloudTrail for AWS API calls
  
- Monitoring and alerting:
  - Alert on error rate spikes
  - Monitor log volume
  - Track operation latencies
  
- Log analysis:
  - Use CloudWatch Insights for queries
  - Export to S3 for long-term storage
  - Consider log aggregation tool for complex analysis
