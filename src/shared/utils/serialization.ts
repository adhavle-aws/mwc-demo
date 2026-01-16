/**
 * Serialization and deserialization utilities for data models
 * Handles conversion between TypeScript objects and JSON with proper type handling
 */

import {
  CustomerRequirements,
  WorkflowState,
  CFNPackage,
  AuditLog,
  Checkpoint,
  ProjectTimeline,
  Milestone,
} from '../types/models';

// ============================================================================
// Date Handling Utilities
// ============================================================================

/**
 * Converts Date objects to ISO strings for serialization
 */
function serializeDate(date: Date): string {
  return date.toISOString();
}

/**
 * Converts ISO strings back to Date objects for deserialization
 */
function deserializeDate(dateString: string): Date {
  const date = new Date(dateString);
  if (isNaN(date.getTime())) {
    throw new Error(`Invalid date string: ${dateString}`);
  }
  return date;
}

// ============================================================================
// Customer Requirements Serialization
// ============================================================================

export function serializeCustomerRequirements(
  requirements: CustomerRequirements
): string {
  const serializable = {
    ...requirements,
    timeline: {
      ...requirements.timeline,
      startDate: serializeDate(requirements.timeline.startDate),
      targetCompletionDate: serializeDate(
        requirements.timeline.targetCompletionDate
      ),
      milestones: requirements.timeline.milestones.map((m) => ({
        ...m,
        targetDate: serializeDate(m.targetDate),
      })),
    },
  };
  return JSON.stringify(serializable);
}

export function deserializeCustomerRequirements(
  json: string
): CustomerRequirements {
  const parsed = JSON.parse(json);
  return {
    ...parsed,
    timeline: {
      ...parsed.timeline,
      startDate: deserializeDate(parsed.timeline.startDate),
      targetCompletionDate: deserializeDate(
        parsed.timeline.targetCompletionDate
      ),
      milestones: parsed.timeline.milestones.map((m: any) => ({
        ...m,
        targetDate: deserializeDate(m.targetDate),
      })),
    },
  };
}

// ============================================================================
// Workflow State Serialization
// ============================================================================

export function serializeWorkflowState(state: WorkflowState): string {
  const serializable = {
    ...state,
    createdAt: serializeDate(state.createdAt),
    updatedAt: serializeDate(state.updatedAt),
    checkpoints: state.checkpoints.map((checkpoint) => ({
      ...checkpoint,
      timestamp: serializeDate(checkpoint.timestamp),
    })),
  };
  return JSON.stringify(serializable);
}

export function deserializeWorkflowState(json: string): WorkflowState {
  const parsed = JSON.parse(json);
  return {
    ...parsed,
    createdAt: deserializeDate(parsed.createdAt),
    updatedAt: deserializeDate(parsed.updatedAt),
    checkpoints: parsed.checkpoints.map((checkpoint: any) => ({
      ...checkpoint,
      timestamp: deserializeDate(checkpoint.timestamp),
    })),
  };
}

// ============================================================================
// CFN Package Serialization
// ============================================================================

export function serializeCFNPackage(pkg: CFNPackage): string {
  return JSON.stringify(pkg);
}

export function deserializeCFNPackage(json: string): CFNPackage {
  return JSON.parse(json);
}

// ============================================================================
// Audit Log Serialization
// ============================================================================

export function serializeAuditLog(log: AuditLog): string {
  const serializable = {
    ...log,
    timestamp: serializeDate(log.timestamp),
  };
  return JSON.stringify(serializable);
}

export function deserializeAuditLog(json: string): AuditLog {
  const parsed = JSON.parse(json);
  return {
    ...parsed,
    timestamp: deserializeDate(parsed.timestamp),
  };
}

// ============================================================================
// Checkpoint Serialization
// ============================================================================

export function serializeCheckpoint(checkpoint: Checkpoint): string {
  const serializable = {
    ...checkpoint,
    timestamp: serializeDate(checkpoint.timestamp),
  };
  return JSON.stringify(serializable);
}

export function deserializeCheckpoint(json: string): Checkpoint {
  const parsed = JSON.parse(json);
  return {
    ...parsed,
    timestamp: deserializeDate(parsed.timestamp),
  };
}

// ============================================================================
// Generic Serialization Utilities
// ============================================================================

/**
 * Serializes any object to JSON with proper Date handling
 */
export function serialize<T>(obj: T): string {
  return JSON.stringify(obj, (key, value) => {
    if (value instanceof Date) {
      return serializeDate(value);
    }
    return value;
  });
}

/**
 * Deserializes JSON to an object with Date field restoration
 * @param json - JSON string to deserialize
 * @param dateFields - Array of field paths that should be converted to Dates
 */
export function deserialize<T>(json: string, dateFields: string[] = []): T {
  const parsed = JSON.parse(json);
  
  // Convert specified fields to Dates
  dateFields.forEach((fieldPath) => {
    const parts = fieldPath.split('.');
    let current: any = parsed;
    
    for (let i = 0; i < parts.length - 1; i++) {
      if (current[parts[i]] === undefined) {
        return; // Field doesn't exist, skip
      }
      current = current[parts[i]];
    }
    
    const lastPart = parts[parts.length - 1];
    if (current[lastPart] !== undefined) {
      current[lastPart] = deserializeDate(current[lastPart]);
    }
  });
  
  return parsed as T;
}

// ============================================================================
// Batch Serialization
// ============================================================================

/**
 * Serializes an array of objects
 */
export function serializeBatch<T>(items: T[]): string {
  return JSON.stringify(items);
}

/**
 * Deserializes an array of objects
 */
export function deserializeBatch<T>(json: string): T[] {
  return JSON.parse(json);
}

// ============================================================================
// Pretty Print Utilities
// ============================================================================

/**
 * Serializes an object with pretty formatting for debugging
 */
export function serializePretty<T>(obj: T): string {
  return JSON.stringify(
    obj,
    (key, value) => {
      if (value instanceof Date) {
        return serializeDate(value);
      }
      return value;
    },
    2
  );
}
