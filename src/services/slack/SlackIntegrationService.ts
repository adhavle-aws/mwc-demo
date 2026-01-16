/**
 * Slack Integration Service
 * 
 * Main service that integrates all Slack functionality
 * Provides a unified interface for Slack operations
 */

import { SlackAuthManager } from './SlackAuthManager';
import { SlackConnectionPool } from './SlackConnectionPool';
import { SlackMessageManager } from './SlackMessageManager';
import { MessageRouter, AgentHandler } from './MessageRouter';
import { NotificationService } from './NotificationService';
import { IntentClassifier } from './IntentClassifier';
import {
  SlackConfig,
  SlackConnectionConfig,
  SlackMessage,
  AgentResponse,
  SlackAuthResult,
} from './types';
import { MessageOptions, MessageResult } from './SlackMessageManager';
import { NotificationConfig, NotificationResult } from './NotificationService';

export interface SlackIntegration {
  sendMessage(channelId: string, message: string, threadId?: string): Promise<void>;
  routeMessage(message: SlackMessage): Promise<AgentResponse>;
  authenticateBot(): Promise<boolean>;
  createThread(channelId: string, initialMessage: string): Promise<string>;
}

export class SlackIntegrationService implements SlackIntegration {
  private authManager: SlackAuthManager;
  private connectionPool: SlackConnectionPool;
  private messageManager: SlackMessageManager;
  private messageRouter: MessageRouter;
  private notificationService: NotificationService;
  private intentClassifier: IntentClassifier;

  constructor(
    config: SlackConfig,
    connectionConfig?: Partial<SlackConnectionConfig>
  ) {
    // Initialize authentication
    this.authManager = new SlackAuthManager(config);

    // Initialize connection pool
    this.connectionPool = new SlackConnectionPool(this.authManager, connectionConfig);

    // Initialize message manager
    this.messageManager = new SlackMessageManager(this.connectionPool);

    // Initialize intent classifier and message router
    this.intentClassifier = new IntentClassifier();
    this.messageRouter = new MessageRouter(this.intentClassifier);

    // Initialize notification service
    this.notificationService = new NotificationService(this.messageManager);
  }

  /**
   * Authenticate with Slack
   */
  async authenticateBot(): Promise<boolean> {
    const result = await this.authManager.authenticate();
    return result.authenticated;
  }

  /**
   * Get authentication result details
   */
  async getAuthResult(): Promise<SlackAuthResult> {
    return this.authManager.authenticate();
  }

  /**
   * Send a message to a Slack channel
   */
  async sendMessage(
    channelId: string,
    message: string,
    threadId?: string
  ): Promise<void> {
    const result = await this.messageManager.postMessage({
      channelId,
      text: message,
      threadId,
    });

    if (!result.success) {
      throw new Error(`Failed to send message: ${result.error}`);
    }
  }

  /**
   * Send a message with options
   */
  async sendMessageWithOptions(options: MessageOptions): Promise<MessageResult> {
    return this.messageManager.postMessage(options);
  }

  /**
   * Create a new thread
   */
  async createThread(channelId: string, initialMessage: string): Promise<string> {
    const result = await this.messageManager.createThread(channelId, initialMessage);

    if (!result.success || !result.threadId) {
      throw new Error(`Failed to create thread: ${result.error}`);
    }

    return result.threadId;
  }

  /**
   * Route an incoming message to the appropriate agent
   */
  async routeMessage(message: SlackMessage): Promise<AgentResponse> {
    const result = await this.messageRouter.routeMessage(message);

    if (!result.success || !result.response) {
      throw new Error(`Failed to route message: ${result.error}`);
    }

    return result.response;
  }

  /**
   * Register an agent handler
   */
  registerAgent(handler: AgentHandler): void {
    this.messageRouter.registerAgent(handler);
  }

  /**
   * Unregister an agent handler
   */
  unregisterAgent(agentId: string): void {
    this.messageRouter.unregisterAgent(agentId);
  }

  /**
   * Send a notification
   */
  async sendNotification(
    eventType: string,
    title: string,
    details: string,
    config: NotificationConfig
  ): Promise<NotificationResult> {
    return this.notificationService.sendNotification(
      {
        eventType: eventType as any,
        title,
        details,
      },
      config
    );
  }

  /**
   * Get notification service for direct access
   */
  getNotificationService(): NotificationService {
    return this.notificationService;
  }

  /**
   * Get message manager for direct access
   */
  getMessageManager(): SlackMessageManager {
    return this.messageManager;
  }

  /**
   * Get message router for direct access
   */
  getMessageRouter(): MessageRouter {
    return this.messageRouter;
  }

  /**
   * Get connection pool statistics
   */
  getConnectionStats() {
    return this.connectionPool.getStats();
  }

  /**
   * Perform health check on connections
   */
  async healthCheck(): Promise<void> {
    await this.connectionPool.healthCheck();
    this.connectionPool.pruneFailedConnections();
  }

  /**
   * Shutdown the service
   */
  async shutdown(): Promise<void> {
    await this.connectionPool.closeAll();
    this.authManager.revoke();
  }
}
