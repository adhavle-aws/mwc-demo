# ADR 0014: AWS Amplify for UI Deployment

## Status

Accepted

## Context

The Agent UI needs to be deployed to AWS for users to access the multi-agent system. We need to choose a deployment platform that:
- Supports React applications
- Provides CI/CD integration
- Offers global CDN distribution
- Simplifies infrastructure management
- Supports future Salesforce integration
- Provides HTTPS by default
- Scales automatically

## Decision

We will use **AWS Amplify Hosting** to deploy the Agent UI React application.

## Rationale

### Why AWS Amplify

**1. Purpose-Built for Frontend Applications**
- Designed specifically for React, Vue, Angular, and other modern frameworks
- Zero-configuration deployments for React apps
- Built-in support for single-page applications (SPA)
- Automatic build optimization and bundling

**2. Git-Based CI/CD**
- Connects directly to Git repositories (GitHub, GitLab, CodeCommit)
- Automatic deployments on every commit
- Preview deployments for pull requests
- Rollback capabilities

**3. Global CDN Distribution**
- Automatically deploys to CloudFront CDN
- Global edge locations for low latency
- Automatic SSL/TLS certificates
- Custom domain support

**4. Minimal Infrastructure Management**
- No servers to manage
- Automatic scaling
- Built-in monitoring
- Pay only for what you use

**5. Developer Experience**
- Simple deployment process (connect repo → deploy)
- Environment variables management
- Build logs and debugging
- Preview URLs for testing

**6. Integration with AWS Services**
- Easy integration with API Gateway, Lambda, AppSync
- Works seamlessly with our AgentCore backend
- Supports environment-specific configurations

**7. Cost-Effective**
- Free tier: 1000 build minutes/month, 15GB served/month
- Pay-as-you-go pricing after free tier
- No upfront costs or minimum fees

### Alternatives Considered

**Option 1: S3 + CloudFront (Manual)**
- Pros: Full control, potentially lower cost
- Cons: Manual setup, no CI/CD, more operational overhead
- Verdict: Too much manual work, no automation

**Option 2: Elastic Beanstalk**
- Pros: Full application hosting, supports backend
- Cons: Overkill for static frontend, more complex, higher cost
- Verdict: Too heavy for a React SPA

**Option 3: ECS/Fargate with ALB**
- Pros: Container-based, full control
- Cons: Complex setup, higher cost, requires Docker
- Verdict: Over-engineered for frontend hosting

**Option 4: Vercel or Netlify**
- Pros: Excellent DX, fast deployments
- Cons: External to AWS, harder to integrate with AgentCore
- Verdict: Prefer AWS-native solution

**Option 5: AWS App Runner**
- Pros: Container or source-based deployment
- Cons: More suited for backend services, higher cost
- Verdict: Not optimized for static frontends

## Consequences

### Positive

- **Fast Deployment**: Connect Git repo and deploy in minutes
- **Automatic CI/CD**: Every commit triggers a build and deployment
- **Global Performance**: CloudFront CDN ensures low latency worldwide
- **Zero Infrastructure**: No servers, load balancers, or scaling to manage
- **HTTPS by Default**: Automatic SSL/TLS certificates
- **Preview Environments**: Test changes before merging
- **Cost-Effective**: Free tier covers development, low cost for production
- **AWS Integration**: Seamless connection to AgentCore backend
- **Developer Friendly**: Simple configuration, clear error messages

### Negative

- **Vendor Lock-in**: Tied to AWS Amplify (mitigated: can export to S3+CloudFront)
- **Build Time Limits**: 1000 minutes/month on free tier
- **Less Control**: Cannot customize CDN behavior as much as manual CloudFront
- **Amplify-Specific Config**: Uses amplify.yml for build configuration

### Neutral

- **Not Salesforce**: Amplify is separate from Salesforce deployment
  - Mitigation: UI is designed with Salesforce compatibility in mind
  - Migration path: Amplify → Salesforce is a separate deployment, not a technical blocker

## Implementation Notes

### Deployment Steps

1. **Connect Repository**
   ```bash
   # Via Amplify Console
   - Navigate to AWS Amplify Console
   - Click "New app" → "Host web app"
   - Connect GitLab repository
   - Select branch (main)
   ```

2. **Configure Build Settings**
   ```yaml
   # amplify.yml
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

3. **Set Environment Variables**
   - `VITE_API_ENDPOINT`: Backend API URL
   - `VITE_AWS_REGION`: us-east-1
   - `VITE_ONBOARDING_AGENT_ARN`: OnboardingAgent ARN
   - `VITE_PROVISIONING_AGENT_ARN`: ProvisioningAgent ARN
   - `VITE_MWC_AGENT_ARN`: MWCAgent ARN

4. **Deploy**
   - Amplify automatically builds and deploys
   - Provides amplifyapp.com URL
   - Can add custom domain later

### Backend Integration

The React app will call a backend API (Express/FastAPI) that:
- Runs on Lambda or ECS
- Invokes AgentCore agents
- Handles streaming responses
- Manages authentication

**Architecture:**
```
User Browser
    ↓ HTTPS
Amplify (CloudFront CDN)
    ↓ API calls
API Gateway + Lambda (or ECS)
    ↓ AWS SDK
AgentCore Agents
```

### Salesforce Migration Path

Amplify deployment does not conflict with Salesforce:

1. **Phase 1**: Deploy to Amplify (standalone web app)
2. **Phase 2**: Convert components to Lightning Web Components
3. **Phase 3**: Deploy to Salesforce (separate deployment)

The UI design (web components, SLDS-compatible styling) makes this transition smooth.

## Cost Estimate

### AWS Amplify Hosting

**Free Tier (First 12 months):**
- 1000 build minutes/month
- 15 GB served/month
- 5 GB storage

**Beyond Free Tier:**
- Build minutes: $0.01/minute
- Data served: $0.15/GB
- Storage: $0.023/GB/month

**Estimated Monthly Cost:**
- Development: $0 (within free tier)
- Production (moderate traffic): $5-20/month
- Production (high traffic): $50-100/month

### Total Solution Cost

- Agent Infrastructure: $40-80/month
- Amplify Hosting: $0-20/month
- Backend API (Lambda): $5-15/month
- **Total**: $45-115/month

## Related ADRs

- ADR 0001: Use AgentCore and Strands Frameworks
- ADR 0006: TypeScript as Implementation Language
- ADR 0013: Agents Over Tools for Complex Workflows

## References

- [AWS Amplify Hosting Documentation](https://docs.aws.amazon.com/amplify/latest/userguide/welcome.html)
- [Deploy React App with Amplify](https://aws.amazon.com/getting-started/hands-on/build-react-app-amplify-graphql/)
- [Amplify Pricing](https://aws.amazon.com/amplify/pricing/)
