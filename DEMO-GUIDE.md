# MWC Multi-Agent Demo Guide

## 🎯 Demo Overview

This demo showcases a three-agent architecture for automated AWS infrastructure provisioning:

```
User Request (Natural Language)
         ↓
   MWCAgent (Orchestrator)
         ↓
   OnboardingAgent → Generates CloudFormation Template
         ↓
   ProvisioningAgent → Deploys & Monitors Infrastructure
         ↓
   User Receives: Template + Deployed Resources + Usage Guide
```

## 📋 What We Built

### Three Deployed Agents

1. **OnboardingAgent** - CloudFormation Template Generator
   - ARN: `arn:aws:bedrock-agentcore:us-east-1:905767016260:runtime/OnboardingAgent_Agent-Pgs8nUGuuS`
   - Generates production-grade CloudFormation templates from natural language
   - Validates templates for correctness
   - Follows AWS best practices

2. **ProvisioningAgent** - Infrastructure Deployment & Monitoring
   - ARN: `arn:aws:bedrock-agentcore:us-east-1:905767016260:runtime/ProvisioningAgent_Agent-oHKfV3FmyU`
   - Validates CloudFormation templates
   - Deploys stacks to AWS
   - Monitors deployment progress
   - Reports resource details

3. **MWCAgent** - Orchestrator
   - ARN: `arn:aws:bedrock-agentcore:us-east-1:905767016260:runtime/MWCAgent_Agent-31gMn650Bl`
   - Coordinates workflow between agents
   - Manages agent-to-agent communication
   - Provides unified user interface

## 🚀 Demo Script

### Standard Demo Prompt

```bash
cd OnboardingAgent
agentcore invoke '{"prompt": "Generate a cloudformation template to provision resources to meet requirements outlined in below Q and A. Output should include cloudformation template in <cfn> xml tag, architecture overview, cost optimization tips and quick summary. Q: What kind of application do you want to host ?A: It is a 3 tier web application Q: which aws region do you want the application to be hosted in ?A : us-east-1Q: Any security and/or availability requirements to keep in mind in hosting this application ?A : It should be within a private network and highly available. Q : What kind of storage requirements do you have ?A : We have 30GB of files and video data and 20GB of transaction data for this application.Q : Anything else you want us to consider ?A : Yes, we want to have minimal operations and cost overhead. And one more thing, this app is very cpu intensive."}'
```

### What the Demo Shows

The OnboardingAgent will generate:

1. **Complete CloudFormation Template** including:
   - VPC with public and private subnets across 2 AZs
   - Application Load Balancer (internet-facing)
   - Web Tier Auto Scaling Group (CPU-optimized instances)
   - Application Tier Auto Scaling Group (CPU-optimized instances)
   - RDS MySQL Multi-AZ database (20GB for transactions)
   - S3 bucket with lifecycle policies (30GB for media)
   - Security groups with layered security
   - IAM roles and policies
   - CloudWatch alarms for auto-scaling

2. **Architecture Diagram** showing the 3-tier design

3. **Cost Optimization Tips** including:
   - Savings Plans recommendations
   - S3 lifecycle policies
   - Right-sizing guidance
   - Reserved Instance options

4. **Quick Summary** of the solution

## 🧪 Testing Individual Agents

### Test OnboardingAgent (Template Generation)
```bash
cd OnboardingAgent
agentcore invoke '{"prompt": "Generate a CloudFormation template for a simple S3 bucket with versioning"}'
```

**Expected Output:**
- Valid CloudFormation template in YAML
- Template validation confirmation
- Best practices applied (encryption, public access blocking, etc.)

### Test ProvisioningAgent (Deployment)
```bash
cd ProvisioningAgent
agentcore invoke '{"prompt": "Check the status of CloudFormation stack named my-test-stack"}'
```

**Expected Output:**
- Stack status information
- Resource list with IDs
- Deployment progress
- Helpful error messages if stack doesn't exist

### Test MWCAgent (Full Orchestration)
```bash
cd MWCAgent
agentcore invoke '{"prompt": "Generate and deploy a simple S3 bucket"}'
```

**Expected Workflow:**
1. MWCAgent calls OnboardingAgent
2. Template is generated
3. MWCAgent calls ProvisioningAgent
4. Infrastructure is deployed
5. User receives complete report

## 🔧 Current Status

### ✅ Working
- All three agents deployed to AWS
- OnboardingAgent generates comprehensive templates
- ProvisioningAgent has CloudFormation tools
- IAM policies configured

### ⚠️ In Progress
- Agent-to-agent communication (IAM propagation pending)
- Full orchestration workflow testing

## 📊 Architecture Decisions

See these ADRs for design rationale:
- [ADR 0013: Agents Over Tools](docs/adr/0013-agents-over-tools-for-complex-workflows.md)
- [ADR 0003: Two-Agent Architecture](docs/adr/0003-two-agent-architecture.md)
- [ADR 0001: AgentCore and Strands](docs/adr/0001-use-agentcore-and-strands-frameworks.md)

## 💰 Cost Estimate

**Per Month (Approximate):**
- OnboardingAgent Runtime: ~$10-20 (low usage)
- ProvisioningAgent Runtime: ~$10-20 (low usage)
- MWCAgent Runtime: ~$20-40 (moderate usage)
- Bedrock API calls: Variable based on usage
- **Total**: ~$40-80/month for the agent infrastructure

**Note:** Actual infrastructure costs (EC2, RDS, S3, etc.) depend on what gets deployed.

## 🧹 Cleanup

```bash
# Stop all agent sessions
cd MWCAgent && agentcore stop-session
cd ../OnboardingAgent && agentcore stop-session
cd ../ProvisioningAgent && agentcore stop-session

# Destroy agents (preview first)
cd ../MWCAgent && agentcore destroy --dry-run
cd ../OnboardingAgent && agentcore destroy --dry-run
cd ../ProvisioningAgent && agentcore destroy --dry-run

# Actually destroy
cd ../MWCAgent && agentcore destroy
cd ../OnboardingAgent && agentcore destroy
cd ../ProvisioningAgent && agentcore destroy
```

## 📝 Next Steps

1. **Test full orchestration** once IAM propagates
2. **Integrate with Slack** (per ADR 0002)
3. **Add AgentCore Memory** for conversation context
4. **Add monitoring and alerting**
5. **Create demo video/presentation**

## 🎬 Demo Tips

- Start with OnboardingAgent to show template generation
- Highlight the comprehensive output (template + architecture + cost tips)
- Show how it handles complex requirements (HA, private network, CPU-intensive)
- Emphasize production-ready features (encryption, monitoring, auto-scaling)
- Explain the agent-to-agent communication pattern
