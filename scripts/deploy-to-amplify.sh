#!/bin/bash

# Agent UI - AWS Amplify Deployment Script
# This script helps deploy the Agent UI to AWS Amplify

set -e

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}Agent UI - AWS Amplify Deployment${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# Configuration
REPOSITORY_URL="https://ssh.gitlab.aws.dev/adhavle/ict-demo-mwc"
BRANCH="main"
APP_NAME="agent-ui"
REGION="us-east-1"
API_URL="https://9o7t39jx61.execute-api.us-east-1.amazonaws.com/production"

echo -e "${BLUE}[INFO]${NC} Deployment Configuration:"
echo "  App Name: $APP_NAME"
echo "  Repository: $REPOSITORY_URL"
echo "  Branch: $BRANCH"
echo "  Region: $REGION"
echo "  API URL: $API_URL"
echo ""

echo -e "${YELLOW}[NOTE]${NC} AWS Amplify requires repository connection through OAuth."
echo -e "${YELLOW}[NOTE]${NC} This cannot be automated via CLI."
echo ""
echo -e "${BLUE}[INFO]${NC} Please follow these steps in the AWS Console:"
echo ""
echo "1. Open AWS Amplify Console:"
echo "   ${GREEN}https://console.aws.amazon.com/amplify/${NC}"
echo ""
echo "2. Click 'New app' → 'Host web app'"
echo ""
echo "3. Select 'GitLab' and authorize AWS Amplify"
echo ""
echo "4. Select repository and branch:"
echo "   Repository: ${GREEN}adhavle/ict-demo-mwc${NC}"
echo "   Branch: ${GREEN}main${NC}"
echo ""
echo "5. Configure build settings:"
echo "   App name: ${GREEN}agent-ui${NC}"
echo "   Base directory: ${GREEN}agent-ui${NC}"
echo "   Build command: ${GREEN}npm run build${NC} (auto-detected)"
echo "   Output directory: ${GREEN}dist${NC} (auto-detected)"
echo ""
echo "6. ${RED}IMPORTANT${NC} - Add environment variable:"
echo "   Name: ${GREEN}VITE_API_BASE_URL${NC}"
echo "   Value: ${GREEN}$API_URL${NC}"
echo ""
echo "7. Click 'Save and deploy'"
echo ""
echo "8. Wait 3-5 minutes for deployment"
echo ""
echo "9. Access your app at: ${GREEN}https://main.{app-id}.amplifyapp.com${NC}"
echo ""
echo -e "${BLUE}========================================${NC}"
echo -e "${GREEN}After deployment, verify:${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""
echo "✓ Application loads without errors"
echo "✓ All 3 agents visible in side navigation"
echo "✓ Agent selection works"
echo "✓ Chat messages send successfully"
echo "✓ Responses stream in real-time"
echo "✓ Tabs are created correctly"
echo "✓ Template syntax highlighting works"
echo "✓ Copy and download buttons work"
echo ""
echo -e "${BLUE}========================================${NC}"
echo -e "${GREEN}Your backend is already live!${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""
echo "Test it now:"
echo "  ${GREEN}curl $API_URL/health${NC}"
echo ""
echo "View logs:"
echo "  ${GREEN}aws logs tail /aws/lambda/agent-ui-api-production --follow${NC}"
echo ""
echo -e "${BLUE}========================================${NC}"
echo ""
echo -e "${GREEN}Ready to deploy? Follow the steps above!${NC}"
echo ""
