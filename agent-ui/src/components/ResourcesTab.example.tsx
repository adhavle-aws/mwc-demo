import React from 'react';
import ResourcesTab, { type Resource } from './ResourcesTab';

/**
 * Example usage of ResourcesTab component
 */

const sampleResources: Resource[] = [
  {
    logicalId: 'OnboardingAgentFunction',
    physicalId: 'mwc-onboarding-agent-lambda-abc123',
    type: 'AWS::Lambda::Function',
    status: 'CREATE_COMPLETE',
    timestamp: new Date('2024-01-15T10:30:00Z'),
    properties: {
      Runtime: 'python3.11',
      MemorySize: 512,
      Timeout: 300,
      Handler: 'main.lambda_handler',
    },
  },
  {
    logicalId: 'ProvisioningAgentFunction',
    physicalId: 'mwc-provisioning-agent-lambda-def456',
    type: 'AWS::Lambda::Function',
    status: 'CREATE_COMPLETE',
    timestamp: new Date('2024-01-15T10:32:00Z'),
    properties: {
      Runtime: 'python3.11',
      MemorySize: 1024,
      Timeout: 900,
      Handler: 'main.lambda_handler',
    },
  },
  {
    logicalId: 'AgentAPIGateway',
    physicalId: 'https://abc123.execute-api.us-east-1.amazonaws.com',
    type: 'AWS::ApiGateway::RestApi',
    status: 'CREATE_COMPLETE',
    timestamp: new Date('2024-01-15T10:28:00Z'),
    properties: {
      Name: 'MWC-Agent-API',
      EndpointType: 'REGIONAL',
    },
  },
  {
    logicalId: 'ConversationHistoryTable',
    physicalId: 'mwc-conversation-history-ghi789',
    type: 'AWS::DynamoDB::Table',
    status: 'CREATE_COMPLETE',
    timestamp: new Date('2024-01-15T10:25:00Z'),
    properties: {
      BillingMode: 'PAY_PER_REQUEST',
      PointInTimeRecoveryEnabled: true,
    },
  },
  {
    logicalId: 'TemplateStorageBucket',
    physicalId: 'mwc-templates-jkl012',
    type: 'AWS::S3::Bucket',
    status: 'CREATE_COMPLETE',
    timestamp: new Date('2024-01-15T10:22:00Z'),
    properties: {
      Versioning: 'Enabled',
      Encryption: 'AES256',
    },
  },
  {
    logicalId: 'AgentExecutionRole',
    physicalId: 'arn:aws:iam::123456789012:role/MWCAgentExecutionRole',
    type: 'AWS::IAM::Role',
    status: 'CREATE_COMPLETE',
    timestamp: new Date('2024-01-15T10:20:00Z'),
    properties: {
      ManagedPolicyArns: [
        'arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole',
      ],
    },
  },
  {
    logicalId: 'WebSocketAPI',
    physicalId: 'wss://xyz789.execute-api.us-east-1.amazonaws.com',
    type: 'AWS::ApiGatewayV2::Api',
    status: 'CREATE_IN_PROGRESS',
    timestamp: new Date('2024-01-15T10:35:00Z'),
  },
  {
    logicalId: 'MonitoringDashboard',
    physicalId: 'MWC-Agent-Dashboard',
    type: 'AWS::CloudWatch::Dashboard',
    status: 'CREATE_COMPLETE',
    timestamp: new Date('2024-01-15T10:33:00Z'),
  },
];

const ResourcesTabExample: React.FC = () => {
  return (
    <div className="h-screen bg-[#0a0e1a]">
      <ResourcesTab resources={sampleResources} />
    </div>
  );
};

export default ResourcesTabExample;
