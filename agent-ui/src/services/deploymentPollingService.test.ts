// Unit tests for Deployment Polling Service
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  startPolling,
  stopPolling,
  stopAllPolling,
  isTerminalStatus,
  getActivePollingStacks,
  isPollingActive,
} from './deploymentPollingService';
import * as agentService from './agentService';
import type { StackStatusResponse } from '../types';

// Mock the agentService
vi.mock('./agentService', () => ({
  getStackStatus: vi.fn(),
}));

describe('deploymentPollingService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    stopAllPolling();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
    stopAllPolling();
  });

  describe('isTerminalStatus', () => {
    it('should return true for terminal statuses', () => {
      expect(isTerminalStatus('CREATE_COMPLETE')).toBe(true);
      expect(isTerminalStatus('CREATE_FAILED')).toBe(true);
      expect(isTerminalStatus('UPDATE_COMPLETE')).toBe(true);
      expect(isTerminalStatus('UPDATE_FAILED')).toBe(true);
      expect(isTerminalStatus('ROLLBACK_COMPLETE')).toBe(true);
      expect(isTerminalStatus('DELETE_COMPLETE')).toBe(true);
    });

    it('should return false for non-terminal statuses', () => {
      expect(isTerminalStatus('CREATE_IN_PROGRESS')).toBe(false);
      expect(isTerminalStatus('UPDATE_IN_PROGRESS')).toBe(false);
      expect(isTerminalStatus('DELETE_IN_PROGRESS')).toBe(false);
      expect(isTerminalStatus('REVIEW_IN_PROGRESS')).toBe(false);
    });
  });

  describe('startPolling', () => {
    it('should start polling and call onUpdate callback', async () => {
      const mockStatus: StackStatusResponse = {
        stackName: 'test-stack',
        stackId: 'stack-123',
        status: 'CREATE_IN_PROGRESS',
        resources: [],
        outputs: {},
        events: [],
        creationTime: new Date(),
      };

      vi.mocked(agentService.getStackStatus).mockResolvedValue(mockStatus);

      const onUpdate = vi.fn();
      const controller = startPolling({
        stackName: 'test-stack',
        onUpdate,
      });

      // Wait for initial poll
      await vi.runOnlyPendingTimersAsync();

      expect(agentService.getStackStatus).toHaveBeenCalledWith('test-stack');
      expect(onUpdate).toHaveBeenCalledWith(mockStatus);
      expect(controller.isActive()).toBe(true);

      controller.stop();
    });

    it('should stop polling when terminal status is reached', async () => {
      const inProgressStatus: StackStatusResponse = {
        stackName: 'test-stack',
        stackId: 'stack-123',
        status: 'CREATE_IN_PROGRESS',
        resources: [],
        outputs: {},
        events: [],
        creationTime: new Date(),
      };

      const completeStatus: StackStatusResponse = {
        ...inProgressStatus,
        status: 'CREATE_COMPLETE',
      };

      vi.mocked(agentService.getStackStatus)
        .mockResolvedValueOnce(inProgressStatus)
        .mockResolvedValueOnce(completeStatus);

      const onUpdate = vi.fn();
      const onComplete = vi.fn();

      const controller = startPolling({
        stackName: 'test-stack',
        onUpdate,
        onComplete,
      });

      // First poll - in progress
      await vi.runOnlyPendingTimersAsync();
      expect(onUpdate).toHaveBeenCalledWith(inProgressStatus);
      expect(controller.isActive()).toBe(true);

      // Second poll - complete
      await vi.runOnlyPendingTimersAsync();
      expect(onUpdate).toHaveBeenCalledWith(completeStatus);
      expect(onComplete).toHaveBeenCalledWith(completeStatus, 'terminal');
      expect(controller.isActive()).toBe(false);
    });

    it('should handle polling errors gracefully and continue polling', async () => {
      const mockStatus: StackStatusResponse = {
        stackName: 'test-stack',
        stackId: 'stack-123',
        status: 'CREATE_IN_PROGRESS',
        resources: [],
        outputs: {},
        events: [],
        creationTime: new Date(),
      };

      const error = new Error('Network error');

      vi.mocked(agentService.getStackStatus)
        .mockRejectedValueOnce(error)
        .mockResolvedValueOnce(mockStatus);

      const onUpdate = vi.fn();
      const onError = vi.fn();

      const controller = startPolling({
        stackName: 'test-stack',
        onUpdate,
        onError,
      });

      // First poll - error
      await vi.runOnlyPendingTimersAsync();
      expect(onError).toHaveBeenCalledWith(error);
      expect(controller.isActive()).toBe(true);

      // Second poll - success
      await vi.runOnlyPendingTimersAsync();
      expect(onUpdate).toHaveBeenCalledWith(mockStatus);

      controller.stop();
    });

    it('should stop polling after max duration', async () => {
      const mockStatus: StackStatusResponse = {
        stackName: 'test-stack',
        stackId: 'stack-123',
        status: 'CREATE_IN_PROGRESS',
        resources: [],
        outputs: {},
        events: [],
        creationTime: new Date(),
      };

      vi.mocked(agentService.getStackStatus).mockResolvedValue(mockStatus);

      const onUpdate = vi.fn();
      const onComplete = vi.fn();

      const controller = startPolling({
        stackName: 'test-stack',
        onUpdate,
        onComplete,
        maxDuration: 10000, // 10 seconds
      });

      // Advance time past max duration
      await vi.advanceTimersByTimeAsync(11000);

      expect(onComplete).toHaveBeenCalledWith(mockStatus, 'timeout');
      expect(controller.isActive()).toBe(false);
    });

    it('should use custom poll interval', async () => {
      const mockStatus: StackStatusResponse = {
        stackName: 'test-stack',
        stackId: 'stack-123',
        status: 'CREATE_IN_PROGRESS',
        resources: [],
        outputs: {},
        events: [],
        creationTime: new Date(),
      };

      vi.mocked(agentService.getStackStatus).mockResolvedValue(mockStatus);

      const onUpdate = vi.fn();

      const controller = startPolling({
        stackName: 'test-stack',
        onUpdate,
        pollInterval: 2000, // 2 seconds
      });

      // First poll
      await vi.runOnlyPendingTimersAsync();
      expect(onUpdate).toHaveBeenCalledTimes(1);

      // Advance by 2 seconds for next poll
      await vi.advanceTimersByTimeAsync(2000);
      expect(onUpdate).toHaveBeenCalledTimes(2);

      controller.stop();
    });
  });

  describe('stopPolling', () => {
    it('should stop polling for a specific stack', async () => {
      const mockStatus: StackStatusResponse = {
        stackName: 'test-stack',
        stackId: 'stack-123',
        status: 'CREATE_IN_PROGRESS',
        resources: [],
        outputs: {},
        events: [],
        creationTime: new Date(),
      };

      vi.mocked(agentService.getStackStatus).mockResolvedValue(mockStatus);

      const onUpdate = vi.fn();

      startPolling({
        stackName: 'test-stack',
        onUpdate,
      });

      // First poll
      await vi.runOnlyPendingTimersAsync();
      expect(onUpdate).toHaveBeenCalledTimes(1);

      // Stop polling
      stopPolling('test-stack');

      // Advance time - should not poll again
      await vi.advanceTimersByTimeAsync(10000);
      expect(onUpdate).toHaveBeenCalledTimes(1);
    });
  });

  describe('getActivePollingStacks', () => {
    it('should return list of active polling stacks', () => {
      const mockStatus: StackStatusResponse = {
        stackName: 'test-stack',
        stackId: 'stack-123',
        status: 'CREATE_IN_PROGRESS',
        resources: [],
        outputs: {},
        events: [],
        creationTime: new Date(),
      };

      vi.mocked(agentService.getStackStatus).mockResolvedValue(mockStatus);

      expect(getActivePollingStacks()).toEqual([]);

      startPolling({
        stackName: 'stack-1',
        onUpdate: vi.fn(),
      });

      startPolling({
        stackName: 'stack-2',
        onUpdate: vi.fn(),
      });

      const activeStacks = getActivePollingStacks();
      expect(activeStacks).toContain('stack-1');
      expect(activeStacks).toContain('stack-2');
      expect(activeStacks).toHaveLength(2);
    });
  });

  describe('isPollingActive', () => {
    it('should return true for active polling', () => {
      const mockStatus: StackStatusResponse = {
        stackName: 'test-stack',
        stackId: 'stack-123',
        status: 'CREATE_IN_PROGRESS',
        resources: [],
        outputs: {},
        events: [],
        creationTime: new Date(),
      };

      vi.mocked(agentService.getStackStatus).mockResolvedValue(mockStatus);

      expect(isPollingActive('test-stack')).toBe(false);

      startPolling({
        stackName: 'test-stack',
        onUpdate: vi.fn(),
      });

      expect(isPollingActive('test-stack')).toBe(true);

      stopPolling('test-stack');

      expect(isPollingActive('test-stack')).toBe(false);
    });
  });

  describe('stopAllPolling', () => {
    it('should stop all active polling sessions', () => {
      const mockStatus: StackStatusResponse = {
        stackName: 'test-stack',
        stackId: 'stack-123',
        status: 'CREATE_IN_PROGRESS',
        resources: [],
        outputs: {},
        events: [],
        creationTime: new Date(),
      };

      vi.mocked(agentService.getStackStatus).mockResolvedValue(mockStatus);

      startPolling({
        stackName: 'stack-1',
        onUpdate: vi.fn(),
      });

      startPolling({
        stackName: 'stack-2',
        onUpdate: vi.fn(),
      });

      expect(getActivePollingStacks()).toHaveLength(2);

      stopAllPolling();

      expect(getActivePollingStacks()).toHaveLength(0);
      expect(isPollingActive('stack-1')).toBe(false);
      expect(isPollingActive('stack-2')).toBe(false);
    });
  });
});
