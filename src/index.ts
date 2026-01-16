/**
 * Agent-based Onboarding and Provisioning System
 * 
 * Main entry point for the system
 */

export * from './agents';
export * from './services';
export * from './shared';
export * from './workflows';
export * from './data';

// Configuration management (selective exports to avoid conflicts)
export {
  ConfigManager,
  getConfigManager,
  resetConfigManager,
  Environment,
  ConfigSchema,
  LoggingConfig,
} from './config';

// System integration
export {
  integrateSystem,
  createDefaultConfig,
  SystemConfig,
  IntegratedSystem,
  HealthCheckResult,
} from './SystemIntegration';
