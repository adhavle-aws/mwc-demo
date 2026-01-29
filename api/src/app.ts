import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import { config } from './config';
import { errorHandler } from './middleware/errorHandler';
import agentsRouter from './routes/agents';
import stacksRouter from './routes/stacks';

/**
 * Create and configure Express application
 */
export function createApp(): Application {
  const app = express();

  // CORS configuration
  app.use(
    cors({
      origin: config.cors.origin,
      credentials: true,
    })
  );

  // Body parsing middleware
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Request logging middleware
  app.use((req: Request, res: Response, next) => {
    console.log(`${new Date().toISOString()} ${req.method} ${req.path}`);
    next();
  });

  // Health check endpoint
  app.get('/health', (req: Request, res: Response) => {
    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      environment: config.nodeEnv,
    });
  });

  // API routes
  app.use('/api/agents', agentsRouter);
  app.use('/api/stacks', stacksRouter);

  // 404 handler
  app.use((req: Request, res: Response) => {
    res.status(404).json({
      error: 'NotFound',
      message: `Route ${req.method} ${req.path} not found`,
    });
  });

  // Error handling middleware (must be last)
  app.use(errorHandler);

  return app;
}
