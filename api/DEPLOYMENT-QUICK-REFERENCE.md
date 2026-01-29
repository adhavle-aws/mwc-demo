# Deployment Quick Reference

## 🚀 Quick Deploy

```bash
# Set agent ARNs
export ONBOARDING_AGENT_ARN="arn:aws:bedrock:us-east-1:ACCOUNT:agent/ID"
export PROVISIONING_AGENT_ARN="arn:aws:bedrock:us-east-1:ACCOUNT:agent/ID"
export MWC_AGENT_ARN="arn:aws:bedrock:us-east-1:ACCOUNT:agent/ID"

# Deploy
cd api
./deploy.sh
```

## 📋 Common Commands

### Deploy to Different Environments

```bash
# Development
npm run deploy:dev

# Staging
npm run deploy:staging

# Production
npm run deploy:prod
```

### View Logs

```bash
# Real-time logs
npm run logs

# Or manually
aws logs tail /aws/lambda/agent-ui-api-production --follow
```

### Test Deployment

```bash
./test-deployment.sh
```

### Update Deployment

```bash
# After code changes
./deploy.sh
```

### Rollback

```bash
aws cloudformation rollback-stack --stack-name agent-ui-api
```

### Delete Stack

```bash
npm run destroy
```

## 🔧 Configuration

### Required Environment Variables

```bash
export ONBOARDING_AGENT_ARN="..."
export PROVISIONING_AGENT_ARN="..."
export MWC_AGENT_ARN="..."
```

### Optional Environment Variables

```bash
export ENVIRONMENT="production"      # development, staging, production
export AWS_REGION="us-east-1"       # AWS region
export CORS_ORIGIN="*"              # CORS origin (use specific domain in prod)
export S3_BUCKET="my-bucket"        # Deployment artifacts bucket
```

## 🧪 Testing

### Health Check

```bash
curl https://API_URL/health
```

### List Agents

```bash
curl https://API_URL/api/agents/list
```

### Invoke Agent

```bash
curl -X POST https://API_URL/api/agents/invoke \
  -H "Content-Type: application/json" \
  -d '{"agentId":"onboarding","prompt":"Hello"}'
```

### Get Stack Status

```bash
curl https://API_URL/api/stacks/status/my-stack-name
```

## 📊 Monitoring

### CloudWatch Dashboard

```bash
# Open in browser
open "https://console.aws.amazon.com/cloudwatch/home?region=us-east-1#dashboards:"
```

### View Metrics

```bash
# Lambda metrics
aws cloudwatch get-metric-statistics \
  --namespace AWS/Lambda \
  --metric-name Invocations \
  --dimensions Name=FunctionName,Value=agent-ui-api-production \
  --start-time $(date -u -v-1H +%Y-%m-%dT%H:%M:%S) \
  --end-time $(date -u +%Y-%m-%dT%H:%M:%S) \
  --period 300 \
  --statistics Sum
```

## 🐛 Troubleshooting

### Check Stack Status

```bash
aws cloudformation describe-stacks --stack-name agent-ui-api
```

### View Stack Events

```bash
aws cloudformation describe-stack-events \
  --stack-name agent-ui-api \
  --max-items 20
```

### Check Lambda Function

```bash
aws lambda get-function --function-name agent-ui-api-production
```

### Test Lambda Locally

```bash
sam local start-api
```

## 💰 Cost Tracking

### View Current Month Costs

```bash
aws ce get-cost-and-usage \
  --time-period Start=$(date +%Y-%m-01),End=$(date +%Y-%m-%d) \
  --granularity MONTHLY \
  --metrics BlendedCost \
  --filter file://cost-filter.json
```

## 🔐 Security

### Update IAM Permissions

Edit `template.yaml` and redeploy:
```yaml
Policies:
  - Statement:
      - Effect: Allow
        Action: bedrock:InvokeAgent
        Resource: "new-agent-arn"
```

### Rotate Credentials

Lambda uses IAM role - no credential rotation needed!

## 📚 Documentation

- [DEPLOYMENT-GUIDE.md](DEPLOYMENT-GUIDE.md) - Full deployment guide
- [AWS-INTEGRATION.md](AWS-INTEGRATION.md) - AWS integration details
- [README.md](README.md) - API documentation

