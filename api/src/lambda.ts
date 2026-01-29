import { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from 'aws-lambda';
import { AgentService } from './services/agentService';

// Create AgentService instance once (outside handler for reuse)
let agentService: AgentService | null = null;

/**
 * Initialize AgentService
 */
function initializeAgentService(): AgentService {
  if (!agentService) {
    agentService = new AgentService();
  }
  return agentService;
}

/**
 * Lambda handler for API Gateway events
 */
export async function handler(
  event: APIGatewayProxyEvent,
  context: Context
): Promise<APIGatewayProxyResult> {
  try {
    console.log('Lambda invoked:', {
      path: event.path,
      method: event.httpMethod,
      requestId: context.awsRequestId,
    });

    // Handle OPTIONS requests for CORS preflight
    if (event.httpMethod === 'OPTIONS') {
      return createResponse(200, {});
    }

    // Initialize agent service
    const service = initializeAgentService();

    // Route based on path and method
    const path = event.path;
    const method = event.httpMethod;

    // Health check
    if (path === '/health' && method === 'GET') {
      return createResponse(200, {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'production',
      });
    }

    // List agents
    if (path === '/api/agents/list' && method === 'GET') {
      const agents = service.getAgents();
      return createResponse(200, { agents });
    }

    // Get agent status
    if (path.startsWith('/api/agents/status/') && method === 'GET') {
      const agentId = path.split('/').pop() || '';
      const status = await service.getAgentStatus(agentId);
      return createResponse(200, status);
    }

    // Invoke agent
    if (path === '/api/agents/invoke' && method === 'POST') {
      return await handleAgentInvocation(service, event);
    }

    // Get stack status
    if (path.startsWith('/api/stacks/status/') && method === 'GET') {
      return await handleStackStatus(event);
    }

    // 404 for unknown routes
    return createResponse(404, {
      error: 'NotFound',
      message: `Route ${method} ${path} not found`,
    });
  } catch (error: any) {
    console.error('Lambda handler error:', error);
    return createResponse(500, {
      error: 'InternalServerError',
      message: error.message || 'An unexpected error occurred',
    });
  }
}

/**
 * Create API Gateway response with CORS headers
 */
function createResponse(statusCode: number, body: any): APIGatewayProxyResult {
  return {
    statusCode,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': process.env.CORS_ORIGIN || '*',
      'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token',
    },
    body: JSON.stringify(body),
  };
}

/**
 * Handle agent invocation
 */
async function handleAgentInvocation(
  service: AgentService,
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> {
  try {
    // Decode body if it's base64-encoded
    let bodyString = event.body || '{}';
    if (event.isBase64Encoded) {
      bodyString = Buffer.from(bodyString, 'base64').toString('utf-8');
    }
    
    const body = JSON.parse(bodyString);
    const { agentId, prompt, sessionId } = body;

    if (!agentId || !prompt) {
      return createResponse(400, {
        error: 'BadRequest',
        message: 'Missing required fields: agentId and prompt',
      });
    }

    // Collect streaming response
    // Note: API Gateway doesn't support true streaming, so we collect the full response
    let fullResponse = '';
    const stream = await service.invokeAgent(agentId, prompt, sessionId);

    for await (const chunk of stream) {
      fullResponse += chunk;
    }

    return createResponse(200, {
      response: fullResponse,
      sessionId: sessionId || 'generated',
    });
  } catch (error: any) {
    console.error('Error invoking agent:', error);
    return createResponse(500, {
      error: 'InternalServerError',
      message: error.message || 'Failed to invoke agent',
    });
  }
}

/**
 * Handle CloudFormation stack status request
 */
async function handleStackStatus(
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> {
  try {
    const { CloudFormationService } = await import('./services/cloudFormationService');
    const cfnService = new CloudFormationService();
    
    const stackName = event.path.split('/').pop() || '';
    
    if (!stackName) {
      return createResponse(400, {
        error: 'BadRequest',
        message: 'Stack name is required',
      });
    }

    const status = await cfnService.getStackStatus(stackName);
    return createResponse(200, status);
  } catch (error: any) {
    console.error('Error getting stack status:', error);
    
    // Handle specific CloudFormation errors
    if (error.name === 'ValidationError') {
      return createResponse(400, {
        error: 'ValidationError',
        message: 'Invalid stack name',
      });
    }
    
    return createResponse(500, {
      error: 'InternalServerError',
      message: error.message || 'Failed to get stack status',
    });
  }
}
