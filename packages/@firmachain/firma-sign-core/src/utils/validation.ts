/**
 * Validation utilities
 */

import { z } from 'zod';

/**
 * Email validation schema
 */
export const emailSchema = z.string().email();

/**
 * Transfer ID validation schema
 */
export const transferIdSchema = z.string().regex(/^[a-zA-Z0-9_-]{8,32}$/);

/**
 * Document ID validation schema
 */
export const documentIdSchema = z.string().regex(/^[a-f0-9]{16}$/);

/**
 * File size validation (max 100MB by default)
 */
export const fileSizeSchema = (maxSize: number = 100 * 1024 * 1024) => 
  z.number().positive().max(maxSize);

/**
 * MIME type validation for documents
 */
export const documentMimeTypeSchema = z.enum([
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'image/png',
  'image/jpeg',
  'image/jpg',
  'text/plain',
]);

/**
 * Validate email address
 */
export function isValidEmail(email: string): boolean {
  try {
    emailSchema.parse(email);
    return true;
  } catch {
    return false;
  }
}

/**
 * Validate transfer ID
 */
export function isValidTransferId(id: string): boolean {
  try {
    transferIdSchema.parse(id);
    return true;
  } catch {
    return false;
  }
}

/**
 * Validate document MIME type
 */
export function isValidDocumentType(mimeType: string): boolean {
  try {
    documentMimeTypeSchema.parse(mimeType);
    return true;
  } catch {
    return false;
  }
}

/**
 * Generate a valid transfer ID
 */
export function generateTransferId(): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 10);
  return `${timestamp}-${random}`;
}