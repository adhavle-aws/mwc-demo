/**
 * Lambda handler with response streaming support
 * Uses Lambda Function URLs to bypass API Gateway's 30-second timeout
 */

import { Context } from 'aws-lambda';
import { AgentService } from './services/agentService';

// Create AgentService instance once
let agentService: AgentService | null = null;

function initializeAgentService(): AgentService {
  if (!agentService) {
    agentService = new AgentService();
  }
  return agentService;
}

/**
 * Parse request body from Function URL event
 */
function parseRequestBody(event: any): any {
  try {
    if (event.body) {
      const body = event.isBase64Encoded
        ? Buffer.from(event.body, 'base64').toString('utf-8')
        : event.body;
      return JSON.parse(body);
    }
    return {};
  } catch (error) {
    console.error('Error parsing request body:', error);
    return {};
  }
}

/**
 * Lambda handler with streaming response
 */
export const handler = awslambda.streamifyResponse(
  async (event: any, responseStream: any, context: Context) => {
    const service = initializeAgentService();

    console.log('[Streaming Lambda] Request:', {
      path: event.rawPath,
      method: event.requestContext?.http?.method,
      requestId: context.awsRequestId,
    });

    // Handle OPTIONS for CORS
    if (event.requestContext?.http?.method === 'OPTIONS') {
      const metadata = {
        statusCode: 200,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type',
          'Access-Control-Max-Age': '600',
        },
      };
      responseStream = awslambda.HttpResponseStream.from(responseStream, metadata);
      responseStream.end();
      return;
    }

    // Parse request
    const body = parseRequestBody(event);
    const { agentId, prompt, sessionId } = body;

    // Validate request
    if (!agentId || !prompt) {
      const metadata = {
        statusCode: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      };
      responseStream = awslambda.HttpResponseStream.from(responseStream, metadata);
      responseStream.write(
        JSON.stringify({
          error: 'BadRequest',
          message: 'Missing required fields: agentId and prompt',
        })
      );
      responseStream.end();
      return;
    }

    // Set streaming headers
    const metadata = {
      statusCode: 200,
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'Access-Control-Allow-Origin': '*',
        'X-Accel-Buffering': 'no',
      },
    };

    responseStream = awslambda.HttpResponseStream.from(responseStream, metadata);

    try {
      console.log('[Streaming Lambda] Invoking agent:', agentId);

      // Stream response chunks
      const stream = await service.invokeAgent(agentId, prompt, sessionId);
      let chunkCount = 0;

      for await (const chunk of stream) {
        chunkCount++;
        // Send as Server-Sent Event
        responseStream.write(`data: ${JSON.stringify({ chunk })}\n\n`);
      }

      // Send completion event
      responseStream.write(`data: ${JSON.stringify({ done: true, sessionId: sessionId || 'generated' })}\n\n`);
      
      console.log('[Streaming Lambda] Complete:', { chunks: chunkCount });
    } catch (error: any) {
      console.error('[Streaming Lambda] Error:', error);
      responseStream.write(
        `data: ${JSON.stringify({ error: error.message })}\n\n`
      );
    } finally {
      responseStream.end();
    }
  }
);
