#!/bin/bash

# Test script for deployed Agent UI Backend API

set -e

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Configuration
STACK_NAME="${STACK_NAME:-agent-ui-api}"
AWS_REGION="${AWS_REGION:-us-east-1}"

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}Testing Agent UI Backend API${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# Get API URL from CloudFormation stack
echo -e "${BLUE}[INFO]${NC} Retrieving API endpoint..."
API_URL=$(aws cloudformation describe-stacks \
    --stack-name "$STACK_NAME" \
    --region "$AWS_REGION" \
    --query 'Stacks[0].Outputs[?OutputKey==`ApiUrl`].OutputValue' \
    --output text)

if [ -z "$API_URL" ]; then
    echo -e "${RED}[ERROR]${NC} Could not retrieve API URL. Is the stack deployed?"
    exit 1
fi

echo -e "${GREEN}[SUCCESS]${NC} API URL: $API_URL"
echo ""

# Test 1: Health Check
echo -e "${BLUE}[TEST 1]${NC} Health Check"
echo "  GET $API_URL/health"
HEALTH_RESPONSE=$(curl -s "$API_URL/health")
echo "  Response: $HEALTH_RESPONSE"

if echo "$HEALTH_RESPONSE" | grep -q "healthy"; then
    echo -e "${GREEN}  ✓ PASSED${NC}"
else
    echo -e "${RED}  ✗ FAILED${NC}"
fi
echo ""

# Test 2: List Agents
echo -e "${BLUE}[TEST 2]${NC} List Agents"
echo "  GET $API_URL/api/agents/list"
AGENTS_RESPONSE=$(curl -s "$API_URL/api/agents/list")
echo "  Response: $AGENTS_RESPONSE"

if echo "$AGENTS_RESPONSE" | grep -q "onboarding"; then
    echo -e "${GREEN}  ✓ PASSED${NC}"
else
    echo -e "${RED}  ✗ FAILED${NC}"
fi
echo ""

# Test 3: Get Agent Status
echo -e "${BLUE}[TEST 3]${NC} Get Agent Status"
echo "  GET $API_URL/api/agents/status/onboarding"
STATUS_RESPONSE=$(curl -s "$API_URL/api/agents/status/onboarding")
echo "  Response: $STATUS_RESPONSE"

if echo "$STATUS_RESPONSE" | grep -q "agentId"; then
    echo -e "${GREEN}  ✓ PASSED${NC}"
else
    echo -e "${RED}  ✗ FAILED${NC}"
fi
echo ""

# Test 4: Invoke Agent (Optional - requires valid agent)
echo -e "${BLUE}[TEST 4]${NC} Invoke Agent (Optional)"
echo "  POST $API_URL/api/agents/invoke"
echo "  Payload: {\"agentId\":\"onboarding\",\"prompt\":\"Hello\"}"
echo -e "${YELLOW}  Note: This test requires valid agent ARNs and may take 10-30 seconds${NC}"

read -p "  Run agent invocation test? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    INVOKE_RESPONSE=$(curl -s -X POST "$API_URL/api/agents/invoke" \
        -H "Content-Type: application/json" \
        -d '{"agentId":"onboarding","prompt":"Hello"}')
    
    echo "  Response (first 200 chars): ${INVOKE_RESPONSE:0:200}..."
    
    if echo "$INVOKE_RESPONSE" | grep -q "response"; then
        echo -e "${GREEN}  ✓ PASSED${NC}"
    else
        echo -e "${RED}  ✗ FAILED${NC}"
        echo "  Full response: $INVOKE_RESPONSE"
    fi
else
    echo -e "${YELLOW}  ⊘ SKIPPED${NC}"
fi
echo ""

# Summary
echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}Test Summary${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""
echo "API Endpoint: $API_URL"
echo ""
echo "Next steps:"
echo "  1. Update frontend .env with API_URL"
echo "  2. Test agent invocation with real prompts"
echo "  3. Monitor logs: aws logs tail /aws/lambda/agent-ui-api-production --follow"
echo ""
echo -e "${GREEN}Testing complete!${NC}"
