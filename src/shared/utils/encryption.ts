/**
 * Data Encryption Utilities
 * 
 * Provides encryption and decryption utilities for sensitive data
 * Implements encryption at rest and in transit with key management
 */

import * as crypto from 'crypto';
import * as AWS from 'aws-sdk';

export interface EncryptionConfig {
  algorithm?: string;
  keyLength?: number;
  region?: string;
  kmsKeyId?: string;
}

export interface EncryptedData {
  ciphertext: string;
  iv: string;
  authTag: string;
  algorithm: string;
}

export interface KMSEncryptionResult {
  ciphertext: string;
  keyId: string;
}

/**
 * Encryption manager for sensitive data
 */
export class EncryptionManager {
  private algorithm: string;
  private keyLength: number;
  private kms?: AWS.KMS;
  private kmsKeyId?: string;

  constructor(config: EncryptionConfig = {}) {
    this.algorithm = config.algorithm || 'aes-256-gcm';
    this.keyLength = config.keyLength || 32;
    
    if (config.kmsKeyId) {
      this.kms = new AWS.KMS({
        region: config.region || 'us-east-1',
      });
      this.kmsKeyId = config.kmsKeyId;
    }
  }

  /**
   * Encrypt data using symmetric encryption (AES-256-GCM)
   */
  encrypt(plaintext: string, key: Buffer): EncryptedData {
    try {
      // Validate key length
      if (key.length !== this.keyLength) {
        throw new Error(`Key must be ${this.keyLength} bytes`);
      }

      // Generate random IV
      const iv = crypto.randomBytes(16);

      // Create cipher
      const cipher = crypto.createCipheriv(this.algorithm, key, iv) as crypto.CipherGCM;

      // Encrypt data
      let ciphertext = cipher.update(plaintext, 'utf8', 'hex');
      ciphertext += cipher.final('hex');

      // Get authentication tag
      const authTag = cipher.getAuthTag();

      return {
        ciphertext,
        iv: iv.toString('hex'),
        authTag: authTag.toString('hex'),
        algorithm: this.algorithm,
      };
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Encryption failed: ${error.message}`);
      }
      throw error;
    }
  }

  /**
   * Decrypt data using symmetric encryption (AES-256-GCM)
   */
  decrypt(encryptedData: EncryptedData, key: Buffer): string {
    try {
      // Validate key length
      if (key.length !== this.keyLength) {
        throw new Error(`Key must be ${this.keyLength} bytes`);
      }

      // Convert hex strings to buffers
      const iv = Buffer.from(encryptedData.iv, 'hex');
      const authTag = Buffer.from(encryptedData.authTag, 'hex');

      // Create decipher
      const decipher = crypto.createDecipheriv(
        encryptedData.algorithm,
        key,
        iv
      ) as crypto.DecipherGCM;

      // Set authentication tag
      decipher.setAuthTag(authTag);

      // Decrypt data
      let plaintext = decipher.update(encryptedData.ciphertext, 'hex', 'utf8');
      plaintext += decipher.final('utf8');

      return plaintext;
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Decryption failed: ${error.message}`);
      }
      throw error;
    }
  }

  /**
   * Encrypt data using AWS KMS
   */
  async encryptWithKMS(plaintext: string): Promise<KMSEncryptionResult> {
    if (!this.kms || !this.kmsKeyId) {
      throw new Error('KMS not configured');
    }

    try {
      const response = await this.kms.encrypt({
        KeyId: this.kmsKeyId,
        Plaintext: Buffer.from(plaintext, 'utf8'),
      }).promise();

      if (!response.CiphertextBlob) {
        throw new Error('KMS encryption failed: No ciphertext returned');
      }

      return {
        ciphertext: response.CiphertextBlob.toString('base64'),
        keyId: response.KeyId || this.kmsKeyId,
      };
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`KMS encryption failed: ${error.message}`);
      }
      throw error;
    }
  }

  /**
   * Decrypt data using AWS KMS
   */
  async decryptWithKMS(ciphertext: string): Promise<string> {
    if (!this.kms) {
      throw new Error('KMS not configured');
    }

    try {
      const response = await this.kms.decrypt({
        CiphertextBlob: Buffer.from(ciphertext, 'base64'),
      }).promise();

      if (!response.Plaintext) {
        throw new Error('KMS decryption failed: No plaintext returned');
      }

      return response.Plaintext.toString('utf8');
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`KMS decryption failed: ${error.message}`);
      }
      throw error;
    }
  }

  /**
   * Generate a secure random encryption key
   */
  static generateKey(length: number = 32): Buffer {
    return crypto.randomBytes(length);
  }

  /**
   * Derive a key from a password using PBKDF2
   */
  static deriveKeyFromPassword(
    password: string,
    salt: Buffer,
    iterations: number = 100000,
    keyLength: number = 32
  ): Buffer {
    return crypto.pbkdf2Sync(password, salt, iterations, keyLength, 'sha256');
  }

  /**
   * Generate a secure random salt
   */
  static generateSalt(length: number = 16): Buffer {
    return crypto.randomBytes(length);
  }

  /**
   * Hash data using SHA-256
   */
  static hash(data: string): string {
    return crypto.createHash('sha256').update(data).digest('hex');
  }

  /**
   * Create HMAC for data integrity verification
   */
  static createHMAC(data: string, key: Buffer): string {
    return crypto.createHmac('sha256', key).update(data).digest('hex');
  }

  /**
   * Verify HMAC
   */
  static verifyHMAC(data: string, key: Buffer, hmac: string): boolean {
    const computedHMAC = EncryptionManager.createHMAC(data, key);
    return crypto.timingSafeEqual(
      Buffer.from(computedHMAC, 'hex'),
      Buffer.from(hmac, 'hex')
    );
  }
}

/**
 * Utility class for encrypting sensitive fields in objects
 */
export class SensitiveDataEncryptor {
  private encryptionManager: EncryptionManager;
  private key: Buffer;

  constructor(key: Buffer, config: EncryptionConfig = {}) {
    this.encryptionManager = new EncryptionManager(config);
    this.key = key;
  }

  /**
   * Encrypt sensitive fields in an object
   */
  encryptFields<T extends Record<string, any>>(
    obj: T,
    sensitiveFields: string[]
  ): T & { __encrypted: string[] } {
    const result = { ...obj } as any;
    result.__encrypted = [];

    for (const field of sensitiveFields) {
      if (field in obj && obj[field] !== undefined && obj[field] !== null) {
        const plaintext = typeof obj[field] === 'string'
          ? obj[field]
          : JSON.stringify(obj[field]);

        const encrypted = this.encryptionManager.encrypt(plaintext, this.key);
        result[field] = encrypted;
        result.__encrypted.push(field);
      }
    }

    return result;
  }

  /**
   * Decrypt sensitive fields in an object
   */
  decryptFields<T extends Record<string, any>>(
    obj: T & { __encrypted?: string[] }
  ): T {
    const result = { ...obj } as any;
    const encryptedFields = obj.__encrypted || [];

    for (const field of encryptedFields) {
      if (field in obj && obj[field] !== undefined && obj[field] !== null) {
        const encrypted = obj[field] as EncryptedData;
        const plaintext = this.encryptionManager.decrypt(encrypted, this.key);

        // Try to parse as JSON, otherwise keep as string
        try {
          result[field] = JSON.parse(plaintext);
        } catch {
          result[field] = plaintext;
        }
      }
    }

    delete result.__encrypted;
    return result;
  }
}

/**
 * Utility for encrypting data in transit (TLS/SSL)
 */
export class TransitEncryptionConfig {
  /**
   * Get TLS configuration for HTTPS connections
   */
  static getTLSConfig(): {
    minVersion: string;
    ciphers: string;
    honorCipherOrder: boolean;
  } {
    return {
      minVersion: 'TLSv1.2',
      ciphers: [
        'ECDHE-RSA-AES128-GCM-SHA256',
        'ECDHE-RSA-AES256-GCM-SHA384',
        'ECDHE-RSA-AES128-SHA256',
        'ECDHE-RSA-AES256-SHA384',
      ].join(':'),
      honorCipherOrder: true,
    };
  }

  /**
   * Validate that a connection uses secure TLS
   */
  static isSecureConnection(protocol?: string): boolean {
    if (!protocol) return false;
    return protocol === 'TLSv1.2' || protocol === 'TLSv1.3';
  }
}

/**
 * Key rotation manager for encryption keys
 */
export class KeyRotationManager {
  private kms?: AWS.KMS;

  constructor(region: string = 'us-east-1') {
    this.kms = new AWS.KMS({ region });
  }

  /**
   * Enable automatic key rotation for a KMS key
   */
  async enableKeyRotation(keyId: string): Promise<void> {
    if (!this.kms) {
      throw new Error('KMS not configured');
    }

    try {
      await this.kms.enableKeyRotation({
        KeyId: keyId,
      }).promise();
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to enable key rotation: ${error.message}`);
      }
      throw error;
    }
  }

  /**
   * Check if key rotation is enabled
   */
  async isKeyRotationEnabled(keyId: string): Promise<boolean> {
    if (!this.kms) {
      throw new Error('KMS not configured');
    }

    try {
      const response = await this.kms.getKeyRotationStatus({
        KeyId: keyId,
      }).promise();

      return response.KeyRotationEnabled || false;
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to check key rotation status: ${error.message}`);
      }
      throw error;
    }
  }

  /**
   * Create a new KMS key with automatic rotation enabled
   */
  async createRotatingKey(description: string): Promise<string> {
    if (!this.kms) {
      throw new Error('KMS not configured');
    }

    try {
      // Create the key
      const createResponse = await this.kms.createKey({
        Description: description,
        KeyUsage: 'ENCRYPT_DECRYPT',
        Origin: 'AWS_KMS',
      }).promise();

      if (!createResponse.KeyMetadata?.KeyId) {
        throw new Error('Failed to create KMS key');
      }

      const keyId = createResponse.KeyMetadata.KeyId;

      // Enable automatic rotation
      await this.enableKeyRotation(keyId);

      return keyId;
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to create rotating key: ${error.message}`);
      }
      throw error;
    }
  }
}
