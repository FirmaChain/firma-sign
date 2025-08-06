/**
 * SQLite database implementation for Firma-Sign
 */

export { SQLiteDatabase } from './SQLiteDatabase';
export { SQLiteRepository } from './SQLiteRepository';
export { SQLiteTransaction } from './SQLiteTransaction';
export * from './repositories';

// Re-export types from core
export type {
  Database,
  DatabaseCapabilities,
  DatabaseConfig,
  DatabaseStatus,
  Repository,
  Transaction,
  QueryOptions,
  TransferEntity,
  DocumentEntity,
  RecipientEntity
} from '@firmachain/firma-sign-core';