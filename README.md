# Agent-based Onboarding and Provisioning System

An automated system for AWS customer onboarding and infrastructure provisioning using multi-agent architecture with Slack integration.

## Overview

This system consists of two primary agents:
- **Onboarding Agent**: Manages AWS organizational setup and CloudFormation package creation
- **Provisioning Agent**: Handles CloudFormation deployment and monitoring

## Project Structure

```
src/
├── agents/          # Agent implementations (Onboarding, Provisioning)
├── services/        # External service integrations (Slack, AWS)
├── shared/          # Shared utilities and types
│   ├── types/       # TypeScript type definitions
│   ├── utils/       # Utility functions
│   └── errors/      # Error handling utilities
├── workflows/       # Workflow orchestration logic
└── data/           # Data models and state management
```

## Setup

### Prerequisites

- Node.js 18+ 
- npm or yarn
- AWS credentials configured
- Slack workspace and bot token

### Installation

```bash
npm install
```

### Build

```bash
npm run build
```

### Testing

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Generate coverage report
npm run test:coverage
```

### Linting

```bash
npm run lint
```

## Configuration

### Environment Variables

Copy `.env.example` to `.env` and configure:

```bash
# Required
SLACK_BOT_TOKEN=xoxb-your-bot-token
SLACK_APP_TOKEN=xapp-your-app-token
SLACK_SIGNING_SECRET=your-signing-secret

# Optional
NODE_ENV=development
AWS_REGION=us-east-1
LOG_LEVEL=info
```

See `.env.example` for all available configuration options.

### Usage

```typescript
import { integrateSystem, createDefaultConfig } from './index';

// Create configuration from environment variables
const config = createDefaultConfig();

// Integrate all system components
const system = integrateSystem(config);

// Start the system
await system.start();

// System is now running with:
// - Slack integration connected to agents
// - Agents wired to workflow orchestrator
// - Error handlers configured throughout
// - Audit logging enabled

// Graceful shutdown
await system.shutdown();
```

See `src/example.ts` and `src/config/README.md` for more examples.

## Requirements

See `.kiro/specs/agent-onboarding-provisioning/requirements.md` for detailed requirements.

## Design

See `.kiro/specs/agent-onboarding-provisioning/design.md` for system design and architecture.

## License

MIT
