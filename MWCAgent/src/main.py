import os
import json
import boto3
from strands import Agent, tool
from bedrock_agentcore.runtime import BedrockAgentCoreApp
from model.load import load_model

app = BedrockAgentCoreApp()
log = app.logger

REGION = os.getenv("AWS_REGION", "us-east-1")

# Environment variables for agent ARNs (will be set after deployment)
ONBOARDING_AGENT_ARN = os.getenv("ONBOARDING_AGENT_ARN", "")
PROVISIONING_AGENT_ARN = os.getenv("PROVISIONING_AGENT_ARN", "")

# Initialize AgentCore client
agentcore_client = boto3.client('bedrock-agentcore', region_name=REGION)

@tool
def call_onboarding_agent(architecture_description: str) -> dict:
    """
    Call the Onboarding Agent to generate a CloudFormation template from a natural language description.
    
    Args:
        architecture_description: Natural language description of the cloud architecture
    
    Returns:
        dict with the generated CloudFormation template and validation results
    """
    if not ONBOARDING_AGENT_ARN:
        return {
            "success": False,
            "error": "ONBOARDING_AGENT_ARN environment variable not set"
        }
    
    try:
        payload = json.dumps({"prompt": architecture_description})
        
        response = agentcore_client.invoke_agent_runtime(
            agentRuntimeArn=ONBOARDING_AGENT_ARN,
            qualifier='DEFAULT',
            payload=payload.encode('utf-8')
        )
        
        # Read the streaming response
        result = ""
        for event in response['body']:
            if 'chunk' in event:
                chunk = event['chunk']
                if 'bytes' in chunk:
                    result += chunk['bytes'].decode('utf-8')
        
        return {
            "success": True,
            "template": result,
            "message": "CloudFormation template generated successfully"
        }
    
    except Exception as e:
        log.error(f"Error calling Onboarding Agent: {str(e)}")
        return {
            "success": False,
            "error": str(e),
            "message": f"Failed to call Onboarding Agent: {str(e)}"
        }

@tool
def call_provisioning_agent(prompt: str) -> dict:
    """
    Call the Provisioning Agent to deploy and monitor CloudFormation stacks.
    
    Args:
        prompt: Instructions for the Provisioning Agent (e.g., "Deploy this template: <template>")
    
    Returns:
        dict with deployment results and resource details
    """
    if not PROVISIONING_AGENT_ARN:
        return {
            "success": False,
            "error": "PROVISIONING_AGENT_ARN environment variable not set"
        }
    
    try:
        payload = json.dumps({"prompt": prompt})
        
        response = agentcore_client.invoke_agent_runtime(
            agentRuntimeArn=PROVISIONING_AGENT_ARN,
            qualifier='DEFAULT',
            payload=payload.encode('utf-8')
        )
        
        # Read the streaming response
        result = ""
        for event in response['body']:
            if 'chunk' in event:
                chunk = event['chunk']
                if 'bytes' in chunk:
                    result += chunk['bytes'].decode('utf-8')
        
        return {
            "success": True,
            "result": result,
            "message": "Provisioning completed"
        }
    
    except Exception as e:
        log.error(f"Error calling Provisioning Agent: {str(e)}")
        return {
            "success": False,
            "error": str(e),
            "message": f"Failed to call Provisioning Agent: {str(e)}"
        }

@app.entrypoint
async def invoke(payload, context):
    session_id = getattr(context, 'session_id', 'default')
    
    # Create orchestrator agent
    agent = Agent(
        model=load_model(),
        system_prompt="""You are the MWC Orchestrator Agent, coordinating AWS infrastructure onboarding and provisioning.

Your workflow:
1. Receive natural language descriptions of cloud architectures from users
2. Call the Onboarding Agent to generate CloudFormation templates
3. Review the generated template with the user
4. Call the Provisioning Agent to deploy the infrastructure
5. Provide comprehensive reports on the deployed resources

When orchestrating:
- Break down complex requests into clear steps
- Use call_onboarding_agent for CloudFormation template generation
- Use call_provisioning_agent for infrastructure deployment
- Provide clear status updates at each stage
- Handle errors gracefully and explain issues to users
- Generate user-friendly summaries of what was created

Always confirm with users before deploying infrastructure to AWS.""",
        tools=[call_onboarding_agent, call_provisioning_agent]
    )

    # Execute and format response
    stream = agent.stream_async(payload.get("prompt"))

    async for event in stream:
        # Handle Text parts of the response
        if "data" in event and isinstance(event["data"], str):
            yield event["data"]

if __name__ == "__main__":
    app.run()