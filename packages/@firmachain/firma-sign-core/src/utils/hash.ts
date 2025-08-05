/**
 * Hashing utilities for document integrity
 */

import { createHash } from 'crypto';

/**
 * Generate SHA-256 hash of data
 */
export function generateHash(data: string | Uint8Array): string {
  const hash = createHash('sha256');
  
  if (typeof data === 'string') {
    hash.update(data, 'utf8');
  } else {
    hash.update(data);
  }
  
  return hash.digest('hex');
}

/**
 * Generate hash from file content
 */
export function generateFileHash(content: Uint8Array): string {
  return generateHash(content);
}

/**
 * Verify that data matches a given hash
 */
export function verifyHash(data: string | Uint8Array, expectedHash: string): boolean {
  const actualHash = generateHash(data);
  return actualHash === expectedHash;
}

/**
 * Generate a document ID from hash and timestamp
 */
export function generateDocumentId(hash: string, timestamp: number = Date.now()): string {
  const combined = `${hash}-${timestamp}`;
  return generateHash(combined).substring(0, 16);
}

/**
 * Combine multiple hashes into a single hash (for batch operations)
 */
export function combineHashes(hashes: string[]): string {
  const combined = hashes.sort().join('');
  return generateHash(combined);
}