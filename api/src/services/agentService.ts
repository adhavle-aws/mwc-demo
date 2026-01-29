import { config } from '../config';
import { Agent, AgentStatus, AgentStatusResponse } from '../types';
import { AgentCoreClient } from './agentCoreClient';

export class AgentService {
  private agentCoreClient: AgentCoreClient;

  constructor() {
    this.agentCoreClient = new AgentCoreClient(config.aws.region);
  }

  /**
   * Get list of available agents
   */
  getAgents(): Agent[] {
    return [
      config.agents.onboarding,
      config.agents.provisioning,
      config.agents.mwc,
    ];
  }

  /**
   * Get agent by ID
   */
  getAgentById(agentId: string): Agent | undefined {
    const agents = this.getAgents();
    return agents.find((agent) => agent.id === agentId);
  }

  /**
   * Invoke an agent and return streaming response
   */
  async invokeAgent(
    agentId: string,
    prompt: string,
    sessionId?: string
  ): Promise<AsyncIterable<string>> {
    const agent = this.getAgentById(agentId);
    if (!agent) {
      throw new Error(`Agent not found: ${agentId}`);
    }

    if (!agent.arn) {
      throw new Error(`Agent ARN not configured for: ${agentId}`);
    }

    try {
      // Invoke AgentCore via WebSocket
      return this.agentCoreClient.invokeAgent({
        runtimeArn: agent.arn,
        prompt,
        sessionId: sessionId || this.generateSessionId(),
        region: config.aws.region,
      });
    } catch (error: any) {
      // Handle errors
      this.handleAwsError(error, agentId);
      throw error; // Re-throw after logging
    }
  }

  /**
   * Check agent status
   */
  async getAgentStatus(agentId: string): Promise<AgentStatusResponse> {
    const agent = this.getAgentById(agentId);
    if (!agent) {
      return {
        agentId,
        status: 'unknown',
        arn: '',
        errorMessage: 'Agent not found',
      };
    }

    // Check if agent ARN is configured
    if (!agent.arn) {
      return {
        agentId,
        status: 'error',
        arn: agent.arn,
        errorMessage: 'Agent ARN not configured',
      };
    }

    // For now, assume agents are available if ARN is configured
    // In production, you might want to make a test call to verify
    return {
      agentId,
      status: 'available',
      arn: agent.arn,
    };
  }

  /**
   * Generate a unique session ID
   */
  private generateSessionId(): string {
    return `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Handle AWS SDK errors with specific error messages
   */
  private handleAwsError(error: any, agentId: string): void {
    console.error(`AWS Error invoking agent ${agentId}:`, error);

    // Log specific error types for debugging
    if (error.name === 'ResourceNotFoundException') {
      console.error(`Agent not found in AWS: ${agentId}`);
    } else if (error.name === 'AccessDeniedException') {
      console.error(`Access denied to agent: ${agentId}. Check IAM permissions.`);
    } else if (error.name === 'ThrottlingException') {
      console.error(`Request throttled for agent: ${agentId}. Retry with backoff.`);
    } else if (error.name === 'ValidationException') {
      console.error(`Invalid request for agent: ${agentId}. Check input parameters.`);
    } else if (error.name === 'ServiceQuotaExceededException') {
      console.error(`Service quota exceeded for agent: ${agentId}.`);
    } else {
      console.error(`Unexpected error for agent ${agentId}:`, error.message);
    }
  }
}
