#!/bin/bash
# Test Lambda Function URL with streaming

FUNCTION_URL="https://led3hq4drjye4du3fcf2ldxjiq0uacqx.lambda-url.us-east-1.on.aws/"

echo "🧪 Testing Lambda Function URL with Streaming"
echo "=============================================="
echo ""
echo "URL: $FUNCTION_URL"
echo ""
echo "📝 Testing with 3-tier application prompt (will take 60-150 seconds)"
echo "⏳ Streaming response in real-time..."
echo ""

START_TIME=$(date +%s)

curl -N -X POST "$FUNCTION_URL" \
  -H "Content-Type: application/json" \
  -d '{
    "agentId": "onboarding",
    "prompt": "Generate a cloudformation template to provision resources to meet requirements outlined in below Q and A. Output should include cloudformation template in <cfn> xml tag, architecture overview, cost optimization tips and quick summary. Q: What kind of application do you want to host? A: It is a 3 tier web application. Q: which aws region do you want the application to be hosted in? A: us-east-1. Q: Any security and/or availability requirements to keep in mind in hosting this application? A: It should be within a private network and highly available. Q: What kind of storage requirements do you have? A: We have 30GB of files and video data and 20GB of transaction data for this application. Q: Anything else you want us to consider? A: Yes, we want to have minimal operations and cost overhead. And one more thing, this app is very cpu intensive."
  }' 2>&1 | while IFS= read -r line; do
    # Parse SSE format and extract chunk
    if [[ $line == data:* ]]; then
      CHUNK=$(echo "$line" | sed 's/^data: //' | jq -r '.chunk // empty')
      if [ -n "$CHUNK" ]; then
        echo -n "$CHUNK"
      fi
      
      # Check for done signal
      if echo "$line" | jq -e '.done' > /dev/null 2>&1; then
        break
      fi
    fi
  done

END_TIME=$(date +%s)
DURATION=$((END_TIME - START_TIME))

echo ""
echo ""
echo "=============================================="
echo "✅ Streaming completed in ${DURATION} seconds"
echo ""
echo "💡 No timeout! Lambda Function URL supports unlimited response time."
