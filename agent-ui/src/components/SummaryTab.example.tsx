import React from 'react';
import SummaryTab from './SummaryTab';

/**
 * Example usage of SummaryTab component
 */

const sampleSummaryContent = `# Quick Summary

## What Was Created

I've designed a **serverless multi-agent infrastructure provisioning system** that enables users to interact with AI agents for architecture design, cost optimization, and automated deployment.

## Key Features

1. **Three Specialized Agents**
   - OnboardingAgent for architecture recommendations
   - ProvisioningAgent for infrastructure deployment
   - MWCAgent for orchestration and coordination

2. **Modern Web Interface**
   - Chat-based interaction with agents
   - Tabbed response organization
   - Real-time deployment progress tracking
   - Syntax-highlighted CloudFormation templates

3. **Automated Deployment**
   - One-click infrastructure provisioning
   - Real-time progress monitoring
   - Automatic rollback on failures

## Architecture Highlights

The system uses a **serverless architecture** with these components:

- **Frontend**: React + TypeScript hosted on AWS Amplify
- **API Layer**: API Gateway + Lambda for agent communication
- **Agent Runtime**: AWS Bedrock AgentCore
- **Infrastructure**: CloudFormation for IaC deployment

## Cost Estimate

**Monthly Operating Cost**: ~$247.50

This includes:
- Lambda invocations
- API Gateway requests
- Bedrock agent usage
- Storage and data transfer

> **Cost Optimization Tip**: Implement the recommended optimizations to reduce costs by 31.5% ($78/month savings)

## Next Steps

1. **Review the CloudFormation template** in the Template tab
2. **Check the architecture diagram** in the Architecture tab
3. **Review cost optimization tips** in the Cost Optimization tab
4. **Deploy the infrastructure** using the ProvisioningAgent

## Security Considerations

- All resources use **least privilege IAM roles**
- Data encrypted at rest with **AWS KMS**
- Network isolation via **VPC**
- **WAF** protection for public endpoints

## Deployment Time

Expected deployment time: **8-12 minutes**

The CloudFormation stack will create approximately 15-20 resources including Lambda functions, API Gateway, DynamoDB tables, and IAM roles.

## Support and Documentation

- Full documentation available in the Architecture tab
- Cost breakdown in the Cost Optimization tab
- Template ready for deployment in the Template tab

---

**Ready to deploy?** Use the ProvisioningAgent to create this infrastructure in your AWS account.
`;

const SummaryTabExample: React.FC = () => {
  return (
    <div className="h-screen bg-[#0a0e1a]">
      <SummaryTab content={sampleSummaryContent} />
    </div>
  );
};

export default SummaryTabExample;
