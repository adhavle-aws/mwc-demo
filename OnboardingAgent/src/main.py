import os
import json
import yaml
from strands import Agent, tool
from bedrock_agentcore.runtime import BedrockAgentCoreApp
from model.load import load_model

app = BedrockAgentCoreApp()
log = app.logger

REGION = os.getenv("AWS_REGION", "us-east-1")

@tool
def validate_cloudformation_template(template: str) -> dict:
    """
    Validate a CloudFormation template for syntax and basic structure.
    
    Args:
        template: CloudFormation template as YAML or JSON string
    
    Returns:
        dict with 'valid' (bool) and 'errors' (list) or 'message' (str)
    """
    try:
        # Try parsing as YAML first
        try:
            template_dict = yaml.safe_load(template)
        except yaml.YAMLError:
            # Try parsing as JSON
            template_dict = json.loads(template)
        
        # Basic validation checks
        errors = []
        
        if not isinstance(template_dict, dict):
            errors.append("Template must be a dictionary/object")
        
        if "Resources" not in template_dict:
            errors.append("Template must contain 'Resources' section")
        
        if "Resources" in template_dict and not isinstance(template_dict["Resources"], dict):
            errors.append("'Resources' must be a dictionary")
        
        if "Resources" in template_dict and len(template_dict["Resources"]) == 0:
            errors.append("'Resources' section cannot be empty")
        
        # Check for AWSTemplateFormatVersion (recommended but not required)
        if "AWSTemplateFormatVersion" not in template_dict:
            log.info("Note: AWSTemplateFormatVersion not specified (recommended: '2010-09-09')")
        
        if errors:
            return {"valid": False, "errors": errors}
        
        return {"valid": True, "message": "Template structure is valid"}
    
    except json.JSONDecodeError as e:
        return {"valid": False, "errors": [f"Invalid JSON: {str(e)}"]}
    except yaml.YAMLError as e:
        return {"valid": False, "errors": [f"Invalid YAML: {str(e)}"]}
    except Exception as e:
        return {"valid": False, "errors": [f"Validation error: {str(e)}"]}

@app.entrypoint
async def invoke(payload, context):
    session_id = getattr(context, 'session_id', 'default')
    
    # Create agent
    agent = Agent(
        model=load_model(),
        system_prompt="""You are an AWS CloudFormation expert specializing in generating production-grade infrastructure templates.

Your responsibilities:
1. Analyze natural language descriptions of cloud architectures
2. Generate valid, production-ready CloudFormation templates
3. Follow AWS best practices for security, reliability, and cost optimization
4. Include proper resource naming, tagging, and documentation
5. Validate templates before returning them

When generating templates:
- Use clear, descriptive resource names
- Add comments explaining complex configurations
- Include outputs for important resource identifiers
- Follow least-privilege IAM principles
- Enable encryption where applicable
- Use appropriate resource types for the use case

Always validate your generated template using the validate_cloudformation_template tool before returning it to the user.

Return templates in YAML format for better readability.""",
        tools=[validate_cloudformation_template]
    )

    # Execute and format response
    stream = agent.stream_async(payload.get("prompt"))

    async for event in stream:
        # Handle Text parts of the response
        if "data" in event and isinstance(event["data"], str):
            yield event["data"]

if __name__ == "__main__":
    app.run()