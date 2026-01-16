/**
 * Notification Service
 * 
 * Handles notification delivery to stakeholders with retry logic
 */

import { SlackMessageManager, MessageResult } from './SlackMessageManager';
import { NotificationTemplates, NotificationData, NotificationEventType } from './NotificationTemplates';

export interface Stakeholder {
  userId?: string;
  channelId?: string;
  email?: string;
}

export interface NotificationConfig {
  stakeholders: Stakeholder[];
  threadId?: string;
  retryAttempts?: number;
  retryDelayMs?: number;
}

export interface NotificationResult {
  success: boolean;
  deliveredTo: string[];
  failedDeliveries: Array<{ target: string; error: string }>;
  totalAttempts: number;
}

export class NotificationService {
  private messageManager: SlackMessageManager;
  private readonly defaultRetryAttempts = 3;
  private readonly defaultRetryDelayMs = 1000;

  constructor(messageManager: SlackMessageManager) {
    this.messageManager = messageManager;
  }

  /**
   * Send notification to stakeholders
   */
  async sendNotification(
    data: NotificationData,
    config: NotificationConfig
  ): Promise<NotificationResult> {
    const { text, blocks } = NotificationTemplates.generateNotification(data);

    const deliveredTo: string[] = [];
    const failedDeliveries: Array<{ target: string; error: string }> = [];
    let totalAttempts = 0;

    const retryAttempts = config.retryAttempts ?? this.defaultRetryAttempts;
    const retryDelayMs = config.retryDelayMs ?? this.defaultRetryDelayMs;

    // Send to each stakeholder
    for (const stakeholder of config.stakeholders) {
      if (stakeholder.channelId) {
        const result = await this.sendWithRetry(
          stakeholder.channelId,
          text,
          blocks,
          config.threadId,
          retryAttempts,
          retryDelayMs
        );

        totalAttempts += result.attempts;

        if (result.success) {
          deliveredTo.push(stakeholder.channelId);
        } else {
          failedDeliveries.push({
            target: stakeholder.channelId,
            error: result.error || 'Unknown error',
          });
        }
      }
    }

    return {
      success: failedDeliveries.length === 0,
      deliveredTo,
      failedDeliveries,
      totalAttempts,
    };
  }

  /**
   * Send notification with retry logic
   */
  private async sendWithRetry(
    channelId: string,
    text: string,
    blocks: any[],
    threadId: string | undefined,
    maxAttempts: number,
    delayMs: number
  ): Promise<{ success: boolean; attempts: number; error?: string }> {
    let attempts = 0;
    let lastError: string | undefined;

    while (attempts < maxAttempts) {
      attempts++;

      try {
        const result = await this.messageManager.postMessage({
          channelId,
          text,
          blocks,
          threadId,
        });

        if (result.success) {
          return { success: true, attempts };
        }

        lastError = result.error;
      } catch (error) {
        lastError = error instanceof Error ? error.message : 'Unknown error';
      }

      // Wait before retry (exponential backoff)
      if (attempts < maxAttempts) {
        await this.delay(delayMs * Math.pow(2, attempts - 1));
      }
    }

    return {
      success: false,
      attempts,
      error: lastError,
    };
  }

  /**
   * Send onboarding started notification
   */
  async notifyOnboardingStarted(
    customerId: string,
    customerName: string,
    config: NotificationConfig
  ): Promise<NotificationResult> {
    const data = NotificationTemplates.onboardingStarted(customerId, customerName);
    return this.sendNotification(data, config);
  }

  /**
   * Send onboarding completed notification
   */
  async notifyOnboardingCompleted(
    customerId: string,
    customerName: string,
    packageId: string,
    config: NotificationConfig
  ): Promise<NotificationResult> {
    const data = NotificationTemplates.onboardingCompleted(
      customerId,
      customerName,
      packageId
    );
    return this.sendNotification(data, config);
  }

  /**
   * Send onboarding failed notification
   */
  async notifyOnboardingFailed(
    customerId: string,
    customerName: string,
    error: string,
    config: NotificationConfig
  ): Promise<NotificationResult> {
    const data = NotificationTemplates.onboardingFailed(
      customerId,
      customerName,
      error
    );
    return this.sendNotification(data, config);
  }

  /**
   * Send provisioning started notification
   */
  async notifyProvisioningStarted(
    packageId: string,
    version: string,
    targetAccount: string,
    config: NotificationConfig
  ): Promise<NotificationResult> {
    const data = NotificationTemplates.provisioningStarted(packageId, `${packageId}:${version}`);
    return this.sendNotification(data, config);
  }

  /**
   * Send provisioning completed notification
   */
  async notifyProvisioningCompleted(
    packageId: string,
    version: string,
    targetAccount: string,
    config: NotificationConfig
  ): Promise<NotificationResult> {
    const data = NotificationTemplates.provisioningCompleted(
      `${packageId}:${version}`,
      targetAccount,
      0
    );
    return this.sendNotification(data, config);
  }

  /**
   * Send provisioning failed notification
   */
  async notifyProvisioningFailed(
    packageId: string,
    version: string,
    targetAccount: string,
    error: string,
    config: NotificationConfig
  ): Promise<NotificationResult> {
    const data = NotificationTemplates.provisioningFailed(`${packageId}:${version}`, error);
    return this.sendNotification(data, config);
  }

  /**
   * Send deployment progress notification
   */
  async notifyDeploymentProgress(
    deploymentId: string,
    progress: number,
    status: string,
    config: NotificationConfig
  ): Promise<NotificationResult> {
    const data = NotificationTemplates.deploymentProgress(
      deploymentId,
      progress,
      status
    );
    return this.sendNotification(data, config);
  }

  /**
   * Send manual intervention required notification
   */
  async notifyManualInterventionRequired(
    workflowId: string,
    reason: string,
    action: string,
    config: NotificationConfig
  ): Promise<NotificationResult> {
    const data = NotificationTemplates.manualInterventionRequired(
      workflowId,
      reason,
      action
    );
    return this.sendNotification(data, config);
  }

  /**
   * Send workflow checkpoint notification
   */
  async notifyWorkflowCheckpoint(
    workflowId: string,
    checkpointName: string,
    config: NotificationConfig
  ): Promise<NotificationResult> {
    const data = NotificationTemplates.workflowCheckpoint(workflowId, checkpointName);
    return this.sendNotification(data, config);
  }

  /**
   * Send error alert notification
   */
  async notifyError(
    component: string,
    errorMessage: string,
    config: NotificationConfig,
    errorCode?: string
  ): Promise<NotificationResult> {
    const data = NotificationTemplates.errorAlert(component, errorMessage, errorCode);
    return this.sendNotification(data, config);
  }

  /**
   * Delay helper for retry logic
   */
  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
