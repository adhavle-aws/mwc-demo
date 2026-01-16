/**
 * CloudFormation Package Builder
 * 
 * Generates CloudFormation templates from customer requirements
 * Assembles templates into packages with parameters
 */

import { v4 as uuidv4 } from 'uuid';
import {
  CustomerRequirements,
  CFNPackage,
  CloudFormationTemplate,
  ParameterDefinition,
  OutputDefinition,
  InfrastructureSpec,
} from '../../shared/types/models';

/**
 * Builder for CloudFormation packages
 */
export class PackageBuilder {
  /**
   * Create CloudFormation package from customer requirements
   */
  async createPackage(requirements: CustomerRequirements): Promise<CFNPackage> {
    const packageId = uuidv4();
    const templates: CloudFormationTemplate[] = [];

    // Generate VPC template
    const vpcTemplate = this.generateVPCTemplate(requirements.infrastructure);
    templates.push(vpcTemplate);

    // Generate security groups template
    const securityTemplate = this.generateSecurityTemplate(requirements.infrastructure);
    templates.push(securityTemplate);

    // Generate service-specific templates
    for (const service of requirements.infrastructure.services) {
      const serviceTemplate = this.generateServiceTemplate(service, requirements.infrastructure);
      templates.push(serviceTemplate);
    }

    // Extract parameters from all templates
    const parameters = this.extractParameters(templates);

    // Identify dependencies between templates
    const dependencies = this.identifyDependencies(templates);

    return {
      packageId,
      version: '1.0.0', // Initial version
      templates,
      parameters,
      dependencies,
    };
  }

  /**
   * Generate VPC CloudFormation template
   */
  private generateVPCTemplate(infrastructure: InfrastructureSpec): CloudFormationTemplate {
    const templateId = uuidv4();
    const networking = infrastructure.networking;

    const template: any = {
      AWSTemplateFormatVersion: '2010-09-09',
      Description: 'VPC and networking infrastructure',
      Parameters: {
        VpcCidr: {
          Type: 'String',
          Default: networking.vpcCidr,
          Description: 'CIDR block for VPC',
        },
      },
      Resources: {
        VPC: {
          Type: 'AWS::EC2::VPC',
          Properties: {
            CidrBlock: { Ref: 'VpcCidr' },
            EnableDnsHostnames: true,
            EnableDnsSupport: true,
            Tags: [
              { Key: 'Name', Value: 'CustomerVPC' },
            ],
          },
        },
      },
      Outputs: {
        VpcId: {
          Description: 'VPC ID',
          Value: { Ref: 'VPC' },
          Export: { Name: 'VpcId' },
        },
      },
    };

    // Add subnets
    networking.subnetConfiguration.forEach((subnet, index) => {
      const subnetName = `Subnet${index}`;
      template.Resources[subnetName] = {
        Type: 'AWS::EC2::Subnet',
        Properties: {
          VpcId: { Ref: 'VPC' },
          CidrBlock: subnet.cidr,
          AvailabilityZone: subnet.availabilityZone,
          MapPublicIpOnLaunch: subnet.type === 'public',
          Tags: [
            { Key: 'Name', Value: subnet.name },
            { Key: 'Type', Value: subnet.type },
          ],
        },
      };
    });

    // Add Internet Gateway if needed
    if (networking.internetGateway) {
      template.Resources['InternetGateway'] = {
        Type: 'AWS::EC2::InternetGateway',
        Properties: {
          Tags: [{ Key: 'Name', Value: 'CustomerIGW' }],
        },
      };

      template.Resources['AttachGateway'] = {
        Type: 'AWS::EC2::VPCGatewayAttachment',
        Properties: {
          VpcId: { Ref: 'VPC' },
          InternetGatewayId: { Ref: 'InternetGateway' },
        },
      };
    }

    return {
      templateId,
      name: 'vpc-template',
      description: 'VPC and networking infrastructure',
      template: JSON.stringify(template, null, 2),
      parameters: [
        {
          name: 'VpcCidr',
          type: 'String',
          description: 'CIDR block for VPC',
          defaultValue: networking.vpcCidr,
        },
      ],
      outputs: [
        {
          name: 'VpcId',
          description: 'VPC ID',
          value: '{ "Ref": "VPC" }',
          exportName: 'VpcId',
        },
      ],
      dependencies: [],
    };
  }

  /**
   * Generate security groups template
   */
  private generateSecurityTemplate(infrastructure: InfrastructureSpec): CloudFormationTemplate {
    const templateId = uuidv4();
    const security = infrastructure.security;

    const template: any = {
      AWSTemplateFormatVersion: '2010-09-09',
      Description: 'Security groups and IAM policies',
      Resources: {},
      Outputs: {},
    };

    // Add security groups
    security.securityGroups.forEach((sg, index) => {
      const sgName = `SecurityGroup${index}`;
      template.Resources[sgName] = {
        Type: 'AWS::EC2::SecurityGroup',
        Properties: {
          GroupDescription: sg.description,
          VpcId: { 'Fn::ImportValue': 'VpcId' },
          SecurityGroupIngress: sg.ingressRules.map(rule => ({
            IpProtocol: rule.protocol,
            FromPort: rule.fromPort,
            ToPort: rule.toPort,
            CidrIp: rule.source,
          })),
          SecurityGroupEgress: sg.egressRules.map(rule => ({
            IpProtocol: rule.protocol,
            FromPort: rule.fromPort,
            ToPort: rule.toPort,
            CidrIp: rule.source,
          })),
          Tags: [{ Key: 'Name', Value: sg.name }],
        },
      };

      template.Outputs[`${sgName}Id`] = {
        Description: `${sg.name} Security Group ID`,
        Value: { Ref: sgName },
        Export: { Name: `${sgName}Id` },
      };
    });

    return {
      templateId,
      name: 'security-template',
      description: 'Security groups and IAM policies',
      template: JSON.stringify(template, null, 2),
      parameters: [],
      outputs: security.securityGroups.map((sg, index) => ({
        name: `SecurityGroup${index}Id`,
        description: `${sg.name} Security Group ID`,
        value: `{ "Ref": "SecurityGroup${index}" }`,
        exportName: `SecurityGroup${index}Id`,
      })),
      dependencies: ['vpc-template'],
    };
  }

  /**
   * Generate service-specific template
   */
  private generateServiceTemplate(
    service: any,
    infrastructure: InfrastructureSpec
  ): CloudFormationTemplate {
    const templateId = uuidv4();

    const template = {
      AWSTemplateFormatVersion: '2010-09-09',
      Description: `${service.serviceName} infrastructure`,
      Resources: {
        ServiceResource: {
          Type: this.getAWSResourceType(service.serviceName),
          Properties: service.configuration,
        },
      },
      Outputs: {
        ServiceResourceId: {
          Description: `${service.serviceName} Resource ID`,
          Value: { Ref: 'ServiceResource' },
        },
      },
    };

    return {
      templateId,
      name: `${service.serviceName.toLowerCase()}-template`,
      description: `${service.serviceName} infrastructure`,
      template: JSON.stringify(template, null, 2),
      parameters: [],
      outputs: [
        {
          name: 'ServiceResourceId',
          description: `${service.serviceName} Resource ID`,
          value: '{ "Ref": "ServiceResource" }',
        },
      ],
      dependencies: service.dependencies || [],
    };
  }

  /**
   * Get AWS resource type for service name
   */
  private getAWSResourceType(serviceName: string): string {
    const typeMap: Record<string, string> = {
      'EC2': 'AWS::EC2::Instance',
      'RDS': 'AWS::RDS::DBInstance',
      'S3': 'AWS::S3::Bucket',
      'Lambda': 'AWS::Lambda::Function',
      'DynamoDB': 'AWS::DynamoDB::Table',
      'ECS': 'AWS::ECS::Service',
      'EKS': 'AWS::EKS::Cluster',
    };

    return typeMap[serviceName] || 'AWS::CloudFormation::CustomResource';
  }

  /**
   * Extract parameters from templates
   */
  private extractParameters(templates: CloudFormationTemplate[]): Record<string, any> {
    const parameters: Record<string, any> = {};

    for (const template of templates) {
      for (const param of template.parameters) {
        parameters[param.name] = param.defaultValue;
      }
    }

    return parameters;
  }

  /**
   * Identify dependencies between templates
   */
  private identifyDependencies(templates: CloudFormationTemplate[]): string[] {
    const allDependencies = new Set<string>();

    for (const template of templates) {
      for (const dep of template.dependencies) {
        allDependencies.add(dep);
      }
    }

    return Array.from(allDependencies);
  }
}

