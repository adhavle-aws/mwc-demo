#!/usr/bin/env python3
"""Test script with the full 3-tier application prompt"""
import asyncio
import sys
sys.path.insert(0, 'src')

from main import invoke

class MockContext:
    def __init__(self):
        self.session_id = 'test-session'

async def test_agent():
    payload = {
        "prompt": "Generate a cloudformation template to provision resources to meet requirements outlined in below Q and A. Output should include cloudformation template in <cfn> xml tag, architecture overview, cost optimization tips and quick summary. Q: What kind of application do you want to host? A: It is a 3 tier web application. Q: which aws region do you want the application to be hosted in? A: us-east-1. Q: Any security and/or availability requirements to keep in mind in hosting this application? A: It should be within a private network and highly available. Q: What kind of storage requirements do you have? A: We have 30GB of files and video data and 20GB of transaction data for this application. Q: Anything else you want us to consider? A: Yes, we want to have minimal operations and cost overhead. And one more thing, this app is very cpu intensive."
    }
    
    context = MockContext()
    
    print("Testing OnboardingAgent with 3-tier application prompt...")
    print("=" * 80)
    
    try:
        response_text = ""
        async for chunk in invoke(payload, context):
            print(chunk, end='', flush=True)
            response_text += chunk
        
        print("\n" + "=" * 80)
        print("\n✓ Test completed successfully")
        
        # Check if response contains expected elements
        print("\nValidation:")
        has_cfn_tag = "<cfn>" in response_text.lower()
        has_architecture = "architecture" in response_text.lower()
        has_cost = "cost" in response_text.lower()
        has_summary = "summary" in response_text.lower()
        
        print(f"  - Contains <cfn> tag: {'✓' if has_cfn_tag else '✗'}")
        print(f"  - Contains architecture overview: {'✓' if has_architecture else '✗'}")
        print(f"  - Contains cost optimization: {'✓' if has_cost else '✗'}")
        print(f"  - Contains summary: {'✓' if has_summary else '✗'}")
        
    except Exception as e:
        print(f"\n✗ Error: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(test_agent())
