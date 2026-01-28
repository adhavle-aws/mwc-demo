#!/bin/bash

# Script to fix IAM permissions for MWCAgent with correct resource ARNs

ACCOUNT_ID="905767016260"
REGION="us-east-1"

ONBOARDING_ARN="arn:aws:bedrock-agentcore:us-east-1:905767016260:runtime/OnboardingAgent_Agent-Pgs8nUGuuS"
PROVISIONING_ARN="arn:aws:bedrock-agentcore:us-east-1:905767016260:runtime/ProvisioningAgent_Agent-oHKfV3FmyU"

echo "Updating IAM policy with correct resource ARNs..."

# Create policy document with wildcard for runtime endpoints
cat > /tmp/agent-invoke-policy-fixed.json <<EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "bedrock-agentcore:InvokeAgentRuntime"
      ],
      "Resource": [
        "${ONBOARDING_ARN}/*",
        "${PROVISIONING_ARN}/*"
      ]
    }
  ]
}
EOF

# Update the policy
POLICY_ARN="arn:aws:iam::${ACCOUNT_ID}:policy/MWCAgent-InvokeOtherAgents-Policy"

echo "Creating new policy version..."
aws iam create-policy-version \
    --policy-arn "$POLICY_ARN" \
    --policy-document file:///tmp/agent-invoke-policy-fixed.json \
    --set-as-default

echo "✅ Policy updated with wildcard for runtime endpoints!"
