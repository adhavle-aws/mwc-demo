# ADR 0003: Two-Agent Architecture (Onboarding and Provisioning)

## Status

Accepted

## Context

The system needs to handle AWS customer onboarding and infrastructure provisioning. We need to decide how to structure the agent responsibilities and whether to use a single agent or multiple specialized agents.

## Decision

We will implement a **two-agent architecture**:
1. **Onboarding Agent**: Handles AWS organizational setup and CloudFormation package creation
2. **Provisioning Agent**: Handles CloudFormation deployment and monitoring

## Rationale

**Separation of Concerns:**
- Onboarding focuses on setup and package preparation
- Provisioning focuses on deployment and monitoring
- Clear boundaries reduce complexity within each agent

**Scalability:**
- Agents can scale independently based on workload
- Onboarding typically happens once per customer
- Provisioning may happen multiple times per customer

**Failure Isolation:**
- Failures in one agent don't affect the other
- Can restart/recover agents independently
- Easier to debug and maintain

**Team Organization:**
- Different teams can own different agents
- Specialized expertise (AWS Organizations vs CloudFormation)
- Parallel development possible

**Alternatives Considered:**
- **Single Monolithic Agent**: Simpler but less scalable, harder to maintain, no failure isolation
- **Three+ Agents**: Over-engineered for current requirements, adds unnecessary complexity
- **Microservices (non-agent)**: Doesn't leverage agentcore/strands benefits

## Consequences

**Positive:**
- Clear separation of responsibilities
- Independent scaling and deployment
- Better failure isolation
- Easier testing and maintenance
- Parallel development by different teams

**Negative:**
- Need to coordinate between agents
- More complex deployment topology
- Inter-agent communication overhead
- Need workflow orchestration (mitigated by strands)

## Implementation Notes

- Onboarding Agent triggers Provisioning Agent after package creation
- Use agentcore messaging for inter-agent communication
- Strands orchestrator coordinates multi-agent workflows
- Each agent maintains its own state
