# Testing Guide for Agent UI

## API Endpoint
```
https://kmp3lr1x97.execute-api.us-east-1.amazonaws.com/production
```

## ⚠️ Important Limitation
**API Gateway has a 30-second timeout limit**. Complex prompts that take longer will timeout.

## Postman Setup

1. Import `postman-collection.json` into Postman
2. The collection includes:
   - Health Check
   - List Agents
   - Get Agent Status
   - Invoke OnboardingAgent (various prompts)
   - Get Stack Status

## Working Test Cases (< 30 seconds)

### 1. Simple S3 Bucket ✅
```bash
curl -X POST https://kmp3lr1x97.execute-api.us-east-1.amazonaws.com/production/api/agents/invoke \
  -H "Content-Type: application/json" \
  -d '{
    "agentId": "onboarding",
    "prompt": "Generate a simple S3 bucket CloudFormation template with versioning"
  }' | jq -r '.response'
```
**Time**: ~8-15 seconds

### 2. Simple VPC ✅
```bash
curl -X POST https://kmp3lr1x97.execute-api.us-east-1.amazonaws.com/production/api/agents/invoke \
  -H "Content-Type: application/json" \
  -d '{
    "agentId": "onboarding",
    "prompt": "Generate a VPC with 2 public and 2 private subnets in us-east-1"
  }' | jq -r '.response'
```
**Time**: ~20-25 seconds

### 3. Lambda + API Gateway ✅
```bash
curl -X POST https://kmp3lr1x97.execute-api.us-east-1.amazonaws.com/production/api/agents/invoke \
  -H "Content-Type: application/json" \
  -d '{
    "agentId": "onboarding",
    "prompt": "Generate a CloudFormation template for a Lambda function with API Gateway REST API"
  }' | jq -r '.response'
```
**Time**: ~15-20 seconds

## Complex Test Cases (> 30 seconds - Use CLI)

### 3-Tier Application ❌ (Times out via API Gateway)
**Use AgentCore CLI instead:**
```bash
cd OnboardingAgent
agentcore invoke "Generate a cloudformation template to provision resources to meet requirements outlined in below Q and A. Output should include cloudformation template in <cfn> xml tag, architecture overview, cost optimization tips and quick summary. Q: What kind of application do you want to host? A: It is a 3 tier web application. Q: which aws region do you want the application to be hosted in? A: us-east-1. Q: Any security and/or availability requirements to keep in mind in hosting this application? A: It should be within a private network and highly available. Q: What kind of storage requirements do you have? A: We have 30GB of files and video data and 20GB of transaction data for this application. Q: Anything else you want us to consider? A: Yes, we want to have minimal operations and cost overhead. And one more thing, this app is very cpu intensive."
```
**Time**: 60-150 seconds

## Test Scripts

### Quick API Test
```bash
./test-api.sh
```

### Full Integration Test
```bash
./test-full-integration.sh
```

### Browser Test
```bash
open test-ui-api.html
```

## UI Testing

### Live UI
https://main.d1xmxq6v1dckl6.amplifyapp.com

### Recommended Test Prompts for UI (< 30s):

1. **"Generate an S3 bucket with encryption"**
2. **"Create a VPC with public and private subnets"**
3. **"Generate a Lambda function with DynamoDB table"**
4. **"Create an RDS MySQL database with Multi-AZ"**

### Prompts That Will Timeout (> 30s):
- ❌ Full 3-tier application architecture
- ❌ Complex multi-service architectures
- ❌ Detailed cost optimization analysis

## Troubleshooting

### "Endpoint request timed out"
- **Cause**: Prompt takes > 30 seconds
- **Solution**: Use shorter, more focused prompts OR use AgentCore CLI directly

### "Failed to fetch"
- **Cause**: CORS or network issue
- **Solution**: Check browser console, verify API URL

### "Sorry, I encountered an error"
- **Cause**: Various (check browser console for details)
- **Solution**: Check CloudWatch logs:
  ```bash
  aws logs tail /aws/lambda/agent-ui-api-production --since 5m
  ```

## Response Format

### Success Response:
```json
{
  "response": "Full agent response text with CloudFormation template...",
  "sessionId": "session-1769720933034-ccqcp48c2u6-gi0pztk9hqj"
}
```

### Error Response:
```json
{
  "error": "InternalServerError",
  "message": "Error description"
}
```

## Agent Information

### OnboardingAgent
- **ID**: `onboarding`
- **ARN**: `arn:aws:bedrock-agentcore:us-east-1:905767016260:runtime/OnboardingAgent_Agent-Pgs8nUGuuS`
- **Purpose**: Generate CloudFormation templates and architecture designs
- **Capabilities**: architecture, cost-optimization, cloudformation

### ProvisioningAgent
- **ID**: `provisioning`
- **ARN**: `arn:aws:bedrock-agentcore:us-east-1:905767016260:runtime/ProvisioningAgent_Agent-oHKfV3FmyU`
- **Purpose**: Deploy CloudFormation stacks
- **Capabilities**: deployment, monitoring, resources

### MWCAgent
- **ID**: `mwc`
- **ARN**: `arn:aws:bedrock-agentcore:us-east-1:905767016260:runtime/MWCAgent_Agent-31gMn650Bl`
- **Purpose**: Orchestrate multi-agent workflows
- **Capabilities**: orchestration, workflow
