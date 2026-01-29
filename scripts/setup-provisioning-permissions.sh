#!/bin/bash

# Script to add CloudFormation permissions to Provisioning Agent

PROVISIONING_ROLE="AmazonBedrockAgentCoreSDKRuntime-us-east-1-7f393841fb"

echo "Adding CloudFormation permissions to Provisioning Agent..."

# Attach AWS managed CloudFormation Full Access policy
aws iam attach-role-policy \
    --role-name "$PROVISIONING_ROLE" \
    --policy-arn "arn:aws:iam::aws:policy/AWSCloudFormationFullAccess"

echo "✅ CloudFormation permissions added to Provisioning Agent!"
