import { Router, Request, Response } from 'express';
import { AgentService } from '../services/agentService';
import { asyncHandler, AppError } from '../middleware/errorHandler';
import { AgentInvocationRequest } from '../types';

const router = Router();
const agentService = new AgentService();

/**
 * GET /api/agents/list
 * Get list of available agents
 */
router.get(
  '/list',
  asyncHandler(async (req: Request, res: Response) => {
    const agents = agentService.getAgents();
    res.json({ agents });
  })
);

/**
 * GET /api/agents/status/:agentId
 * Get agent status
 */
router.get(
  '/status/:agentId',
  asyncHandler(async (req: Request, res: Response) => {
    const agentId = req.params.agentId as string;
    const status = await agentService.getAgentStatus(agentId);
    res.json(status);
  })
);

/**
 * POST /api/agents/invoke
 * Invoke an agent with streaming response
 */
router.post(
  '/invoke',
  asyncHandler(async (req: Request, res: Response) => {
    const { agentId, prompt, sessionId } = req.body as AgentInvocationRequest;

    // Validate request
    if (!agentId || !prompt) {
      throw new AppError(400, 'Missing required fields: agentId and prompt');
    }

    // Set headers for streaming
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    try {
      // Invoke agent and stream response
      const stream = await agentService.invokeAgent(agentId, prompt, sessionId);

      for await (const chunk of stream) {
        // Send chunk as Server-Sent Event
        res.write(`data: ${JSON.stringify({ chunk })}\n\n`);
      }

      // Send completion event
      res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
      res.end();
    } catch (error: any) {
      // Send error event
      res.write(
        `data: ${JSON.stringify({ error: error.message })}\n\n`
      );
      res.end();
    }
  })
);

export default router;
