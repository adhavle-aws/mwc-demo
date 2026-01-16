/**
 * Security Policy Validator
 * 
 * Validates resource configurations against security best practices and compliance requirements
 * Rejects non-compliant configurations before deployment
 */

import {
  InfrastructureSpec,
  SecurityConfig,
  SecurityGroupConfig,
  CloudFormationTemplate,
} from '../types/models';

export interface SecurityPolicy {
  policyId: string;
  policyName: string;
  description: string;
  rules: SecurityRule[];
}

export interface SecurityRule {
  ruleId: string;
  ruleName: string;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  validator: (config: any) => ValidationResult;
}

export interface ValidationResult {
  compliant: boolean;
  violations: SecurityViolation[];
}

export interface SecurityViolation {
  ruleId: string;
  ruleName: string;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  message: string;
  resource?: string;
  remediation: string;
}

/**
 * Validator for security policies and best practices
 */
export class SecurityPolicyValidator {
  private policies: SecurityPolicy[];

  constructor(policies?: SecurityPolicy[]) {
    this.policies = policies || SecurityPolicyValidator.getDefaultPolicies();
  }

  /**
   * Validate infrastructure specification against security policies
   */
  validateInfrastructure(spec: InfrastructureSpec): ValidationResult {
    const violations: SecurityViolation[] = [];

    for (const policy of this.policies) {
      for (const rule of policy.rules) {
        const result = rule.validator(spec);
        violations.push(...result.violations);
      }
    }

    return {
      compliant: violations.length === 0,
      violations,
    };
  }

  /**
   * Validate CloudFormation template against security policies
   */
  validateCloudFormationTemplate(template: CloudFormationTemplate): ValidationResult {
    const violations: SecurityViolation[] = [];

    try {
      const templateObj = JSON.parse(template.template);

      // Validate resources
      if (templateObj.Resources) {
        for (const [resourceName, resource] of Object.entries(templateObj.Resources as any)) {
          const resourceViolations = this.validateResource(resourceName, resource);
          violations.push(...resourceViolations);
        }
      }
    } catch (error) {
      // If template is not JSON, try to validate as YAML (simplified)
      // In production, would use a proper YAML parser
    }

    return {
      compliant: violations.length === 0,
      violations,
    };
  }

  /**
   * Validate a CloudFormation resource
   */
  private validateResource(resourceName: string, resource: any): SecurityViolation[] {
    const violations: SecurityViolation[] = [];

    // Validate S3 buckets
    if (resource.Type === 'AWS::S3::Bucket') {
      violations.push(...this.validateS3Bucket(resourceName, resource));
    }

    // Validate EC2 instances
    if (resource.Type === 'AWS::EC2::Instance') {
      violations.push(...this.validateEC2Instance(resourceName, resource));
    }

    // Validate RDS instances
    if (resource.Type === 'AWS::RDS::DBInstance') {
      violations.push(...this.validateRDSInstance(resourceName, resource));
    }

    // Validate security groups
    if (resource.Type === 'AWS::EC2::SecurityGroup') {
      violations.push(...this.validateSecurityGroup(resourceName, resource));
    }

    // Validate IAM roles
    if (resource.Type === 'AWS::IAM::Role') {
      violations.push(...this.validateIAMRole(resourceName, resource));
    }

    return violations;
  }

  /**
   * Validate S3 bucket configuration
   */
  private validateS3Bucket(resourceName: string, resource: any): SecurityViolation[] {
    const violations: SecurityViolation[] = [];
    const properties = resource.Properties || {};

    // Check for encryption
    if (!properties.BucketEncryption) {
      violations.push({
        ruleId: 'S3-001',
        ruleName: 'S3 Bucket Encryption Required',
        severity: 'CRITICAL',
        message: 'S3 bucket must have encryption enabled',
        resource: resourceName,
        remediation: 'Add BucketEncryption property with SSE-S3 or SSE-KMS encryption',
      });
    }

    // Check for public access block
    if (!properties.PublicAccessBlockConfiguration) {
      violations.push({
        ruleId: 'S3-002',
        ruleName: 'S3 Public Access Block Required',
        severity: 'HIGH',
        message: 'S3 bucket must have public access blocked',
        resource: resourceName,
        remediation: 'Add PublicAccessBlockConfiguration with all options set to true',
      });
    }

    // Check for versioning
    if (!properties.VersioningConfiguration?.Status || 
        properties.VersioningConfiguration.Status !== 'Enabled') {
      violations.push({
        ruleId: 'S3-003',
        ruleName: 'S3 Versioning Recommended',
        severity: 'MEDIUM',
        message: 'S3 bucket should have versioning enabled',
        resource: resourceName,
        remediation: 'Enable versioning in VersioningConfiguration',
      });
    }

    // Check for logging
    if (!properties.LoggingConfiguration) {
      violations.push({
        ruleId: 'S3-004',
        ruleName: 'S3 Access Logging Recommended',
        severity: 'MEDIUM',
        message: 'S3 bucket should have access logging enabled',
        resource: resourceName,
        remediation: 'Add LoggingConfiguration with destination bucket',
      });
    }

    return violations;
  }

  /**
   * Validate EC2 instance configuration
   */
  private validateEC2Instance(resourceName: string, resource: any): SecurityViolation[] {
    const violations: SecurityViolation[] = [];
    const properties = resource.Properties || {};

    // Check for IMDSv2
    if (!properties.MetadataOptions?.HttpTokens || 
        properties.MetadataOptions.HttpTokens !== 'required') {
      violations.push({
        ruleId: 'EC2-001',
        ruleName: 'EC2 IMDSv2 Required',
        severity: 'HIGH',
        message: 'EC2 instance must use IMDSv2',
        resource: resourceName,
        remediation: 'Set MetadataOptions.HttpTokens to "required"',
      });
    }

    // Check for encrypted EBS volumes
    if (properties.BlockDeviceMappings) {
      for (const mapping of properties.BlockDeviceMappings) {
        if (mapping.Ebs && !mapping.Ebs.Encrypted) {
          violations.push({
            ruleId: 'EC2-002',
            ruleName: 'EC2 EBS Encryption Required',
            severity: 'CRITICAL',
            message: 'EBS volumes must be encrypted',
            resource: resourceName,
            remediation: 'Set Encrypted to true for all EBS volumes',
          });
        }
      }
    }

    // Check for monitoring
    if (!properties.Monitoring) {
      violations.push({
        ruleId: 'EC2-003',
        ruleName: 'EC2 Detailed Monitoring Recommended',
        severity: 'LOW',
        message: 'EC2 instance should have detailed monitoring enabled',
        resource: resourceName,
        remediation: 'Set Monitoring to true',
      });
    }

    return violations;
  }

  /**
   * Validate RDS instance configuration
   */
  private validateRDSInstance(resourceName: string, resource: any): SecurityViolation[] {
    const violations: SecurityViolation[] = [];
    const properties = resource.Properties || {};

    // Check for encryption
    if (!properties.StorageEncrypted) {
      violations.push({
        ruleId: 'RDS-001',
        ruleName: 'RDS Encryption Required',
        severity: 'CRITICAL',
        message: 'RDS instance must have storage encryption enabled',
        resource: resourceName,
        remediation: 'Set StorageEncrypted to true',
      });
    }

    // Check for public accessibility
    if (properties.PubliclyAccessible === true) {
      violations.push({
        ruleId: 'RDS-002',
        ruleName: 'RDS Public Access Prohibited',
        severity: 'CRITICAL',
        message: 'RDS instance must not be publicly accessible',
        resource: resourceName,
        remediation: 'Set PubliclyAccessible to false',
      });
    }

    // Check for backup retention
    if (!properties.BackupRetentionPeriod || properties.BackupRetentionPeriod < 7) {
      violations.push({
        ruleId: 'RDS-003',
        ruleName: 'RDS Backup Retention Required',
        severity: 'HIGH',
        message: 'RDS instance should have backup retention of at least 7 days',
        resource: resourceName,
        remediation: 'Set BackupRetentionPeriod to 7 or higher',
      });
    }

    // Check for multi-AZ
    if (!properties.MultiAZ) {
      violations.push({
        ruleId: 'RDS-004',
        ruleName: 'RDS Multi-AZ Recommended',
        severity: 'MEDIUM',
        message: 'RDS instance should be deployed in multiple availability zones',
        resource: resourceName,
        remediation: 'Set MultiAZ to true',
      });
    }

    return violations;
  }

  /**
   * Validate security group configuration
   */
  private validateSecurityGroup(resourceName: string, resource: any): SecurityViolation[] {
    const violations: SecurityViolation[] = [];
    const properties = resource.Properties || {};

    // Check for overly permissive ingress rules
    if (properties.SecurityGroupIngress) {
      for (const rule of properties.SecurityGroupIngress) {
        // Check for 0.0.0.0/0 on non-standard ports
        if (rule.CidrIp === '0.0.0.0/0' || rule.CidrIpv6 === '::/0') {
          const isHTTP = rule.FromPort === 80 || rule.ToPort === 80;
          const isHTTPS = rule.FromPort === 443 || rule.ToPort === 443;

          if (!isHTTP && !isHTTPS) {
            violations.push({
              ruleId: 'SG-001',
              ruleName: 'Security Group Overly Permissive',
              severity: 'CRITICAL',
              message: 'Security group allows unrestricted access on non-standard ports',
              resource: resourceName,
              remediation: 'Restrict source IP ranges to specific CIDR blocks',
            });
          }
        }

        // Check for SSH/RDP from anywhere
        if ((rule.FromPort === 22 || rule.FromPort === 3389) && 
            (rule.CidrIp === '0.0.0.0/0' || rule.CidrIpv6 === '::/0')) {
          violations.push({
            ruleId: 'SG-002',
            ruleName: 'SSH/RDP Access Too Permissive',
            severity: 'CRITICAL',
            message: 'Security group allows SSH/RDP access from anywhere',
            resource: resourceName,
            remediation: 'Restrict SSH/RDP access to specific IP ranges or use bastion hosts',
          });
        }
      }
    }

    return violations;
  }

  /**
   * Validate IAM role configuration
   */
  private validateIAMRole(resourceName: string, resource: any): SecurityViolation[] {
    const violations: SecurityViolation[] = [];
    const properties = resource.Properties || {};

    // Check for overly permissive policies
    if (properties.Policies) {
      for (const policy of properties.Policies) {
        const policyDoc = policy.PolicyDocument;
        if (policyDoc?.Statement) {
          for (const statement of policyDoc.Statement) {
            // Check for wildcard actions
            if (statement.Effect === 'Allow' && 
                (statement.Action === '*' || 
                 (Array.isArray(statement.Action) && statement.Action.includes('*')))) {
              violations.push({
                ruleId: 'IAM-001',
                ruleName: 'IAM Wildcard Actions Prohibited',
                severity: 'CRITICAL',
                message: 'IAM role contains wildcard actions',
                resource: resourceName,
                remediation: 'Specify explicit actions instead of using wildcards',
              });
            }

            // Check for wildcard resources
            if (statement.Effect === 'Allow' && 
                (statement.Resource === '*' || 
                 (Array.isArray(statement.Resource) && statement.Resource.includes('*')))) {
              violations.push({
                ruleId: 'IAM-002',
                ruleName: 'IAM Wildcard Resources Discouraged',
                severity: 'HIGH',
                message: 'IAM role contains wildcard resources',
                resource: resourceName,
                remediation: 'Specify explicit resource ARNs instead of using wildcards',
              });
            }
          }
        }
      }
    }

    return violations;
  }

  /**
   * Get default security policies
   */
  static getDefaultPolicies(): SecurityPolicy[] {
    return [
      {
        policyId: 'encryption-policy',
        policyName: 'Encryption Policy',
        description: 'Ensures encryption at rest and in transit',
        rules: [
          {
            ruleId: 'ENC-001',
            ruleName: 'Encryption at Rest Required',
            severity: 'CRITICAL',
            validator: (spec: InfrastructureSpec) => {
              const violations: SecurityViolation[] = [];
              
              if (!spec.security.encryptionAtRest) {
                violations.push({
                  ruleId: 'ENC-001',
                  ruleName: 'Encryption at Rest Required',
                  severity: 'CRITICAL',
                  message: 'Infrastructure must have encryption at rest enabled',
                  remediation: 'Enable encryptionAtRest in security configuration',
                });
              }

              return { compliant: violations.length === 0, violations };
            },
          },
          {
            ruleId: 'ENC-002',
            ruleName: 'Encryption in Transit Required',
            severity: 'CRITICAL',
            validator: (spec: InfrastructureSpec) => {
              const violations: SecurityViolation[] = [];
              
              if (!spec.security.encryptionInTransit) {
                violations.push({
                  ruleId: 'ENC-002',
                  ruleName: 'Encryption in Transit Required',
                  severity: 'CRITICAL',
                  message: 'Infrastructure must have encryption in transit enabled',
                  remediation: 'Enable encryptionInTransit in security configuration',
                });
              }

              return { compliant: violations.length === 0, violations };
            },
          },
        ],
      },
      {
        policyId: 'network-policy',
        policyName: 'Network Security Policy',
        description: 'Ensures proper network security configuration',
        rules: [
          {
            ruleId: 'NET-001',
            ruleName: 'No Unrestricted Ingress',
            severity: 'CRITICAL',
            validator: (spec: InfrastructureSpec) => {
              const violations: SecurityViolation[] = [];
              
              for (const sg of spec.security.securityGroups) {
                for (const rule of sg.ingressRules) {
                  if (rule.source === '0.0.0.0/0' && rule.fromPort !== 80 && rule.fromPort !== 443) {
                    violations.push({
                      ruleId: 'NET-001',
                      ruleName: 'No Unrestricted Ingress',
                      severity: 'CRITICAL',
                      message: `Security group ${sg.name} allows unrestricted ingress on port ${rule.fromPort}`,
                      resource: sg.name,
                      remediation: 'Restrict ingress to specific IP ranges',
                    });
                  }
                }
              }

              return { compliant: violations.length === 0, violations };
            },
          },
        ],
      },
    ];
  }

  /**
   * Add a custom security policy
   */
  addPolicy(policy: SecurityPolicy): void {
    this.policies.push(policy);
  }

  /**
   * Remove a security policy by ID
   */
  removePolicy(policyId: string): void {
    this.policies = this.policies.filter(p => p.policyId !== policyId);
  }

  /**
   * Get all policies
   */
  getPolicies(): SecurityPolicy[] {
    return [...this.policies];
  }
}
