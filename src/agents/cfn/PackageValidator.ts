/**
 * CloudFormation Package Validator
 * 
 * Validates CloudFormation templates for syntax and compliance
 * Checks security policies and parameter constraints
 */

import * as AWS from 'aws-sdk';
import {
  CFNPackage,
  ValidationResult,
  ValidationError,
  ValidationWarning,
  CloudFormationTemplate,
} from '../../shared/types/models';

export interface PackageValidatorConfig {
  region?: string;
  credentials?: AWS.Credentials;
}

/**
 * Validator for CloudFormation packages
 */
export class PackageValidator {
  private cloudformation: AWS.CloudFormation;
  private packageStore: Map<string, CFNPackage> = new Map();

  constructor(config: PackageValidatorConfig = {}) {
    this.cloudformation = new AWS.CloudFormation({
      region: config.region || 'us-east-1',
      credentials: config.credentials,
    });
  }

  /**
   * Store package for validation
   */
  storePackage(cfnPackage: CFNPackage): void {
    this.packageStore.set(cfnPackage.packageId, cfnPackage);
  }

  /**
   * Validate CloudFormation package
   */
  async validatePackage(packageId: string): Promise<ValidationResult> {
    const cfnPackage = this.packageStore.get(packageId);

    if (!cfnPackage) {
      return {
        packageId,
        valid: false,
        errors: [
          {
            code: 'PACKAGE_NOT_FOUND',
            message: `Package ${packageId} not found`,
          },
        ],
        warnings: [],
      };
    }

    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    // Validate each template
    for (const template of cfnPackage.templates) {
      // Validate template syntax
      const syntaxErrors = await this.validateTemplateSyntax(template);
      errors.push(...syntaxErrors);

      // Validate security compliance
      const securityErrors = this.validateSecurityCompliance(template);
      errors.push(...securityErrors);

      // Validate parameter constraints
      const paramErrors = this.validateParameterConstraints(template);
      errors.push(...paramErrors);

      // Check for warnings
      const templateWarnings = this.checkWarnings(template);
      warnings.push(...templateWarnings);
    }

    return {
      packageId,
      valid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Validate CloudFormation template syntax
   */
  private async validateTemplateSyntax(template: CloudFormationTemplate): Promise<ValidationError[]> {
    const errors: ValidationError[] = [];

    try {
      // Parse template to check JSON validity
      const parsedTemplate = JSON.parse(template.template);

      // Validate using AWS CloudFormation API
      await this.cloudformation.validateTemplate({
        TemplateBody: template.template,
      }).promise();
    } catch (error) {
      if (error instanceof SyntaxError) {
        errors.push({
          code: 'INVALID_JSON',
          message: `Template ${template.name} has invalid JSON: ${error.message}`,
          location: template.templateId,
        });
      } else if (error instanceof Error) {
        errors.push({
          code: 'TEMPLATE_VALIDATION_FAILED',
          message: `Template ${template.name} validation failed: ${error.message}`,
          location: template.templateId,
        });
      }
    }

    return errors;
  }

  /**
   * Validate security compliance
   */
  private validateSecurityCompliance(template: CloudFormationTemplate): ValidationError[] {
    const errors: ValidationError[] = [];

    try {
      const parsedTemplate = JSON.parse(template.template);
      const resources = parsedTemplate.Resources || {};

      // Check for unencrypted S3 buckets
      for (const [resourceName, resource] of Object.entries(resources)) {
        const resourceObj = resource as any;

        if (resourceObj.Type === 'AWS::S3::Bucket') {
          const properties = resourceObj.Properties || {};
          
          if (!properties.BucketEncryption) {
            errors.push({
              code: 'UNENCRYPTED_S3_BUCKET',
              message: `S3 bucket ${resourceName} does not have encryption enabled`,
              location: `${template.templateId}:${resourceName}`,
            });
          }
        }

        // Check for overly permissive security groups
        if (resourceObj.Type === 'AWS::EC2::SecurityGroup') {
          const properties = resourceObj.Properties || {};
          const ingress = properties.SecurityGroupIngress || [];

          for (const rule of ingress) {
            if (rule.CidrIp === '0.0.0.0/0' && rule.FromPort !== 80 && rule.FromPort !== 443) {
              errors.push({
                code: 'OVERLY_PERMISSIVE_SECURITY_GROUP',
                message: `Security group ${resourceName} allows unrestricted access on port ${rule.FromPort}`,
                location: `${template.templateId}:${resourceName}`,
              });
            }
          }
        }

        // Check for IAM policies with wildcard permissions
        if (resourceObj.Type === 'AWS::IAM::Policy' || resourceObj.Type === 'AWS::IAM::Role') {
          const properties = resourceObj.Properties || {};
          const policyDocument = properties.PolicyDocument || properties.AssumeRolePolicyDocument;

          if (policyDocument && policyDocument.Statement) {
            for (const statement of policyDocument.Statement) {
              if (statement.Effect === 'Allow' && 
                  (statement.Action === '*' || statement.Resource === '*')) {
                errors.push({
                  code: 'WILDCARD_IAM_PERMISSIONS',
                  message: `IAM resource ${resourceName} has wildcard permissions`,
                  location: `${template.templateId}:${resourceName}`,
                });
              }
            }
          }
        }
      }
    } catch (error) {
      // Template parsing already handled in syntax validation
    }

    return errors;
  }

  /**
   * Validate parameter constraints
   */
  private validateParameterConstraints(template: CloudFormationTemplate): ValidationError[] {
    const errors: ValidationError[] = [];

    for (const param of template.parameters) {
      const constraints = param.constraints;

      if (!constraints) {
        continue;
      }

      // Validate default value against constraints
      if (param.defaultValue !== undefined) {
        const value = param.defaultValue;

        // Check string length constraints
        if (param.type === 'String' && typeof value === 'string') {
          if (constraints.minLength && value.length < constraints.minLength) {
            errors.push({
              code: 'PARAMETER_CONSTRAINT_VIOLATION',
              message: `Parameter ${param.name} default value is shorter than minimum length ${constraints.minLength}`,
              location: template.templateId,
            });
          }

          if (constraints.maxLength && value.length > constraints.maxLength) {
            errors.push({
              code: 'PARAMETER_CONSTRAINT_VIOLATION',
              message: `Parameter ${param.name} default value exceeds maximum length ${constraints.maxLength}`,
              location: template.templateId,
            });
          }

          if (constraints.pattern) {
            const regex = new RegExp(constraints.pattern);
            if (!regex.test(value)) {
              errors.push({
                code: 'PARAMETER_CONSTRAINT_VIOLATION',
                message: `Parameter ${param.name} default value does not match pattern ${constraints.pattern}`,
                location: template.templateId,
              });
            }
          }
        }

        // Check numeric constraints
        if (param.type === 'Number' && typeof value === 'number') {
          if (constraints.minValue !== undefined && value < constraints.minValue) {
            errors.push({
              code: 'PARAMETER_CONSTRAINT_VIOLATION',
              message: `Parameter ${param.name} default value is less than minimum ${constraints.minValue}`,
              location: template.templateId,
            });
          }

          if (constraints.maxValue !== undefined && value > constraints.maxValue) {
            errors.push({
              code: 'PARAMETER_CONSTRAINT_VIOLATION',
              message: `Parameter ${param.name} default value exceeds maximum ${constraints.maxValue}`,
              location: template.templateId,
            });
          }
        }
      }

      // Check allowed values
      if (param.allowedValues && param.allowedValues.length > 0) {
        if (param.defaultValue !== undefined && !param.allowedValues.includes(param.defaultValue)) {
          errors.push({
            code: 'PARAMETER_CONSTRAINT_VIOLATION',
            message: `Parameter ${param.name} default value is not in allowed values`,
            location: template.templateId,
          });
        }
      }
    }

    return errors;
  }

  /**
   * Check for warnings
   */
  private checkWarnings(template: CloudFormationTemplate): ValidationWarning[] {
    const warnings: ValidationWarning[] = [];

    try {
      const parsedTemplate = JSON.parse(template.template);
      const resources = parsedTemplate.Resources || {};

      // Warn about missing tags
      for (const [resourceName, resource] of Object.entries(resources)) {
        const resourceObj = resource as any;
        const properties = resourceObj.Properties || {};

        if (!properties.Tags || properties.Tags.length === 0) {
          warnings.push({
            code: 'MISSING_TAGS',
            message: `Resource ${resourceName} does not have any tags`,
            location: `${template.templateId}:${resourceName}`,
          });
        }
      }

      // Warn about missing descriptions
      if (!parsedTemplate.Description) {
        warnings.push({
          code: 'MISSING_DESCRIPTION',
          message: 'Template does not have a description',
          location: template.templateId,
        });
      }
    } catch (error) {
      // Template parsing already handled in syntax validation
    }

    return warnings;
  }
}

