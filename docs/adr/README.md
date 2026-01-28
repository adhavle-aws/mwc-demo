# Architecture Decision Records (ADRs)

This directory contains Architecture Decision Records for the Agent-based Onboarding and Provisioning System.

## What are ADRs?

Architecture Decision Records document important architectural decisions made during the design and implementation of the system. Each ADR captures:
- The context and problem being addressed
- The decision that was made
- The rationale behind the decision
- The consequences (both positive and negative)

## ADR Index

### Core Framework and Technology Decisions

- [ADR 0001: Use Agentcore and Strands Frameworks](./0001-use-agentcore-and-strands-frameworks.md)
  - Decision to use agentcore for agent runtime and strands for workflow orchestration

- [ADR 0006: TypeScript as Implementation Language](./0006-typescript-as-implementation-language.md)
  - Decision to implement the system in TypeScript

### Architecture and Design Decisions

- [ADR 0002: Slack as Primary User Interface](./0002-slack-as-primary-user-interface.md)
  - Decision to use Slack for all user interactions

- [ADR 0003: Two-Agent Architecture](./0003-two-agent-architecture.md)
  - Decision to split responsibilities between Onboarding and Provisioning agents

- [ADR 0013: Agents Over Tools for Complex Workflows](./0013-agents-over-tools-for-complex-workflows.md)
  - Decision to implement CloudFormation generation and provisioning as agents rather than tools

- [ADR 0014: AWS Amplify for UI Deployment](./0014-aws-amplify-for-ui-deployment.md)
  - Decision to use AWS Amplify Hosting for deploying the Agent UI React application

- [ADR 0004: CloudFormation for Infrastructure Provisioning](./0004-cloudformation-for-infrastructure-provisioning.md)
  - Decision to use AWS CloudFormation for infrastructure deployment

- [ADR 0005: Event-Driven Architecture](./0005-event-driven-architecture.md)
  - Decision to use event-driven communication between agents

### Reliability and Resilience Decisions

- [ADR 0008: Exponential Backoff for Retries](./0008-exponential-backoff-for-retries.md)
  - Decision to implement exponential backoff for retry logic

- [ADR 0009: Circuit Breaker Pattern](./0009-circuit-breaker-pattern.md)
  - Decision to implement circuit breakers for external service calls

- [ADR 0010: Checkpoint-Based Workflow Recovery](./0010-checkpoint-based-workflow-recovery.md)
  - Decision to use checkpoints for workflow recovery

### Security and Compliance Decisions

- [ADR 0011: IAM Least Privilege Principle](./0011-iam-least-privilege-principle.md)
  - Decision to implement least privilege access for all AWS operations

- [ADR 0012: Comprehensive Audit Logging](./0012-comprehensive-audit-logging.md)
  - Decision to implement comprehensive audit logging for all operations

### Testing and Quality Decisions

- [ADR 0007: Property-Based Testing Strategy](./0007-property-based-testing-strategy.md)
  - Decision to use property-based testing alongside unit tests

## ADR Status

All ADRs in this directory have status: **Accepted**

## Creating New ADRs

When making new architectural decisions:

1. Create a new file: `NNNN-short-title.md` (where NNNN is the next number)
2. Use the following template:

```markdown
# ADR NNNN: [Title]

## Status

[Proposed | Accepted | Deprecated | Superseded]

## Context

[Describe the problem and context]

## Decision

[Describe the decision]

## Rationale

[Explain why this decision was made]

## Consequences

**Positive:**
- [List positive consequences]

**Negative:**
- [List negative consequences]

## Implementation Notes

[Any important implementation details]
```

3. Update this README with a link to the new ADR
