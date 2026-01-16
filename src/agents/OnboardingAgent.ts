/**
 * Onboarding Agent
 * 
 * Manages AWS organizational setup and CloudFormation package creation
 * Integrates with agentcore runtime for message handling and lifecycle management
 */

import { v4 as uuidv4 } from 'uuid';
import { AgentHandler, ConversationContext } from '../services/slack/MessageRouter';
import { SlackMessage, AgentResponse } from '../services/slack/types';
import { AgentIntent } from '../services/slack/IntentClassifier';
import {
  CustomerRequirements,
  OrganizationConfig,
  OrganizationResult,
  PolicySet,
  PolicyResult,
  CFNPackage,
  ValidationResult,
  WorkflowState,
} from '../shared/types/models';
import { AuditLogger } from '../data/AuditLogger';
import { WorkflowStateStore } from '../data/WorkflowStateStore';
import { OrganizationsClient } from './aws/OrganizationsClient';
import { PolicyManager } from './aws/PolicyManager';
import { PackageBuilder } from './cfn/PackageBuilder';
import { PackageValidator } from './cfn/PackageValidator';
import { PackageVersionManager } from './cfn/PackageVersionManager';
import { NotificationService, NotificationConfig } from '../services/slack/NotificationService';

export interface OnboardingAgentConfig {
  agentId: string;
  auditLogger: AuditLogger;
  stateStore: WorkflowStateStore;
  awsRegion?: string;
  organizationsClient?: OrganizationsClient;
  policyManager?: PolicyManager;
  packageBuilder?: PackageBuilder;
  packageValidator?: PackageValidator;
  versionManager?: PackageVersionManager;
  notificationService?: NotificationService;
}

export interface OnboardingWorkflowData {
  workflowId: string;
  organizationId?: string;
  packageId?: string;
  version?: string;
  status: string;
}

/**
 * Onboarding Agent handles AWS setup and CloudFormation package creation
 */
export class OnboardingAgent implements AgentHandler {
  public readonly agentId: string;
  private auditLogger: AuditLogger;
  private stateStore: WorkflowStateStore;
  private awsRegion: string;
  private organizationsClient: OrganizationsClient;
  private policyManager: PolicyManager;
  private packageBuilder: PackageBuilder;
  private packageValidator: PackageValidator;
  private versionManager: PackageVersionManager;
  private notificationService?: NotificationService;
  private isRunning: boolean = false;
  private activeWorkflows: Map<string, OnboardingWorkflowData> = new Map();

  constructor(config: OnboardingAgentConfig) {
    this.agentId = config.agentId;
    this.auditLogger = config.auditLogger;
    this.stateStore = config.stateStore;
    this.awsRegion = config.awsRegion || 'us-east-1';
    this.organizationsClient = config.organizationsClient || new OrganizationsClient({ region: this.awsRegion });
    this.policyManager = config.policyManager || new PolicyManager({ region: this.awsRegion });
    this.packageBuilder = config.packageBuilder || new PackageBuilder();
    this.packageValidator = config.packageValidator || new PackageValidator({ region: this.awsRegion });
    this.versionManager = config.versionManager || new PackageVersionManager();
    this.notificationService = config.notificationService;
  }

  /**
   * Start the agent
   */
  async start(): Promise<void> {
    if (this.isRunning) {
      throw new Error('Agent is already running');
    }

    await this.auditLogger.logSuccess(
      this.agentId,
      'AGENT',
      'AGENT_START',
      'AGENT',
      this.agentId,
      { agentType: 'ONBOARDING' }
    );

    this.isRunning = true;
  }

  /**
   * Stop the agent
   */
  async stop(): Promise<void> {
    if (!this.isRunning) {
      return;
    }

    await this.auditLogger.logSuccess(
      this.agentId,
      'AGENT',
      'AGENT_STOP',
      'AGENT',
      this.agentId,
      { 
        agentType: 'ONBOARDING',
        activeWorkflows: this.activeWorkflows.size,
      }
    );

    this.isRunning = false;
  }

  /**
   * Check if agent can handle the given intent
   */
  canHandle(intent: AgentIntent): boolean {
    return intent === 'onboarding';
  }

  /**
   * Handle incoming message
   */
  async handleMessage(
    message: SlackMessage,
    context: ConversationContext
  ): Promise<AgentResponse> {
    if (!this.isRunning) {
      return {
        agentId: this.agentId,
        message: 'Onboarding agent is not running',
        metadata: { error: 'AGENT_NOT_RUNNING' },
      };
    }

    try {
      // Log message receipt
      await this.auditLogger.logSuccess(
        message.userId,
        'USER',
        'MESSAGE_RECEIVED',
        'MESSAGE',
        message.timestamp,
        {
          channelId: message.channelId,
          threadId: message.threadId,
          conversationId: context.conversationId,
        }
      );

      // Process the message based on conversation state
      const response = await this.processMessage(message, context);

      return response;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      await this.auditLogger.logFailure(
        this.agentId,
        'AGENT',
        'MESSAGE_HANDLING_ERROR',
        'MESSAGE',
        message.timestamp,
        {
          errorId: uuidv4(),
          errorType: 'PERMANENT',
          errorCode: 'PROCESSING_ERROR',
          errorMessage,
          stackTrace: error instanceof Error ? error.stack || '' : '',
          retryAttempt: 0,
        },
        { error: errorMessage }
      );

      return {
        agentId: this.agentId,
        message: `Error processing message: ${errorMessage}`,
        metadata: { error: 'PROCESSING_ERROR' },
      };
    }
  }

  /**
   * Process message based on conversation state
   */
  private async processMessage(
    message: SlackMessage,
    context: ConversationContext
  ): Promise<AgentResponse> {
    // Check if there's an active workflow for this conversation
    const workflowData = this.activeWorkflows.get(context.conversationId);

    if (!workflowData) {
      // Start new onboarding workflow
      return {
        agentId: this.agentId,
        message: 'Starting new onboarding workflow. Please provide customer requirements.',
        metadata: { action: 'WORKFLOW_INIT' },
      };
    }

    // Continue existing workflow
    return {
      agentId: this.agentId,
      message: `Continuing onboarding workflow ${workflowData.workflowId}`,
      metadata: { 
        workflowId: workflowData.workflowId,
        status: workflowData.status,
      },
    };
  }

  /**
   * Get agent status
   */
  getStatus(): { running: boolean; activeWorkflows: number } {
    return {
      running: this.isRunning,
      activeWorkflows: this.activeWorkflows.size,
    };
  }

  /**
   * Set notification service (for wiring)
   */
  setNotificationService(notificationService: NotificationService): void {
    this.notificationService = notificationService;
  }

  /**
   * Execute complete onboarding workflow
   */
  async executeOnboardingWorkflow(
    requirements: CustomerRequirements,
    notificationChannels: string[]
  ): Promise<{ workflowId: string; packageId: string; version: string }> {
    const workflowId = uuidv4();

    // Create workflow data
    const workflowData: OnboardingWorkflowData = {
      workflowId,
      status: 'IN_PROGRESS',
    };
    this.activeWorkflows.set(workflowId, workflowData);

    try {
      // Notify workflow started
      if (this.notificationService) {
        await this.notificationService.notifyOnboardingStarted(
          requirements.customerId,
          requirements.customerName,
          {
            stakeholders: notificationChannels.map(ch => ({ channelId: ch })),
          }
        );
      }

      // Step 1: Create organization
      const orgConfig: OrganizationConfig = {
        customerName: requirements.customerName,
        accountEmail: requirements.contactEmail,
        organizationalUnits: ['Production', 'Development', 'Testing'],
        billingConfiguration: {
          paymentMethod: 'invoice',
          billingContact: requirements.contactEmail,
          costCenter: requirements.customerId,
        },
      };

      const orgResult = await this.createOrganization(orgConfig);
      workflowData.organizationId = orgResult.organizationId;

      // Step 2: Apply policies
      const policies = PolicyManager.getBestPracticePolicies();
      await this.applyPolicies(orgResult.organizationId, policies);

      // Step 3: Create CFN package
      const cfnPackage = await this.createCFNPackage(requirements);
      workflowData.packageId = cfnPackage.packageId;

      // Step 4: Validate package
      const validationResult = await this.validatePackage(cfnPackage.packageId);

      if (!validationResult.valid) {
        throw new Error(`Package validation failed: ${validationResult.errors.map(e => e.message).join(', ')}`);
      }

      // Step 5: Version package
      const version = await this.versionPackage(cfnPackage.packageId);
      workflowData.version = version;
      workflowData.status = 'COMPLETED';

      // Notify workflow completed
      if (this.notificationService) {
        await this.notificationService.notifyOnboardingCompleted(
          requirements.customerId,
          requirements.customerName,
          cfnPackage.packageId,
          {
            stakeholders: notificationChannels.map(ch => ({ channelId: ch })),
          }
        );
      }

      return {
        workflowId,
        packageId: cfnPackage.packageId,
        version,
      };
    } catch (error) {
      workflowData.status = 'FAILED';

      // Notify workflow failed
      if (this.notificationService) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        await this.notificationService.notifyOnboardingFailed(
          requirements.customerId,
          requirements.customerName,
          errorMessage,
          {
            stakeholders: notificationChannels.map(ch => ({ channelId: ch })),
          }
        );
      }

      throw error;
    } finally {
      this.activeWorkflows.delete(workflowId);
    }
  }

  /**
   * Create AWS organization
   */
  async createOrganization(config: OrganizationConfig): Promise<OrganizationResult> {
    const operationId = uuidv4();

    try {
      // Log operation start
      await this.auditLogger.logSuccess(
        this.agentId,
        'AGENT',
        'CREATE_ORGANIZATION',
        'ORGANIZATION',
        config.customerName,
        {
          customerName: config.customerName,
          accountEmail: config.accountEmail,
          organizationalUnits: config.organizationalUnits,
        }
      );

      // Create organization using AWS Organizations client
      const result = await this.organizationsClient.createOrganization(config);

      // Log successful creation
      await this.auditLogger.logSuccess(
        this.agentId,
        'AGENT',
        'ORGANIZATION_CREATED',
        'ORGANIZATION',
        result.organizationId,
        {
          organizationId: result.organizationId,
          organizationalUnits: result.organizationalUnits.length,
        }
      );

      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';

      // Log failure
      await this.auditLogger.logFailure(
        this.agentId,
        'AGENT',
        'CREATE_ORGANIZATION',
        'ORGANIZATION',
        config.customerName,
        {
          errorId: operationId,
          errorType: 'PERMANENT',
          errorCode: 'ORG_CREATION_FAILED',
          errorMessage,
          stackTrace: error instanceof Error ? error.stack || '' : '',
          retryAttempt: 0,
        },
        { error: errorMessage }
      );

      throw error;
    }
  }

  /**
   * Apply policies to organization
   */
  async applyPolicies(orgId: string, policies: PolicySet): Promise<PolicyResult> {
    const operationId = uuidv4();

    try {
      // Log operation start
      await this.auditLogger.logSuccess(
        this.agentId,
        'AGENT',
        'APPLY_POLICIES',
        'ORGANIZATION',
        orgId,
        {
          policyCount: policies.policies.length,
          policyIds: policies.policies.map(p => p.policyId),
        }
      );

      // Apply policies using policy manager
      const result = await this.policyManager.applyPolicies(orgId, policies);

      // Log result
      const logMethod = result.failedPolicies.length === 0 
        ? this.auditLogger.logSuccess.bind(this.auditLogger)
        : this.auditLogger.logFailure.bind(this.auditLogger);

      if (result.failedPolicies.length === 0) {
        await this.auditLogger.logSuccess(
          this.agentId,
          'AGENT',
          'POLICIES_APPLIED',
          'ORGANIZATION',
          orgId,
          {
            appliedPolicies: result.appliedPolicies.length,
            failedPolicies: result.failedPolicies.length,
          }
        );
      } else {
        await this.auditLogger.logFailure(
          this.agentId,
          'AGENT',
          'POLICIES_APPLIED',
          'ORGANIZATION',
          orgId,
          {
            errorId: operationId,
            errorType: 'PERMANENT',
            errorCode: 'POLICY_APPLICATION_PARTIAL_FAILURE',
            errorMessage: `Failed to apply ${result.failedPolicies.length} policies`,
            stackTrace: '',
            retryAttempt: 0,
          },
          {
            appliedPolicies: result.appliedPolicies.length,
            failedPolicies: result.failedPolicies.length,
          }
        );
      }

      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';

      // Log failure
      await this.auditLogger.logFailure(
        this.agentId,
        'AGENT',
        'APPLY_POLICIES',
        'ORGANIZATION',
        orgId,
        {
          errorId: operationId,
          errorType: 'PERMANENT',
          errorCode: 'POLICY_APPLICATION_FAILED',
          errorMessage,
          stackTrace: error instanceof Error ? error.stack || '' : '',
          retryAttempt: 0,
        },
        { error: errorMessage }
      );

      throw error;
    }
  }

  /**
   * Create CloudFormation package
   */
  async createCFNPackage(requirements: CustomerRequirements): Promise<CFNPackage> {
    const operationId = uuidv4();

    try {
      // Log operation start
      await this.auditLogger.logSuccess(
        this.agentId,
        'AGENT',
        'CREATE_CFN_PACKAGE',
        'CFN_PACKAGE',
        requirements.customerId,
        {
          customerId: requirements.customerId,
          customerName: requirements.customerName,
          regions: requirements.infrastructure.regions,
          services: requirements.infrastructure.services.length,
        }
      );

      // Create package using package builder
      const cfnPackage = await this.packageBuilder.createPackage(requirements);

      // Store package in validator and version manager
      this.packageValidator.storePackage(cfnPackage);
      this.versionManager.storePackage(cfnPackage);

      // Log successful creation
      await this.auditLogger.logSuccess(
        this.agentId,
        'AGENT',
        'CFN_PACKAGE_CREATED',
        'CFN_PACKAGE',
        cfnPackage.packageId,
        {
          packageId: cfnPackage.packageId,
          version: cfnPackage.version,
          templateCount: cfnPackage.templates.length,
        }
      );

      return cfnPackage;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';

      // Log failure
      await this.auditLogger.logFailure(
        this.agentId,
        'AGENT',
        'CREATE_CFN_PACKAGE',
        'CFN_PACKAGE',
        requirements.customerId,
        {
          errorId: operationId,
          errorType: 'PERMANENT',
          errorCode: 'PACKAGE_CREATION_FAILED',
          errorMessage,
          stackTrace: error instanceof Error ? error.stack || '' : '',
          retryAttempt: 0,
        },
        { error: errorMessage }
      );

      throw error;
    }
  }

  /**
   * Validate CloudFormation package
   */
  async validatePackage(packageId: string): Promise<ValidationResult> {
    const operationId = uuidv4();

    try {
      // Log operation start
      await this.auditLogger.logSuccess(
        this.agentId,
        'AGENT',
        'VALIDATE_PACKAGE',
        'CFN_PACKAGE',
        packageId,
        { packageId }
      );

      // Validate package
      const result = await this.packageValidator.validatePackage(packageId);

      // Log validation result
      if (result.valid) {
        await this.auditLogger.logSuccess(
          this.agentId,
          'AGENT',
          'PACKAGE_VALIDATED',
          'CFN_PACKAGE',
          packageId,
          {
            valid: result.valid,
            errorCount: result.errors.length,
            warningCount: result.warnings.length,
          }
        );
      } else {
        await this.auditLogger.logFailure(
          this.agentId,
          'AGENT',
          'PACKAGE_VALIDATED',
          'CFN_PACKAGE',
          packageId,
          {
            errorId: operationId,
            errorType: 'PERMANENT',
            errorCode: 'VALIDATION_ERRORS',
            errorMessage: `Package has ${result.errors.length} validation errors`,
            stackTrace: '',
            retryAttempt: 0,
          },
          {
            valid: result.valid,
            errorCount: result.errors.length,
            warningCount: result.warnings.length,
          }
        );
      }

      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';

      // Log failure
      await this.auditLogger.logFailure(
        this.agentId,
        'AGENT',
        'VALIDATE_PACKAGE',
        'CFN_PACKAGE',
        packageId,
        {
          errorId: operationId,
          errorType: 'PERMANENT',
          errorCode: 'VALIDATION_FAILED',
          errorMessage,
          stackTrace: error instanceof Error ? error.stack || '' : '',
          retryAttempt: 0,
        },
        { error: errorMessage }
      );

      throw error;
    }
  }

  /**
   * Version CloudFormation package
   */
  async versionPackage(packageId: string): Promise<string> {
    const operationId = uuidv4();

    try {
      // Log operation start
      await this.auditLogger.logSuccess(
        this.agentId,
        'AGENT',
        'VERSION_PACKAGE',
        'CFN_PACKAGE',
        packageId,
        { packageId }
      );

      // Generate version
      const version = await this.versionManager.versionPackage(packageId, this.agentId);

      // Log successful versioning
      await this.auditLogger.logSuccess(
        this.agentId,
        'AGENT',
        'PACKAGE_VERSIONED',
        'CFN_PACKAGE',
        packageId,
        {
          packageId,
          version,
        }
      );

      return version;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';

      // Log failure
      await this.auditLogger.logFailure(
        this.agentId,
        'AGENT',
        'VERSION_PACKAGE',
        'CFN_PACKAGE',
        packageId,
        {
          errorId: operationId,
          errorType: 'PERMANENT',
          errorCode: 'VERSIONING_FAILED',
          errorMessage,
          stackTrace: error instanceof Error ? error.stack || '' : '',
          retryAttempt: 0,
        },
        { error: errorMessage }
      );

      throw error;
    }
  }
}

