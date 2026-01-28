# MWC Multi-Agent Infrastructure Provisioning System

An intelligent multi-agent system built on AWS Bedrock AgentCore that automates cloud infrastructure provisioning through natural language.

## 🎯 Overview

This system uses three specialized AI agents to transform natural language architecture requirements into deployed AWS infrastructure:

```
User Request (Natural Language)
         ↓
   MWCAgent (Orchestrator)
         ↓
   OnboardingAgent → Generates CloudFormation Template
         ↓
   ProvisioningAgent → Deploys & Monitors Infrastructure
         ↓
   Complete Infrastructure + Documentation
```

## 🏗️ Architecture

### Three-Agent System

1. **OnboardingAgent** - CloudFormation Template Generator
   - Analyzes natural language architecture requirements
   - Generates production-grade CloudFormation templates
   - Applies AWS best practices and security standards
   - Validates template syntax and structure

2. **ProvisioningAgent** - Infrastructure Deployment & Monitoring
   - Validates CloudFormation templates
   - Deploys stacks to AWS
   - Monitors deployment progress
   - Reports resource details and usage instructions

3. **MWCAgent** - Orchestrator
   - Coordinates workflow between agents
   - Manages agent-to-agent communication
   - Provides unified user interface

## 🚀 Deployment Instructions

**👉 See [DEPLOYMENT.md](DEPLOYMENT.md) for complete step-by-step deployment instructions to your AWS account.**

Quick summary:
1. Install prerequisites (AWS CLI, pipx, AgentCore CLI)
2. Configure AWS credentials
3. Enable Bedrock model access
4. Deploy three agents (OnboardingAgent, ProvisioningAgent, MWCAgent)
5. Configure IAM permissions
6. Test the system

**Estimated time:** 15-20 minutes for first-time setup

## 📋 Prerequisites

### Required Software

1. **Python 3.10+**
   ```bash
   python3 --version
   ```

2. **pipx** (for installing AgentCore CLI)
   ```bash
   # macOS
   brew install pipx
   
   # Linux
   python3 -m pip install --user pipx
   python3 -m pipx ensurepath
   ```

3. **AWS CLI v2**
   ```bash
   # macOS
   brew install awscli
   
   # Linux
   curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
   unzip awscliv2.zip
   sudo ./aws/install
   ```

4. **AgentCore Starter Toolkit**
   ```bash
   pipx install bedrock-agentcore-starter-toolkit
   ```

### AWS Account Setup

1. **AWS Account** with appropriate permissions
2. **AWS CLI configured** with credentials
   ```bash
   aws configure
   ```

3. **Bedrock Model Access** - Enable access to Anthropic Claude models:
   - Navigate to [Amazon Bedrock Console](https://console.aws.amazon.com/bedrock/)
   - Go to "Model access"
   - Request access to Anthropic Claude models
   - Wait for approval (usually instant)

4. **Required IAM Permissions** for deployment:
   - CloudFormation (create/update/delete stacks)
   - IAM (create roles and policies)
   - S3 (create buckets, upload objects)
   - Bedrock AgentCore (create/update runtimes)
   - EC2, RDS, Auto Scaling (for provisioned resources)

## 🚀 Deployment Instructions

### Step 1: Clone the Repository

```bash
git clone <repository-url>
cd MWC-demo
```

### Step 2: Configure AWS Credentials

Ensure your AWS CLI is configured with credentials for your target account:

```bash
aws configure
# Enter your AWS Access Key ID
# Enter your AWS Secret Access Key
# Enter your default region (e.g., us-east-1)
# Enter your default output format (json)

# Verify authentication
aws sts get-caller-identity
```

### Step 3: Deploy OnboardingAgent

```bash
cd OnboardingAgent

# Deploy to AWS
agentcore launch

# Wait for deployment to complete (2-3 minutes)
# Note the Agent ARN from the output
```

**Save the OnboardingAgent ARN** - you'll need it for Step 5.

Example ARN: `arn:aws:bedrock-agentcore:us-east-1:123456789012:runtime/OnboardingAgent_Agent-XXXXXXXXXX`

### Step 4: Deploy ProvisioningAgent

```bash
cd ../ProvisioningAgent

# Deploy to AWS
agentcore launch

# Wait for deployment to complete (2-3 minutes)
# Note the Agent ARN from the output
```

**Save the ProvisioningAgent ARN** - you'll need it for Step 5.

### Step 5: Configure IAM Permissions

The MWCAgent needs permissions to invoke the other two agents, and the ProvisioningAgent needs CloudFormation permissions.

```bash
cd ..

# Edit the setup scripts with your Agent ARNs
# Update ONBOARDING_ARN and PROVISIONING_ARN in setup-agent-permissions.sh
# Update the ARNs in add-inline-policy.sh

# Run the permission setup scripts
chmod +x setup-agent-permissions.sh
chmod +x setup-provisioning-permissions.sh
chmod +x add-inline-policy.sh

./setup-agent-permissions.sh
./setup-provisioning-permissions.sh
./add-inline-policy.sh
```

### Step 6: Deploy MWCAgent (Orchestrator)

```bash
cd MWCAgent

# Deploy with environment variables pointing to the other agents
agentcore launch \
  --env ONBOARDING_AGENT_ARN="<your-onboarding-agent-arn>" \
  --env PROVISIONING_AGENT_ARN="<your-provisioning-agent-arn>"

# Wait for deployment to complete (2-3 minutes)
```

### Step 7: Verify Deployment

```bash
# Check MWCAgent status
agentcore status

# Test OnboardingAgent
cd ../OnboardingAgent
agentcore invoke '{"prompt": "Generate a CloudFormation template for a simple S3 bucket"}'

# Test ProvisioningAgent
cd ../ProvisioningAgent
agentcore invoke '{"prompt": "List available CloudFormation tools"}'

# Test full orchestration
cd ../MWCAgent
agentcore invoke '{"prompt": "Generate a CloudFormation template for a simple S3 bucket"}'
```

## 🧪 Testing the System

### Demo Prompt (Recommended)

Use this comprehensive prompt to showcase the system's capabilities:

```bash
cd OnboardingAgent

agentcore invoke '{"prompt": "Generate a cloudformation template to provision resources to meet requirements outlined in below Q and A. Output should include cloudformation template in <cfn> xml tag, architecture overview, cost optimization tips and quick summary. Q: What kind of application do you want to host ?A: It is a 3 tier web application Q: which aws region do you want the application to be hosted in ?A : us-east-1Q: Any security and/or availability requirements to keep in mind in hosting this application ?A : It should be within a private network and highly available. Q : What kind of storage requirements do you have ?A : We have 30GB of files and video data and 20GB of transaction data for this application.Q : Anything else you want us to consider ?A : Yes, we want to have minimal operations and cost overhead. And one more thing, this app is very cpu intensive."}'
```

### Expected Output

The agent will generate:
- ✅ Complete CloudFormation template with 40+ resources
- ✅ Architecture diagram showing 3-tier design
- ✅ Cost optimization recommendations
- ✅ Monthly cost estimates
- ✅ Deployment instructions
- ✅ Post-deployment steps

### Simple Test Cases

**Test 1: Simple S3 Bucket**
```bash
cd OnboardingAgent
agentcore invoke '{"prompt": "Generate a CloudFormation template for an S3 bucket with versioning"}'
```

**Test 2: Lambda Function**
```bash
agentcore invoke '{"prompt": "Create a CloudFormation template for a Python Lambda function with API Gateway"}'
```

**Test 3: Check Stack Status**
```bash
cd ../ProvisioningAgent
agentcore invoke '{"prompt": "Check the status of CloudFormation stack named my-stack"}'
```

## 📊 Architecture Decisions

This system follows documented architecture decisions:

- [ADR 0001: Use AgentCore and Strands Frameworks](docs/adr/0001-use-agentcore-and-strands-frameworks.md)
- [ADR 0003: Two-Agent Architecture](docs/adr/0003-two-agent-architecture.md)
- [ADR 0013: Agents Over Tools for Complex Workflows](docs/adr/0013-agents-over-tools-for-complex-workflows.md)

See [docs/adr/README.md](docs/adr/README.md) for all architecture decisions.

## 🔧 Configuration

### Agent Configuration Files

Each agent has a `.bedrock_agentcore.yaml` configuration file:

- `OnboardingAgent/.bedrock_agentcore.yaml`
- `ProvisioningAgent/.bedrock_agentcore.yaml`
- `MWCAgent/.bedrock_agentcore.yaml`

### Environment Variables

**MWCAgent requires:**
- `ONBOARDING_AGENT_ARN` - ARN of the OnboardingAgent
- `PROVISIONING_AGENT_ARN` - ARN of the ProvisioningAgent
- `AWS_REGION` - AWS region (default: us-east-1)

**All agents use:**
- `AWS_REGION` - AWS region for operations

## 📖 Documentation

- [DEMO-GUIDE.md](DEMO-GUIDE.md) - Complete demo script and testing guide
- [MULTI-AGENT-SETUP.md](MULTI-AGENT-SETUP.md) - Technical setup documentation
- [docs/adr/](docs/adr/) - Architecture Decision Records

## 💰 Cost Estimate

**Agent Infrastructure (Monthly):**
- OnboardingAgent: ~$10-20
- ProvisioningAgent: ~$10-20
- MWCAgent: ~$20-40
- Bedrock API calls: Variable
- **Total**: ~$40-80/month

**Note:** Costs for deployed infrastructure (EC2, RDS, etc.) are separate and depend on what you provision.

## 🧹 Cleanup

### Stop Agent Sessions (Recommended when not in use)

```bash
cd MWCAgent
agentcore stop-session

cd ../OnboardingAgent
agentcore stop-session

cd ../ProvisioningAgent
agentcore stop-session
```

### Destroy Agents (Complete Removal)

```bash
# Preview what will be deleted
cd MWCAgent
agentcore destroy --dry-run

# Destroy MWCAgent
agentcore destroy

# Destroy OnboardingAgent
cd ../OnboardingAgent
agentcore destroy

# Destroy ProvisioningAgent
cd ../ProvisioningAgent
agentcore destroy
```

### Remove IAM Policies

```bash
# Detach and delete the custom policy
aws iam detach-role-policy \
    --role-name AmazonBedrockAgentCoreSDKRuntime-us-east-1-39f859492b \
    --policy-arn arn:aws:iam::905767016260:policy/MWCAgent-InvokeOtherAgents-Policy

aws iam delete-policy \
    --policy-arn arn:aws:iam::905767016260:policy/MWCAgent-InvokeOtherAgents-Policy

# Remove inline policy
aws iam delete-role-policy \
    --role-name AmazonBedrockAgentCoreSDKRuntime-us-east-1-39f859492b \
    --policy-name InvokeOtherAgentsInline
```

## 🐛 Troubleshooting

### Agent Invocation Fails

**Error:** `Runtime initialization time exceeded`
**Solution:** Wait 30-60 seconds after deployment before first invocation

**Error:** `AccessDeniedException`
**Solution:** Verify IAM policies are attached and wait 1-2 minutes for propagation

### Template Generation Issues

**Error:** `Validation failed`
**Solution:** Check CloudWatch logs for detailed error messages
```bash
aws logs tail /aws/bedrock-agentcore/runtimes/OnboardingAgent_Agent-XXXXX-DEFAULT --follow
```

### Deployment Fails

**Error:** `CloudFormation stack creation failed`
**Solution:** Check stack events for specific resource failures
```bash
aws cloudformation describe-stack-events --stack-name <stack-name>
```

## 🔗 Useful Links

- [AWS Bedrock AgentCore Documentation](https://aws.github.io/bedrock-agentcore-starter-toolkit/)
- [CloudFormation Documentation](https://docs.aws.amazon.com/cloudformation/)
- [Strands Agent Framework](https://github.com/awslabs/strands)

## 📝 Development

### Local Development

Each agent can be run locally for development:

```bash
cd OnboardingAgent
agentcore dev

# In another terminal
agentcore invoke --dev '{"prompt": "test message"}'
```

### Adding New Tools

Edit the agent's `src/main.py` file and add new `@tool` decorated functions:

```python
@tool
def your_custom_tool(param: str) -> dict:
    """Tool description"""
    # Implementation
    return {"result": "value"}
```

### Modifying Agent Behavior

Update the `system_prompt` in each agent's `src/main.py` to change behavior.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test locally with `agentcore dev`
5. Submit a pull request

## 📄 License

[Add your license here]

## 👥 Authors

- SDFC Industries

## 🆘 Support

For issues or questions:
1. Check the [DEMO-GUIDE.md](DEMO-GUIDE.md) for common scenarios
2. Review [MULTI-AGENT-SETUP.md](MULTI-AGENT-SETUP.md) for technical details
3. Check CloudWatch logs for error details
4. Review [Architecture Decision Records](docs/adr/README.md)

---

**Built with AWS Bedrock AgentCore and Strands Agent Framework**
