/**
 * Slack Message Manager
 * 
 * Handles message posting, thread creation, and message formatting
 */

import { WebClient, Block, KnownBlock } from '@slack/web-api';
import { SlackConnectionPool } from './SlackConnectionPool';

export interface MessageOptions {
  channelId: string;
  text: string;
  threadId?: string;
  blocks?: (Block | KnownBlock)[];
  attachments?: any[];
  metadata?: Record<string, any>;
}

export interface ThreadInfo {
  threadId: string;
  channelId: string;
  createdAt: Date;
  messageCount: number;
}

export interface MessageResult {
  success: boolean;
  messageId?: string;
  threadId?: string;
  timestamp?: string;
  error?: string;
}

export class SlackMessageManager {
  private connectionPool: SlackConnectionPool;
  private threads: Map<string, ThreadInfo> = new Map();

  constructor(connectionPool: SlackConnectionPool) {
    this.connectionPool = connectionPool;
  }

  /**
   * Post a message to a Slack channel
   * Optionally posts to a specific thread
   */
  async postMessage(options: MessageOptions): Promise<MessageResult> {
    let client: WebClient | null = null;

    try {
      client = await this.connectionPool.acquire();

      const messageArgs: any = {
        channel: options.channelId,
        text: options.text,
      };

      // Add thread_ts if posting to a thread
      if (options.threadId) {
        messageArgs.thread_ts = options.threadId;
      }

      // Add blocks for rich formatting
      if (options.blocks && options.blocks.length > 0) {
        messageArgs.blocks = options.blocks;
      }

      // Add attachments
      if (options.attachments && options.attachments.length > 0) {
        messageArgs.attachments = options.attachments;
      }

      // Add metadata
      if (options.metadata) {
        messageArgs.metadata = {
          event_type: 'agent_message',
          event_payload: options.metadata,
        };
      }

      const response = await client.chat.postMessage(messageArgs);

      if (response.ok && response.ts) {
        // Update thread info if this is a threaded message
        if (options.threadId) {
          this.updateThreadInfo(options.channelId, options.threadId);
        }

        return {
          success: true,
          messageId: response.ts,
          threadId: options.threadId || response.ts,
          timestamp: response.ts,
        };
      } else {
        return {
          success: false,
          error: 'Failed to post message',
        };
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return {
        success: false,
        error: errorMessage,
      };
    } finally {
      if (client) {
        this.connectionPool.release(client);
      }
    }
  }

  /**
   * Create a new thread by posting an initial message
   * Returns the thread ID (timestamp) for future replies
   */
  async createThread(
    channelId: string,
    initialMessage: string,
    blocks?: (Block | KnownBlock)[]
  ): Promise<MessageResult> {
    const result = await this.postMessage({
      channelId,
      text: initialMessage,
      blocks,
    });

    if (result.success && result.threadId) {
      // Store thread information
      this.threads.set(result.threadId, {
        threadId: result.threadId,
        channelId,
        createdAt: new Date(),
        messageCount: 1,
      });
    }

    return result;
  }

  /**
   * Post a reply to an existing thread
   */
  async replyToThread(
    channelId: string,
    threadId: string,
    message: string,
    blocks?: (Block | KnownBlock)[]
  ): Promise<MessageResult> {
    return this.postMessage({
      channelId,
      text: message,
      threadId,
      blocks,
    });
  }

  /**
   * Format a message with blocks for rich content
   */
  formatRichMessage(
    text: string,
    sections?: { type: string; text: string }[]
  ): (Block | KnownBlock)[] {
    const blocks: (Block | KnownBlock)[] = [];

    // Add header
    blocks.push({
      type: 'section',
      text: {
        type: 'mrkdwn',
        text,
      },
    });

    // Add additional sections
    if (sections) {
      sections.forEach((section) => {
        blocks.push({
          type: 'section',
          text: {
            type: section.type === 'code' ? 'mrkdwn' : 'plain_text',
            text: section.type === 'code' ? `\`\`\`${section.text}\`\`\`` : section.text,
          },
        });
      });
    }

    return blocks;
  }

  /**
   * Format a status update message
   */
  formatStatusMessage(
    title: string,
    status: 'success' | 'warning' | 'error' | 'info',
    details: string
  ): (Block | KnownBlock)[] {
    const emoji = {
      success: ':white_check_mark:',
      warning: ':warning:',
      error: ':x:',
      info: ':information_source:',
    };

    return [
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `${emoji[status]} *${title}*\n${details}`,
        },
      },
    ];
  }

  /**
   * Get thread information
   */
  getThreadInfo(threadId: string): ThreadInfo | undefined {
    return this.threads.get(threadId);
  }

  /**
   * Update thread message count
   */
  private updateThreadInfo(channelId: string, threadId: string): void {
    const thread = this.threads.get(threadId);
    if (thread) {
      thread.messageCount++;
    } else {
      // Thread wasn't created through createThread, add it now
      this.threads.set(threadId, {
        threadId,
        channelId,
        createdAt: new Date(),
        messageCount: 1,
      });
    }
  }

  /**
   * Get all tracked threads
   */
  getAllThreads(): ThreadInfo[] {
    return Array.from(this.threads.values());
  }

  /**
   * Clear thread tracking
   */
  clearThreads(): void {
    this.threads.clear();
  }

  /**
   * Post a message with attachments
   */
  async postMessageWithAttachments(
    channelId: string,
    text: string,
    attachments: any[],
    threadId?: string
  ): Promise<MessageResult> {
    return this.postMessage({
      channelId,
      text,
      attachments,
      threadId,
    });
  }
}
