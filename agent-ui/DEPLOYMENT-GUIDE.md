# Deployment Guide

This guide provides comprehensive instructions for deploying the Agent UI to various platforms.

## Table of Contents

- [Prerequisites](#prerequisites)
- [AWS Amplify Hosting (Recommended)](#aws-amplify-hosting-recommended)
- [Vercel Deployment](#vercel-deployment)
- [Netlify Deployment](#netlify-deployment)
- [AWS S3 + CloudFront](#aws-s3--cloudfront)
- [Docker Deployment](#docker-deployment)
- [Backend API Deployment](#backend-api-deployment)
- [Post-Deployment Verification](#post-deployment-verification)
- [Troubleshooting](#troubleshooting)

## Prerequisites

Before deploying, ensure you have:

1. **Built the Application**: Run `npm run build` to create production build
2. **Backend API Deployed**: The frontend requires a backend API (see [Backend API Deployment](#backend-api-deployment))
3. **Environment Variables Configured**: Set `VITE_API_BASE_URL` to your backend API URL
4. **AWS Credentials**: For AWS-based deployments (Amplify, S3, Lambda)
5. **Git Repository**: Code pushed to GitHub, GitLab, or Bitbucket

## AWS Amplify Hosting (Recommended)

AWS Amplify provides automatic CI/CD, global CDN, SSL certificates, and easy integration with AWS services.

**📖 For detailed Amplify deployment instructions, see [AMPLIFY-DEPLOYMENT.md](./AMPLIFY-DEPLOYMENT.md)**

### Quick Start

1. **Prepare Repository**: Push code to GitHub, GitLab, Bitbucket, or AWS CodeCommit

2. **Create Amplify App**:
   - Navigate to [AWS Amplify Console](https://console.aws.amazon.com/amplify/)
   - Click **"New app"** → **"Host web app"**
   - Connect your Git repository
   - Select branch (e.g., `main`)

3. **Configure Build**: Amplify auto-detects `amplify.yml` configuration file

4. **Set Environment Variables**:
   - Go to **"App settings"** → **"Environment variables"**
   - Add `VITE_API_BASE_URL` with your backend API URL

5. **Deploy**: Amplify automatically builds and deploys

6. **Access Application**:
   - Default URL: `https://main.YOUR_APP_ID.amplifyapp.com`
   - Custom domain: Configure in **"Domain management"**

### Key Features

- ✅ Automatic CI/CD on every commit
- ✅ Global CDN with CloudFront
- ✅ Free SSL certificates
- ✅ Branch-based deployments
- ✅ Pull request previews
- ✅ Custom domain support
- ✅ Build caching for faster deployments

### Configuration Files

The `amplify.yml` file in the `agent-ui` directory configures:
- Build phases (install dependencies, build)
- Artifact output (dist directory)
- Cache settings (node_modules)
- Security headers
- SPA routing redirects

See [AMPLIFY-DEPLOYMENT.md](./AMPLIFY-DEPLOYMENT.md) for complete configuration details.

## Vercel Deployment

Vercel provides zero-config deployment for Vite applications with automatic CI/CD.

### Step 1: Install Vercel CLI

```bash
npm install -g vercel
```

### Step 2: Login to Vercel

```bash
vercel login
```

### Step 3: Deploy

From the `agent-ui` directory:

```bash
vercel
```

Follow the prompts:
- **Set up and deploy?** Yes
- **Which scope?** Select your account/team
- **Link to existing project?** No (first time) or Yes (subsequent deploys)
- **Project name?** agent-ui
- **Directory?** ./ (current directory)
- **Override settings?** No

### Step 4: Set Environment Variables

**Via Vercel Dashboard:**
1. Go to your project settings
2. Navigate to **"Environment Variables"**
3. Add `VITE_API_BASE_URL` with your backend API URL

**Via CLI:**

```bash
vercel env add VITE_API_BASE_URL production
# Enter your backend API URL when prompted
```

### Step 5: Deploy to Production

```bash
vercel --prod
```

### Step 6: Configure Custom Domain (Optional)

**Via Dashboard:**
1. Go to project **"Settings"** → **"Domains"**
2. Add your custom domain
3. Configure DNS records as instructed

**Via CLI:**

```bash
vercel domains add agents.yourdomain.com
```

## Netlify Deployment

Netlify offers simple drag-and-drop or Git-based deployment.

### Option A: Drag-and-Drop Deployment

1. Build your application: `npm run build`
2. Go to [Netlify Drop](https://app.netlify.com/drop)
3. Drag the `dist` folder to the upload area
4. Your site is deployed instantly

**Note**: This method doesn't support environment variables or CI/CD.

### Option B: Git-Based Deployment

#### Step 1: Connect Repository

1. Go to [Netlify](https://app.netlify.com/)
2. Click **"Add new site"** → **"Import an existing project"**
3. Choose your Git provider and authorize
4. Select your repository

#### Step 2: Configure Build Settings

- **Base directory**: `agent-ui` (if in monorepo) or leave empty
- **Build command**: `npm run build`
- **Publish directory**: `agent-ui/dist` or `dist`

#### Step 3: Set Environment Variables

In the Netlify dashboard:
1. Go to **"Site settings"** → **"Environment variables"**
2. Add `VITE_API_BASE_URL` with your backend API URL

#### Step 4: Deploy

Click **"Deploy site"**. Netlify will:
- Install dependencies
- Run build command
- Deploy to CDN
- Provide a URL (e.g., `https://random-name.netlify.app`)

#### Step 5: Configure Custom Domain (Optional)

1. Go to **"Domain settings"**
2. Click **"Add custom domain"**
3. Follow DNS configuration instructions

### Netlify CLI Deployment

```bash
# Install Netlify CLI
npm install -g netlify-cli

# Login
netlify login

# Initialize site
netlify init

# Deploy
netlify deploy --prod
```

## AWS S3 + CloudFront

Manual deployment with full control over infrastructure.

### Step 1: Build Application

```bash
npm run build
```

### Step 2: Create S3 Bucket

```bash
aws s3 mb s3://agent-ui-YOUR_UNIQUE_NAME --region us-east-1
```

### Step 3: Configure S3 for Static Website Hosting

```bash
aws s3 website s3://agent-ui-YOUR_UNIQUE_NAME \
  --index-document index.html \
  --error-document index.html
```

### Step 4: Set Bucket Policy

Create `bucket-policy.json`:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "PublicReadGetObject",
      "Effect": "Allow",
      "Principal": "*",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::agent-ui-YOUR_UNIQUE_NAME/*"
    }
  ]
}
```

Apply policy:

```bash
aws s3api put-bucket-policy \
  --bucket agent-ui-YOUR_UNIQUE_NAME \
  --policy file://bucket-policy.json
```

### Step 5: Upload Build Files

```bash
aws s3 sync dist/ s3://agent-ui-YOUR_UNIQUE_NAME \
  --delete \
  --cache-control "public, max-age=31536000, immutable" \
  --exclude "index.html"

# Upload index.html with no-cache
aws s3 cp dist/index.html s3://agent-ui-YOUR_UNIQUE_NAME/index.html \
  --cache-control "no-cache, no-store, must-revalidate"
```

### Step 6: Create CloudFront Distribution

Create `cloudfront-config.json`:

```json
{
  "CallerReference": "agent-ui-2024",
  "Comment": "Agent UI Distribution",
  "DefaultRootObject": "index.html",
  "Origins": {
    "Quantity": 1,
    "Items": [
      {
        "Id": "S3-agent-ui",
        "DomainName": "agent-ui-YOUR_UNIQUE_NAME.s3.amazonaws.com",
        "S3OriginConfig": {
          "OriginAccessIdentity": ""
        }
      }
    ]
  },
  "DefaultCacheBehavior": {
    "TargetOriginId": "S3-agent-ui",
    "ViewerProtocolPolicy": "redirect-to-https",
    "AllowedMethods": {
      "Quantity": 2,
      "Items": ["GET", "HEAD"]
    },
    "ForwardedValues": {
      "QueryString": false,
      "Cookies": {
        "Forward": "none"
      }
    },
    "MinTTL": 0,
    "DefaultTTL": 86400,
    "MaxTTL": 31536000
  },
  "CustomErrorResponses": {
    "Quantity": 1,
    "Items": [
      {
        "ErrorCode": 404,
        "ResponsePagePath": "/index.html",
        "ResponseCode": "200",
        "ErrorCachingMinTTL": 300
      }
    ]
  },
  "Enabled": true
}
```

Create distribution:

```bash
aws cloudfront create-distribution \
  --distribution-config file://cloudfront-config.json
```

### Step 7: Access Your Application

Your app will be available at the CloudFront domain:
- `https://d111111abcdef8.cloudfront.net`

Configure a custom domain by adding a CNAME record in Route 53 or your DNS provider.

## Docker Deployment

Containerize the application for deployment to any platform.

### Step 1: Create Dockerfile

Create `Dockerfile` in the `agent-ui` directory:

```dockerfile
# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Build application
RUN npm run build

# Production stage
FROM nginx:alpine

# Copy built files to nginx
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose port
EXPOSE 80

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
```

### Step 2: Create Nginx Configuration

Create `nginx.conf`:

```nginx
server {
    listen 80;
    server_name _;
    root /usr/share/nginx/html;
    index index.html;

    # Enable gzip compression
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;

    # SPA routing - serve index.html for all routes
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Cache static assets
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Don't cache index.html
    location = /index.html {
        add_header Cache-Control "no-cache, no-store, must-revalidate";
    }
}
```

### Step 3: Build Docker Image

```bash
docker build -t agent-ui:latest .
```

### Step 4: Run Container Locally

```bash
docker run -p 8080:80 agent-ui:latest
```

Access at `http://localhost:8080`

### Step 5: Deploy to Container Platform

**AWS ECS:**

```bash
# Tag image
docker tag agent-ui:latest YOUR_ACCOUNT.dkr.ecr.us-east-1.amazonaws.com/agent-ui:latest

# Push to ECR
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin YOUR_ACCOUNT.dkr.ecr.us-east-1.amazonaws.com
docker push YOUR_ACCOUNT.dkr.ecr.us-east-1.amazonaws.com/agent-ui:latest

# Create ECS task definition and service
# (Use AWS Console or CLI)
```

**Docker Hub:**

```bash
docker tag agent-ui:latest your-username/agent-ui:latest
docker push your-username/agent-ui:latest
```

## Backend API Deployment

The frontend requires a backend API to communicate with AWS Bedrock AgentCore.

### AWS Lambda + API Gateway (Recommended)

**See [../api/README.md](../api/README.md) for detailed backend deployment instructions.**

Quick overview:

1. **Package Lambda Function**:
   ```bash
   cd api
   npm run build
   zip -r function.zip dist/ node_modules/
   ```

2. **Create Lambda Function**:
   ```bash
   aws lambda create-function \
     --function-name agent-ui-api \
     --runtime nodejs20.x \
     --handler dist/index.handler \
     --zip-file fileb://function.zip \
     --role arn:aws:iam::ACCOUNT_ID:role/lambda-execution-role
   ```

3. **Set Environment Variables**:
   ```bash
   aws lambda update-function-configuration \
     --function-name agent-ui-api \
     --environment Variables={
       ONBOARDING_AGENT_ARN=arn:aws:bedrock:...,
       PROVISIONING_AGENT_ARN=arn:aws:bedrock:...,
       MWC_AGENT_ARN=arn:aws:bedrock:...
     }
   ```

4. **Create API Gateway**:
   - Create REST API or HTTP API
   - Configure routes to Lambda function
   - Enable CORS
   - Deploy to stage

5. **Update Frontend Environment Variable**:
   ```env
   VITE_API_BASE_URL=https://YOUR_API_ID.execute-api.us-east-1.amazonaws.com/prod
   ```

### Alternative: ECS Fargate

For long-running processes or WebSocket support:

1. **Build Docker Image** (see Docker section)
2. **Push to ECR**
3. **Create ECS Cluster and Service**
4. **Configure Application Load Balancer**
5. **Update Frontend with ALB URL**

## Post-Deployment Verification

### 1. Health Check

Verify the application loads:

```bash
curl -I https://your-deployed-url.com
```

Expected: `200 OK` status

### 2. API Connectivity

Open browser console and check for API errors:

```javascript
// In browser console
fetch('https://your-api-url.com/health')
  .then(r => r.json())
  .then(console.log)
```

Expected: `{ "status": "ok" }` or similar

### 3. Agent Invocation

Test agent invocation through the UI:

1. Select an agent (e.g., OnboardingAgent)
2. Send a test message
3. Verify streaming response appears
4. Check browser console for errors

### 4. Performance Check

Use browser DevTools:

1. Open **Network** tab
2. Reload page
3. Check:
   - Total load time < 3 seconds
   - No failed requests
   - Assets served from CDN

### 5. Mobile Responsiveness

Test on different screen sizes:

```bash
# Use browser DevTools device emulation
# Or test on actual devices
```

## Troubleshooting

### Build Fails on Amplify/Vercel/Netlify

**Issue**: Build command fails with errors

**Solutions**:
1. Check Node.js version matches local (18.x or 20.x)
2. Verify `package-lock.json` is committed
3. Check build logs for specific errors
4. Test build locally: `npm run build`

### Environment Variables Not Working

**Issue**: `import.meta.env.VITE_API_BASE_URL` is undefined

**Solutions**:
1. Verify variable is prefixed with `VITE_`
2. Redeploy after adding environment variables
3. Check platform-specific environment variable syntax
4. Clear build cache and redeploy

### CORS Errors

**Issue**: Browser shows CORS policy errors

**Solutions**:
1. Configure CORS in backend API to allow frontend domain
2. Verify `CORS_ORIGIN` in backend `.env` includes frontend URL
3. Check API Gateway CORS configuration
4. Ensure preflight OPTIONS requests are handled

### 404 Errors on Page Refresh

**Issue**: Refreshing non-root routes returns 404

**Solutions**:
1. **Amplify**: Configure rewrites in `amplify.yml`:
   ```yaml
   customHeaders:
     - pattern: '**/*'
       headers:
         - key: 'Cache-Control'
           value: 'no-cache'
   ```

2. **Netlify**: Create `_redirects` file in `public/`:
   ```
   /*    /index.html   200
   ```

3. **Vercel**: Create `vercel.json`:
   ```json
   {
     "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }]
   }
   ```

4. **S3/CloudFront**: Configure custom error response (see Step 6 above)

### Slow Initial Load

**Issue**: Application takes too long to load

**Solutions**:
1. Enable gzip/brotli compression
2. Configure CDN caching properly
3. Optimize bundle size: `npm run build -- --analyze`
4. Implement code splitting for large components
5. Use CDN for static assets

### API Timeout Errors

**Issue**: Agent invocations timeout

**Solutions**:
1. Increase API Gateway timeout (max 30 seconds)
2. For Lambda, increase timeout to 5 minutes
3. Implement client-side retry logic
4. Consider WebSocket for long-running operations

## Rollback Procedures

### Amplify

```bash
# List deployments
aws amplify list-jobs --app-id YOUR_APP_ID --branch-name main

# Rollback to previous deployment
aws amplify start-job \
  --app-id YOUR_APP_ID \
  --branch-name main \
  --job-id PREVIOUS_JOB_ID \
  --job-type RELEASE
```

### Vercel

```bash
# List deployments
vercel ls

# Promote previous deployment
vercel promote DEPLOYMENT_URL
```

### Netlify

Via dashboard:
1. Go to **"Deploys"**
2. Find previous successful deploy
3. Click **"Publish deploy"**

## Monitoring and Logging

### AWS Amplify

- **Build Logs**: Available in Amplify Console
- **Access Logs**: Enable in App settings
- **Monitoring**: CloudWatch metrics for requests, errors

### CloudFront

```bash
# Enable logging
aws cloudfront update-distribution \
  --id YOUR_DISTRIBUTION_ID \
  --logging-config Enabled=true,Bucket=logs-bucket.s3.amazonaws.com,Prefix=cloudfront/
```

### Application Monitoring

Consider integrating:
- **AWS CloudWatch RUM**: Real user monitoring
- **Sentry**: Error tracking
- **Google Analytics**: Usage analytics
- **LogRocket**: Session replay

---

**Need Help?**

- Check [README.md](./README.md) for general documentation
- Review [ENVIRONMENT-VARIABLES.md](./ENVIRONMENT-VARIABLES.md) for configuration
- See [../api/README.md](../api/README.md) for backend API deployment
- Open an issue on GitHub for deployment problems

**Document Version**: 1.0  
**Last Updated**: January 2026
