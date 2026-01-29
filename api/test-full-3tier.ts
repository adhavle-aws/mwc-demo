#!/usr/bin/env tsx
/**
 * Test script with the full 3-tier application prompt
 */
import { AgentCoreClient } from './src/services/agentCoreClient';
import dotenv from 'dotenv';

dotenv.config();

async function testFullPrompt() {
  const client = new AgentCoreClient('us-east-1');
  
  const runtimeArn = process.env.ONBOARDING_AGENT_ARN;
  if (!runtimeArn) {
    console.error('❌ ONBOARDING_AGENT_ARN not set in .env');
    process.exit(1);
  }

  const prompt = "Generate a cloudformation template to provision resources to meet requirements outlined in below Q and A. Output should include cloudformation template in <cfn> xml tag, architecture overview, cost optimization tips and quick summary. Q: What kind of application do you want to host? A: It is a 3 tier web application. Q: which aws region do you want the application to be hosted in? A: us-east-1. Q: Any security and/or availability requirements to keep in mind in hosting this application? A: It should be within a private network and highly available. Q: What kind of storage requirements do you have? A: We have 30GB of files and video data and 20GB of transaction data for this application. Q: Anything else you want us to consider? A: Yes, we want to have minimal operations and cost overhead. And one more thing, this app is very cpu intensive.";

  console.log('🧪 Testing OnboardingAgent with Full 3-Tier Prompt');
  console.log('ARN:', runtimeArn);
  console.log('\nResponse:');
  console.log('='.repeat(80));

  try {
    const stream = client.invokeAgent({
      runtimeArn,
      prompt,
      region: 'us-east-1',
    });

    let fullResponse = '';
    let chunkCount = 0;
    
    for await (const chunk of stream) {
      process.stdout.write(chunk);
      fullResponse += chunk;
      chunkCount++;
    }

    console.log('\n' + '='.repeat(80));
    console.log(`\n✅ Test completed successfully!`);
    console.log(`📊 Total response length: ${fullResponse.length} characters`);
    console.log(`📦 Chunks received: ${chunkCount}`);
    
    // Verify expected elements
    const hasCfnTag = fullResponse.includes('<cfn>');
    const hasArchitecture = fullResponse.toLowerCase().includes('architecture');
    const hasCost = fullResponse.toLowerCase().includes('cost');
    const hasSummary = fullResponse.toLowerCase().includes('summary');
    const hasSSE = fullResponse.includes('data: ');
    
    console.log('\n📋 Validation:');
    console.log(`  ${hasCfnTag ? '✅' : '❌'} Contains <cfn> tag`);
    console.log(`  ${hasArchitecture ? '✅' : '❌'} Contains architecture overview`);
    console.log(`  ${hasCost ? '✅' : '❌'} Contains cost optimization`);
    console.log(`  ${hasSummary ? '✅' : '❌'} Contains summary`);
    console.log(`  ${!hasSSE ? '✅' : '❌'} Clean output (no SSE formatting)`);

  } catch (error: any) {
    console.error('\n❌ Test failed:', error.message);
    console.error(error);
    process.exit(1);
  }
}

testFullPrompt();
