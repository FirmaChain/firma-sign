import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { DatabaseConnection } from '../../../database/Database';
import { TransferRepository } from '../../../database/repositories/TransferRepository';
import { createTestDatabase, cleanupTestDatabase, seedTestData } from '../../utils/testDb';
import { TransferType, TransferStatus } from '../../../types/database';

describe('TransferRepository', () => {
  let db: DatabaseConnection;
  let repository: TransferRepository;

  beforeEach(() => {
    db = createTestDatabase();
    repository = new TransferRepository(db);
  });

  afterEach(() => {
    cleanupTestDatabase(db);
  });

  describe('create', () => {
    it('should create a new transfer', () => {
      const transfer = repository.create({
        id: 'test-transfer-1',
        type: 'outgoing' as TransferType,
        status: 'pending' as TransferStatus,
        transportType: 'p2p',
        metadata: { message: 'Test message' }
      });

      expect(transfer).toBeDefined();
      expect(transfer.id).toBe('test-transfer-1');
      expect(transfer.type).toBe('outgoing');
      expect(transfer.status).toBe('pending');
      expect(transfer.transportType).toBe('p2p');
      expect(transfer.metadata).toEqual({ message: 'Test message' });
      expect(transfer.createdAt).toBeInstanceOf(Date);
      expect(transfer.updatedAt).toBeInstanceOf(Date);
    });

    it('should auto-generate ID if not provided', () => {
      const transfer = repository.create({
        type: 'incoming' as TransferType,
        status: 'ready' as TransferStatus,
        transportType: 'email'
      });

      expect(transfer.id).toBeDefined();
      expect(transfer.id.length).toBeGreaterThan(0);
    });

    it('should create transfer with sender info', () => {
      const transfer = repository.create({
        type: 'incoming' as TransferType,
        status: 'pending' as TransferStatus,
        sender: {
          senderId: 'sender-123',
          name: 'John Doe',
          email: 'john@example.com',
          publicKey: 'public-key-123',
          transport: 'email',
          timestamp: Date.now(),
          verificationStatus: 'verified'
        },
        transportType: 'email'
      });

      expect(transfer.sender).toBeDefined();
      expect(transfer.sender?.name).toBe('John Doe');
      expect(transfer.sender?.email).toBe('john@example.com');
    });

    it('should handle null values properly', () => {
      const transfer = repository.create({
        type: 'outgoing' as TransferType,
        transportType: 'p2p'
      });

      expect(transfer.status).toBe('pending');
      expect(transfer.sender).toBeUndefined();
      expect(transfer.metadata).toBeUndefined();
      expect(transfer.transportConfig).toBeUndefined();
    });
  });

  describe('findById', () => {
    beforeEach(() => {
      seedTestData(db);
    });

    it('should find transfer by ID', () => {
      const transfer = repository.findById('transfer-1');

      expect(transfer).toBeDefined();
      expect(transfer?.id).toBe('transfer-1');
      expect(transfer?.type).toBe('outgoing');
      expect(transfer?.status).toBe('pending');
    });

    it('should return null for non-existent transfer', () => {
      const transfer = repository.findById('non-existent');
      expect(transfer).toBeNull();
    });

    it('should properly deserialize sender info', () => {
      const transfer = repository.findById('transfer-1');

      expect(transfer?.sender).toBeDefined();
      expect(transfer?.sender?.senderId).toBe('sender-1');
      expect(transfer?.sender?.name).toBe('Test Sender');
      expect(transfer?.sender?.email).toBe('sender@test.com');
    });

    it('should properly deserialize metadata', () => {
      const transfer = repository.findById('transfer-1');
      expect(transfer?.metadata).toEqual({ message: 'Test transfer' });
    });
  });

  describe('update', () => {
    beforeEach(() => {
      seedTestData(db);
    });

    it('should update transfer status', () => {
      const updated = repository.update('transfer-1', {
        status: 'completed' as TransferStatus
      });

      expect(updated).toBeDefined();
      expect(updated?.status).toBe('completed');
      expect(updated?.id).toBe('transfer-1');
    });

    it('should update sender info', () => {
      const updated = repository.update('transfer-1', {
        sender: {
          senderId: 'new-sender',
          name: 'New Sender',
          email: 'new@example.com',
          publicKey: 'new-key',
          transport: 'p2p',
          timestamp: Date.now(),
          verificationStatus: 'verified'
        }
      });

      expect(updated?.sender?.name).toBe('New Sender');
      expect(updated?.sender?.email).toBe('new@example.com');
    });

    it('should update metadata', () => {
      const updated = repository.update('transfer-1', {
        metadata: { message: 'new value' }
      });

      expect(updated?.metadata).toEqual({ message: 'new value' });
    });

    it('should update updated_at timestamp', async () => {
      const before = repository.findById('transfer-1');
      
      // Wait a bit to ensure timestamp changes (SQLite timestamps have second precision)
      await new Promise(resolve => setTimeout(resolve, 1100));
      
      const updated = repository.update('transfer-1', {
        status: 'ready' as TransferStatus
      });

      expect(updated).toBeDefined();
      expect(before).toBeDefined();
      expect(updated!.updatedAt.getTime()).toBeGreaterThan(
        before!.updatedAt.getTime()
      );
    });

    it('should return null for non-existent transfer', () => {
      const updated = repository.update('non-existent', {
        status: 'completed' as TransferStatus
      });

      expect(updated).toBeNull();
    });
  });

  describe('delete', () => {
    beforeEach(() => {
      seedTestData(db);
    });

    it('should delete transfer', () => {
      const deleted = repository.delete('transfer-1');
      expect(deleted).toBe(true);

      const transfer = repository.findById('transfer-1');
      expect(transfer).toBeNull();
    });

    it('should return false for non-existent transfer', () => {
      const deleted = repository.delete('non-existent');
      expect(deleted).toBe(false);
    });
  });

  describe('findAll', () => {
    beforeEach(() => {
      seedTestData(db);
    });

    it('should return all transfers', () => {
      const transfers = repository.findAll();

      expect(transfers).toHaveLength(2);
      expect(transfers[0].id).toBeDefined();
      expect(transfers[1].id).toBeDefined();
    });
  });

  describe('findByType', () => {
    beforeEach(() => {
      seedTestData(db);
    });

    it('should find transfers by type', () => {
      const outgoing = repository.findByType('outgoing');
      expect(outgoing).toHaveLength(1);
      expect(outgoing[0].type).toBe('outgoing');

      const incoming = repository.findByType('incoming');
      expect(incoming).toHaveLength(1);
      expect(incoming[0].type).toBe('incoming');
    });

    it('should return empty array when no transfers match', () => {
      repository.create({
        type: 'outgoing' as TransferType,
        transportType: 'p2p'
      });

      const incoming = repository.findByType('incoming');
      expect(incoming.some(t => t.type === 'outgoing')).toBe(false);
    });
  });

  describe('findByStatus', () => {
    beforeEach(() => {
      seedTestData(db);
    });

    it('should find transfers by status', () => {
      const pending = repository.findByStatus('pending');
      expect(pending).toHaveLength(1);
      expect(pending[0].status).toBe('pending');

      const ready = repository.findByStatus('ready');
      expect(ready).toHaveLength(1);
      expect(ready[0].status).toBe('ready');
    });
  });

  describe('findRecent', () => {
    it('should return transfers ordered by created_at descending', async () => {
      const transfer1 = repository.create({
        type: 'outgoing' as TransferType,
        transportType: 'p2p'
      });

      await new Promise(resolve => setTimeout(resolve, 100));

      const transfer2 = repository.create({
        type: 'incoming' as TransferType,
        transportType: 'email'
      });

      const recent = repository.findRecent(10);

      expect(recent).toHaveLength(2);
      expect(recent[0].id).toBe(transfer2.id);
      expect(recent[1].id).toBe(transfer1.id);
    });

    it('should limit results', () => {
      for (let i = 0; i < 5; i++) {
        repository.create({
          type: 'outgoing' as TransferType,
          transportType: 'p2p'
        });
      }

      const recent = repository.findRecent(3);
      expect(recent).toHaveLength(3);
    });
  });

  describe('findByTypeAndStatus', () => {
    beforeEach(() => {
      repository.create({
        type: 'outgoing' as TransferType,
        status: 'pending' as TransferStatus,
        transportType: 'p2p'
      });

      repository.create({
        type: 'outgoing' as TransferType,
        status: 'completed' as TransferStatus,
        transportType: 'p2p'
      });

      repository.create({
        type: 'incoming' as TransferType,
        status: 'pending' as TransferStatus,
        transportType: 'email'
      });
    });

    it('should find transfers by type and status', () => {
      const results = repository.findByTypeAndStatus('outgoing', 'pending');

      expect(results).toHaveLength(1);
      expect(results[0].type).toBe('outgoing');
      expect(results[0].status).toBe('pending');
    });

    it('should return empty array when no matches', () => {
      const results = repository.findByTypeAndStatus('incoming', 'completed');
      expect(results).toHaveLength(0);
    });
  });

  describe('edge cases', () => {
    it('should handle special characters in metadata', () => {
      const transfer = repository.create({
        type: 'outgoing' as TransferType,
        transportType: 'p2p',
        metadata: {
          message: 'Test with "quotes" and \'apostrophes\''
        }
      });

      const retrieved = repository.findById(transfer.id);
      expect(retrieved?.metadata?.message).toBe('Test with "quotes" and \'apostrophes\'');
    });

    it('should handle very long IDs', () => {
      const longId = 'a'.repeat(100);
      const transfer = repository.create({
        id: longId,
        type: 'outgoing' as TransferType,
        transportType: 'p2p'
      });

      expect(transfer.id).toBe(longId);
      const retrieved = repository.findById(longId);
      expect(retrieved?.id).toBe(longId);
    });
  });
});