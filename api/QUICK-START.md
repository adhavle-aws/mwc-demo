# Quick Start Guide

## Setup

1. **Install dependencies:**
   ```bash
   cd api
   npm install
   ```

2. **Configure environment:**
   ```bash
   cp .env.example .env
   ```

3. **Edit `.env` file with your AWS agent ARNs:**
   ```env
   ONBOARDING_AGENT_ARN=arn:aws:bedrock:us-east-1:YOUR_ACCOUNT:agent/YOUR_AGENT_ID
   PROVISIONING_AGENT_ARN=arn:aws:bedrock:us-east-1:YOUR_ACCOUNT:agent/YOUR_AGENT_ID
   MWC_AGENT_ARN=arn:aws:bedrock:us-east-1:YOUR_ACCOUNT:agent/YOUR_AGENT_ID
   ```

4. **Ensure AWS credentials are configured:**
   ```bash
   aws configure
   # OR set environment variables:
   # export AWS_ACCESS_KEY_ID=...
   # export AWS_SECRET_ACCESS_KEY=...
   ```

## Running

### Development Mode (with hot reload)
```bash
npm run dev
```

### Production Mode
```bash
npm run build
npm start
```

## Testing the API

### Health Check
```bash
curl http://localhost:3001/health
```

### List Agents
```bash
curl http://localhost:3001/api/agents/list
```

### Get Agent Status
```bash
curl http://localhost:3001/api/agents/status/onboarding
```

### Invoke Agent (Streaming)
```bash
curl -X POST http://localhost:3001/api/agents/invoke \
  -H "Content-Type: application/json" \
  -d '{
    "agentId": "onboarding",
    "prompt": "Design a simple serverless API"
  }'
```

### Get CloudFormation Stack Status
```bash
curl http://localhost:3001/api/stacks/status/my-stack-name
```

## Connecting Frontend

Update your frontend `.env` file:
```env
VITE_API_ENDPOINT=http://localhost:3001
```

The frontend will automatically connect to the backend API.

## Troubleshooting

### "Agent ARN not configured" error
- Check that your `.env` file has valid agent ARNs
- Restart the server after updating `.env`

### AWS credential errors
- Run `aws configure` to set up credentials
- Or set `AWS_ACCESS_KEY_ID` and `AWS_SECRET_ACCESS_KEY` environment variables

### CORS errors
- Check that `CORS_ORIGIN` in `.env` matches your frontend URL
- Default is `http://localhost:5173` for Vite dev server

### Port already in use
- Change `PORT` in `.env` to a different port
- Or kill the process using port 3001: `lsof -ti:3001 | xargs kill`
