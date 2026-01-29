import React from 'react';
import TemplateTab from './TemplateTab';

/**
 * Example usage of TemplateTab component
 */

// Example YAML CloudFormation template
const yamlTemplate = `AWSTemplateFormatVersion: '2010-09-09'
Description: Example CloudFormation template for demonstration

Parameters:
  EnvironmentName:
    Type: String
    Default: dev
    Description: Environment name for resource naming

Resources:
  MyS3Bucket:
    Type: AWS::S3::Bucket
    Properties:
      BucketName: !Sub '\${EnvironmentName}-example-bucket'
      VersioningConfiguration:
        Status: Enabled
      PublicAccessBlockConfiguration:
        BlockPublicAcls: true
        BlockPublicPolicy: true
        IgnorePublicAcls: true
        RestrictPublicBuckets: true
      Tags:
        - Key: Environment
          Value: !Ref EnvironmentName
        - Key: ManagedBy
          Value: CloudFormation

  MyLambdaFunction:
    Type: AWS::Lambda::Function
    Properties:
      FunctionName: !Sub '\${EnvironmentName}-example-function'
      Runtime: python3.11
      Handler: index.handler
      Role: !GetAtt LambdaExecutionRole.Arn
      Code:
        ZipFile: |
          def handler(event, context):
              return {
                  'statusCode': 200,
                  'body': 'Hello from Lambda!'
              }

  LambdaExecutionRole:
    Type: AWS::IAM::Role
    Properties:
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              Service: lambda.amazonaws.com
            Action: sts:AssumeRole
      ManagedPolicyArns:
        - arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole

Outputs:
  BucketName:
    Description: Name of the S3 bucket
    Value: !Ref MyS3Bucket
    Export:
      Name: !Sub '\${AWS::StackName}-BucketName'

  FunctionArn:
    Description: ARN of the Lambda function
    Value: !GetAtt MyLambdaFunction.Arn
    Export:
      Name: !Sub '\${AWS::StackName}-FunctionArn'`;

// Example JSON CloudFormation template
const jsonTemplate = `{
  "AWSTemplateFormatVersion": "2010-09-09",
  "Description": "Example CloudFormation template in JSON format",
  "Parameters": {
    "EnvironmentName": {
      "Type": "String",
      "Default": "dev",
      "Description": "Environment name for resource naming"
    }
  },
  "Resources": {
    "MyDynamoDBTable": {
      "Type": "AWS::DynamoDB::Table",
      "Properties": {
        "TableName": {
          "Fn::Sub": "\${EnvironmentName}-example-table"
        },
        "AttributeDefinitions": [
          {
            "AttributeName": "id",
            "AttributeType": "S"
          }
        ],
        "KeySchema": [
          {
            "AttributeName": "id",
            "KeyType": "HASH"
          }
        ],
        "BillingMode": "PAY_PER_REQUEST",
        "Tags": [
          {
            "Key": "Environment",
            "Value": {
              "Ref": "EnvironmentName"
            }
          }
        ]
      }
    }
  },
  "Outputs": {
    "TableName": {
      "Description": "Name of the DynamoDB table",
      "Value": {
        "Ref": "MyDynamoDBTable"
      }
    }
  }
}`;

const TemplateTabExample: React.FC = () => {
  const [activeFormat, setActiveFormat] = React.useState<'yaml' | 'json'>('yaml');

  return (
    <div className="min-h-screen bg-[#0a0e1a] p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-[#e4e7eb] mb-2">
          TemplateTab Component
        </h1>
        <p className="text-[#9ca3af] mb-8">
          Displays CloudFormation templates with syntax highlighting, line numbers,
          and copy/download functionality.
        </p>

        {/* Format selector */}
        <div className="mb-4 flex gap-2">
          <button
            onClick={() => setActiveFormat('yaml')}
            className={`
              px-4 py-2 rounded text-sm font-medium transition-colors
              ${
                activeFormat === 'yaml'
                  ? 'bg-[#3b82f6] text-white'
                  : 'bg-[#151b2d] text-[#9ca3af] hover:bg-[#1e2638]'
              }
            `}
          >
            YAML Template
          </button>
          <button
            onClick={() => setActiveFormat('json')}
            className={`
              px-4 py-2 rounded text-sm font-medium transition-colors
              ${
                activeFormat === 'json'
                  ? 'bg-[#3b82f6] text-white'
                  : 'bg-[#151b2d] text-[#9ca3af] hover:bg-[#1e2638]'
              }
            `}
          >
            JSON Template
          </button>
        </div>

        {/* Template display */}
        <div className="border border-[#2d3548] rounded-lg overflow-hidden h-[600px]">
          <TemplateTab
            template={activeFormat === 'yaml' ? yamlTemplate : jsonTemplate}
            format={activeFormat}
          />
        </div>

        {/* Feature list */}
        <div className="mt-8 p-6 bg-[#151b2d] rounded-lg border border-[#2d3548]">
          <h2 className="text-xl font-semibold text-[#e4e7eb] mb-4">Features</h2>
          <ul className="space-y-2 text-[#9ca3af]">
            <li className="flex items-start gap-2">
              <span className="text-[#10b981] mt-1">✓</span>
              <span>Syntax highlighting for YAML and JSON using Prism.js</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-[#10b981] mt-1">✓</span>
              <span>Automatic format detection from content</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-[#10b981] mt-1">✓</span>
              <span>Line numbers for easy reference</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-[#10b981] mt-1">✓</span>
              <span>Copy to clipboard with visual confirmation</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-[#10b981] mt-1">✓</span>
              <span>Download as file with appropriate extension</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-[#10b981] mt-1">✓</span>
              <span>Scrollable content for long templates</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-[#10b981] mt-1">✓</span>
              <span>Preserves formatting and indentation</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default TemplateTabExample;
