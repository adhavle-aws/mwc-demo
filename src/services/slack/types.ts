/**
 * Type definitions for Slack Integration Service
 */

export interface SlackConfig {
  botToken: string;
  appToken?: string;
  signingSecret?: string;
}

export interface SlackConnectionConfig {
  maxConnections: number;
  connectionTimeout: number;
  retryAttempts: number;
}

export interface SlackMessage {
  channelId: string;
  userId: string;
  text: string;
  threadId?: string;
  timestamp: string;
}

export interface AgentResponse {
  agentId: string;
  message: string;
  metadata?: Record<string, any>;
}

export interface SlackAuthResult {
  authenticated: boolean;
  botUserId?: string;
  teamId?: string;
  error?: string;
}
