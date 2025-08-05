import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import { logger } from '../utils/logger';

export class DatabaseConnection {
  private static instance: DatabaseConnection;
  private db: Database.Database;
  
  private constructor(dbPath: string) {
    const dbDir = path.dirname(dbPath);
    if (!fs.existsSync(dbDir)) {
      fs.mkdirSync(dbDir, { recursive: true });
    }
    
    this.db = new Database(dbPath);
    this.db.pragma('journal_mode = WAL');
    this.db.pragma('foreign_keys = ON');
    
    this.initializeTables();
  }
  
  static getInstance(dbPath?: string): DatabaseConnection {
    if (!DatabaseConnection.instance) {
      if (!dbPath) {
        throw new Error('Database path required for first initialization');
      }
      DatabaseConnection.instance = new DatabaseConnection(dbPath);
    }
    return DatabaseConnection.instance;
  }
  
  getDatabase(): Database.Database {
    return this.db;
  }
  
  private initializeTables(): void {
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
    
    try {
      this.db.exec(createTransfersTable);
      this.db.exec(createDocumentsTable);
      this.db.exec(createRecipientsTable);
      
      for (const index of createIndices) {
        this.db.exec(index);
      }
      
      logger.info('Database tables initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize database tables:', error);
      throw error;
    }
  }
  
  beginTransaction(): Database.Transaction {
    return this.db.transaction((fn: () => unknown) => fn());
  }
  
  close(): void {
    this.db.close();
    DatabaseConnection.instance = null as unknown as DatabaseConnection;
  }
}

export interface Transaction {
  run<T>(fn: () => T): T;
  rollback(): void;
}