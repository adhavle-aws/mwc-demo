/**
 * Agent implementations
 * 
 * This module contains:
 * - Onboarding Agent
 * - Provisioning Agent
 * - AWS Integration Clients
 */

export { OnboardingAgent, OnboardingAgentConfig, OnboardingWorkflowData } from './OnboardingAgent';
export { ProvisioningAgent, ProvisioningAgentConfig, ProvisioningWorkflowData } from './ProvisioningAgent';
export { 
  wireOnboardingAgent, 
  unwireOnboardingAgent,
  wireProvisioningAgent,
  unwireProvisioningAgent,
} from './integration';
export { IAMRoleManager, IAMRoleConfig, RoleDefinition, RoleCreationResult, AssumeRoleResult } from './aws/IAMRoleManager';
