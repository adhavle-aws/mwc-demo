# ADR 0001: Use Agentcore and Strands Frameworks for Agent Implementation

## Status

Accepted

## Context

We need to build a multi-agent system for AWS customer onboarding and infrastructure provisioning. The system requires:
- Multiple specialized agents that can communicate effectively
- Workflow orchestration across agents
- State management and recovery capabilities
- Reliable message passing between components

## Decision

We will use **agentcore** as the agent runtime framework and **strands** for workflow orchestration.

## Rationale

**Agentcore Benefits:**
- Provides standardized agent runtime and lifecycle management
- Built-in messaging protocols for inter-agent communication
- Handles agent registration and discovery
- Proven framework for building distributed agent systems

**Strands Benefits:**
- Purpose-built for multi-agent workflow orchestration
- Native support for workflow state management
- Checkpoint and recovery mechanisms out of the box
- Integrates seamlessly with agentcore

**Alternatives Considered:**
- **Custom agent framework**: Would require significant development effort and lack proven patterns
- **Step Functions**: AWS-native but less flexible for agent-based architectures
- **Temporal**: Powerful but adds complexity and operational overhead

## Consequences

**Positive:**
- Faster development with proven frameworks
- Built-in patterns for agent communication and orchestration
- Reduced operational complexity
- Better maintainability with standard patterns

**Negative:**
- Dependency on specific frameworks
- Team needs to learn agentcore and strands APIs
- Framework limitations may constrain some design choices

## Implementation Notes

- All agents must extend agentcore base classes
- Workflow definitions will use strands DSL
- State persistence will leverage strands state store
