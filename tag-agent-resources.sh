#!/bin/bash

# Script to tag agent-related AWS resources with auto-delete:never
# Since AgentCore runtime tagging is not yet supported, we tag the underlying resources

ACCOUNT_ID="905767016260"
REGION="us-east-1"

echo "Tagging agent-related AWS resources with auto-delete:never..."
echo ""

# Tag IAM roles
echo "Tagging IAM roles..."
aws iam tag-role \
    --role-name AmazonBedrockAgentCoreSDKRuntime-us-east-1-39f859492b \
    --tags Key=auto-delete,Value=never Key=Agent,Value=MWCAgent

aws iam tag-role \
    --role-name AmazonBedrockAgentCoreSDKRuntime-us-east-1-98b4eb4cce \
    --tags Key=auto-delete,Value=never Key=Agent,Value=OnboardingAgent

aws iam tag-role \
    --role-name AmazonBedrockAgentCoreSDKRuntime-us-east-1-7f393841fb \
    --tags Key=auto-delete,Value=never Key=Agent,Value=ProvisioningAgent

echo "✅ IAM roles tagged"
echo ""

# Tag S3 bucket
echo "Tagging S3 bucket..."
aws s3api put-bucket-tagging \
    --bucket bedrock-agentcore-codebuild-sources-905767016260-us-east-1 \
    --tagging 'TagSet=[{Key=auto-delete,Value=never},{Key=ManagedBy,Value=AgentCore},{Key=Project,Value=MWC-Demo}]'

echo "✅ S3 bucket tagged"
echo ""

# Tag CloudWatch Log Groups
echo "Tagging CloudWatch Log Groups..."
aws logs tag-log-group \
    --log-group-name /aws/bedrock-agentcore/runtimes/MWCAgent_Agent-31gMn650Bl-DEFAULT \
    --tags auto-delete=never,Agent=MWCAgent

aws logs tag-log-group \
    --log-group-name /aws/bedrock-agentcore/runtimes/OnboardingAgent_Agent-Pgs8nUGuuS-DEFAULT \
    --tags auto-delete=never,Agent=OnboardingAgent

aws logs tag-log-group \
    --log-group-name /aws/bedrock-agentcore/runtimes/ProvisioningAgent_Agent-oHKfV3FmyU-DEFAULT \
    --tags auto-delete=never,Agent=ProvisioningAgent

echo "✅ CloudWatch Log Groups tagged"
echo ""

echo "✅ All agent resources tagged with auto-delete:never!"
echo ""
echo "Tagged resources:"
echo "  • 3 IAM execution roles"
echo "  • 1 S3 bucket (shared)"
echo "  • 3 CloudWatch Log Groups"
echo ""
echo "Note: AgentCore runtime resources themselves cannot be tagged yet"
echo "      but all supporting AWS resources are now protected."
