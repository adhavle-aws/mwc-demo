/**
 * AWS Organizations Client
 * 
 * Handles AWS Organizations API operations for creating and managing
 * organizational units and member accounts
 */

import * as AWS from 'aws-sdk';
import { v4 as uuidv4 } from 'uuid';
import {
  OrganizationConfig,
  OrganizationResult,
  OrganizationalUnit,
} from '../../shared/types/models';

export interface OrganizationsClientConfig {
  region?: string;
  credentials?: AWS.Credentials;
}

/**
 * Client for AWS Organizations operations
 */
export class OrganizationsClient {
  private organizations: AWS.Organizations;

  constructor(config: OrganizationsClientConfig = {}) {
    this.organizations = new AWS.Organizations({
      region: config.region || 'us-east-1',
      credentials: config.credentials,
    });
  }

  /**
   * Create AWS organization with organizational units
   */
  async createOrganization(config: OrganizationConfig): Promise<OrganizationResult> {
    try {
      // Create the organization
      const createOrgResponse = await this.organizations.createOrganization({
        FeatureSet: 'ALL', // Enable all features
      }).promise();

      if (!createOrgResponse.Organization) {
        throw new Error('Failed to create organization');
      }

      const organizationId = createOrgResponse.Organization.Id!;
      const rootId = createOrgResponse.Organization.MasterAccountId!;

      // Get the root organizational unit
      const rootsResponse = await this.organizations.listRoots().promise();
      const root = rootsResponse.Roots?.[0];

      if (!root || !root.Id) {
        throw new Error('Failed to get organization root');
      }

      // Create organizational units
      const organizationalUnits: OrganizationalUnit[] = [];

      for (const ouName of config.organizationalUnits) {
        const ouResponse = await this.organizations.createOrganizationalUnit({
          ParentId: root.Id,
          Name: ouName,
        }).promise();

        if (ouResponse.OrganizationalUnit) {
          organizationalUnits.push({
            id: ouResponse.OrganizationalUnit.Id!,
            name: ouResponse.OrganizationalUnit.Name!,
            parentId: root.Id,
          });
        }
      }

      return {
        organizationId,
        organizationalUnits,
        status: 'CREATED',
        createdAt: new Date(),
      };
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to create organization: ${error.message}`);
      }
      throw error;
    }
  }

  /**
   * Create a member account in the organization
   */
  async createMemberAccount(
    email: string,
    accountName: string,
    roleName: string = 'OrganizationAccountAccessRole'
  ): Promise<string> {
    try {
      const response = await this.organizations.createAccount({
        Email: email,
        AccountName: accountName,
        RoleName: roleName,
      }).promise();

      if (!response.CreateAccountStatus || !response.CreateAccountStatus.Id) {
        throw new Error('Failed to initiate account creation');
      }

      // Return the request ID for status tracking
      return response.CreateAccountStatus.Id;
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to create member account: ${error.message}`);
      }
      throw error;
    }
  }

  /**
   * Get account creation status
   */
  async getAccountCreationStatus(requestId: string): Promise<{
    state: string;
    accountId?: string;
    failureReason?: string;
  }> {
    try {
      const response = await this.organizations.describeCreateAccountStatus({
        CreateAccountRequestId: requestId,
      }).promise();

      if (!response.CreateAccountStatus) {
        throw new Error('Failed to get account creation status');
      }

      return {
        state: response.CreateAccountStatus.State!,
        accountId: response.CreateAccountStatus.AccountId,
        failureReason: response.CreateAccountStatus.FailureReason,
      };
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to get account creation status: ${error.message}`);
      }
      throw error;
    }
  }

  /**
   * Move account to organizational unit
   */
  async moveAccountToOU(accountId: string, sourceParentId: string, destinationParentId: string): Promise<void> {
    try {
      await this.organizations.moveAccount({
        AccountId: accountId,
        SourceParentId: sourceParentId,
        DestinationParentId: destinationParentId,
      }).promise();
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to move account to OU: ${error.message}`);
      }
      throw error;
    }
  }

  /**
   * List organizational units
   */
  async listOrganizationalUnits(parentId: string): Promise<OrganizationalUnit[]> {
    try {
      const response = await this.organizations.listOrganizationalUnitsForParent({
        ParentId: parentId,
      }).promise();

      return (response.OrganizationalUnits || []).map(ou => ({
        id: ou.Id!,
        name: ou.Name!,
        parentId,
      }));
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to list organizational units: ${error.message}`);
      }
      throw error;
    }
  }

  /**
   * Describe organization
   */
  async describeOrganization(): Promise<AWS.Organizations.Organization | undefined> {
    try {
      const response = await this.organizations.describeOrganization().promise();
      return response.Organization;
    } catch (error) {
      // Organization might not exist yet
      return undefined;
    }
  }
}

