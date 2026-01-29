#!/bin/bash

# ============================================================================
# Test API Connection
# ============================================================================
#
# This script tests the connection between the frontend and backend API.
# It verifies all endpoints are accessible and working correctly.
#
# Usage:
#   ./test-api-connection.sh [api-url]
#
# If no API URL is provided, it will be read from .env.production
#
# ============================================================================

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Get API URL from parameter or .env.production
if [ -n "$1" ]; then
    API_URL="$1"
elif [ -f ".env.production" ]; then
    API_URL=$(grep "^VITE_API_BASE_URL=" .env.production | cut -d '=' -f2)
else
    echo -e "${RED}❌ Error: No API URL provided and .env.production not found${NC}"
    echo ""
    echo "Usage:"
    echo "  ./test-api-connection.sh https://your-api-url"
    echo ""
    echo "Or run ./configure-api.sh first to set up .env.production"
    exit 1
fi

# Remove any quotes from API_URL
API_URL=$(echo "$API_URL" | tr -d '"' | tr -d "'")

# Check if API_URL is a placeholder
if [[ "$API_URL" == *"YOUR_API_GATEWAY_URL_HERE"* ]] || [ -z "$API_URL" ]; then
    echo -e "${RED}❌ Error: API URL is not configured${NC}"
    echo ""
    echo "Run ./configure-api.sh to automatically configure the API URL"
    echo "Or manually update .env.production with your API Gateway URL"
    exit 1
fi

echo -e "${BLUE}============================================================================${NC}"
echo -e "${BLUE}Testing API Connection${NC}"
echo -e "${BLUE}============================================================================${NC}"
echo ""
echo -e "${BLUE}API URL: ${API_URL}${NC}"
echo ""

# Test counter
TESTS_PASSED=0
TESTS_FAILED=0

# Function to test an endpoint
test_endpoint() {
    local method=$1
    local endpoint=$2
    local description=$3
    local data=$4
    
    echo -e "${BLUE}Testing: ${description}${NC}"
    echo "  ${method} ${endpoint}"
    
    if [ -n "$data" ]; then
        response=$(curl -s -w "\n%{http_code}" -X "$method" "${API_URL}${endpoint}" \
            -H "Content-Type: application/json" \
            -d "$data" 2>&1)
    else
        response=$(curl -s -w "\n%{http_code}" -X "$method" "${API_URL}${endpoint}" 2>&1)
    fi
    
    http_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | sed '$d')
    
    if [ "$http_code" -ge 200 ] && [ "$http_code" -lt 300 ]; then
        echo -e "  ${GREEN}✅ PASSED${NC} (HTTP $http_code)"
        if [ -n "$body" ] && [ "$body" != "OK" ]; then
            echo "  Response preview: $(echo "$body" | head -c 100)..."
        fi
        ((TESTS_PASSED++))
    else
        echo -e "  ${RED}❌ FAILED${NC} (HTTP $http_code)"
        if [ -n "$body" ]; then
            echo "  Error: $body"
        fi
        ((TESTS_FAILED++))
    fi
    echo ""
}

# Test 1: Health Check
test_endpoint "GET" "/health" "Health check endpoint"

# Test 2: List Agents
test_endpoint "GET" "/api/agents/list" "List all agents"

# Test 3: Get Agent Status (OnboardingAgent)
test_endpoint "GET" "/api/agents/status?agentId=onboarding" "Get OnboardingAgent status"

# Test 4: Get Agent Status (ProvisioningAgent)
test_endpoint "GET" "/api/agents/status?agentId=provisioning" "Get ProvisioningAgent status"

# Test 5: Get Agent Status (MWCAgent)
test_endpoint "GET" "/api/agents/status?agentId=mwc" "Get MWCAgent status"

# Test 6: Agent Invocation (Optional - requires valid agents)
echo -e "${YELLOW}⚠️  Optional Test: Agent Invocation${NC}"
echo "This test invokes the OnboardingAgent with a simple prompt."
echo "It may take 10-30 seconds to complete."
echo ""
read -p "Run agent invocation test? (y/N): " -n 1 -r
echo ""
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo ""
    test_endpoint "POST" "/api/agents/invoke" "Invoke OnboardingAgent" \
        '{"agentId":"onboarding","prompt":"Generate a simple S3 bucket CloudFormation template"}'
else
    echo -e "${YELLOW}Skipped agent invocation test${NC}"
    echo ""
fi

# Test 7: Streaming Support (Check headers)
echo -e "${BLUE}Testing: Streaming support${NC}"
echo "  Checking response headers for streaming capability"
headers=$(curl -s -I "${API_URL}/api/agents/invoke" 2>&1)
if echo "$headers" | grep -qi "transfer-encoding"; then
    echo -e "  ${GREEN}✅ PASSED${NC} (Streaming headers present)"
    ((TESTS_PASSED++))
else
    echo -e "  ${YELLOW}⚠️  WARNING${NC} (Streaming headers not detected in OPTIONS)"
    echo "  Note: Streaming may still work for POST requests"
fi
echo ""

# Summary
echo -e "${BLUE}============================================================================${NC}"
echo -e "${BLUE}Test Summary${NC}"
echo -e "${BLUE}============================================================================${NC}"
echo ""
echo -e "Tests Passed: ${GREEN}${TESTS_PASSED}${NC}"
echo -e "Tests Failed: ${RED}${TESTS_FAILED}${NC}"
echo ""

if [ $TESTS_FAILED -eq 0 ]; then
    echo -e "${GREEN}✅ All tests passed! API connection is working correctly.${NC}"
    echo ""
    echo -e "${BLUE}Next steps:${NC}"
    echo "  1. Build the frontend:"
    echo "     npm run build"
    echo ""
    echo "  2. Test the frontend locally with production API:"
    echo "     npm run preview"
    echo ""
    echo "  3. Deploy to AWS Amplify:"
    echo "     git push"
    echo ""
    exit 0
else
    echo -e "${RED}❌ Some tests failed. Please check the API deployment.${NC}"
    echo ""
    echo -e "${BLUE}Troubleshooting:${NC}"
    echo "  1. Verify the backend is deployed:"
    echo "     cd ../api && aws cloudformation describe-stacks --stack-name agent-ui-api"
    echo ""
    echo "  2. Check backend logs:"
    echo "     cd ../api && npm run logs"
    echo ""
    echo "  3. Verify agent ARNs are correct in the backend deployment"
    echo ""
    echo "  4. Check CORS configuration allows your origin"
    echo ""
    exit 1
fi

