# ADR 0010: Checkpoint-Based Workflow Recovery

## Status

Accepted

## Context

Workflows can fail at any point due to:
- Agent crashes or restarts
- Network failures
- External service failures
- Infrastructure issues

When workflows fail, we need to:
- Resume from where we left off (not restart from beginning)
- Avoid re-executing completed steps
- Maintain data consistency
- Provide clear recovery points

## Decision

We will implement **checkpoint-based workflow recovery** using the strands framework's state management capabilities.

## Rationale

**Why Checkpoints:**
- Resume workflows without re-executing completed work
- Clear recovery points for debugging
- Idempotent workflow execution
- Efficient resource usage
- Better user experience (no duplicate work)

**Checkpoint Strategy:**
- Create checkpoint after each major workflow step
- Store checkpoint with workflow state
- Include all data needed to resume
- Checkpoints are immutable once created

**What Gets Checkpointed:**
- Workflow ID and type
- Current step identifier
- Step completion status
- Step output data
- Timestamp and agent ID
- Error information (if failed)

**Alternatives Considered:**
- **No Checkpoints**: Must restart workflows from beginning, wasteful
- **Database Transactions**: Too fine-grained, doesn't fit workflow model
- **Event Sourcing**: More complex, overkill for our needs
- **Manual Snapshots**: Error-prone, not automatic

## Consequences

**Positive:**
- Efficient workflow recovery
- No duplicate work on resume
- Clear audit trail of progress
- Easier debugging (know exact failure point)
- Better resource utilization
- Improved user experience

**Negative:**
- Storage overhead for checkpoints
- Need to design idempotent steps
- Complexity in checkpoint management
- Need to handle checkpoint failures
- Stale checkpoints need cleanup

## Implementation Notes

- Checkpoint after each major step:
  - Organization creation
  - Policy application
  - Package creation and validation
  - Package versioning
  - Stack deployment initiation
  - Resource verification

- Checkpoint data structure:
```typescript
interface Checkpoint {
  stepId: string
  timestamp: Date
  agentId: string
  status: 'SUCCESS' | 'FAILURE'
  data: Record<string, any>
  errorDetails?: ErrorInfo
}
```

- Store checkpoints in strands state store
- Implement checkpoint cleanup policy (retain for 30 days)
- Make workflow steps idempotent
- Test recovery from each checkpoint
- Monitor checkpoint creation failures
- Provide UI to view checkpoint history
