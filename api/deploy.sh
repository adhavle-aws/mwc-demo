#!/bin/bash

# Agent UI Backend API - AWS Deployment Script
# This script deploys the backend API to AWS Lambda + API Gateway using AWS SAM

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
STACK_NAME="agent-ui-api"
ENVIRONMENT="${ENVIRONMENT:-production}"
S3_BUCKET="${S3_BUCKET:-}"
AWS_REGION="${AWS_REGION:-us-east-1}"

# Agent ARNs (must be provided)
ONBOARDING_AGENT_ARN="${ONBOARDING_AGENT_ARN:-}"
PROVISIONING_AGENT_ARN="${PROVISIONING_AGENT_ARN:-}"
MWC_AGENT_ARN="${MWC_AGENT_ARN:-}"

# CORS Origin
CORS_ORIGIN="${CORS_ORIGIN:-*}"

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}Agent UI Backend API - AWS Deployment${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# Function to print colored messages
print_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check prerequisites
print_info "Checking prerequisites..."

# Check AWS CLI
if ! command -v aws &> /dev/null; then
    print_error "AWS CLI is not installed. Please install it first."
    exit 1
fi

# Check SAM CLI
if ! command -v sam &> /dev/null; then
    print_error "AWS SAM CLI is not installed. Please install it first."
    echo "Install with: pip install aws-sam-cli"
    exit 1
fi

# Check Node.js
if ! command -v node &> /dev/null; then
    print_error "Node.js is not installed. Please install it first."
    exit 1
fi

# Check npm
if ! command -v npm &> /dev/null; then
    print_error "npm is not installed. Please install it first."
    exit 1
fi

print_success "All prerequisites are installed"

# Validate Agent ARNs
print_info "Validating configuration..."

if [ -z "$ONBOARDING_AGENT_ARN" ]; then
    print_error "ONBOARDING_AGENT_ARN environment variable is not set"
    echo "Set it with: export ONBOARDING_AGENT_ARN='arn:aws:bedrock:...'"
    exit 1
fi

if [ -z "$PROVISIONING_AGENT_ARN" ]; then
    print_error "PROVISIONING_AGENT_ARN environment variable is not set"
    echo "Set it with: export PROVISIONING_AGENT_ARN='arn:aws:bedrock:...'"
    exit 1
fi

if [ -z "$MWC_AGENT_ARN" ]; then
    print_error "MWC_AGENT_ARN environment variable is not set"
    echo "Set it with: export MWC_AGENT_ARN='arn:aws:bedrock:...'"
    exit 1
fi

print_success "Configuration validated"

# Display configuration
echo ""
print_info "Deployment Configuration:"
echo "  Stack Name: $STACK_NAME"
echo "  Environment: $ENVIRONMENT"
echo "  AWS Region: $AWS_REGION"
echo "  CORS Origin: $CORS_ORIGIN"
echo "  OnboardingAgent ARN: ${ONBOARDING_AGENT_ARN:0:50}..."
echo "  ProvisioningAgent ARN: ${PROVISIONING_AGENT_ARN:0:50}..."
echo "  MWCAgent ARN: ${MWC_AGENT_ARN:0:50}..."
echo ""

# Confirm deployment
read -p "Continue with deployment? (y/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    print_warning "Deployment cancelled"
    exit 0
fi

# Install dependencies
print_info "Installing dependencies..."
npm install
print_success "Dependencies installed"

# Build TypeScript
print_info "Building TypeScript..."
npm run build
print_success "Build completed"

# Create S3 bucket for deployment artifacts if not provided
if [ -z "$S3_BUCKET" ]; then
    S3_BUCKET="agent-ui-api-deployment-$(aws sts get-caller-identity --query Account --output text)"
    print_info "Creating S3 bucket: $S3_BUCKET"
    
    # Create bucket (ignore error if already exists)
    aws s3 mb "s3://$S3_BUCKET" --region "$AWS_REGION" 2>/dev/null || true
    
    # Enable versioning
    aws s3api put-bucket-versioning \
        --bucket "$S3_BUCKET" \
        --versioning-configuration Status=Enabled \
        --region "$AWS_REGION" 2>/dev/null || true
    
    print_success "S3 bucket ready: $S3_BUCKET"
fi

# Build SAM application
print_info "Building SAM application..."
sam build --use-container
print_success "SAM build completed"

# Deploy with SAM
print_info "Deploying to AWS..."
sam deploy \
    --stack-name "$STACK_NAME" \
    --s3-bucket "$S3_BUCKET" \
    --s3-prefix "agent-ui-api" \
    --region "$AWS_REGION" \
    --capabilities CAPABILITY_IAM \
    --parameter-overrides \
        Environment="$ENVIRONMENT" \
        OnboardingAgentArn="$ONBOARDING_AGENT_ARN" \
        ProvisioningAgentArn="$PROVISIONING_AGENT_ARN" \
        MWCAgentArn="$MWC_AGENT_ARN" \
        CorsOrigin="$CORS_ORIGIN" \
    --no-fail-on-empty-changeset

print_success "Deployment completed!"

# Get outputs
print_info "Retrieving stack outputs..."
API_URL=$(aws cloudformation describe-stacks \
    --stack-name "$STACK_NAME" \
    --region "$AWS_REGION" \
    --query 'Stacks[0].Outputs[?OutputKey==`ApiUrl`].OutputValue' \
    --output text)

FUNCTION_NAME=$(aws cloudformation describe-stacks \
    --stack-name "$STACK_NAME" \
    --region "$AWS_REGION" \
    --query 'Stacks[0].Outputs[?OutputKey==`FunctionName`].OutputValue' \
    --output text)

echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}Deployment Successful!${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo "API Endpoint: $API_URL"
echo "Lambda Function: $FUNCTION_NAME"
echo ""
echo "Test the API:"
echo "  Health Check:"
echo "    curl $API_URL/health"
echo ""
echo "  List Agents:"
echo "    curl $API_URL/api/agents/list"
echo ""
echo "  Invoke Agent:"
echo "    curl -X POST $API_URL/api/agents/invoke \\"
echo "      -H 'Content-Type: application/json' \\"
echo "      -d '{\"agentId\":\"onboarding\",\"prompt\":\"Hello\"}'"
echo ""
echo "View Logs:"
echo "  aws logs tail /aws/lambda/$FUNCTION_NAME --follow"
echo ""
echo -e "${GREEN}========================================${NC}"
