import React from 'react';
import ResponseViewer from './ResponseViewer';
import type { ParsedResponse } from '../types';

/**
 * ResponseViewer Component Examples
 * 
 * Demonstrates the ResponseViewer component with different agent types
 * and response structures.
 */

// Example 1: OnboardingAgent response with multiple tabs
const onboardingResponse: ParsedResponse = {
  raw: `
<cfn>
AWSTemplateFormatVersion: '2010-09-09'
Description: Sample CloudFormation Template

Resources:
  MyBucket:
    Type: AWS::S3::Bucket
    Properties:
      BucketName: my-sample-bucket
</cfn>

## Architecture Overview

This architecture uses a serverless approach with S3 for storage.

### Components
- S3 Bucket for data storage
- Lambda functions for processing
- API Gateway for REST API

## Cost Optimization Tips

**Estimated Monthly Cost: $50-100**

- Use S3 Intelligent-Tiering to reduce storage costs
- Enable S3 lifecycle policies to archive old data
- Consider using Lambda reserved concurrency for predictable workloads

## Quick Summary

This solution provides a scalable, serverless architecture for data processing.
  `,
  sections: [
    {
      type: 'template',
      title: 'CloudFormation Template',
      content: `AWSTemplateFormatVersion: '2010-09-09'
Description: Sample CloudFormation Template

Resources:
  MyBucket:
    Type: AWS::S3::Bucket
    Properties:
      BucketName: my-sample-bucket`,
      metadata: { format: 'yaml' },
    },
    {
      type: 'architecture',
      title: 'Architecture Overview',
      content: `This architecture uses a serverless approach with S3 for storage.

### Components
- S3 Bucket for data storage
- Lambda functions for processing
- API Gateway for REST API`,
    },
    {
      type: 'cost',
      title: 'Cost Optimization Tips',
      content: `**Estimated Monthly Cost: $50-100**

- Use S3 Intelligent-Tiering to reduce storage costs
- Enable S3 lifecycle policies to archive old data
- Consider using Lambda reserved concurrency for predictable workloads`,
    },
    {
      type: 'summary',
      title: 'Quick Summary',
      content: 'This solution provides a scalable, serverless architecture for data processing.',
    },
  ],
  tabs: [
    {
      id: 'architecture',
      label: 'Architecture Overview',
      content: {
        type: 'architecture',
        title: 'Architecture Overview',
        content: `This architecture uses a serverless approach with S3 for storage.

### Components
- S3 Bucket for data storage
- Lambda functions for processing
- API Gateway for REST API`,
      },
    },
    {
      id: 'cost',
      label: 'Cost Optimization Tips',
      content: {
        type: 'cost',
        title: 'Cost Optimization Tips',
        content: `**Estimated Monthly Cost: $50-100**

- Use S3 Intelligent-Tiering to reduce storage costs
- Enable S3 lifecycle policies to archive old data
- Consider using Lambda reserved concurrency for predictable workloads`,
      },
    },
    {
      id: 'template',
      label: 'CloudFormation Template',
      content: {
        type: 'template',
        title: 'CloudFormation Template',
        content: `AWSTemplateFormatVersion: '2010-09-09'
Description: Sample CloudFormation Template

Resources:
  MyBucket:
    Type: AWS::S3::Bucket
    Properties:
      BucketName: my-sample-bucket`,
        metadata: { format: 'yaml' },
      },
    },
    {
      id: 'summary',
      label: 'Quick Summary',
      content: {
        type: 'summary',
        title: 'Quick Summary',
        content: 'This solution provides a scalable, serverless architecture for data processing.',
      },
    },
  ],
};

// Example 2: ProvisioningAgent response with progress
const provisioningResponse: ParsedResponse = {
  raw: `
## Deployment Summary

Stack Status: CREATE_COMPLETE
Duration: 5 minutes 32 seconds

## Provisioned Resources

- S3 Bucket: my-sample-bucket-123456
- Lambda Function: MyProcessingFunction
- API Gateway: MyRestApi

## Summary

Deployment completed successfully. All resources are now available.
  `,
  sections: [
    {
      type: 'progress',
      title: 'Deployment Summary',
      content: `Stack Status: CREATE_COMPLETE
Duration: 5 minutes 32 seconds`,
    },
    {
      type: 'resources',
      title: 'Provisioned Resources',
      content: `- S3 Bucket: my-sample-bucket-123456
- Lambda Function: MyProcessingFunction
- API Gateway: MyRestApi`,
    },
    {
      type: 'summary',
      title: 'Summary',
      content: 'Deployment completed successfully. All resources are now available.',
    },
  ],
  tabs: [
    {
      id: 'progress',
      label: 'Deployment Summary',
      content: {
        type: 'progress',
        title: 'Deployment Summary',
        content: `Stack Status: CREATE_COMPLETE
Duration: 5 minutes 32 seconds`,
      },
    },
    {
      id: 'resources',
      label: 'Provisioned Resources',
      content: {
        type: 'resources',
        title: 'Provisioned Resources',
        content: `- S3 Bucket: my-sample-bucket-123456
- Lambda Function: MyProcessingFunction
- API Gateway: MyRestApi`,
      },
    },
    {
      id: 'summary',
      label: 'Summary',
      content: {
        type: 'summary',
        title: 'Summary',
        content: 'Deployment completed successfully. All resources are now available.',
      },
    },
  ],
};

// Example 3: Empty response
const emptyResponse: ParsedResponse = {
  raw: '',
  sections: [],
  tabs: [],
};

/**
 * Example 1: OnboardingAgent Response
 */
export const OnboardingAgentExample: React.FC = () => {
  const handleTabChange = (tabId: string) => {
    console.log('Tab changed to:', tabId);
  };

  return (
    <div className="h-screen bg-[#0a0e1a]">
      <div className="p-4">
        <h2 className="text-xl font-bold text-[#e4e7eb] mb-4">
          OnboardingAgent Response
        </h2>
      </div>
      <div className="h-[calc(100vh-80px)]">
        <ResponseViewer
          response={onboardingResponse}
          agentType="onboarding"
          onTabChange={handleTabChange}
        />
      </div>
    </div>
  );
};

/**
 * Example 2: ProvisioningAgent Response
 */
export const ProvisioningAgentExample: React.FC = () => {
  return (
    <div className="h-screen bg-[#0a0e1a]">
      <div className="p-4">
        <h2 className="text-xl font-bold text-[#e4e7eb] mb-4">
          ProvisioningAgent Response
        </h2>
      </div>
      <div className="h-[calc(100vh-80px)]">
        <ResponseViewer
          response={provisioningResponse}
          agentType="provisioning"
        />
      </div>
    </div>
  );
};

/**
 * Example 3: Empty Response
 */
export const EmptyResponseExample: React.FC = () => {
  return (
    <div className="h-screen bg-[#0a0e1a]">
      <div className="p-4">
        <h2 className="text-xl font-bold text-[#e4e7eb] mb-4">
          Empty Response
        </h2>
      </div>
      <div className="h-[calc(100vh-80px)]">
        <ResponseViewer
          response={emptyResponse}
          agentType="orchestrator"
        />
      </div>
    </div>
  );
};

/**
 * Example 4: Tab State Preservation
 */
export const TabStatePersistenceExample: React.FC = () => {
  const [response, setResponse] = React.useState(onboardingResponse);
  const [activeTab, setActiveTab] = React.useState<string>('');

  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId);
    console.log('Active tab:', tabId);
  };

  const updateResponse = () => {
    // Simulate updating response while preserving tab state
    setResponse({
      ...onboardingResponse,
      raw: onboardingResponse.raw + '\n\n## Updated Content\n\nThis is new content.',
    });
  };

  return (
    <div className="h-screen bg-[#0a0e1a]">
      <div className="p-4 border-b border-[#2d3548]">
        <h2 className="text-xl font-bold text-[#e4e7eb] mb-4">
          Tab State Persistence
        </h2>
        <div className="flex gap-4">
          <button
            onClick={updateResponse}
            className="px-4 py-2 bg-[#3b82f6] text-white rounded hover:bg-[#2563eb]"
          >
            Update Response
          </button>
          <div className="text-[#9ca3af]">
            Active Tab: <span className="text-[#e4e7eb] font-mono">{activeTab || 'none'}</span>
          </div>
        </div>
      </div>
      <div className="h-[calc(100vh-140px)]">
        <ResponseViewer
          response={response}
          agentType="onboarding"
          onTabChange={handleTabChange}
        />
      </div>
    </div>
  );
};

// Default export for Storybook or testing
export default OnboardingAgentExample;
