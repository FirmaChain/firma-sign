/**
 * Type definitions for test files
 */

import type { Transfer, Document, Recipient } from '../../types/database.js';
import type { StorageResult } from '@firmachain/firma-sign-core';
import type { DocumentMetadata } from '../../services/DocumentService.js';

// Partial types for mocking
export type MockTransfer = Partial<Transfer>;
export type MockDocument = Partial<Document>;
export type MockRecipient = Partial<Recipient>;
export type MockStorageResult = Partial<StorageResult>;
export type MockDocumentMetadata = Partial<DocumentMetadata>;

// Transfer with details for getTransferWithDetails
export interface TransferWithDetails {
	transfer: Transfer;
	documents: Document[];
	recipients: Recipient[];
}

// Document service response
export interface DocumentServiceResponse {
	data: Buffer;
	metadata: DocumentMetadata;
}

// Mock response types
export interface MockTransferResponse extends MockTransfer {
	id: string;
	type: 'incoming' | 'outgoing';
	status: 'pending' | 'completed';
	createdAt: Date;
	updatedAt: Date;
}

export interface MockDocumentResponse extends MockDocument {
	id: string;
	transferId: string;
	fileName: string;
	fileSize: number;
	fileHash: string;
	status: 'pending' | 'signed' | 'rejected';
}

export interface MockStorageResponse extends MockStorageResult {
	success: boolean;
	hash: string;
}
