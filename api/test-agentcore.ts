#!/usr/bin/env tsx
/**
 * Test script to verify AgentCore WebSocket connection
 */
import { AgentCoreClient } from './src/services/agentCoreClient';
import dotenv from 'dotenv';

dotenv.config();

async function testAgentCore() {
  const client = new AgentCoreClient('us-east-1');
  
  const runtimeArn = process.env.ONBOARDING_AGENT_ARN;
  if (!runtimeArn) {
    console.error('❌ ONBOARDING_AGENT_ARN not set in .env');
    process.exit(1);
  }

  console.log('🧪 Testing AgentCore WebSocket Connection');
  console.log('ARN:', runtimeArn);
  console.log('Prompt: "Generate a simple S3 bucket CloudFormation template"\n');
  console.log('Response:');
  console.log('─'.repeat(80));

  try {
    const stream = client.invokeAgent({
      runtimeArn,
      prompt: 'Generate a simple S3 bucket CloudFormation template',
      region: 'us-east-1',
    });

    let fullResponse = '';
    for await (const chunk of stream) {
      process.stdout.write(chunk);
      fullResponse += chunk;
    }

    console.log('\n' + '─'.repeat(80));
    console.log('\n✅ Test completed successfully!');
    console.log(`📊 Total response length: ${fullResponse.length} characters`);
    
    // Verify no SSE formatting in output
    if (fullResponse.includes('data: ')) {
      console.log('⚠️  Warning: Response still contains SSE formatting');
    } else {
      console.log('✅ Response is clean (no SSE formatting)');
    }

  } catch (error: any) {
    console.error('\n❌ Test failed:', error.message);
    console.error(error);
    process.exit(1);
  }
}

testAgentCore();
