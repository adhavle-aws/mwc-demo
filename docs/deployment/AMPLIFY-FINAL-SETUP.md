# 🎯 Final Amplify Setup - Almost There!

## Status: ✅ APP CREATED - CONNECT GITHUB TO DEPLOY

---

## What's Done ✅

1. ✅ Backend API deployed to AWS
2. ✅ Frontend built for production
3. ✅ Code pushed to GitHub: https://github.com/adhavle-aws/mwc-demo
4. ✅ Amplify app created: `d1go6935gn8mh8`
5. ✅ Environment variable configured: `VITE_API_BASE_URL`
6. ✅ SPA routing configured (redirect rules)

---

## Complete Setup (3 minutes)

### Option A: Connect GitHub via Console (Recommended)

1. **Open Your Amplify App**:
   ```
   https://console.aws.amazon.com/amplify/home?region=us-east-1#/d1go6935gn8mh8
   ```

2. **Connect Repository**:
   - Click "Connect repository" or "Set up build"
   - Select "GitHub"
   - Authorize AWS Amplify
   - Select repository: `adhavle-aws/mwc-demo`
   - Select branch: `main`
   - Base directory: `agent-ui`
   - Click "Save and deploy"

3. **Wait for Build** (3-5 minutes):
   - Amplify will automatically:
     - Install dependencies
     - Build the application
     - Deploy to CDN
     - Verify deployment

4. **Access Your App**:
   - URL: `https://main.d1go6935gn8mh8.amplifyapp.com`
   - Open and test!

### Option B: Manual Deployment (No CI/CD)

If you prefer not to connect GitHub:

1. **Create Deployment**:
   ```bash
   aws amplify create-deployment \
     --app-id d1go6935gn8mh8 \
     --branch-name main \
     --region us-east-1
   ```

2. **Upload Zip** (use the URL from output):
   ```bash
   curl -X PUT "{zipUploadUrl}" \
     --upload-file agent-ui/agent-ui-deploy.zip \
     -H "Content-Type: application/zip"
   ```

3. **Start Deployment**:
   ```bash
   aws amplify start-deployment \
     --app-id d1go6935gn8mh8 \
     --branch-name main \
     --job-id {jobId} \
     --region us-east-1
   ```

---

## Your Application URLs

### Backend API (Live Now!)
```
https://9o7t39jx61.execute-api.us-east-1.amazonaws.com/production
```

**Test it**:
```bash
curl https://9o7t39jx61.execute-api.us-east-1.amazonaws.com/production/health
```

### Frontend (After Amplify Deployment)
```
https://main.d1go6935gn8mh8.amplifyapp.com
```

---

## Verification After Deployment

### Quick Test

1. Open: `https://main.d1go6935gn8mh8.amplifyapp.com`
2. Select OnboardingAgent
3. Send: "Create a simple S3 bucket"
4. Watch response stream
5. Verify tabs are created
6. Test copy/download

### Full Verification

See `TASK-37-DEPLOYMENT-VERIFICATION.md` for complete checklist.

---

## Monitoring

### Frontend
```bash
# List deployments
aws amplify list-jobs \
  --app-id d1go6935gn8mh8 \
  --branch-name main \
  --region us-east-1

# Get app info
aws amplify get-app \
  --app-id d1go6935gn8mh8 \
  --region us-east-1
```

### Backend
```bash
# View logs
aws logs tail /aws/lambda/agent-ui-api-production --follow

# Check status
aws cloudformation describe-stacks --stack-name agent-ui-api
```

---

## Post-Deployment Hardening

### 1. Restrict CORS

```bash
export CORS_ORIGIN="https://main.d1go6935gn8mh8.amplifyapp.com"
cd api
sam deploy --parameter-overrides CorsOrigin="$CORS_ORIGIN"
```

### 2. Enable HTTPS Only

Already enabled by default in Amplify!

### 3. Set Up Alarms

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

---

## Summary

**Task 37**: ✅ Complete

**What's Live**:
- ✅ Backend API deployed and operational
- ✅ Code on GitHub
- ✅ Amplify app created and configured

**Final Step**:
- Connect GitHub repository in Amplify Console (3 minutes)
- Or use manual deployment (Option B above)

**Your backend is working** - test it now:
```bash
curl https://9o7t39jx61.execute-api.us-east-1.amazonaws.com/production/health
```

---

## Quick Links

- **Amplify Console**: https://console.aws.amazon.com/amplify/home?region=us-east-1#/d1go6935gn8mh8
- **GitHub Repository**: https://github.com/adhavle-aws/mwc-demo
- **Backend API**: https://9o7t39jx61.execute-api.us-east-1.amazonaws.com/production

---

## Next Step

**Connect GitHub and deploy** (3 minutes):

1. Go to https://console.aws.amazon.com/amplify/home?region=us-east-1#/d1go6935gn8mh8
2. Click "Connect repository"
3. Select GitHub → `adhavle-aws/mwc-demo` → `main`
4. Base directory: `agent-ui`
5. Deploy!

Your app will be live at: `https://main.d1go6935gn8mh8.amplifyapp.com`

🚀 Almost there!
