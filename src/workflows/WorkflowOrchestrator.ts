/**
 * Workflow Orchestrator
 * 
 * Coordinates workflows spanning multiple agents using the strands framework
 * Manages workflow state, checkpoints, and recovery mechanisms
 */

import { v4 as uuidv4 } from 'uuid';
import {
  WorkflowState,
  WorkflowType,
  WorkflowStatus,
  WorkflowInput,
  WorkflowOutput,
  Checkpoint,
  CheckpointStatus,
  CustomerRequirements,
} from '../shared/types/models';
import { WorkflowStateStore } from '../data/WorkflowStateStore';
import { AuditLogger } from '../data/AuditLogger';
import { OnboardingAgent } from '../agents/OnboardingAgent';
import { ProvisioningAgent } from '../agents/ProvisioningAgent';

// ============================================================================
// Workflow Configuration
// ============================================================================

export interface WorkflowOrchestratorConfig {
  stateStore: WorkflowStateStore;
  auditLogger: AuditLogger;
  onboardingAgent?: OnboardingAgent;
  provisioningAgent?: ProvisioningAgent;
}

// ============================================================================
// Workflow Step Definitions
// ============================================================================

export interface WorkflowStep {
  stepId: string;
  stepName: string;
  agentId: string;
  execute: (context: WorkflowExecutionContext) => Promise<any>;
  onSuccess?: (context: WorkflowExecutionContext, result: any) => Promise<void>;
  onFailure?: (context: WorkflowExecutionContext, error: Error) => Promise<void>;
}

export interface WorkflowExecutionContext {
  workflowId: string;
  workflowType: WorkflowType;
  input: WorkflowInput;
  state: WorkflowState;
  stepResults: Map<string, any>;
}

// ============================================================================
// Workflow Definitions
// ============================================================================

export interface WorkflowDefinition {
  workflowType: WorkflowType;
  steps: WorkflowStep[];
}

// ============================================================================
// Workflow Orchestrator
// ============================================================================

export class WorkflowOrchestrator {
  private stateStore: WorkflowStateStore;
  private auditLogger: AuditLogger;
  private onboardingAgent?: OnboardingAgent;
  private provisioningAgent?: ProvisioningAgent;
  private workflowDefinitions: Map<WorkflowType, WorkflowDefinition> = new Map();
  private activeWorkflows: Map<string, WorkflowExecutionContext> = new Map();

  constructor(config: WorkflowOrchestratorConfig) {
    this.stateStore = config.stateStore;
    this.auditLogger = config.auditLogger;
    this.onboardingAgent = config.onboardingAgent;
    this.provisioningAgent = config.provisioningAgent;

    // Initialize workflow definitions
    this.initializeWorkflowDefinitions();
  }

  // ==========================================================================
  // Workflow Definition Initialization
  // ==========================================================================

  /**
   * Initialize workflow definitions for onboarding and provisioning
   */
  private initializeWorkflowDefinitions(): void {
    // Define onboarding workflow
    this.workflowDefinitions.set('ONBOARDING', {
      workflowType: 'ONBOARDING',
      steps: [
        {
          stepId: 'onboarding-init',
          stepName: 'Initialize Onboarding',
          agentId: 'onboarding-agent',
          execute: async (context) => {
            return { initialized: true, timestamp: new Date() };
          },
        },
        {
          stepId: 'onboarding-execute',
          stepName: 'Execute Onboarding Workflow',
          agentId: 'onboarding-agent',
          execute: async (context) => {
            if (!this.onboardingAgent) {
              throw new Error('Onboarding agent not configured');
            }

            const result = await this.onboardingAgent.executeOnboardingWorkflow(
              context.input.customerRequirements,
              context.input.notificationChannels
            );

            return result;
          },
        },
        {
          stepId: 'onboarding-complete',
          stepName: 'Complete Onboarding',
          agentId: 'onboarding-agent',
          execute: async (context) => {
            const onboardingResult = context.stepResults.get('onboarding-execute');
            return {
              completed: true,
              packageId: onboardingResult.packageId,
              version: onboardingResult.version,
              timestamp: new Date(),
            };
          },
        },
      ],
    });

    // Define provisioning workflow
    this.workflowDefinitions.set('PROVISIONING', {
      workflowType: 'PROVISIONING',
      steps: [
        {
          stepId: 'provisioning-init',
          stepName: 'Initialize Provisioning',
          agentId: 'provisioning-agent',
          execute: async (context) => {
            return { initialized: true, timestamp: new Date() };
          },
        },
        {
          stepId: 'provisioning-execute',
          stepName: 'Execute Provisioning Workflow',
          agentId: 'provisioning-agent',
          execute: async (context) => {
            if (!this.provisioningAgent) {
              throw new Error('Provisioning agent not configured');
            }

            // Extract package info from metadata
            const packageId = context.state.metadata.packageId as string;
            const version = context.state.metadata.version as string;

            if (!packageId || !version) {
              throw new Error('Package ID and version required for provisioning');
            }

            const result = await this.provisioningAgent.executeProvisioningWorkflow(
              packageId,
              version,
              context.input.targetAccount,
              context.input.notificationChannels
            );

            return result;
          },
        },
        {
          stepId: 'provisioning-complete',
          stepName: 'Complete Provisioning',
          agentId: 'provisioning-agent',
          execute: async (context) => {
            const provisioningResult = context.stepResults.get('provisioning-execute');
            return {
              completed: true,
              deploymentId: provisioningResult.deploymentId,
              verified: provisioningResult.verified,
              timestamp: new Date(),
            };
          },
        },
      ],
    });
  }

  // ==========================================================================
  // Workflow Lifecycle Management
  // ==========================================================================

  /**
   * Start a new workflow
   */
  async startWorkflow(workflowType: WorkflowType, input: WorkflowInput): Promise<string> {
    const workflowId = uuidv4();

    // Create initial workflow state
    const state: WorkflowState = {
      workflowId,
      type: workflowType,
      status: 'PENDING',
      currentStep: '',
      checkpoints: [],
      metadata: {},
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // Save initial state
    await this.stateStore.saveWorkflowState(state);

    // Log workflow start
    await this.auditLogger.logSuccess(
      'workflow-orchestrator',
      'SYSTEM',
      'WORKFLOW_STARTED',
      'WORKFLOW',
      workflowId,
      {
        workflowType,
        customerId: input.customerRequirements.customerId,
        targetAccount: input.targetAccount,
      }
    );

    // Create execution context
    const context: WorkflowExecutionContext = {
      workflowId,
      workflowType,
      input,
      state,
      stepResults: new Map(),
    };

    // Store active workflow
    this.activeWorkflows.set(workflowId, context);

    // Execute workflow asynchronously
    this.executeWorkflow(context).catch(async (error) => {
      await this.handleWorkflowError(context, error);
    });

    return workflowId;
  }

  /**
   * Execute workflow steps
   */
  private async executeWorkflow(context: WorkflowExecutionContext): Promise<void> {
    const definition = this.workflowDefinitions.get(context.workflowType);

    if (!definition) {
      throw new Error(`Workflow definition not found for type: ${context.workflowType}`);
    }

    try {
      // Update status to IN_PROGRESS
      await this.updateWorkflowStatus(context.workflowId, 'IN_PROGRESS');

      // Execute each step in sequence
      for (const step of definition.steps) {
        await this.executeStep(context, step);
      }

      // Mark workflow as completed
      await this.updateWorkflowStatus(context.workflowId, 'COMPLETED');

      // Log workflow completion
      await this.auditLogger.logSuccess(
        'workflow-orchestrator',
        'SYSTEM',
        'WORKFLOW_COMPLETED',
        'WORKFLOW',
        context.workflowId,
        {
          workflowType: context.workflowType,
          stepsCompleted: definition.steps.length,
        }
      );
    } catch (error) {
      // Mark workflow as failed
      await this.updateWorkflowStatus(context.workflowId, 'FAILED');

      // Re-throw error for handling
      throw error;
    } finally {
      // Remove from active workflows
      this.activeWorkflows.delete(context.workflowId);
    }
  }

  /**
   * Execute a single workflow step
   */
  private async executeStep(
    context: WorkflowExecutionContext,
    step: WorkflowStep
  ): Promise<void> {
    // Update current step
    await this.stateStore.updateCurrentStep(context.workflowId, step.stepId);
    context.state.currentStep = step.stepId;

    // Log step start
    await this.auditLogger.logSuccess(
      step.agentId,
      'AGENT',
      'WORKFLOW_STEP_STARTED',
      'WORKFLOW_STEP',
      step.stepId,
      {
        workflowId: context.workflowId,
        stepName: step.stepName,
      }
    );

    try {
      // Execute step
      const result = await step.execute(context);

      // Store step result
      context.stepResults.set(step.stepId, result);

      // Create success checkpoint
      const checkpoint: Checkpoint = {
        stepId: step.stepId,
        timestamp: new Date(),
        agentId: step.agentId,
        status: 'SUCCESS',
        data: { result },
      };

      await this.stateStore.createCheckpoint(context.workflowId, checkpoint);

      // Call onSuccess callback if defined
      if (step.onSuccess) {
        await step.onSuccess(context, result);
      }

      // Log step completion
      await this.auditLogger.logSuccess(
        step.agentId,
        'AGENT',
        'WORKFLOW_STEP_COMPLETED',
        'WORKFLOW_STEP',
        step.stepId,
        {
          workflowId: context.workflowId,
          stepName: step.stepName,
        }
      );
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';

      // Create failure checkpoint
      const checkpoint: Checkpoint = {
        stepId: step.stepId,
        timestamp: new Date(),
        agentId: step.agentId,
        status: 'FAILURE',
        data: {},
        errorDetails: {
          errorId: uuidv4(),
          errorType: 'PERMANENT',
          errorCode: 'STEP_EXECUTION_FAILED',
          errorMessage,
          stackTrace: error instanceof Error ? error.stack || '' : '',
          retryAttempt: 0,
        },
      };

      await this.stateStore.createCheckpoint(context.workflowId, checkpoint);

      // Call onFailure callback if defined
      if (step.onFailure) {
        await step.onFailure(context, error as Error);
      }

      // Log step failure
      await this.auditLogger.logFailure(
        step.agentId,
        'AGENT',
        'WORKFLOW_STEP_FAILED',
        'WORKFLOW_STEP',
        step.stepId,
        checkpoint.errorDetails!,
        {
          workflowId: context.workflowId,
          stepName: step.stepName,
        }
      );

      // Re-throw error to fail workflow
      throw error;
    }
  }

  /**
   * Handle workflow error
   */
  private async handleWorkflowError(
    context: WorkflowExecutionContext,
    error: Error
  ): Promise<void> {
    const errorMessage = error.message;

    // Log workflow error
    await this.auditLogger.logFailure(
      'workflow-orchestrator',
      'SYSTEM',
      'WORKFLOW_FAILED',
      'WORKFLOW',
      context.workflowId,
      {
        errorId: uuidv4(),
        errorType: 'PERMANENT',
        errorCode: 'WORKFLOW_EXECUTION_FAILED',
        errorMessage,
        stackTrace: error.stack || '',
        retryAttempt: 0,
      },
      {
        workflowType: context.workflowType,
        currentStep: context.state.currentStep,
      }
    );
  }

  // ==========================================================================
  // Workflow Status Management
  // ==========================================================================

  /**
   * Get workflow status
   */
  async getWorkflowStatus(workflowId: string): Promise<WorkflowStatus> {
    const state = await this.stateStore.loadWorkflowState(workflowId);

    if (!state) {
      throw new Error(`Workflow not found: ${workflowId}`);
    }

    return state.status;
  }

  /**
   * Update workflow status
   */
  private async updateWorkflowStatus(
    workflowId: string,
    status: WorkflowStatus
  ): Promise<void> {
    await this.stateStore.updateWorkflowStatus(workflowId, status);

    // Update context if workflow is active
    const context = this.activeWorkflows.get(workflowId);
    if (context) {
      context.state.status = status;
    }
  }

  // ==========================================================================
  // Workflow Recovery
  // ==========================================================================

  /**
   * Resume workflow from last successful checkpoint
   */
  async resumeWorkflow(workflowId: string, checkpoint: string): Promise<void> {
    // Load workflow state
    const state = await this.stateStore.loadWorkflowState(workflowId);

    if (!state) {
      throw new Error(`Workflow not found: ${workflowId}`);
    }

    // Find the checkpoint
    const checkpointData = await this.stateStore.getCheckpoint(workflowId, checkpoint);

    if (!checkpointData) {
      throw new Error(`Checkpoint not found: ${checkpoint}`);
    }

    // Log workflow resume
    await this.auditLogger.logSuccess(
      'workflow-orchestrator',
      'SYSTEM',
      'WORKFLOW_RESUMED',
      'WORKFLOW',
      workflowId,
      {
        checkpointStepId: checkpoint,
        checkpointTimestamp: checkpointData.timestamp,
      }
    );

    // Get workflow definition
    const definition = this.workflowDefinitions.get(state.type);

    if (!definition) {
      throw new Error(`Workflow definition not found for type: ${state.type}`);
    }

    // Find the step index to resume from
    const stepIndex = definition.steps.findIndex(s => s.stepId === checkpoint);

    if (stepIndex === -1) {
      throw new Error(`Step not found in workflow definition: ${checkpoint}`);
    }

    // Create execution context
    // Note: This is a simplified implementation
    // In a real system, we would need to reconstruct the full context
    // including input and previous step results from the state
    const context: WorkflowExecutionContext = {
      workflowId,
      workflowType: state.type,
      input: state.metadata.input as WorkflowInput,
      state,
      stepResults: new Map(),
    };

    // Restore step results from checkpoints
    for (const cp of state.checkpoints) {
      if (cp.status === 'SUCCESS' && cp.data.result) {
        context.stepResults.set(cp.stepId, cp.data.result);
      }
    }

    // Store active workflow
    this.activeWorkflows.set(workflowId, context);

    // Resume execution from the next step
    this.resumeWorkflowExecution(context, stepIndex + 1).catch(async (error) => {
      await this.handleWorkflowError(context, error);
    });
  }

  /**
   * Resume workflow execution from a specific step index
   */
  private async resumeWorkflowExecution(
    context: WorkflowExecutionContext,
    startStepIndex: number
  ): Promise<void> {
    const definition = this.workflowDefinitions.get(context.workflowType);

    if (!definition) {
      throw new Error(`Workflow definition not found for type: ${context.workflowType}`);
    }

    try {
      // Update status to IN_PROGRESS
      await this.updateWorkflowStatus(context.workflowId, 'IN_PROGRESS');

      // Execute remaining steps
      for (let i = startStepIndex; i < definition.steps.length; i++) {
        await this.executeStep(context, definition.steps[i]);
      }

      // Mark workflow as completed
      await this.updateWorkflowStatus(context.workflowId, 'COMPLETED');

      // Log workflow completion
      await this.auditLogger.logSuccess(
        'workflow-orchestrator',
        'SYSTEM',
        'WORKFLOW_COMPLETED',
        'WORKFLOW',
        context.workflowId,
        {
          workflowType: context.workflowType,
          resumedFromStep: startStepIndex,
        }
      );
    } catch (error) {
      // Mark workflow as failed
      await this.updateWorkflowStatus(context.workflowId, 'FAILED');

      // Re-throw error for handling
      throw error;
    } finally {
      // Remove from active workflows
      this.activeWorkflows.delete(context.workflowId);
    }
  }

  // ==========================================================================
  // Workflow Cancellation
  // ==========================================================================

  /**
   * Cancel an active workflow
   */
  async cancelWorkflow(workflowId: string): Promise<void> {
    // Load workflow state
    const state = await this.stateStore.loadWorkflowState(workflowId);

    if (!state) {
      throw new Error(`Workflow not found: ${workflowId}`);
    }

    // Check if workflow can be cancelled
    if (state.status === 'COMPLETED' || state.status === 'CANCELLED') {
      throw new Error(`Workflow cannot be cancelled: already ${state.status}`);
    }

    // Update status to CANCELLED
    await this.updateWorkflowStatus(workflowId, 'CANCELLED');

    // Remove from active workflows
    this.activeWorkflows.delete(workflowId);

    // Log workflow cancellation
    await this.auditLogger.logSuccess(
      'workflow-orchestrator',
      'SYSTEM',
      'WORKFLOW_CANCELLED',
      'WORKFLOW',
      workflowId,
      {
        workflowType: state.type,
        currentStep: state.currentStep,
      }
    );
  }

  // ==========================================================================
  // Agent Configuration
  // ==========================================================================

  /**
   * Set onboarding agent
   */
  setOnboardingAgent(agent: OnboardingAgent): void {
    this.onboardingAgent = agent;
  }

  /**
   * Set provisioning agent
   */
  setProvisioningAgent(agent: ProvisioningAgent): void {
    this.provisioningAgent = agent;
  }

  // ==========================================================================
  // Utility Methods
  // ==========================================================================

  /**
   * Get active workflow count
   */
  getActiveWorkflowCount(): number {
    return this.activeWorkflows.size;
  }

  /**
   * Check if workflow is active
   */
  isWorkflowActive(workflowId: string): boolean {
    return this.activeWorkflows.has(workflowId);
  }
}
