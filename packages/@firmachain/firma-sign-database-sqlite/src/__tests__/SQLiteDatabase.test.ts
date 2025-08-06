import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { SQLiteDatabase } from '../SQLiteDatabase';
import { createTestDatabase, cleanupTestDatabase } from './utils/testDb';

describe('SQLiteDatabase', () => {
  let database: SQLiteDatabase;

  beforeEach(async () => {
    database = await createTestDatabase();
  });

  afterEach(async () => {
    await cleanupTestDatabase(database);
  });

  describe('initialization', () => {
    it('should have correct name and version', () => {
      expect(database.name).toBe('sqlite');
      expect(database.version).toBe('1.0.0');
    });

    it('should have correct capabilities', () => {
      const capabilities = database.capabilities;
      expect(capabilities.supportsTransactions).toBe(true);
      expect(capabilities.supportsNestedTransactions).toBe(false);
      expect(capabilities.supportsFullTextSearch).toBe(true);
      expect(capabilities.supportsJSONFields).toBe(true);
      expect(capabilities.supportsConcurrentConnections).toBe(false);
      expect(capabilities.maxConnectionPoolSize).toBe(1);
    });

    it('should throw error when initializing twice', async () => {
      const newDb = new SQLiteDatabase();
      await newDb.initialize({ database: ':memory:' });
      
      await expect(newDb.initialize({ database: ':memory:' })).rejects.toThrow(
        'Database already initialized'
      );
      
      await newDb.shutdown();
    });
  });

  describe('getStatus', () => {
    it('should return connected status after initialization', () => {
      const status = database.getStatus();
      expect(status.connected).toBe(true);
      expect(status.connectionCount).toBe(1);
      expect(status.pendingTransactions).toBe(0);
    });

    it('should return disconnected status after shutdown', async () => {
      await database.shutdown();
      const status = database.getStatus();
      expect(status.connected).toBe(false);
      expect(status.connectionCount).toBe(0);
    });
  });

  describe('validateConfig', () => {
    it('should validate correct config with database path', () => {
      expect(database.validateConfig({ database: './test.db' })).toBe(true);
    });

    it('should validate correct config with connection string', () => {
      expect(database.validateConfig({ connectionString: 'sqlite://test.db' })).toBe(true);
    });

    it('should reject invalid config', () => {
      expect(database.validateConfig({})).toBe(false);
      expect(database.validateConfig(null)).toBe(false);
      expect(database.validateConfig('string')).toBe(false);
    });
  });

  describe('table initialization', () => {
    it('should create transfers table', () => {
      const db = database.getDatabaseInstance();
      const tableInfo = db?.prepare("PRAGMA table_info('transfers')").all() as Array<{ name: string }>;
      
      expect(tableInfo).toBeDefined();
      expect(tableInfo.length).toBeGreaterThan(0);
      
      const columnNames = tableInfo.map((col) => col.name);
      expect(columnNames).toContain('id');
      expect(columnNames).toContain('type');
      expect(columnNames).toContain('status');
      expect(columnNames).toContain('sender_id');
      expect(columnNames).toContain('created_at');
      expect(columnNames).toContain('updated_at');
    });

    it('should create documents table', () => {
      const db = database.getDatabaseInstance();
      const tableInfo = db?.prepare("PRAGMA table_info('documents')").all() as Array<{ name: string }>;
      
      expect(tableInfo).toBeDefined();
      expect(tableInfo.length).toBeGreaterThan(0);
      
      const columnNames = tableInfo.map((col) => col.name);
      expect(columnNames).toContain('id');
      expect(columnNames).toContain('transfer_id');
      expect(columnNames).toContain('file_name');
      expect(columnNames).toContain('file_size');
      expect(columnNames).toContain('file_hash');
      expect(columnNames).toContain('status');
    });

    it('should create recipients table', () => {
      const db = database.getDatabaseInstance();
      const tableInfo = db?.prepare("PRAGMA table_info('recipients')").all() as Array<{ name: string }>;
      
      expect(tableInfo).toBeDefined();
      expect(tableInfo.length).toBeGreaterThan(0);
      
      const columnNames = tableInfo.map((col) => col.name);
      expect(columnNames).toContain('id');
      expect(columnNames).toContain('transfer_id');
      expect(columnNames).toContain('identifier');
      expect(columnNames).toContain('transport');
      expect(columnNames).toContain('status');
    });

    it('should create proper indices', () => {
      const db = database.getDatabaseInstance();
      const indices = db?.prepare(`
        SELECT name FROM sqlite_master 
        WHERE type = 'index' AND name LIKE 'idx_%'
      `).all() as Array<{ name: string }>;
      
      const indexNames = indices.map((idx) => idx.name);
      expect(indexNames).toContain('idx_transfers_type');
      expect(indexNames).toContain('idx_transfers_status');
      expect(indexNames).toContain('idx_transfers_created_at');
      expect(indexNames).toContain('idx_documents_transfer_id');
      expect(indexNames).toContain('idx_documents_status');
      expect(indexNames).toContain('idx_recipients_transfer_id');
      expect(indexNames).toContain('idx_recipients_status');
    });

    it('should enforce foreign key constraints', () => {
      const db = database.getDatabaseInstance();
      const pragma = db?.prepare('PRAGMA foreign_keys').get() as { foreign_keys: number };
      expect(pragma.foreign_keys).toBe(1);
    });
  });

  describe('getRepository', () => {
    it('should return repository for Transfer entity', () => {
      const repo = database.getRepository('Transfer');
      expect(repo).toBeDefined();
    });

    it('should return repository for Document entity', () => {
      const repo = database.getRepository('Document');
      expect(repo).toBeDefined();
    });

    it('should return repository for Recipient entity', () => {
      const repo = database.getRepository('Recipient');
      expect(repo).toBeDefined();
    });

    it('should throw error for unknown entity', () => {
      expect(() => database.getRepository('Unknown')).toThrow(
        "Repository for entity 'Unknown' not found"
      );
    });

    it('should throw error when database not initialized', async () => {
      const newDb = new SQLiteDatabase();
      expect(() => newDb.getRepository('Transfer')).toThrow(
        'Database not initialized'
      );
    });
  });

  describe('transaction', () => {
    it('should execute transaction successfully', async () => {
      const result = await database.transaction(async (tx) => {
        const transferRepo = tx.getRepository('Transfer');
        await transferRepo.create({
          id: 'test-tx',
          type: 'outgoing',
          status: 'pending',
          transportType: 'p2p'
        });
        return 'success';
      });
      
      expect(result).toBe('success');
      
      // Verify the transfer was created
      const transferRepo = database.getRepository('Transfer');
      const transfer = await transferRepo.findById('test-tx');
      expect(transfer).toBeDefined();
    });

    it('should rollback transaction on error', async () => {
      await expect(
        database.transaction(async (tx) => {
          const transferRepo = tx.getRepository('Transfer');
          await transferRepo.create({
            id: 'rollback-test',
            type: 'outgoing',
            status: 'pending',
            transportType: 'p2p'
          });
          throw new Error('Rollback test');
        })
      ).rejects.toThrow();
      
      // Verify the transfer was not created
      const transferRepo = database.getRepository('Transfer');
      const transfer = await transferRepo.findById('rollback-test');
      expect(transfer).toBeNull();
    });
  });
});