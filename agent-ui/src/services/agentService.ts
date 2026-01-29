// Agent API Service
// Handles communication with backend API for agent invocation and status checks

import type {
  AgentInvocationRequest,
  AgentStatusResponse,
  AgentStatus,
  ErrorType,
} from '../types';

// ============================================================================
// Configuration
// ============================================================================

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';
const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 1000;
const REQUEST_TIMEOUT_MS = 30000;

// ============================================================================
// Error Classes
// ============================================================================

/**
 * Custom error class for API errors with categorization
 */
export class AgentAPIError extends Error {
  type: ErrorType;
  statusCode?: number;
  retryable: boolean;
  details?: string;

  constructor(
    message: string,
    type: ErrorType,
    statusCode?: number,
    retryable: boolean = false,
    details?: string
  ) {
    super(message);
    this.name = 'AgentAPIError';
    this.type = type;
    this.statusCode = statusCode;
    this.retryable = retryable;
    this.details = details;
  }
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Sleep utility for retry delays
 */
const sleep = (ms: number): Promise<void> => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};

/**
 * Calculate exponential backoff delay
 */
const getBackoffDelay = (attempt: number, baseDelay: number): number => {
  return baseDelay * Math.pow(2, attempt);
};

/**
 * Log request/response for debugging
 */
const logRequest = (method: string, url: string, body?: any): void => {
  console.log(`[AgentService] ${method} ${url}`, body ? { body } : '');
};

const logResponse = (url: string, status: number, data?: any): void => {
  console.log(`[AgentService] Response from ${url}`, { status, data });
};

const logError = (url: string, error: Error): void => {
  console.error(`[AgentService] Error from ${url}`, error);
};

/**
 * Categorize error based on status code and error type
 */
const categorizeError = (
  error: any,
  statusCode?: number
): { type: ErrorType; retryable: boolean } => {
  // Network errors
  if (error instanceof TypeError && error.message.includes('fetch')) {
    return { type: 'network', retryable: true };
  }

  // Timeout errors
  if (error.name === 'AbortError') {
    return { type: 'network', retryable: true };
  }

  // HTTP status code based categorization
  if (statusCode) {
    if (statusCode === 401 || statusCode === 403) {
      return { type: 'authentication', retryable: false };
    }
    if (statusCode >= 500) {
      return { type: 'agent', retryable: true };
    }
    if (statusCode === 429) {
      return { type: 'network', retryable: true };
    }
    if (statusCode >= 400 && statusCode < 500) {
      return { type: 'client', retryable: false };
    }
  }

  // Default to agent error with retry
  return { type: 'agent', retryable: true };
};

/**
 * Create fetch request with timeout
 */
const fetchWithTimeout = async (
  url: string,
  options: RequestInit,
  timeoutMs: number = REQUEST_TIMEOUT_MS
): Promise<Response> => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
};

// ============================================================================
// Retry Logic
// ============================================================================

/**
 * Execute a function with retry logic and exponential backoff
 */
async function withRetry<T>(
  fn: () => Promise<T>,
  maxRetries: number = MAX_RETRIES,
  baseDelay: number = RETRY_DELAY_MS
): Promise<T> {
  let lastError: Error | undefined;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;

      // Check if error is retryable
      if (error instanceof AgentAPIError && !error.retryable) {
        throw error;
      }

      // Don't retry on last attempt
      if (attempt === maxRetries) {
        break;
      }

      // Calculate backoff delay
      const delay = getBackoffDelay(attempt, baseDelay);
      console.log(
        `[AgentService] Retry attempt ${attempt + 1}/${maxRetries} after ${delay}ms`
      );
      await sleep(delay);
    }
  }

  throw lastError;
}

// ============================================================================
// API Functions
// ============================================================================

/**
 * Invoke an agent with a prompt and get streaming response
 * @param request - Agent invocation request
 * @returns Async generator yielding response chunks
 */
export async function* invokeAgent(
  request: AgentInvocationRequest
): AsyncGenerator<string, void, unknown> {
  const url = `${API_BASE_URL}/agents/invoke`;

  logRequest('POST', url, request);

  try {
    const response = await withRetry(async () => {
      const res = await fetchWithTimeout(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });

      if (!res.ok) {
        const errorText = await res.text();
        const { type, retryable } = categorizeError(null, res.status);
        throw new AgentAPIError(
          `Agent invocation failed: ${res.statusText}`,
          type,
          res.status,
          retryable,
          errorText
        );
      }

      return res;
    });

    // Handle streaming response
    if (!response.body) {
      throw new AgentAPIError(
        'Response body is null',
        'agent',
        response.status,
        false
      );
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();

    try {
      while (true) {
        const { done, value } = await reader.read();

        if (done) {
          logResponse(url, response.status, 'Stream complete');
          break;
        }

        const chunk = decoder.decode(value, { stream: true });
        yield chunk;
      }
    } finally {
      reader.releaseLock();
    }
  } catch (error) {
    logError(url, error as Error);

    if (error instanceof AgentAPIError) {
      throw error;
    }

    const { type, retryable } = categorizeError(error);
    throw new AgentAPIError(
      `Failed to invoke agent: ${(error as Error).message}`,
      type,
      undefined,
      retryable
    );
  }
}

/**
 * Check the status of an agent
 * @param agentId - Agent identifier
 * @returns Agent status response
 */
export async function checkAgentStatus(
  agentId: string
): Promise<AgentStatusResponse> {
  const url = `${API_BASE_URL}/agents/status?agentId=${encodeURIComponent(agentId)}`;

  logRequest('GET', url);

  try {
    return await withRetry(async () => {
      const response = await fetchWithTimeout(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        const { type, retryable } = categorizeError(null, response.status);
        throw new AgentAPIError(
          `Agent status check failed: ${response.statusText}`,
          type,
          response.status,
          retryable,
          errorText
        );
      }

      const data = await response.json();
      logResponse(url, response.status, data);

      return data as AgentStatusResponse;
    });
  } catch (error) {
    logError(url, error as Error);

    if (error instanceof AgentAPIError) {
      throw error;
    }

    const { type, retryable } = categorizeError(error);
    throw new AgentAPIError(
      `Failed to check agent status: ${(error as Error).message}`,
      type,
      undefined,
      retryable
    );
  }
}

/**
 * Check the status of all agents
 * @returns Map of agent IDs to their status
 */
export async function checkAllAgentsStatus(): Promise<
  Record<string, AgentStatus>
> {
  const url = `${API_BASE_URL}/agents/list`;

  logRequest('GET', url);

  try {
    return await withRetry(async () => {
      const response = await fetchWithTimeout(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        const { type, retryable } = categorizeError(null, response.status);
        throw new AgentAPIError(
          `Failed to list agents: ${response.statusText}`,
          type,
          response.status,
          retryable,
          errorText
        );
      }

      const data = await response.json();
      logResponse(url, response.status, data);

      // Transform array response to map
      const statusMap: Record<string, AgentStatus> = {};
      if (Array.isArray(data)) {
        data.forEach((agent: AgentStatusResponse) => {
          statusMap[agent.agentId] = agent.status;
        });
      }

      return statusMap;
    });
  } catch (error) {
    logError(url, error as Error);

    if (error instanceof AgentAPIError) {
      throw error;
    }

    const { type, retryable } = categorizeError(error);
    throw new AgentAPIError(
      `Failed to check all agents status: ${(error as Error).message}`,
      type,
      undefined,
      retryable
    );
  }
}

/**
 * Get CloudFormation stack status
 * @param stackName - CloudFormation stack name
 * @returns Stack status response
 */
export async function getStackStatus(stackName: string): Promise<any> {
  const url = `${API_BASE_URL}/stacks/status?stackName=${encodeURIComponent(stackName)}`;

  logRequest('GET', url);

  try {
    return await withRetry(async () => {
      const response = await fetchWithTimeout(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        const { type, retryable } = categorizeError(null, response.status);
        throw new AgentAPIError(
          `Stack status check failed: ${response.statusText}`,
          type,
          response.status,
          retryable,
          errorText
        );
      }

      const data = await response.json();
      logResponse(url, response.status, data);

      return data;
    });
  } catch (error) {
    logError(url, error as Error);

    if (error instanceof AgentAPIError) {
      throw error;
    }

    const { type, retryable } = categorizeError(error);
    throw new AgentAPIError(
      `Failed to get stack status: ${(error as Error).message}`,
      type,
      undefined,
      retryable
    );
  }
}

// ============================================================================
// Exports
// ============================================================================

export default {
  invokeAgent,
  checkAgentStatus,
  checkAllAgentsStatus,
  getStackStatus,
};
