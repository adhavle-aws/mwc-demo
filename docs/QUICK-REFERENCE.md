# Quick Deployment Reference

## One-Command Setup (After Prerequisites)

```bash
# 1. Install AgentCore CLI
pipx install bedrock-agentcore-starter-toolkit

# 2. Configure AWS
aws configure

# 3. Deploy OnboardingAgent
cd OnboardingAgent && agentcore launch
# Save the ARN from output

# 4. Deploy ProvisioningAgent  
cd ../ProvisioningAgent && agentcore launch
# Save the ARN from output

# 5. Setup permissions (edit ARNs in scripts first)
cd .. && ./setup-agent-permissions.sh && ./setup-provisioning-permissions.sh && ./add-inline-policy.sh

# 6. Deploy MWCAgent with ARNs
cd MWCAgent
agentcore launch \
  --env ONBOARDING_AGENT_ARN="<paste-onboarding-arn>" \
  --env PROVISIONING_AGENT_ARN="<paste-provisioning-arn>"

# 7. Test the system
agentcore invoke '{"prompt": "Generate a CloudFormation template for an S3 bucket"}'
```

## Demo Command

```bash
cd OnboardingAgent
agentcore invoke '{"prompt": "Generate a cloudformation template to provision resources to meet requirements outlined in below Q and A. Output should include cloudformation template in <cfn> xml tag, architecture overview, cost optimization tips and quick summary. Q: What kind of application do you want to host ?A: It is a 3 tier web application Q: which aws region do you want the application to be hosted in ?A : us-east-1Q: Any security and/or availability requirements to keep in mind in hosting this application ?A : It should be within a private network and highly available. Q : What kind of storage requirements do you have ?A : We have 30GB of files and video data and 20GB of transaction data for this application.Q : Anything else you want us to consider ?A : Yes, we want to have minimal operations and cost overhead. And one more thing, this app is very cpu intensive."}'
```

## Cleanup

```bash
cd MWCAgent && agentcore destroy
cd ../OnboardingAgent && agentcore destroy
cd ../ProvisioningAgent && agentcore destroy
```
