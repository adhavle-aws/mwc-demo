import {
  BedrockAgentRuntimeClient,
  InvokeAgentCommand,
  InvokeAgentCommandInput,
} from '@aws-sdk/client-bedrock-agent-runtime';
import { config } from '../config';
import { Agent, AgentStatus, AgentStatusResponse } from '../types';

export class AgentService {
  private client: BedrockAgentRuntimeClient;

  constructor() {
    // Configure AWS SDK client with credentials
    const clientConfig: any = {
      region: config.aws.region,
    };

    // Add explicit credentials if provided via environment variables
    if (config.aws.credentials.accessKeyId && config.aws.credentials.secretAccessKey) {
      clientConfig.credentials = {
        accessKeyId: config.aws.credentials.accessKeyId,
        secretAccessKey: config.aws.credentials.secretAccessKey,
        sessionToken: config.aws.credentials.sessionToken,
      };
    }
    // Otherwise, AWS SDK will use default credential chain

    this.client = new BedrockAgentRuntimeClient(clientConfig);
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

    // Extract agent ID from ARN
    // ARN format: arn:aws:bedrock:region:account:agent/agentId
    const arnParts = agent.arn.split('/');
    const agentIdFromArn = arnParts[arnParts.length - 1];

    const input: InvokeAgentCommandInput = {
      agentId: agentIdFromArn,
      agentAliasId: agent.aliasId,
      sessionId: sessionId || this.generateSessionId(),
      inputText: prompt,
    };

    try {
      const command = new InvokeAgentCommand(input);
      const response = await this.client.send(command);

      // Return async generator for streaming
      return this.streamResponse(response.completion);
    } catch (error: any) {
      // Handle AWS SDK errors
      this.handleAwsError(error, agentId);
      throw error; // Re-throw after logging
    }
  }

  /**
   * Stream response chunks
   */
  private async *streamResponse(
    completion: any
  ): AsyncIterable<string> {
    if (!completion) {
      return;
    }

    try {
      for await (const event of completion) {
        if (event.chunk) {
          const chunk = event.chunk;
          if (chunk.bytes) {
            const text = new TextDecoder().decode(chunk.bytes);
            yield text;
          }
        }
      }
    } catch (error: any) {
      console.error('Error streaming response:', error);
      throw new Error(`Streaming failed: ${error.message}`);
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
