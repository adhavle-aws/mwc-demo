import { createApp } from './app';
import { config, validateConfig } from './config';

/**
 * Start the server
 */
function startServer(): void {
  // Validate configuration
  validateConfig();

  // Create Express app
  const app = createApp();

  // Start listening
  app.listen(config.port, () => {
    console.log('='.repeat(50));
    console.log('Agent UI API Server');
    console.log('='.repeat(50));
    console.log(`Environment: ${config.nodeEnv}`);
    console.log(`Port: ${config.port}`);
    console.log(`AWS Region: ${config.aws.region}`);
    console.log(`CORS Origin: ${config.cors.origin}`);
    console.log('='.repeat(50));
    console.log(`Server is running at http://localhost:${config.port}`);
    console.log(`Health check: http://localhost:${config.port}/health`);
    console.log('='.repeat(50));
  });
}

// Handle uncaught errors
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Start the server
startServer();
