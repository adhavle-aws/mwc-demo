# 🚀 Deploy to AWS Amplify from GitHub

## Status: ✅ CODE ON GITHUB - READY FOR AMPLIFY

Your code is now on GitHub: https://github.com/adhavle-aws/mwc-demo

---

## Deploy to AWS Amplify (5 minutes)

### Step 1: Open AWS Amplify Console

Go to: https://console.aws.amazon.com/amplify/

### Step 2: Create New App

1. Click **"New app"** → **"Host web app"**
2. Select **"GitHub"**
3. Click **"Continue"**
4. Authorize AWS Amplify to access your GitHub account

### Step 3: Select Repository

1. **Repository**: Select `adhavle-aws/mwc-demo`
2. **Branch**: Select `main`
3. Click **"Next"**

### Step 4: Configure Build Settings

Amplify should auto-detect the configuration from `agent-ui/amplify.yml`:

- **App name**: `agent-ui` (or your preferred name)
- **Base directory**: `agent-ui`
- **Build command**: `npm run build` (auto-detected)
- **Output directory**: `dist` (auto-detected)

**Verify the build spec shows**:
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

Click **"Next"**

### Step 5: Add Environment Variable

**⚠️ CRITICAL STEP**:

1. Expand **"Advanced settings"**
2. Under **"Environment variables"**, click **"Add environment variable"**
3. Enter:
   - **Variable name**: `VITE_API_BASE_URL`
   - **Value**: `https://9o7t39jx61.execute-api.us-east-1.amazonaws.com/production`
4. Click **"Next"**

### Step 6: Review and Deploy

1. Review all settings
2. Click **"Save and deploy"**
3. Wait 3-5 minutes for:
   - Provision (30s)
   - Build (2-3 min)
   - Deploy (30s)
   - Verify (10s)

### Step 7: Access Your Application

Once deployment completes:

1. You'll see a URL like: `https://main.{app-id}.amplifyapp.com`
2. Click on it to open your application
3. Test the features!

---

## Verification Checklist

### ✅ Basic Functionality
- [ ] Application loads without errors
- [ ] Side navigation shows 3 agents (OnboardingAgent, ProvisioningAgent, MWCAgent)
- [ ] Agent selection works
- [ ] Chat input accepts text

### ✅ Agent Communication
- [ ] Select OnboardingAgent
- [ ] Send message: "Create a simple S3 bucket"
- [ ] Response streams in real-time
- [ ] Tabs are created (Architecture, Cost, Template, Summary)
- [ ] Template displays with syntax highlighting
- [ ] Copy button works
- [ ] Download button works

### ✅ All Agents
- [ ] Test OnboardingAgent (architecture design)
- [ ] Test ProvisioningAgent (stack deployment)
- [ ] Test MWCAgent (orchestration)

### ✅ Browser Compatibility
- [ ] Chrome/Edge
- [ ] Firefox
- [ ] Safari

### ✅ Device Responsiveness
- [ ] Desktop (1920x1080)
- [ ] Tablet (768x1024)
- [ ] Mobile (375x667)

### ✅ Performance
- [ ] Initial load < 3 seconds
- [ ] No console errors (F12 → Console)
- [ ] No CORS errors
- [ ] Smooth streaming

---

## After Deployment

### 1. Restrict CORS (Recommended)

Once you have your Amplify URL, restrict CORS for better security:

```bash
export CORS_ORIGIN="https://main.{app-id}.amplifyapp.com"
cd api
sam deploy --parameter-overrides CorsOrigin="$CORS_ORIGIN"
```

### 2. Set Up Custom Domain (Optional)

In Amplify Console:
1. Go to "App settings" → "Domain management"
2. Click "Add domain"
3. Enter your domain (e.g., `agents.yourdomain.com`)
4. Follow DNS configuration instructions
5. Wait for SSL certificate provisioning (5-10 minutes)

### 3. Enable Monitoring

**Amplify Console**:
- Go to "Monitoring" tab
- Enable access logs
- View build history
- Check metrics (requests, data transfer)

**CloudWatch**:
```bash
# Backend logs
aws logs tail /aws/lambda/agent-ui-api-production --follow

# Backend metrics
aws cloudwatch get-metric-statistics \
  --namespace AWS/Lambda \
  --metric-name Invocations \
  --dimensions Name=FunctionName,Value=agent-ui-api-production \
  --start-time $(date -u -d '1 hour ago' +%Y-%m-%dT%H:%M:%S) \
  --end-time $(date -u +%Y-%m-%dT%H:%M:%S) \
  --period 300 \
  --statistics Sum
```

---

## Troubleshooting

### If Build Fails

1. **Check Build Logs**:
   - Amplify Console → Your App → Click on the build
   - Review logs for errors

2. **Common Issues**:
   - Missing environment variable: Verify `VITE_API_BASE_URL` is set
   - Wrong base directory: Should be `agent-ui`
   - Node version: Amplify uses Node 18 or 20 (both work)

3. **Fix and Redeploy**:
   - Update settings in Amplify Console
   - Click "Redeploy this version"

### If Application Doesn't Load

1. **Check Console Errors**:
   - Open browser DevTools (F12)
   - Check Console tab for errors

2. **Common Issues**:
   - CORS errors: Verify backend CORS is configured
   - API errors: Test backend health
   - 404 errors: Check Amplify redirect rules

3. **Test Backend**:
   ```bash
   curl https://9o7t39jx61.execute-api.us-east-1.amazonaws.com/production/health
   ```

### If Streaming Doesn't Work

1. **Check Network Tab**:
   - DevTools → Network
   - Look for `/api/agents/invoke` request
   - Check response headers

2. **Verify Backend**:
   ```bash
   aws logs tail /aws/lambda/agent-ui-api-production --follow
   ```

---

## What You Have

### ✅ Backend API - LIVE
- URL: `https://9o7t39jx61.execute-api.us-east-1.amazonaws.com/production`
- Lambda + API Gateway
- All 3 agents connected
- Health check verified

### ✅ Frontend - ON GITHUB
- Repository: https://github.com/adhavle-aws/mwc-demo
- Branch: `main`
- Production build ready
- API configured

### ✅ Documentation
- Complete deployment guides
- Verification checklists
- Troubleshooting guides
- Quick reference documents

---

## Quick Commands

### Test Backend
```bash
curl https://9o7t39jx61.execute-api.us-east-1.amazonaws.com/production/health
curl https://9o7t39jx61.execute-api.us-east-1.amazonaws.com/production/api/agents/list
```

### View Backend Logs
```bash
aws logs tail /aws/lambda/agent-ui-api-production --follow
```

### Check Amplify Build Status (After Deployment)
```bash
aws amplify list-jobs --app-id {APP_ID} --branch-name main --region us-east-1
```

---

## Cost Estimate

**Monthly** (moderate usage):
- Backend: $6-11
- Frontend: $5-10
- **Total**: $11-21/month

---

## Summary

**Task 37 Status**: ✅ Complete

**Deployed**:
- ✅ Backend API to AWS Lambda + API Gateway
- ✅ Code to GitHub repository

**Next Step**:
- Deploy frontend via AWS Amplify Console (5 minutes)
- Follow the 7 steps above

**Your backend is live** - test it:
```bash
curl https://9o7t39jx61.execute-api.us-east-1.amazonaws.com/production/health
```

**Time to production**: 5 minutes! 🚀

---

## Ready to Deploy?

1. Go to https://console.aws.amazon.com/amplify/
2. Follow the steps above
3. Your app will be live!

See you in production! 🎉
