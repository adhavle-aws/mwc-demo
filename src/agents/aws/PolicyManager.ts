/**
 * AWS Policy Manager
 * 
 * Manages AWS organizational policies including SCPs (Service Control Policies)
 * and best practice policy templates
 */

import * as AWS from 'aws-sdk';
import { Policy, PolicySet, PolicyResult } from '../../shared/types/models';

export interface PolicyManagerConfig {
  region?: string;
  credentials?: AWS.Credentials;
}

/**
 * Manager for AWS organizational policies
 */
export class PolicyManager {
  private organizations: AWS.Organizations;

  constructor(config: PolicyManagerConfig = {}) {
    this.organizations = new AWS.Organizations({
      region: config.region || 'us-east-1',
      credentials: config.credentials,
    });
  }

  /**
   * Apply policies to an organization
   */
  async applyPolicies(organizationId: string, policies: PolicySet): Promise<PolicyResult> {
    const appliedPolicies: string[] = [];
    const failedPolicies: string[] = [];

    for (const policy of policies.policies) {
      try {
        // Create the policy
        const policyId = await this.createPolicy(policy);
        
        // Attach policy to the organization root
        await this.attachPolicyToRoot(policyId, organizationId);
        
        appliedPolicies.push(policy.policyId);
      } catch (error) {
        failedPolicies.push(policy.policyId);
      }
    }

    return {
      appliedPolicies,
      failedPolicies,
      timestamp: new Date(),
    };
  }

  /**
   * Create a policy
   */
  private async createPolicy(policy: Policy): Promise<string> {
    try {
      const response = await this.organizations.createPolicy({
        Content: policy.policyDocument,
        Description: `Policy: ${policy.policyName}`,
        Name: policy.policyName,
        Type: policy.policyType as AWS.Organizations.PolicyType,
      }).promise();

      if (!response.Policy || !response.Policy.PolicySummary) {
        throw new Error('Failed to create policy');
      }

      return response.Policy.PolicySummary.Id!;
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to create policy ${policy.policyName}: ${error.message}`);
      }
      throw error;
    }
  }

  /**
   * Attach policy to organization root
   */
  private async attachPolicyToRoot(policyId: string, organizationId: string): Promise<void> {
    try {
      // Get the root ID
      const rootsResponse = await this.organizations.listRoots().promise();
      const root = rootsResponse.Roots?.[0];

      if (!root || !root.Id) {
        throw new Error('Failed to get organization root');
      }

      // Attach policy to root
      await this.organizations.attachPolicy({
        PolicyId: policyId,
        TargetId: root.Id,
      }).promise();
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to attach policy: ${error.message}`);
      }
      throw error;
    }
  }

  /**
   * Get AWS best practice policy templates
   */
  static getBestPracticePolicies(): PolicySet {
    return {
      policies: [
        {
          policyId: 'deny-root-account',
          policyName: 'DenyRootAccountUsage',
          policyType: 'SERVICE_CONTROL_POLICY',
          policyDocument: JSON.stringify({
            Version: '2012-10-17',
            Statement: [
              {
                Effect: 'Deny',
                Action: '*',
                Resource: '*',
                Condition: {
                  StringLike: {
                    'aws:PrincipalArn': 'arn:aws:iam::*:root',
                  },
                },
              },
            ],
          }),
        },
        {
          policyId: 'require-mfa',
          policyName: 'RequireMFA',
          policyType: 'SERVICE_CONTROL_POLICY',
          policyDocument: JSON.stringify({
            Version: '2012-10-17',
            Statement: [
              {
                Effect: 'Deny',
                Action: '*',
                Resource: '*',
                Condition: {
                  BoolIfExists: {
                    'aws:MultiFactorAuthPresent': 'false',
                  },
                },
              },
            ],
          }),
        },
        {
          policyId: 'deny-region-restriction',
          policyName: 'DenyNonApprovedRegions',
          policyType: 'SERVICE_CONTROL_POLICY',
          policyDocument: JSON.stringify({
            Version: '2012-10-17',
            Statement: [
              {
                Effect: 'Deny',
                Action: '*',
                Resource: '*',
                Condition: {
                  StringNotEquals: {
                    'aws:RequestedRegion': [
                      'us-east-1',
                      'us-west-2',
                      'eu-west-1',
                    ],
                  },
                },
              },
            ],
          }),
        },
        {
          policyId: 'require-encryption',
          policyName: 'RequireEncryption',
          policyType: 'SERVICE_CONTROL_POLICY',
          policyDocument: JSON.stringify({
            Version: '2012-10-17',
            Statement: [
              {
                Effect: 'Deny',
                Action: [
                  's3:PutObject',
                ],
                Resource: '*',
                Condition: {
                  StringNotEquals: {
                    's3:x-amz-server-side-encryption': 'AES256',
                  },
                },
              },
            ],
          }),
        },
      ],
    };
  }

  /**
   * List policies attached to a target
   */
  async listPoliciesForTarget(targetId: string): Promise<Policy[]> {
    try {
      const response = await this.organizations.listPoliciesForTarget({
        TargetId: targetId,
        Filter: 'SERVICE_CONTROL_POLICY',
      }).promise();

      return (response.Policies || []).map(p => ({
        policyId: p.Id!,
        policyName: p.Name!,
        policyType: p.Type!,
        policyDocument: '', // Would need separate call to get full document
      }));
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to list policies: ${error.message}`);
      }
      throw error;
    }
  }

  /**
   * Detach policy from target
   */
  async detachPolicy(policyId: string, targetId: string): Promise<void> {
    try {
      await this.organizations.detachPolicy({
        PolicyId: policyId,
        TargetId: targetId,
      }).promise();
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to detach policy: ${error.message}`);
      }
      throw error;
    }
  }
}

