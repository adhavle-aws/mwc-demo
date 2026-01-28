#!/bin/bash

# Script to set up IAM permissions for MWCAgent to invoke other agents

ACCOUNT_ID="905767016260"
REGION="us-east-1"
MWC_ROLE="AmazonBedrockAgentCoreSDKRuntime-us-east-1-39f859492b"

ONBOARDING_ARN="arn:aws:bedrock-agentcore:us-east-1:905767016260:runtime/OnboardingAgent_Agent-Pgs8nUGuuS"
PROVISIONING_ARN="arn:aws:bedrock-agentcore:us-east-1:905767016260:runtime/ProvisioningAgent_Agent-oHKfV3FmyU"

echo "Creating IAM policy for agent-to-agent communication..."

# Create policy document
cat > /tmp/agent-invoke-policy.json <<EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "bedrock-agentcore:InvokeAgentRuntime"
      ],
      "Resource": [
        "${ONBOARDING_ARN}",
        "${PROVISIONING_ARN}"
      ]
    }
  ]
}
EOF

# Create or update the policy
POLICY_NAME="MWCAgent-InvokeOtherAgents-Policy"
POLICY_ARN="arn:aws:iam::${ACCOUNT_ID}:policy/${POLICY_NAME}"

# Check if policy exists
if aws iam get-policy --policy-arn "$POLICY_ARN" 2>/dev/null; then
    echo "Policy exists, creating new version..."
    aws iam create-policy-version \
        --policy-arn "$POLICY_ARN" \
        --policy-document file:///tmp/agent-invoke-policy.json \
        --set-as-default
else
    echo "Creating new policy..."
    aws iam create-policy \
        --policy-name "$POLICY_NAME" \
        --policy-document file:///tmp/agent-invoke-policy.json \
        --description "Allows MWCAgent to invoke Onboarding and Provisioning agents"
fi

# Attach policy to MWCAgent role
echo "Attaching policy to MWCAgent role..."
aws iam attach-role-policy \
    --role-name "$MWC_ROLE" \
    --policy-arn "$POLICY_ARN"

echo "✅ Permissions configured successfully!"
echo ""
echo "Agent ARNs:"
echo "  Onboarding: $ONBOARDING_ARN"
echo "  Provisioning: $PROVISIONING_ARN"
echo ""
echo "Set these as environment variables when deploying MWCAgent:"
echo "  export ONBOARDING_AGENT_ARN=\"$ONBOARDING_ARN\""
echo "  export PROVISIONING_AGENT_ARN=\"$PROVISIONING_ARN\""
