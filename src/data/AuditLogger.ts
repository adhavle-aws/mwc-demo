/**
 * Audit Logging System
 * Provides comprehensive audit trail for all operations
 * Logs include timestamps, actor information, and operation details
 */

import {
  AuditLog,
  ErrorInfo,
} from '../shared/types/models';
import {
  serializeAuditLog,
  deserializeAuditLog,
} from '../shared/utils/serialization';
import { validateAuditLog } from '../shared/utils/validation';

// ============================================================================
// Storage Interface
// ============================================================================

/**
 * Abstract storage interface for audit log persistence
 */
export interface IAuditStorage {
  append(key: string, value: string): Promise<void>;
  query(
    startTime: Date,
    endTime: Date,
    filters?: AuditLogFilters
  ): Promise<string[]>;
  count(filters?: AuditLogFilters): Promise<number>;
}

// ============================================================================
// Audit Log Filters
// ============================================================================

export interface AuditLogFilters {
  actorId?: string;
  actorType?: 'USER' | 'AGENT' | 'SYSTEM';
  operation?: string;
  resourceType?: string;
  resourceId?: string;
  result?: 'SUCCESS' | 'FAILURE';
}

// ============================================================================
// In-Memory Audit Storage
// ============================================================================

/**
 * Simple in-memory storage for audit logs (for testing and development)
 */
export class InMemoryAuditStorage implements IAuditStorage {
  private logs: AuditLog[] = [];

  async append(key: string, value: string): Promise<void> {
    const log = deserializeAuditLog(value);
    this.logs.push(log);
  }

  async query(
    startTime: Date,
    endTime: Date,
    filters?: AuditLogFilters
  ): Promise<string[]> {
    let filtered = this.logs.filter(
      (log) => log.timestamp >= startTime && log.timestamp <= endTime
    );

    if (filters) {
      if (filters.actorId) {
        filtered = filtered.filter((log) => log.actorId === filters.actorId);
      }
      if (filters.actorType) {
        filtered = filtered.filter((log) => log.actorType === filters.actorType);
      }
      if (filters.operation) {
        filtered = filtered.filter((log) => log.operation === filters.operation);
      }
      if (filters.resourceType) {
        filtered = filtered.filter(
          (log) => log.resourceType === filters.resourceType
        );
      }
      if (filters.resourceId) {
        filtered = filtered.filter((log) => log.resourceId === filters.resourceId);
      }
      if (filters.result) {
        filtered = filtered.filter((log) => log.result === filters.result);
      }
    }

    return filtered.map((log) => serializeAuditLog(log));
  }

  async count(filters?: AuditLogFilters): Promise<number> {
    const now = new Date();
    const startOfTime = new Date(0);
    const results = await this.query(startOfTime, now, filters);
    return results.length;
  }

  // Utility method for testing
  clear(): void {
    this.logs = [];
  }

  // Utility method for testing
  getAll(): AuditLog[] {
    return [...this.logs];
  }
}

// ============================================================================
// Audit Logger
// ============================================================================

export class AuditLogger {
  private storage: IAuditStorage;
  private readonly LOG_PREFIX = 'audit:log:';

  constructor(storage?: IAuditStorage) {
    this.storage = storage || new InMemoryAuditStorage();
  }

  // ==========================================================================
  // Core Logging Operations
  // ==========================================================================

  /**
   * Log a successful operation
   */
  async logSuccess(
    actorId: string,
    actorType: 'USER' | 'AGENT' | 'SYSTEM',
    operation: string,
    resourceType: string,
    resourceId: string,
    operationDetails: Record<string, any> = {}
  ): Promise<string> {
    const log: AuditLog = {
      logId: this.generateLogId(),
      timestamp: new Date(),
      actorId,
      actorType,
      operation,
      resourceType,
      resourceId,
      operationDetails,
      result: 'SUCCESS',
    };

    await this.writeLog(log);
    return log.logId;
  }

  /**
   * Log a failed operation
   */
  async logFailure(
    actorId: string,
    actorType: 'USER' | 'AGENT' | 'SYSTEM',
    operation: string,
    resourceType: string,
    resourceId: string,
    errorDetails: ErrorInfo,
    operationDetails: Record<string, any> = {}
  ): Promise<string> {
    const log: AuditLog = {
      logId: this.generateLogId(),
      timestamp: new Date(),
      actorId,
      actorType,
      operation,
      resourceType,
      resourceId,
      operationDetails,
      result: 'FAILURE',
      errorDetails,
    };

    await this.writeLog(log);
    return log.logId;
  }

  /**
   * Log an AWS API call
   */
  async logAWSAPICall(
    actorId: string,
    service: string,
    apiCall: string,
    resourceId: string,
    parameters: Record<string, any>,
    result: 'SUCCESS' | 'FAILURE',
    errorDetails?: ErrorInfo
  ): Promise<string> {
    const log: AuditLog = {
      logId: this.generateLogId(),
      timestamp: new Date(),
      actorId,
      actorType: 'AGENT',
      operation: `AWS:${service}:${apiCall}`,
      resourceType: service,
      resourceId,
      operationDetails: {
        parameters,
        apiCall,
      },
      result,
      errorDetails,
    };

    await this.writeLog(log);
    return log.logId;
  }

  /**
   * Log a resource modification
   */
  async logResourceModification(
    actorId: string,
    actorType: 'USER' | 'AGENT' | 'SYSTEM',
    resourceType: string,
    resourceId: string,
    modificationType: 'CREATE' | 'UPDATE' | 'DELETE',
    changes: Record<string, any>,
    result: 'SUCCESS' | 'FAILURE',
    errorDetails?: ErrorInfo
  ): Promise<string> {
    const log: AuditLog = {
      logId: this.generateLogId(),
      timestamp: new Date(),
      actorId,
      actorType,
      operation: `${modificationType}_${resourceType}`,
      resourceType,
      resourceId,
      operationDetails: {
        modificationType,
        changes,
      },
      result,
      errorDetails,
    };

    await this.writeLog(log);
    return log.logId;
  }

  // ==========================================================================
  // Query Operations
  // ==========================================================================

  /**
   * Query audit logs by time range
   */
  async queryLogs(
    startTime: Date,
    endTime: Date,
    filters?: AuditLogFilters
  ): Promise<AuditLog[]> {
    const serialized = await this.storage.query(startTime, endTime, filters);
    return serialized.map((s) => deserializeAuditLog(s));
  }

  /**
   * Get logs for a specific actor
   */
  async getLogsByActor(
    actorId: string,
    startTime: Date,
    endTime: Date
  ): Promise<AuditLog[]> {
    return this.queryLogs(startTime, endTime, { actorId });
  }

  /**
   * Get logs for a specific resource
   */
  async getLogsByResource(
    resourceType: string,
    resourceId: string,
    startTime: Date,
    endTime: Date
  ): Promise<AuditLog[]> {
    return this.queryLogs(startTime, endTime, { resourceType, resourceId });
  }

  /**
   * Get logs for a specific operation
   */
  async getLogsByOperation(
    operation: string,
    startTime: Date,
    endTime: Date
  ): Promise<AuditLog[]> {
    return this.queryLogs(startTime, endTime, { operation });
  }

  /**
   * Get failed operations
   */
  async getFailedOperations(
    startTime: Date,
    endTime: Date,
    filters?: Omit<AuditLogFilters, 'result'>
  ): Promise<AuditLog[]> {
    return this.queryLogs(startTime, endTime, { ...filters, result: 'FAILURE' });
  }

  /**
   * Get successful operations
   */
  async getSuccessfulOperations(
    startTime: Date,
    endTime: Date,
    filters?: Omit<AuditLogFilters, 'result'>
  ): Promise<AuditLog[]> {
    return this.queryLogs(startTime, endTime, { ...filters, result: 'SUCCESS' });
  }

  // ==========================================================================
  // Statistics and Reporting
  // ==========================================================================

  /**
   * Count logs matching filters
   */
  async countLogs(filters?: AuditLogFilters): Promise<number> {
    return this.storage.count(filters);
  }

  /**
   * Get operation statistics
   */
  async getOperationStats(
    startTime: Date,
    endTime: Date
  ): Promise<{
    totalOperations: number;
    successfulOperations: number;
    failedOperations: number;
    successRate: number;
  }> {
    const allLogs = await this.queryLogs(startTime, endTime);
    const successful = allLogs.filter((log) => log.result === 'SUCCESS').length;
    const failed = allLogs.filter((log) => log.result === 'FAILURE').length;
    const total = allLogs.length;

    return {
      totalOperations: total,
      successfulOperations: successful,
      failedOperations: failed,
      successRate: total > 0 ? successful / total : 0,
    };
  }

  /**
   * Get actor activity summary
   */
  async getActorActivity(
    actorId: string,
    startTime: Date,
    endTime: Date
  ): Promise<{
    actorId: string;
    totalOperations: number;
    operationsByType: Record<string, number>;
    successRate: number;
  }> {
    const logs = await this.getLogsByActor(actorId, startTime, endTime);
    const operationsByType: Record<string, number> = {};

    logs.forEach((log) => {
      operationsByType[log.operation] =
        (operationsByType[log.operation] || 0) + 1;
    });

    const successful = logs.filter((log) => log.result === 'SUCCESS').length;

    return {
      actorId,
      totalOperations: logs.length,
      operationsByType,
      successRate: logs.length > 0 ? successful / logs.length : 0,
    };
  }

  // ==========================================================================
  // Private Helper Methods
  // ==========================================================================

  /**
   * Write log to storage
   */
  private async writeLog(log: AuditLog): Promise<void> {
    // Validate log before writing
    validateAuditLog(log);

    const key = this.getLogKey(log.logId);
    const serialized = serializeAuditLog(log);
    await this.storage.append(key, serialized);
  }

  /**
   * Generate unique log ID
   */
  private generateLogId(): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 15);
    return `log-${timestamp}-${random}`;
  }

  /**
   * Get storage key for a log
   */
  private getLogKey(logId: string): string {
    return `${this.LOG_PREFIX}${logId}`;
  }
}
