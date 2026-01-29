# AWS Amplify Deployment Guide

This guide provides step-by-step instructions for deploying the Agent UI to AWS Amplify Hosting.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Initial Setup](#initial-setup)
- [Environment Variables Configuration](#environment-variables-configuration)
- [Build Configuration](#build-configuration)
- [Custom Domain Setup](#custom-domain-setup)
- [Deployment Process](#deployment-process)
- [Post-Deployment Verification](#post-deployment-verification)
- [Troubleshooting](#troubleshooting)
- [CI/CD Configuration](#cicd-configuration)

## Prerequisites

Before deploying to AWS Amplify, ensure you have:

1. **AWS Account**: Active AWS account with appropriate permissions
2. **Git Repository**: Code pushed to GitHub, GitLab, Bitbucket, or AWS CodeCommit
3. **Backend API Deployed**: The backend API must be deployed and accessible (see [../api/README.md](../api/README.md))
4. **AWS CLI** (optional): For CLI-based deployment
5. **Node.js 18+**: Amplify will use Node.js 18 or 20 for builds

## Initial Setup

### Option 1: AWS Console (Recommended for First-Time Setup)

#### Step 1: Navigate to AWS Amplify

1. Log in to [AWS Console](https://console.aws.amazon.com/)
2. Navigate to **AWS Amplify** service
3. Click **"New app"** → **"Host web app"**

#### Step 2: Connect Repository

1. **Select Git Provider**:
   - GitHub
   - GitLab
   - Bitbucket
   - AWS CodeCommit

2. **Authorize Access**:
   - Click **"Connect to GitHub"** (or your provider)
   - Authorize AWS Amplify to access your repositories
   - Select your organization (if applicable)

3. **Choose Repository and Branch**:
   - Repository: Select your repository (e.g., `your-org/mwc-multi-agent`)
   - Branch: Select the branch to deploy (e.g., `main` or `production`)
   - Click **"Next"**

#### Step 3: Configure Build Settings

Amplify should auto-detect the `amplify.yml` file in the `agent-ui` directory.

**Verify the following settings**:

- **App name**: `agent-ui` (or your preferred name)
- **Environment name**: `production` (or `dev`, `staging`)
- **Build and test settings**: Should show the contents of `amplify.yml`

**If amplify.yml is not detected**, manually configure:

1. **Build command**: `npm run build`
2. **Base directory**: `agent-ui`
3. **Output directory**: `dist`

Click **"Next"**

#### Step 4: Review and Deploy

1. Review all settings
2. Click **"Save and deploy"**
3. Amplify will start the initial build and deployment

**Build Process**:
- **Provision**: ~30 seconds
- **Build**: ~2-5 minutes (depending on dependencies)
- **Deploy**: ~30 seconds
- **Verify**: ~10 seconds

### Option 2: AWS CLI

#### Step 1: Install AWS CLI

```bash
# macOS
brew install awscli

# Linux
curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
unzip awscliv2.zip
sudo ./aws/install

# Verify installation
aws --version
```

#### Step 2: Configure AWS Credentials

```bash
aws configure
# Enter:
# - AWS Access Key ID
# - AWS Secret Access Key
# - Default region (e.g., us-east-1)
# - Default output format (json)
```

#### Step 3: Create Amplify App

```bash
# Create app
aws amplify create-app \
  --name agent-ui \
  --repository https://github.com/your-org/your-repo \
  --access-token YOUR_GITHUB_TOKEN \
  --region us-east-1

# Note the returned appId
```

#### Step 4: Create Branch

```bash
aws amplify create-branch \
  --app-id YOUR_APP_ID \
  --branch-name main \
  --enable-auto-build
```

#### Step 5: Start Deployment

```bash
aws amplify start-job \
  --app-id YOUR_APP_ID \
  --branch-name main \
  --job-type RELEASE
```

## Environment Variables Configuration

Environment variables must be configured in Amplify Console before deployment.

### Required Environment Variables

| Variable Name | Description | Example Value |
|--------------|-------------|---------------|
| `VITE_API_BASE_URL` | Backend API endpoint | `https://api.yourdomain.com` or `https://abc123.execute-api.us-east-1.amazonaws.com/prod` |

### Setting Environment Variables via Console

1. **Navigate to Your App**:
   - Go to AWS Amplify Console
   - Select your app (`agent-ui`)

2. **Open Environment Variables**:
   - Click **"App settings"** in the left sidebar
   - Click **"Environment variables"**

3. **Add Variables**:
   - Click **"Manage variables"**
   - Click **"Add variable"**
   - Enter:
     - **Variable name**: `VITE_API_BASE_URL`
     - **Value**: Your backend API URL
   - Click **"Save"**

4. **Redeploy**:
   - Go to the app overview
   - Click **"Redeploy this version"** to apply the new environment variables

### Setting Environment Variables via CLI

```bash
# Add environment variable
aws amplify update-app \
  --app-id YOUR_APP_ID \
  --environment-variables VITE_API_BASE_URL=https://api.yourdomain.com

# Verify environment variables
aws amplify get-app --app-id YOUR_APP_ID
```

### Environment-Specific Variables

For multiple environments (dev, staging, production):

1. **Create Multiple Branches**:
   - `dev` branch → Development environment
   - `staging` branch → Staging environment
   - `main` branch → Production environment

2. **Set Branch-Specific Variables**:
   - In Amplify Console, go to **"App settings"** → **"Environment variables"**
   - Click **"Manage variables"**
   - For each variable, select which branches it applies to
   - Set different values for different branches

**Example**:
```
VITE_API_BASE_URL
├─ dev branch: https://dev-api.yourdomain.com
├─ staging branch: https://staging-api.yourdomain.com
└─ main branch: https://api.yourdomain.com
```

## Build Configuration

The `amplify.yml` file in the `agent-ui` directory configures the build process.

### Build Phases

```yaml
frontend:
  phases:
    preBuild:
      commands:
        - npm ci  # Install dependencies
    build:
      commands:
        - npm run build  # Build production bundle
```

### Customizing Build Settings

#### Change Node.js Version

Add to `preBuild` phase:

```yaml
preBuild:
  commands:
    - nvm install 20
    - nvm use 20
    - npm ci
```

#### Add Build-Time Checks

```yaml
build:
  commands:
    - npm run lint  # Run linter
    - npm run test  # Run tests
    - npm run build  # Build app
```

#### Custom Build Script

```yaml
build:
  commands:
    - npm run build:production  # Custom build script
```

### Build Artifacts

Amplify serves files from the `dist` directory:

```yaml
artifacts:
  baseDirectory: dist
  files:
    - '**/*'
```

### Build Cache

Speed up builds by caching `node_modules`:

```yaml
cache:
  paths:
    - node_modules/**/*
```

## Custom Domain Setup

### Prerequisites

- Domain registered with a domain registrar (Route 53, GoDaddy, Namecheap, etc.)
- Access to DNS settings

### Option 1: Route 53 Domain (Easiest)

If your domain is managed by Route 53:

1. **Add Domain in Amplify**:
   - Go to **"App settings"** → **"Domain management"**
   - Click **"Add domain"**
   - Select your domain from the dropdown
   - Click **"Configure domain"**

2. **Configure Subdomains**:
   - Amplify automatically suggests `www` and root domain
   - Add custom subdomain (e.g., `agents.yourdomain.com`)
   - Click **"Save"**

3. **Automatic DNS Configuration**:
   - Amplify automatically creates Route 53 records
   - SSL certificate is provisioned automatically (5-10 minutes)

4. **Wait for Activation**:
   - Status will change from "Pending verification" → "Available"
   - Usually takes 5-15 minutes

### Option 2: External Domain (GoDaddy, Namecheap, etc.)

1. **Add Domain in Amplify**:
   - Go to **"App settings"** → **"Domain management"**
   - Click **"Add domain"**
   - Enter your domain name
   - Click **"Configure domain"**

2. **Get DNS Records**:
   - Amplify will provide DNS records to add:
     - **CNAME record** for subdomain
     - **ANAME/ALIAS record** for root domain (if supported)
     - **TXT record** for domain verification

3. **Add Records to Your DNS Provider**:

   **For subdomain (e.g., agents.yourdomain.com)**:
   ```
   Type: CNAME
   Name: agents
   Value: main.d111111abcdef8.amplifyapp.com
   TTL: 300
   ```

   **For root domain (yourdomain.com)**:
   ```
   Type: A (or ANAME/ALIAS if supported)
   Name: @
   Value: [IP address provided by Amplify]
   TTL: 300
   ```

   **For domain verification**:
   ```
   Type: TXT
   Name: _amplify-challenge
   Value: [verification code from Amplify]
   TTL: 300
   ```

4. **Wait for DNS Propagation**:
   - DNS changes can take 5 minutes to 48 hours
   - Check status in Amplify Console
   - Use `dig` or `nslookup` to verify:
     ```bash
     dig agents.yourdomain.com
     ```

5. **SSL Certificate Provisioning**:
   - Amplify automatically provisions SSL certificate
   - Uses AWS Certificate Manager (ACM)
   - Takes 5-10 minutes after DNS verification

### Verify Custom Domain

```bash
# Check DNS resolution
dig agents.yourdomain.com

# Check SSL certificate
curl -I https://agents.yourdomain.com

# Expected: 200 OK with valid SSL
```

## Deployment Process

### Automatic Deployment (CI/CD)

Amplify automatically deploys when you push to the connected branch:

1. **Push Code**:
   ```bash
   git add .
   git commit -m "Update feature"
   git push origin main
   ```

2. **Automatic Build**:
   - Amplify detects the push
   - Starts build automatically
   - Deploys on successful build

3. **Monitor Build**:
   - View build logs in Amplify Console
   - Receive notifications on build status

### Manual Deployment

Trigger a manual deployment:

**Via Console**:
1. Go to your app in Amplify Console
2. Click **"Redeploy this version"**

**Via CLI**:
```bash
aws amplify start-job \
  --app-id YOUR_APP_ID \
  --branch-name main \
  --job-type RELEASE
```

### Build Notifications

Set up notifications for build events:

1. **Go to Notifications**:
   - **"App settings"** → **"Notifications"**

2. **Add Email Notification**:
   - Click **"Add notification"**
   - Select events: Build success, Build failure
   - Enter email address
   - Click **"Save"**

3. **SNS Integration** (optional):
   - Create SNS topic
   - Subscribe to topic
   - Configure Amplify to publish to SNS

## Post-Deployment Verification

### 1. Check Deployment Status

**Via Console**:
- Go to Amplify Console
- Check deployment status: ✅ Deployed

**Via CLI**:
```bash
aws amplify get-branch \
  --app-id YOUR_APP_ID \
  --branch-name main
```

### 2. Access Application

**Default URL**:
```
https://main.YOUR_APP_ID.amplifyapp.com
```

**Custom Domain** (if configured):
```
https://agents.yourdomain.com
```

### 3. Verify Functionality

1. **Load Application**:
   - Open URL in browser
   - Verify page loads without errors

2. **Check Console**:
   - Open browser DevTools (F12)
   - Check Console tab for errors
   - Verify no 404 or CORS errors

3. **Test Agent Interaction**:
   - Select an agent
   - Send a test message
   - Verify response streams correctly

4. **Test Routing**:
   - Navigate to different sections
   - Refresh page
   - Verify no 404 errors (SPA routing works)

### 4. Performance Check

**Via Browser DevTools**:
1. Open **Network** tab
2. Reload page (Ctrl+Shift+R)
3. Check:
   - Total load time < 3 seconds
   - Assets served with correct cache headers
   - No failed requests

**Via Lighthouse**:
```bash
# Install Lighthouse CLI
npm install -g lighthouse

# Run audit
lighthouse https://agents.yourdomain.com --view
```

**Expected Scores**:
- Performance: > 90
- Accessibility: > 90
- Best Practices: > 90
- SEO: > 80

## Troubleshooting

### Build Fails

**Issue**: Build fails with error messages

**Common Causes**:

1. **Missing Environment Variables**:
   ```
   Error: VITE_API_BASE_URL is not defined
   ```
   **Solution**: Add environment variable in Amplify Console

2. **TypeScript Errors**:
   ```
   Error: Type 'string' is not assignable to type 'number'
   ```
   **Solution**: Fix TypeScript errors locally, test with `npm run build`, then push

3. **Dependency Installation Fails**:
   ```
   Error: npm ERR! code ERESOLVE
   ```
   **Solution**: 
   - Ensure `package-lock.json` is committed
   - Run `npm ci` locally to verify
   - Check Node.js version compatibility

4. **Out of Memory**:
   ```
   Error: JavaScript heap out of memory
   ```
   **Solution**: Add to `preBuild` phase:
   ```yaml
   preBuild:
     commands:
       - export NODE_OPTIONS="--max-old-space-size=4096"
       - npm ci
   ```

### Environment Variables Not Working

**Issue**: `import.meta.env.VITE_API_BASE_URL` is undefined

**Solutions**:
1. Verify variable name is prefixed with `VITE_`
2. Redeploy after adding variables
3. Check variable is set for the correct branch
4. Clear build cache and redeploy

### 404 on Page Refresh

**Issue**: Refreshing non-root routes returns 404

**Solution**: Verify `amplify.yml` includes redirect rules:

```yaml
redirects:
  - source: '/<*>'
    target: '/index.html'
    status: '200'
```

### CORS Errors

**Issue**: Browser shows CORS policy errors

**Solutions**:
1. Configure CORS in backend API
2. Add Amplify domain to backend CORS allowed origins
3. Verify API Gateway CORS configuration

### Custom Domain Not Working

**Issue**: Custom domain shows "Not found" or SSL errors

**Solutions**:

1. **DNS Not Propagated**:
   - Wait 5-60 minutes for DNS propagation
   - Check DNS with: `dig agents.yourdomain.com`

2. **SSL Certificate Pending**:
   - Wait 5-10 minutes for certificate provisioning
   - Check status in Amplify Console

3. **Incorrect DNS Records**:
   - Verify CNAME/A records match Amplify instructions
   - Check for typos in record values

4. **Domain Verification Failed**:
   - Add TXT record for domain verification
   - Wait for verification to complete

### Slow Build Times

**Issue**: Builds take too long (> 5 minutes)

**Solutions**:

1. **Enable Build Cache**:
   ```yaml
   cache:
     paths:
       - node_modules/**/*
   ```

2. **Optimize Dependencies**:
   - Remove unused dependencies
   - Use `npm ci` instead of `npm install`

3. **Parallel Builds**:
   - Amplify automatically parallelizes where possible
   - Ensure build scripts don't have unnecessary sequential steps

## CI/CD Configuration

### Branch-Based Deployments

Deploy different branches to different environments:

1. **Create Branches**:
   ```bash
   git checkout -b dev
   git push origin dev
   
   git checkout -b staging
   git push origin staging
   ```

2. **Connect Branches in Amplify**:
   - Go to **"App settings"** → **"General"**
   - Click **"Connect branch"**
   - Select branch (e.g., `dev`)
   - Configure build settings
   - Click **"Save"**

3. **Set Branch-Specific Variables**:
   - Different API URLs for each environment
   - Different feature flags

**Result**:
- `dev` branch → `https://dev.YOUR_APP_ID.amplifyapp.com`
- `staging` branch → `https://staging.YOUR_APP_ID.amplifyapp.com`
- `main` branch → `https://main.YOUR_APP_ID.amplifyapp.com`

### Pull Request Previews

Enable preview deployments for pull requests:

1. **Enable PR Previews**:
   - Go to **"App settings"** → **"Previews"**
   - Click **"Enable previews"**
   - Select branches to enable previews for

2. **Configure GitHub Integration**:
   - Amplify automatically comments on PRs with preview URL
   - Preview is deployed for every commit to PR

3. **Preview URL Format**:
   ```
   https://pr-123.YOUR_APP_ID.amplifyapp.com
   ```

### Deployment Rollback

Rollback to a previous deployment:

**Via Console**:
1. Go to app overview
2. Click on the deployment you want to rollback to
3. Click **"Redeploy this version"**

**Via CLI**:
```bash
# List deployments
aws amplify list-jobs \
  --app-id YOUR_APP_ID \
  --branch-name main \
  --max-results 10

# Redeploy specific version
aws amplify start-job \
  --app-id YOUR_APP_ID \
  --branch-name main \
  --job-id PREVIOUS_JOB_ID \
  --job-type RELEASE
```

## Monitoring and Logging

### Access Logs

Enable access logs:

1. Go to **"App settings"** → **"Monitoring"**
2. Click **"Access logs"**
3. Enable logging
4. Logs are stored in CloudWatch

### CloudWatch Metrics

View metrics in CloudWatch:

```bash
aws cloudwatch get-metric-statistics \
  --namespace AWS/AmplifyHosting \
  --metric-name Requests \
  --dimensions Name=App,Value=YOUR_APP_ID \
  --start-time 2024-01-01T00:00:00Z \
  --end-time 2024-01-02T00:00:00Z \
  --period 3600 \
  --statistics Sum
```

### Build Logs

View build logs:

**Via Console**:
- Click on a deployment
- View detailed logs for each phase

**Via CLI**:
```bash
aws amplify get-job \
  --app-id YOUR_APP_ID \
  --branch-name main \
  --job-id JOB_ID
```

## Cost Optimization

### Amplify Pricing

- **Build minutes**: $0.01 per build minute
- **Hosting**: $0.15 per GB served
- **Storage**: $0.023 per GB stored per month

### Optimization Tips

1. **Enable Build Cache**: Reduces build time
2. **Optimize Bundle Size**: Reduces storage and bandwidth
3. **Use CDN Caching**: Reduces data transfer costs
4. **Delete Old Branches**: Removes unused deployments

### Monitor Costs

```bash
# View Amplify costs
aws ce get-cost-and-usage \
  --time-period Start=2024-01-01,End=2024-01-31 \
  --granularity MONTHLY \
  --metrics BlendedCost \
  --filter file://filter.json
```

## Security Best Practices

1. **Enable HTTPS Only**: Amplify enforces HTTPS by default
2. **Set Security Headers**: Configured in `amplify.yml`
3. **Restrict Access** (optional): Use Amplify access control for staging environments
4. **Rotate Credentials**: Regularly rotate GitHub/GitLab tokens
5. **Monitor Access Logs**: Review CloudWatch logs for suspicious activity

## Additional Resources

- [AWS Amplify Documentation](https://docs.aws.amazon.com/amplify/)
- [Amplify Hosting Guide](https://docs.aws.amazon.com/amplify/latest/userguide/welcome.html)
- [Vite Build Configuration](https://vitejs.dev/guide/build.html)
- [Environment Variables Guide](./ENVIRONMENT-VARIABLES.md)
- [General Deployment Guide](./DEPLOYMENT-GUIDE.md)

---

**Need Help?**

- Check [README.md](./README.md) for general documentation
- Review [DEPLOYMENT-GUIDE.md](./DEPLOYMENT-GUIDE.md) for other deployment options
- Open an issue on GitHub for deployment problems

**Document Version**: 1.0  
**Last Updated**: January 2026
