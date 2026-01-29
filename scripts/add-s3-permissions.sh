#!/bin/bash

# Add S3 permissions to ProvisioningAgent for CloudFormation deployments

PROVISIONING_ROLE="AmazonBedrockAgentCoreSDKRuntime-us-east-1-7f393841fb"

echo "Adding S3 permissions to ProvisioningAgent..."

# Add S3 full access for CloudFormation deployments
aws iam attach-role-policy \
    --role-name "$PROVISIONING_ROLE" \
    --policy-arn "arn:aws:iam::aws:policy/AmazonS3FullAccess"

# Add EC2 permissions for compute resources
aws iam attach-role-policy \
    --role-name "$PROVISIONING_ROLE" \
    --policy-arn "arn:aws:iam::aws:policy/AmazonEC2FullAccess"

# Add RDS permissions for database resources
aws iam attach-role-policy \
    --role-name "$PROVISIONING_ROLE" \
    --policy-arn "arn:aws:iam::aws:policy/AmazonRDSFullAccess"

# Add ELB permissions for load balancers
aws iam attach-role-policy \
    --role-name "$PROVISIONING_ROLE" \
    --policy-arn "arn:aws:iam::aws:policy/ElasticLoadBalancingFullAccess"

# Add Auto Scaling permissions
aws iam attach-role-policy \
    --role-name "$PROVISIONING_ROLE" \
    --policy-arn "arn:aws:iam::aws:policy/AutoScalingFullAccess"

# Add IAM permissions for CloudFormation to create roles
aws iam put-role-policy \
    --role-name "$PROVISIONING_ROLE" \
    --policy-name "CloudFormationIAMPassRole" \
    --policy-document '{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "iam:CreateRole",
        "iam:DeleteRole",
        "iam:GetRole",
        "iam:PassRole",
        "iam:AttachRolePolicy",
        "iam:DetachRolePolicy",
        "iam:PutRolePolicy",
        "iam:DeleteRolePolicy",
        "iam:CreateInstanceProfile",
        "iam:DeleteInstanceProfile",
        "iam:AddRoleToInstanceProfile",
        "iam:RemoveRoleFromInstanceProfile"
      ],
      "Resource": "*"
    }
  ]
}'

echo "✅ All permissions added to ProvisioningAgent!"
echo ""
echo "The ProvisioningAgent can now deploy CloudFormation stacks with:"
echo "  - S3 buckets"
echo "  - EC2 instances and Auto Scaling Groups"
echo "  - RDS databases"
echo "  - Load Balancers"
echo "  - IAM roles and policies"
