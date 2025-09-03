import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import {
  Database as IDatabase,
  DatabaseCapabilities,
  DatabaseConfig,
  DatabaseStatus,
  Repository,
  Transaction,
  createDatabaseError
} from '@firmachain/firma-sign-core';
import { SQLiteTransaction } from './SQLiteTransaction';
import { TransferRepository } from './repositories/TransferRepository';
import { DocumentRepository } from './repositories/DocumentRepository';
import { RecipientRepository } from './repositories/RecipientRepository';

export class SQLiteDatabase implements IDatabase {
  readonly name = 'sqlite';
  readonly version = '1.0.0';
  readonly capabilities: DatabaseCapabilities = {
    supportsTransactions: true,
    supportsNestedTransactions: false,
    supportsFullTextSearch: true,
    supportsJSONFields: true,
    supportsConcurrentConnections: false,
    supportsReplication: false,
    maxConnectionPoolSize: 1,
    requiredConfig: ['database']
  };

  private db?: Database.Database;
  private repositories = new Map<string, Repository<unknown>>();
  private config?: DatabaseConfig;
  private isInitialized = false;

  async initialize(config: DatabaseConfig): Promise<void> {
    if (this.isInitialized) {
      throw createDatabaseError(
        'Database already initialized',
        'ALREADY_INITIALIZED',
        this.name
      );
    }

    if (!this.validateConfig(config)) {
      throw createDatabaseError(
        'Invalid database configuration',
        'INVALID_CONFIG',
        this.name,
        { config }
      );
    }

    this.config = config;
    const dbPath = config.database || path.join(process.cwd(), 'firma-sign.db');
    const dbDir = path.dirname(dbPath);

    // Ensure directory exists
    if (!fs.existsSync(dbDir)) {
      fs.mkdirSync(dbDir, { recursive: true });
    }

    // Open database connection
    this.db = new Database(dbPath);
    
    // Configure database
    this.db.pragma('journal_mode = WAL');
    this.db.pragma('foreign_keys = ON');
    
    // Initialize tables
    await this.initializeTables();
    
    // Register repositories
    this.registerRepositories();
    
    this.isInitialized = true;
  }

  async shutdown(): Promise<void> {
    if (this.db) {
      this.db.close();
      this.db = undefined;
      this.repositories.clear();
      this.isInitialized = false;
    }
  }

  getRepository<T>(entityName: string): Repository<T> {
    if (!this.isInitialized || !this.db) {
      throw createDatabaseError(
        'Database not initialized',
        'NOT_INITIALIZED',
        this.name
      );
    }

    const repository = this.repositories.get(entityName);
    if (!repository) {
      throw createDatabaseError(
        `Repository for entity '${entityName}' not found`,
        'REPOSITORY_NOT_FOUND',
        this.name,
        { entityName }
      );
    }

    return repository as Repository<T>;
  }

  async transaction<T>(fn: (tx: Transaction) => Promise<T>): Promise<T> {
    if (!this.db) {
      throw createDatabaseError(
        'Database not initialized',
        'NOT_INITIALIZED',
        this.name
      );
    }

    const transaction = new SQLiteTransaction(this.db, this.repositories);
    return transaction.execute(fn);
  }

  getStatus(): DatabaseStatus {
    return {
      connected: this.isInitialized && this.db !== undefined,
      connectionCount: this.isInitialized ? 1 : 0,
      pendingTransactions: 0,
      statistics: {
        totalQueries: 0,
        totalTransactions: 0,
        averageQueryTime: 0
      }
    };
  }

  validateConfig(config: unknown): config is DatabaseConfig {
    if (!config || typeof config !== 'object') {
      return false;
    }

    const cfg = config as Record<string, unknown>;
    
    // SQLite requires either database path or connectionString
    return (
      typeof cfg.database === 'string' ||
      typeof cfg.connectionString === 'string'
    );
  }

  async migrate(): Promise<void> {
    // Migration logic would go here
    // For now, tables are created in initializeTables
  }

  private async initializeTables(): Promise<void> {
    if (!this.db) return;

    const createTransfersTable = `
      CREATE TABLE IF NOT EXISTS transfers (
        id TEXT PRIMARY KEY,
        type TEXT NOT NULL CHECK (type IN ('incoming', 'outgoing')),
        status TEXT NOT NULL DEFAULT 'pending',
        sender_id TEXT,
        sender_name TEXT,
        sender_email TEXT,
        sender_public_key TEXT,
        transport_type TEXT NOT NULL,
        transport_config TEXT,
        metadata TEXT,
        created_at INTEGER NOT NULL DEFAULT (unixepoch()),
        updated_at INTEGER NOT NULL DEFAULT (unixepoch())
      )
    `;

    const createDocumentsTable = `
      CREATE TABLE IF NOT EXISTS documents (
        id TEXT PRIMARY KEY,
        transfer_id TEXT NOT NULL,
        file_name TEXT NOT NULL,
        file_size INTEGER NOT NULL,
        file_hash TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'pending',
        original_document_id TEXT,
        signed_at INTEGER,
        signed_by TEXT,
        blockchain_tx_original TEXT,
        blockchain_tx_signed TEXT,
        created_at INTEGER NOT NULL DEFAULT (unixepoch()),
        FOREIGN KEY (transfer_id) REFERENCES transfers(id) ON DELETE CASCADE
      )
    `;

    const createRecipientsTable = `
      CREATE TABLE IF NOT EXISTS recipients (
        id TEXT PRIMARY KEY,
        transfer_id TEXT NOT NULL,
        identifier TEXT NOT NULL,
        transport TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'pending',
        preferences TEXT,
        notified_at INTEGER,
        viewed_at INTEGER,
        signed_at INTEGER,
        created_at INTEGER NOT NULL DEFAULT (unixepoch()),
        FOREIGN KEY (transfer_id) REFERENCES transfers(id) ON DELETE CASCADE
      )
    `;

    const createIndices = [
      'CREATE INDEX IF NOT EXISTS idx_transfers_type ON transfers(type)',
      'CREATE INDEX IF NOT EXISTS idx_transfers_status ON transfers(status)',
      'CREATE INDEX IF NOT EXISTS idx_transfers_created_at ON transfers(created_at)',
      'CREATE INDEX IF NOT EXISTS idx_documents_transfer_id ON documents(transfer_id)',
      'CREATE INDEX IF NOT EXISTS idx_documents_status ON documents(status)',
      'CREATE INDEX IF NOT EXISTS idx_recipients_transfer_id ON recipients(transfer_id)',
      'CREATE INDEX IF NOT EXISTS idx_recipients_status ON recipients(status)'
    ];

    // Execute table creation
    this.db.exec(createTransfersTable);
    this.db.exec(createDocumentsTable);
    this.db.exec(createRecipientsTable);

    // Create indices
    for (const index of createIndices) {
      this.db.exec(index);
    }
  }

  private registerRepositories(): void {
    if (!this.db) return;

    // Register entity repositories
    const transferRepo = new TransferRepository(this.db);
    const documentRepo = new DocumentRepository(this.db);
    const recipientRepo = new RecipientRepository(this.db);
    
    this.repositories.set('Transfer', transferRepo);
    this.repositories.set('Document', documentRepo);
    this.repositories.set('Recipient', recipientRepo);
    
    // Alternative names for convenience
    this.repositories.set('TransferEntity', transferRepo);
    this.repositories.set('DocumentEntity', documentRepo);
    this.repositories.set('RecipientEntity', recipientRepo);
  }

  // Helper method to get the database instance (for internal use)
  getDatabaseInstance(): Database.Database | undefined {
    return this.db;
  }
}