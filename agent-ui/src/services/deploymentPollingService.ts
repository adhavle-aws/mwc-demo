// Deployment Polling Service
// Handles polling CloudFormation stack status with automatic updates

import { getStackStatus } from './agentService';
import type { StackStatusResponse } from '../types';

// ============================================================================
// Configuration
// ============================================================================

const POLL_INTERVAL_MS = 5000; // 5 seconds
const MAX_POLL_DURATION_MS = 3600000; // 1 hour max polling

// Terminal CloudFormation stack statuses
const TERMINAL_STATUSES = [
  'CREATE_COMPLETE',
  'CREATE_FAILED',
  'DELETE_COMPLETE',
  'DELETE_FAILED',
  'UPDATE_COMPLETE',
  'UPDATE_FAILED',
  'ROLLBACK_COMPLETE',
  'ROLLBACK_FAILED',
  'UPDATE_ROLLBACK_COMPLETE',
  'UPDATE_ROLLBACK_FAILED',
];

// ============================================================================
// Types
// ============================================================================

/**
 * Callback function for status updates
 */
export type StatusUpdateCallback = (status: StackStatusResponse) => void;

/**
 * Callback function for polling errors
 */
export type ErrorCallback = (error: Error) => void;

/**
 * Callback function for polling completion
 */
export type CompletionCallback = (
  status: StackStatusResponse,
  reason: 'terminal' | 'timeout' | 'stopped'
) => void;

/**
 * Polling options
 */
export interface PollingOptions {
  stackName: string;
  onUpdate: StatusUpdateCallback;
  onError?: ErrorCallback;
  onComplete?: CompletionCallback;
  pollInterval?: number;
  maxDuration?: number;
}

/**
 * Polling controller for managing active polling
 */
export interface PollingController {
  stop: () => void;
  isActive: () => boolean;
  getStackName: () => string;
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Check if a CloudFormation status is terminal
 */
export const isTerminalStatus = (status: string): boolean => {
  return TERMINAL_STATUSES.includes(status);
};

/**
 * Log polling events
 */
const logPolling = (stackName: string, message: string, data?: any): void => {
  console.log(`[PollingService] ${stackName}: ${message}`, data || '');
};

// ============================================================================
// Active Polling Management
// ============================================================================

// Track active polling sessions
const activePollers = new Map<string, { stop: () => void }>();

/**
 * Stop any existing polling for a stack
 */
const stopExistingPolling = (stackName: string): void => {
  const existing = activePollers.get(stackName);
  if (existing) {
    logPolling(stackName, 'Stopping existing polling session');
    existing.stop();
    activePollers.delete(stackName);
  }
};

// ============================================================================
// Main Polling Function
// ============================================================================

/**
 * Start polling CloudFormation stack status
 * 
 * @param options - Polling configuration options
 * @returns PollingController to manage the polling session
 * 
 * @example
 * ```typescript
 * const controller = startPolling({
 *   stackName: 'my-stack',
 *   onUpdate: (status) => {
 *     console.log('Status:', status.status);
 *     console.log('Resources:', status.resources);
 *   },
 *   onError: (error) => {
 *     console.error('Polling error:', error);
 *   },
 *   onComplete: (status, reason) => {
 *     console.log('Polling complete:', reason);
 *   }
 * });
 * 
 * // Later, to stop polling manually:
 * controller.stop();
 * ```
 */
export const startPolling = (options: PollingOptions): PollingController => {
  const {
    stackName,
    onUpdate,
    onError,
    onComplete,
    pollInterval = POLL_INTERVAL_MS,
    maxDuration = MAX_POLL_DURATION_MS,
  } = options;

  // Stop any existing polling for this stack
  stopExistingPolling(stackName);

  let isActive = true;
  let timeoutId: ReturnType<typeof setTimeout> | null = null;
  const startTime = Date.now();

  logPolling(stackName, 'Starting polling', {
    pollInterval,
    maxDuration,
  });

  /**
   * Stop the polling session
   */
  const stop = (): void => {
    if (!isActive) {
      return;
    }

    isActive = false;
    if (timeoutId) {
      clearTimeout(timeoutId);
      timeoutId = null;
    }
    activePollers.delete(stackName);
    logPolling(stackName, 'Polling stopped');
  };

  /**
   * Main polling loop
   */
  const poll = async (): Promise<void> => {
    if (!isActive) {
      return;
    }

    try {
      // Check if max duration exceeded
      const elapsed = Date.now() - startTime;
      if (elapsed > maxDuration) {
        logPolling(stackName, 'Max polling duration exceeded', {
          elapsed,
          maxDuration,
        });

        // Get final status before stopping
        try {
          const finalStatus = await getStackStatus(stackName);
          onUpdate(finalStatus);
          if (onComplete) {
            onComplete(finalStatus, 'timeout');
          }
        } catch (error) {
          // Ignore errors on final status check
          logPolling(stackName, 'Error getting final status', error);
        }

        stop();
        return;
      }

      // Fetch current stack status
      const status = await getStackStatus(stackName);

      // Call update callback
      onUpdate(status);

      // Check if status is terminal
      if (isTerminalStatus(status.status)) {
        logPolling(stackName, 'Terminal status reached', {
          status: status.status,
        });

        if (onComplete) {
          onComplete(status, 'terminal');
        }

        stop();
        return;
      }

      // Schedule next poll
      if (isActive) {
        timeoutId = setTimeout(() => {
          poll().catch((error) => {
            // This catch is for the recursive poll call
            logPolling(stackName, 'Error in recursive poll', error);
          });
        }, pollInterval);
      }
    } catch (error) {
      logPolling(stackName, 'Polling error', error);

      // Call error callback if provided
      if (onError) {
        onError(error as Error);
      }

      // Continue polling on error (graceful error handling)
      if (isActive) {
        timeoutId = setTimeout(() => {
          poll().catch((error) => {
            logPolling(stackName, 'Error in recursive poll after error', error);
          });
        }, pollInterval);
      }
    }
  };

  // Create controller
  const controller: PollingController = {
    stop,
    isActive: () => isActive,
    getStackName: () => stackName,
  };

  // Register controller
  activePollers.set(stackName, controller);

  // Start polling immediately
  poll().catch((error) => {
    logPolling(stackName, 'Error starting initial poll', error);
  });

  return controller;
};

/**
 * Stop polling for a specific stack
 * 
 * @param stackName - Name of the stack to stop polling
 */
export const stopPolling = (stackName: string): void => {
  stopExistingPolling(stackName);
};

/**
 * Stop all active polling sessions
 */
export const stopAllPolling = (): void => {
  logPolling('ALL', 'Stopping all polling sessions', {
    count: activePollers.size,
  });

  activePollers.forEach((controller) => {
    controller.stop();
  });

  activePollers.clear();
};

/**
 * Get all active polling stack names
 */
export const getActivePollingStacks = (): string[] => {
  return Array.from(activePollers.keys());
};

/**
 * Check if polling is active for a stack
 */
export const isPollingActive = (stackName: string): boolean => {
  return activePollers.has(stackName);
};

// ============================================================================
// Exports
// ============================================================================

export default {
  startPolling,
  stopPolling,
  stopAllPolling,
  getActivePollingStacks,
  isPollingActive,
  isTerminalStatus,
};
