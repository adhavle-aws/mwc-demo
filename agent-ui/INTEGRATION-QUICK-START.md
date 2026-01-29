# Backend Integration - Quick Start

## TL;DR

Connect your frontend to the deployed backend API in 3 commands:

```bash
./configure-api.sh      # Configure API URL
./test-api-connection.sh # Test connection
npm run build:prod      # Build for production
```

## Prerequisites

✅ Backend API deployed to AWS (see `../api/DEPLOYMENT-GUIDE.md`)

## Step-by-Step

### 1. Configure API URL (30 seconds)

```bash
./configure-api.sh
```

**What it does**:
- Retrieves API Gateway URL from CloudFormation
- Updates `.env.production` automatically
- Creates backup of existing config

**Output**:
```
✅ Found API URL: https://abc123.execute-api.us-east-1.amazonaws.com/production
✅ Successfully updated .env.production
```

### 2. Test Connection (1 minute)

```bash
./test-api-connection.sh
```

**What it tests**:
- Health check ✅
- List agents ✅
- Agent status (all 3 agents) ✅
- Streaming support ✅

**Output**:
```
✅ All tests passed! API connection is working correctly.
```

### 3. Build for Production (1 minute)

```bash
npm run build:prod
```

**Output**:
```
✓ built in 15s
dist/index.html                   0.46 kB
dist/assets/index-abc123.css     12.34 kB
dist/assets/index-xyz789.js     234.56 kB
```

### 4. Test Locally (Optional)

```bash
npm run preview
```

Open http://localhost:4173 and test:
- Send message to OnboardingAgent
- Verify streaming works
- Check tabs are created
- Test template copy/download

### 5. Deploy to AWS Amplify

```bash
git add .env.production
git commit -m "Configure production API URL"
git push
```

Amplify automatically deploys on push.

## Troubleshooting

### "Stack not found"

**Problem**: Backend not deployed

**Solution**:
```bash
cd ../api
./deploy.sh
```

### "Tests failed"

**Problem**: API not responding

**Solution**:
```bash
# Check backend logs
cd ../api
npm run logs

# Verify stack status
aws cloudformation describe-stacks --stack-name agent-ui-api
```

### "CORS errors"

**Problem**: CORS not configured for your domain

**Solution**:
```bash
cd ../api
export CORS_ORIGIN="https://your-amplify-domain.amplifyapp.com"
./deploy.sh
```

## What Gets Configured

### .env.production

```bash
VITE_API_BASE_URL=https://abc123xyz.execute-api.us-east-1.amazonaws.com/production
```

### package.json Scripts

```json
{
  "build:prod": "tsc -b && vite build --mode production",
  "configure:api": "./configure-api.sh",
  "test:api": "./test-api-connection.sh",
  "deploy:check": "./configure-api.sh && ./test-api-connection.sh && npm run build"
}
```

## Files Created

- ✅ `.env.production` - Production API URL
- ✅ `.env.development` - Development API URL
- ✅ `configure-api.sh` - Auto-configuration script
- ✅ `test-api-connection.sh` - API testing script
- ✅ `test-e2e-integration.sh` - E2E testing script
- ✅ `BACKEND-INTEGRATION.md` - Comprehensive guide
- ✅ `PRODUCTION-DEPLOYMENT-CHECKLIST.md` - Deployment checklist
- ✅ `INTEGRATION-QUICK-START.md` - This guide

## Next Steps

After successful integration:

1. **Deploy to Amplify**: `git push`
2. **Test in Production**: Open Amplify URL
3. **Set Up Monitoring**: CloudWatch alarms
4. **Harden Security**: Specific CORS origin

## Need Help?

- **Integration Guide**: [BACKEND-INTEGRATION.md](./BACKEND-INTEGRATION.md)
- **Deployment Guide**: [AMPLIFY-DEPLOYMENT.md](./AMPLIFY-DEPLOYMENT.md)
- **Backend Guide**: [../api/DEPLOYMENT-GUIDE.md](../api/DEPLOYMENT-GUIDE.md)
- **Troubleshooting**: See BACKEND-INTEGRATION.md troubleshooting section

