#!/bin/bash

# Add inline policy directly to the role for faster propagation

ROLE_NAME="AmazonBedrockAgentCoreSDKRuntime-us-east-1-39f859492b"

echo "Adding inline policy to MWCAgent role..."

aws iam put-role-policy \
    --role-name "$ROLE_NAME" \
    --policy-name "InvokeOtherAgentsInline" \
    --policy-document '{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": "bedrock-agentcore:InvokeAgentRuntime",
      "Resource": [
        "arn:aws:bedrock-agentcore:us-east-1:905767016260:runtime/OnboardingAgent_Agent-Pgs8nUGuuS",
        "arn:aws:bedrock-agentcore:us-east-1:905767016260:runtime/OnboardingAgent_Agent-Pgs8nUGuuS/*",
        "arn:aws:bedrock-agentcore:us-east-1:905767016260:runtime/ProvisioningAgent_Agent-oHKfV3FmyU",
        "arn:aws:bedrock-agentcore:us-east-1:905767016260:runtime/ProvisioningAgent_Agent-oHKfV3FmyU/*"
      ]
    }
  ]
}'

echo "✅ Inline policy added!"
