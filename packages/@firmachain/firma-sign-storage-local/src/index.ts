/**
 * @firmachain/firma-sign-storage-local
 * 
 * Local filesystem storage implementation for Firma-Sign
 */

export { LocalStorage } from './LocalStorage';
export type { LocalStorageConfig } from './LocalStorage';

// Re-export storage types from core for convenience
export type {
	Storage,
	StorageCapabilities,
	StorageConfig,
	StorageResult,
	StorageEntry,
	StorageMetadata,
	StorageStatus,
	StorageUsage,
	StorageError,
	StorageHandler,
} from '@firmachain/firma-sign-core/interfaces/storage';