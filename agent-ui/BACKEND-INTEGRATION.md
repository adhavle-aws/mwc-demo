# Backend Integration Guide

## Overview

This guide covers connecting the Agent UI frontend to the deployed backend API. The integration enables the frontend to communicate with AWS Bedrock AgentCore through the API Gateway and Lambda backend.

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    Frontend (AWS Amplify)                        │
│                    React + TypeScript                            │
└────────────────────────┬────────────────────────────────────────┘
                         │ HTTPS
                         │ API_BASE_URL from .env.production
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│              Backend API (API Gateway + Lambda)                  │
│              Endpoints: /api/agents/*, /api/stacks/*             │
└────────────────────────┬────────────────────────────────────────┘
                         │ AWS SDK
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│                  AWS Bedrock AgentCore                           │
│         OnboardingAgent | ProvisioningAgent | MWCAgent           │
└─────────────────────────────────────────────────────────────────┘
```

## Prerequisites

Before connecting the frontend to the backend:

1. ✅ **Backend API Deployed**
   - The backend API must be deployed to AWS
   - See `../api/DEPLOYMENT-GUIDE.md` for deployment instructions
   - Verify deployment: `cd ../api && aws cloudformation describe-stacks --stack-name agent-ui-api`

2. ✅ **AWS CLI Configured**
   - AWS CLI installed and configured
   - Credentials with access to CloudFormation
   - Run: `aws sts get-caller-identity` to verify

3. ✅ **API Gateway URL Available**
   - Get from CloudFormation stack outputs
   - Format: `https://{api-id}.execute-api.{region}.amazonaws.com/{stage}`

## Quick Start

### Automatic Configuration (Recommended)

```bash
# 1. Configure API URL automatically
./configure-api.sh

# 2. Test the connection
./test-api-connection.sh

# 3. Build for production
npm run build

# 4. Test locally with production API
npm run preview

# 5. Deploy to AWS Amplify
git add .env.production
git commit -m "Configure production API URL"
git push
```

### Manual Configuration

If you prefer manual setup:

1. **Get API URL from CloudFormation**
   ```bash
   cd ../api
   aws cloudformation describe-stacks \
     --stack-name agent-ui-api \
     --query 'Stacks[0].Outputs[?OutputKey==`ApiUrl`].OutputValue' \
     --output text
   ```

2. **Update .env.production**
   ```bash
   # Edit .env.production
   VITE_API_BASE_URL=https://your-api-gateway-url
   ```

3. **Test the connection**
   ```bash
   ./test-api-connection.sh
   ```

## Environment Configuration

### Development Environment

**File**: `.env.development`

```bash
# Local development - backend running on localhost
VITE_API_BASE_URL=http://localhost:3001
```

**Usage**:
- Used when running `npm run dev`
- Points to local backend server
- Requires backend running locally: `cd ../api && npm run dev`

### Production Environment

**File**: `.env.production`

```bash
# Production - deployed API Gateway
VITE_API_BASE_URL=https://abc123xyz.execute-api.us-east-1.amazonaws.com/production
```

**Usage**:
- Used when running `npm run build`
- Points to deployed API Gateway
- Embedded at build time (not runtime)

### Environment Variable Rules

1. **Prefix Required**: All client-side variables must start with `VITE_`
2. **Build Time**: Variables are embedded during build, not at runtime
3. **Restart Required**: Changes require restarting dev server or rebuilding
4. **No Secrets**: Never put sensitive data in environment variables (they're public in the browser)

## API Service Configuration

The API service (`src/services/agentService.ts`) automatically uses the configured API URL:

```typescript
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';
```

**Fallback Behavior**:
- If `VITE_API_BASE_URL` is not set, defaults to `/api` (relative path)
- Relative paths work when frontend and backend are on the same domain
- Absolute URLs required when frontend and backend are on different domains

## Testing the Integration

### 1. Automated Testing

Run the comprehensive test script:

```bash
./test-api-connection.sh
```

**Tests Performed**:
- ✅ Health check endpoint
- ✅ List agents endpoint
- ✅ Get agent status (all three agents)
- ✅ Agent invocation (optional)
- ✅ Streaming support verification

### 2. Manual Testing

Test individual endpoints:

```bash
# Get API URL
API_URL=$(grep "^VITE_API_BASE_URL=" .env.production | cut -d '=' -f2)

# Test health check
curl $API_URL/health

# Test list agents
curl $API_URL/api/agents/list

# Test agent status
curl "$API_URL/api/agents/status?agentId=onboarding"

# Test agent invocation
curl -X POST $API_URL/api/agents/invoke \
  -H "Content-Type: application/json" \
  -d '{"agentId":"onboarding","prompt":"Hello"}'
```

### 3. Frontend Testing

Test the frontend with the production API:

```bash
# Build with production configuration
npm run build

# Preview the production build
npm run preview

# Open browser to http://localhost:4173
# Test all three agents
# Verify streaming responses work
```

## Streaming Support

The integration supports streaming responses for real-time agent output.

### How It Works

1. **Frontend**: Uses `invokeAgent()` generator function
   ```typescript
   for await (const chunk of invokeAgent(request)) {
     // Display chunk in real-time
   }
   ```

2. **Backend**: Returns streaming response from Bedrock
   ```typescript
   // Lambda streams response chunks
   response.body.getReader().read()
   ```

3. **API Gateway**: Passes through streaming data
   - No buffering
   - Chunks sent as they arrive

### Testing Streaming

```bash
# Test streaming with curl
curl -X POST $API_URL/api/agents/invoke \
  -H "Content-Type: application/json" \
  -d '{"agentId":"onboarding","prompt":"Generate a CloudFormation template"}' \
  --no-buffer

# Should see chunks arriving in real-time
```

## CORS Configuration

### Backend CORS Settings

The backend API is configured with CORS headers:

```yaml
# In api/template.yaml
Cors:
  AllowOrigin: "'*'"  # Configurable
  AllowMethods: "'GET,POST,OPTIONS'"
  AllowHeaders: "'Content-Type,X-Amz-Date,Authorization,X-Api-Key'"
```

### Production CORS

For production, restrict CORS to your frontend domain:

```bash
# Redeploy backend with specific origin
cd ../api
export CORS_ORIGIN="https://yourdomain.com"
./deploy.sh
```

### CORS Troubleshooting

If you see CORS errors in the browser console:

1. **Check backend CORS configuration**
   ```bash
   cd ../api
   aws cloudformation describe-stacks \
     --stack-name agent-ui-api \
     --query 'Stacks[0].Parameters[?ParameterKey==`CorsOrigin`].ParameterValue'
   ```

2. **Update CORS origin**
   ```bash
   export CORS_ORIGIN="https://your-amplify-domain.amplifyapp.com"
   ./deploy.sh
   ```

3. **Verify CORS headers**
   ```bash
   curl -I -X OPTIONS $API_URL/api/agents/invoke \
     -H "Origin: https://your-frontend-domain.com"
   ```

## Deployment Workflow

### Complete Deployment Process

```bash
# 1. Deploy backend API (if not already deployed)
cd ../api
export ONBOARDING_AGENT_ARN="arn:aws:bedrock:..."
export PROVISIONING_AGENT_ARN="arn:aws:bedrock:..."
export MWC_AGENT_ARN="arn:aws:bedrock:..."
./deploy.sh

# 2. Configure frontend with API URL
cd ../agent-ui
./configure-api.sh

# 3. Test the integration
./test-api-connection.sh

# 4. Build frontend
npm run build

# 5. Test production build locally
npm run preview

# 6. Deploy to AWS Amplify
git add .env.production
git commit -m "Configure production API URL"
git push

# 7. Verify deployment
# Open your Amplify URL and test all features
```

### AWS Amplify Configuration

**Environment Variables in Amplify Console**:

1. Go to AWS Amplify Console
2. Select your app
3. Go to "Environment variables"
4. Add:
   - Key: `VITE_API_BASE_URL`
   - Value: Your API Gateway URL

**Build Settings** (`amplify.yml`):

```yaml
version: 1
frontend:
  phases:
    preBuild:
      commands:
        - npm ci
    build:
      commands:
        - npm run build
  artifacts:
    baseDirectory: dist
    files:
      - '**/*'
  cache:
    paths:
      - node_modules/**/*
```

## Monitoring and Debugging

### Frontend Debugging

**Enable Debug Logging**:

The API service includes built-in logging:

```typescript
// Logs are automatically written to console
// Check browser console for:
// - [AgentService] POST /api/agents/invoke
// - [AgentService] Response from /api/agents/invoke
// - [AgentService] Error from /api/agents/invoke
```

**Browser DevTools**:
1. Open DevTools (F12)
2. Go to Network tab
3. Filter by "Fetch/XHR"
4. Watch API requests in real-time

### Backend Debugging

**View Lambda Logs**:

```bash
cd ../api
npm run logs

# Or manually
aws logs tail /aws/lambda/agent-ui-api-production --follow
```

**CloudWatch Insights**:

```bash
# Find errors
fields @timestamp, @message
| filter @message like /ERROR/
| sort @timestamp desc
| limit 20
```

### Common Issues

#### Issue 1: "Network Error" in Frontend

**Symptoms**: API requests fail with network error

**Causes**:
- Backend not deployed
- Incorrect API URL
- CORS issues

**Solutions**:
```bash
# Verify backend is deployed
cd ../api
aws cloudformation describe-stacks --stack-name agent-ui-api

# Check API URL in .env.production
cat .env.production

# Test API directly
./test-api-connection.sh
```

#### Issue 2: "CORS Error" in Browser

**Symptoms**: Browser console shows CORS policy error

**Causes**:
- Backend CORS not configured for frontend domain
- OPTIONS preflight failing

**Solutions**:
```bash
# Update backend CORS
cd ../api
export CORS_ORIGIN="https://your-frontend-domain.com"
./deploy.sh

# Verify CORS headers
curl -I -X OPTIONS $API_URL/api/agents/invoke \
  -H "Origin: https://your-frontend-domain.com"
```

#### Issue 3: "Agent Invocation Fails"

**Symptoms**: Agent invocation returns 500 error

**Causes**:
- Invalid agent ARN
- Lambda doesn't have permission
- Agent not deployed

**Solutions**:
```bash
# Check backend logs
cd ../api
npm run logs

# Verify agent ARNs
aws cloudformation describe-stacks \
  --stack-name agent-ui-api \
  --query 'Stacks[0].Parameters'

# Test agent directly
aws bedrock-agent-runtime invoke-agent \
  --agent-id YOUR_AGENT_ID \
  --agent-alias-id TSTALIASID \
  --session-id test-session \
  --input-text "Hello"
```

#### Issue 4: "Streaming Not Working"

**Symptoms**: Response arrives all at once, not incrementally

**Causes**:
- API Gateway buffering
- Frontend not handling streaming correctly
- Lambda timeout

**Solutions**:
```bash
# Test streaming with curl
curl -X POST $API_URL/api/agents/invoke \
  -H "Content-Type: application/json" \
  -d '{"agentId":"onboarding","prompt":"Test"}' \
  --no-buffer

# Check Lambda timeout
aws cloudformation describe-stacks \
  --stack-name agent-ui-api \
  --query 'Stacks[0].Parameters[?ParameterKey==`Timeout`]'
```

## Performance Optimization

### 1. API Response Caching

For frequently accessed endpoints (like agent status):

```typescript
// Implement caching in frontend
const cache = new Map();
const CACHE_TTL = 60000; // 1 minute

async function checkAgentStatusCached(agentId: string) {
  const cached = cache.get(agentId);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data;
  }
  
  const data = await checkAgentStatus(agentId);
  cache.set(agentId, { data, timestamp: Date.now() });
  return data;
}
```

### 2. Request Debouncing

For user input that triggers API calls:

```typescript
// Debounce agent invocation
const debouncedInvoke = debounce(invokeAgent, 500);
```

### 3. Connection Pooling

The API service automatically reuses connections:
- Fetch API handles connection pooling
- HTTP/2 multiplexing when available
- Keep-alive connections

## Security Considerations

### 1. API URL Security

- ✅ API URL is public (embedded in frontend code)
- ✅ No secrets in environment variables
- ✅ Authentication handled by AWS IAM (backend)
- ✅ CORS restricts which domains can call the API

### 2. Data Security

- ✅ All communication over HTTPS
- ✅ No sensitive data stored in browser
- ✅ Session data cleared on logout
- ✅ CloudWatch logs encrypted at rest

### 3. Rate Limiting

Consider implementing rate limiting:

```typescript
// Simple rate limiter
class RateLimiter {
  private requests: number[] = [];
  private limit = 10; // requests
  private window = 60000; // per minute
  
  canMakeRequest(): boolean {
    const now = Date.now();
    this.requests = this.requests.filter(t => now - t < this.window);
    return this.requests.length < this.limit;
  }
  
  recordRequest(): void {
    this.requests.push(Date.now());
  }
}
```

## Cost Optimization

### API Gateway Costs

- **Requests**: $3.50 per 1M requests
- **Data Transfer**: $0.09 per GB (out)

**Optimization**:
- Cache agent status checks
- Debounce user input
- Compress responses (gzip)

### Lambda Costs

- **Requests**: $0.20 per 1M requests
- **Duration**: $0.0000166667 per GB-second

**Optimization**:
- Reduce Lambda memory if possible
- Optimize cold start time
- Use Lambda reserved concurrency

## Next Steps

After successful integration:

1. ✅ **Test All Features**
   - Test all three agents
   - Verify streaming works
   - Test error handling
   - Test on multiple browsers

2. ✅ **Set Up Monitoring**
   - CloudWatch alarms for errors
   - API Gateway metrics
   - Lambda performance metrics

3. ✅ **Production Hardening**
   - Set specific CORS origin
   - Enable API Gateway caching
   - Set up custom domain
   - Configure WAF (optional)

4. ✅ **CI/CD Pipeline**
   - Automate testing
   - Automate deployment
   - Blue/green deployments

## References

- [API Service Implementation](./src/services/agentService.ts)
- [Backend Deployment Guide](../api/DEPLOYMENT-GUIDE.md)
- [Environment Variables Guide](./ENVIRONMENT-VARIABLES.md)
- [AWS Amplify Deployment](./AMPLIFY-DEPLOYMENT.md)

## Support

For issues or questions:

1. Check this guide's troubleshooting section
2. Review backend logs: `cd ../api && npm run logs`
3. Test API connection: `./test-api-connection.sh`
4. Check AWS CloudFormation console for stack status

