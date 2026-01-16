/**
 * Core data models for the Agent-based Onboarding and Provisioning System
 * These types define the structure of data flowing through the system
 */

// ============================================================================
// Customer Requirements Models
// ============================================================================

export interface CustomerRequirements {
  customerId: string;
  customerName: string;
  contactEmail: string;
  infrastructure: InfrastructureSpec;
  compliance: ComplianceRequirements;
  timeline: ProjectTimeline;
}

export interface InfrastructureSpec {
  regions: string[];
  services: AWSServiceSpec[];
  networking: NetworkingConfig;
  security: SecurityConfig;
  scalingRequirements: ScalingSpec;
}

export interface AWSServiceSpec {
  serviceName: string;
  configuration: Record<string, any>;
  dependencies: string[];
}

export interface NetworkingConfig {
  vpcCidr: string;
  subnetConfiguration: SubnetConfig[];
  internetGateway: boolean;
  natGateway: boolean;
}

export interface SubnetConfig {
  name: string;
  cidr: string;
  availabilityZone: string;
  type: 'public' | 'private';
}

export interface SecurityConfig {
  encryptionAtRest: boolean;
  encryptionInTransit: boolean;
  securityGroups: SecurityGroupConfig[];
  iamPolicies: string[];
}

export interface SecurityGroupConfig {
  name: string;
  description: string;
  ingressRules: SecurityRule[];
  egressRules: SecurityRule[];
}

export interface SecurityRule {
  protocol: string;
  fromPort: number;
  toPort: number;
  source: string;
}

export interface ScalingSpec {
  minCapacity: number;
  maxCapacity: number;
  targetUtilization: number;
  scalingMetric: string;
}

export interface ComplianceRequirements {
  standards: string[];
  dataResidency: string[];
  auditRequirements: AuditRequirements;
}

export interface AuditRequirements {
  retentionPeriodDays: number;
  logTypes: string[];
  complianceFrameworks: string[];
}

export interface ProjectTimeline {
  startDate: Date;
  targetCompletionDate: Date;
  milestones: Milestone[];
}

export interface Milestone {
  name: string;
  targetDate: Date;
  dependencies: string[];
}

// ============================================================================
// Workflow State Models
// ============================================================================

export type WorkflowType = 'ONBOARDING' | 'PROVISIONING';
export type WorkflowStatus = 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED' | 'CANCELLED';
export type CheckpointStatus = 'SUCCESS' | 'FAILURE';

export interface WorkflowState {
  workflowId: string;
  type: WorkflowType;
  status: WorkflowStatus;
  currentStep: string;
  checkpoints: Checkpoint[];
  metadata: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export interface Checkpoint {
  stepId: string;
  timestamp: Date;
  agentId: string;
  status: CheckpointStatus;
  data: Record<string, any>;
  errorDetails?: ErrorInfo;
}

export interface ErrorInfo {
  errorId: string;
  errorType: ErrorType;
  errorCode: string;
  errorMessage: string;
  stackTrace: string;
  retryAttempt: number;
}

export type ErrorType = 'TRANSIENT' | 'PERMANENT' | 'CRITICAL';

// ============================================================================
// CloudFormation Package Models
// ============================================================================

export interface CFNPackage {
  packageId: string;
  version: string;
  templates: CloudFormationTemplate[];
  parameters: ParameterSet;
  dependencies: string[];
}

export interface CloudFormationTemplate {
  templateId: string;
  name: string;
  description: string;
  template: string; // YAML/JSON content
  parameters: ParameterDefinition[];
  outputs: OutputDefinition[];
  dependencies: string[];
}

export interface ParameterDefinition {
  name: string;
  type: string;
  description: string;
  defaultValue?: any;
  allowedValues?: any[];
  constraints?: ParameterConstraints;
}

export interface ParameterConstraints {
  minLength?: number;
  maxLength?: number;
  minValue?: number;
  maxValue?: number;
  pattern?: string;
}

export interface OutputDefinition {
  name: string;
  description: string;
  value: string;
  exportName?: string;
}

export type ParameterSet = Record<string, any>;

// ============================================================================
// Organization and Deployment Models
// ============================================================================

export interface OrganizationConfig {
  customerName: string;
  accountEmail: string;
  organizationalUnits: string[];
  billingConfiguration: BillingConfig;
}

export interface BillingConfig {
  paymentMethod: string;
  billingContact: string;
  costCenter: string;
}

export interface OrganizationResult {
  organizationId: string;
  organizationalUnits: OrganizationalUnit[];
  status: string;
  createdAt: Date;
}

export interface OrganizationalUnit {
  id: string;
  name: string;
  parentId?: string;
}

export interface PolicySet {
  policies: Policy[];
}

export interface Policy {
  policyId: string;
  policyName: string;
  policyDocument: string;
  policyType: string;
}

export interface PolicyResult {
  appliedPolicies: string[];
  failedPolicies: string[];
  timestamp: Date;
}

export type DeploymentStatus = 'INITIATED' | 'IN_PROGRESS' | 'COMPLETE' | 'FAILED';

export interface DeploymentResult {
  deploymentId: string;
  stackId: string;
  status: DeploymentStatus;
  startTime: Date;
}

export interface DeploymentStatusInfo {
  deploymentId: string;
  currentStatus: string;
  progress: number;
  resourcesCreated: number;
  resourcesFailed: number;
  estimatedCompletion?: Date;
}

export interface VerificationResult {
  deploymentId: string;
  verified: boolean;
  resourcesVerified: ResourceVerification[];
  timestamp: Date;
}

export interface ResourceVerification {
  resourceId: string;
  resourceType: string;
  status: string;
  verified: boolean;
}

export interface RollbackResult {
  deploymentId: string;
  rollbackStatus: string;
  timestamp: Date;
}

export interface ValidationResult {
  packageId: string;
  valid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
}

export interface ValidationError {
  code: string;
  message: string;
  location?: string;
}

export interface ValidationWarning {
  code: string;
  message: string;
  location?: string;
}

// ============================================================================
// Audit Log Models
// ============================================================================

export interface AuditLog {
  logId: string;
  timestamp: Date;
  actorId: string;
  actorType: 'USER' | 'AGENT' | 'SYSTEM';
  operation: string;
  resourceType: string;
  resourceId: string;
  operationDetails: Record<string, any>;
  result: 'SUCCESS' | 'FAILURE';
  errorDetails?: ErrorInfo;
}

// ============================================================================
// Workflow Input/Output Models
// ============================================================================

export interface WorkflowInput {
  customerRequirements: CustomerRequirements;
  targetAccount: string;
  notificationChannels: string[];
}

export interface WorkflowOutput {
  workflowId: string;
  status: WorkflowStatus;
  results: Record<string, any>;
  completedAt?: Date;
}
