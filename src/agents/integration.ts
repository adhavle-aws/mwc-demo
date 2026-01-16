/**
 * Agent Integration Module
 * 
 * Wires agents to Slack integration services
 * Handles message routing and notification callbacks
 */

import { OnboardingAgent } from './OnboardingAgent';
import { ProvisioningAgent } from './ProvisioningAgent';
import { MessageRouter } from '../services/slack/MessageRouter';
import { NotificationService } from '../services/slack/NotificationService';

/**
 * Wire OnboardingAgent to Slack integration
 */
export function wireOnboardingAgent(
  agent: OnboardingAgent,
  router: MessageRouter,
  notificationService: NotificationService
): void {
  // Set notification service on agent
  agent.setNotificationService(notificationService);

  // Register agent with message router
  router.registerAgent(agent);
}

/**
 * Unwire OnboardingAgent from Slack integration
 */
export function unwireOnboardingAgent(
  agent: OnboardingAgent,
  router: MessageRouter
): void {
  // Unregister agent from message router
  router.unregisterAgent(agent.agentId);
}

/**
 * Wire ProvisioningAgent to Slack integration
 */
export function wireProvisioningAgent(
  agent: ProvisioningAgent,
  router: MessageRouter,
  notificationService: NotificationService
): void {
  // Set notification service on agent
  agent.setNotificationService(notificationService);

  // Register agent with message router
  router.registerAgent(agent);
}

/**
 * Unwire ProvisioningAgent from Slack integration
 */
export function unwireProvisioningAgent(
  agent: ProvisioningAgent,
  router: MessageRouter
): void {
  // Unregister agent from message router
  router.unregisterAgent(agent.agentId);
}

