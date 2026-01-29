#!/bin/bash

# Agent UI - Production Deployment to S3 + CloudFront
# This script deploys the frontend to S3 with CloudFront CDN

set -e

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}Agent UI - Production Deployment${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# Configuration
BUCKET_NAME="agent-ui-production-$(aws sts get-caller-identity --query Account --output text)"
REGION="us-east-1"
API_URL="https://9o7t39jx61.execute-api.us-east-1.amazonaws.com/production"

echo -e "${BLUE}[INFO]${NC} Configuration:"
echo "  Bucket: $BUCKET_NAME"
echo "  Region: $REGION"
echo "  API URL: $API_URL"
echo ""

# Create S3 bucket
echo -e "${BLUE}[INFO]${NC} Creating S3 bucket..."
aws s3 mb s3://$BUCKET_NAME --region $REGION 2>/dev/null || echo "Bucket already exists"

# Configure for static website hosting
echo -e "${BLUE}[INFO]${NC} Configuring static website hosting..."
aws s3 website s3://$BUCKET_NAME \
  --index-document index.html \
  --error-document index.html

# Upload files
echo -e "${BLUE}[INFO]${NC} Uploading files to S3..."
aws s3 sync agent-ui/dist/ s3://$BUCKET_NAME \
  --delete \
  --cache-control "public, max-age=31536000, immutable" \
  --exclude "index.html"

# Upload index.html with no-cache
aws s3 cp agent-ui/dist/index.html s3://$BUCKET_NAME/index.html \
  --cache-control "no-cache, no-store, must-revalidate"

# Create CloudFront distribution
echo -e "${BLUE}[INFO]${NC} Creating CloudFront distribution..."

# Create OAI for CloudFront
OAI_ID=$(aws cloudfront create-cloud-front-origin-access-identity \
  --cloud-front-origin-access-identity-config \
    CallerReference="agent-ui-$(date +%s)",Comment="Agent UI OAI" \
  --query 'CloudFrontOriginAccessIdentity.Id' \
  --output text 2>/dev/null || echo "")

if [ -z "$OAI_ID" ]; then
  # OAI might already exist, list and use first one
  OAI_ID=$(aws cloudfront list-cloud-front-origin-access-identities \
    --query 'CloudFrontOriginAccessIdentityList.Items[0].Id' \
    --output text)
fi

# Create distribution config
cat > /tmp/cf-config.json <<EOF
{
  "CallerReference": "agent-ui-$(date +%s)",
  "Comment": "Agent UI Distribution",
  "DefaultRootObject": "index.html",
  "Origins": {
    "Quantity": 1,
    "Items": [
      {
        "Id": "S3-agent-ui",
        "DomainName": "$BUCKET_NAME.s3.$REGION.amazonaws.com",
        "S3OriginConfig": {
          "OriginAccessIdentity": "origin-access-identity/cloudfront/$OAI_ID"
        }
      }
    ]
  },
  "DefaultCacheBehavior": {
    "TargetOriginId": "S3-agent-ui",
    "ViewerProtocolPolicy": "redirect-to-https",
    "AllowedMethods": {
      "Quantity": 2,
      "Items": ["GET", "HEAD"],
      "CachedMethods": {
        "Quantity": 2,
        "Items": ["GET", "HEAD"]
      }
    },
    "Compress": true,
    "ForwardedValues": {
      "QueryString": false,
      "Cookies": {
        "Forward": "none"
      }
    },
    "MinTTL": 0,
    "DefaultTTL": 86400,
    "MaxTTL": 31536000
  },
  "CustomErrorResponses": {
    "Quantity": 1,
    "Items": [
      {
        "ErrorCode": 404,
        "ResponsePagePath": "/index.html",
        "ResponseCode": "200",
        "ErrorCachingMinTTL": 300
      }
    ]
  },
  "Enabled": true
}
EOF

echo -e "${BLUE}[INFO]${NC} Creating CloudFront distribution (this may take 10-15 minutes)..."
DISTRIBUTION_ID=$(aws cloudfront create-distribution \
  --distribution-config file:///tmp/cf-config.json \
  --query 'Distribution.Id' \
  --output text)

DOMAIN_NAME=$(aws cloudfront get-distribution \
  --id $DISTRIBUTION_ID \
  --query 'Distribution.DomainName' \
  --output text)

# Update bucket policy for CloudFront OAI
echo -e "${BLUE}[INFO]${NC} Updating bucket policy for CloudFront access..."
cat > /tmp/bucket-policy.json <<EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "CloudFrontAccess",
      "Effect": "Allow",
      "Principal": {
        "AWS": "arn:aws:iam::cloudfront:user/CloudFront Origin Access Identity $OAI_ID"
      },
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::$BUCKET_NAME/*"
    }
  ]
}
EOF

aws s3api put-bucket-policy \
  --bucket $BUCKET_NAME \
  --policy file:///tmp/bucket-policy.json

echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}Deployment Complete!${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo "S3 Bucket: $BUCKET_NAME"
echo "CloudFront Distribution: $DISTRIBUTION_ID"
echo ""
echo "Your application will be available at:"
echo -e "${GREEN}https://$DOMAIN_NAME${NC}"
echo ""
echo -e "${YELLOW}Note: CloudFront distribution is being created.${NC}"
echo -e "${YELLOW}It may take 10-15 minutes to become fully available.${NC}"
echo ""
echo "Check status:"
echo "  aws cloudfront get-distribution --id $DISTRIBUTION_ID --query 'Distribution.Status'"
echo ""
echo "When status is 'Deployed', your app will be live!"
echo ""
echo -e "${GREEN}========================================${NC}"
