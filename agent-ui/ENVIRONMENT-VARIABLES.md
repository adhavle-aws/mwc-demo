# Environment Variables Documentation

This document provides comprehensive documentation for all environment variables used in the Agent UI application.

## Overview

The Agent UI uses environment variables for configuration. Vite requires all client-side environment variables to be prefixed with `VITE_` for security reasons.

## Configuration Files

### Development Environment

Create `.env.development` for local development:

```env
# API Configuration
VITE_API_BASE_URL=http://localhost:3001
```

### Production Environment

Create `.env.production` for production builds:

```env
# API Configuration
VITE_API_BASE_URL=https://api.yourdomain.com
```

### Local Overrides

Create `.env.local` for local overrides (not committed to Git):

```env
# Local development overrides
VITE_API_BASE_URL=http://localhost:3001
```

## Environment Variable Reference

### VITE_API_BASE_URL

**Description**: Base URL for the backend API that communicates with AWS Bedrock AgentCore.

**Type**: String (URL)

**Required**: No

**Default**: `/api` (relative path, assumes API is served from same origin)

**Examples**:
```env
# Local development
VITE_API_BASE_URL=http://localhost:3001

# Production with custom domain
VITE_API_BASE_URL=https://api.yourdomain.com

# Production with API Gateway
VITE_API_BASE_URL=https://abc123.execute-api.us-east-1.amazonaws.com/prod

# Same-origin deployment (API proxied through same domain)
VITE_API_BASE_URL=/api
```

**Usage in Code**:
```typescript
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';
```

**Notes**:
- Must be a valid URL or relative path
- Should not include trailing slash
- Used by `agentService.ts` for all API calls
- CORS must be configured on backend if using different origin

## Environment Variable Loading

### Load Order (Vite)

Vite loads environment variables in the following order (later files override earlier):

1. `.env` - Loaded in all cases
2. `.env.local` - Loaded in all cases, ignored by Git
3. `.env.[mode]` - Loaded only in specified mode (e.g., `.env.production`)
4. `.env.[mode].local` - Loaded only in specified mode, ignored by Git

### Mode-Specific Loading

**Development Mode** (`npm run dev`):
- Loads: `.env`, `.env.local`, `.env.development`, `.env.development.local`
- Mode: `development`

**Production Build** (`npm run build`):
- Loads: `.env`, `.env.local`, `.env.production`, `.env.production.local`
- Mode: `production`

### Accessing Environment Variables

**In TypeScript/JavaScript**:
```typescript
// Access environment variable
const apiUrl = import.meta.env.VITE_API_BASE_URL;

// Check if in development mode
if (import.meta.env.DEV) {
  console.log('Development mode');
}

// Check if in production mode
if (import.meta.env.PROD) {
  console.log('Production mode');
}

// Get current mode
const mode = import.meta.env.MODE; // 'development' or 'production'
```

**Built-in Variables**:
- `import.meta.env.MODE` - Current mode (`development` or `production`)
- `import.meta.env.DEV` - Boolean, true in development
- `import.meta.env.PROD` - Boolean, true in production
- `import.meta.env.BASE_URL` - Base URL for the app

## Platform-Specific Configuration

### AWS Amplify

Set environment variables in Amplify Console:

1. Navigate to **App settings** → **Environment variables**
2. Add variables:
   - Key: `VITE_API_BASE_URL`
   - Value: `https://your-api-url.com`
3. Redeploy application

**Via AWS CLI**:
```bash
aws amplify update-app \
  --app-id YOUR_APP_ID \
  --environment-variables VITE_API_BASE_URL=https://api.yourdomain.com
```

### Vercel

Set environment variables in Vercel Dashboard or CLI:

**Via Dashboard**:
1. Go to project **Settings** → **Environment Variables**
2. Add `VITE_API_BASE_URL`
3. Select environment: Production, Preview, or Development
4. Redeploy

**Via CLI**:
```bash
vercel env add VITE_API_BASE_URL production
# Enter value when prompted
```

### Netlify

Set environment variables in Netlify Dashboard:

1. Go to **Site settings** → **Environment variables**
2. Add `VITE_API_BASE_URL`
3. Redeploy site

**Via netlify.toml**:
```toml
[build.environment]
  VITE_API_BASE_URL = "https://api.yourdomain.com"
```

### Docker

Pass environment variables at runtime:

**Via docker run**:
```bash
docker run -p 8080:80 \
  -e VITE_API_BASE_URL=https://api.yourdomain.com \
  agent-ui:latest
```

**Via docker-compose.yml**:
```yaml
version: '3.8'
services:
  agent-ui:
    image: agent-ui:latest
    ports:
      - "8080:80"
    environment:
      - VITE_API_BASE_URL=https://api.yourdomain.com
```

**Note**: For Docker, environment variables must be set at build time, not runtime, since Vite embeds them during build. Use build args:

```dockerfile
ARG VITE_API_BASE_URL
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL
```

```bash
docker build --build-arg VITE_API_BASE_URL=https://api.yourdomain.com -t agent-ui:latest .
```

## Security Considerations

### Sensitive Data

**DO NOT** store sensitive data in environment variables:
- ❌ AWS credentials
- ❌ API keys
- ❌ Secrets or passwords
- ❌ Private tokens

**Reason**: Vite embeds environment variables in the client-side bundle, making them visible to anyone who inspects the JavaScript.

### Safe to Store

✅ Public API endpoints
✅ Feature flags
✅ Public configuration values
✅ Non-sensitive identifiers

### Backend Security

Sensitive credentials should be stored in the backend API:
- AWS credentials in Lambda execution role or ECS task role
- API keys in AWS Secrets Manager or Parameter Store
- Database credentials in environment variables (backend only)

## Validation

### Type-Safe Environment Variables

Create a typed configuration module:

```typescript
// src/config/env.ts
interface EnvironmentConfig {
  apiBaseUrl: string;
  isDevelopment: boolean;
  isProduction: boolean;
}

function validateEnv(): EnvironmentConfig {
  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || '/api';

  // Validate URL format
  if (apiBaseUrl !== '/api') {
    try {
      new URL(apiBaseUrl);
    } catch {
      console.warn(`Invalid VITE_API_BASE_URL: ${apiBaseUrl}, falling back to /api`);
      return {
        apiBaseUrl: '/api',
        isDevelopment: import.meta.env.DEV,
        isProduction: import.meta.env.PROD,
      };
    }
  }

  return {
    apiBaseUrl,
    isDevelopment: import.meta.env.DEV,
    isProduction: import.meta.env.PROD,
  };
}

export const env = validateEnv();
```

**Usage**:
```typescript
import { env } from './config/env';

const response = await fetch(`${env.apiBaseUrl}/agents/list`);
```

## Debugging Environment Variables

### Check Loaded Variables

Add to `src/main.tsx`:

```typescript
if (import.meta.env.DEV) {
  console.log('Environment Variables:', {
    VITE_API_BASE_URL: import.meta.env.VITE_API_BASE_URL,
    MODE: import.meta.env.MODE,
    DEV: import.meta.env.DEV,
    PROD: import.meta.env.PROD,
  });
}
```

### Verify Build-Time Embedding

Check the built JavaScript:

```bash
npm run build
grep -r "VITE_API_BASE_URL" dist/assets/*.js
```

You should see the actual value embedded in the bundle.

## Best Practices

### 1. Use .env.example as Template

Commit `.env.example` with placeholder values:

```env
# API Configuration
VITE_API_BASE_URL=http://localhost:3001
```

### 2. Document All Variables

Keep this document updated when adding new variables.

### 3. Validate on Startup

Validate required variables in `main.tsx`:

```typescript
const requiredEnvVars = ['VITE_API_BASE_URL'];

requiredEnvVars.forEach(varName => {
  if (!import.meta.env[varName]) {
    console.warn(`Missing environment variable: ${varName}`);
  }
});
```

### 4. Use Defaults

Provide sensible defaults for optional variables:

```typescript
const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || '/api';
```

### 5. Never Commit .env Files

Ensure `.gitignore` includes:

```gitignore
# Environment variables
.env
.env.local
.env.*.local
```

Only commit `.env.example` as a template.

## Migration from Other Frameworks

### From Create React App

CRA uses `REACT_APP_` prefix instead of `VITE_`:

**Before (CRA)**:
```env
REACT_APP_API_URL=http://localhost:3001
```

**After (Vite)**:
```env
VITE_API_BASE_URL=http://localhost:3001
```

**Code Changes**:
```typescript
// Before
const apiUrl = process.env.REACT_APP_API_URL;

// After
const apiUrl = import.meta.env.VITE_API_BASE_URL;
```

### From Next.js

Next.js uses `NEXT_PUBLIC_` prefix:

**Before (Next.js)**:
```env
NEXT_PUBLIC_API_URL=http://localhost:3001
```

**After (Vite)**:
```env
VITE_API_BASE_URL=http://localhost:3001
```

## Future Variables

As the application grows, additional environment variables may be added:

### Planned Variables

```env
# Feature Flags
VITE_ENABLE_ANALYTICS=true
VITE_ENABLE_VOICE_INPUT=false

# API Configuration
VITE_API_TIMEOUT=30000
VITE_ENABLE_RETRY=true

# UI Configuration
VITE_THEME=dark
VITE_DEFAULT_AGENT=onboarding
```

These will be documented here when implemented.

---

**Document Version**: 1.0  
**Last Updated**: January 2026  
**Maintained By**: Agent UI Development Team
