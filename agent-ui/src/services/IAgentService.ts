/**
 * Agent Service Interface
 * 
 * This interface defines the contract for agent communication services.
 * It enables seamless migration between different implementations:
 * - React implementation: Uses fetch API with streaming
 * - Salesforce implementation: Uses Apex controllers with Platform Events
 * 
 * By programming against this interface, UI components remain unchanged
 * when migrating from React to Salesforce Lightning Web Components.
 */

import type {
  AgentInvocationRequest,
  AgentStatusResponse,
  AgentStatus,
} from '../types';

/**
 * Stack status response from CloudFormation
 */
export interface StackStatusResponse {
  stackName: string;
  stackId: string;
  status: string;
  resources: ResourceStatus[];
  outputs: Record<string, string>;
  events: StackEvent[];
  creationTime: Date;
  lastUpdatedTime?: Date;
}

/**
 * CloudFormation resource status
 */
export interface ResourceStatus {
  logicalId: string;
  physicalId: string;
  type: string;
  status: string;
  timestamp: Date;
}

/**
 * CloudFormation stack event
 */
export interface StackEvent {
  timestamp: Date;
  resourceType: string;
  logicalId: string;
  status: string;
  reason?: string;
}

/**
 * Service interface for agent communication
 * 
 * Implementations:
 * - ReactAgentService: Current implementation using fetch API
 * - SalesforceAgentService: Future implementation using Apex
 */
export interface IAgentService {
  /**
   * Invoke an agent with a prompt and get streaming response
   * 
   * @param request - Agent invocation request containing agentId and prompt
   * @returns Async generator yielding response chunks as they arrive
   * @throws AgentServiceError on failure
   * 
   * @example
   * ```typescript
   * for await (const chunk of service.invokeAgent({ agentId: 'agent-1', prompt: 'Hello' })) {
   *   console.log(chunk);
   * }
   * ```
   */
  invokeAgent(
    request: AgentInvocationRequest
  ): AsyncGenerator<string, void, unknown>;

  /**
   * Check the status of a specific agent
   * 
   * @param agentId - Unique identifier for the agent
   * @returns Promise resolving to agent status information
   * @throws AgentServiceError on failure
   * 
   * @example
   * ```typescript
   * const status = await service.checkAgentStatus('agent-1');
   * console.log(status.status); // 'available' | 'busy' | 'error'
   * ```
   */
  checkAgentStatus(agentId: string): Promise<AgentStatusResponse>;

  /**
   * Check the status of all available agents
   * 
   * @returns Promise resolving to map of agent IDs to their status
   * @throws AgentServiceError on failure
   * 
   * @example
   * ```typescript
   * const statuses = await service.checkAllAgentsStatus();
   * console.log(statuses['agent-1']); // 'available'
   * ```
   */
  checkAllAgentsStatus(): Promise<Record<string, AgentStatus>>;

  /**
   * Get the current status of a CloudFormation stack
   * 
   * @param stackName - Name of the CloudFormation stack
   * @returns Promise resolving to stack status information
   * @throws AgentServiceError on failure
   * 
   * @example
   * ```typescript
   * const stack = await service.getStackStatus('my-stack');
   * console.log(stack.status); // 'CREATE_COMPLETE'
   * ```
   */
  getStackStatus(stackName: string): Promise<StackStatusResponse>;
}

/**
 * Factory function type for creating service instances
 */
export type ServiceFactory = () => IAgentService;

/**
 * Service environment type
 */
export type ServiceEnvironment = 'react' | 'salesforce';
