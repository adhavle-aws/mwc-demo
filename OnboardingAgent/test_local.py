#!/usr/bin/env python3
"""Test script to invoke the OnboardingAgent locally"""
import asyncio
import sys
sys.path.insert(0, 'src')

from main import invoke

class MockContext:
    def __init__(self):
        self.session_id = 'test-session'

async def test_agent():
    payload = {
        "prompt": "Generate a simple CloudFormation template for an S3 bucket with versioning enabled."
    }
    
    context = MockContext()
    
    print("Testing OnboardingAgent...")
    print(f"Prompt: {payload['prompt']}\n")
    print("Response:")
    print("-" * 80)
    
    try:
        async for chunk in invoke(payload, context):
            print(chunk, end='', flush=True)
        print("\n" + "-" * 80)
        print("✓ Test completed successfully")
    except Exception as e:
        print(f"\n✗ Error: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(test_agent())
