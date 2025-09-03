/**
 * Database interface for Firma-Sign storage backends
 * This allows different database implementations (SQLite, PostgreSQL, MongoDB, etc.)
 */

/**
 * Base database interface that all database implementations must follow
 */
export interface Database {
  /**
   * Database identification
   */
  readonly name: string;
  readonly version: string;
  readonly capabilities: DatabaseCapabilities;

  /**
   * Lifecycle methods
   */
  initialize(config: DatabaseConfig): Promise<void>;
  shutdown(): Promise<void>;

  /**
   * Repository access
   */
  getRepository<T>(entityName: string): Repository<T>;
  
  /**
   * Transaction support
   */
  transaction<T>(fn: (tx: Transaction) => Promise<T>): Promise<T>;
  
  /**
   * Status and management
   */
  getStatus(): DatabaseStatus;
  validateConfig(config: unknown): config is DatabaseConfig;

  /**
   * Migration support
   */
  migrate(): Promise<void>;
}

/**
 * Repository interface for entity operations
 */
export interface Repository<T> {
  /**
   * Basic CRUD operations
   */
  findById(id: string): Promise<T | null>;
  findAll(options?: QueryOptions): Promise<T[]>;
  findOne(criteria: Partial<T>): Promise<T | null>;
  find(criteria: Partial<T>, options?: QueryOptions): Promise<T[]>;
  
  create(data: Partial<T>): Promise<T>;
  update(id: string, data: Partial<T>): Promise<T | null>;
  delete(id: string): Promise<boolean>;
  
  /**
   * Batch operations
   */
  createMany(data: Partial<T>[]): Promise<T[]>;
  updateMany(criteria: Partial<T>, data: Partial<T>): Promise<number>;
  deleteMany(criteria: Partial<T>): Promise<number>;
  
  /**
   * Counting
   */
  count(criteria?: Partial<T>): Promise<number>;
  exists(criteria: Partial<T>): Promise<boolean>;
}

/**
 * Transaction interface for atomic operations
 */
export interface Transaction {
  /**
   * Get repository within transaction context
   */
  getRepository<T>(entityName: string): Repository<T>;
  
  /**
   * Transaction control
   */
  commit(): Promise<void>;
  rollback(): Promise<void>;
}

/**
 * Database capabilities
 */
export interface DatabaseCapabilities {
  supportsTransactions: boolean;
  supportsNestedTransactions: boolean;
  supportsFullTextSearch: boolean;
  supportsJSONFields: boolean;
  supportsConcurrentConnections: boolean;
  supportsReplication: boolean;
  maxConnectionPoolSize: number;
  requiredConfig: string[];
}

/**
 * Database configuration
 */
export interface DatabaseConfig {
  connectionString?: string;
  host?: string;
  port?: number;
  database?: string;
  username?: string;
  password?: string;
  poolSize?: number;
  timeout?: number;
  ssl?: boolean;
  options?: Record<string, unknown>;
}

/**
 * Query options for find operations
 */
export interface QueryOptions {
  limit?: number;
  offset?: number;
  orderBy?: Record<string, 'asc' | 'desc'>;
  select?: string[];
  include?: string[];
}

/**
 * Database status
 */
export interface DatabaseStatus {
  connected: boolean;
  connectionCount: number;
  pendingTransactions: number;
  lastError?: string;
  statistics?: {
    totalQueries: number;
    totalTransactions: number;
    averageQueryTime: number;
  };
}

/**
 * Database error
 */
export class DatabaseError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly database: string,
    public readonly details?: unknown
  ) {
    super(message);
    this.name = 'DatabaseError';
  }
}

/**
 * Entity definitions for Firma-Sign database
 */

export interface TransferEntity {
  id: string;
  type: 'incoming' | 'outgoing';
  status: string;
  senderId?: string;
  senderName?: string;
  senderEmail?: string;
  senderPublicKey?: string;
  transportType: string;
  transportConfig?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

export interface DocumentEntity {
  id: string;
  transferId: string;
  fileName: string;
  fileSize: number;
  fileHash: string;
  status: string;
  originalDocumentId?: string;  // Reference to original document ID
  signedAt?: Date;
  signedBy?: string;
  blockchainTxOriginal?: string;
  blockchainTxSigned?: string;
  createdAt: Date;
}

export interface RecipientEntity {
  id: string;
  transferId: string;
  identifier: string;
  transport: string;
  status: string;
  preferences?: Record<string, unknown>;
  notifiedAt?: Date;
  viewedAt?: Date;
  signedAt?: Date;
  createdAt: Date;
}

/**
 * Type guards
 */
export function isDatabaseError(error: unknown): error is DatabaseError {
  return error instanceof DatabaseError;
}

/**
 * Helper function to create database error
 */
export function createDatabaseError(
  message: string,
  code: string,
  database: string,
  details?: unknown
): DatabaseError {
  return new DatabaseError(message, code, database, details);
}