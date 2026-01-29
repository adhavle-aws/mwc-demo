// Agent Types
export interface Agent {
  id: string;
  name: string;
  description: string;
  arn: string;
  aliasId: string;
  capabilities: string[];
}

export type AgentStatus = 'available' | 'busy' | 'error' | 'unknown';

// API Request/Response Types
export interface AgentInvocationRequest {
  agentId: string;
  prompt: string;
  sessionId?: string;
}

export interface AgentStatusResponse {
  agentId: string;
  status: AgentStatus;
  arn: string;
  lastInvocation?: Date;
  errorMessage?: string;
}

// CloudFormation Types
export interface ResourceStatus {
  logicalId: string;
  physicalId: string;
  type: string;
  status: string;
  timestamp: Date;
  statusReason?: string;
}

export interface StackEvent {
  timestamp: Date;
  resourceType: string;
  logicalId: string;
  status: string;
  reason?: string;
}

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

// Error Types
export interface ApiError {
  error: string;
  message: string;
  details?: any;
}
