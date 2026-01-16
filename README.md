# Agent-based Onboarding and Provisioning System

An automated system for AWS customer onboarding and infrastructure provisioning using multi-agent architecture with Slack integration.

## Overview

This system automates the complete AWS customer onboarding workflow through two specialized agents:

- **Onboarding Agent**: Manages AWS organizational setup, policy application, and CloudFormation package creation
- **Provisioning Agent**: Handles CloudFormation stack deployment, monitoring, and rollback procedures

The system integrates with Slack for user interaction and uses the agentcore and strands frameworks for agent runtime and workflow orchestration.

## Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                     Slack Integration Layer                      │
│  ┌──────────────────┐         ┌─────────────────────────────┐  │
│  │ Slack Channels   │◄────────┤ Slack Integration Service   │  │
│  └──────────────────┘         └─────────────────────────────┘  │
└────────────────────────────────────┬────────────────────────────┘
                                     │
┌────────────────────────────────────▼────────────────────────────┐
│                  Agent Runtime (Agentcore)                       │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────┐ │
│  │ Onboarding Agent │  │ Provisioning     │  │  Workflow    │ │
│  │                  │  │ Agent            │  │ Orchestrator │ │
│  └────────┬─────────┘  └────────┬─────────┘  └──────┬───────┘ │
└───────────┼────────────────────┼────────────────────┼──────────┘
            │                    │                    │
┌───────────▼────────────────────▼────────────────────▼──────────┐
│                         AWS Services                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐ │
│  │ Organizations│  │ CloudFormation│  │ IAM / S3 / Policies  │ │
│  └──────────────┘  └──────────────┘  └──────────────────────┘ │
└──────────────────────────────────────────────────────────────────┘
            │                    │                    │
┌───────────▼────────────────────▼────────────────────▼──────────┐
│                          Data Layer                              │
│  ┌──────────────────┐  ┌──────────────┐  ┌──────────────────┐ │
│  │ Workflow State   │  │ Audit Logs   │  │ CFN Package Store│ │
│  └──────────────────┘  └──────────────┘  └──────────────────┘ │
└──────────────────────────────────────────────────────────────────┘
```

### Component Flow

```
User (Slack) → Slack Integration → Intent Classification → Agent Routing
                                                                ↓
                                    ┌───────────────────────────┴──────────────┐
                                    ↓                                          ↓
                          Onboarding Agent                         Provisioning Agent
                                    ↓                                          ↓
                    ┌───────────────┴────────────┐              ┌─────────────┴──────────┐
                    ↓                            ↓              ↓                        ↓
            AWS Organizations              CFN Package      Deploy Stack          Monitor Status
            Policy Application             Creation         Verify Resources      Handle Rollback
                    ↓                            ↓              ↓                        ↓
                    └────────────────┬───────────┘              └────────────┬───────────┘
                                     ↓                                       ↓
                            Workflow Orchestrator ← → State Store / Audit Logger
                                     ↓
                            Slack Notifications
```

## Architecture Decision Records (ADRs)

This project documents key architectural decisions in the `.kiro/specs/agent-onboarding-provisioning/adr/` directory:

### Core Framework Decisions
- **[ADR-0001: Use Agentcore and Strands Frameworks](.kiro/specs/agent-onboarding-provisioning/adr/0001-use-agentcore-and-strands-frameworks.md)** - Foundation for agent runtime and workflow orchestration
- **[ADR-0002: Slack as Primary User Interface](.kiro/specs/agent-onboarding-provisioning/adr/0002-slack-as-primary-user-interface.md)** - User interaction through familiar communication platform
- **[ADR-0003: Two-Agent Architecture](.kiro/specs/agent-onboarding-provisioning/adr/0003-two-agent-architecture.md)** - Separation of concerns between onboarding and provisioning
- **[ADR-0006: TypeScript as Implementation Language](.kiro/specs/agent-onboarding-provisioning/adr/0006-typescript-as-implementation-language.md)** - Type safety and modern development experience

### Infrastructure & Integration
- **[ADR-0004: CloudFormation for Infrastructure Provisioning](.kiro/specs/agent-onboarding-provisioning/adr/0004-cloudformation-for-infrastructure-provisioning.md)** - AWS-native infrastructure as code
- **[ADR-0005: Event-Driven Architecture](.kiro/specs/agent-onboarding-provisioning/adr/0005-event-driven-architecture.md)** - Asynchronous message-based communication

### Reliability & Recovery
- **[ADR-0008: Exponential Backoff for Retries](.kiro/specs/agent-onboarding-provisioning/adr/0008-exponential-backoff-for-retries.md)** - Graceful handling of transient failures
- **[ADR-0009: Circuit Breaker Pattern](.kiro/specs/agent-onboarding-provisioning/adr/0009-circuit-breaker-pattern.md)** - Prevent cascading failures
- **[ADR-0010: Checkpoint-Based Workflow Recovery](.kiro/specs/agent-onboarding-provisioning/adr/0010-checkpoint-based-workflow-recovery.md)** - Resume workflows from last successful state

### Security & Quality
- **[ADR-0011: IAM Least Privilege Principle](.kiro/specs/agent-onboarding-provisioning/adr/0011-iam-least-privilege-principle.md)** - Minimal AWS permissions
- **[ADR-0012: Comprehensive Audit Logging](.kiro/specs/agent-onboarding-provisioning/adr/0012-comprehensive-audit-logging.md)** - Full traceability of operations
- **[ADR-0007: Property-Based Testing Strategy](.kiro/specs/agent-onboarding-provisioning/adr/0007-property-based-testing-strategy.md)** - Comprehensive correctness validation

See [ADR Index](.kiro/specs/agent-onboarding-provisioning/adr/README.md) for complete list and details.

## Project Structure

```
.
├── src/
│   ├── agents/                    # Agent implementations
│   │   ├── OnboardingAgent.ts     # AWS setup and CFN package creation
│   │   ├── ProvisioningAgent.ts   # Stack deployment and monitoring
│   │   ├── aws/                   # AWS service clients
│   │   │   ├── OrganizationsClient.ts
│   │   │   ├── CloudFormationClient.ts
│   │   │   ├── IAMRoleManager.ts
│   │   │   └── PolicyManager.ts
│   │   └── cfn/                   # CloudFormation utilities
│   │       ├── PackageBuilder.ts
│   │       ├── PackageValidator.ts
│   │       └── PackageVersionManager.ts
│   ├── services/                  # External service integrations
│   │   └── slack/                 # Slack integration
│   │       ├── SlackIntegrationService.ts
│   │       ├── SlackConnectionPool.ts
│   │       ├── MessageRouter.ts
│   │       ├── IntentClassifier.ts
│   │       └── NotificationService.ts
│   ├── workflows/                 # Workflow orchestration
│   │   ├── WorkflowOrchestrator.ts
│   │   ├── CheckpointManager.ts
│   │   └── WorkflowMonitor.ts
│   ├── data/                      # Data persistence
│   │   ├── WorkflowStateStore.ts
│   │   └── AuditLogger.ts
│   ├── shared/                    # Shared utilities
│   │   ├── types/                 # TypeScript type definitions
│   │   ├── utils/                 # Utility functions
│   │   ├── errors/                # Error handling
│   │   │   ├── ErrorClassifier.ts
│   │   │   ├── RetryHandler.ts
│   │   │   └── CircuitBreaker.ts
│   │   └── security/              # Security utilities
│   │       └── SecurityPolicyValidator.ts
│   ├── config/                    # Configuration management
│   │   └── ConfigManager.ts
│   ├── SystemIntegration.ts       # System-wide integration
│   └── index.ts                   # Main entry point
├── .kiro/specs/                   # Specifications
│   └── agent-onboarding-provisioning/
│       ├── requirements.md        # Detailed requirements
│       ├── design.md              # System design document
│       ├── tasks.md               # Implementation tasks
│       └── adr/                   # Architecture Decision Records
└── tests/                         # Test files
```

## Getting Started

### Prerequisites

- **Node.js** 18+ and npm
- **AWS Account** with appropriate permissions
- **Slack Workspace** with bot token
- **AWS CLI** configured (optional, for local AWS testing)

### Installation

1. **Clone the repository**
   ```bash
   git clone git@gitlab.aws.dev:adhavle/ict-demo-mwc.git
   cd ict-demo-mwc
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` and configure:
   ```bash
   # Slack Configuration (Required)
   SLACK_BOT_TOKEN=xoxb-your-bot-token
   SLACK_APP_TOKEN=xapp-your-app-token
   SLACK_SIGNING_SECRET=your-signing-secret
   
   # AWS Configuration (Required)
   AWS_REGION=us-east-1
   AWS_ACCESS_KEY_ID=your-access-key
   AWS_SECRET_ACCESS_KEY=your-secret-key
   
   # Application Configuration
   NODE_ENV=development
   LOG_LEVEL=info
   
   # Optional: Custom endpoints
   WORKFLOW_STATE_STORE_PATH=./data/workflow-state
   AUDIT_LOG_PATH=./data/audit-logs
   ```

4. **Build the project**
   ```bash
   npm run build
   ```

### Running Locally

#### Development Mode
```bash
# Run with auto-reload
npm run dev
```

#### Production Mode
```bash
# Build and run
npm run build
npm start
```

#### Using the Example Script
```bash
# Run the example integration
npm run example
```

This will:
- Initialize the system with your configuration
- Connect Slack integration to agents
- Wire agents to workflow orchestrator
- Start listening for Slack messages

### Testing

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Run linting
npm run lint
```

### Slack Bot Setup

1. **Create a Slack App** at https://api.slack.com/apps
2. **Enable Socket Mode** for real-time communication
3. **Add Bot Token Scopes**:
   - `chat:write` - Post messages
   - `channels:read` - View channels
   - `groups:read` - View private channels
   - `im:read` - View direct messages
   - `mpim:read` - View group messages
4. **Install App to Workspace** and copy tokens to `.env`
5. **Subscribe to Bot Events**:
   - `message.channels`
   - `message.groups`
   - `message.im`

### AWS Permissions

The system requires the following AWS permissions:

**Organizations**:
- `organizations:CreateOrganization`
- `organizations:CreateOrganizationalUnit`
- `organizations:AttachPolicy`

**CloudFormation**:
- `cloudformation:CreateStack`
- `cloudformation:DescribeStacks`
- `cloudformation:DeleteStack`

**IAM**:
- `iam:CreateRole`
- `iam:AttachRolePolicy`
- `iam:GetRole`

**S3** (for CFN packages):
- `s3:PutObject`
- `s3:GetObject`
- `s3:ListBucket`

See [IAM Policy Example](docs/iam-policy-example.json) for complete policy.

## Usage

### Basic Example

```typescript
import { integrateSystem, createDefaultConfig } from './src';

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
process.on('SIGINT', async () => {
  await system.shutdown();
  process.exit(0);
});
```

### Triggering Workflows via Slack

**Onboarding Workflow**:
```
@bot onboard customer "Acme Corp" with email "admin@acme.com"
```

**Provisioning Workflow**:
```
@bot provision package "pkg-12345" to account "123456789012"
```

**Check Status**:
```
@bot status workflow "wf-abc123"
```

## Documentation

- **[Requirements](.kiro/specs/agent-onboarding-provisioning/requirements.md)** - Detailed system requirements
- **[Design Document](.kiro/specs/agent-onboarding-provisioning/design.md)** - Architecture and design decisions
- **[Implementation Tasks](.kiro/specs/agent-onboarding-provisioning/tasks.md)** - Development task breakdown
- **[ADR Index](.kiro/specs/agent-onboarding-provisioning/adr/README.md)** - All architecture decisions
- **[Configuration Guide](src/config/README.md)** - Configuration options and examples

## Development

### Code Style

This project uses ESLint and Prettier for code formatting:

```bash
# Check linting
npm run lint

# Fix linting issues
npm run lint:fix

# Format code
npm run format
```

### Adding New Agents

1. Create agent class in `src/agents/`
2. Implement agent interface from agentcore
3. Register agent in `src/agents/index.ts`
4. Wire agent in `src/SystemIntegration.ts`

### Adding New AWS Services

1. Create client in `src/agents/aws/`
2. Implement error handling and retry logic
3. Add IAM permissions to documentation
4. Write unit and integration tests

## Troubleshooting

### Common Issues

**Slack Connection Fails**
- Verify `SLACK_BOT_TOKEN` and `SLACK_APP_TOKEN` are correct
- Ensure Socket Mode is enabled in Slack App settings
- Check bot has required scopes

**AWS Permission Errors**
- Verify IAM role has required permissions
- Check AWS credentials are configured correctly
- Ensure region is set properly

**Workflow State Not Persisting**
- Check `WORKFLOW_STATE_STORE_PATH` is writable
- Verify disk space is available
- Review audit logs for errors

### Logs

Logs are written to:
- **Console**: Structured JSON logs
- **Audit Logs**: `./data/audit-logs/` (configurable)
- **Workflow State**: `./data/workflow-state/` (configurable)

Set `LOG_LEVEL=debug` for verbose logging.

## Contributing

1. Create a feature branch
2. Make changes with tests
3. Run `npm test` and `npm run lint`
4. Submit merge request

## License

MIT

## Support

For issues and questions:
- Create an issue in GitLab
- Contact the development team
- See [Documentation](.kiro/specs/agent-onboarding-provisioning/)
