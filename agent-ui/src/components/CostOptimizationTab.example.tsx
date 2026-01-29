import React from 'react';
import CostOptimizationTab from './CostOptimizationTab';

/**
 * Example usage of CostOptimizationTab component
 */

const sampleCostContent = `# Cost Optimization Recommendations

## Estimated Monthly Cost: $247.50

### Cost Breakdown by Service

- **Lambda**: $45.00/month (estimated 1M invocations)
- **API Gateway**: $35.00/month (1M requests)
- **DynamoDB**: $25.00/month (on-demand pricing)
- **S3**: $23.00/month (100GB storage + requests)
- **CloudWatch**: $15.00/month (logs + metrics)
- **Bedrock**: $89.50/month (agent invocations)
- **CloudFront**: $15.00/month (data transfer)

## Cost Saving Opportunities

> **Potential Savings: $78/month (31.5%)**

### 1. Use Reserved Capacity for DynamoDB

**Current**: On-demand pricing at $25/month
**Optimized**: Reserved capacity at $12/month
**Savings**: $13/month (52% reduction)

Switch to provisioned capacity with auto-scaling for predictable workloads.

### 2. Implement S3 Lifecycle Policies

**Current**: All objects in Standard storage
**Optimized**: Move old templates to Glacier after 90 days
**Savings**: $8/month (35% reduction on storage)

\`\`\`yaml
LifecycleConfiguration:
  Rules:
    - Id: ArchiveOldTemplates
      Status: Enabled
      Transitions:
        - Days: 90
          StorageClass: GLACIER
\`\`\`

### 3. Optimize Lambda Memory Configuration

**Current**: 1024MB memory allocation
**Optimized**: 512MB memory (sufficient for workload)
**Savings**: $22/month (49% reduction)

Profile your Lambda functions to right-size memory allocation.

### 4. Enable CloudWatch Logs Retention

**Current**: Indefinite log retention
**Optimized**: 30-day retention policy
**Savings**: $10/month (67% reduction)

### 5. Use CloudFront Compression

**Current**: Uncompressed content delivery
**Optimized**: Enable automatic compression
**Savings**: $5/month (33% reduction on data transfer)

### 6. Batch Bedrock Requests

**Current**: Individual agent invocations
**Optimized**: Batch similar requests
**Savings**: $20/month (22% reduction)

## Long-Term Optimization Strategies

1. **Implement caching** for frequently accessed data
2. **Use Spot instances** for non-critical batch processing
3. **Consolidate CloudWatch dashboards** to reduce metric costs
4. **Archive old conversation history** to reduce DynamoDB storage
5. **Use AWS Cost Anomaly Detection** to catch unexpected spikes

## Monitoring Recommendations

- Set up **AWS Budgets** with $300/month threshold
- Enable **Cost Allocation Tags** for resource tracking
- Review **Cost Explorer** weekly for trends
- Configure **billing alerts** at 80% and 100% of budget
`;

const CostOptimizationTabExample: React.FC = () => {
  return (
    <div className="h-screen bg-[#0a0e1a]">
      <CostOptimizationTab content={sampleCostContent} />
    </div>
  );
};

export default CostOptimizationTabExample;
