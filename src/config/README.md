# Configuration Management

This module provides configuration management for the Agent-based Onboarding and Provisioning System.

## Features

- Environment-based configuration (development, staging, production, test)
- Environment variable loading with validation
- Type-safe configuration schema
- Environment-specific overrides
- Configuration validation with errors and warnings

## Usage

### Basic Usage

```typescript
import { getConfigManager, integrateSystem } from './index';

// Get configuration manager
const configManager = getConfigManager();

// Load and validate configuration from environment variables
const config = configManager.loadAndValidate();

// Integrate system with configuration
const system = integrateSystem(config.system);

// Start the system
await system.start();
```

### Environment Detection

The configuration manager automatically detects the environment from `NODE_ENV`:

```typescript
const configManager = getConfigManager();

if (configManager.isProduction()) {
  // Production-specific logic
} else if (configManager.isDevelopment()) {
  // Development-specific logic
}
```

### Environment-Specific Overrides

```typescript
const timeout = configManager.getEnvironmentOverride('timeout', {
  development: 30000,
  staging: 60000,
  production: 120000,
  test: 5000,
});
```

### Configuration Validation

The configuration manager validates all required settings:

```typescript
const config = configManager.loadFromEnvironment();
const validation = configManager.validate(config);

if (!validation.valid) {
  console.error('Configuration errors:', validation.errors);
  process.exit(1);
}

if (validation.warnings.length > 0) {
  console.warn('Configuration warnings:', validation.warnings);
}
```

## Environment Variables

Copy `.env.example` to `.env` and configure the following variables:

### Required Variables

- `SLACK_BOT_TOKEN` - Slack bot token for authentication
- `SLACK_APP_TOKEN` - Slack app token for socket mode
- `SLACK_SIGNING_SECRET` - Slack signing secret for request verification

### Optional Variables

- `NODE_ENV` - Environment (development, staging, production, test)
- `AWS_REGION` - AWS region (default: us-east-1)
- `ONBOARDING_AGENT_ID` - Onboarding agent identifier
- `PROVISIONING_AGENT_ID` - Provisioning agent identifier
- `LOG_LEVEL` - Logging level (debug, info, warn, error)
- `ENABLE_ENCRYPTION` - Enable data encryption (default: true)
- `ENABLE_RATE_LIMITING` - Enable rate limiting (default: true)

See `.env.example` for a complete list of configuration options.

## Configuration Schema

```typescript
interface ConfigSchema {
  environment: Environment;
  system: SystemConfig;
  logging: LoggingConfig;
  security: SecurityConfig;
}
```

### System Configuration

```typescript
interface SystemConfig {
  slack: SlackConfig;
  aws: {
    region: string;
  };
  agents: {
    onboarding: { agentId?: string };
    provisioning: { agentId?: string };
  };
}
```

### Logging Configuration

```typescript
interface LoggingConfig {
  level: 'debug' | 'info' | 'warn' | 'error';
  enableConsole: boolean;
  enableFile: boolean;
  filePath?: string;
  enableAudit: boolean;
}
```

### Security Configuration

```typescript
interface SecurityConfig {
  enableEncryption: boolean;
  encryptionAlgorithm: string;
  enableRateLimiting: boolean;
  rateLimitPerMinute: number;
  enableIPWhitelist: boolean;
  whitelistedIPs: string[];
}
```

## Examples

See `example.config.ts` for complete usage examples including:
- Starting the system with configuration
- Environment-specific settings
- Accessing configuration values
- Environment checks
