#!/bin/bash

# ============================================================================
# End-to-End Integration Test
# ============================================================================
#
# This script performs comprehensive end-to-end testing of the frontend
# and backend integration, including streaming support verification.
#
# Usage:
#   ./test-e2e-integration.sh
#
# Prerequisites:
#   - Backend API deployed to AWS
#   - .env.production configured with API URL
#   - curl and jq installed
#
# ============================================================================

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Configuration
ENV_FILE=".env.production"
TEST_TIMEOUT=30

echo -e "${BLUE}============================================================================${NC}"
echo -e "${BLUE}End-to-End Integration Test${NC}"
echo -e "${BLUE}============================================================================${NC}"
echo ""

# Check prerequisites
echo -e "${CYAN}Checking prerequisites...${NC}"
echo ""

# Check if jq is installed
if ! command -v jq &> /dev/null; then
    echo -e "${YELLOW}⚠️  Warning: jq is not installed (optional for JSON parsing)${NC}"
    echo "Install with: brew install jq"
    echo ""
fi

# Check if .env.production exists
if [ ! -f "$ENV_FILE" ]; then
    echo -e "${RED}❌ Error: ${ENV_FILE} not found${NC}"
    echo ""
    echo "Run ./configure-api.sh to set up production configuration"
    exit 1
fi

# Get API URL
API_URL=$(grep "^VITE_API_BASE_URL=" "$ENV_FILE" | cut -d '=' -f2 | tr -d '"' | tr -d "'")

if [ -z "$API_URL" ] || [[ "$API_URL" == *"YOUR_API_GATEWAY_URL_HERE"* ]]; then
    echo -e "${RED}❌ Error: API URL is not configured in ${ENV_FILE}${NC}"
    echo ""
    echo "Run ./configure-api.sh to automatically configure the API URL"
    exit 1
fi

echo -e "${GREEN}✅ Prerequisites check passed${NC}"
echo ""
echo -e "${BLUE}API URL: ${API_URL}${NC}"
echo ""

# Test counters
TESTS_PASSED=0
TESTS_FAILED=0
TESTS_TOTAL=0

# Function to run a test
run_test() {
    local test_name=$1
    local test_function=$2
    
    ((TESTS_TOTAL++))
    echo -e "${CYAN}Test ${TESTS_TOTAL}: ${test_name}${NC}"
    
    if $test_function; then
        echo -e "${GREEN}✅ PASSED${NC}"
        ((TESTS_PASSED++))
    else
        echo -e "${RED}❌ FAILED${NC}"
        ((TESTS_FAILED++))
    fi
    echo ""
}

# ============================================================================
# Test Functions
# ============================================================================

test_health_check() {
    local response=$(curl -s -w "\n%{http_code}" "${API_URL}/health" 2>&1)
    local http_code=$(echo "$response" | tail -n1)
    
    if [ "$http_code" -eq 200 ]; then
        echo "  Status: $http_code"
        return 0
    else
        echo "  Status: $http_code"
        echo "  Response: $(echo "$response" | sed '$d')"
        return 1
    fi
}

test_list_agents() {
    local response=$(curl -s -w "\n%{http_code}" "${API_URL}/api/agents/list" 2>&1)
    local http_code=$(echo "$response" | tail -n1)
    local body=$(echo "$response" | sed '$d')
    
    if [ "$http_code" -eq 200 ]; then
        echo "  Status: $http_code"
        
        # Check if response is valid JSON array
        if command -v jq &> /dev/null; then
            local agent_count=$(echo "$body" | jq '. | length' 2>/dev/null || echo "0")
            echo "  Agents found: $agent_count"
            
            if [ "$agent_count" -ge 3 ]; then
                return 0
            else
                echo "  Expected at least 3 agents"
                return 1
            fi
        else
            # Without jq, just check if response looks like JSON array
            if [[ "$body" == "["* ]]; then
                return 0
            else
                return 1
            fi
        fi
    else
        echo "  Status: $http_code"
        echo "  Response: $body"
        return 1
    fi
}

test_agent_status() {
    local agent_id=$1
    local response=$(curl -s -w "\n%{http_code}" "${API_URL}/api/agents/status?agentId=${agent_id}" 2>&1)
    local http_code=$(echo "$response" | tail -n1)
    local body=$(echo "$response" | sed '$d')
    
    if [ "$http_code" -eq 200 ]; then
        echo "  Status: $http_code"
        
        if command -v jq &> /dev/null; then
            local status=$(echo "$body" | jq -r '.status' 2>/dev/null || echo "unknown")
            echo "  Agent status: $status"
        fi
        
        return 0
    else
        echo "  Status: $http_code"
        echo "  Response: $body"
        return 1
    fi
}

test_streaming_support() {
    echo "  Testing streaming with timeout of ${TEST_TIMEOUT}s..."
    
    # Create a temporary file for the response
    local temp_file=$(mktemp)
    
    # Make request with timeout and capture streaming
    timeout $TEST_TIMEOUT curl -s -X POST "${API_URL}/api/agents/invoke" \
        -H "Content-Type: application/json" \
        -d '{"agentId":"onboarding","prompt":"Say hello"}' \
        --no-buffer > "$temp_file" 2>&1 &
    
    local curl_pid=$!
    
    # Wait a bit for first chunk
    sleep 2
    
    # Check if we got any data
    if [ -s "$temp_file" ]; then
        local size=$(wc -c < "$temp_file" | tr -d ' ')
        echo "  Received data: ${size} bytes"
        
        # Wait for completion or timeout
        wait $curl_pid 2>/dev/null || true
        
        # Check final size
        local final_size=$(wc -c < "$temp_file" | tr -d ' ')
        echo "  Final size: ${final_size} bytes"
        
        rm -f "$temp_file"
        
        if [ "$final_size" -gt 0 ]; then
            echo "  Streaming: Working"
            return 0
        else
            echo "  Streaming: No data received"
            return 1
        fi
    else
        echo "  Streaming: No initial data received"
        kill $curl_pid 2>/dev/null || true
        rm -f "$temp_file"
        return 1
    fi
}

test_cors_headers() {
    local response=$(curl -s -I -X OPTIONS "${API_URL}/api/agents/invoke" \
        -H "Origin: https://example.com" 2>&1)
    
    if echo "$response" | grep -qi "access-control-allow-origin"; then
        echo "  CORS headers: Present"
        local origin=$(echo "$response" | grep -i "access-control-allow-origin" | cut -d ':' -f2- | tr -d '\r' | xargs)
        echo "  Allowed origin: $origin"
        return 0
    else
        echo "  CORS headers: Not found"
        return 1
    fi
}

test_error_handling() {
    # Test with invalid agent ID
    local response=$(curl -s -w "\n%{http_code}" "${API_URL}/api/agents/status?agentId=invalid" 2>&1)
    local http_code=$(echo "$response" | tail -n1)
    local body=$(echo "$response" | sed '$d')
    
    # Should return 404 or 400
    if [ "$http_code" -ge 400 ] && [ "$http_code" -lt 500 ]; then
        echo "  Status: $http_code (expected error)"
        echo "  Error handling: Working"
        return 0
    else
        echo "  Status: $http_code (unexpected)"
        echo "  Expected 4xx error for invalid agent"
        return 1
    fi
}

# ============================================================================
# Run Tests
# ============================================================================

echo -e "${CYAN}Running integration tests...${NC}"
echo ""

run_test "Health Check" test_health_check
run_test "List Agents" test_list_agents
run_test "OnboardingAgent Status" "test_agent_status onboarding"
run_test "ProvisioningAgent Status" "test_agent_status provisioning"
run_test "MWCAgent Status" "test_agent_status mwc"
run_test "CORS Headers" test_cors_headers
run_test "Error Handling" test_error_handling

# Optional: Streaming test (takes longer)
echo -e "${YELLOW}Optional: Streaming Support Test${NC}"
echo "This test invokes an agent and verifies streaming works."
echo "It may take up to ${TEST_TIMEOUT} seconds."
echo ""
read -p "Run streaming test? (y/N): " -n 1 -r
echo ""
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo ""
    run_test "Streaming Support" test_streaming_support
else
    echo -e "${YELLOW}Skipped streaming test${NC}"
    echo ""
fi

# ============================================================================
# Summary
# ============================================================================

echo -e "${BLUE}============================================================================${NC}"
echo -e "${BLUE}Test Summary${NC}"
echo -e "${BLUE}============================================================================${NC}"
echo ""
echo -e "Total Tests: ${TESTS_TOTAL}"
echo -e "Passed: ${GREEN}${TESTS_PASSED}${NC}"
echo -e "Failed: ${RED}${TESTS_FAILED}${NC}"
echo ""

if [ $TESTS_FAILED -eq 0 ]; then
    echo -e "${GREEN}✅ All tests passed! Integration is working correctly.${NC}"
    echo ""
    echo -e "${BLUE}Next steps:${NC}"
    echo "  1. Build the frontend for production:"
    echo "     npm run build:prod"
    echo ""
    echo "  2. Test the production build locally:"
    echo "     npm run preview"
    echo "     # Open http://localhost:4173 and test all features"
    echo ""
    echo "  3. Deploy to AWS Amplify:"
    echo "     git add .env.production"
    echo "     git commit -m 'Configure production API URL'"
    echo "     git push"
    echo ""
    exit 0
else
    echo -e "${RED}❌ Some tests failed. Please investigate before deploying.${NC}"
    echo ""
    echo -e "${BLUE}Troubleshooting:${NC}"
    echo "  1. Check backend deployment:"
    echo "     cd ../api && aws cloudformation describe-stacks --stack-name agent-ui-api"
    echo ""
    echo "  2. View backend logs:"
    echo "     cd ../api && npm run logs"
    echo ""
    echo "  3. Verify API URL is correct:"
    echo "     cat .env.production"
    echo ""
    echo "  4. Test API directly:"
    echo "     curl ${API_URL}/health"
    echo ""
    exit 1
fi

