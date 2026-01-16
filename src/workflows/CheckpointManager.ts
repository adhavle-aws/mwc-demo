/**
 * Checkpoint Manager
 * 
 * Manages checkpoint creation, storage, and retrieval for workflow recovery
 * Provides utilities for checkpoint-based workflow recovery
 */

import { v4 as uuidv4 } from 'uuid';
import {
  Checkpoint,
  CheckpointStatus,
  WorkflowState,
  ErrorInfo,
} from '../shared/types/models';
import { WorkflowStateStore } from '../data/WorkflowStateStore';
import { AuditLogger } from '../data/AuditLogger';

// ============================================================================
// Checkpoint Manager Configuration
// ============================================================================

export interface CheckpointManagerConfig {
  stateStore: WorkflowStateStore;
  auditLogger: AuditLogger;
}

// ============================================================================
// Checkpoint Creation Options
// ============================================================================

export interface CheckpointOptions {
  stepId: string;
  agentId: string;
  status: CheckpointStatus;
  data?: Record<string, any>;
  errorDetails?: ErrorInfo;
}

// ============================================================================
// Checkpoint Recovery Info
// ============================================================================

export interface CheckpointRecoveryInfo {
  workflowId: string;
  lastSuccessfulCheckpoint: Checkpoint | null;
  failedCheckpoint: Checkpoint | null;
  canRecover: boolean;
  recoveryStepId: string | null;
}

// ============================================================================
// Checkpoint Manager
// ============================================================================

export class CheckpointManager {
  private stateStore: WorkflowStateStore;
  private auditLogger: AuditLogger;

  constructor(config: CheckpointManagerConfig) {
    this.stateStore = config.stateStore;
    this.auditLogger = config.auditLogger;
  }

  // ==========================================================================
  // Checkpoint Creation
  // ==========================================================================

  /**
   * Create a checkpoint for a workflow step
   */
  async createCheckpoint(
    workflowId: string,
    options: CheckpointOptions
  ): Promise<Checkpoint> {
    // Create checkpoint object
    const checkpoint: Checkpoint = {
      stepId: options.stepId,
      timestamp: new Date(),
      agentId: options.agentId,
      status: options.status,
      data: options.data || {},
      errorDetails: options.errorDetails,
    };

    // Store checkpoint
    await this.stateStore.createCheckpoint(workflowId, checkpoint);

    // Log checkpoint creation
    if (checkpoint.status === 'SUCCESS') {
      await this.auditLogger.logSuccess(
        options.agentId,
        'AGENT',
        'CHECKPOINT_CREATED',
        'CHECKPOINT',
        options.stepId,
        {
          workflowId,
          stepId: options.stepId,
          status: checkpoint.status,
        }
      );
    } else {
      await this.auditLogger.logFailure(
        options.agentId,
        'AGENT',
        'CHECKPOINT_CREATED',
        'CHECKPOINT',
        options.stepId,
        checkpoint.errorDetails!,
        {
          workflowId,
          stepId: options.stepId,
          status: checkpoint.status,
        }
      );
    }

    return checkpoint;
  }

  /**
   * Create a success checkpoint
   */
  async createSuccessCheckpoint(
    workflowId: string,
    stepId: string,
    agentId: string,
    data?: Record<string, any>
  ): Promise<Checkpoint> {
    return this.createCheckpoint(workflowId, {
      stepId,
      agentId,
      status: 'SUCCESS',
      data,
    });
  }

  /**
   * Create a failure checkpoint
   */
  async createFailureCheckpoint(
    workflowId: string,
    stepId: string,
    agentId: string,
    error: Error,
    retryAttempt: number = 0
  ): Promise<Checkpoint> {
    const errorDetails: ErrorInfo = {
      errorId: uuidv4(),
      errorType: 'PERMANENT',
      errorCode: 'STEP_EXECUTION_FAILED',
      errorMessage: error.message,
      stackTrace: error.stack || '',
      retryAttempt,
    };

    return this.createCheckpoint(workflowId, {
      stepId,
      agentId,
      status: 'FAILURE',
      errorDetails,
    });
  }

  // ==========================================================================
  // Checkpoint Retrieval
  // ==========================================================================

  /**
   * Get a specific checkpoint
   */
  async getCheckpoint(
    workflowId: string,
    stepId: string
  ): Promise<Checkpoint | null> {
    return this.stateStore.getCheckpoint(workflowId, stepId);
  }

  /**
   * Get all checkpoints for a workflow
   */
  async getAllCheckpoints(workflowId: string): Promise<Checkpoint[]> {
    return this.stateStore.getCheckpoints(workflowId);
  }

  /**
   * Get the last successful checkpoint
   */
  async getLastSuccessfulCheckpoint(
    workflowId: string
  ): Promise<Checkpoint | null> {
    return this.stateStore.getLastSuccessfulCheckpoint(workflowId);
  }

  /**
   * Get the last checkpoint (regardless of status)
   */
  async getLastCheckpoint(workflowId: string): Promise<Checkpoint | null> {
    const checkpoints = await this.getAllCheckpoints(workflowId);

    if (checkpoints.length === 0) {
      return null;
    }

    return checkpoints[checkpoints.length - 1];
  }

  /**
   * Get all successful checkpoints
   */
  async getSuccessfulCheckpoints(workflowId: string): Promise<Checkpoint[]> {
    const checkpoints = await this.getAllCheckpoints(workflowId);
    return checkpoints.filter(cp => cp.status === 'SUCCESS');
  }

  /**
   * Get all failed checkpoints
   */
  async getFailedCheckpoints(workflowId: string): Promise<Checkpoint[]> {
    const checkpoints = await this.getAllCheckpoints(workflowId);
    return checkpoints.filter(cp => cp.status === 'FAILURE');
  }

  // ==========================================================================
  // Checkpoint Recovery
  // ==========================================================================

  /**
   * Get recovery information for a workflow
   */
  async getRecoveryInfo(workflowId: string): Promise<CheckpointRecoveryInfo> {
    const lastSuccessful = await this.getLastSuccessfulCheckpoint(workflowId);
    const lastCheckpoint = await this.getLastCheckpoint(workflowId);

    // Determine if there's a failed checkpoint
    const failedCheckpoint =
      lastCheckpoint && lastCheckpoint.status === 'FAILURE'
        ? lastCheckpoint
        : null;

    // Determine if recovery is possible
    const canRecover = lastSuccessful !== null;

    // Determine recovery step ID
    const recoveryStepId = lastSuccessful ? lastSuccessful.stepId : null;

    return {
      workflowId,
      lastSuccessfulCheckpoint: lastSuccessful,
      failedCheckpoint,
      canRecover,
      recoveryStepId,
    };
  }

  /**
   * Check if a workflow can be recovered
   */
  async canRecover(workflowId: string): Promise<boolean> {
    const info = await this.getRecoveryInfo(workflowId);
    return info.canRecover;
  }

  /**
   * Get the step ID to resume from for recovery
   */
  async getRecoveryStepId(workflowId: string): Promise<string | null> {
    const info = await this.getRecoveryInfo(workflowId);
    return info.recoveryStepId;
  }

  // ==========================================================================
  // Checkpoint Analysis
  // ==========================================================================

  /**
   * Get checkpoint statistics for a workflow
   */
  async getCheckpointStatistics(workflowId: string): Promise<{
    total: number;
    successful: number;
    failed: number;
    successRate: number;
  }> {
    const checkpoints = await this.getAllCheckpoints(workflowId);
    const successful = checkpoints.filter(cp => cp.status === 'SUCCESS').length;
    const failed = checkpoints.filter(cp => cp.status === 'FAILURE').length;

    return {
      total: checkpoints.length,
      successful,
      failed,
      successRate: checkpoints.length > 0 ? successful / checkpoints.length : 0,
    };
  }

  /**
   * Get checkpoint timeline for a workflow
   */
  async getCheckpointTimeline(workflowId: string): Promise<{
    stepId: string;
    timestamp: Date;
    status: CheckpointStatus;
    agentId: string;
  }[]> {
    const checkpoints = await this.getAllCheckpoints(workflowId);

    return checkpoints.map(cp => ({
      stepId: cp.stepId,
      timestamp: cp.timestamp,
      status: cp.status,
      agentId: cp.agentId,
    }));
  }

  /**
   * Get time between checkpoints
   */
  async getCheckpointDurations(workflowId: string): Promise<{
    stepId: string;
    durationMs: number;
  }[]> {
    const checkpoints = await this.getAllCheckpoints(workflowId);

    if (checkpoints.length < 2) {
      return [];
    }

    const durations: { stepId: string; durationMs: number }[] = [];

    for (let i = 1; i < checkpoints.length; i++) {
      const prevCheckpoint = checkpoints[i - 1];
      const currentCheckpoint = checkpoints[i];

      const durationMs =
        currentCheckpoint.timestamp.getTime() - prevCheckpoint.timestamp.getTime();

      durations.push({
        stepId: currentCheckpoint.stepId,
        durationMs,
      });
    }

    return durations;
  }

  // ==========================================================================
  // Checkpoint Validation
  // ==========================================================================

  /**
   * Validate checkpoint data integrity
   */
  async validateCheckpoint(
    workflowId: string,
    stepId: string
  ): Promise<{ valid: boolean; errors: string[] }> {
    const checkpoint = await this.getCheckpoint(workflowId, stepId);

    if (!checkpoint) {
      return {
        valid: false,
        errors: ['Checkpoint not found'],
      };
    }

    const errors: string[] = [];

    // Validate required fields
    if (!checkpoint.stepId) {
      errors.push('Missing stepId');
    }

    if (!checkpoint.timestamp) {
      errors.push('Missing timestamp');
    }

    if (!checkpoint.agentId) {
      errors.push('Missing agentId');
    }

    if (!checkpoint.status) {
      errors.push('Missing status');
    }

    // Validate status-specific requirements
    if (checkpoint.status === 'FAILURE' && !checkpoint.errorDetails) {
      errors.push('Failure checkpoint missing error details');
    }

    // Validate timestamp is not in the future
    if (checkpoint.timestamp > new Date()) {
      errors.push('Checkpoint timestamp is in the future');
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Validate all checkpoints for a workflow
   */
  async validateAllCheckpoints(workflowId: string): Promise<{
    valid: boolean;
    checkpointErrors: Map<string, string[]>;
  }> {
    const checkpoints = await this.getAllCheckpoints(workflowId);
    const checkpointErrors = new Map<string, string[]>();

    for (const checkpoint of checkpoints) {
      const validation = await this.validateCheckpoint(workflowId, checkpoint.stepId);

      if (!validation.valid) {
        checkpointErrors.set(checkpoint.stepId, validation.errors);
      }
    }

    return {
      valid: checkpointErrors.size === 0,
      checkpointErrors,
    };
  }

  // ==========================================================================
  // Checkpoint Cleanup
  // ==========================================================================

  /**
   * Get checkpoint count for a workflow
   */
  async getCheckpointCount(workflowId: string): Promise<number> {
    const checkpoints = await this.getAllCheckpoints(workflowId);
    return checkpoints.length;
  }

  /**
   * Check if workflow has any checkpoints
   */
  async hasCheckpoints(workflowId: string): Promise<boolean> {
    const count = await this.getCheckpointCount(workflowId);
    return count > 0;
  }
}
