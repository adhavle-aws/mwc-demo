# MWC Multi-Agent System

## Overview

This system implements a three-agent architecture for AWS infrastructure onboarding and provisioning:

```
┌─────────────────────────────────────────────────────┐
│  MWCAgent (Orchestrator)                           │
│  • Coordinates workflow                            │
│  • Manages agent-to-agent communication            │
│  • Provides user interface                         │
└──────────────┬──────────────────┬───────────────────┘
               │                  │
               ▼                  ▼
┌──────────────────────┐  ┌──────────────────────────┐
│  Onboarding Agent    │  │  Provisioning Agent      │
│  • CFN generation    │  │  • Template validation   │
│  • Template validation│  │  • Stack deployment      │
│  • Best practices    │  │  • Resource monitoring   │
└──────────────────────┘  └──────────────────────────┘
```

## Deployed Agents

### 1. OnboardingAgent
- **ARN**: `arn:aws:bedrock-agentcore:us-east-1:905767016260:runtime/OnboardingAgent_Agent-Pgs8nUGuuS`
- **Purpose**: Generate production-grade CloudFormation templates from natural language
- **Tools**: `validate_cloudformation_template`

### 2. ProvisioningAgent
- **ARN**: `arn:aws:bedrock-agentcore:us-east-1:905767016260:runtime/ProvisioningAgent_Agent-oHKfV3FmyU`
- **Purpose**: Deploy and monitor CloudFormation stacks
- **Tools**: 
  - `validate_cloudformation_template`
  - `deploy_cloudformation_stack`
  - `get_stack_status`
  - `get_stack_events`

### 3. MWCAgent (Orchestrator)
- **ARN**: `arn:aws:bedrock-agentcore:us-east-1:905767016260:runtime/MWCAgent_Agent-31gMn650Bl`
- **Purpose**: Coordinate the workflow between agents
- **Tools**:
  - `call_onboarding_agent`
  - `call_provisioning_agent`

## IAM Permissions

### MWCAgent Permissions
- Can invoke OnboardingAgent and ProvisioningAgent via `bedrock-agentcore:InvokeAgentRuntime`
- Policy: `MWCAgent-InvokeOtherAgents-Policy`

### ProvisioningAgent Permissions
- Full CloudFormation access via `AWSCloudFormationFullAccess` managed policy
- Can create, update, delete, and monitor CloudFormation stacks

## Testing the System

### Test Onboarding Agent Directly
```bash
cd OnboardingAgent
agentcore invoke '{"prompt": "Generate a CloudFormation template for an S3 bucket with versioning"}'
```

### Test Provisioning Agent Directly
```bash
cd ProvisioningAgent
agentcore invoke '{"prompt": "Validate this CloudFormation template: <paste template here>"}'
```

### Test Full Workflow via MWCAgent
```bash
cd MWCAgent
agentcore invoke '{"prompt": "I need a simple S3 bucket with versioning enabled for storing application logs"}'
```

The orchestrator will:
1. Call OnboardingAgent to generate the template
2. Show you the template
3. Call ProvisioningAgent to deploy it
4. Report back with resource details

## Example Workflow

**User Request:**
> "I need a cloud architecture with an S3 bucket for data storage and a Lambda function to process files"

**MWCAgent Response:**
1. Calls OnboardingAgent → generates CloudFormation template
2. Presents template to user for review
3. Calls ProvisioningAgent → deploys the stack
4. Reports:
   - Stack status
   - Resource IDs (bucket name, Lambda ARN)
   - How to use the resources
   - Next steps

## Monitoring

### View Logs
```bash
# MWCAgent logs
aws logs tail /aws/bedrock-agentcore/runtimes/MWCAgent_Agent-31gMn650Bl-DEFAULT --follow

# OnboardingAgent logs
aws logs tail /aws/bedrock-agentcore/runtimes/OnboardingAgent_Agent-Pgs8nUGuuS-DEFAULT --follow

# ProvisioningAgent logs
aws logs tail /aws/bedrock-agentcore/runtimes/ProvisioningAgent_Agent-oHKfV3FmyU-DEFAULT --follow
```

### GenAI Observability Dashboard
https://console.aws.amazon.com/cloudwatch/home?region=us-east-1#gen-ai-observability/agent-core

## Cleanup

To remove all agents and resources:

```bash
# Stop sessions
cd MWCAgent && agentcore stop-session
cd ../OnboardingAgent && agentcore stop-session
cd ../ProvisioningAgent && agentcore stop-session

# Destroy agents
cd ../MWCAgent && agentcore destroy
cd ../OnboardingAgent && agentcore destroy
cd ../ProvisioningAgent && agentcore destroy

# Remove IAM policy
aws iam detach-role-policy \
    --role-name AmazonBedrockAgentCoreSDKRuntime-us-east-1-39f859492b \
    --policy-arn arn:aws:iam::905767016260:policy/MWCAgent-InvokeOtherAgents-Policy

aws iam delete-policy \
    --policy-arn arn:aws:iam::905767016260:policy/MWCAgent-InvokeOtherAgents-Policy
```

## Architecture Decisions

See [ADR 0013: Agents Over Tools for Complex Workflows](docs/adr/0013-agents-over-tools-for-complex-workflows.md) for the rationale behind using separate agents instead of tools.

## Next Steps

1. Test each agent individually
2. Test the full workflow via MWCAgent
3. Integrate with Slack (per ADR 0002)
4. Add Memory for conversation context (optional)
5. Add Gateway for external API integration (optional)
