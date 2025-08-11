import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { SQLiteDatabase } from '../../SQLiteDatabase';
import { TransferRepository } from '../../repositories/TransferRepository';
import { TransferEntity } from '@firmachain/firma-sign-core';
import { createTestDatabase, cleanupTestDatabase, seedTestData } from '../utils/testDb';

describe('TransferRepository', () => {
  let database: SQLiteDatabase;
  let repository: TransferRepository;

  beforeEach(async () => {
    database = await createTestDatabase();
    const db = database.getDatabaseInstance()!;
    repository = new TransferRepository(db);
  });

  afterEach(async () => {
    await cleanupTestDatabase(database);
  });

  describe('create', () => {
    it('should create a new transfer', async () => {
      const transfer = await repository.create({
        id: 'test-transfer-1',
        type: 'outgoing',
        status: 'pending',
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

    it('should auto-generate ID if not provided', async () => {
      const transfer = await repository.create({
        type: 'incoming',
        status: 'ready',
        transportType: 'email'
      });

      expect(transfer.id).toBeDefined();
      expect(transfer.id.length).toBeGreaterThan(0);
    });

    it('should create transfer with sender info', async () => {
      const transfer = await repository.create({
        type: 'incoming',
        status: 'pending',
        senderId: 'sender-123',
        senderName: 'John Doe',
        senderEmail: 'john@example.com',
        senderPublicKey: 'public-key-123',
        transportType: 'email'
      });

      expect(transfer.senderId).toBe('sender-123');
      expect(transfer.senderName).toBe('John Doe');
      expect(transfer.senderEmail).toBe('john@example.com');
    });

    it('should handle undefined values properly', async () => {
      const transfer = await repository.create({
        type: 'outgoing',
        transportType: 'p2p'
      });

      expect(transfer.status).toBeDefined(); // Will have default value
      expect(transfer.senderId).toBeUndefined();
      expect(transfer.metadata).toBeUndefined();
      expect(transfer.transportConfig).toBeUndefined();
    });
  });

  describe('findById', () => {
    beforeEach(async () => {
      await seedTestData(database);
    });

    it('should find transfer by ID', async () => {
      const transfer = await repository.findById('transfer-1');

      expect(transfer).toBeDefined();
      expect(transfer?.id).toBe('transfer-1');
      expect(transfer?.type).toBe('outgoing');
      expect(transfer?.status).toBe('pending');
    });

    it('should return null for non-existent transfer', async () => {
      const transfer = await repository.findById('non-existent');
      expect(transfer).toBeNull();
    });

    it('should properly deserialize sender info', async () => {
      const transfer = await repository.findById('transfer-1');

      expect(transfer?.senderId).toBe('sender-1');
      expect(transfer?.senderName).toBe('Test Sender');
      expect(transfer?.senderEmail).toBe('sender@test.com');
    });

    it('should properly deserialize metadata', async () => {
      const transfer = await repository.findById('transfer-1');
      expect(transfer?.metadata).toEqual({ message: 'Test transfer' });
    });
  });

  describe('update', () => {
    beforeEach(async () => {
      await seedTestData(database);
    });

    it('should update transfer status', async () => {
      const updated = await repository.update('transfer-1', {
        status: 'completed'
      });

      expect(updated).toBeDefined();
      expect(updated?.status).toBe('completed');
      expect(updated?.id).toBe('transfer-1');
    });

    it('should update sender info', async () => {
      const updated = await repository.update('transfer-1', {
        senderName: 'New Sender',
        senderEmail: 'new@example.com'
      });

      expect(updated?.senderName).toBe('New Sender');
      expect(updated?.senderEmail).toBe('new@example.com');
    });

    it('should return null when updating non-existent transfer', async () => {
      const updated = await repository.update('non-existent', {
        status: 'completed'
      });

      expect(updated).toBeNull();
    });

    it('should update updatedAt timestamp', async () => {
      const original = await repository.findById('transfer-1');
      const originalUpdatedAt = original?.updatedAt;

      // Wait at least 1 second to ensure timestamp difference
      // (SQLite stores timestamps as Unix seconds, not milliseconds)
      await new Promise(resolve => setTimeout(resolve, 1100));

      const updated = await repository.update('transfer-1', {
        status: 'completed'
      });

      expect(updated?.updatedAt).toBeInstanceOf(Date);
      expect(updated?.updatedAt.getTime()).toBeGreaterThan(
        originalUpdatedAt?.getTime() || 0
      );
    });
  });

  describe('delete', () => {
    beforeEach(async () => {
      await seedTestData(database);
    });

    it('should delete transfer by ID', async () => {
      const deleted = await repository.delete('transfer-1');
      expect(deleted).toBe(true);

      const transfer = await repository.findById('transfer-1');
      expect(transfer).toBeNull();
    });

    it('should return false when deleting non-existent transfer', async () => {
      const deleted = await repository.delete('non-existent');
      expect(deleted).toBe(false);
    });
  });

  describe('findByType', () => {
    beforeEach(async () => {
      await seedTestData(database);
    });

    it('should find all outgoing transfers', async () => {
      const transfers = await repository.findByType('outgoing');
      
      expect(transfers).toBeDefined();
      expect(transfers.length).toBeGreaterThan(0);
      expect(transfers.every(t => t.type === 'outgoing')).toBe(true);
    });

    it('should find all incoming transfers', async () => {
      const transfers = await repository.findByType('incoming');
      
      expect(transfers).toBeDefined();
      expect(transfers.length).toBeGreaterThan(0);
      expect(transfers.every(t => t.type === 'incoming')).toBe(true);
    });
  });

  describe('findByStatus', () => {
    beforeEach(async () => {
      await seedTestData(database);
    });

    it('should find transfers by status', async () => {
      const transfers = await repository.findByStatus('pending');
      
      expect(transfers).toBeDefined();
      expect(transfers.length).toBeGreaterThan(0);
      expect(transfers.every(t => t.status === 'pending')).toBe(true);
    });
  });

  describe('findRecent', () => {
    beforeEach(async () => {
      await seedTestData(database);
    });

    it('should find recent transfers ordered by creation date', async () => {
      const transfers = await repository.findRecent(10);
      
      expect(transfers).toBeDefined();
      expect(transfers.length).toBeGreaterThan(0);
      
      // Check that transfers are ordered by creation date (descending)
      for (let i = 1; i < transfers.length; i++) {
        expect(transfers[i - 1].createdAt.getTime()).toBeGreaterThanOrEqual(
          transfers[i].createdAt.getTime()
        );
      }
    });

    it('should limit the number of results', async () => {
      const transfers = await repository.findRecent(1);
      expect(transfers.length).toBe(1);
    });
  });

  describe('updateStatus', () => {
    beforeEach(async () => {
      await seedTestData(database);
    });

    it('should update transfer status and updatedAt', async () => {
      const updated = await repository.updateStatus('transfer-1', 'completed');
      
      expect(updated).toBeDefined();
      expect(updated?.status).toBe('completed');
      expect(updated?.updatedAt).toBeInstanceOf(Date);
    });
  });
});