/**
 * Document-related interfaces
 */

export interface Document {
  /**
   * Unique identifier for this document
   */
  id: string;

  /**
   * Original filename
   */
  fileName: string;

  /**
   * File size in bytes
   */
  fileSize: number;

  /**
   * MIME type of the document
   */
  mimeType: string;

  /**
   * SHA-256 hash of the document content
   */
  hash: string;

  /**
   * Document data (base64 encoded or Uint8Array)
   */
  data?: string | Uint8Array;

  /**
   * Path to document if stored locally
   */
  filePath?: string;

  /**
   * Additional metadata
   */
  metadata?: DocumentMetadata;

  /**
   * Prepared document data (for documents with form fields)
   */
  preparedData?: import('./document-preparation').PreparedDocument;
}

export interface DocumentMetadata {
  /**
   * When the document was created
   */
  createdAt: Date;

  /**
   * Who created the document
   */
  createdBy?: string;

  /**
   * Document description
   */
  description?: string;

  /**
   * Custom properties
   */
  [key: string]: unknown;
}

export interface SignedDocument extends Document {
  /**
   * Original document ID
   */
  originalDocumentId: string;

  /**
   * Signature information
   */
  signatures: DocumentSignature[];

  /**
   * When the document was signed
   */
  signedAt: Date;

  /**
   * Hash of the signed document
   */
  signedHash: string;
}

export interface DocumentSignature {
  /**
   * Who signed
   */
  signerId: string;

  /**
   * Signature data
   */
  signatureData: string;

  /**
   * When it was signed
   */
  signedAt: Date;

  /**
   * Signature components (position, etc.)
   */
  components?: unknown[];
}