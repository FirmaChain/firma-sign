import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { SQLiteDatabase } from '../../SQLiteDatabase';
import { RecipientRepository } from '../../repositories/RecipientRepository';
import { RecipientEntity, TransferEntity } from '@firmachain/firma-sign-core';
import { createTestDatabase, cleanupTestDatabase, seedTestData } from '../utils/testDb';

describe('RecipientRepository', () => {
  let database: SQLiteDatabase;
  let repository: RecipientRepository;

  beforeEach(async () => {
    database = await createTestDatabase();
    const db = database.getDatabaseInstance()!;
    repository = new RecipientRepository(db);
  });

  afterEach(async () => {
    await cleanupTestDatabase(database);
  });

  describe('create', () => {
    beforeEach(async () => {
      // Create a transfer first for foreign key constraint
      const transferRepo = database.getRepository<TransferEntity>('Transfer');
      await transferRepo.create({
        id: 'test-transfer',
        type: 'outgoing',
        status: 'pending',
        transportType: 'p2p'
      });
    });

    it('should create a new recipient', async () => {
      const recipient = await repository.create({
        id: 'test-recipient-1',
        transferId: 'test-transfer',
        identifier: 'user@example.com',
        transport: 'email',
        status: 'pending',
        preferences: { notificationEnabled: true }
      });

      expect(recipient).toBeDefined();
      expect(recipient.id).toBe('test-recipient-1');
      expect(recipient.transferId).toBe('test-transfer');
      expect(recipient.identifier).toBe('user@example.com');
      expect(recipient.transport).toBe('email');
      expect(recipient.status).toBe('pending');
      expect(recipient.preferences).toEqual({ notificationEnabled: true });
      expect(recipient.createdAt).toBeInstanceOf(Date);
    });

    it('should auto-generate ID if not provided', async () => {
      const recipient = await repository.create({
        transferId: 'test-transfer',
        identifier: 'user@example.com',
        transport: 'p2p',
        status: 'pending'
      });

      expect(recipient.id).toBeDefined();
      expect(recipient.id.length).toBeGreaterThan(0);
    });
  });

  describe('findByTransferId', () => {
    beforeEach(async () => {
      await seedTestData(database);
    });

    it('should find all recipients for a transfer', async () => {
      const recipients = await repository.findByTransferId('transfer-1');
      
      expect(recipients).toBeDefined();
      expect(recipients.length).toBe(2);
      expect(recipients.every(r => r.transferId === 'transfer-1')).toBe(true);
    });

    it('should return empty array for non-existent transfer', async () => {
      const recipients = await repository.findByTransferId('non-existent');
      expect(recipients).toEqual([]);
    });
  });

  describe('findByStatus', () => {
    beforeEach(async () => {
      await seedTestData(database);
    });

    it('should find recipients by status', async () => {
      const recipients = await repository.findByStatus('notified');
      
      expect(recipients).toBeDefined();
      expect(recipients.length).toBeGreaterThan(0);
      expect(recipients.every(r => r.status === 'notified')).toBe(true);
    });

    it('should find signed recipients', async () => {
      const recipients = await repository.findByStatus('signed');
      
      expect(recipients).toBeDefined();
      expect(recipients.length).toBeGreaterThan(0);
      expect(recipients.every(r => r.status === 'signed')).toBe(true);
    });
  });

  describe('markAsNotified', () => {
    beforeEach(async () => {
      await seedTestData(database);
    });

    it('should mark recipient as notified', async () => {
      // Create a pending recipient first
      const transferRepo = database.getRepository<TransferEntity>('Transfer');
      await transferRepo.create({
        id: 'test-transfer-2',
        type: 'outgoing',
        status: 'pending',
        transportType: 'p2p'
      });
      
      const newRecipient = await repository.create({
        id: 'pending-recipient',
        transferId: 'test-transfer-2',
        identifier: 'pending@example.com',
        transport: 'email',
        status: 'pending'
      });

      const updated = await repository.markAsNotified('pending-recipient');
      
      expect(updated).toBeDefined();
      expect(updated?.status).toBe('notified');
      expect(updated?.notifiedAt).toBeInstanceOf(Date);
    });

    it('should return null for non-existent recipient', async () => {
      const updated = await repository.markAsNotified('non-existent');
      expect(updated).toBeNull();
    });
  });

  describe('markAsViewed', () => {
    beforeEach(async () => {
      await seedTestData(database);
    });

    it('should mark recipient as viewed', async () => {
      const updated = await repository.markAsViewed('recipient-1');
      
      expect(updated).toBeDefined();
      expect(updated?.status).toBe('viewed');
      expect(updated?.viewedAt).toBeInstanceOf(Date);
    });
  });

  describe('markAsSigned', () => {
    beforeEach(async () => {
      await seedTestData(database);
    });

    it('should mark recipient as signed', async () => {
      const updated = await repository.markAsSigned('recipient-1');
      
      expect(updated).toBeDefined();
      expect(updated?.status).toBe('signed');
      expect(updated?.signedAt).toBeInstanceOf(Date);
    });
  });

  describe('updateStatus', () => {
    beforeEach(async () => {
      await seedTestData(database);
    });

    it('should update recipient status', async () => {
      const updated = await repository.updateStatus('recipient-1', 'rejected');
      
      expect(updated).toBeDefined();
      expect(updated?.status).toBe('rejected');
    });
  });

  describe('update', () => {
    beforeEach(async () => {
      await seedTestData(database);
    });

    it('should update recipient fields', async () => {
      const updated = await repository.update('recipient-1', {
        identifier: 'newemail@example.com',
        preferences: { notificationEnabled: false }
      });

      expect(updated).toBeDefined();
      expect(updated?.identifier).toBe('newemail@example.com');
      expect(updated?.preferences).toEqual({ notificationEnabled: false });
    });
  });

  describe('delete', () => {
    beforeEach(async () => {
      await seedTestData(database);
    });

    it('should delete recipient by ID', async () => {
      const deleted = await repository.delete('recipient-1');
      expect(deleted).toBe(true);

      const recipient = await repository.findById('recipient-1');
      expect(recipient).toBeNull();
    });

    it('should return false when deleting non-existent recipient', async () => {
      const deleted = await repository.delete('non-existent');
      expect(deleted).toBe(false);
    });
  });
});