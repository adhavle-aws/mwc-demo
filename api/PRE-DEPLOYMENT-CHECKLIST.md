# Pre-Deployment Checklist

Use this checklist before deploying the Agent UI Backend API to AWS.

## ✅ Prerequisites

- [ ] AWS CLI v2 installed
  ```bash
  aws --version
  # Should show: aws-cli/2.x.x
  ```

- [ ] AWS SAM CLI installed
  ```bash
  sam --version
  # Should show: SAM CLI, version 1.x.x
  ```

- [ ] Node.js 20+ installed
  ```bash
  node --version
  # Should show: v20.x.x or higher
  ```

- [ ] Docker installed and running
  ```bash
  docker --version
  docker ps
  # Should show Docker version and running containers
  ```

- [ ] AWS credentials configured
  ```bash
  aws sts get-caller-identity
  # Should show your AWS account ID and user ARN
  ```

## ✅ Agent ARNs

Get the ARNs from your deployed agents:

- [ ] OnboardingAgent ARN
  ```bash
  cd OnboardingAgent
  agentcore status | grep ARN
  # Copy the ARN
  ```

- [ ] ProvisioningAgent ARN
  ```bash
  cd ProvisioningAgent
  agentcore status | grep ARN
  # Copy the ARN
  ```

- [ ] MWCAgent ARN
  ```bash
  cd MWCAgent
  agentcore status | grep ARN
  # Copy the ARN
  ```

## ✅ Environment Variables

Set the required environment variables:

```bash
# Required
export ONBOARDING_AGENT_ARN="arn:aws:bedrock:us-east-1:ACCOUNT:agent/ID"
export PROVISIONING_AGENT_ARN="arn:aws:bedrock:us-east-1:ACCOUNT:agent/ID"
export MWC_AGENT_ARN="arn:aws:bedrock:us-east-1:ACCOUNT:agent/ID"

# Optional
export ENVIRONMENT="production"  # or "development", "staging"
export AWS_REGION="us-east-1"
export CORS_ORIGIN="*"  # Use specific domain in production
```

Verify:
```bash
echo $ONBOARDING_AGENT_ARN
echo $PROVISIONING_AGENT_ARN
echo $MWC_AGENT_ARN
```

## ✅ Build Verification

- [ ] Dependencies installed
  ```bash
  cd api
  npm ci
  ```

- [ ] TypeScript builds successfully
  ```bash
  npm run build
  # Should complete with no errors
  ```

- [ ] Lambda handler compiles
  ```bash
  ls dist/lambda.js
  # Should exist
  ```

## ✅ AWS Permissions

Verify your AWS user/role has permissions to:

- [ ] Create CloudFormation stacks
  ```bash
  aws cloudformation describe-stacks --stack-name test-stack 2>&1 | grep -q "does not exist" && echo "✓ Permission OK"
  ```

- [ ] Create Lambda functions
- [ ] Create API Gateway APIs
- [ ] Create IAM roles
- [ ] Create CloudWatch log groups
- [ ] Upload to S3

## ✅ Pre-Deployment Test

- [ ] Run local build
  ```bash
  cd api
  npm run build
  ```

- [ ] Verify no TypeScript errors
- [ ] Check all required files exist:
  - [ ] `template.yaml`
  - [ ] `samconfig.toml`
  - [ ] `deploy.sh`
  - [ ] `dist/lambda.js`
  - [ ] `dist/index.js`

## ✅ Ready to Deploy

If all checks pass, you're ready to deploy:

```bash
cd api
./deploy.sh
```

## Post-Deployment Verification

After deployment completes:

- [ ] API URL displayed in output
- [ ] Run test script
  ```bash
  ./test-deployment.sh
  ```

- [ ] All tests pass
- [ ] View logs
  ```bash
  npm run logs
  ```

- [ ] Test from browser/Postman
  ```bash
  curl https://API_URL/health
  ```

## Troubleshooting

### If deployment fails:

1. **Check CloudFormation events**:
   ```bash
   aws cloudformation describe-stack-events --stack-name agent-ui-api --max-items 20
   ```

2. **Check SAM build logs**:
   ```bash
   sam build --use-container --debug
   ```

3. **Verify agent ARNs are valid**:
   ```bash
   aws bedrock-agent-runtime invoke-agent --agent-id ID --agent-alias-id TSTALIASID --session-id test --input-text "test"
   ```

4. **Check IAM permissions**:
   ```bash
   aws iam get-user
   aws iam list-attached-user-policies --user-name YOUR_USERNAME
   ```

### If tests fail:

1. **Check Lambda logs**:
   ```bash
   npm run logs
   ```

2. **Test Lambda directly**:
   ```bash
   aws lambda invoke --function-name agent-ui-api-production --payload '{}' response.json
   cat response.json
   ```

3. **Check API Gateway**:
   ```bash
   aws apigateway get-rest-apis
   ```

## Support

- **Deployment Guide**: See `DEPLOYMENT-GUIDE.md`
- **Quick Reference**: See `DEPLOYMENT-QUICK-REFERENCE.md`
- **AWS Integration**: See `AWS-INTEGRATION.md`
- **API Documentation**: See `README.md`

---

**Ready to deploy?** Start with the prerequisites checklist above! 🚀
