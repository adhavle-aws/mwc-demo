import os
import json
import time
import boto3
from strands import Agent, tool
from bedrock_agentcore.runtime import BedrockAgentCoreApp
from model.load import load_model

app = BedrockAgentCoreApp()
log = app.logger

REGION = os.getenv("AWS_REGION", "us-east-1")

# Initialize AWS clients
cfn_client = boto3.client('cloudformation', region_name=REGION)

@tool
def deploy_cloudformation_stack(stack_name: str, template_body: str, parameters: dict = None) -> dict:
    """
    Deploy a CloudFormation stack.
    
    Args:
        stack_name: Name for the CloudFormation stack
        template_body: CloudFormation template as YAML or JSON string
        parameters: Optional dict of parameter key-value pairs
    
    Returns:
        dict with stack_id, status, and message
    """
    try:
        # Prepare parameters
        cfn_parameters = []
        if parameters:
            cfn_parameters = [
                {"ParameterKey": k, "ParameterValue": str(v)} 
                for k, v in parameters.items()
            ]
        
        # Create stack
        response = cfn_client.create_stack(
            StackName=stack_name,
            TemplateBody=template_body,
            Parameters=cfn_parameters,
            Capabilities=['CAPABILITY_IAM', 'CAPABILITY_NAMED_IAM', 'CAPABILITY_AUTO_EXPAND'],
            OnFailure='ROLLBACK',
            Tags=[
                {'Key': 'ManagedBy', 'Value': 'MWCAgent'},
                {'Key': 'Agent', 'Value': 'ProvisioningAgent'}
            ]
        )
        
        return {
            "success": True,
            "stack_id": response['StackId'],
            "status": "CREATE_IN_PROGRESS",
            "message": f"Stack {stack_name} deployment initiated successfully"
        }
    
    except Exception as e:
        return {
            "success": False,
            "error": str(e),
            "message": f"Failed to deploy stack: {str(e)}"
        }

@tool
def get_stack_status(stack_name: str) -> dict:
    """
    Get the current status of a CloudFormation stack.
    
    Args:
        stack_name: Name of the CloudFormation stack
    
    Returns:
        dict with status, resources, and outputs
    """
    try:
        response = cfn_client.describe_stacks(StackName=stack_name)
        stack = response['Stacks'][0]
        
        # Get stack resources
        resources_response = cfn_client.describe_stack_resources(StackName=stack_name)
        resources = [
            {
                "logical_id": r['LogicalResourceId'],
                "physical_id": r.get('PhysicalResourceId', 'N/A'),
                "type": r['ResourceType'],
                "status": r['ResourceStatus']
            }
            for r in resources_response['StackResources']
        ]
        
        # Get stack outputs
        outputs = {}
        if 'Outputs' in stack:
            outputs = {
                o['OutputKey']: o.get('OutputValue', 'N/A')
                for o in stack['Outputs']
            }
        
        return {
            "success": True,
            "stack_name": stack['StackName'],
            "status": stack['StackStatus'],
            "resources": resources,
            "outputs": outputs,
            "creation_time": str(stack.get('CreationTime', 'N/A')),
            "last_updated": str(stack.get('LastUpdatedTime', 'N/A'))
        }
    
    except Exception as e:
        return {
            "success": False,
            "error": str(e),
            "message": f"Failed to get stack status: {str(e)}"
        }

@tool
def validate_cloudformation_template(template_body: str) -> dict:
    """
    Validate a CloudFormation template using AWS CloudFormation API.
    
    Args:
        template_body: CloudFormation template as YAML or JSON string
    
    Returns:
        dict with validation results
    """
    try:
        response = cfn_client.validate_template(TemplateBody=template_body)
        
        return {
            "valid": True,
            "description": response.get('Description', 'No description'),
            "parameters": [p['ParameterKey'] for p in response.get('Parameters', [])],
            "capabilities": response.get('Capabilities', []),
            "message": "Template is valid"
        }
    
    except Exception as e:
        return {
            "valid": False,
            "error": str(e),
            "message": f"Template validation failed: {str(e)}"
        }

@tool
def get_stack_events(stack_name: str, limit: int = 10) -> dict:
    """
    Get recent events for a CloudFormation stack.
    
    Args:
        stack_name: Name of the CloudFormation stack
        limit: Maximum number of events to return (default: 10)
    
    Returns:
        dict with stack events
    """
    try:
        response = cfn_client.describe_stack_events(StackName=stack_name)
        events = response['StackEvents'][:limit]
        
        formatted_events = [
            {
                "timestamp": str(e['Timestamp']),
                "resource_type": e['ResourceType'],
                "logical_id": e['LogicalResourceId'],
                "status": e['ResourceStatus'],
                "reason": e.get('ResourceStatusReason', 'N/A')
            }
            for e in events
        ]
        
        return {
            "success": True,
            "events": formatted_events
        }
    
    except Exception as e:
        return {
            "success": False,
            "error": str(e),
            "message": f"Failed to get stack events: {str(e)}"
        }

@app.entrypoint
async def invoke(payload, context):
    session_id = getattr(context, 'session_id', 'default')
    
    # Create agent
    agent = Agent(
        model=load_model(),
        system_prompt="""You are an AWS infrastructure provisioning expert specializing in CloudFormation deployment and monitoring.

Your responsibilities:
1. Validate CloudFormation templates for correctness and best practices
2. Deploy CloudFormation stacks to AWS
3. Monitor deployment progress and handle errors
4. Provide detailed reports on deployed resources
5. Generate user-friendly documentation on how to use the provisioned infrastructure

When provisioning infrastructure:
- Always validate templates before deployment
- Use descriptive stack names
- Monitor deployment progress
- Check for errors and provide clear explanations
- Generate comprehensive reports including:
  * All provisioned resources with their IDs
  * Stack outputs and their purposes
  * How to access and use the resources
  * Next steps for the user

Be proactive in checking deployment status and providing updates.""",
        tools=[
            validate_cloudformation_template,
            deploy_cloudformation_stack,
            get_stack_status,
            get_stack_events
        ]
    )

    # Execute and format response
    stream = agent.stream_async(payload.get("prompt"))

    async for event in stream:
        # Handle Text parts of the response
        if "data" in event and isinstance(event["data"], str):
            yield event["data"]

if __name__ == "__main__":
    app.run()