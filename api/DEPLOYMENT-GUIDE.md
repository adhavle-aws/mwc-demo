# Backend API Deployment Guide

## Overview

This guide covers deploying the Agent UI Backend API to AWS using AWS SAM (Serverless Application Model). The deployment creates:

- **AWS Lambda Function**: Runs the Express.js API
- **API Gateway**: Provides HTTP endpoints
- **IAM Role**: Grants permissions to invoke Bedrock agents and access CloudFormation
- **CloudWatch Logs**: Stores application logs

## Prerequisites

### Required Tools

1. **AWS CLI v2**
   ```bash
   # Install on macOS
   brew install awscli
   
   # Verify installation
   aws --version
   ```

2. **AWS SAM CLI**
   ```bash
   # Install on macOS
   brew install aws-sam-cli
   
   # Verify installation
   sam --version
   ```

3. **Node.js 20+**
   ```bash
   # Install on macOS
   brew install node@20
   
   # Verify installation
   node --version
   ```

4. **Docker** (for SAM build)
   ```bash
   # Install Docker Desktop from https://www.docker.com/products/docker-desktop
   
   # Verify installation
   docker --version
   ```

### AWS Configuration

1. **Configure AWS Credentials**
   ```bash
   aws configure
   ```
   
   Enter:
   - AWS Access Key ID
   - AWS Secret Access Key
   - Default region (e.g., `us-east-1`)
   - Output format: `json`

2. **Verify Authentication**
   ```bash
   aws sts get-caller-identity
   ```

### Required Information

Before deploying, you need the ARNs of your deployed agents:

- **OnboardingAgent ARN**: From OnboardingAgent deployment
- **ProvisioningAgent ARN**: From ProvisioningAgent deployment
- **MWCAgent ARN**: From MWCAgent deployment

Find these ARNs by running:
```bash
cd OnboardingAgent
agentcore status | grep ARN

cd ../ProvisioningAgent
agentcore status | grep ARN

cd ../MWCAgent
agentcore status | grep ARN
```

## Deployment Steps

### Step 1: Set Environment Variables

```bash
# Required: Agent ARNs
export ONBOARDING_AGENT_ARN="arn:aws:bedrock:us-east-1:ACCOUNT_ID:agent/AGENT_ID"
export PROVISIONING_AGENT_ARN="arn:aws:bedrock:us-east-1:ACCOUNT_ID:agent/AGENT_ID"
export MWC_AGENT_ARN="arn:aws:bedrock:us-east-1:ACCOUNT_ID:agent/AGENT_ID"

# Optional: Deployment configuration
export ENVIRONMENT="production"  # or "development", "staging"
export AWS_REGION="us-east-1"
export CORS_ORIGIN="*"  # Use specific domain in production (e.g., "https://yourdomain.com")
```

### Step 2: Run Deployment Script

```bash
cd api
./deploy.sh
```

The script will:
1. ✅ Check prerequisites (AWS CLI, SAM CLI, Node.js, Docker)
2. ✅ Validate configuration (Agent ARNs)
3. ✅ Install dependencies (`npm ci`)
4. ✅ Build TypeScript (`npm run build`)
5. ✅ Create S3 bucket for deployment artifacts (if needed)
6. ✅ Build SAM application (`sam build`)
7. ✅ Deploy to AWS (`sam deploy`)
8. ✅ Display API endpoint and testing instructions

### Step 3: Test the Deployment

After deployment completes, test the API:

```bash
# Get the API URL from deployment output
API_URL="https://xxxxxxxxxx.execute-api.us-east-1.amazonaws.com/production"

# Test health check
curl $API_URL/health

# Test list agents
curl $API_URL/api/agents/list

# Test agent invocation
curl -X POST $API_URL/api/agents/invoke \
  -H "Content-Type: application/json" \
  -d '{"agentId":"onboarding","prompt":"Generate a simple S3 bucket CloudFormation template"}'
```

## Manual Deployment (Alternative)

If you prefer manual control:

### 1. Build the Application

```bash
cd api
npm ci
npm run build
```

### 2. Build SAM Application

```bash
sam build --use-container
```

### 3. Deploy with SAM

```bash
sam deploy \
  --stack-name agent-ui-api \
  --s3-bucket YOUR_DEPLOYMENT_BUCKET \
  --region us-east-1 \
  --capabilities CAPABILITY_IAM \
  --parameter-overrides \
    Environment=production \
    OnboardingAgentArn="$ONBOARDING_AGENT_ARN" \
    ProvisioningAgentArn="$PROVISIONING_AGENT_ARN" \
    MWCAgentArn="$MWC_AGENT_ARN" \
    CorsOrigin="*"
```

### 4. Get Stack Outputs

```bash
aws cloudformation describe-stacks \
  --stack-name agent-ui-api \
  --query 'Stacks[0].Outputs'
```

## Configuration Options

### Environment Variables

The Lambda function uses these environment variables:

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `NODE_ENV` | Environment mode | `production` | No |
| `AWS_REGION` | AWS region | Stack region | No |
| `ONBOARDING_AGENT_ARN` | OnboardingAgent ARN | - | Yes |
| `PROVISIONING_AGENT_ARN` | ProvisioningAgent ARN | - | Yes |
| `MWC_AGENT_ARN` | MWCAgent ARN | - | Yes |
| `ONBOARDING_AGENT_ALIAS_ID` | OnboardingAgent alias | `TSTALIASID` | No |
| `PROVISIONING_AGENT_ALIAS_ID` | ProvisioningAgent alias | `TSTALIASID` | No |
| `MWC_AGENT_ALIAS_ID` | MWCAgent alias | `TSTALIASID` | No |
| `CORS_ORIGIN` | CORS allowed origin | `*` | No |

### CloudFormation Parameters

Customize deployment with these parameters:

```bash
sam deploy \
  --parameter-overrides \
    Environment=staging \
    CorsOrigin="https://yourdomain.com"
```

## IAM Permissions

The Lambda function is granted these permissions:

### Bedrock Agent Invocation
```json
{
  "Effect": "Allow",
  "Action": ["bedrock:InvokeAgent"],
  "Resource": [
    "OnboardingAgent ARN",
    "ProvisioningAgent ARN",
    "MWCAgent ARN"
  ]
}
```

### CloudFormation Monitoring
```json
{
  "Effect": "Allow",
  "Action": [
    "cloudformation:DescribeStacks",
    "cloudformation:DescribeStackResources",
    "cloudformation:DescribeStackEvents"
  ],
  "Resource": "*"
}
```

### CloudWatch Logs
```json
{
  "Effect": "Allow",
  "Action": [
    "logs:CreateLogGroup",
    "logs:CreateLogStream",
    "logs:PutLogEvents"
  ],
  "Resource": "*"
}
```

## Monitoring and Debugging

### View Logs

```bash
# Get function name from stack outputs
FUNCTION_NAME=$(aws cloudformation describe-stacks \
  --stack-name agent-ui-api \
  --query 'Stacks[0].Outputs[?OutputKey==`FunctionName`].OutputValue' \
  --output text)

# Tail logs in real-time
aws logs tail /aws/lambda/$FUNCTION_NAME --follow

# View recent logs
aws logs tail /aws/lambda/$FUNCTION_NAME --since 1h
```

### CloudWatch Insights

Query logs with CloudWatch Insights:

```bash
# Open CloudWatch Insights in browser
aws cloudwatch get-dashboard \
  --dashboard-name agent-ui-api
```

Example queries:

```
# Find errors
fields @timestamp, @message
| filter @message like /ERROR/
| sort @timestamp desc
| limit 20

# Agent invocation latency
fields @timestamp, @duration
| filter @message like /invoking agent/
| stats avg(@duration), max(@duration), min(@duration)
```

### API Gateway Metrics

View API Gateway metrics in CloudWatch:
- Request count
- Latency (p50, p90, p99)
- 4xx and 5xx errors
- Integration latency

## Updating the Deployment

### Update Code

```bash
# Make code changes
# ...

# Redeploy
./deploy.sh
```

### Update Configuration

```bash
# Update environment variables
export CORS_ORIGIN="https://newdomain.com"

# Redeploy
./deploy.sh
```

### Update Agent ARNs

```bash
# Update agent ARNs
export ONBOARDING_AGENT_ARN="new-arn"

# Redeploy
./deploy.sh
```

## Rollback

If deployment fails or has issues:

```bash
# Rollback to previous version
aws cloudformation rollback-stack \
  --stack-name agent-ui-api

# Or delete and redeploy
aws cloudformation delete-stack \
  --stack-name agent-ui-api

# Wait for deletion
aws cloudformation wait stack-delete-complete \
  --stack-name agent-ui-api

# Redeploy
./deploy.sh
```

## Cleanup

To remove all deployed resources:

```bash
# Delete the stack
aws cloudformation delete-stack \
  --stack-name agent-ui-api

# Wait for deletion to complete
aws cloudformation wait stack-delete-complete \
  --stack-name agent-ui-api

# Optionally delete the S3 deployment bucket
aws s3 rb s3://agent-ui-api-deployment-ACCOUNT_ID --force
```

## Troubleshooting

### Issue: "SAM CLI not found"

**Solution**: Install SAM CLI
```bash
brew install aws-sam-cli
```

### Issue: "Docker not running"

**Solution**: Start Docker Desktop
```bash
open -a Docker
```

### Issue: "AccessDeniedException when invoking agent"

**Cause**: Lambda role doesn't have permission to invoke the agent

**Solution**: Verify agent ARNs are correct and IAM permissions are properly configured

### Issue: "Function timeout"

**Cause**: Agent invocation takes longer than 300 seconds

**Solution**: Increase timeout in `template.yaml`:
```yaml
Globals:
  Function:
    Timeout: 600  # Increase to 10 minutes
```

### Issue: "CORS errors in browser"

**Cause**: CORS origin not configured correctly

**Solution**: Set specific origin:
```bash
export CORS_ORIGIN="https://yourdomain.com"
./deploy.sh
```

### Issue: "Rate limiting / throttling"

**Cause**: Too many concurrent requests

**Solution**: Implement exponential backoff in client or increase Lambda concurrency:
```yaml
Resources:
  AgentUIApiFunction:
    Properties:
      ReservedConcurrentExecutions: 10
```

## Production Best Practices

### 1. Use Specific CORS Origin

```bash
export CORS_ORIGIN="https://yourdomain.com"
```

### 2. Enable API Gateway Caching

Add to `template.yaml`:
```yaml
AgentUIApi:
  Properties:
    CacheClusterEnabled: true
    CacheClusterSize: '0.5'
```

### 3. Set Up CloudWatch Alarms

```bash
# Create alarm for errors
aws cloudwatch put-metric-alarm \
  --alarm-name agent-ui-api-errors \
  --alarm-description "Alert on API errors" \
  --metric-name Errors \
  --namespace AWS/Lambda \
  --statistic Sum \
  --period 300 \
  --threshold 10 \
  --comparison-operator GreaterThanThreshold
```

### 4. Enable X-Ray Tracing

Already enabled in `template.yaml`:
```yaml
TracingEnabled: true
```

### 5. Use Secrets Manager for Sensitive Data

For production, store agent ARNs in Secrets Manager:
```bash
aws secretsmanager create-secret \
  --name agent-ui-api/agent-arns \
  --secret-string '{"onboarding":"arn:...","provisioning":"arn:...","mwc":"arn:..."}'
```

## Cost Estimation

### Lambda Costs
- **Requests**: $0.20 per 1M requests
- **Duration**: $0.0000166667 per GB-second
- **Example**: 100K requests/month, 2s avg duration, 512MB = ~$5/month

### API Gateway Costs
- **Requests**: $3.50 per 1M requests
- **Example**: 100K requests/month = ~$0.35/month

### CloudWatch Logs
- **Ingestion**: $0.50 per GB
- **Storage**: $0.03 per GB/month
- **Example**: 1GB logs/month = ~$0.53/month

### Total Estimated Cost
- **Low usage** (10K requests/month): ~$1-2/month
- **Medium usage** (100K requests/month): ~$5-10/month
- **High usage** (1M requests/month): ~$50-100/month

## Next Steps

After successful deployment:

1. ✅ Update frontend environment variables with API URL
2. ✅ Test all endpoints
3. ✅ Set up monitoring and alarms
4. ✅ Configure custom domain (optional)
5. ✅ Enable API Gateway caching (optional)
6. ✅ Set up CI/CD pipeline (optional)

## References

- [AWS SAM Documentation](https://docs.aws.amazon.com/serverless-application-model/)
- [API Gateway Documentation](https://docs.aws.amazon.com/apigateway/)
- [Lambda Documentation](https://docs.aws.amazon.com/lambda/)
- [CloudWatch Logs Documentation](https://docs.aws.amazon.com/cloudwatch/)

