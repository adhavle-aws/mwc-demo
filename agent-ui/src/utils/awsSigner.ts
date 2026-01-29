/**
 * AWS SigV4 Request Signer for Lambda Function URLs
 * 
 * Signs requests with AWS credentials for IAM authentication
 */

import { SignatureV4 } from '@aws-sdk/signature-v4';
import { HttpRequest } from '@aws-sdk/protocol-http';
import { Sha256 } from '@aws-crypto/sha256-browser';
import { fromCognitoIdentityPool } from '@aws-sdk/credential-providers';

// Cognito Identity Pool for unauthenticated access
// This allows browser clients to get temporary AWS credentials
const IDENTITY_POOL_ID = import.meta.env.VITE_AWS_IDENTITY_POOL_ID || '';
const REGION = import.meta.env.VITE_AWS_REGION || 'us-east-1';

/**
 * Get AWS credentials for signing requests
 */
async function getCredentials() {
  if (!IDENTITY_POOL_ID) {
    throw new Error('VITE_AWS_IDENTITY_POOL_ID not configured');
  }

  const credentials = fromCognitoIdentityPool({
    clientConfig: { region: REGION },
    identityPoolId: IDENTITY_POOL_ID,
  });

  return credentials();
}

/**
 * Sign a request with AWS SigV4
 * 
 * @param url - The URL to sign
 * @param method - HTTP method
 * @param body - Request body
 * @returns Signed request with headers
 */
export async function signRequest(
  url: string,
  method: string = 'POST',
  body?: string
): Promise<{ url: string; headers: Record<string, string> }> {
  const urlObj = new URL(url);

  // Create HTTP request
  const request = new HttpRequest({
    method,
    protocol: urlObj.protocol,
    hostname: urlObj.hostname,
    path: urlObj.pathname + urlObj.search,
    headers: {
      'Content-Type': 'application/json',
      host: urlObj.hostname,
    },
    body,
  });

  // Get credentials
  const credentials = await getCredentials();

  // Sign request
  const signer = new SignatureV4({
    service: 'lambda',
    region: REGION,
    credentials,
    sha256: Sha256,
  });

  const signedRequest = await signer.sign(request);

  // Extract headers
  const headers: Record<string, string> = {};
  Object.entries(signedRequest.headers).forEach(([key, value]) => {
    headers[key] = value as string;
  });

  return {
    url: url,
    headers,
  };
}

/**
 * Check if AWS credentials are configured
 */
export function isAwsConfigured(): boolean {
  return !!IDENTITY_POOL_ID;
}
