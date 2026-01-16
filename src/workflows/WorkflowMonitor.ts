/**
 * Workflow Monitor
 * 
 * Tracks workflow execution metrics, logs state transitions,
 * and provides workflow status queries
 */

import {
  WorkflowState,
  WorkflowStatus,
  WorkflowType,
  Checkpoint,
} from '../shared/types/models';
import { WorkflowStateStore } from '../data/WorkflowStateStore';
import { AuditLogger } from '../data/AuditLogger';
import { CheckpointManager } from './CheckpointManager';

// ============================================================================
// Workflow Monitor Configuration
// ============================================================================

export interface WorkflowMonitorConfig {
  stateStore: WorkflowStateStore;
  auditLogger: AuditLogger;
  checkpointManager: CheckpointManager;
}

// ============================================================================
// Workflow Metrics
// ============================================================================

export interface WorkflowMetrics {
  workflowId: string;
  workflowType: WorkflowType;
  status: WorkflowStatus;
  createdAt: Date;
  updatedAt: Date;
  durationMs: number;
  currentStep: string;
  checkpointCount: number;
  successfulCheckpoints: number;
  failedCheckpoints: number;
  completionPercentage: number;
}

export interface WorkflowExecutionMetrics {
  totalWorkflows: number;
  activeWorkflows: number;
  completedWorkflows: number;
  failedWorkflows: number;
  cancelledWorkflows: number;
  averageDurationMs: number;
  successRate: number;
}

export interface WorkflowStatusQuery {
  workflowId: string;
  status: WorkflowStatus;
  currentStep: string;
  checkpoints: Checkpoint[];
  lastCheckpointTimestamp?: Date;
  canRecover: boolean;
  estimatedCompletion?: Date;
}

// ============================================================================
// State Transition Event
// ============================================================================

export interface StateTransitionEvent {
  workflowId: string;
  fromStatus: WorkflowStatus;
  toStatus: WorkflowStatus;
  timestamp: Date;
  reason?: string;
}

// ============================================================================
// Workflow Monitor
// ============================================================================

export class WorkflowMonitor {
  private stateStore: WorkflowStateStore;
  private auditLogger: AuditLogger;
  private checkpointManager: CheckpointManager;
  private stateTransitionListeners: Array<
    (event: StateTransitionEvent) => void
  > = [];

  constructor(config: WorkflowMonitorConfig) {
    this.stateStore = config.stateStore;
    this.auditLogger = config.auditLogger;
    this.checkpointManager = config.checkpointManager;
  }

  // ==========================================================================
  // Workflow Metrics
  // ==========================================================================

  /**
   * Get metrics for a specific workflow
   */
  async getWorkflowMetrics(workflowId: string): Promise<WorkflowMetrics> {
    const state = await this.stateStore.loadWorkflowState(workflowId);

    if (!state) {
      throw new Error(`Workflow not found: ${workflowId}`);
    }

    // Calculate duration
    const durationMs = state.updatedAt.getTime() - state.createdAt.getTime();

    // Get checkpoint statistics
    const checkpointStats = await this.checkpointManager.getCheckpointStatistics(
      workflowId
    );

    // Calculate completion percentage based on checkpoints
    // This is a simplified calculation - in a real system, you'd want to
    // calculate based on the total number of steps in the workflow definition
    const completionPercentage =
      state.status === 'COMPLETED'
        ? 100
        : state.status === 'FAILED' || state.status === 'CANCELLED'
        ? 0
        : checkpointStats.successRate * 100;

    return {
      workflowId: state.workflowId,
      workflowType: state.type,
      status: state.status,
      createdAt: state.createdAt,
      updatedAt: state.updatedAt,
      durationMs,
      currentStep: state.currentStep,
      checkpointCount: checkpointStats.total,
      successfulCheckpoints: checkpointStats.successful,
      failedCheckpoints: checkpointStats.failed,
      completionPercentage,
    };
  }

  /**
   * Get execution metrics across all workflows
   */
  async getExecutionMetrics(): Promise<WorkflowExecutionMetrics> {
    const workflowIds = await this.stateStore.listWorkflows();

    let totalWorkflows = 0;
    let activeWorkflows = 0;
    let completedWorkflows = 0;
    let failedWorkflows = 0;
    let cancelledWorkflows = 0;
    let totalDurationMs = 0;

    for (const workflowId of workflowIds) {
      const metadata = await this.stateStore.getWorkflowMetadata(workflowId);

      if (!metadata) {
        continue;
      }

      totalWorkflows++;

      switch (metadata.status) {
        case 'PENDING':
        case 'IN_PROGRESS':
          activeWorkflows++;
          break;
        case 'COMPLETED':
          completedWorkflows++;
          totalDurationMs +=
            metadata.updatedAt.getTime() - metadata.createdAt.getTime();
          break;
        case 'FAILED':
          failedWorkflows++;
          break;
        case 'CANCELLED':
          cancelledWorkflows++;
          break;
      }
    }

    const averageDurationMs =
      completedWorkflows > 0 ? totalDurationMs / completedWorkflows : 0;

    const successRate =
      totalWorkflows > 0 ? completedWorkflows / totalWorkflows : 0;

    return {
      totalWorkflows,
      activeWorkflows,
      completedWorkflows,
      failedWorkflows,
      cancelledWorkflows,
      averageDurationMs,
      successRate,
    };
  }

  // ==========================================================================
  // Workflow Status Queries
  // ==========================================================================

  /**
   * Query workflow status with detailed information
   */
  async queryWorkflowStatus(workflowId: string): Promise<WorkflowStatusQuery> {
    const state = await this.stateStore.loadWorkflowState(workflowId);

    if (!state) {
      throw new Error(`Workflow not found: ${workflowId}`);
    }

    // Get checkpoints
    const checkpoints = await this.checkpointManager.getAllCheckpoints(workflowId);

    // Get last checkpoint timestamp
    const lastCheckpoint = await this.checkpointManager.getLastCheckpoint(workflowId);
    const lastCheckpointTimestamp = lastCheckpoint?.timestamp;

    // Check if workflow can be recovered
    const canRecover = await this.checkpointManager.canRecover(workflowId);

    // Estimate completion time (simplified calculation)
    let estimatedCompletion: Date | undefined;

    if (state.status === 'IN_PROGRESS' && checkpoints.length > 0) {
      const metrics = await this.getWorkflowMetrics(workflowId);
      const avgCheckpointDuration = metrics.durationMs / checkpoints.length;
      
      // Assume 5 total steps (simplified)
      const remainingSteps = 5 - checkpoints.length;
      const estimatedRemainingMs = remainingSteps * avgCheckpointDuration;

      estimatedCompletion = new Date(Date.now() + estimatedRemainingMs);
    }

    return {
      workflowId: state.workflowId,
      status: state.status,
      currentStep: state.currentStep,
      checkpoints,
      lastCheckpointTimestamp,
      canRecover,
      estimatedCompletion,
    };
  }

  /**
   * Get workflows by status
   */
  async getWorkflowsByStatus(status: WorkflowStatus): Promise<string[]> {
    const workflowIds = await this.stateStore.listWorkflows();
    const matchingWorkflows: string[] = [];

    for (const workflowId of workflowIds) {
      const metadata = await this.stateStore.getWorkflowMetadata(workflowId);

      if (metadata && metadata.status === status) {
        matchingWorkflows.push(workflowId);
      }
    }

    return matchingWorkflows;
  }

  /**
   * Get active workflows
   */
  async getActiveWorkflows(): Promise<string[]> {
    const pending = await this.getWorkflowsByStatus('PENDING');
    const inProgress = await this.getWorkflowsByStatus('IN_PROGRESS');

    return [...pending, ...inProgress];
  }

  /**
   * Get failed workflows
   */
  async getFailedWorkflows(): Promise<string[]> {
    return this.getWorkflowsByStatus('FAILED');
  }

  /**
   * Get completed workflows
   */
  async getCompletedWorkflows(): Promise<string[]> {
    return this.getWorkflowsByStatus('COMPLETED');
  }

  // ==========================================================================
  // State Transition Logging
  // ==========================================================================

  /**
   * Log a state transition
   */
  async logStateTransition(
    workflowId: string,
    fromStatus: WorkflowStatus,
    toStatus: WorkflowStatus,
    reason?: string
  ): Promise<void> {
    const event: StateTransitionEvent = {
      workflowId,
      fromStatus,
      toStatus,
      timestamp: new Date(),
      reason,
    };

    // Log to audit logger
    await this.auditLogger.logSuccess(
      'workflow-monitor',
      'SYSTEM',
      'WORKFLOW_STATE_TRANSITION',
      'WORKFLOW',
      workflowId,
      {
        fromStatus,
        toStatus,
        reason,
      }
    );

    // Notify listeners
    this.notifyStateTransitionListeners(event);
  }

  /**
   * Register a state transition listener
   */
  onStateTransition(listener: (event: StateTransitionEvent) => void): void {
    this.stateTransitionListeners.push(listener);
  }

  /**
   * Notify all state transition listeners
   */
  private notifyStateTransitionListeners(event: StateTransitionEvent): void {
    for (const listener of this.stateTransitionListeners) {
      try {
        listener(event);
      } catch (error) {
        // Log error but don't fail the transition
        console.error('Error in state transition listener:', error);
      }
    }
  }

  // ==========================================================================
  // Workflow Timeline
  // ==========================================================================

  /**
   * Get workflow execution timeline
   */
  async getWorkflowTimeline(workflowId: string): Promise<{
    workflowId: string;
    createdAt: Date;
    updatedAt: Date;
    checkpoints: {
      stepId: string;
      timestamp: Date;
      status: string;
      durationFromPreviousMs?: number;
    }[];
  }> {
    const state = await this.stateStore.loadWorkflowState(workflowId);

    if (!state) {
      throw new Error(`Workflow not found: ${workflowId}`);
    }

    const checkpointTimeline = await this.checkpointManager.getCheckpointTimeline(
      workflowId
    );

    const checkpointDurations = await this.checkpointManager.getCheckpointDurations(
      workflowId
    );

    // Merge timeline and durations
    const checkpoints = checkpointTimeline.map((cp, index) => {
      const duration = checkpointDurations.find(d => d.stepId === cp.stepId);

      return {
        stepId: cp.stepId,
        timestamp: cp.timestamp,
        status: cp.status,
        durationFromPreviousMs: duration?.durationMs,
      };
    });

    return {
      workflowId: state.workflowId,
      createdAt: state.createdAt,
      updatedAt: state.updatedAt,
      checkpoints,
    };
  }

  // ==========================================================================
  // Workflow Health Checks
  // ==========================================================================

  /**
   * Check if a workflow is healthy
   */
  async isWorkflowHealthy(workflowId: string): Promise<{
    healthy: boolean;
    issues: string[];
  }> {
    const state = await this.stateStore.loadWorkflowState(workflowId);

    if (!state) {
      return {
        healthy: false,
        issues: ['Workflow not found'],
      };
    }

    const issues: string[] = [];

    // Check if workflow is stuck
    const timeSinceUpdate = Date.now() - state.updatedAt.getTime();
    const oneHourMs = 60 * 60 * 1000;

    if (
      state.status === 'IN_PROGRESS' &&
      timeSinceUpdate > oneHourMs
    ) {
      issues.push('Workflow has not been updated in over an hour');
    }

    // Check for failed checkpoints
    const failedCheckpoints = await this.checkpointManager.getFailedCheckpoints(
      workflowId
    );

    if (failedCheckpoints.length > 0) {
      issues.push(`Workflow has ${failedCheckpoints.length} failed checkpoints`);
    }

    // Validate checkpoints
    const validation = await this.checkpointManager.validateAllCheckpoints(
      workflowId
    );

    if (!validation.valid) {
      issues.push(
        `Workflow has ${validation.checkpointErrors.size} invalid checkpoints`
      );
    }

    return {
      healthy: issues.length === 0,
      issues,
    };
  }

  /**
   * Get unhealthy workflows
   */
  async getUnhealthyWorkflows(): Promise<{
    workflowId: string;
    issues: string[];
  }[]> {
    const workflowIds = await this.stateStore.listWorkflows();
    const unhealthyWorkflows: { workflowId: string; issues: string[] }[] = [];

    for (const workflowId of workflowIds) {
      const health = await this.isWorkflowHealthy(workflowId);

      if (!health.healthy) {
        unhealthyWorkflows.push({
          workflowId,
          issues: health.issues,
        });
      }
    }

    return unhealthyWorkflows;
  }

  // ==========================================================================
  // Workflow Statistics
  // ==========================================================================

  /**
   * Get workflow statistics by type
   */
  async getWorkflowStatisticsByType(
    workflowType: WorkflowType
  ): Promise<{
    workflowType: WorkflowType;
    total: number;
    completed: number;
    failed: number;
    averageDurationMs: number;
    successRate: number;
  }> {
    const workflowIds = await this.stateStore.listWorkflows();

    let total = 0;
    let completed = 0;
    let failed = 0;
    let totalDurationMs = 0;

    for (const workflowId of workflowIds) {
      const state = await this.stateStore.loadWorkflowState(workflowId);

      if (!state || state.type !== workflowType) {
        continue;
      }

      total++;

      if (state.status === 'COMPLETED') {
        completed++;
        totalDurationMs += state.updatedAt.getTime() - state.createdAt.getTime();
      } else if (state.status === 'FAILED') {
        failed++;
      }
    }

    const averageDurationMs = completed > 0 ? totalDurationMs / completed : 0;
    const successRate = total > 0 ? completed / total : 0;

    return {
      workflowType,
      total,
      completed,
      failed,
      averageDurationMs,
      successRate,
    };
  }
}
