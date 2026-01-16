/**
 * Example Configuration
 * 
 * Demonstrates how to use the configuration management system
 * This file shows how to load and use configuration in your application
 */

import { getConfigManager, ConfigManager } from './ConfigManager';
import { integrateSystem } from '../SystemIntegration';

/**
 * Example: Load configuration and start the system
 */
export async function startSystemWithConfig(): Promise<void> {
  // Get configuration manager
  const configManager = getConfigManager();

  // Load and validate configuration from environment
  const config = configManager.loadAndValidate();

  console.log(`Starting system in ${config.environment} environment`);

  // Integrate system with configuration
  const system = integrateSystem(config.system);

  // Start the system
  await system.start();

  console.log('System started successfully');

  // Perform health check
  const health = await system.healthCheck();
  console.log('Health check:', health);

  return;
}

/**
 * Example: Environment-specific configuration
 */
export function getEnvironmentSpecificSetting(): void {
  const configManager = getConfigManager();

  // Get environment-specific timeout values
  const timeout = configManager.getEnvironmentOverride('timeout', {
    development: 30000,  // 30 seconds in dev
    staging: 60000,      // 1 minute in staging
    production: 120000,  // 2 minutes in production
    test: 5000,          // 5 seconds in test
  });

  console.log(`Using timeout: ${timeout}ms`);
}

/**
 * Example: Check environment
 */
export function checkEnvironment(): void {
  const configManager = getConfigManager();

  if (configManager.isProduction()) {
    console.log('Running in production mode');
    // Enable production-specific features
  } else if (configManager.isDevelopment()) {
    console.log('Running in development mode');
    // Enable development-specific features
  } else if (configManager.isTest()) {
    console.log('Running in test mode');
    // Enable test-specific features
  }
}

/**
 * Example: Access configuration values
 */
export function accessConfigValues(): void {
  const configManager = getConfigManager();
  const config = configManager.getConfig();

  // Access logging configuration
  console.log(`Log level: ${config.logging.level}`);
  console.log(`Console logging: ${config.logging.enableConsole}`);

  // Access security configuration
  console.log(`Encryption enabled: ${config.security.enableEncryption}`);
  console.log(`Rate limiting: ${config.security.enableRateLimiting}`);

  // Access AWS configuration
  console.log(`AWS region: ${config.system.aws.region}`);
}
