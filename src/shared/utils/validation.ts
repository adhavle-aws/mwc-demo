/**
 * Validation utilities for data models
 * Provides validation functions to ensure data integrity
 */

import {
  CustomerRequirements,
  WorkflowState,
  CFNPackage,
  OrganizationConfig,
  AuditLog,
  InfrastructureSpec,
  CloudFormationTemplate,
  ParameterDefinition,
} from '../types/models';

// ============================================================================
// Validation Error Types
// ============================================================================

export class DataValidationError extends Error {
  constructor(
    message: string,
    public field?: string,
    public code?: string
  ) {
    super(message);
    this.name = 'DataValidationError';
  }
}

// ============================================================================
// Email Validation
// ============================================================================

export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// ============================================================================
// UUID Validation
// ============================================================================

export function isValidUUID(uuid: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
}

// ============================================================================
// CIDR Validation
// ============================================================================

export function isValidCIDR(cidr: string): boolean {
  const cidrRegex = /^(\d{1,3}\.){3}\d{1,3}\/\d{1,2}$/;
  if (!cidrRegex.test(cidr)) {
    return false;
  }
  
  const [ip, prefix] = cidr.split('/');
  const octets = ip.split('.').map(Number);
  const prefixNum = Number(prefix);
  
  return (
    octets.every(octet => octet >= 0 && octet <= 255) &&
    prefixNum >= 0 &&
    prefixNum <= 32
  );
}

// ============================================================================
// Customer Requirements Validation
// ============================================================================

export function validateCustomerRequirements(
  requirements: CustomerRequirements
): void {
  if (!requirements.customerId || requirements.customerId.trim() === '') {
    throw new DataValidationError('Customer ID is required', 'customerId', 'REQUIRED');
  }

  if (!requirements.customerName || requirements.customerName.trim() === '') {
    throw new DataValidationError('Customer name is required', 'customerName', 'REQUIRED');
  }

  if (!isValidEmail(requirements.contactEmail)) {
    throw new DataValidationError(
      'Invalid contact email address',
      'contactEmail',
      'INVALID_FORMAT'
    );
  }

  validateInfrastructureSpec(requirements.infrastructure);

  if (!requirements.compliance || !requirements.compliance.standards) {
    throw new DataValidationError(
      'Compliance standards are required',
      'compliance.standards',
      'REQUIRED'
    );
  }

  if (!requirements.timeline || !requirements.timeline.startDate) {
    throw new DataValidationError(
      'Timeline start date is required',
      'timeline.startDate',
      'REQUIRED'
    );
  }

  if (!requirements.timeline.targetCompletionDate) {
    throw new DataValidationError(
      'Timeline target completion date is required',
      'timeline.targetCompletionDate',
      'REQUIRED'
    );
  }

  if (requirements.timeline.startDate >= requirements.timeline.targetCompletionDate) {
    throw new DataValidationError(
      'Target completion date must be after start date',
      'timeline.targetCompletionDate',
      'INVALID_RANGE'
    );
  }
}

// ============================================================================
// Infrastructure Spec Validation
// ============================================================================

export function validateInfrastructureSpec(spec: InfrastructureSpec): void {
  if (!spec.regions || spec.regions.length === 0) {
    throw new DataValidationError(
      'At least one region is required',
      'infrastructure.regions',
      'REQUIRED'
    );
  }

  if (!spec.services || spec.services.length === 0) {
    throw new DataValidationError(
      'At least one service is required',
      'infrastructure.services',
      'REQUIRED'
    );
  }

  if (!isValidCIDR(spec.networking.vpcCidr)) {
    throw new DataValidationError(
      'Invalid VPC CIDR format',
      'infrastructure.networking.vpcCidr',
      'INVALID_FORMAT'
    );
  }

  spec.networking.subnetConfiguration.forEach((subnet, index) => {
    if (!isValidCIDR(subnet.cidr)) {
      throw new DataValidationError(
        `Invalid subnet CIDR format at index ${index}`,
        `infrastructure.networking.subnetConfiguration[${index}].cidr`,
        'INVALID_FORMAT'
      );
    }
  });

  if (spec.scalingRequirements.minCapacity < 0) {
    throw new DataValidationError(
      'Minimum capacity cannot be negative',
      'infrastructure.scalingRequirements.minCapacity',
      'INVALID_VALUE'
    );
  }

  if (spec.scalingRequirements.maxCapacity < spec.scalingRequirements.minCapacity) {
    throw new DataValidationError(
      'Maximum capacity must be greater than or equal to minimum capacity',
      'infrastructure.scalingRequirements.maxCapacity',
      'INVALID_RANGE'
    );
  }
}

// ============================================================================
// Workflow State Validation
// ============================================================================

export function validateWorkflowState(state: WorkflowState): void {
  if (!state.workflowId || state.workflowId.trim() === '') {
    throw new DataValidationError('Workflow ID is required', 'workflowId', 'REQUIRED');
  }

  if (!['ONBOARDING', 'PROVISIONING'].includes(state.type)) {
    throw new DataValidationError(
      'Invalid workflow type',
      'type',
      'INVALID_VALUE'
    );
  }

  if (
    !['PENDING', 'IN_PROGRESS', 'COMPLETED', 'FAILED', 'CANCELLED'].includes(
      state.status
    )
  ) {
    throw new DataValidationError(
      'Invalid workflow status',
      'status',
      'INVALID_VALUE'
    );
  }

  if (!state.currentStep || state.currentStep.trim() === '') {
    throw new DataValidationError(
      'Current step is required',
      'currentStep',
      'REQUIRED'
    );
  }

  if (!state.createdAt || !(state.createdAt instanceof Date)) {
    throw new DataValidationError(
      'Created at must be a valid date',
      'createdAt',
      'INVALID_TYPE'
    );
  }

  if (!state.updatedAt || !(state.updatedAt instanceof Date)) {
    throw new DataValidationError(
      'Updated at must be a valid date',
      'updatedAt',
      'INVALID_TYPE'
    );
  }

  if (state.createdAt > state.updatedAt) {
    throw new DataValidationError(
      'Updated at must be after created at',
      'updatedAt',
      'INVALID_RANGE'
    );
  }
}

// ============================================================================
// CFN Package Validation
// ============================================================================

export function validateCFNPackage(pkg: CFNPackage): void {
  if (!pkg.packageId || pkg.packageId.trim() === '') {
    throw new DataValidationError('Package ID is required', 'packageId', 'REQUIRED');
  }

  if (!pkg.version || pkg.version.trim() === '') {
    throw new DataValidationError('Version is required', 'version', 'REQUIRED');
  }

  // Validate semantic versioning format
  const semverRegex = /^\d+\.\d+\.\d+$/;
  if (!semverRegex.test(pkg.version)) {
    throw new DataValidationError(
      'Version must follow semantic versioning (e.g., 1.0.0)',
      'version',
      'INVALID_FORMAT'
    );
  }

  if (!pkg.templates || pkg.templates.length === 0) {
    throw new DataValidationError(
      'At least one template is required',
      'templates',
      'REQUIRED'
    );
  }

  pkg.templates.forEach((template, index) => {
    validateCloudFormationTemplate(template, index);
  });
}

// ============================================================================
// CloudFormation Template Validation
// ============================================================================

export function validateCloudFormationTemplate(
  template: CloudFormationTemplate,
  index?: number
): void {
  const prefix = index !== undefined ? `templates[${index}]` : 'template';

  if (!template.templateId || template.templateId.trim() === '') {
    throw new DataValidationError(
      'Template ID is required',
      `${prefix}.templateId`,
      'REQUIRED'
    );
  }

  if (!template.name || template.name.trim() === '') {
    throw new DataValidationError(
      'Template name is required',
      `${prefix}.name`,
      'REQUIRED'
    );
  }

  if (!template.template || template.template.trim() === '') {
    throw new DataValidationError(
      'Template content is required',
      `${prefix}.template`,
      'REQUIRED'
    );
  }

  // Validate template is valid JSON or YAML (basic check)
  try {
    JSON.parse(template.template);
  } catch {
    // If not JSON, assume YAML (more thorough validation would require YAML parser)
    if (!template.template.includes(':')) {
      throw new DataValidationError(
        'Template must be valid JSON or YAML',
        `${prefix}.template`,
        'INVALID_FORMAT'
      );
    }
  }

  template.parameters.forEach((param, paramIndex) => {
    validateParameterDefinition(param, `${prefix}.parameters[${paramIndex}]`);
  });
}

// ============================================================================
// Parameter Definition Validation
// ============================================================================

export function validateParameterDefinition(
  param: ParameterDefinition,
  prefix: string
): void {
  if (!param.name || param.name.trim() === '') {
    throw new DataValidationError(
      'Parameter name is required',
      `${prefix}.name`,
      'REQUIRED'
    );
  }

  if (!param.type || param.type.trim() === '') {
    throw new DataValidationError(
      'Parameter type is required',
      `${prefix}.type`,
      'REQUIRED'
    );
  }

  const validTypes = ['String', 'Number', 'List<Number>', 'CommaDelimitedList'];
  if (!validTypes.includes(param.type)) {
    throw new DataValidationError(
      `Parameter type must be one of: ${validTypes.join(', ')}`,
      `${prefix}.type`,
      'INVALID_VALUE'
    );
  }

  if (param.constraints) {
    if (
      param.constraints.minLength !== undefined &&
      param.constraints.minLength < 0
    ) {
      throw new DataValidationError(
        'Minimum length cannot be negative',
        `${prefix}.constraints.minLength`,
        'INVALID_VALUE'
      );
    }

    if (
      param.constraints.maxLength !== undefined &&
      param.constraints.minLength !== undefined &&
      param.constraints.maxLength < param.constraints.minLength
    ) {
      throw new DataValidationError(
        'Maximum length must be greater than or equal to minimum length',
        `${prefix}.constraints.maxLength`,
        'INVALID_RANGE'
      );
    }
  }
}

// ============================================================================
// Organization Config Validation
// ============================================================================

export function validateOrganizationConfig(config: OrganizationConfig): void {
  if (!config.customerName || config.customerName.trim() === '') {
    throw new DataValidationError(
      'Customer name is required',
      'customerName',
      'REQUIRED'
    );
  }

  if (!isValidEmail(config.accountEmail)) {
    throw new DataValidationError(
      'Invalid account email address',
      'accountEmail',
      'INVALID_FORMAT'
    );
  }

  if (!config.organizationalUnits || config.organizationalUnits.length === 0) {
    throw new DataValidationError(
      'At least one organizational unit is required',
      'organizationalUnits',
      'REQUIRED'
    );
  }

  if (!config.billingConfiguration) {
    throw new DataValidationError(
      'Billing configuration is required',
      'billingConfiguration',
      'REQUIRED'
    );
  }
}

// ============================================================================
// Audit Log Validation
// ============================================================================

export function validateAuditLog(log: AuditLog): void {
  if (!log.logId || log.logId.trim() === '') {
    throw new DataValidationError('Log ID is required', 'logId', 'REQUIRED');
  }

  if (!log.timestamp || !(log.timestamp instanceof Date)) {
    throw new DataValidationError(
      'Timestamp must be a valid date',
      'timestamp',
      'INVALID_TYPE'
    );
  }

  if (!log.actorId || log.actorId.trim() === '') {
    throw new DataValidationError('Actor ID is required', 'actorId', 'REQUIRED');
  }

  if (!['USER', 'AGENT', 'SYSTEM'].includes(log.actorType)) {
    throw new DataValidationError(
      'Invalid actor type',
      'actorType',
      'INVALID_VALUE'
    );
  }

  if (!log.operation || log.operation.trim() === '') {
    throw new DataValidationError('Operation is required', 'operation', 'REQUIRED');
  }

  if (!log.resourceType || log.resourceType.trim() === '') {
    throw new DataValidationError(
      'Resource type is required',
      'resourceType',
      'REQUIRED'
    );
  }

  if (!log.resourceId || log.resourceId.trim() === '') {
    throw new DataValidationError(
      'Resource ID is required',
      'resourceId',
      'REQUIRED'
    );
  }

  if (!['SUCCESS', 'FAILURE'].includes(log.result)) {
    throw new DataValidationError('Invalid result', 'result', 'INVALID_VALUE');
  }
}
