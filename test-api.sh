#!/bin/bash
# Test script for Agent UI Backend API

API_URL="https://kmp3lr1x97.execute-api.us-east-1.amazonaws.com/production"

echo "🧪 Testing Agent UI Backend API"
echo "================================"
echo ""

# Test 1: Health Check
echo "1️⃣  Health Check"
echo "   GET $API_URL/health"
curl -s "$API_URL/health" | jq
echo ""

# Test 2: List Agents
echo "2️⃣  List Agents"
echo "   GET $API_URL/api/agents/list"
curl -s "$API_URL/api/agents/list" | jq
echo ""

# Test 3: Check OnboardingAgent Status
echo "3️⃣  Check OnboardingAgent Status"
echo "   GET $API_URL/api/agents/status/onboarding"
curl -s "$API_URL/api/agents/status/onboarding" | jq
echo ""

# Test 4: Invoke OnboardingAgent (Simple)
echo "4️⃣  Invoke OnboardingAgent (Simple S3 Bucket)"
echo "   POST $API_URL/api/agents/invoke"
echo "   This may take 20-30 seconds..."
RESPONSE=$(curl -s -X POST "$API_URL/api/agents/invoke" \
  -H "Content-Type: application/json" \
  -d '{"agentId": "onboarding", "prompt": "Generate a simple S3 bucket CloudFormation template"}')

echo "$RESPONSE" | jq -r '.response' | head -50
echo ""
echo "   ✅ Response length: $(echo "$RESPONSE" | jq -r '.response' | wc -c) characters"
echo "   ✅ Session ID: $(echo "$RESPONSE" | jq -r '.sessionId')"

# Check for clean output (no SSE formatting)
if echo "$RESPONSE" | jq -r '.response' | grep -q 'data: '; then
  echo "   ⚠️  Warning: Response contains SSE formatting"
else
  echo "   ✅ Clean output (no SSE formatting)"
fi

echo ""
echo "================================"
echo "✅ All tests completed!"
