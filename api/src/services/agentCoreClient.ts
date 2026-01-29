import {
  BedrockAgentCoreClient,
  InvokeAgentRuntimeCommand,
} from '@aws-sdk/client-bedrock-agentcore';

interface AgentCoreInvokeOptions {
  runtimeArn: string;
  prompt: string;
  sessionId?: string;
  region?: string;
}

export class AgentCoreClient {
  private client: BedrockAgentCoreClient;

  constructor(region: string = 'us-east-1') {
    this.client = new BedrockAgentCoreClient({ region });
  }

  /**
   * Invoke AgentCore agent and stream response
   */
  async *invokeAgent(options: AgentCoreInvokeOptions): AsyncIterable<string> {
    const { runtimeArn, prompt, sessionId } = options;

    // Generate session ID if not provided or empty
    const actualSessionId = sessionId && sessionId.length >= 33 
      ? sessionId 
      : this.generateSessionId();

    console.log('Invoking agent with session ID:', actualSessionId, 'Length:', actualSessionId.length);

    // Prepare payload
    const payload = new TextEncoder().encode(JSON.stringify({ prompt }));

    const input = {
      agentRuntimeArn: runtimeArn,
      runtimeSessionId: actualSessionId,
      payload,
      contentType: 'application/json',
      accept: 'application/json',
    };

    try {
      const command = new InvokeAgentRuntimeCommand(input);
      const response = await this.client.send(command);

      // Stream response chunks
      if (response.response) {
        yield* this.streamResponse(response.response);
      }
    } catch (error: any) {
      console.error('AgentCore invocation error:', error);
      throw new Error(`AgentCore invocation failed: ${error.message}`);
    }
  }

  /**
   * Stream response chunks and parse SSE format
   */
  private async *streamResponse(stream: any): AsyncIterable<string> {
    try {
      // Convert stream to async iterable
      for await (const chunk of stream) {
        if (chunk) {
          // Decode bytes
          const text = new TextDecoder().decode(chunk);
          
          // Parse SSE format if present: "data: \"text\""
          const parsed = this.parseSSEMessage(text);
          if (parsed) {
            yield parsed;
          }
        }
      }
    } catch (error: any) {
      console.error('Error streaming response:', error);
      throw new Error(`Streaming failed: ${error.message}`);
    }
  }

  /**
   * Parse SSE message format
   * Input: "data: \"text chunk\"" or just "text chunk"
   * Output: "text chunk"
   */
  private parseSSEMessage(message: string): string | null {
    // Handle SSE format: data: "content"
    const lines = message.split('\n');
    
    for (const line of lines) {
      const trimmed = line.trim();
      
      if (trimmed.startsWith('data: ')) {
        const content = trimmed.substring(6).trim();
        
        // Remove quotes if present and unescape JSON
        if (content.startsWith('"') && content.endsWith('"')) {
          try {
            return JSON.parse(content);
          } catch {
            // If JSON parse fails, just remove quotes
            return content.slice(1, -1);
          }
        }
        
        return content;
      }
    }
    
    // If no SSE format found, return the message as-is if it's not empty
    const trimmed = message.trim();
    return trimmed || null;
  }

  /**
   * Generate unique session ID (minimum 33 characters required by AgentCore)
   */
  private generateSessionId(): string {
    const timestamp = Date.now().toString();
    const random = Math.random().toString(36).substr(2);
    const sessionId = `session-${timestamp}-${random}-${Math.random().toString(36).substr(2)}`;
    
    // Ensure minimum length of 33 characters
    const paddedSessionId = sessionId.padEnd(33, '0');
    console.log('Generated session ID:', paddedSessionId, 'Length:', paddedSessionId.length);
    return paddedSessionId;
  }
}
