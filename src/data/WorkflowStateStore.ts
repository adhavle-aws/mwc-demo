/**
 * Workflow State Store
 * Provides state persistence layer for workflow management
 * Implements checkpoint creation and retrieval for workflow recovery
 */

import {
  WorkflowState,
  Checkpoint,
  WorkflowStatus,
  CheckpointStatus,
} from '../shared/types/models';
import {
  serializeWorkflowState,
  deserializeWorkflowState,
  serializeCheckpoint,
  deserializeCheckpoint,
} from '../shared/utils/serialization';
import { validateWorkflowState } from '../shared/utils/validation';

// ============================================================================
// Storage Interface
// ============================================================================

/**
 * Abstract storage interface for workflow state persistence
 * Can be implemented with different backends (in-memory, file system, database)
 */
export interface IWorkflowStorage {
  save(key: string, value: string): Promise<void>;
  load(key: string): Promise<string | null>;
  delete(key: string): Promise<void>;
  list(prefix: string): Promise<string[]>;
}

// ============================================================================
// In-Memory Storage Implementation
// ============================================================================

/**
 * Simple in-memory storage implementation for testing and development
 */
export class InMemoryStorage implements IWorkflowStorage {
  private storage: Map<string, string> = new Map();

  async save(key: string, value: string): Promise<void> {
    this.storage.set(key, value);
  }

  async load(key: string): Promise<string | null> {
    return this.storage.get(key) || null;
  }

  async delete(key: string): Promise<void> {
    this.storage.delete(key);
  }

  async list(prefix: string): Promise<string[]> {
    const keys: string[] = [];
    for (const key of this.storage.keys()) {
      if (key.startsWith(prefix)) {
        keys.push(key);
      }
    }
    return keys;
  }

  // Utility method for testing
  clear(): void {
    this.storage.clear();
  }
}

// ============================================================================
// Workflow State Store
// ============================================================================

export class WorkflowStateStore {
  private storage: IWorkflowStorage;
  private readonly STATE_PREFIX = 'workflow:state:';
  private readonly CHECKPOINT_PREFIX = 'workflow:checkpoint:';
  private readonly VERSION_PREFIX = 'workflow:version:';

  constructor(storage?: IWorkflowStorage) {
    this.storage = storage || new InMemoryStorage();
  }

  // ==========================================================================
  // Workflow State Operations
  // ==========================================================================

  /**
   * Save workflow state to storage
   * Validates state before saving and updates the updatedAt timestamp
   */
  async saveWorkflowState(state: WorkflowState): Promise<void> {
    // Update timestamp
    state.updatedAt = new Date();

    // Validate before saving
    validateWorkflowState(state);

    const key = this.getStateKey(state.workflowId);
    const serialized = serializeWorkflowState(state);
    await this.storage.save(key, serialized);

    // Save version for migration tracking
    await this.saveVersion(state.workflowId, '1.0.0');
  }

  /**
   * Load workflow state from storage
   */
  async loadWorkflowState(workflowId: string): Promise<WorkflowState | null> {
    const key = this.getStateKey(workflowId);
    const serialized = await this.storage.load(key);

    if (!serialized) {
      return null;
    }

    const state = deserializeWorkflowState(serialized);
    
    // Check if migration is needed
    const version = await this.getVersion(workflowId);
    if (version && version !== '1.0.0') {
      // Future: Handle state migrations here
    }

    return state;
  }

  /**
   * Delete workflow state from storage
   */
  async deleteWorkflowState(workflowId: string): Promise<void> {
    const key = this.getStateKey(workflowId);
    await this.storage.delete(key);
    
    // Also delete version
    const versionKey = this.getVersionKey(workflowId);
    await this.storage.delete(versionKey);
  }

  /**
   * List all workflow IDs
   */
  async listWorkflows(): Promise<string[]> {
    const keys = await this.storage.list(this.STATE_PREFIX);
    return keys.map((key) => key.replace(this.STATE_PREFIX, ''));
  }

  /**
   * Update workflow status
   */
  async updateWorkflowStatus(
    workflowId: string,
    status: WorkflowStatus
  ): Promise<void> {
    const state = await this.loadWorkflowState(workflowId);
    if (!state) {
      throw new Error(`Workflow not found: ${workflowId}`);
    }

    state.status = status;
    await this.saveWorkflowState(state);
  }

  /**
   * Update current workflow step
   */
  async updateCurrentStep(
    workflowId: string,
    stepId: string
  ): Promise<void> {
    const state = await this.loadWorkflowState(workflowId);
    if (!state) {
      throw new Error(`Workflow not found: ${workflowId}`);
    }

    state.currentStep = stepId;
    await this.saveWorkflowState(state);
  }

  // ==========================================================================
  // Checkpoint Operations
  // ==========================================================================

  /**
   * Create a checkpoint for a workflow
   * Checkpoints enable recovery from the last successful point
   */
  async createCheckpoint(
    workflowId: string,
    checkpoint: Checkpoint
  ): Promise<void> {
    // Load current state
    const state = await this.loadWorkflowState(workflowId);
    if (!state) {
      throw new Error(`Workflow not found: ${workflowId}`);
    }

    // Add checkpoint to state
    state.checkpoints.push(checkpoint);
    await this.saveWorkflowState(state);

    // Also save checkpoint separately for quick access
    const checkpointKey = this.getCheckpointKey(workflowId, checkpoint.stepId);
    const serialized = serializeCheckpoint(checkpoint);
    await this.storage.save(checkpointKey, serialized);
  }

  /**
   * Retrieve a specific checkpoint
   */
  async getCheckpoint(
    workflowId: string,
    stepId: string
  ): Promise<Checkpoint | null> {
    const key = this.getCheckpointKey(workflowId, stepId);
    const serialized = await this.storage.load(key);

    if (!serialized) {
      return null;
    }

    return deserializeCheckpoint(serialized);
  }

  /**
   * Get all checkpoints for a workflow
   */
  async getCheckpoints(workflowId: string): Promise<Checkpoint[]> {
    const state = await this.loadWorkflowState(workflowId);
    if (!state) {
      return [];
    }

    return state.checkpoints;
  }

  /**
   * Get the last successful checkpoint for recovery
   */
  async getLastSuccessfulCheckpoint(
    workflowId: string
  ): Promise<Checkpoint | null> {
    const checkpoints = await this.getCheckpoints(workflowId);
    
    // Find the last checkpoint with SUCCESS status
    for (let i = checkpoints.length - 1; i >= 0; i--) {
      if (checkpoints[i].status === 'SUCCESS') {
        return checkpoints[i];
      }
    }

    return null;
  }

  /**
   * List all checkpoint step IDs for a workflow
   */
  async listCheckpointSteps(workflowId: string): Promise<string[]> {
    const prefix = this.getCheckpointPrefix(workflowId);
    const keys = await this.storage.list(prefix);
    return keys.map((key) => {
      const parts = key.split(':');
      return parts[parts.length - 1];
    });
  }

  // ==========================================================================
  // Version Management
  // ==========================================================================

  /**
   * Save state version for migration tracking
   */
  private async saveVersion(
    workflowId: string,
    version: string
  ): Promise<void> {
    const key = this.getVersionKey(workflowId);
    await this.storage.save(key, version);
  }

  /**
   * Get state version
   */
  private async getVersion(workflowId: string): Promise<string | null> {
    const key = this.getVersionKey(workflowId);
    return await this.storage.load(key);
  }

  // ==========================================================================
  // Key Generation Helpers
  // ==========================================================================

  private getStateKey(workflowId: string): string {
    return `${this.STATE_PREFIX}${workflowId}`;
  }

  private getCheckpointKey(workflowId: string, stepId: string): string {
    return `${this.CHECKPOINT_PREFIX}${workflowId}:${stepId}`;
  }

  private getCheckpointPrefix(workflowId: string): string {
    return `${this.CHECKPOINT_PREFIX}${workflowId}:`;
  }

  private getVersionKey(workflowId: string): string {
    return `${this.VERSION_PREFIX}${workflowId}`;
  }

  // ==========================================================================
  // Utility Methods
  // ==========================================================================

  /**
   * Check if a workflow exists
   */
  async workflowExists(workflowId: string): Promise<boolean> {
    const state = await this.loadWorkflowState(workflowId);
    return state !== null;
  }

  /**
   * Get workflow metadata without loading full state
   */
  async getWorkflowMetadata(workflowId: string): Promise<{
    workflowId: string;
    type: string;
    status: string;
    createdAt: Date;
    updatedAt: Date;
  } | null> {
    const state = await this.loadWorkflowState(workflowId);
    if (!state) {
      return null;
    }

    return {
      workflowId: state.workflowId,
      type: state.type,
      status: state.status,
      createdAt: state.createdAt,
      updatedAt: state.updatedAt,
    };
  }
}
