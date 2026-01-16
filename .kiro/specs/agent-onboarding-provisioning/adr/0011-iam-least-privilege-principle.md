# ADR 0011: IAM Least Privilege Principle

## Status

Accepted

## Context

The system needs to interact with AWS services to:
- Create and manage AWS Organizations
- Apply organizational policies
- Deploy CloudFormation stacks
- Access S3 for package storage
- Write audit logs

We need to ensure secure access to AWS services while minimizing security risks.

## Decision

We will implement **IAM least privilege principle** where each agent and operation uses IAM roles that grant only the minimum permissions required.

## Rationale

**Why Least Privilege:**
- Minimizes blast radius of security breaches
- Reduces risk of accidental damage
- Compliance with security best practices
- Easier to audit and review permissions
- Limits lateral movement in case of compromise

**Permission Strategy:**
- Separate IAM roles per agent
- Separate roles per operation type when needed
- Time-limited credentials (STS assume role)
- No long-lived access keys
- Explicit deny for sensitive operations

**Role Structure:**
```
OnboardingAgentRole:
  - organizations:CreateOrganization
  - organizations:CreateOrganizationalUnit
  - organizations:AttachPolicy
  - s3:PutObject (CFN packages only)
  - logs:PutLogEvents

ProvisioningAgentRole:
  - cloudformation:CreateStack
  - cloudformation:DescribeStacks
  - cloudformation:DeleteStack
  - s3:GetObject (CFN packages only)
  - logs:PutLogEvents
```

**Alternatives Considered:**
- **Single Admin Role**: Too broad, violates least privilege
- **User Credentials**: Long-lived, harder to rotate, no role separation
- **Instance Profiles Only**: Less flexible, harder to test locally

## Consequences

**Positive:**
- Reduced security risk
- Clear permission boundaries
- Easier security audits
- Compliance with AWS best practices
- Limited blast radius
- Supports principle of defense in depth

**Negative:**
- More IAM roles to manage
- More complex permission setup
- Need to update roles when adding features
- Testing requires proper role setup
- Debugging permission issues can be harder

## Implementation Notes

- Create separate IAM roles for each agent
- Use IAM policy conditions to restrict:
  - Resource ARNs (specific S3 buckets, etc.)
  - Time windows for operations
  - Source IP ranges if applicable
  
- Use STS AssumeRole for temporary credentials
- Rotate credentials regularly
- Monitor IAM role usage with CloudTrail
- Implement permission boundary policies
- Document required permissions for each operation
- Test with actual IAM roles (not admin)
- Use IAM Access Analyzer to validate policies
- Regular permission audits (quarterly)
