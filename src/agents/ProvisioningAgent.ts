/**
 * Provisioning Agent
 * 
 * Manages CloudFormation deployment and monitoring
 * Integrates with agentcore runtime for message handling and lifecycle management
 */

import { v4 as uuidv4 } from 'uuid';
import { AgentHandler, ConversationContext } from '../services/slack/MessageRouter';
import { SlackMessage, AgentResponse } from '../services/slack/types';
import { AgentIntent } from '../services/slack/IntentClassifier';
import {
  CFNPackage,
  DeploymentResult,
  DeploymentStatusInfo,
  VerificationResult,
  RollbackResult,
} from '../shared/types/models';
import { AuditLogger } from '../data/AuditLogger';
import { WorkflowStateStore } from '../data/WorkflowStateStore';
import { PackageVersionManager } from './cfn/PackageVersionManager';
import { NotificationService } from '../services/slack/NotificationService';
import { CloudFormationClient } from './aws/CloudFormationClient';

export interface ProvisioningAgentConfig {
  agentId: string;
  auditLogger: AuditLogger;
  stateStore: WorkflowStateStore;
  awsRegion?: string;
  packageStore?: PackageVersionManager;
  cfnClient?: CloudFormationClient;
  notificationService?: NotificationService;
}

export interface ProvisioningWorkflowData {
  workflowId: string;
  deploymentId?: string;
  packageId?: string;
  version?: string;
  status: string;
}

/**
 * Provisioning Agent handles CloudFormation deployment and monitoring
 */
export class ProvisioningAgent implements AgentHandler {
  public readonly agentId: string;
  private auditLogger: AuditLogger;
  private stateStore: WorkflowStateStore;
  private awsRegion: string;
  private packageStore: PackageVersionManager;
  private cfnClient: CloudFormationClient;
  private notificationService?: NotificationService;
  private isRunning: boolean = false;
  private activeWorkflows: Map<string, ProvisioningWorkflowData> = new Map();

  constructor(config: ProvisioningAgentConfig) {
    this.agentId = config.agentId;
    this.auditLogger = config.auditLogger;
    this.stateStore = config.stateStore;
    this.awsRegion = config.awsRegion || 'us-east-1';
    this.packageStore = config.packageStore || new PackageVersionManager();
    this.cfnClient = config.cfnClient || new CloudFormationClient({ region: this.awsRegion });
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
      { agentType: 'PROVISIONING' }
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
        agentType: 'PROVISIONING',
        activeWorkflows: this.activeWorkflows.size,
      }
    );

    this.isRunning = false;
  }

  /**
   * Check if agent can handle the given intent
   */
  canHandle(intent: AgentIntent): boolean {
    return intent === 'provisioning';
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
        message: 'Provisioning agent is not running',
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
      // Start new provisioning workflow
      return {
        agentId: this.agentId,
        message: 'Starting new provisioning workflow. Please provide package ID and version.',
        metadata: { action: 'WORKFLOW_INIT' },
      };
    }

    // Continue existing workflow
    return {
      agentId: this.agentId,
      message: `Continuing provisioning workflow ${workflowData.workflowId}`,
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
   * Set package store (for wiring)
   */
  setPackageStore(packageStore: PackageVersionManager): void {
    this.packageStore = packageStore;
  }

  /**
   * Retrieve CloudFormation package by ID and version
   */
  async retrievePackage(packageId: string, version: string): Promise<CFNPackage> {
    const operationId = uuidv4();

    try {
      // Log operation start
      await this.auditLogger.logSuccess(
        this.agentId,
        'AGENT',
        'RETRIEVE_PACKAGE',
        'CFN_PACKAGE',
        packageId,
        { packageId, version }
      );

      // Retrieve package from store
      const cfnPackage = this.packageStore.getPackage(packageId, version);

      if (!cfnPackage) {
        throw new Error(`Package ${packageId} version ${version} not found`);
      }

      // Validate package integrity
      const metadata = this.packageStore.getMetadata(packageId, version);
      
      if (!metadata) {
        throw new Error(`Package metadata not found for ${packageId} version ${version}`);
      }

      // Calculate current checksum and compare
      const currentChecksum = this.calculatePackageChecksum(cfnPackage);
      
      if (currentChecksum !== metadata.checksum) {
        throw new Error(`Package integrity check failed: checksum mismatch`);
      }

      // Log successful retrieval
      await this.auditLogger.logSuccess(
        this.agentId,
        'AGENT',
        'PACKAGE_RETRIEVED',
        'CFN_PACKAGE',
        packageId,
        {
          packageId,
          version,
          templateCount: cfnPackage.templates.length,
          checksumVerified: true,
        }
      );

      return cfnPackage;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';

      // Log failure
      await this.auditLogger.logFailure(
        this.agentId,
        'AGENT',
        'RETRIEVE_PACKAGE',
        'CFN_PACKAGE',
        packageId,
        {
          errorId: operationId,
          errorType: 'PERMANENT',
          errorCode: 'PACKAGE_RETRIEVAL_FAILED',
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
   * Calculate checksum for package integrity verification
   */
  private calculatePackageChecksum(cfnPackage: CFNPackage): string {
    // Simple checksum based on package content
    const content = JSON.stringify({
      templates: cfnPackage.templates.map(t => ({
        id: t.templateId,
        name: t.name,
        template: t.template,
      })),
      parameters: cfnPackage.parameters,
      dependencies: cfnPackage.dependencies,
    });

    // Generate hash-like checksum
    let hash = 0;
    for (let i = 0; i < content.length; i++) {
      const char = content.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }

    return Math.abs(hash).toString(16);
  }

  /**
   * Deploy CloudFormation stack
   */
  async deployStack(packageId: string, version: string, targetAccount: string): Promise<DeploymentResult> {
    const operationId = uuidv4();

    try {
      // Log operation start
      await this.auditLogger.logSuccess(
        this.agentId,
        'AGENT',
        'DEPLOY_STACK',
        'CFN_STACK',
        packageId,
        { packageId, version, targetAccount }
      );

      // Retrieve package
      const cfnPackage = await this.retrievePackage(packageId, version);

      // Generate stack name
      const stackName = `${packageId.replace(/[^a-zA-Z0-9-]/g, '-')}-${version.replace(/\./g, '-')}`;

      // Deploy stack using CloudFormation client
      const result = await this.cfnClient.deployStack(cfnPackage, targetAccount, stackName);

      // Log successful deployment initiation
      await this.auditLogger.logSuccess(
        this.agentId,
        'AGENT',
        'STACK_DEPLOYMENT_INITIATED',
        'CFN_STACK',
        result.stackId,
        {
          deploymentId: result.deploymentId,
          stackId: result.stackId,
          status: result.status,
        }
      );

      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';

      // Log failure
      await this.auditLogger.logFailure(
        this.agentId,
        'AGENT',
        'DEPLOY_STACK',
        'CFN_STACK',
        packageId,
        {
          errorId: operationId,
          errorType: 'PERMANENT',
          errorCode: 'STACK_DEPLOYMENT_FAILED',
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
   * Monitor deployment status
   */
  async monitorDeployment(deploymentId: string): Promise<DeploymentStatusInfo> {
    const operationId = uuidv4();

    try {
      // Log operation start
      await this.auditLogger.logSuccess(
        this.agentId,
        'AGENT',
        'MONITOR_DEPLOYMENT',
        'CFN_DEPLOYMENT',
        deploymentId,
        { deploymentId }
      );

      // Get deployment status from CloudFormation client
      const status = await this.cfnClient.getDeploymentStatus(deploymentId);

      // Log status retrieval
      await this.auditLogger.logSuccess(
        this.agentId,
        'AGENT',
        'DEPLOYMENT_STATUS_RETRIEVED',
        'CFN_DEPLOYMENT',
        deploymentId,
        {
          deploymentId,
          currentStatus: status.currentStatus,
          progress: status.progress,
          resourcesCreated: status.resourcesCreated,
          resourcesFailed: status.resourcesFailed,
        }
      );

      return status;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';

      // Log failure
      await this.auditLogger.logFailure(
        this.agentId,
        'AGENT',
        'MONITOR_DEPLOYMENT',
        'CFN_DEPLOYMENT',
        deploymentId,
        {
          errorId: operationId,
          errorType: 'PERMANENT',
          errorCode: 'DEPLOYMENT_MONITORING_FAILED',
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
   * Verify deployed resources
   */
  async verifyResources(deploymentId: string): Promise<VerificationResult> {
    const operationId = uuidv4();

    try {
      // Log operation start
      await this.auditLogger.logSuccess(
        this.agentId,
        'AGENT',
        'VERIFY_RESOURCES',
        'CFN_DEPLOYMENT',
        deploymentId,
        { deploymentId }
      );

      // Verify resources using CloudFormation client
      const result = await this.cfnClient.verifyResources(deploymentId);

      // Log verification result
      if (result.verified) {
        await this.auditLogger.logSuccess(
          this.agentId,
          'AGENT',
          'RESOURCES_VERIFIED',
          'CFN_DEPLOYMENT',
          deploymentId,
          {
            deploymentId,
            verified: result.verified,
            totalResources: result.resourcesVerified.length,
            verifiedResources: result.resourcesVerified.filter(r => r.verified).length,
          }
        );
      } else {
        await this.auditLogger.logFailure(
          this.agentId,
          'AGENT',
          'RESOURCES_VERIFIED',
          'CFN_DEPLOYMENT',
          deploymentId,
          {
            errorId: operationId,
            errorType: 'PERMANENT',
            errorCode: 'RESOURCE_VERIFICATION_FAILED',
            errorMessage: 'Some resources failed verification',
            stackTrace: '',
            retryAttempt: 0,
          },
          {
            deploymentId,
            verified: result.verified,
            totalResources: result.resourcesVerified.length,
            verifiedResources: result.resourcesVerified.filter(r => r.verified).length,
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
        'VERIFY_RESOURCES',
        'CFN_DEPLOYMENT',
        deploymentId,
        {
          errorId: operationId,
          errorType: 'PERMANENT',
          errorCode: 'RESOURCE_VERIFICATION_ERROR',
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
   * Rollback deployment on failure
   */
  async rollbackDeployment(deploymentId: string, errorDetails: string): Promise<RollbackResult> {
    const operationId = uuidv4();

    try {
      // Log operation start
      await this.auditLogger.logSuccess(
        this.agentId,
        'AGENT',
        'ROLLBACK_DEPLOYMENT',
        'CFN_DEPLOYMENT',
        deploymentId,
        { deploymentId, errorDetails }
      );

      // Initiate rollback using CloudFormation client
      const result = await this.cfnClient.rollbackDeployment(deploymentId);

      // Log rollback initiation
      await this.auditLogger.logSuccess(
        this.agentId,
        'AGENT',
        'ROLLBACK_INITIATED',
        'CFN_DEPLOYMENT',
        deploymentId,
        {
          deploymentId,
          rollbackStatus: result.rollbackStatus,
        }
      );

      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';

      // Log failure
      await this.auditLogger.logFailure(
        this.agentId,
        'AGENT',
        'ROLLBACK_DEPLOYMENT',
        'CFN_DEPLOYMENT',
        deploymentId,
        {
          errorId: operationId,
          errorType: 'CRITICAL',
          errorCode: 'ROLLBACK_FAILED',
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
   * Execute complete provisioning workflow
   */
  async executeProvisioningWorkflow(
    packageId: string,
    version: string,
    targetAccount: string,
    notificationChannels: string[]
  ): Promise<{ workflowId: string; deploymentId: string; verified: boolean }> {
    const workflowId = uuidv4();

    // Create workflow data
    const workflowData: ProvisioningWorkflowData = {
      workflowId,
      packageId,
      version,
      status: 'IN_PROGRESS',
    };
    this.activeWorkflows.set(workflowId, workflowData);

    try {
      // Notify workflow started
      if (this.notificationService) {
        await this.notificationService.notifyProvisioningStarted(
          packageId,
          version,
          targetAccount,
          {
            stakeholders: notificationChannels.map(ch => ({ channelId: ch })),
          }
        );
      }

      // Step 1: Retrieve package
      const cfnPackage = await this.retrievePackage(packageId, version);

      // Step 2: Deploy stack
      const deploymentResult = await this.deployStack(packageId, version, targetAccount);
      workflowData.deploymentId = deploymentResult.deploymentId;

      // Step 3: Monitor deployment until complete
      let deploymentComplete = false;
      let deploymentFailed = false;
      let lastStatus: DeploymentStatusInfo | null = null;

      while (!deploymentComplete && !deploymentFailed) {
        // Wait before polling
        await new Promise(resolve => setTimeout(resolve, 2000));

        // Get deployment status
        const status = await this.monitorDeployment(deploymentResult.deploymentId);
        lastStatus = status;

        // Check if deployment is complete
        if (status.currentStatus === 'CREATE_COMPLETE') {
          deploymentComplete = true;
        } else if (
          status.currentStatus === 'CREATE_FAILED' ||
          status.currentStatus === 'ROLLBACK_IN_PROGRESS' ||
          status.currentStatus === 'ROLLBACK_COMPLETE'
        ) {
          deploymentFailed = true;
        }
      }

      // Handle deployment failure
      if (deploymentFailed) {
        const errorMessage = `Deployment failed with status: ${lastStatus?.currentStatus}`;
        
        // Initiate rollback
        await this.rollbackDeployment(deploymentResult.deploymentId, errorMessage);

        // Notify failure
        if (this.notificationService) {
          await this.notificationService.notifyProvisioningFailed(
            packageId,
            version,
            targetAccount,
            errorMessage,
            {
              stakeholders: notificationChannels.map(ch => ({ channelId: ch })),
            }
          );
        }

        workflowData.status = 'FAILED';
        throw new Error(errorMessage);
      }

      // Step 4: Verify resources
      const verificationResult = await this.verifyResources(deploymentResult.deploymentId);

      if (!verificationResult.verified) {
        const errorMessage = 'Resource verification failed';
        
        // Initiate rollback
        await this.rollbackDeployment(deploymentResult.deploymentId, errorMessage);

        // Notify failure
        if (this.notificationService) {
          await this.notificationService.notifyProvisioningFailed(
            packageId,
            version,
            targetAccount,
            errorMessage,
            {
              stakeholders: notificationChannels.map(ch => ({ channelId: ch })),
            }
          );
        }

        workflowData.status = 'FAILED';
        throw new Error(errorMessage);
      }

      // Notify workflow completed
      if (this.notificationService) {
        await this.notificationService.notifyProvisioningCompleted(
          packageId,
          version,
          targetAccount,
          {
            stakeholders: notificationChannels.map(ch => ({ channelId: ch })),
          }
        );
      }

      workflowData.status = 'COMPLETED';

      return {
        workflowId,
        deploymentId: deploymentResult.deploymentId,
        verified: verificationResult.verified,
      };
    } catch (error) {
      workflowData.status = 'FAILED';

      // Notify workflow failed if not already notified
      if (this.notificationService && error instanceof Error) {
        await this.notificationService.notifyProvisioningFailed(
          packageId,
          version,
          targetAccount,
          error.message,
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
}
