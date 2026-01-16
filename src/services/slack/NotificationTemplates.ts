/**
 * Notification Templates
 * 
 * Defines templates for different notification event types
 */

import { Block, KnownBlock } from '@slack/web-api';

export type NotificationEventType =
  | 'onboarding_started'
  | 'onboarding_completed'
  | 'onboarding_failed'
  | 'provisioning_started'
  | 'provisioning_completed'
  | 'provisioning_failed'
  | 'deployment_progress'
  | 'manual_intervention_required'
  | 'workflow_checkpoint'
  | 'error_alert';

export interface NotificationData {
  eventType: NotificationEventType;
  title: string;
  details: string;
  metadata?: Record<string, any>;
  timestamp?: Date;
  severity?: 'info' | 'warning' | 'error' | 'success';
}

export class NotificationTemplates {
  /**
   * Generate notification blocks based on event type
   */
  static generateNotification(data: NotificationData): {
    text: string;
    blocks: (Block | KnownBlock)[];
  } {
    const timestamp = data.timestamp || new Date();
    const severity = data.severity || this.inferSeverity(data.eventType);

    const emoji = this.getEmojiForSeverity(severity);
    const color = this.getColorForSeverity(severity);

    const text = `${emoji} ${data.title}`;

    const blocks: (Block | KnownBlock)[] = [
      {
        type: 'header',
        text: {
          type: 'plain_text',
          text: `${emoji} ${data.title}`,
          emoji: true,
        },
      },
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: data.details,
        },
      },
      {
        type: 'context',
        elements: [
          {
            type: 'mrkdwn',
            text: `*Event:* ${data.eventType} | *Time:* ${timestamp.toISOString()}`,
          },
        ],
      },
    ];

    // Add metadata section if present
    if (data.metadata && Object.keys(data.metadata).length > 0) {
      const metadataText = Object.entries(data.metadata)
        .map(([key, value]) => `*${key}:* ${value}`)
        .join('\n');

      blocks.push({
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: metadataText,
        },
      });
    }

    blocks.push({
      type: 'divider',
    });

    return { text, blocks };
  }

  /**
   * Generate onboarding started notification
   */
  static onboardingStarted(customerId: string, customerName: string): NotificationData {
    return {
      eventType: 'onboarding_started',
      title: 'Onboarding Started',
      details: `Onboarding process has been initiated for customer *${customerName}*.`,
      metadata: {
        'Customer ID': customerId,
        'Customer Name': customerName,
      },
      severity: 'info',
    };
  }

  /**
   * Generate onboarding completed notification
   */
  static onboardingCompleted(
    customerId: string,
    customerName: string,
    packageId: string
  ): NotificationData {
    return {
      eventType: 'onboarding_completed',
      title: 'Onboarding Completed',
      details: `Onboarding process completed successfully for customer *${customerName}*. CloudFormation package is ready for deployment.`,
      metadata: {
        'Customer ID': customerId,
        'Customer Name': customerName,
        'Package ID': packageId,
      },
      severity: 'success',
    };
  }

  /**
   * Generate onboarding failed notification
   */
  static onboardingFailed(
    customerId: string,
    customerName: string,
    error: string
  ): NotificationData {
    return {
      eventType: 'onboarding_failed',
      title: 'Onboarding Failed',
      details: `Onboarding process failed for customer *${customerName}*.\n\n*Error:* ${error}`,
      metadata: {
        'Customer ID': customerId,
        'Customer Name': customerName,
      },
      severity: 'error',
    };
  }

  /**
   * Generate provisioning started notification
   */
  static provisioningStarted(
    deploymentId: string,
    packageId: string
  ): NotificationData {
    return {
      eventType: 'provisioning_started',
      title: 'Provisioning Started',
      details: `CloudFormation stack deployment has been initiated.`,
      metadata: {
        'Deployment ID': deploymentId,
        'Package ID': packageId,
      },
      severity: 'info',
    };
  }

  /**
   * Generate provisioning completed notification
   */
  static provisioningCompleted(
    deploymentId: string,
    stackId: string,
    resourceCount: number
  ): NotificationData {
    return {
      eventType: 'provisioning_completed',
      title: 'Provisioning Completed',
      details: `CloudFormation stack deployment completed successfully. ${resourceCount} resources created.`,
      metadata: {
        'Deployment ID': deploymentId,
        'Stack ID': stackId,
        'Resources Created': resourceCount.toString(),
      },
      severity: 'success',
    };
  }

  /**
   * Generate provisioning failed notification
   */
  static provisioningFailed(
    deploymentId: string,
    error: string
  ): NotificationData {
    return {
      eventType: 'provisioning_failed',
      title: 'Provisioning Failed',
      details: `CloudFormation stack deployment failed.\n\n*Error:* ${error}`,
      metadata: {
        'Deployment ID': deploymentId,
      },
      severity: 'error',
    };
  }

  /**
   * Generate deployment progress notification
   */
  static deploymentProgress(
    deploymentId: string,
    progress: number,
    status: string
  ): NotificationData {
    return {
      eventType: 'deployment_progress',
      title: 'Deployment Progress Update',
      details: `Deployment is ${progress}% complete.\n\n*Status:* ${status}`,
      metadata: {
        'Deployment ID': deploymentId,
        'Progress': `${progress}%`,
      },
      severity: 'info',
    };
  }

  /**
   * Generate manual intervention required notification
   */
  static manualInterventionRequired(
    workflowId: string,
    reason: string,
    action: string
  ): NotificationData {
    return {
      eventType: 'manual_intervention_required',
      title: 'Manual Intervention Required',
      details: `Workflow requires manual intervention.\n\n*Reason:* ${reason}\n*Required Action:* ${action}`,
      metadata: {
        'Workflow ID': workflowId,
      },
      severity: 'warning',
    };
  }

  /**
   * Generate workflow checkpoint notification
   */
  static workflowCheckpoint(
    workflowId: string,
    checkpointName: string
  ): NotificationData {
    return {
      eventType: 'workflow_checkpoint',
      title: 'Workflow Checkpoint Reached',
      details: `Workflow has reached checkpoint: *${checkpointName}*`,
      metadata: {
        'Workflow ID': workflowId,
        'Checkpoint': checkpointName,
      },
      severity: 'info',
    };
  }

  /**
   * Generate error alert notification
   */
  static errorAlert(
    component: string,
    errorMessage: string,
    errorCode?: string
  ): NotificationData {
    return {
      eventType: 'error_alert',
      title: 'Error Alert',
      details: `An error occurred in ${component}.\n\n*Error:* ${errorMessage}`,
      metadata: {
        Component: component,
        ...(errorCode && { 'Error Code': errorCode }),
      },
      severity: 'error',
    };
  }

  /**
   * Infer severity from event type
   */
  private static inferSeverity(
    eventType: NotificationEventType
  ): 'info' | 'warning' | 'error' | 'success' {
    if (eventType.includes('failed') || eventType.includes('error')) {
      return 'error';
    }
    if (eventType.includes('completed')) {
      return 'success';
    }
    if (eventType.includes('intervention')) {
      return 'warning';
    }
    return 'info';
  }

  /**
   * Get emoji for severity level
   */
  private static getEmojiForSeverity(
    severity: 'info' | 'warning' | 'error' | 'success'
  ): string {
    const emojiMap = {
      info: ':information_source:',
      warning: ':warning:',
      error: ':x:',
      success: ':white_check_mark:',
    };
    return emojiMap[severity];
  }

  /**
   * Get color for severity level
   */
  private static getColorForSeverity(
    severity: 'info' | 'warning' | 'error' | 'success'
  ): string {
    const colorMap = {
      info: '#2196F3',
      warning: '#FF9800',
      error: '#F44336',
      success: '#4CAF50',
    };
    return colorMap[severity];
  }
}
