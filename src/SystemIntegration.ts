/**
 * System Integration Module
 * 
 * Wires all components together:
 * - Slack integration to agents
 * - Agents to workflow orchestrator
 * - Agents to AWS services
 * - Error handlers throughout the system
 * 
 * Requirements: 1.1, 1.2, 2.1, 3.1, 4.1, 4.2
 */

import { OnboardingAgent, OnboardingAgentConfig } from './agents/OnboardingAgent';
import { ProvisioningAgent, ProvisioningAgentConfig } from './agents/ProvisioningAgent';
import { SlackIntegrationService } from './services/slack/SlackIntegrationService';
import { WorkflowOrchestrator } from './workflows/WorkflowOrchestrator';
import { CheckpointManager, CheckpointManagerConfig } from './workflows/CheckpointManager';
import { WorkflowMonitor, WorkflowMonitorConfig } from './workflows/WorkflowMonitor';
import { WorkflowStateStore } from './data/WorkflowStateStore';
import { AuditLogger } from './data/AuditLogger';
import { RetryHandler } from './shared/errors/RetryHandler';
import { CircuitBreaker } from './shared/errors/CircuitBreaker';
import { ErrorClassifier } from './shared/errors/ErrorClassifier';
import { IAMRoleManager, IAMRoleConfig } from './agents/aws/IAMRoleManager';
import { OrganizationsClient } from './agents/aws/OrganizationsClient';
import { PolicyManager } from './agents/aws/PolicyManager';
import { CloudFormationClient } from './agents/aws/CloudFormationClient';
import { PackageBuilder } from './agents/cfn/PackageBuilder';
import { PackageValidator } from './agents/cfn/PackageValidator';
import { PackageVersionManager } from './agents/cfn/PackageVersionManager';
import { SecurityPolicyValidator } from './shared/security/SecurityPolicyValidator';
import { SlackConfig } from './services/slack/types';

/**
 * System configuration
 */
export interface SystemConfig {
  slack: SlackConfig;
  aws: {
    region: string;
  };
  agents: {
    onboarding: {
      agentId?: string;
    };
    provisioning: {
      agentId?: string;
    };
  };
}

/**
 * Integrated system components
 */
export interface IntegratedSystem {
  // Core services
  slackIntegration: SlackIntegrationService;
  workflowOrchestrator: WorkflowOrchestrator;
  
  // Agents
  onboardingAgent: OnboardingAgent;
  provisioningAgent: ProvisioningAgent;
  
  // Data layer
  stateStore: WorkflowStateStore;
  auditLogger: AuditLogger;
  
  // Monitoring
  workflowMonitor: WorkflowMonitor;
  checkpointManager: CheckpointManager;
  
  // Error handling
  retryHandler: RetryHandler;
  errorClassifier: ErrorClassifier;
  
  // Lifecycle methods
  start(): Promise<void>;
  shutdown(): Promise<void>;
  healthCheck(): Promise<HealthCheckResult>;
}

/**
 * Health check result
 */
export interface HealthCheckResult {
  healthy: boolean;
  components: {
    slack: boolean;
    onboardingAgent: boolean;
    provisioningAgent: boolean;
    workflow: boolean;
    database: boolean;
  };
  errors: string[];
}

/**
 * Wire all system components together
 */
export function integrateSystem(config: SystemConfig): IntegratedSystem {
  // Initialize error handling infrastructure
  const errorClassifier = new ErrorClassifier();
  const retryHandler = new RetryHandler(errorClassifier);
  
  // Initialize data layer
  const stateStore = new WorkflowStateStore();
  const auditLogger = new AuditLogger();
  
  // Initialize Slack integration
  const slackIntegration = new SlackIntegrationService(config.slack);
  
  // Initialize AWS service clients
  const iamRoleConfig: IAMRoleConfig = {
    region: config.aws.region,
  };
  const iamRoleManager = new IAMRoleManager(iamRoleConfig);
  const organizationsClient = new OrganizationsClient({ region: config.aws.region });
  const policyManager = new PolicyManager({ region: config.aws.region });
  const cloudFormationClient = new CloudFormationClient({ region: config.aws.region });
  
  // Initialize CFN package management
  const packageBuilder = new PackageBuilder();
  const packageValidator = new PackageValidator({ region: config.aws.region });
  const packageVersionManager = new PackageVersionManager();
  
  // Initialize Onboarding Agent with all dependencies
  const onboardingAgent = new OnboardingAgent({
    agentId: config.agents.onboarding.agentId || 'onboarding-agent',
    organizationsClient,
    policyManager,
    packageBuilder,
    packageValidator,
    versionManager: packageVersionManager,
    auditLogger,
    stateStore,
    awsRegion: config.aws.region,
  });
  
  // Initialize Provisioning Agent with all dependencies
  const provisioningAgent = new ProvisioningAgent({
    agentId: config.agents.provisioning.agentId || 'provisioning-agent',
    cfnClient: cloudFormationClient,
    packageStore: packageVersionManager,
    auditLogger,
    stateStore,
    awsRegion: config.aws.region,
  });
  
  // Wire agents to Slack integration
  const notificationService = slackIntegration.getNotificationService();
  const messageRouter = slackIntegration.getMessageRouter();
  
  onboardingAgent.setNotificationService(notificationService);
  provisioningAgent.setNotificationService(notificationService);
  
  messageRouter.registerAgent(onboardingAgent);
  messageRouter.registerAgent(provisioningAgent);
  
  // Initialize workflow infrastructure with agents
  const checkpointManager = new CheckpointManager({
    stateStore,
    auditLogger,
  });
  
  const workflowMonitor = new WorkflowMonitor({
    stateStore,
    auditLogger,
    checkpointManager,
  });
  
  const workflowOrchestrator = new WorkflowOrchestrator({
    stateStore,
    auditLogger,
    onboardingAgent,
    provisioningAgent,
  });
  
  // Return integrated system
  return {
    slackIntegration,
    workflowOrchestrator,
    onboardingAgent,
    provisioningAgent,
    stateStore,
    auditLogger,
    workflowMonitor,
    checkpointManager,
    retryHandler,
    errorClassifier,
    
    async start(): Promise<void> {
      // Authenticate with Slack
      const authenticated = await slackIntegration.authenticateBot();
      if (!authenticated) {
        throw new Error('Failed to authenticate with Slack');
      }
      
      // Start agents
      await onboardingAgent.start();
      await provisioningAgent.start();
      
      // Log system startup
      await auditLogger.logSuccess(
        'system',
        'SYSTEM',
        'SYSTEM_START',
        'SYSTEM',
        'system',
        { message: 'System started successfully' }
      );
    },
    
    async shutdown(): Promise<void> {
      // Log system shutdown
      await auditLogger.logSuccess(
        'system',
        'SYSTEM',
        'SYSTEM_SHUTDOWN',
        'SYSTEM',
        'system',
        { message: 'System shutting down' }
      );
      
      // Stop agents
      await onboardingAgent.stop();
      await provisioningAgent.stop();
      
      // Shutdown Slack integration
      await slackIntegration.shutdown();
    },
    
    async healthCheck(): Promise<HealthCheckResult> {
      const errors: string[] = [];
      const components = {
        slack: false,
        onboardingAgent: false,
        provisioningAgent: false,
        workflow: false,
        database: false,
      };
      
      // Check Slack integration
      try {
        await slackIntegration.healthCheck();
        components.slack = true;
      } catch (error) {
        errors.push(`Slack: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
      
      // Check agents (basic check - they're initialized)
      components.onboardingAgent = onboardingAgent !== null;
      components.provisioningAgent = provisioningAgent !== null;
      
      // Check workflow orchestrator (basic check)
      components.workflow = workflowOrchestrator !== null;
      
      // Check database (state store)
      components.database = stateStore !== null;
      
      return {
        healthy: errors.length === 0,
        components,
        errors,
      };
    },
  };
}

/**
 * Create a default system configuration
 */
export function createDefaultConfig(overrides?: Partial<SystemConfig>): SystemConfig {
  return {
    slack: {
      botToken: process.env.SLACK_BOT_TOKEN || '',
      appToken: process.env.SLACK_APP_TOKEN || '',
      signingSecret: process.env.SLACK_SIGNING_SECRET || '',
      ...overrides?.slack,
    },
    aws: {
      region: process.env.AWS_REGION || 'us-east-1',
      ...overrides?.aws,
    },
    agents: {
      onboarding: {
        agentId: 'onboarding-agent',
        ...overrides?.agents?.onboarding,
      },
      provisioning: {
        agentId: 'provisioning-agent',
        ...overrides?.agents?.provisioning,
      },
    },
  };
}
