/**
 * Document preparation interfaces for frontend integration
 */

export interface DocumentComponentPosition {
  x: number;
  y: number;
}

export interface DocumentComponentSize {
  width: number;
  height: number;
}

export interface DocumentComponentConfig {
  required?: boolean;
  fontSize?: number;
  fontFamily?: string;
  fontWeight?: string;
  color?: string;
  backgroundColor?: string;
  borderColor?: string;
  borderWidth?: number;
  borderRadius?: number;
  placeholder?: string;
  maxLength?: number;
  multiline?: boolean;
  readonly?: boolean;
  fixed?: boolean;
  format?: string; // For date components
  stampType?: string; // For stamp components
}

export interface DocumentSigner {
  userId?: string;
  email: string;
  name: string;
  color: string; // For UI display
}

export type DocumentComponentType = 
  | 'TEXT'
  | 'SIGNATURE'
  | 'STAMP'
  | 'CHECKBOX'
  | 'CHECKMARK'
  | 'INPUT_FIELD'
  | 'DATE'
  | 'EXTRA'
  | 'RECTANGLE'
  | 'CIRCLE'
  | 'LINE'
  | 'IMAGE';

export interface DocumentComponent {
  id: string;
  type: DocumentComponentType;
  pageNumber: number;
  position: DocumentComponentPosition;
  size: DocumentComponentSize;
  assigned: DocumentSigner;
  value?: string | boolean | Date;
  config: DocumentComponentConfig;
  groupId?: string;
  extra?: Record<string, unknown>;
  created?: number;
  modified?: number;
}

export interface DocumentComponentGroup {
  id: string;
  name: string;
  config: {
    minimumRequired?: number;
    maximumAllowed?: number;
  };
  components: string[]; // Component IDs
}

/**
 * Document metadata to be extracted before sending
 */
export interface PreparedDocument {
  /**
   * Original PDF file data
   */
  pdfData: Uint8Array | string; // Base64 or binary

  /**
   * Components placed on the document
   */
  components: DocumentComponent[];

  /**
   * Component groups (if any)
   */
  componentGroups?: DocumentComponentGroup[];

  /**
   * List of signers required for this document
   */
  signers: DocumentSigner[];

  /**
   * Document metadata
   */
  metadata: {
    fileName: string;
    fileSize: number;
    pageCount: number;
    createdAt: Date;
    modifiedAt?: Date;
    title?: string;
    description?: string;
  };

  /**
   * Signing requirements
   */
  requirements: {
    /**
     * Components that must be filled/signed
     */
    requiredComponents: string[]; // Component IDs

    /**
     * Deadline for signing
     */
    deadline?: Date;

    /**
     * Whether all signers must complete their parts
     */
    requireAllSigners: boolean;

    /**
     * Signing order (if sequential signing is required)
     */
    signingOrder?: string[]; // Signer emails in order
  };
}

/**
 * Export format for sending to transport layer
 */
export interface DocumentExport {
  /**
   * Document ID
   */
  id: string;

  /**
   * Prepared document data
   */
  document: PreparedDocument;

  /**
   * SHA-256 hash of the original PDF
   */
  originalHash: string;

  /**
   * Blockchain transaction ID (if already stored)
   */
  blockchainTxId?: string;

  /**
   * Export timestamp
   */
  exportedAt: Date;

  /**
   * Version for compatibility
   */
  version: string;
}

/**
 * Signed component data returned after signing
 */
export interface SignedComponent {
  /**
   * Original component ID
   */
  componentId: string;

  /**
   * Signer information
   */
  signer: DocumentSigner;

  /**
   * Signed value
   */
  value: string | boolean | Date;

  /**
   * Signature data (for signature components)
   */
  signatureData?: string;

  /**
   * When it was signed
   */
  signedAt: Date;

  /**
   * IP address or other verification data
   */
  verificationData?: {
    ipAddress?: string;
    userAgent?: string;
    location?: string;
  };
}

/**
 * Completed document with all signatures
 */
export interface CompletedDocument {
  /**
   * Original document export
   */
  originalExport: DocumentExport;

  /**
   * All signed components
   */
  signedComponents: SignedComponent[];

  /**
   * Final PDF with signatures embedded
   */
  signedPdfData: Uint8Array | string;

  /**
   * SHA-256 hash of the signed PDF
   */
  signedHash: string;

  /**
   * Completion timestamp
   */
  completedAt: Date;

  /**
   * Blockchain transaction ID for signed document
   */
  signedBlockchainTxId?: string;
}