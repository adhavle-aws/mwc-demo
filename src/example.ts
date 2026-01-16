/**
 * Complete System Integration Example
 * 
 * Demonstrates how to wire all components together and start the system
 */

import {
  integrateSystem,
  createDefaultConfig,
  getConfigManager,
} from './index';

/**
 * Example 1: Start system with default configuration
 */
export async function startSystemWithDefaults(): Promise<void> {
  // Create default configuration from environment variables
  const config = createDefaultConfig();

  // Integrate all system components
  const system = integrateSystem(config);

  // Start the system
  await system.start();

  console.log('System started successfully');

  // Perform health check
  const health = await system.healthCheck();
  console.log('Health check:', health);

  // System is now ready to handle requests
  // Agents are wired to Slack integration
  // Workflow orchestrator is ready to coordinate workflows
}

/**
 * Example 2: Start system with configuration manager
 */
export async function startSystemWithConfigManager(): Promise<void> {
  // Get configuration manager
  const configManager = getConfigManager();

  // Load and validate configuration
  const fullConfig = configManager.loadAndValidate();

  console.log(`Starting in ${fullConfig.environment} environment`);

  // Integrate system
  const system = integrateSystem(fullConfig.system);

  // Start the system
  await system.start();

  console.log('System started with validated configuration');
}

/**
 * Example 3: Custom configuration
 */
export async function startSystemWithCustomConfig(): Promise<void> {
  // Create custom configuration
  const config = createDefaultConfig({
    aws: {
      region: 'us-west-2',
    },
    agents: {
      onboarding: {
        agentId: 'custom-onboarding-agent',
      },
      provisioning: {
        agentId: 'custom-provisioning-agent',
      },
    },
  });

  // Integrate and start
  const system = integrateSystem(config);
  await system.start();

  console.log('System started with custom configuration');
}

/**
 * Example 4: Graceful shutdown
 */
export async function shutdownSystem(): Promise<void> {
  const config = createDefaultConfig();
  const system = integrateSystem(config);

  await system.start();

  // ... system runs ...

  // Graceful shutdown
  await system.shutdown();

  console.log('System shut down gracefully');
}

/**
 * Example 5: Health monitoring
 */
export async function monitorSystemHealth(): Promise<void> {
  const config = createDefaultConfig();
  const system = integrateSystem(config);

  await system.start();

  // Periodic health checks
  setInterval(async () => {
    const health = await system.healthCheck();

    if (!health.healthy) {
      console.error('System unhealthy:', health.errors);
      // Alert operations team
    } else {
      console.log('System healthy:', health.components);
    }
  }, 60000); // Check every minute
}

/**
 * Example 6: Access individual components
 */
export async function accessComponents(): Promise<void> {
  const config = createDefaultConfig();
  const system = integrateSystem(config);

  await system.start();

  // Access Slack integration
  await system.slackIntegration.sendMessage(
    'C123456',
    'Hello from the system!'
  );

  // Access workflow orchestrator
  const workflowId = await system.workflowOrchestrator.startWorkflow(
    'ONBOARDING',
    {
      customerRequirements: {
        customerId: 'cust-123',
        customerName: 'Example Corp',
        contactEmail: 'contact@example.com',
        infrastructure: {} as any,
        compliance: {} as any,
        timeline: {} as any,
      },
      targetAccount: 'aws-account-123',
      notificationChannels: ['C123456'],
    }
  );

  console.log('Started workflow:', workflowId);

  // Monitor workflow
  const status = await system.workflowOrchestrator.getWorkflowStatus(workflowId);
  console.log('Workflow status:', status);
}

/**
 * Main entry point for running examples
 */
async function main() {
  try {
    // Run example 1
    await startSystemWithDefaults();
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

// Run if executed directly
if (require.main === module) {
  main();
}
