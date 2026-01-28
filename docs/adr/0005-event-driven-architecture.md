# ADR 0005: Event-Driven Architecture for Agent Communication

## Status

Accepted

## Context

Agents need to communicate and coordinate their activities. We need to decide on the communication pattern between:
- Slack Integration and Agents
- Onboarding Agent and Provisioning Agent
- Agents and Workflow Orchestrator
- Agents and external services (AWS, Slack)

## Decision

We will use an **event-driven architecture** where agents communicate through asynchronous message passing.

## Rationale

**Why Event-Driven:**
- Natural fit for distributed agent systems
- Loose coupling between components
- Agents can process events independently
- Easy to add new agents or event handlers
- Built-in support in agentcore framework

**Key Characteristics:**
- Agents publish events when state changes occur
- Agents subscribe to events they care about
- Workflow orchestrator coordinates multi-step workflows
- Asynchronous processing with eventual consistency

**Alternatives Considered:**
- **Synchronous Request-Response**: Tight coupling, blocking operations, harder to scale
- **Shared Database**: Coupling through data, no clear event boundaries
- **Direct Method Calls**: Not suitable for distributed systems, no failure isolation

## Consequences

**Positive:**
- Loose coupling between agents
- Independent scaling of agents
- Natural failure isolation
- Easy to add new functionality
- Better resilience (agents can be down temporarily)
- Clear audit trail through events

**Negative:**
- Eventual consistency (not immediate)
- More complex debugging (distributed traces)
- Need to handle duplicate events (idempotency)
- Message ordering considerations
- Requires event schema management

## Implementation Notes

- Use agentcore messaging protocols for event transport
- Implement idempotent event handlers
- Add correlation IDs for distributed tracing
- Use event versioning for schema evolution
- Implement dead letter queues for failed events
- Monitor event processing latency
