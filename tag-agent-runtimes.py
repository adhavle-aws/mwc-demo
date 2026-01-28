#!/usr/bin/env python3
"""
Script to tag AgentCore runtime resources with auto-delete:never
"""

import boto3
import sys

# Initialize boto3 client
client = boto3.client('bedrock-agentcore', region_name='us-east-1')

# Agent ARNs
agents = {
    'OnboardingAgent': 'arn:aws:bedrock-agentcore:us-east-1:905767016260:runtime/OnboardingAgent_Agent-Pgs8nUGuuS',
    'ProvisioningAgent': 'arn:aws:bedrock-agentcore:us-east-1:905767016260:runtime/ProvisioningAgent_Agent-oHKfV3FmyU',
    'MWCAgent': 'arn:aws:bedrock-agentcore:us-east-1:905767016260:runtime/MWCAgent_Agent-31gMn650Bl'
}

print("Tagging AgentCore runtime resources with auto-delete:never...")
print()

for agent_name, agent_arn in agents.items():
    try:
        print(f"Tagging {agent_name}...")
        response = client.tag_resource(
            resourceArn=agent_arn,
            tags={
                'auto-delete': 'never',
                'Project': 'MWC-Demo',
                'ManagedBy': 'AgentCore'
            }
        )
        print(f"  ✅ Successfully tagged {agent_name}")
    except client.exceptions.ResourceNotFoundException:
        print(f"  ⚠️  {agent_name} not found - may need to be deployed first")
    except Exception as e:
        print(f"  ❌ Error tagging {agent_name}: {str(e)}")

print()
print("✅ Tagging complete!")
print()
print("Verify tags with:")
print("  python3 verify-agent-tags.py")
