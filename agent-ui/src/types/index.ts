// Type definitions for Agent UI
// This file serves as the central export point for all TypeScript types

// ============================================================================
// Core Domain Models
// ============================================================================

/**
 * Agent status indicator
 */
export type AgentStatus = 'available' | 'busy' | 'error' | 'unknown';

/**
 * Agent model representing an AI agent in the system
 */
export interface Agent {
  id: string;
  name: string;
  description: string;
  status: AgentStatus;
  arn: string;
  capabilities: string[];
  icon?: string;
}

/**
 * Message role type
 */
export type MessageRole = 'user' | 'agent';

/**
 * Message metadata for tracking and debugging
 */
export interface MessageMetadata {
  requestId?: string;
  sessionId?: string;
  duration?: number;
}

/**
 * Message model representing a single chat message
 */
export interface Message {
  id: string;
  role: MessageRole;
  content: string;
  timestamp: Date;
  agentId: string;
  metadata?: MessageMetadata;
}

/**
 * Conversation model containing message history for an agent
 */
export interface Conversation {
  agentId: string;
  messages: Message[];
  lastResponse?: ParsedResponse;
  activeTab?: string;
}

// ============================================================================
// Response Parsing Models
// ============================================================================

/**
 * Response section type
 */
export type ResponseSectionType = 
  | 'architecture' 
  | 'cost' 
  | 'template' 
  | 'summary' 
  | 'progress' 
  | 'resources';

/**
 * Response section containing parsed content from agent response
 */
export interface ResponseSection {
  type: ResponseSectionType;
  title: string;
  content: string;
  metadata?: any;
}

/**
 * Tab definition for displaying response sections
 */
export interface TabDefinition {
  id: string;
  label: string;
  icon?: string;
  content: ResponseSection;
}

/**
 * Parsed response containing structured sections and tabs
 */
export interface ParsedResponse {
  raw: string;
  sections: ResponseSection[];
  tabs: TabDefinition[];
  architecture?: string;
  costOptimization?: string;
  template?: string;
  summary?: string;
  progress?: DeploymentProgress;
  resources?: ResourceStatus[];
  events?: StackEvent[];
}

// ============================================================================
// Deployment and Progress Models
// ============================================================================

/**
 * Deployment status type
 */
export type DeploymentStatus = 'IN_PROGRESS' | 'COMPLETE' | 'FAILED';

/**
 * Resource status for CloudFormation resources
 */
export interface ResourceStatus {
  logicalId: string;
  physicalId: string;
  type: string;
  status: string;
  timestamp: Date;
}

/**
 * Deployment progress tracking
 */
export interface DeploymentProgress {
  status: DeploymentStatus;
  percentage: number;
  currentStep: string;
  resources: ResourceStatus[];
}

/**
 * CloudFormation stack event
 */
export interface StackEvent {
  timestamp: Date;
  resourceType: string;
  logicalId: string;
  status: string;
  reason?: string;
}

// ============================================================================
// API Request/Response Models
// ============================================================================

/**
 * Agent invocation request
 */
export interface AgentInvocationRequest {
  agentId: string;
  prompt: string;
  sessionId?: string;
}

/**
 * Agent invocation response with streaming support
 */
export interface AgentInvocationResponse {
  sessionId: string;
  requestId: string;
  stream: ReadableStream<string>;
}

/**
 * Agent status check response
 */
export interface AgentStatusResponse {
  agentId: string;
  status: AgentStatus;
  arn: string;
  lastInvocation?: Date;
  errorMessage?: string;
}

/**
 * CloudFormation stack status response
 */
export interface StackStatusResponse {
  stackName: string;
  stackId: string;
  status: string;
  resources: ResourceStatus[];
  outputs: Record<string, string>;
  events: StackEvent[];
  creationTime: Date;
  lastUpdatedTime?: Date;
}

// ============================================================================
// Application State Models
// ============================================================================

/**
 * User model (placeholder for future authentication)
 */
export interface User {
  id?: string;
  name?: string;
  email?: string;
}

/**
 * Application state
 */
export interface AppState {
  selectedAgentId: string;
  agents: Agent[];
  conversations: Record<string, Conversation>;
  user: User;
  error?: ErrorInfo | null;
}

/**
 * User preferences
 */
export interface UserPreferences {
  theme: 'dark' | 'light';
  sideNavCollapsed: boolean;
  codeTheme: string;
}

/**
 * Stored conversation for persistence
 */
export interface StoredConversation {
  agentId: string;
  messages: Message[];
  lastResponse?: ParsedResponse;
  activeTab?: string;
  timestamp: Date;
}

/**
 * Stored state for local storage persistence
 */
export interface StoredState {
  version: string;
  conversations: Record<string, StoredConversation>;
  preferences: UserPreferences;
  lastSelectedAgent: string;
}

// ============================================================================
// Component Props Interfaces
// ============================================================================

/**
 * Agent type for response parsing
 */
export type AgentType = 'onboarding' | 'provisioning' | 'orchestrator';

/**
 * Template format type
 */
export type TemplateFormat = 'yaml' | 'json';

/**
 * SideNavigation component props
 */
export interface SideNavigationProps {
  agents: Agent[];
  selectedAgentId: string;
  onAgentSelect: (agentId: string) => void;
}

/**
 * ChatWindow component props
 */
export interface ChatWindowProps {
  agentId: string;
  messages: Message[];
  onSendMessage: (content: string) => void;
  isLoading: boolean;
}

/**
 * ResponseViewer component props
 */
export interface ResponseViewerProps {
  response: ParsedResponse;
  agentType: AgentType;
}

/**
 * TemplateTab component props
 */
export interface TemplateTabProps {
  template: string;
  format: TemplateFormat;
}

/**
 * ProgressTab component props
 */
export interface ProgressTabProps {
  stackName: string;
  status: string;
  resources: ResourceStatus[];
  events: StackEvent[];
  startTime: Date;
}

/**
 * AgentStatusIndicator component props
 */
export interface AgentStatusIndicatorProps {
  status: AgentStatus;
  tooltip?: string;
}

/**
 * ArchitectureTab component props
 */
export interface ArchitectureTabProps {
  content: string;
  diagramUrl?: string;
}

/**
 * CostOptimizationTab component props
 */
export interface CostOptimizationTabProps {
  content: string;
}

/**
 * SummaryTab component props
 */
export interface SummaryTabProps {
  content: string;
}

/**
 * Resource model for ResourcesTab
 */
export interface Resource {
  logicalId: string;
  physicalId: string;
  type: string;
  status: string;
  timestamp?: Date;
  properties?: Record<string, any>;
}

/**
 * ResourcesTab component props
 */
export interface ResourcesTabProps {
  resources: Resource[];
}

// ============================================================================
// Error Models
// ============================================================================

/**
 * Error type categorization
 */
export type ErrorType = 'network' | 'authentication' | 'agent' | 'deployment' | 'client';

/**
 * Error information
 */
export interface ErrorInfo {
  type: ErrorType;
  message: string;
  details?: string;
  timestamp: Date;
  retryable: boolean;
  agentId?: string;
  operation?: string;
}

/**
 * ErrorMessage component props
 */
export interface ErrorMessageProps {
  error: ErrorInfo;
  onRetry?: () => void;
  onDismiss?: () => void;
}
