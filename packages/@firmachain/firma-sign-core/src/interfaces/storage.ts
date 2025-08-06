/**
 * Storage interface for Firma-Sign document storage system
 */

import { Readable } from 'stream';

/**
 * Main storage interface that all storage implementations must follow
 */
export interface Storage {
	/**
	 * Storage implementation name
	 */
	readonly name: string;

	/**
	 * Storage implementation version
	 */
	readonly version: string;

	/**
	 * Storage capabilities
	 */
	readonly capabilities: StorageCapabilities;

	/**
	 * Initialize the storage backend
	 */
	initialize(config: StorageConfig): Promise<void>;

	/**
	 * Shutdown the storage backend and clean up resources
	 */
	shutdown(): Promise<void>;

	/**
	 * Save data to storage
	 */
	save(path: string, data: Buffer | Readable): Promise<StorageResult>;

	/**
	 * Read data from storage as Buffer
	 */
	read(path: string): Promise<Buffer>;

	/**
	 * Read data from storage as Stream
	 */
	readStream(path: string): Promise<Readable>;

	/**
	 * Check if a path exists
	 */
	exists(path: string): Promise<boolean>;

	/**
	 * Delete a file or directory
	 */
	delete(path: string): Promise<void>;

	/**
	 * List entries in a directory
	 */
	list(prefix: string): Promise<StorageEntry[]>;

	/**
	 * Create a directory (if supported)
	 */
	createDirectory?(path: string): Promise<void>;

	/**
	 * Get metadata for a path
	 */
	getMetadata?(path: string): Promise<StorageMetadata>;

	/**
	 * Set metadata for a path
	 */
	setMetadata?(path: string, metadata: StorageMetadata): Promise<void>;

	/**
	 * Get current status of the storage backend
	 */
	getStatus(): StorageStatus;

	/**
	 * Get storage usage statistics
	 */
	getUsage?(): Promise<StorageUsage>;

	/**
	 * Validate configuration for this storage type
	 */
	validateConfig(config: unknown): config is StorageConfig;
}

/**
 * Storage capabilities descriptor
 */
export interface StorageCapabilities {
	/**
	 * Maximum file size in bytes
	 */
	maxFileSize: number;

	/**
	 * Whether streaming is supported
	 */
	supportsStreaming: boolean;

	/**
	 * Whether custom metadata is supported
	 */
	supportsMetadata: boolean;

	/**
	 * Whether versioning is supported
	 */
	supportsVersioning: boolean;

	/**
	 * Whether encryption at rest is supported
	 */
	supportsEncryption: boolean;

	/**
	 * Whether concurrent access is safe
	 */
	supportsConcurrentAccess: boolean;

	/**
	 * Whether directory listing is supported
	 */
	supportsDirectoryListing: boolean;

	/**
	 * Required configuration fields
	 */
	requiredConfig: string[];
}

/**
 * Storage configuration base type
 * Specific storage implementations will extend this
 */
export interface StorageConfig {
	[key: string]: unknown;
}

/**
 * Result of a storage operation
 */
export interface StorageResult {
	/**
	 * Whether the operation succeeded
	 */
	success: boolean;

	/**
	 * Path where the data was stored
	 */
	path: string;

	/**
	 * Size of the stored data in bytes
	 */
	size: number;

	/**
	 * Hash of the stored data (if available)
	 */
	hash?: string;

	/**
	 * Version identifier (if versioning is supported)
	 */
	versionId?: string;

	/**
	 * Timestamp of the operation
	 */
	timestamp: number;

	/**
	 * Additional metadata
	 */
	metadata?: Record<string, unknown>;
}

/**
 * Entry in a storage listing
 */
export interface StorageEntry {
	/**
	 * Path of the entry
	 */
	path: string;

	/**
	 * Type of entry
	 */
	type: 'file' | 'directory';

	/**
	 * Size in bytes (for files)
	 */
	size: number;

	/**
	 * Last modified timestamp
	 */
	lastModified: number;

	/**
	 * Entry metadata
	 */
	metadata?: Record<string, unknown>;
}

/**
 * Storage metadata
 */
export interface StorageMetadata {
	/**
	 * MIME type of the content
	 */
	contentType?: string;

	/**
	 * Content encoding
	 */
	contentEncoding?: string;

	/**
	 * Cache control header
	 */
	cacheControl?: string;

	/**
	 * Custom metadata
	 */
	customMetadata?: Record<string, string>;

	/**
	 * Encryption information
	 */
	encryption?: {
		algorithm: string;
		keyId?: string;
	};

	/**
	 * Tags for cloud storage
	 */
	tags?: Record<string, string>;
}

/**
 * Storage usage statistics
 */
export interface StorageUsage {
	/**
	 * Used space in bytes
	 */
	used: number;

	/**
	 * Available space in bytes (if known)
	 */
	available?: number;

	/**
	 * Total number of files
	 */
	fileCount: number;

	/**
	 * Total number of directories
	 */
	directoryCount: number;

	/**
	 * Additional provider-specific metrics
	 */
	metrics?: Record<string, unknown>;
}

/**
 * Storage status
 */
export interface StorageStatus {
	/**
	 * Whether the storage is currently available
	 */
	available: boolean;

	/**
	 * Whether the storage is initialized
	 */
	initialized: boolean;

	/**
	 * Error message if any
	 */
	error?: string;

	/**
	 * Last successful operation timestamp
	 */
	lastOperation?: number;

	/**
	 * Additional status information
	 */
	details?: Record<string, unknown>;
}

/**
 * Storage error class
 */
export class StorageError extends Error {
	/**
	 * Error code for programmatic handling
	 */
	code: string;

	/**
	 * Storage backend that generated the error
	 */
	storage: string;

	/**
	 * Additional error details
	 */
	details?: unknown;

	constructor(message: string, code: string, storage: string, details?: unknown) {
		super(message);
		this.name = 'StorageError';
		this.code = code;
		this.storage = storage;
		this.details = details;
	}
}

/**
 * Storage error codes
 */
export const StorageErrorCodes = {
	NOT_INITIALIZED: 'STORAGE_NOT_INITIALIZED',
	INVALID_CONFIG: 'STORAGE_INVALID_CONFIG',
	NOT_FOUND: 'STORAGE_NOT_FOUND',
	PERMISSION_DENIED: 'STORAGE_PERMISSION_DENIED',
	QUOTA_EXCEEDED: 'STORAGE_QUOTA_EXCEEDED',
	FILE_TOO_LARGE: 'STORAGE_FILE_TOO_LARGE',
	OPERATION_FAILED: 'STORAGE_OPERATION_FAILED',
	NETWORK_ERROR: 'STORAGE_NETWORK_ERROR',
	UNSUPPORTED_OPERATION: 'STORAGE_UNSUPPORTED_OPERATION'
} as const;

/**
 * Type guard to check if an error is a StorageError
 */
export function isStorageError(error: unknown): error is StorageError {
	return error instanceof StorageError;
}

/**
 * Storage handler for incoming data
 */
export interface StorageHandler {
	/**
	 * Handle incoming data
	 */
	onDataReceived(path: string, data: Buffer | Readable): Promise<void>;

	/**
	 * Handle errors
	 */
	onError(error: StorageError): void;
}