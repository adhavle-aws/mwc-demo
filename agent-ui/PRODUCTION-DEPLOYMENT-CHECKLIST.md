# Production Deployment Checklist

## Overview

This checklist guides you through deploying the Agent UI to production with the backend API integration.

## Prerequisites

- [ ] Backend API deployed to AWS
- [ ] AWS CLI configured with appropriate credentials
- [ ] Node.js 18+ installed
- [ ] Git repository set up

## Deployment Steps

### Phase 1: Backend Deployment

- [ ] **1.1 Deploy Backend API**
  ```bash
  cd ../api
  export ONBOARDING_AGENT_ARN="arn:aws:bedrock:..."
  export PROVISIONING_AGENT_ARN="arn:aws:bedrock:..."
  export MWC_AGENT_ARN="arn:aws:bedrock:..."
  ./deploy.sh
  ```

- [ ] **1.2 Verify Backend Deployment**
  ```bash
  cd ../api
  ./test-deployment.sh
  ```

- [ ] **1.3 Note API Gateway URL**
  ```bash
  aws cloudformation describe-stacks \
    --stack-name agent-ui-api \
    --query 'Stacks[0].Outputs[?OutputKey==`ApiUrl`].OutputValue' \
    --output text
  ```

### Phase 2: Frontend Configuration

- [ ] **2.1 Configure Production API URL**
  ```bash
  cd ../agent-ui
  ./configure-api.sh
  ```

- [ ] **2.2 Verify Configuration**
  ```bash
  cat .env.production
  # Should show: VITE_API_BASE_URL=https://your-api-gateway-url
  ```

### Phase 3: Integration Testing

- [ ] **3.1 Test API Connection**
  ```bash
  ./test-api-connection.sh
  ```
  Expected: All tests pass (5-6 tests)

- [ ] **3.2 Run E2E Integration Tests**
  ```bash
  ./test-e2e-integration.sh
  ```
  Expected: All tests pass (7-8 tests)

- [ ] **3.3 Test Streaming (Optional)**
  - Run streaming test when prompted
  - Verify chunks arrive incrementally
  - Confirm complete response received

### Phase 4: Production Build

- [ ] **4.1 Build for Production**
  ```bash
  npm run build:prod
  ```
  Expected: Build completes without errors

- [ ] **4.2 Test Production Build Locally**
  ```bash
  npm run preview
  ```
  
  Manual verification at http://localhost:4173:
  - [ ] Select OnboardingAgent
  - [ ] Send test message
  - [ ] Verify streaming works
  - [ ] Check tabs are created
  - [ ] Test template copy/download
  - [ ] Repeat for other agents

### Phase 5: AWS Amplify Deployment

- [ ] **5.1 Commit Configuration**
  ```bash
  git add .env.production
  git commit -m "Configure production API URL"
  ```

- [ ] **5.2 Push to Repository**
  ```bash
  git push origin main
  ```

- [ ] **5.3 Configure Amplify Console**
  - Go to AWS Amplify Console
  - Select your app
  - Go to "Environment variables"
  - Add: `VITE_API_BASE_URL` = Your API Gateway URL
  - Save

- [ ] **5.4 Trigger Deployment**
  - Amplify automatically deploys on push
  - Or manually trigger from console

- [ ] **5.5 Wait for Deployment**
  - Monitor build logs in Amplify Console
  - Expected: Build succeeds in 2-5 minutes

### Phase 6: Production Verification

- [ ] **6.1 Open Production URL**
  - Get URL from Amplify Console
  - Open in browser

- [ ] **6.2 Test All Features**
  - [ ] Side navigation displays all agents
  - [ ] Agent selection works
  - [ ] Chat input accepts messages
  - [ ] Messages send successfully
  - [ ] Responses stream in real-time
  - [ ] Tabs are created correctly
  - [ ] Template syntax highlighting works
  - [ ] Copy to clipboard works
  - [ ] Download template works
  - [ ] Error handling works (test with invalid input)

- [ ] **6.3 Test All Agents**
  - [ ] OnboardingAgent: Generate template
  - [ ] ProvisioningAgent: Deploy stack (if applicable)
  - [ ] MWCAgent: Orchestrate workflow (if applicable)

- [ ] **6.4 Test on Multiple Browsers**
  - [ ] Chrome/Edge
  - [ ] Firefox
  - [ ] Safari

- [ ] **6.5 Test on Multiple Devices**
  - [ ] Desktop (1920x1080)
  - [ ] Tablet (768x1024)
  - [ ] Mobile (375x667)

### Phase 7: Production Hardening

- [ ] **7.1 Update CORS Origin**
  ```bash
  cd ../api
  export CORS_ORIGIN="https://your-amplify-domain.amplifyapp.com"
  ./deploy.sh
  ```

- [ ] **7.2 Set Up Monitoring**
  - [ ] CloudWatch alarms for API errors
  - [ ] Amplify monitoring enabled
  - [ ] SNS notifications configured (optional)

- [ ] **7.3 Configure Custom Domain** (Optional)
  - [ ] Add custom domain in Amplify Console
  - [ ] Configure DNS records
  - [ ] Wait for SSL certificate provisioning
  - [ ] Update CORS origin with custom domain

- [ ] **7.4 Enable API Gateway Caching** (Optional)
  ```yaml
  # In api/template.yaml
  CacheClusterEnabled: true
  CacheClusterSize: '0.5'
  ```

## Rollback Plan

If issues occur in production:

### Rollback Frontend

```bash
# In Amplify Console:
# 1. Go to "Deployments"
# 2. Find previous successful deployment
# 3. Click "Redeploy this version"
```

### Rollback Backend

```bash
cd ../api
aws cloudformation rollback-stack --stack-name agent-ui-api
```

## Post-Deployment

### Monitoring

**Frontend (Amplify)**:
- Build logs: Amplify Console → App → Build logs
- Access logs: Amplify Console → App → Monitoring
- Metrics: Requests, data transfer, errors

**Backend (Lambda + API Gateway)**:
- Lambda logs: CloudWatch → Log groups → `/aws/lambda/agent-ui-api-production`
- API Gateway logs: CloudWatch → Log groups → API Gateway execution logs
- Metrics: CloudWatch → Metrics → Lambda/API Gateway

### Useful Commands

```bash
# View backend logs
cd ../api
npm run logs

# Check backend status
aws cloudformation describe-stacks --stack-name agent-ui-api

# Get API URL
aws cloudformation describe-stacks \
  --stack-name agent-ui-api \
  --query 'Stacks[0].Outputs[?OutputKey==`ApiUrl`].OutputValue' \
  --output text

# Test API health
curl $(aws cloudformation describe-stacks \
  --stack-name agent-ui-api \
  --query 'Stacks[0].Outputs[?OutputKey==`ApiUrl`].OutputValue' \
  --output text)/health
```

## Success Criteria

Deployment is successful when:

- ✅ Backend API deployed and healthy
- ✅ Frontend configured with correct API URL
- ✅ All integration tests pass
- ✅ Production build completes without errors
- ✅ Frontend deployed to AWS Amplify
- ✅ All features work in production
- ✅ Streaming responses work correctly
- ✅ No CORS errors in browser console
- ✅ Error handling works as expected
- ✅ Performance meets targets

## Support

For issues during deployment:

1. **Check Logs**:
   - Backend: `cd ../api && npm run logs`
   - Frontend: Amplify Console → Build logs

2. **Run Tests**:
   - API: `./test-api-connection.sh`
   - E2E: `./test-e2e-integration.sh`

3. **Review Documentation**:
   - [BACKEND-INTEGRATION.md](./BACKEND-INTEGRATION.md)
   - [AMPLIFY-DEPLOYMENT.md](./AMPLIFY-DEPLOYMENT.md)
   - [../api/DEPLOYMENT-GUIDE.md](../api/DEPLOYMENT-GUIDE.md)

4. **Common Issues**:
   - See [BACKEND-INTEGRATION.md](./BACKEND-INTEGRATION.md) troubleshooting section

## Estimated Timeline

- Backend deployment: 5-10 minutes
- Frontend configuration: 2-3 minutes
- Integration testing: 3-5 minutes
- Production build: 1-2 minutes
- Amplify deployment: 3-5 minutes
- Production verification: 5-10 minutes

**Total**: 20-35 minutes for complete deployment

