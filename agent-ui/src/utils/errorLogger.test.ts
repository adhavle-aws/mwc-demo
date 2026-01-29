import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  createErrorInfo,
  parseError,
  getErrorActionableSteps,
  logError,
} from './errorLogger';
import type { ErrorType } from '../types';

describe('errorLogger', () => {
  beforeEach(() => {
    // Clear console mocks
    vi.clearAllMocks();
  });

  describe('createErrorInfo', () => {
    it('should create error info with required fields', () => {
      const error = createErrorInfo('network', 'Connection failed');

      expect(error.type).toBe('network');
      expect(error.message).toBe('Connection failed');
      expect(error.timestamp).toBeInstanceOf(Date);
      expect(error.retryable).toBe(false);
    });

    it('should create error info with optional fields', () => {
      const error = createErrorInfo('agent', 'Agent unavailable', {
        details: 'Timeout after 30s',
        retryable: true,
        agentId: 'test-agent',
        operation: 'invoke',
      });

      expect(error.details).toBe('Timeout after 30s');
      expect(error.retryable).toBe(true);
      expect(error.agentId).toBe('test-agent');
      expect(error.operation).toBe('invoke');
    });
  });

  describe('parseError', () => {
    it('should parse network errors', () => {
      const fetchError = new TypeError('Failed to fetch');
      const error = parseError(fetchError);

      expect(error.type).toBe('network');
      expect(error.message).toContain('network connection');
      expect(error.retryable).toBe(true);
    });

    it('should parse authentication errors', () => {
      const authError = Object.assign(new Error('Unauthorized'), { status: 401 });
      const error = parseError(authError);

      expect(error.type).toBe('authentication');
      expect(error.message).toContain('Authentication failed');
      expect(error.retryable).toBe(false);
    });

    it('should parse agent errors for 503 status', () => {
      const agentError = Object.assign(new Error('Service Unavailable'), { status: 503 });
      const error = parseError(agentError);

      expect(error.type).toBe('agent');
      expect(error.message).toContain('unavailable');
      expect(error.retryable).toBe(true);
    });

    it('should parse client errors for 400 status', () => {
      const clientError = Object.assign(new Error('Bad Request'), { status: 400 });
      const error = parseError(clientError);

      expect(error.type).toBe('client');
      expect(error.message).toContain('Invalid request');
      expect(error.retryable).toBe(false);
    });

    it('should include context in parsed errors', () => {
      const error = parseError(new Error('Test error'), {
        agentId: 'test-agent',
        operation: 'test-op',
      });

      expect(error.agentId).toBe('test-agent');
      expect(error.operation).toBe('test-op');
    });
  });

  describe('getErrorActionableSteps', () => {
    it('should return steps for network errors', () => {
      const error = createErrorInfo('network', 'Connection failed', { retryable: true });
      const steps = getErrorActionableSteps(error);

      expect(steps.length).toBeGreaterThan(0);
      expect(steps.some(step => step.includes('internet connection'))).toBe(true);
      expect(steps.some(step => step.includes('retry'))).toBe(true);
    });

    it('should return steps for authentication errors', () => {
      const error = createErrorInfo('authentication', 'Auth failed');
      const steps = getErrorActionableSteps(error);

      expect(steps.length).toBeGreaterThan(0);
      expect(steps.some(step => step.includes('Log in'))).toBe(true);
    });

    it('should return steps for agent errors', () => {
      const error = createErrorInfo('agent', 'Agent unavailable', { retryable: true });
      const steps = getErrorActionableSteps(error);

      expect(steps.length).toBeGreaterThan(0);
      expect(steps.some(step => step.includes('Wait'))).toBe(true);
    });

    it('should return steps for deployment errors', () => {
      const error = createErrorInfo('deployment', 'Stack creation failed');
      const steps = getErrorActionableSteps(error);

      expect(steps.length).toBeGreaterThan(0);
      expect(steps.some(step => step.includes('CloudFormation'))).toBe(true);
    });

    it('should return steps for client errors', () => {
      const error = createErrorInfo('client', 'Invalid input');
      const steps = getErrorActionableSteps(error);

      expect(steps.length).toBeGreaterThan(0);
      expect(steps.some(step => step.includes('input'))).toBe(true);
    });
  });

  describe('logError', () => {
    it('should log client errors as warnings', () => {
      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      const error = createErrorInfo('client', 'Client error');

      logError(error);

      expect(consoleWarnSpy).toHaveBeenCalledWith(
        '[Error]',
        expect.objectContaining({
          type: 'client',
          message: 'Client error',
        })
      );

      consoleWarnSpy.mockRestore();
    });

    it('should log non-client errors as errors', () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const error = createErrorInfo('network', 'Network error');

      logError(error);

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        '[Error]',
        expect.objectContaining({
          type: 'network',
          message: 'Network error',
        })
      );

      consoleErrorSpy.mockRestore();
    });
  });
});
