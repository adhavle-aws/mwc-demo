/**
 * Slack Connection Pool
 * 
 * Manages a pool of Slack API clients for efficient connection reuse
 * Handles connection lifecycle and health checks
 */

import { WebClient } from '@slack/web-api';
import { SlackAuthManager } from './SlackAuthManager';
import { SlackConnectionConfig } from './types';

interface PooledConnection {
  client: WebClient;
  inUse: boolean;
  lastUsed: number;
  healthCheckFailed: boolean;
}

export class SlackConnectionPool {
  private authManager: SlackAuthManager;
  private config: SlackConnectionConfig;
  private connections: PooledConnection[] = [];
  private readonly defaultConfig: SlackConnectionConfig = {
    maxConnections: 10,
    connectionTimeout: 30000,
    retryAttempts: 3,
  };

  constructor(authManager: SlackAuthManager, config?: Partial<SlackConnectionConfig>) {
    this.authManager = authManager;
    this.config = { ...this.defaultConfig, ...config };
  }

  /**
   * Acquire a client from the pool
   * Creates new connection if pool not at capacity
   */
  async acquire(): Promise<WebClient> {
    // Ensure authentication
    if (!this.authManager.isAuthenticated()) {
      await this.authManager.authenticate();
    }

    // Try to find an available connection
    const available = this.connections.find(
      (conn) => !conn.inUse && !conn.healthCheckFailed
    );

    if (available) {
      available.inUse = true;
      available.lastUsed = Date.now();
      return available.client;
    }

    // Create new connection if under max capacity
    if (this.connections.length < this.config.maxConnections) {
      const client = this.authManager.getClient();
      const connection: PooledConnection = {
        client,
        inUse: true,
        lastUsed: Date.now(),
        healthCheckFailed: false,
      };
      this.connections.push(connection);
      return client;
    }

    // Wait for a connection to become available
    return this.waitForAvailableConnection();
  }

  /**
   * Release a client back to the pool
   */
  release(client: WebClient): void {
    const connection = this.connections.find((conn) => conn.client === client);
    if (connection) {
      connection.inUse = false;
      connection.lastUsed = Date.now();
    }
  }

  /**
   * Wait for an available connection with timeout
   */
  private async waitForAvailableConnection(): Promise<WebClient> {
    const startTime = Date.now();
    const checkInterval = 100; // Check every 100ms

    while (Date.now() - startTime < this.config.connectionTimeout) {
      const available = this.connections.find(
        (conn) => !conn.inUse && !conn.healthCheckFailed
      );

      if (available) {
        available.inUse = true;
        available.lastUsed = Date.now();
        return available.client;
      }

      await new Promise((resolve) => setTimeout(resolve, checkInterval));
    }

    throw new Error('Connection pool timeout: No available connections');
  }

  /**
   * Perform health check on all connections
   * Marks unhealthy connections for removal
   */
  async healthCheck(): Promise<void> {
    const healthCheckPromises = this.connections.map(async (conn) => {
      if (conn.inUse) {
        return; // Skip connections in use
      }

      try {
        await conn.client.auth.test();
        conn.healthCheckFailed = false;
      } catch (error) {
        conn.healthCheckFailed = true;
      }
    });

    await Promise.all(healthCheckPromises);
  }

  /**
   * Remove failed connections from pool
   */
  pruneFailedConnections(): void {
    this.connections = this.connections.filter(
      (conn) => !conn.healthCheckFailed || conn.inUse
    );
  }

  /**
   * Get pool statistics
   */
  getStats(): {
    total: number;
    inUse: number;
    available: number;
    failed: number;
  } {
    return {
      total: this.connections.length,
      inUse: this.connections.filter((c) => c.inUse).length,
      available: this.connections.filter((c) => !c.inUse && !c.healthCheckFailed)
        .length,
      failed: this.connections.filter((c) => c.healthCheckFailed).length,
    };
  }

  /**
   * Close all connections and clear pool
   */
  async closeAll(): Promise<void> {
    // Wait for all in-use connections to be released (with timeout)
    const timeout = 5000;
    const startTime = Date.now();

    while (
      this.connections.some((c) => c.inUse) &&
      Date.now() - startTime < timeout
    ) {
      await new Promise((resolve) => setTimeout(resolve, 100));
    }

    // Clear all connections
    this.connections = [];
  }

  /**
   * Get current pool size
   */
  size(): number {
    return this.connections.length;
  }
}
