# ADR 0007: Property-Based Testing Strategy

## Status

Accepted

## Context

We need a comprehensive testing strategy that ensures system correctness across all possible inputs, not just specific test cases. The system handles complex workflows with many possible states and inputs.

## Decision

We will implement a **dual testing approach** combining:
1. **Property-Based Testing** (PBT) for universal correctness properties
2. **Unit Testing** for specific examples and edge cases

We will use **fast-check** library for property-based testing in TypeScript.

## Rationale

**Why Property-Based Testing:**
- Tests universal properties across randomly generated inputs
- Discovers edge cases developers might not think of
- Provides stronger correctness guarantees than example-based tests
- Automatically finds minimal failing examples (shrinking)
- Tests behavior, not implementation

**Why Dual Approach:**
- PBT validates general correctness
- Unit tests validate specific examples and integration points
- Complementary coverage (PBT finds unexpected bugs, unit tests document expected behavior)
- Unit tests are easier to understand for specific scenarios

**Why fast-check:**
- Native TypeScript support
- Rich set of built-in generators
- Excellent shrinking capabilities
- Good documentation and community
- Integrates well with Jest

**Alternatives Considered:**
- **Only Unit Tests**: Misses edge cases, limited input coverage
- **Only Integration Tests**: Slow, doesn't validate individual components
- **Manual Testing**: Not repeatable, doesn't scale

## Consequences

**Positive:**
- Higher confidence in system correctness
- Discovers edge cases automatically
- Self-documenting through properties
- Catches regression bugs
- Forces thinking about invariants

**Negative:**
- Steeper learning curve for team
- Property tests can be slower (100+ iterations)
- Requires careful generator design
- Debugging failing property tests can be harder
- Need to maintain both test types

## Implementation Notes

- Minimum 100 iterations per property test
- Each correctness property gets one property test
- Tag format: `Feature: agent-onboarding-provisioning, Property {number}: {property_text}`
- Create smart generators that constrain to valid input space
- Use shrinking to find minimal failing examples
- Document properties in design document first
- Unit tests for specific examples and integration points
- Target > 80% code coverage with unit tests
- Target 100% property coverage (all design properties tested)
