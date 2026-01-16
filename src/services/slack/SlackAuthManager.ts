/**
 * Slack Authentication Manager
 * 
 * Handles OAuth 2.0 token-based authentication with Slack API
 * Manages token refresh and expiration
 */

import { WebClient } from '@slack/web-api';
import { SlackConfig, SlackAuthResult } from './types';

export class SlackAuthManager {
  private botToken: string;
  private client: WebClient | null = null;
  private authenticated: boolean = false;
  private botUserId?: string;
  private teamId?: string;
  private tokenExpirationTime?: number;

  constructor(config: SlackConfig) {
    this.botToken = config.botToken;
  }

  /**
   * Authenticate with Slack using bot token
   * Validates token and retrieves bot identity
   */
  async authenticate(): Promise<SlackAuthResult> {
    try {
      // Create Slack Web API client with bot token
      this.client = new WebClient(this.botToken);

      // Test authentication by calling auth.test
      const authResponse = await this.client.auth.test();

      if (authResponse.ok) {
        this.authenticated = true;
        this.botUserId = authResponse.user_id as string;
        this.teamId = authResponse.team_id as string;

        return {
          authenticated: true,
          botUserId: this.botUserId,
          teamId: this.teamId,
        };
      } else {
        this.authenticated = false;
        return {
          authenticated: false,
          error: 'Authentication failed',
        };
      }
    } catch (error) {
      this.authenticated = false;
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return {
        authenticated: false,
        error: errorMessage,
      };
    }
  }

  /**
   * Check if currently authenticated
   */
  isAuthenticated(): boolean {
    return this.authenticated;
  }

  /**
   * Get authenticated Slack client
   * Throws error if not authenticated
   */
  getClient(): WebClient {
    if (!this.client || !this.authenticated) {
      throw new Error('Not authenticated. Call authenticate() first.');
    }
    return this.client;
  }

  /**
   * Get bot user ID
   */
  getBotUserId(): string | undefined {
    return this.botUserId;
  }

  /**
   * Get team ID
   */
  getTeamId(): string | undefined {
    return this.teamId;
  }

  /**
   * Refresh authentication token
   * For bot tokens, this re-validates the existing token
   */
  async refreshToken(): Promise<SlackAuthResult> {
    return this.authenticate();
  }

  /**
   * Check if token needs refresh
   * For bot tokens, we check by attempting a lightweight API call
   */
  async needsRefresh(): Promise<boolean> {
    if (!this.client || !this.authenticated) {
      return true;
    }

    try {
      const response = await this.client.auth.test();
      return !response.ok;
    } catch (error) {
      return true;
    }
  }

  /**
   * Revoke authentication and clear client
   */
  revoke(): void {
    this.client = null;
    this.authenticated = false;
    this.botUserId = undefined;
    this.teamId = undefined;
    this.tokenExpirationTime = undefined;
  }
}
