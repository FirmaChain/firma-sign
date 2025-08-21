// API Service for Frontend

interface ImportMetaEnv {
	readonly VITE_API_URL?: string;
}

const API_BASE_URL = ((import.meta.env as ImportMetaEnv).VITE_API_URL) || 'http://localhost:8080/api';

// Helper function to get auth token
const getAuthToken = (): string | null => {
	// In development mode, authentication is optional
	const isDevelopment = import.meta.env.MODE === 'development';
	
	// Try to get token from localStorage
	const token = localStorage.getItem('authToken');
	
	// In development, we can work without a token
	// In production, token is required
	return token || (isDevelopment ? 'dev-token' : null);
};

// Helper function for API calls
async function apiCall<T>(
	endpoint: string,
	options: RequestInit = {},
): Promise<T> {
	const token = getAuthToken();
	const isDevelopment = import.meta.env.MODE === 'development';
	
	const headers = new Headers(options.headers);

	// Add auth header if we have a token or in development mode
	if (token || isDevelopment) {
		headers.set('Authorization', `Bearer ${token || 'dev-token'}`);
	}

	if (!(options.body instanceof FormData)) {
		headers.set('Content-Type', 'application/json');
	}

	const response = await fetch(`${API_BASE_URL}${endpoint}`, {
		...options,
		headers,
	});

	if (!response.ok) {
		const error = await response.json().catch(() => ({ message: response.statusText })) as { message?: string };
		throw new Error(error.message || `API Error: ${response.status}`);
	}

	// Handle binary responses
	const contentType = response.headers.get('content-type');
	if (contentType) {
		// Check if the content type is not JSON
		if (!contentType.includes('application/json')) {
			// Return as blob for any non-JSON content (PDF, images, text files, etc.)
			return response.blob() as Promise<T>;
		}
	}

	return response.json() as Promise<T>;
}

// Document Categories - Unified with server
export enum DocumentCategory {
	UPLOADED = 'uploaded',    // User uploaded documents
	RECEIVED = 'received',    // Documents received from others
	SENT = 'sent',           // Documents sent to others
	SIGNED = 'signed',       // Documents that have been signed
	TEMPLATES = 'templates',  // Document templates
	ARCHIVED = 'archived',   // Archived documents
	DELETED = 'deleted'      // Soft-deleted documents
}

// Document Status - Unified with server
export enum DocumentStatus {
	DRAFT = 'draft',           // Initial upload state
	PENDING = 'pending',       // Awaiting action
	IN_PROGRESS = 'in_progress', // Being processed
	SIGNED = 'signed',         // Successfully signed
	COMPLETED = 'completed',   // Workflow complete
	REJECTED = 'rejected',     // Rejected by signer
	EXPIRED = 'expired',       // Past deadline
	ARCHIVED = 'archived',     // Moved to archive
	DELETED = 'deleted'        // Soft deleted
}

// Unified Document interface - matches server DocumentMetadata
export interface DocumentMetadata {
	// Core identification
	id: string;
	originalName: string;
	fileName: string; // Sanitized filename for storage
	
	// Content metadata
	size: number;
	hash: string;
	mimeType: string;
	
	// Organization
	category: DocumentCategory;
	status: DocumentStatus;
	
	// Transfer context
	transferId?: string;
	
	// Temporal tracking
	uploadedAt: string; // ISO string for frontend
	lastModified: string;
	signedAt?: string;
	
	// User context
	uploadedBy?: string;
	signedBy?: string[];
	
	// Versioning
	version: number;
	previousVersionId?: string;
	
	// Extensibility
	tags?: string[];
	metadata?: Record<string, unknown>;
}

export interface DocumentFilter {
	category?: DocumentCategory;
	status?: DocumentStatus;
	transferId?: string;
	uploadedBy?: string;
	signedBy?: string;
	tags?: string[];
	fromDate?: string;
	toDate?: string;
	searchText?: string;
	limit?: number;
	offset?: number;
}

export interface StorageStats {
	totalDocuments: number;
	totalSize: number;
	categories: Record<DocumentCategory, number>;
	averageSize: number;
}

// API functions
export const documentsAPI = {
	// Upload a new document
	async upload(
		file: File,
		category: DocumentCategory = DocumentCategory.UPLOADED,
		metadata?: {
			transferId?: string;
			tags?: string[];
			metadata?: Record<string, unknown>;
		},
	): Promise<{ success: boolean; document: DocumentMetadata }> {
		const formData = new FormData();
		formData.append('document', file);
		if (metadata?.transferId) formData.append('transferId', metadata.transferId);
		if (metadata?.tags) formData.append('tags', JSON.stringify(metadata.tags));
		if (metadata?.metadata) formData.append('metadata', JSON.stringify(metadata.metadata));
		formData.append('category', category);

		return apiCall('/documents/upload', {
			method: 'POST',
			body: formData,
		});
	},

	// Get document by ID (downloads the file)
	async getDocument(documentId: string): Promise<Blob> {
		return apiCall(`/documents/${documentId}`, {
			method: 'GET',
		});
	},


	// Get document metadata
	async getMetadata(documentId: string): Promise<{ success: boolean; metadata: DocumentMetadata }> {
		return apiCall(`/documents/${documentId}/metadata`, {
			method: 'GET',
		});
	},

	// Search documents
	async search(filter: DocumentFilter = {}): Promise<{
		success: boolean;
		documents: DocumentMetadata[];
		total: number;
		limit: number;
		offset: number;
	}> {
		const params = new URLSearchParams();
		Object.entries(filter).forEach(([key, value]) => {
			if (value !== undefined) {
				if (Array.isArray(value)) {
					value.forEach(v => params.append(key, String(v)));
				} else {
					params.append(key, String(value));
				}
			}
		});

		return apiCall(`/documents?${params.toString()}`, {
			method: 'GET',
		});
	},

	// Update document status
	async updateStatus(
		documentId: string,
		status: DocumentStatus,
	): Promise<{ success: boolean; message: string }> {
		return apiCall(`/documents/${documentId}`, {
			method: 'PATCH',
			body: JSON.stringify({ status }),
		});
	},

	// Move document to different category
	async moveDocument(
		documentId: string,
		category: DocumentCategory,
	): Promise<{ success: boolean; message: string }> {
		return apiCall(`/documents/${documentId}/move`, {
			method: 'POST',
			body: JSON.stringify({ category }),
		});
	},

	// Delete document
	async deleteDocument(
		documentId: string,
		permanent = false,
	): Promise<{ success: boolean; message: string }> {
		return apiCall(`/documents/${documentId}?permanent=${permanent}`, {
			method: 'DELETE',
		});
	},

	// Get document versions
	async getVersions(documentId: string): Promise<{
		success: boolean;
		versions: DocumentMetadata[];
	}> {
		return apiCall(`/documents/${documentId}/versions`, {
			method: 'GET',
		});
	},

	// Create new version
	async createVersion(
		documentId: string,
		file: File,
		metadata?: Record<string, unknown>,
	): Promise<{ success: boolean; document: DocumentMetadata }> {
		const formData = new FormData();
		formData.append('document', file);
		if (metadata) formData.append('metadata', JSON.stringify(metadata));

		return apiCall(`/documents/${documentId}/versions`, {
			method: 'POST',
			body: formData,
		});
	},

	// Get storage statistics
	async getStats(): Promise<{ success: boolean; stats: StorageStats }> {
		return apiCall('/documents/stats', {
			method: 'GET',
		});
	},

	// Archive old documents
	async archiveOld(olderThanDays = 90): Promise<{ success: boolean; message: string }> {
		return apiCall('/documents/archive', {
			method: 'POST',
			body: JSON.stringify({ olderThanDays }),
		});
	},
};

// Authentication API
export const authAPI = {
	// Connect with transfer code
	async connect(code: string, transport?: string): Promise<{
		success: boolean;
		transferId: string;
		sessionToken: string;
		expiresIn: number;
	}> {
		const response = await apiCall<{
			success: boolean;
			transferId: string;
			sessionToken: string;
			expiresIn: number;
		}>('/auth/connect', {
			method: 'POST',
			body: JSON.stringify({ code, transport }),
		});

		// Store the token
		if (response.sessionToken) {
			localStorage.setItem('authToken', response.sessionToken);
		}

		return response;
	},

	// Generate key pair
	async generateKeyPair(): Promise<{
		publicKey: string;
		privateKey: string;
	}> {
		return apiCall('/auth/generate-keypair', {
			method: 'POST',
		});
	},
};

// Transfer API
export const transfersAPI = {
	// Create new transfer
	async create(data: {
		documents: Array<{
			id: string;
			fileName: string;
			fileData?: string;
		}>;
		recipients: Array<{
			identifier: string;
			transport: string;
			signerAssignments?: Record<string, boolean>;
			preferences?: Record<string, unknown>;
		}>;
		metadata?: Record<string, unknown>;
	}): Promise<{
		transferId: string;
		code: string;
		status: string;
	}> {
		return apiCall('/transfers/create', {
			method: 'POST',
			body: JSON.stringify(data),
		});
	},

	// List transfers
	async list(params?: {
		type?: 'incoming' | 'outgoing';
		status?: string;
		limit?: number;
		offset?: number;
	}): Promise<{
		transfers: Array<{
			transferId: string;
			type: string;
			sender?: Record<string, unknown>;
			documentCount: number;
			status: string;
			createdAt: number;
			updatedAt: number;
		}>;
		total: number;
		hasMore: boolean;
	}> {
		const queryParams = new URLSearchParams();
		if (params) {
			Object.entries(params).forEach(([key, value]) => {
				if (value !== undefined) {
					queryParams.append(key, String(value));
				}
			});
		}

		return apiCall(`/transfers?${queryParams.toString()}`, {
			method: 'GET',
		});
	},

	// Get transfer details
	async getDetails(transferId: string): Promise<{
		transferId: string;
		type: string;
		sender?: Record<string, unknown>;
		status: string;
		transport: Record<string, unknown>;
		documents: Array<Record<string, unknown>>;
		recipients: Array<Record<string, unknown>>;
		metadata?: Record<string, unknown>;
	}> {
		return apiCall(`/transfers/${transferId}`, {
			method: 'GET',
		});
	},
};

// Utility functions for unified document interface

// Convert FileItem to DocumentMetadata for unified interface
export function convertFileItemToDocument(fileItem: {
	id: string;
	name: string;
	size?: number;
	hash?: string;
	mimeType?: string;
	status?: string;
	createdAt?: Date | string;
	modifiedAt?: Date | string;
	transferId?: string;
	uploadedBy?: string;
	signedBy?: string[];
	version?: number;
	tags?: string[];
}): DocumentMetadata {
	return {
		id: fileItem.id,
		originalName: fileItem.name,
		fileName: fileItem.name,
		size: fileItem.size || 0,
		hash: fileItem.hash || '',
		mimeType: fileItem.mimeType || 'application/pdf',
		category: mapStatusToCategory(fileItem.status),
		status: (fileItem.status as DocumentStatus) || DocumentStatus.DRAFT,
		uploadedAt: typeof fileItem.createdAt === 'string' 
			? fileItem.createdAt 
			: (fileItem.createdAt?.toISOString() || new Date().toISOString()),
		lastModified: typeof fileItem.modifiedAt === 'string' 
			? fileItem.modifiedAt 
			: (fileItem.modifiedAt?.toISOString() || new Date().toISOString()),
		version: fileItem.version || 1,
		tags: fileItem.tags || [],
		transferId: fileItem.transferId,
		uploadedBy: fileItem.uploadedBy,
		signedBy: fileItem.signedBy
	};
}

// Map file status to appropriate category
export function mapStatusToCategory(status?: string): DocumentCategory {
	switch (status) {
		case 'signed': return DocumentCategory.SIGNED;
		case 'expired': 
		case 'archived': return DocumentCategory.ARCHIVED;
		case 'deleted': return DocumentCategory.DELETED;
		default: return DocumentCategory.UPLOADED;
	}
}