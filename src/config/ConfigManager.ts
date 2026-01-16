/**
 * Configuration Management
 * 
 * Handles loading and validation of system configuration
 * Supports environment-specific configurations
 * 
 * Requirements: 4.2
 */

import { SystemConfig } from '../SystemIntegration';
import { SlackConfig } from '../services/slack/types';

/**
 * Environment types
 */
export type Environment = 'development' | 'staging' | 'production' | 'test';

/**
 * Configuration schema
 */
export interface ConfigSchema {
  environment: Environment;
  system: SystemConfig;
  logging: LoggingConfig;
  security: SecurityConfig;
}

/**
 * Logging configuration
 */
export interface LoggingConfig {
  level: 'debug' | 'info' | 'warn' | 'error';
  enableConsole: boolean;
  enableFile: boolean;
  filePath?: string;
  enableAudit: boolean;
}

/**
 * Security configuration
 */
export interface SecurityConfig {
  enableEncryption: boolean;
  encryptionAlgorithm: string;
  enableRateLimiting: boolean;
  rateLimitPerMinute: number;
  enableIPWhitelist: boolean;
  whitelistedIPs: string[];
}

/**
 * Configuration validation result
 */
export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * Configuration Manager
 * 
 * Loads, validates, and manages system configuration
 */
export class ConfigManager {
  private config: ConfigSchema | null = null;
  private environment: Environment;

  constructor(environment?: Environment) {
    this.environment = environment || this.detectEnvironment();
  }

  /**
   * Detect environment from NODE_ENV
   */
  private detectEnvironment(): Environment {
    const nodeEnv = process.env.NODE_ENV?.toLowerCase();
    
    switch (nodeEnv) {
      case 'production':
      case 'prod':
        return 'production';
      case 'staging':
      case 'stage':
        return 'staging';
      case 'test':
      case 'testing':
        return 'test';
      case 'development':
      case 'dev':
      default:
        return 'development';
    }
  }

  /**
   * Load configuration from environment variables
   */
  loadFromEnvironment(): ConfigSchema {
    const config: ConfigSchema = {
      environment: this.environment,
      system: this.loadSystemConfig(),
      logging: this.loadLoggingConfig(),
      security: this.loadSecurityConfig(),
    };

    this.config = config;
    return config;
  }

  /**
   * Load system configuration
   */
  private loadSystemConfig(): SystemConfig {
    return {
      slack: this.loadSlackConfig(),
      aws: {
        region: process.env.AWS_REGION || 'us-east-1',
      },
      agents: {
        onboarding: {
          agentId: process.env.ONBOARDING_AGENT_ID || 'onboarding-agent',
        },
        provisioning: {
          agentId: process.env.PROVISIONING_AGENT_ID || 'provisioning-agent',
        },
      },
    };
  }

  /**
   * Load Slack configuration
   */
  private loadSlackConfig(): SlackConfig {
    const botToken = process.env.SLACK_BOT_TOKEN;
    const appToken = process.env.SLACK_APP_TOKEN;
    const signingSecret = process.env.SLACK_SIGNING_SECRET;

    if (!botToken || !appToken || !signingSecret) {
      throw new Error('Missing required Slack configuration: SLACK_BOT_TOKEN, SLACK_APP_TOKEN, SLACK_SIGNING_SECRET');
    }

    return {
      botToken,
      appToken,
      signingSecret,
    };
  }

  /**
   * Load logging configuration
   */
  private loadLoggingConfig(): LoggingConfig {
    const level = (process.env.LOG_LEVEL?.toLowerCase() || 'info') as LoggingConfig['level'];
    
    return {
      level: ['debug', 'info', 'warn', 'error'].includes(level) ? level : 'info',
      enableConsole: this.parseBoolean(process.env.ENABLE_CONSOLE_LOGGING, true),
      enableFile: this.parseBoolean(process.env.ENABLE_FILE_LOGGING, false),
      filePath: process.env.LOG_FILE_PATH,
      enableAudit: this.parseBoolean(process.env.ENABLE_AUDIT_LOGGING, true),
    };
  }

  /**
   * Load security configuration
   */
  private loadSecurityConfig(): SecurityConfig {
    return {
      enableEncryption: this.parseBoolean(process.env.ENABLE_ENCRYPTION, true),
      encryptionAlgorithm: process.env.ENCRYPTION_ALGORITHM || 'aes-256-gcm',
      enableRateLimiting: this.parseBoolean(process.env.ENABLE_RATE_LIMITING, true),
      rateLimitPerMinute: this.parseNumber(process.env.RATE_LIMIT_PER_MINUTE, 60),
      enableIPWhitelist: this.parseBoolean(process.env.ENABLE_IP_WHITELIST, false),
      whitelistedIPs: this.parseArray(process.env.WHITELISTED_IPS, []),
    };
  }

  /**
   * Validate configuration
   */
  validate(config: ConfigSchema): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Validate Slack configuration
    if (!config.system.slack.botToken) {
      errors.push('Slack bot token is required');
    }
    if (!config.system.slack.appToken) {
      errors.push('Slack app token is required');
    }
    if (!config.system.slack.signingSecret) {
      errors.push('Slack signing secret is required');
    }

    // Validate AWS configuration
    if (!config.system.aws.region) {
      errors.push('AWS region is required');
    }

    // Validate security configuration
    if (config.environment === 'production') {
      if (!config.security.enableEncryption) {
        errors.push('Encryption must be enabled in production');
      }
      if (!config.security.enableRateLimiting) {
        warnings.push('Rate limiting should be enabled in production');
      }
    }

    // Validate logging configuration
    if (config.environment === 'production' && config.logging.level === 'debug') {
      warnings.push('Debug logging is enabled in production, may impact performance');
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Get current configuration
   */
  getConfig(): ConfigSchema {
    if (!this.config) {
      throw new Error('Configuration not loaded. Call loadFromEnvironment() first.');
    }
    return this.config;
  }

  /**
   * Get environment
   */
  getEnvironment(): Environment {
    return this.environment;
  }

  /**
   * Check if running in production
   */
  isProduction(): boolean {
    return this.environment === 'production';
  }

  /**
   * Check if running in development
   */
  isDevelopment(): boolean {
    return this.environment === 'development';
  }

  /**
   * Check if running in test
   */
  isTest(): boolean {
    return this.environment === 'test';
  }

  /**
   * Load configuration with validation
   */
  loadAndValidate(): ConfigSchema {
    const config = this.loadFromEnvironment();
    const validation = this.validate(config);

    if (!validation.valid) {
      throw new Error(`Configuration validation failed:\n${validation.errors.join('\n')}`);
    }

    if (validation.warnings.length > 0) {
      console.warn('Configuration warnings:');
      validation.warnings.forEach(warning => console.warn(`  - ${warning}`));
    }

    return config;
  }

  /**
   * Parse boolean from string
   */
  private parseBoolean(value: string | undefined, defaultValue: boolean): boolean {
    if (value === undefined) {
      return defaultValue;
    }
    return value.toLowerCase() === 'true' || value === '1';
  }

  /**
   * Parse number from string
   */
  private parseNumber(value: string | undefined, defaultValue: number): number {
    if (value === undefined) {
      return defaultValue;
    }
    const parsed = parseInt(value, 10);
    return isNaN(parsed) ? defaultValue : parsed;
  }

  /**
   * Parse array from comma-separated string
   */
  private parseArray(value: string | undefined, defaultValue: string[]): string[] {
    if (value === undefined || value.trim() === '') {
      return defaultValue;
    }
    return value.split(',').map(item => item.trim()).filter(item => item.length > 0);
  }

  /**
   * Get environment-specific override
   */
  getEnvironmentOverride<T>(
    key: string,
    defaults: Record<Environment, T>
  ): T {
    return defaults[this.environment];
  }
}

/**
 * Create a singleton configuration manager
 */
let configManagerInstance: ConfigManager | null = null;

/**
 * Get or create configuration manager instance
 */
export function getConfigManager(environment?: Environment): ConfigManager {
  if (!configManagerInstance) {
    configManagerInstance = new ConfigManager(environment);
  }
  return configManagerInstance;
}

/**
 * Reset configuration manager (useful for testing)
 */
export function resetConfigManager(): void {
  configManagerInstance = null;
}
