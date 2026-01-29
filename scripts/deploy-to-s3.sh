#!/bin/bash

# Deploy Agent UI to S3 + CloudFront
# Simple static hosting without Amplify

set -e

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}Deploying Agent UI to S3 + CloudFront${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# Configuration
BUCKET_NAME="agent-ui-frontend-$(date +%s)"
REGION="us-east-1"
API_URL="https://9o7t39jx61.execute-api.us-east-1.amazonaws.com/production"

echo -e "${BLUE}[INFO]${NC} Creating S3 bucket: $BUCKET_NAME"
aws s3 mb s3://$BUCKET_NAME --region $REGION

echo -e "${BLUE}[INFO]${NC} Configuring bucket for static website hosting"
aws s3 website s3://$BUCKET_NAME \
  --index-document index.html \
  --error-document index.html

echo -e "${BLUE}[INFO]${NC} Setting bucket policy for public read"
cat > /tmp/bucket-policy.json <<EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "PublicReadGetObject",
      "Effect": "Allow",
      "Principal": "*",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::$BUCKET_NAME/*"
    }
  ]
}
EOF

aws s3api put-bucket-policy \
  --bucket $BUCKET_NAME \
  --policy file:///tmp/bucket-policy.json

echo -e "${BLUE}[INFO]${NC} Uploading files to S3"
aws s3 sync agent-ui/dist/ s3://$BUCKET_NAME \
  --delete \
  --cache-control "public, max-age=31536000, immutable" \
  --exclude "index.html"

# Upload index.html with no-cache
aws s3 cp agent-ui/dist/index.html s3://$BUCKET_NAME/index.html \
  --cache-control "no-cache, no-store, must-revalidate"

echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}Deployment Complete!${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo "Your application is now live at:"
echo -e "${GREEN}http://$BUCKET_NAME.s3-website-$REGION.amazonaws.com${NC}"
echo ""
echo "Note: This is HTTP only. For HTTPS, set up CloudFront:"
echo "  aws cloudfront create-distribution ..."
echo ""
echo -e "${BLUE}========================================${NC}"
