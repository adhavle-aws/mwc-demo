#!/usr/bin/env python3
"""
Script to verify tags on AgentCore runtime resources
"""

import boto3
import json

# Initialize boto3 client
client = boto3.client('bedrock-agentcore', region_name='us-east-1')

# Agent ARNs
agents = {
    'OnboardingAgent': 'arn:aws:bedrock-agentcore:us-east-1:905767016260:runtime/OnboardingAgent_Agent-Pgs8nUGuuS',
    'ProvisioningAgent': 'arn:aws:bedrock-agentcore:us-east-1:905767016260:runtime/ProvisioningAgent_Agent-oHKfV3FmyU',
    'MWCAgent': 'arn:aws:bedrock-agentcore:us-east-1:905767016260:runtime/MWCAgent_Agent-31gMn650Bl'
}

print("Verifying tags on AgentCore runtime resources...")
print()

for agent_name, agent_arn in agents.items():
    try:
        print(f"📋 {agent_name}:")
        response = client.list_tags_for_resource(resourceArn=agent_arn)
        
        if response.get('tags'):
            for key, value in response['tags'].items():
                print(f"  • {key}: {value}")
        else:
            print("  (no tags)")
        print()
    except client.exceptions.ResourceNotFoundException:
        print(f"  ⚠️  Not found - may need to be deployed first")
        print()
    except Exception as e:
        print(f"  ❌ Error: {str(e)}")
        print()

print("✅ Verification complete!")
