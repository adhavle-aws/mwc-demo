/**
 * CloudFormation Package Version Manager
 * 
 * Manages versioning for CloudFormation packages
 * Generates unique version identifiers and stores package metadata
 */

import { v4 as uuidv4 } from 'uuid';
import { CFNPackage } from '../../shared/types/models';

export interface PackageMetadata {
  packageId: string;
  version: string;
  createdAt: Date;
  createdBy: string;
  checksum: string;
  templateCount: number;
  tags: Record<string, string>;
}

/**
 * Manager for CloudFormation package versions
 */
export class PackageVersionManager {
  private packageStore: Map<string, CFNPackage> = new Map();
  private versionMetadata: Map<string, PackageMetadata> = new Map();
  private versionHistory: Map<string, string[]> = new Map(); // packageId -> version[]

  /**
   * Generate unique version identifier for a package
   */
  async versionPackage(packageId: string, createdBy: string): Promise<string> {
    const cfnPackage = this.packageStore.get(packageId);

    if (!cfnPackage) {
      throw new Error(`Package ${packageId} not found`);
    }

    // Generate semantic version
    const version = this.generateVersion(packageId);

    // Calculate checksum for package integrity
    const checksum = this.calculateChecksum(cfnPackage);

    // Create metadata
    const metadata: PackageMetadata = {
      packageId,
      version,
      createdAt: new Date(),
      createdBy,
      checksum,
      templateCount: cfnPackage.templates.length,
      tags: {},
    };

    // Store metadata
    const metadataKey = `${packageId}:${version}`;
    this.versionMetadata.set(metadataKey, metadata);

    // Update version history
    const history = this.versionHistory.get(packageId) || [];
    history.push(version);
    this.versionHistory.set(packageId, history);

    // Update package version
    cfnPackage.version = version;
    this.packageStore.set(packageId, cfnPackage);

    return version;
  }

  /**
   * Store package for versioning
   */
  storePackage(cfnPackage: CFNPackage): void {
    this.packageStore.set(cfnPackage.packageId, cfnPackage);
  }

  /**
   * Get package by ID and version
   */
  getPackage(packageId: string, version?: string): CFNPackage | undefined {
    const cfnPackage = this.packageStore.get(packageId);

    if (!cfnPackage) {
      return undefined;
    }

    // If version specified, check if it matches
    if (version && cfnPackage.version !== version) {
      return undefined;
    }

    return cfnPackage;
  }

  /**
   * Get package metadata
   */
  getMetadata(packageId: string, version: string): PackageMetadata | undefined {
    const metadataKey = `${packageId}:${version}`;
    return this.versionMetadata.get(metadataKey);
  }

  /**
   * Get version history for a package
   */
  getVersionHistory(packageId: string): string[] {
    return this.versionHistory.get(packageId) || [];
  }

  /**
   * Get latest version for a package
   */
  getLatestVersion(packageId: string): string | undefined {
    const history = this.versionHistory.get(packageId);
    return history && history.length > 0 ? history[history.length - 1] : undefined;
  }

  /**
   * Check if version exists
   */
  versionExists(packageId: string, version: string): boolean {
    const metadataKey = `${packageId}:${version}`;
    return this.versionMetadata.has(metadataKey);
  }

  /**
   * Generate semantic version
   */
  private generateVersion(packageId: string): string {
    const history = this.versionHistory.get(packageId) || [];

    if (history.length === 0) {
      // First version
      return '1.0.0';
    }

    // Get last version and increment patch
    const lastVersion = history[history.length - 1];
    const parts = lastVersion.split('.').map(Number);

    if (parts.length !== 3) {
      // Invalid version format, start fresh
      return '1.0.0';
    }

    // Increment patch version
    parts[2]++;

    return parts.join('.');
  }

  /**
   * Calculate checksum for package
   */
  private calculateChecksum(cfnPackage: CFNPackage): string {
    // Simple checksum based on package content
    const content = JSON.stringify({
      templates: cfnPackage.templates.map(t => ({
        id: t.templateId,
        name: t.name,
        template: t.template,
      })),
      parameters: cfnPackage.parameters,
      dependencies: cfnPackage.dependencies,
    });

    // Generate hash-like checksum
    let hash = 0;
    for (let i = 0; i < content.length; i++) {
      const char = content.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }

    return Math.abs(hash).toString(16);
  }

  /**
   * Add tags to package version
   */
  addTags(packageId: string, version: string, tags: Record<string, string>): void {
    const metadataKey = `${packageId}:${version}`;
    const metadata = this.versionMetadata.get(metadataKey);

    if (metadata) {
      metadata.tags = { ...metadata.tags, ...tags };
      this.versionMetadata.set(metadataKey, metadata);
    }
  }

  /**
   * List all packages
   */
  listPackages(): string[] {
    return Array.from(this.packageStore.keys());
  }

  /**
   * List all versions for all packages
   */
  listAllVersions(): Array<{ packageId: string; version: string }> {
    const versions: Array<{ packageId: string; version: string }> = [];

    for (const [packageId, history] of this.versionHistory.entries()) {
      for (const version of history) {
        versions.push({ packageId, version });
      }
    }

    return versions;
  }
}

