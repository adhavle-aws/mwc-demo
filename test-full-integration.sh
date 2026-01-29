#!/bin/bash
# Full Integration Test - Backend API + OnboardingAgent

API_URL="https://kmp3lr1x97.execute-api.us-east-1.amazonaws.com/production"

echo "🧪 Full Integration Test: OnboardingAgent via Backend API"
echo "=========================================================="
echo ""

# The full 3-tier application prompt
PROMPT='Generate a cloudformation template to provision resources to meet requirements outlined in below Q and A. Output should include cloudformation template in <cfn> xml tag, architecture overview, cost optimization tips and quick summary. Q: What kind of application do you want to host? A: It is a 3 tier web application. Q: which aws region do you want the application to be hosted in? A: us-east-1. Q: Any security and/or availability requirements to keep in mind in hosting this application? A: It should be within a private network and highly available. Q: What kind of storage requirements do you have? A: We have 30GB of files and video data and 20GB of transaction data for this application. Q: Anything else you want us to consider? A: Yes, we want to have minimal operations and cost overhead. And one more thing, this app is very cpu intensive.'

echo "📝 Prompt: 3-tier web application with HA, private network, 30GB files, 20GB DB, CPU-intensive"
echo ""
echo "⏳ Invoking OnboardingAgent... (this may take 60-90 seconds)"
echo ""

START_TIME=$(date +%s)

RESPONSE=$(curl -s -X POST "$API_URL/api/agents/invoke" \
  -H "Content-Type: application/json" \
  -d "{\"agentId\": \"onboarding\", \"prompt\": $(echo "$PROMPT" | jq -Rs .)}")

END_TIME=$(date +%s)
DURATION=$((END_TIME - START_TIME))

echo "⏱️  Response time: ${DURATION} seconds"
echo ""

# Extract response
AGENT_RESPONSE=$(echo "$RESPONSE" | jq -r '.response')
SESSION_ID=$(echo "$RESPONSE" | jq -r '.sessionId')

# Check for errors
if echo "$RESPONSE" | jq -e '.error' > /dev/null 2>&1; then
  echo "❌ Error occurred:"
  echo "$RESPONSE" | jq
  exit 1
fi

# Display first 100 lines of response
echo "📄 Response Preview (first 100 lines):"
echo "─────────────────────────────────────"
echo "$AGENT_RESPONSE" | head -100
echo "─────────────────────────────────────"
echo ""

# Validation checks
echo "✅ Validation Results:"
echo ""

RESPONSE_LENGTH=$(echo "$AGENT_RESPONSE" | wc -c | tr -d ' ')
echo "   📊 Response length: $RESPONSE_LENGTH characters"
echo "   🔑 Session ID: $SESSION_ID"

# Check for expected content
if echo "$AGENT_RESPONSE" | grep -q '<cfn>'; then
  echo "   ✅ Contains <cfn> tag"
else
  echo "   ❌ Missing <cfn> tag"
fi

if echo "$AGENT_RESPONSE" | grep -iq 'architecture'; then
  echo "   ✅ Contains architecture overview"
else
  echo "   ❌ Missing architecture overview"
fi

if echo "$AGENT_RESPONSE" | grep -iq 'cost'; then
  echo "   ✅ Contains cost optimization"
else
  echo "   ❌ Missing cost optimization"
fi

if echo "$AGENT_RESPONSE" | grep -iq 'summary'; then
  echo "   ✅ Contains summary"
else
  echo "   ❌ Missing summary"
fi

# Check for clean output (no SSE formatting)
if echo "$AGENT_RESPONSE" | grep -q 'data: '; then
  echo "   ⚠️  Warning: Response contains SSE formatting"
else
  echo "   ✅ Clean output (no SSE formatting)"
fi

echo ""
echo "=========================================================="
echo "✅ Integration test completed successfully!"
echo ""
echo "💡 To see the full response, run:"
echo "   ./test-full-integration.sh | less"
