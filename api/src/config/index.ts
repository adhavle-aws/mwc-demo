import dotenv from 'dotenv';

dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || '3001', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  aws: {
    region: process.env.AWS_REGION || 'us-east-1',
    // AWS SDK will use default credential chain:
    // 1. Environment variables (AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY)
    // 2. Shared credentials file (~/.aws/credentials)
    // 3. IAM role (when running on EC2, Lambda, ECS, etc.)
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      sessionToken: process.env.AWS_SESSION_TOKEN,
    },
  },
  agents: {
    onboarding: {
      id: 'onboarding',
      name: 'OnboardingAgent',
      description: 'Helps design AWS infrastructure architecture',
      arn: process.env.ONBOARDING_AGENT_ARN || '',
      aliasId: process.env.ONBOARDING_AGENT_ALIAS_ID || 'TSTALIASID',
      capabilities: ['architecture', 'cost-optimization', 'cloudformation'],
    },
    provisioning: {
      id: 'provisioning',
      name: 'ProvisioningAgent',
      description: 'Deploys CloudFormation stacks',
      arn: process.env.PROVISIONING_AGENT_ARN || '',
      aliasId: process.env.PROVISIONING_AGENT_ALIAS_ID || 'TSTALIASID',
      capabilities: ['deployment', 'monitoring', 'resources'],
    },
    mwc: {
      id: 'mwc',
      name: 'MWCAgent',
      description: 'Orchestrates multi-agent workflows',
      arn: process.env.MWC_AGENT_ARN || '',
      aliasId: process.env.MWC_AGENT_ALIAS_ID || 'TSTALIASID',
      capabilities: ['orchestration', 'workflow'],
    },
  },
  cors: {
    origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  },
};

// Validate required configuration
export function validateConfig(): void {
  const requiredEnvVars = [
    'ONBOARDING_AGENT_ARN',
    'PROVISIONING_AGENT_ARN',
    'MWC_AGENT_ARN',
  ];

  const missing = requiredEnvVars.filter((varName) => !process.env[varName]);

  if (missing.length > 0) {
    console.warn(
      `Warning: Missing environment variables: ${missing.join(', ')}`
    );
    console.warn('Some features may not work correctly.');
  }
}
