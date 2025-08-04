/**
 * Utilities for preparing documents before sending
 */

import { 
  DocumentComponent, 
  DocumentSigner, 
  PreparedDocument,
  DocumentExport,
  SignedComponent,
  CompletedDocument
} from '../interfaces/document-preparation';
import { Document } from '../interfaces/document';
import { generateHash, generateDocumentId } from './hash';

/**
 * Extract unique signers from components
 */
export function extractSigners(components: DocumentComponent[]): DocumentSigner[] {
  const signerMap = new Map<string, DocumentSigner>();
  
  components.forEach(component => {
    const key = component.assigned.email;
    if (!signerMap.has(key)) {
      signerMap.set(key, {
        userId: component.assigned.userId,
        email: component.assigned.email,
        name: component.assigned.name,
        color: component.assigned.color
      });
    }
  });
  
  return Array.from(signerMap.values());
}

/**
 * Extract required component IDs
 */
export function extractRequiredComponents(components: DocumentComponent[]): string[] {
  return components
    .filter(c => c.config.required === true)
    .map(c => c.id);
}

/**
 * Prepare a document for export
 */
export function prepareDocumentForExport(
  pdfData: Uint8Array | string,
  components: DocumentComponent[],
  metadata: {
    fileName: string;
    fileSize: number;
    pageCount: number;
    title?: string;
    description?: string;
  },
  requirements?: {
    deadline?: Date;
    requireAllSigners?: boolean;
    signingOrder?: string[];
  }
): DocumentExport {
  const hash = typeof pdfData === 'string' 
    ? generateHash(pdfData) 
    : generateHash(pdfData);
  
  const preparedDoc: PreparedDocument = {
    pdfData,
    components,
    signers: extractSigners(components),
    metadata: {
      ...metadata,
      createdAt: new Date(),
    },
    requirements: {
      requiredComponents: extractRequiredComponents(components),
      deadline: requirements?.deadline,
      requireAllSigners: requirements?.requireAllSigners ?? true,
      signingOrder: requirements?.signingOrder
    }
  };

  return {
    id: generateDocumentId(hash),
    document: preparedDoc,
    originalHash: hash,
    exportedAt: new Date(),
    version: '1.0.0'
  };
}

/**
 * Convert a prepared document to a standard Document interface
 */
export function preparedToDocument(
  exportData: DocumentExport,
  mimeType: string = 'application/pdf'
): Document {
  return {
    id: exportData.id,
    fileName: exportData.document.metadata.fileName,
    fileSize: exportData.document.metadata.fileSize,
    mimeType,
    hash: exportData.originalHash,
    data: exportData.document.pdfData,
    metadata: {
      createdAt: exportData.document.metadata.createdAt,
      description: exportData.document.metadata.description
    },
    preparedData: exportData.document
  };
}

/**
 * Validate that all required components have been signed
 */
export function validateSignedComponents(
  preparedDoc: PreparedDocument,
  signedComponents: SignedComponent[]
): { valid: boolean; missing: string[] } {
  const signedIds = new Set(signedComponents.map(sc => sc.componentId));
  const missing = preparedDoc.requirements.requiredComponents
    .filter(id => !signedIds.has(id));
  
  return {
    valid: missing.length === 0,
    missing
  };
}

/**
 * Create a completed document
 */
export function createCompletedDocument(
  originalExport: DocumentExport,
  signedComponents: SignedComponent[],
  signedPdfData: Uint8Array | string
): CompletedDocument {
  const signedHash = typeof signedPdfData === 'string'
    ? generateHash(signedPdfData)
    : generateHash(signedPdfData);

  return {
    originalExport,
    signedComponents,
    signedPdfData,
    signedHash,
    completedAt: new Date()
  };
}

/**
 * Check if a component belongs to a specific signer
 */
export function isComponentForSigner(
  component: DocumentComponent,
  signerEmail: string
): boolean {
  return component.assigned.email === signerEmail;
}

/**
 * Filter components by signer
 */
export function getComponentsForSigner(
  components: DocumentComponent[],
  signerEmail: string
): DocumentComponent[] {
  return components.filter(c => isComponentForSigner(c, signerEmail));
}

/**
 * Get signing progress
 */
export function getSigningProgress(
  preparedDoc: PreparedDocument,
  signedComponents: SignedComponent[]
): {
  total: number;
  signed: number;
  percentage: number;
  byUser: Record<string, { total: number; signed: number }>;
} {
  const signedIds = new Set(signedComponents.map(sc => sc.componentId));
  const requiredTotal = preparedDoc.requirements.requiredComponents.length;
  const requiredSigned = preparedDoc.requirements.requiredComponents
    .filter(id => signedIds.has(id)).length;

  const byUser: Record<string, { total: number; signed: number }> = {};
  
  preparedDoc.signers.forEach(signer => {
    const userComponents = getComponentsForSigner(preparedDoc.components, signer.email);
    const userRequired = userComponents.filter(c => c.config.required);
    const userSigned = userRequired.filter(c => signedIds.has(c.id));
    
    byUser[signer.email] = {
      total: userRequired.length,
      signed: userSigned.length
    };
  });

  return {
    total: requiredTotal,
    signed: requiredSigned,
    percentage: requiredTotal > 0 ? (requiredSigned / requiredTotal) * 100 : 0,
    byUser
  };
}