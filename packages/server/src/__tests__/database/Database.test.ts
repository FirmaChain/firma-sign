import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { DatabaseConnection } from '../../database/Database';
import { createTestDatabase, cleanupTestDatabase } from '../utils/testDb';

describe('DatabaseConnection', () => {
  let db: DatabaseConnection;

  beforeEach(() => {
    db = createTestDatabase();
  });

  afterEach(() => {
    cleanupTestDatabase(db);
  });

  describe('getInstance', () => {
    it('should return the same instance when called multiple times', () => {
      const db1 = DatabaseConnection.getInstance();
      const db2 = DatabaseConnection.getInstance();
      expect(db1).toBe(db2);
    });

    it('should throw error when no path provided on first call', () => {
      cleanupTestDatabase(db);
      expect(() => DatabaseConnection.getInstance()).toThrow(
        'Database path required for first initialization'
      );
    });
  });

  describe('getDatabase', () => {
    it('should return a valid database instance', () => {
      const database = db.getDatabase();
      expect(database).toBeDefined();
      expect(database.name).toContain('.db');
    });
  });

  describe('table initialization', () => {
    it('should create transfers table', () => {
      const database = db.getDatabase();
      const tableInfo = database.prepare("PRAGMA table_info('transfers')").all() as Array<{ name: string }>;
      
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
      const database = db.getDatabase();
      const tableInfo = database.prepare("PRAGMA table_info('documents')").all() as Array<{ name: string }>;
      
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
      const database = db.getDatabase();
      const tableInfo = database.prepare("PRAGMA table_info('recipients')").all() as Array<{ name: string }>;
      
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
      const database = db.getDatabase();
      const indices = database.prepare(`
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
      const database = db.getDatabase();
      
      expect(() => {
        database.prepare(`
          INSERT INTO documents (id, transfer_id, file_name, file_size, file_hash)
          VALUES ('doc-1', 'non-existent-transfer', 'test.pdf', 1024, 'hash')
        `).run();
      }).toThrow();
    });

    it('should set proper pragmas', () => {
      const database = db.getDatabase();
      
      const journalMode = database.prepare('PRAGMA journal_mode').get() as { journal_mode: string };
      expect(journalMode.journal_mode).toBe('wal');
      
      const foreignKeys = database.prepare('PRAGMA foreign_keys').get() as { foreign_keys: number };
      expect(foreignKeys.foreign_keys).toBe(1);
    });
  });

  describe('transaction support', () => {
    it('should support transactions', () => {
      const database = db.getDatabase();
      
      const insertTransfer = database.prepare(`
        INSERT INTO transfers (
          id, type, status, transport_type, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?)
      `);
      
      const insertDocument = database.prepare(`
        INSERT INTO documents (
          id, transfer_id, file_name, file_size, file_hash
        ) VALUES (?, ?, ?, ?, ?)
      `);
      
      let transferCreated = false;
      let documentCreated = false;
      
      try {
        database.transaction(() => {
          insertTransfer.run(
            'transfer-1', 'outgoing', 'pending', 'p2p',
            Math.floor(Date.now() / 1000), Math.floor(Date.now() / 1000)
          );
          transferCreated = true;
          
          insertDocument.run(
            'doc-1', 'transfer-1', 'test.pdf', 1024, 'hash'
          );
          documentCreated = true;
        })();
      } catch {
        // Expected error for testing
      }
      
      expect(transferCreated).toBe(true);
      expect(documentCreated).toBe(true);
      
      const transfer = database.prepare('SELECT * FROM transfers WHERE id = ?').get('transfer-1');
      expect(transfer).toBeDefined();
      
      const document = database.prepare('SELECT * FROM documents WHERE id = ?').get('doc-1');
      expect(document).toBeDefined();
    });

    it('should rollback transaction on error', () => {
      const database = db.getDatabase();
      
      const insertTransfer = database.prepare(`
        INSERT INTO transfers (
          id, type, status, transport_type, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?)
      `);
      
      const insertDocument = database.prepare(`
        INSERT INTO documents (
          id, transfer_id, file_name, file_size, file_hash
        ) VALUES (?, ?, ?, ?, ?)
      `);
      
      expect(() => {
        database.transaction(() => {
          insertTransfer.run(
            'transfer-2', 'outgoing', 'pending', 'p2p',
            Math.floor(Date.now() / 1000), Math.floor(Date.now() / 1000)
          );
          
          insertDocument.run(
            'doc-2', 'non-existent-transfer', 'test.pdf', 1024, 'hash'
          );
        })();
      }).toThrow();
      
      const transfer = database.prepare('SELECT * FROM transfers WHERE id = ?').get('transfer-2');
      expect(transfer).toBeUndefined();
    });
  });

  describe('close', () => {
    it('should close the database connection', () => {
      const database = db.getDatabase();
      expect(database.open).toBe(true);
      
      db.close();
      expect(database.open).toBe(false);
    });
  });
});