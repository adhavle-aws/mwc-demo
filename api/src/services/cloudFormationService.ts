import {
  CloudFormationClient,
  DescribeStacksCommand,
  DescribeStackResourcesCommand,
  DescribeStackEventsCommand,
  Stack,
  StackResource,
  StackEvent as CfnStackEvent,
} from '@aws-sdk/client-cloudformation';
import { config } from '../config';
import { StackStatusResponse, ResourceStatus, StackEvent } from '../types';

export class CloudFormationService {
  private client: CloudFormationClient;

  constructor() {
    // Configure AWS SDK client with credentials
    const clientConfig: any = {
      region: config.aws.region,
    };

    // Add explicit credentials if provided via environment variables
    if (config.aws.credentials.accessKeyId && config.aws.credentials.secretAccessKey) {
      clientConfig.credentials = {
        accessKeyId: config.aws.credentials.accessKeyId,
        secretAccessKey: config.aws.credentials.secretAccessKey,
        sessionToken: config.aws.credentials.sessionToken,
      };
    }
    // Otherwise, AWS SDK will use default credential chain

    this.client = new CloudFormationClient(clientConfig);
  }

  /**
   * Get CloudFormation stack status
   */
  async getStackStatus(stackName: string): Promise<StackStatusResponse> {
    try {
      // Get stack details
      const stackCommand = new DescribeStacksCommand({
        StackName: stackName,
      });
      const stackResponse = await this.client.send(stackCommand);
      const stack = stackResponse.Stacks?.[0];

      if (!stack) {
        throw new Error(`Stack not found: ${stackName}`);
      }

      // Get stack resources
      const resourcesCommand = new DescribeStackResourcesCommand({
        StackName: stackName,
      });
      const resourcesResponse = await this.client.send(resourcesCommand);
      const resources = this.mapResources(
        resourcesResponse.StackResources || []
      );

      // Get stack events
      const eventsCommand = new DescribeStackEventsCommand({
        StackName: stackName,
      });
      const eventsResponse = await this.client.send(eventsCommand);
      const events = this.mapEvents(eventsResponse.StackEvents || []);

      // Extract outputs
      const outputs = this.extractOutputs(stack);

      return {
        stackName: stack.StackName || stackName,
        stackId: stack.StackId || '',
        status: stack.StackStatus || 'UNKNOWN',
        resources,
        outputs,
        events,
        creationTime: stack.CreationTime || new Date(),
        lastUpdatedTime: stack.LastUpdatedTime,
      };
    } catch (error: any) {
      this.handleCloudFormationError(error, stackName);
      throw new Error(`Failed to get stack status: ${error.message}`);
    }
  }

  /**
   * Map CloudFormation resources to our format
   */
  private mapResources(cfnResources: StackResource[]): ResourceStatus[] {
    return cfnResources.map((resource) => ({
      logicalId: resource.LogicalResourceId || '',
      physicalId: resource.PhysicalResourceId || '',
      type: resource.ResourceType || '',
      status: resource.ResourceStatus || '',
      timestamp: resource.Timestamp || new Date(),
      statusReason: resource.ResourceStatusReason,
    }));
  }

  /**
   * Map CloudFormation events to our format
   */
  private mapEvents(cfnEvents: CfnStackEvent[]): StackEvent[] {
    return cfnEvents
      .slice(0, 50) // Limit to most recent 50 events
      .map((event) => ({
        timestamp: event.Timestamp || new Date(),
        resourceType: event.ResourceType || '',
        logicalId: event.LogicalResourceId || '',
        status: event.ResourceStatus || '',
        reason: event.ResourceStatusReason,
      }));
  }

  /**
   * Extract stack outputs
   */
  private extractOutputs(stack: Stack): Record<string, string> {
    const outputs: Record<string, string> = {};
    if (stack.Outputs) {
      for (const output of stack.Outputs) {
        if (output.OutputKey && output.OutputValue) {
          outputs[output.OutputKey] = output.OutputValue;
        }
      }
    }
    return outputs;
  }

  /**
   * Handle CloudFormation errors with specific error messages
   */
  private handleCloudFormationError(error: any, stackName: string): void {
    console.error(`CloudFormation Error for stack ${stackName}:`, error);

    // Log specific error types for debugging
    if (error.name === 'ValidationError') {
      console.error(`Invalid stack name: ${stackName}`);
    } else if (error.name === 'AccessDenied') {
      console.error(`Access denied to CloudFormation stack: ${stackName}. Check IAM permissions.`);
    } else if (error.name === 'Throttling') {
      console.error(`CloudFormation API throttled for stack: ${stackName}. Retry with backoff.`);
    } else {
      console.error(`Unexpected CloudFormation error for stack ${stackName}:`, error.message);
    }
  }
}
