# AWS Amplify Deployment - Next Steps

## Current Status

✅ **Backend API**: Deployed and running
✅ **Frontend**: Built and ready for deployment
✅ **Configuration**: Complete
✅ **Code**: Committed to git

⏳ **Remaining**: Push to GitLab and deploy to Amplify

## Your Backend API is Live!

**API URL**: `https://9o7t39jx61.execute-api.us-east-1.amazonaws.com/production`

Test it:
```bash
curl https://9o7t39jx61.execute-api.us-east-1.amazonaws.com/production/health
```

## Complete Deployment in 3 Steps

### Step 1: Configure GitLab SSH (5 minutes)

If you don't have SSH keys configured:

```bash
# Generate SSH key
ssh-keygen -t ed25519 -C "your_email@example.com"

# Display public key
cat ~/.ssh/id_ed25519.pub
```

**Add to GitLab**:
1. Copy the public key output
2. Go to GitLab → Settings → SSH Keys
3. Paste and save

**Test connection**:
```bash
ssh -T git@ssh.gitlab.aws.dev
```

### Step 2: Push to Repository (1 minute)

```bash
git push origin main
```

### Step 3: Deploy to AWS Amplify (10 minutes)

#### Via AWS Console (Easiest)

1. **Open Amplify Console**:
   - Go to https://console.aws.amazon.com/amplify/

2. **Create New App**:
   - Click "New app" → "Host web app"
   - Select "GitLab"
   - Authorize AWS Amplify

3. **Select Repository**:
   - Repository: `adhavle/ict-demo-mwc`
   - Branch: `main`
   - Click "Next"

4. **Configure Build**:
   - App name: `agent-ui`
   - Base directory: `agent-ui`
   - Build command: `npm run build`
   - Output directory: `dist`
   - Amplify should auto-detect `amplify.yml`
   - Click "Next"

5. **Set Environment Variable**:
   - Before deploying, go to "App settings" → "Environment variables"
   - Click "Add variable"
   - Name: `VITE_API_BASE_URL`
   - Value: `https://9o7t39jx61.execute-api.us-east-1.amazonaws.com/production`
   - Click "Save"

6. **Deploy**:
   - Click "Save and deploy"
   - Wait 3-5 minutes
   - Get your URL: `https://main.{app-id}.amplifyapp.com`

#### Via AWS CLI (Alternative)

```bash
# Create app
aws amplify create-app \
  --name agent-ui \
  --repository https://ssh.gitlab.aws.dev/adhavle/ict-demo-mwc \
  --region us-east-1

# Note the app-id from output

# Create branch
aws amplify create-branch \
  --app-id {APP_ID} \
  --branch-name main \
  --enable-auto-build

# Set environment variable
aws amplify update-app \
  --app-id {APP_ID} \
  --environment-variables VITE_API_BASE_URL=https://9o7t39jx61.execute-api.us-east-1.amazonaws.com/production

# Start deployment
aws amplify start-job \
  --app-id {APP_ID} \
  --branch-name main \
  --job-type RELEASE
```

## Verify Your Deployment

Once Amplify deployment completes:

### 1. Open Your Application
Navigate to: `https://main.{app-id}.amplifyapp.com`

### 2. Test Core Features

**Basic Functionality**:
- [ ] Page loads without errors
- [ ] Side navigation shows 3 agents
- [ ] Agent selection works
- [ ] Chat input accepts text

**Agent Interaction**:
- [ ] Select OnboardingAgent
- [ ] Send message: "Create a simple S3 bucket"
- [ ] Response streams in real-time
- [ ] Tabs are created (Architecture, Cost, Template, Summary)
- [ ] Template displays with syntax highlighting
- [ ] Copy button works
- [ ] Download button works

**All Agents**:
- [ ] Test OnboardingAgent
- [ ] Test ProvisioningAgent
- [ ] Test MWCAgent

### 3. Browser Testing

Test on:
- [ ] Chrome/Edge
- [ ] Firefox
- [ ] Safari

### 4. Device Testing

Test on:
- [ ] Desktop (1920x1080)
- [ ] Tablet (768x1024)
- [ ] Mobile (375x667)

### 5. Performance Check

Open DevTools → Network tab:
- [ ] Initial load < 3 seconds
- [ ] No failed requests
- [ ] No CORS errors
- [ ] Assets served from CDN

## Troubleshooting

### If Build Fails on Amplify

1. **Check Build Logs**:
   - Amplify Console → Your App → Build logs

2. **Common Issues**:
   - Missing environment variable: Add `VITE_API_BASE_URL`
   - Wrong base directory: Should be `agent-ui`
   - Node version: Amplify uses Node 18 or 20 (both work)

3. **Fix and Redeploy**:
   - Make changes in Amplify Console
   - Click "Redeploy this version"

### If Application Doesn't Load

1. **Check Console Errors**:
   - Open browser DevTools (F12)
   - Check Console tab

2. **Common Issues**:
   - CORS errors: Verify API Gateway CORS configuration
   - 404 errors: Check Amplify redirect rules in `amplify.yml`
   - API errors: Verify backend is healthy

3. **Test Backend**:
   ```bash
   curl https://9o7t39jx61.execute-api.us-east-1.amazonaws.com/production/health
   ```

### If Streaming Doesn't Work

1. **Check API Response**:
   - Open DevTools → Network tab
   - Look for `/api/agents/invoke` request
   - Check response headers

2. **Verify Backend**:
   ```bash
   aws logs tail /aws/lambda/agent-ui-api-production --follow
   ```

## Post-Deployment Hardening

### 1. Restrict CORS (Recommended)

After getting your Amplify URL:

```bash
export CORS_ORIGIN="https://main.{app-id}.amplifyapp.com"
cd api
sam deploy --parameter-overrides CorsOrigin="$CORS_ORIGIN"
```

### 2. Set Up Monitoring

**CloudWatch Alarms**:
```bash
# Create alarm for Lambda errors
aws cloudwatch put-metric-alarm \
  --alarm-name agent-ui-api-errors \
  --alarm-description "Alert on Lambda errors" \
  --metric-name Errors \
  --namespace AWS/Lambda \
  --statistic Sum \
  --period 300 \
  --evaluation-periods 1 \
  --threshold 5 \
  --comparison-operator GreaterThanThreshold \
  --dimensions Name=FunctionName,Value=agent-ui-api-production
```

### 3. Custom Domain (Optional)

In Amplify Console:
1. Go to "App settings" → "Domain management"
2. Click "Add domain"
3. Enter your domain
4. Follow DNS configuration instructions

## Support Resources

### Documentation
- `TASK-37-DEPLOYMENT-VERIFICATION.md` - Detailed verification checklist
- `TASK-37-COMPLETION-SUMMARY.md` - Complete summary
- `agent-ui/AMPLIFY-DEPLOYMENT.md` - Amplify-specific guide
- `agent-ui/DEPLOYMENT-GUIDE.md` - Multi-platform deployment
- `agent-ui/PRODUCTION-DEPLOYMENT-CHECKLIST.md` - Step-by-step checklist

### Quick Commands
```bash
# Test backend
curl https://9o7t39jx61.execute-api.us-east-1.amazonaws.com/production/health

# View backend logs
aws logs tail /aws/lambda/agent-ui-api-production --follow

# Check backend status
aws cloudformation describe-stacks --stack-name agent-ui-api

# Build frontend
cd agent-ui && npm run build:prod

# Test frontend locally
cd agent-ui && npm run preview
```

## What You Have Now

✅ **Production-Ready Application**:
- Modern React UI with TypeScript
- Real-time agent communication
- Structured response visualization
- CloudFormation template display
- Deployment progress tracking
- Error handling and retry logic
- Session persistence
- Responsive design

✅ **Deployed Backend**:
- AWS Lambda + API Gateway
- Streaming response support
- Three AI agents integrated
- CloudFormation monitoring
- Comprehensive error handling

✅ **Complete Documentation**:
- Deployment guides
- Testing procedures
- Troubleshooting tips
- Architecture diagrams
- API documentation

## Estimated Costs

**Monthly** (moderate usage):
- Backend: $6-11
- Frontend: $5-10
- **Total**: $11-21/month

**Per Request**:
- Lambda: $0.00002
- API Gateway: $0.0000035
- **Total**: ~$0.000024 per request

## You're Almost There!

Just 3 steps away from a live production application:

1. Configure SSH keys (5 min)
2. Push to GitLab (1 min)
3. Set up Amplify (10 min)

**Total time**: 15-20 minutes to production! 🚀

---

**Need Help?**

- Check `TASK-37-DEPLOYMENT-VERIFICATION.md` for detailed instructions
- Review `agent-ui/AMPLIFY-DEPLOYMENT.md` for Amplify-specific guidance
- See `agent-ui/PRODUCTION-DEPLOYMENT-CHECKLIST.md` for step-by-step checklist

**Questions?**

- Backend issues: Check `api/DEPLOYMENT-GUIDE.md`
- Frontend issues: Check `agent-ui/DEPLOYMENT-GUIDE.md`
- Integration issues: Check `agent-ui/BACKEND-INTEGRATION.md`
