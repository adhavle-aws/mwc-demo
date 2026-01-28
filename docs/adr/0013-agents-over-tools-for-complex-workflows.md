# ADR 0013: Agents Over Tools for Complex Workflows

## Status

Accepted

## Context

The MWC demo system needs to handle two primary workflows:
1. CloudFormation template generation from natural language architecture descriptions
2. Infrastructure provisioning, validation, and reporting

We need to decide whether to implement these capabilities as:
- Tools within a single agent
- Separate specialized agents

## Decision

We will implement the CloudFormation generation and provisioning capabilities as **two separate agents** rather than tools within a single agent.

## Rationale

### When to Use Tools vs Agents

**Tools are appropriate for:**
- Simple, deterministic operations (API calls, calculations, data lookups)
- Synchronous operations that complete quickly
- No complex decision-making or reasoning required
- Stateless operations

**Agents are appropriate for:**
- Complex reasoning and decision-making
- Multi-step workflows with conditional logic
- Asynchronous operations that may take time
- Situations requiring LLM intelligence and context
- Stateful operations requiring memory

### Why Our Use Case Requires Agents

**1. CloudFormation Generation Requires Complex Reasoning:**
- Understanding natural language architecture requirements
- Translating business needs to AWS resource configurations
- Ensuring security best practices and compliance
- Handling resource dependencies and relationships
- Making architectural decisions based on requirements
- Adapting to edge cases and constraints

**2. Provisioning Requires Orchestration:**
- Multi-step validation of CloudFormation templates
- Managing CloudFormation stack lifecycle (create, update, delete)
- Monitoring deployment progress over time
- Handling errors, rollbacks, and recovery
- Generating comprehensive user-facing reports
- Making decisions about retry strategies

**3. Alignment with Existing Architecture:**
- Consistent with ADR 0003 (Two-Agent Architecture)
- Leverages AgentCore and Strands capabilities (ADR 0001)
- Enables independent scaling and failure isolation
- Supports event-driven communication (ADR 0005)

### Alternatives Considered

**Option 1: Single Agent with Tools**
- Pros: Simpler deployment, single codebase
- Cons: 
  - Tools cannot perform complex reasoning
  - Would require agent to orchestrate tool calls anyway
  - No failure isolation between generation and provisioning
  - Cannot scale independently
  - Violates ADR 0003

**Option 2: Tools Calling External Services**
- Pros: Separation of concerns maintained
- Cons:
  - Loses AgentCore benefits (observability, memory, orchestration)
  - More complex infrastructure
  - No unified agent framework
  - Harder to maintain and debug

**Option 3: Microservices (Non-Agent)**
- Pros: Traditional architecture, well-understood patterns
- Cons:
  - Doesn't leverage LLM capabilities for reasoning
  - More boilerplate code
  - Loses AgentCore platform benefits
  - Violates ADR 0001

## Consequences

**Positive:**
- Each agent can focus on its specialized task
- Complex reasoning handled by agent intelligence, not procedural code
- Independent scaling based on workload (generation vs provisioning)
- Failure isolation between generation and provisioning phases
- Easier to test each agent independently
- Can enhance agents with memory and learning over time
- Consistent with existing architectural decisions

**Negative:**
- More agents to deploy and manage (2 agents vs 1)
- Need inter-agent communication mechanism
- Slightly more complex deployment topology
- Coordination overhead between agents

## Implementation Notes

### Onboarding Agent
- **Input**: Natural language architecture description
- **Processing**: Uses Claude/Bedrock to generate CloudFormation template
- **Output**: Validated CloudFormation template
- **Tools**: Template validation, AWS best practices checker

### Provisioning Agent
- **Input**: CloudFormation template from Onboarding Agent
- **Processing**: Deploys and monitors infrastructure
- **Output**: Deployment status, resource details, usage instructions
- **Tools**: CloudFormation API, stack monitoring, resource inspection

### Communication Pattern
- Onboarding Agent completes → triggers Provisioning Agent via AgentCore messaging
- Event-driven handoff with template payload
- Strands orchestrator manages workflow state
- Slack notifications at key workflow stages

### Tool Usage Within Agents
Each agent will have its own specialized tools:
- **Onboarding Agent Tools**: CFN validation, syntax checking, best practices analysis
- **Provisioning Agent Tools**: CFN deployment, stack monitoring, resource queries, report generation

## Related ADRs

- ADR 0001: Use Agentcore and Strands Frameworks
- ADR 0003: Two-Agent Architecture
- ADR 0005: Event-Driven Architecture

## References

- AgentCore Documentation: Agent-to-Agent Communication
- Strands Multi-Agent Orchestration Patterns
- AWS CloudFormation Best Practices
