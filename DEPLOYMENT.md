# Deployment Guide - MWC Multi-Agent System

## 🎯 Goal

Deploy the MWC multi-agent system to your AWS account to enable automated infrastructure provisioning from natural language.

## ⏱️ Time Required

- **First-time setup**: 15-20 minutes
- **Subsequent deployments**: 5-10 minutes

## 📋 Prerequisites Checklist

Before starting, ensure you have:

- [ ] AWS Account with admin or sufficient IAM permissions
- [ ] AWS CLI v2 installed and configured
- [ ] Python 3.10 or higher
- [ ] pipx installed
- [ ] Access to Amazon Bedrock (Claude models enabled)

## 🚀 Step-by-Step Deployment

### Step 1: Install AgentCore CLI (2 minutes)

```bash
# Install the AgentCore toolkit
pipx install bedrock-agentcore-starter-toolkit

# Verify installation
agentcore --help
```

### Step 2: Configure AWS Credentials (2 minutes)

```bash
# Configure AWS CLI with your credentials
aws configure
# Enter: Access Key ID
# Enter: Secret Access Key
# Enter: Default region (e.g., us-east-1)
# Enter: Output format (json)

# Verify authentication
aws sts get-caller-identity
```

**Expected output:**
```json
{
    "UserId": "AIDA...",
    "Account": "123456789012",
    "Arn": "arn:aws:iam::123456789012:user/your-username"
}
```

### Step 3: Enable Bedrock Model Access (5 minutes)

1. Go to [Amazon Bedrock Console](https://console.aws.amazon.com/bedrock/)
2. Click "Model access" in the left navigation
3. Click "Manage model access"
4. Select **Anthropic Claude** models
5. Click "Request model access"
6. Wait for approval (usually instant)

### Step 4: Deploy OnboardingAgent (3 minutes)

```bash
cd OnboardingAgent

# Deploy to AWS
agentcore launch

# Wait for "Deployment completed successfully" message
```

**📝 IMPORTANT:** Copy the Agent ARN from the output. It looks like:
```
arn:aws:bedrock-agentcore:us-east-1:123456789012:runtime/OnboardingAgent_Agent-XXXXXXXXXX
```

Save this as `ONBOARDING_AGENT_ARN` - you'll need it in Step 7.

### Step 5: Deploy ProvisioningAgent (3 minutes)

```bash
cd ../ProvisioningAgent

# Deploy to AWS
agentcore launch

# Wait for "Deployment completed successfully" message
```

**📝 IMPORTANT:** Copy the Agent ARN from the output and save as `PROVISIONING_AGENT_ARN`.

### Step 6: Configure IAM Permissions (2 minutes)

Edit the permission scripts with your Agent ARNs:

**Edit `setup-agent-permissions.sh`:**
```bash
# Update these lines with your ARNs from Steps 4 and 5
ONBOARDING_ARN="arn:aws:bedrock-agentcore:us-east-1:YOUR_ACCOUNT:runtime/OnboardingAgent_Agent-XXXXX"
PROVISIONING_ARN="arn:aws:bedrock-agentcore:us-east-1:YOUR_ACCOUNT:runtime/ProvisioningAgent_Agent-XXXXX"
```

**Edit `add-inline-policy.sh`:**
```bash
# Update the Resource array with your ARNs
```

**Run the scripts:**
```bash
cd ..
chmod +x *.sh
./setup-agent-permissions.sh
./setup-provisioning-permissions.sh
./add-inline-policy.sh
```

### Step 7: Deploy MWCAgent Orchestrator (3 minutes)

```bash
cd MWCAgent

# Deploy with environment variables
agentcore launch \
  --env ONBOARDING_AGENT_ARN="<your-onboarding-arn-from-step-4>" \
  --env PROVISIONING_AGENT_ARN="<your-provisioning-arn-from-step-5>"

# Wait for "Deployment completed successfully" message
```

### Step 8: Test the System (2 minutes)

**Quick Test:**
```bash
cd ../OnboardingAgent
agentcore invoke '{"prompt": "Generate a CloudFormation template for a simple S3 bucket with versioning"}'
```

**Full Demo Test:**
```bash
agentcore invoke '{"prompt": "Generate a cloudformation template to provision resources to meet requirements outlined in below Q and A. Output should include cloudformation template in <cfn> xml tag, architecture overview, cost optimization tips and quick summary. Q: What kind of application do you want to host ?A: It is a 3 tier web application Q: which aws region do you want the application to be hosted in ?A : us-east-1Q: Any security and/or availability requirements to keep in mind in hosting this application ?A : It should be within a private network and highly available. Q : What kind of storage requirements do you have ?A : We have 30GB of files and video data and 20GB of transaction data for this application.Q : Anything else you want us to consider ?A : Yes, we want to have minimal operations and cost overhead. And one more thing, this app is very cpu intensive."}'
```

## ✅ Verification

After deployment, verify each agent:

```bash
# Check OnboardingAgent
cd OnboardingAgent
agentcore status

# Check ProvisioningAgent
cd ../ProvisioningAgent
agentcore status

# Check MWCAgent
cd ../MWCAgent
agentcore status
```

All agents should show status: **"Ready - Agent deployed and endpoint available"**

## 🎬 Running the Demo

### Option 1: Individual Agent Demo

Show OnboardingAgent generating a comprehensive template:

```bash
cd OnboardingAgent
agentcore invoke '{"prompt": "Generate a cloudformation template to provision resources to meet requirements outlined in below Q and A. Output should include cloudformation template in <cfn> xml tag, architecture overview, cost optimization tips and quick summary. Q: What kind of application do you want to host ?A: It is a 3 tier web application Q: which aws region do you want the application to be hosted in ?A : us-east-1Q: Any security and/or availability requirements to keep in mind in hosting this application ?A : It should be within a private network and highly available. Q : What kind of storage requirements do you have ?A : We have 30GB of files and video data and 20GB of transaction data for this application.Q : Anything else you want us to consider ?A : Yes, we want to have minimal operations and cost overhead. And one more thing, this app is very cpu intensive."}'
```

**What to highlight:**
- Natural language input → Production CloudFormation template
- 40+ AWS resources configured
- Architecture diagrams included
- Cost optimization recommendations
- Security best practices applied
- Complete deployment instructions

### Option 2: Full Orchestration Demo (When IAM propagates)

```bash
cd MWCAgent
agentcore invoke '{"prompt": "I need infrastructure for a 3-tier web application in us-east-1"}'
```

## 🔍 Monitoring

### View Agent Logs

```bash
# OnboardingAgent logs
aws logs tail /aws/bedrock-agentcore/runtimes/OnboardingAgent_Agent-XXXXX-DEFAULT --follow

# ProvisioningAgent logs
aws logs tail /aws/bedrock-agentcore/runtimes/ProvisioningAgent_Agent-XXXXX-DEFAULT --follow

# MWCAgent logs
aws logs tail /aws/bedrock-agentcore/runtimes/MWCAgent_Agent-XXXXX-DEFAULT --follow
```

### GenAI Observability Dashboard

View all agent activity in one place:
https://console.aws.amazon.com/cloudwatch/home?region=us-east-1#gen-ai-observability/agent-core

## 🧹 Cleanup

### Stop Sessions (Recommended when not in use)

```bash
cd MWCAgent && agentcore stop-session
cd ../OnboardingAgent && agentcore stop-session
cd ../ProvisioningAgent && agentcore stop-session
```

### Complete Removal

```bash
# Preview what will be deleted
cd MWCAgent && agentcore destroy --dry-run

# Destroy all agents
cd MWCAgent && agentcore destroy
cd ../OnboardingAgent && agentcore destroy
cd ../ProvisioningAgent && agentcore destroy

# Remove IAM policies
aws iam detach-role-policy \
    --role-name AmazonBedrockAgentCoreSDKRuntime-us-east-1-39f859492b \
    --policy-arn arn:aws:iam::YOUR_ACCOUNT:policy/MWCAgent-InvokeOtherAgents-Policy

aws iam delete-policy \
    --policy-arn arn:aws:iam::YOUR_ACCOUNT:policy/MWCAgent-InvokeOtherAgents-Policy
```

## 🐛 Troubleshooting

### Issue: "Runtime initialization time exceeded"

**Cause:** First invocation after deployment takes time to initialize

**Solution:** Wait 30-60 seconds after deployment, then try again

### Issue: "AccessDeniedException"

**Cause:** IAM permissions not propagated or not configured correctly

**Solution:**
1. Verify policies are attached: `aws iam list-attached-role-policies --role-name <role-name>`
2. Wait 1-2 minutes for IAM propagation
3. Redeploy the agent to pick up new permissions

### Issue: "Model access denied"

**Cause:** Bedrock model access not enabled

**Solution:** Follow Step 3 to enable Bedrock model access

### Issue: "No such option: --version"

**Cause:** Old version of agentcore CLI

**Solution:** Update the toolkit: `pipx upgrade bedrock-agentcore-starter-toolkit`

## 💡 Tips

1. **Use `agentcore launch` or `agentcore deploy`** - they're the same command
2. **Test locally first** with `agentcore dev` before deploying
3. **Stop sessions** when not in use to save costs
4. **Check logs** if something doesn't work as expected
5. **Wait for IAM propagation** (1-2 minutes) after permission changes

## 📊 Cost Estimate

**Monthly costs for the agent infrastructure:**
- OnboardingAgent: ~$10-20
- ProvisioningAgent: ~$10-20
- MWCAgent: ~$20-40
- Bedrock API calls: Variable based on usage
- **Total**: ~$40-80/month

**Note:** Costs for deployed infrastructure (EC2, RDS, etc.) are separate.

## 📚 Additional Documentation

- [README.md](README.md) - Complete project overview
- [DEMO-GUIDE.md](DEMO-GUIDE.md) - Demo script and testing guide
- [MULTI-AGENT-SETUP.md](MULTI-AGENT-SETUP.md) - Technical architecture details
- [docs/adr/](docs/adr/) - Architecture Decision Records

## 🆘 Getting Help

1. Check CloudWatch logs for detailed error messages
2. Review the troubleshooting section above
3. Consult [AWS Bedrock AgentCore Documentation](https://aws.github.io/bedrock-agentcore-starter-toolkit/)
4. Check [Architecture Decision Records](docs/adr/README.md) for design rationale

---

**Ready to deploy? Start with Step 1!** 🚀
