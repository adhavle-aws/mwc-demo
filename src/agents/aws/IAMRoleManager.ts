/**
 * IAM Role Manager
 * 
 * Manages AWS IAM roles with least-privilege policies for secure AWS operations
 * Implements role creation, assumption, and permission validation
 */

import * as AWS from 'aws-sdk';

export interface IAMRoleConfig {
  region?: string;
  credentials?: AWS.Credentials;
}

export interface RoleDefinition {
  roleName: string;
  description: string;
  assumeRolePolicyDocument: string;
  permissionsPolicies: PolicyDocument[];
  tags?: Record<string, string>;
}

export interface PolicyDocument {
  policyName: string;
  policyDocument: string;
}

export interface RoleCreationResult {
  roleArn: string;
  roleName: string;
  createdAt: Date;
}

export interface AssumeRoleResult {
  accessKeyId: string;
  secretAccessKey: string;
  sessionToken: string;
  expiration: Date;
}

/**
 * Manager for IAM roles with least-privilege access
 */
export class IAMRoleManager {
  private iam: AWS.IAM;
  private sts: AWS.STS;

  constructor(config: IAMRoleConfig = {}) {
    this.iam = new AWS.IAM({
      region: config.region || 'us-east-1',
      credentials: config.credentials,
    });
    this.sts = new AWS.STS({
      region: config.region || 'us-east-1',
      credentials: config.credentials,
    });
  }

  /**
   * Create an IAM role with least-privilege policies
   */
  async createRole(roleDefinition: RoleDefinition): Promise<RoleCreationResult> {
    try {
      // Create the role
      const createRoleResponse = await this.iam.createRole({
        RoleName: roleDefinition.roleName,
        AssumeRolePolicyDocument: roleDefinition.assumeRolePolicyDocument,
        Description: roleDefinition.description,
        Tags: roleDefinition.tags
          ? Object.entries(roleDefinition.tags).map(([Key, Value]) => ({ Key, Value }))
          : undefined,
      }).promise();

      if (!createRoleResponse.Role) {
        throw new Error('Failed to create role');
      }

      // Attach inline policies
      for (const policy of roleDefinition.permissionsPolicies) {
        await this.iam.putRolePolicy({
          RoleName: roleDefinition.roleName,
          PolicyName: policy.policyName,
          PolicyDocument: policy.policyDocument,
        }).promise();
      }

      return {
        roleArn: createRoleResponse.Role.Arn,
        roleName: createRoleResponse.Role.RoleName,
        createdAt: createRoleResponse.Role.CreateDate || new Date(),
      };
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to create IAM role: ${error.message}`);
      }
      throw error;
    }
  }

  /**
   * Assume an IAM role and get temporary credentials
   */
  async assumeRole(
    roleArn: string,
    sessionName: string,
    durationSeconds: number = 3600
  ): Promise<AssumeRoleResult> {
    try {
      const response = await this.sts.assumeRole({
        RoleArn: roleArn,
        RoleSessionName: sessionName,
        DurationSeconds: durationSeconds,
      }).promise();

      if (!response.Credentials) {
        throw new Error('Failed to assume role: No credentials returned');
      }

      return {
        accessKeyId: response.Credentials.AccessKeyId,
        secretAccessKey: response.Credentials.SecretAccessKey,
        sessionToken: response.Credentials.SessionToken,
        expiration: response.Credentials.Expiration,
      };
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to assume role: ${error.message}`);
      }
      throw error;
    }
  }

  /**
   * Validate that a role has specific permissions
   */
  async validateRolePermissions(
    roleName: string,
    requiredActions: string[]
  ): Promise<{ valid: boolean; missingActions: string[] }> {
    try {
      // Get all inline policies for the role
      const inlinePoliciesResponse = await this.iam.listRolePolicies({
        RoleName: roleName,
      }).promise();

      const inlinePolicyNames = inlinePoliciesResponse.PolicyNames || [];

      // Get all attached managed policies
      const attachedPoliciesResponse = await this.iam.listAttachedRolePolicies({
        RoleName: roleName,
      }).promise();

      const attachedPolicies = attachedPoliciesResponse.AttachedPolicies || [];

      // Collect all policy documents
      const policyDocuments: any[] = [];

      // Get inline policy documents
      for (const policyName of inlinePolicyNames) {
        const policyResponse = await this.iam.getRolePolicy({
          RoleName: roleName,
          PolicyName: policyName,
        }).promise();

        const policyDoc = JSON.parse(
          decodeURIComponent(policyResponse.PolicyDocument || '{}')
        );
        policyDocuments.push(policyDoc);
      }

      // Get managed policy documents
      for (const policy of attachedPolicies) {
        if (!policy.PolicyArn) continue;

        const policyResponse = await this.iam.getPolicy({
          PolicyArn: policy.PolicyArn,
        }).promise();

        if (!policyResponse.Policy?.DefaultVersionId) continue;

        const versionResponse = await this.iam.getPolicyVersion({
          PolicyArn: policy.PolicyArn,
          VersionId: policyResponse.Policy.DefaultVersionId,
        }).promise();

        if (versionResponse.PolicyVersion?.Document) {
          const policyDoc = JSON.parse(
            decodeURIComponent(versionResponse.PolicyVersion.Document)
          );
          policyDocuments.push(policyDoc);
        }
      }

      // Check if all required actions are present
      const grantedActions = new Set<string>();

      for (const policyDoc of policyDocuments) {
        if (!policyDoc.Statement) continue;

        for (const statement of policyDoc.Statement) {
          if (statement.Effect !== 'Allow') continue;

          const actions = Array.isArray(statement.Action)
            ? statement.Action
            : [statement.Action];

          for (const action of actions) {
            grantedActions.add(action);
          }
        }
      }

      // Check for missing actions
      const missingActions = requiredActions.filter(
        (action) => !grantedActions.has(action) && !grantedActions.has('*')
      );

      return {
        valid: missingActions.length === 0,
        missingActions,
      };
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to validate role permissions: ${error.message}`);
      }
      throw error;
    }
  }

  /**
   * Get least-privilege role definition for onboarding operations
   */
  static getOnboardingRoleDefinition(): RoleDefinition {
    return {
      roleName: 'OnboardingAgentRole',
      description: 'Least-privilege role for onboarding agent operations',
      assumeRolePolicyDocument: JSON.stringify({
        Version: '2012-10-17',
        Statement: [
          {
            Effect: 'Allow',
            Principal: {
              Service: 'lambda.amazonaws.com',
            },
            Action: 'sts:AssumeRole',
          },
        ],
      }),
      permissionsPolicies: [
        {
          policyName: 'OnboardingOrganizationsPolicy',
          policyDocument: JSON.stringify({
            Version: '2012-10-17',
            Statement: [
              {
                Effect: 'Allow',
                Action: [
                  'organizations:CreateOrganization',
                  'organizations:CreateOrganizationalUnit',
                  'organizations:CreateAccount',
                  'organizations:DescribeOrganization',
                  'organizations:ListRoots',
                  'organizations:CreatePolicy',
                  'organizations:AttachPolicy',
                  'organizations:ListPoliciesForTarget',
                ],
                Resource: '*',
              },
            ],
          }),
        },
        {
          policyName: 'OnboardingS3Policy',
          policyDocument: JSON.stringify({
            Version: '2012-10-17',
            Statement: [
              {
                Effect: 'Allow',
                Action: [
                  's3:PutObject',
                  's3:GetObject',
                  's3:ListBucket',
                ],
                Resource: [
                  'arn:aws:s3:::cfn-packages-*',
                  'arn:aws:s3:::cfn-packages-*/*',
                ],
              },
            ],
          }),
        },
      ],
      tags: {
        Purpose: 'OnboardingAgent',
        ManagedBy: 'AgentSystem',
      },
    };
  }

  /**
   * Get least-privilege role definition for provisioning operations
   */
  static getProvisioningRoleDefinition(): RoleDefinition {
    return {
      roleName: 'ProvisioningAgentRole',
      description: 'Least-privilege role for provisioning agent operations',
      assumeRolePolicyDocument: JSON.stringify({
        Version: '2012-10-17',
        Statement: [
          {
            Effect: 'Allow',
            Principal: {
              Service: 'lambda.amazonaws.com',
            },
            Action: 'sts:AssumeRole',
          },
        ],
      }),
      permissionsPolicies: [
        {
          policyName: 'ProvisioningCloudFormationPolicy',
          policyDocument: JSON.stringify({
            Version: '2012-10-17',
            Statement: [
              {
                Effect: 'Allow',
                Action: [
                  'cloudformation:CreateStack',
                  'cloudformation:DescribeStacks',
                  'cloudformation:DescribeStackEvents',
                  'cloudformation:DescribeStackResources',
                  'cloudformation:GetTemplate',
                  'cloudformation:UpdateStack',
                  'cloudformation:DeleteStack',
                ],
                Resource: 'arn:aws:cloudformation:*:*:stack/*',
              },
            ],
          }),
        },
        {
          policyName: 'ProvisioningS3Policy',
          policyDocument: JSON.stringify({
            Version: '2012-10-17',
            Statement: [
              {
                Effect: 'Allow',
                Action: [
                  's3:GetObject',
                  's3:ListBucket',
                ],
                Resource: [
                  'arn:aws:s3:::cfn-packages-*',
                  'arn:aws:s3:::cfn-packages-*/*',
                ],
              },
            ],
          }),
        },
      ],
      tags: {
        Purpose: 'ProvisioningAgent',
        ManagedBy: 'AgentSystem',
      },
    };
  }

  /**
   * Delete an IAM role and all its policies
   */
  async deleteRole(roleName: string): Promise<void> {
    try {
      // Delete all inline policies
      const inlinePoliciesResponse = await this.iam.listRolePolicies({
        RoleName: roleName,
      }).promise();

      for (const policyName of inlinePoliciesResponse.PolicyNames || []) {
        await this.iam.deleteRolePolicy({
          RoleName: roleName,
          PolicyName: policyName,
        }).promise();
      }

      // Detach all managed policies
      const attachedPoliciesResponse = await this.iam.listAttachedRolePolicies({
        RoleName: roleName,
      }).promise();

      for (const policy of attachedPoliciesResponse.AttachedPolicies || []) {
        if (policy.PolicyArn) {
          await this.iam.detachRolePolicy({
            RoleName: roleName,
            PolicyArn: policy.PolicyArn,
          }).promise();
        }
      }

      // Delete the role
      await this.iam.deleteRole({
        RoleName: roleName,
      }).promise();
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to delete IAM role: ${error.message}`);
      }
      throw error;
    }
  }

  /**
   * List all roles with a specific tag
   */
  async listRolesByTag(tagKey: string, tagValue: string): Promise<string[]> {
    try {
      const rolesResponse = await this.iam.listRoles().promise();
      const matchingRoles: string[] = [];

      for (const role of rolesResponse.Roles || []) {
        const tagsResponse = await this.iam.listRoleTags({
          RoleName: role.RoleName,
        }).promise();

        const hasMatchingTag = (tagsResponse.Tags || []).some(
          (tag) => tag.Key === tagKey && tag.Value === tagValue
        );

        if (hasMatchingTag) {
          matchingRoles.push(role.RoleName);
        }
      }

      return matchingRoles;
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to list roles by tag: ${error.message}`);
      }
      throw error;
    }
  }
}
