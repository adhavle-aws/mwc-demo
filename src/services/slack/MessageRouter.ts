/**
 * Message Router
 * 
 * Routes incoming Slack messages to appropriate agents based on intent
 * Maintains conversation context and state
 */

import { IntentClassifier, AgentIntent, ClassificationResult } from './IntentClassifier';
import { SlackMessage, AgentResponse } from './types';

export interface AgentHandler {
  agentId: string;
  canHandle: (intent: AgentIntent) => boolean;
  handleMessage: (message: SlackMessage, context: ConversationContext) => Promise<AgentResponse>;
}

export interface ConversationContext {
  conversationId: string;
  userId: string;
  channelId: string;
  threadId?: string;
  history: SlackMessage[];
  metadata: Record<string, any>;
  createdAt: Date;
  lastActivity: Date;
}

export interface RoutingResult {
  success: boolean;
  agentId?: string;
  response?: AgentResponse;
  error?: string;
  classification?: ClassificationResult;
}

export class MessageRouter {
  private intentClassifier: IntentClassifier;
  private agentHandlers: Map<string, AgentHandler> = new Map();
  private conversations: Map<string, ConversationContext> = new Map();
  private readonly maxHistorySize = 50;

  constructor(intentClassifier?: IntentClassifier) {
    this.intentClassifier = intentClassifier || new IntentClassifier();
  }

  /**
   * Register an agent handler
   */
  registerAgent(handler: AgentHandler): void {
    this.agentHandlers.set(handler.agentId, handler);
  }

  /**
   * Unregister an agent handler
   */
  unregisterAgent(agentId: string): void {
    this.agentHandlers.delete(agentId);
  }

  /**
   * Route a message to the appropriate agent
   */
  async routeMessage(message: SlackMessage): Promise<RoutingResult> {
    try {
      // Classify the message intent
      const classification = this.intentClassifier.classify(message.text);

      // Get or create conversation context
      const context = this.getOrCreateContext(message);

      // Add message to conversation history
      this.addToHistory(context, message);

      // Find agent that can handle this intent
      const agent = this.findAgentForIntent(classification.intent);

      if (!agent) {
        return {
          success: false,
          error: `No agent available to handle intent: ${classification.intent}`,
          classification,
        };
      }

      // Route message to agent
      const response = await agent.handleMessage(message, context);

      // Update conversation metadata
      context.lastActivity = new Date();
      context.metadata.lastIntent = classification.intent;
      context.metadata.lastAgentId = agent.agentId;

      return {
        success: true,
        agentId: agent.agentId,
        response,
        classification,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return {
        success: false,
        error: errorMessage,
      };
    }
  }

  /**
   * Find an agent that can handle the given intent
   */
  private findAgentForIntent(intent: AgentIntent): AgentHandler | undefined {
    for (const handler of this.agentHandlers.values()) {
      if (handler.canHandle(intent)) {
        return handler;
      }
    }
    return undefined;
  }

  /**
   * Get or create conversation context
   */
  private getOrCreateContext(message: SlackMessage): ConversationContext {
    // Use thread ID as conversation ID if available, otherwise use channel + user
    const conversationId = message.threadId || `${message.channelId}-${message.userId}`;

    let context = this.conversations.get(conversationId);

    if (!context) {
      context = {
        conversationId,
        userId: message.userId,
        channelId: message.channelId,
        threadId: message.threadId,
        history: [],
        metadata: {},
        createdAt: new Date(),
        lastActivity: new Date(),
      };
      this.conversations.set(conversationId, context);
    }

    return context;
  }

  /**
   * Add message to conversation history
   */
  private addToHistory(context: ConversationContext, message: SlackMessage): void {
    context.history.push(message);

    // Limit history size
    if (context.history.length > this.maxHistorySize) {
      context.history = context.history.slice(-this.maxHistorySize);
    }
  }

  /**
   * Get conversation context by ID
   */
  getContext(conversationId: string): ConversationContext | undefined {
    return this.conversations.get(conversationId);
  }

  /**
   * Get all active conversations
   */
  getActiveConversations(): ConversationContext[] {
    return Array.from(this.conversations.values());
  }

  /**
   * Clear old conversations (older than specified time)
   */
  clearOldConversations(maxAgeMs: number): number {
    const now = Date.now();
    let cleared = 0;

    for (const [id, context] of this.conversations.entries()) {
      if (now - context.lastActivity.getTime() > maxAgeMs) {
        this.conversations.delete(id);
        cleared++;
      }
    }

    return cleared;
  }

  /**
   * Get registered agent IDs
   */
  getRegisteredAgents(): string[] {
    return Array.from(this.agentHandlers.keys());
  }

  /**
   * Check if an agent is registered
   */
  hasAgent(agentId: string): boolean {
    return this.agentHandlers.has(agentId);
  }
}
