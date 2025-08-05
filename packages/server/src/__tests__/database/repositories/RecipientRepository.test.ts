import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { DatabaseConnection } from '../../../database/Database';
import { RecipientRepository } from '../../../database/repositories/RecipientRepository';
import { TransferRepository } from '../../../database/repositories/TransferRepository';
import { createTestDatabase, cleanupTestDatabase, seedTestData } from '../../utils/testDb';
import { RecipientStatus, TransferType, TransferStatus } from '../../../types/database';

describe('RecipientRepository', () => {
  let db: DatabaseConnection;
  let repository: RecipientRepository;
  let transferRepository: TransferRepository;
  let testTransferId: string;

  beforeEach(() => {
    db = createTestDatabase();
    repository = new RecipientRepository(db);
    transferRepository = new TransferRepository(db);

    const transfer = transferRepository.create({
      type: 'outgoing' as TransferType,
      status: 'pending' as TransferStatus,
      transportType: 'p2p'
    });
    testTransferId = transfer.id;
  });

  afterEach(() => {
    cleanupTestDatabase(db);
  });

  describe('create', () => {
    it('should create a new recipient', () => {
      const recipient = repository.create({
        id: 'recipient-test-1',
        transferId: testTransferId,
        identifier: 'user@example.com',
        transport: 'email',
        status: 'pending' as RecipientStatus
      });

      expect(recipient).toBeDefined();
      expect(recipient.id).toBe('recipient-test-1');
      expect(recipient.transferId).toBe(testTransferId);
      expect(recipient.identifier).toBe('user@example.com');
      expect(recipient.transport).toBe('email');
      expect(recipient.status).toBe('pending');
      expect(recipient.createdAt).toBeInstanceOf(Date);
    });

    it('should auto-generate ID if not provided', () => {
      const recipient = repository.create({
        transferId: testTransferId,
        identifier: 'auto@example.com',
        transport: 'p2p'
      });

      expect(recipient.id).toBeDefined();
      expect(recipient.id.length).toBeGreaterThan(0);
    });

    it('should handle preferences', () => {
      const preferences = {
        notificationEnabled: true,
        fallbackTransport: 'email',
        customSetting: 'value'
      };

      const recipient = repository.create({
        transferId: testTransferId,
        identifier: 'prefs@example.com',
        transport: 'p2p',
        preferences
      });

      expect(recipient.preferences).toEqual(preferences);
    });

    it('should handle recipient with timestamps', () => {
      const now = new Date();
      const recipient = repository.create({
        transferId: testTransferId,
        identifier: 'timed@example.com',
        transport: 'email',
        status: 'signed' as RecipientStatus,
        notifiedAt: now,
        viewedAt: now,
        signedAt: now
      });

      expect(recipient.notifiedAt).toBeDefined();
      expect(recipient.viewedAt).toBeDefined();
      expect(recipient.signedAt).toBeDefined();
    });

    it('should enforce foreign key constraint', () => {
      expect(() => {
        repository.create({
          transferId: 'non-existent-transfer',
          identifier: 'fail@example.com',
          transport: 'email'
        });
      }).toThrow();
    });
  });

  describe('findById', () => {
    beforeEach(() => {
      seedTestData(db);
    });

    it('should find recipient by ID', () => {
      const recipient = repository.findById('recipient-1');

      expect(recipient).toBeDefined();
      expect(recipient?.id).toBe('recipient-1');
      expect(recipient?.identifier).toBe('user1@example.com');
      expect(recipient?.transport).toBe('email');
      expect(recipient?.status).toBe('notified');
    });

    it('should return null for non-existent recipient', () => {
      const recipient = repository.findById('non-existent');
      expect(recipient).toBeNull();
    });

    it('should properly deserialize preferences', () => {
      const recipient = repository.findById('recipient-1');
      expect(recipient?.preferences).toEqual({ notificationEnabled: true });
    });

    it('should handle signed recipient data', () => {
      const recipient = repository.findById('recipient-2');

      expect(recipient?.status).toBe('signed');
      expect(recipient?.notifiedAt).toBeInstanceOf(Date);
      expect(recipient?.viewedAt).toBeInstanceOf(Date);
      expect(recipient?.signedAt).toBeInstanceOf(Date);
    });
  });

  describe('update', () => {
    let recipientId: string;

    beforeEach(() => {
      const recipient = repository.create({
        transferId: testTransferId,
        identifier: 'update@example.com',
        transport: 'email',
        status: 'pending' as RecipientStatus
      });
      recipientId = recipient.id;
    });

    it('should update recipient status', () => {
      const updated = repository.update(recipientId, {
        status: 'notified' as RecipientStatus
      });

      expect(updated).toBeDefined();
      expect(updated?.status).toBe('notified');
      expect(updated?.id).toBe(recipientId);
    });

    it('should update preferences', () => {
      const newPreferences = {
        notificationEnabled: false,
        theme: 'dark'
      };

      const updated = repository.update(recipientId, {
        preferences: newPreferences
      });

      expect(updated?.preferences).toEqual(newPreferences);
    });

    it('should update timestamps', () => {
      const now = new Date();
      const updated = repository.update(recipientId, {
        notifiedAt: now,
        viewedAt: now,
        signedAt: now
      });

      expect(updated?.notifiedAt).toBeDefined();
      expect(updated?.viewedAt).toBeDefined();
      expect(updated?.signedAt).toBeDefined();
    });

    it('should return null for non-existent recipient', () => {
      const updated = repository.update('non-existent', {
        status: 'notified' as RecipientStatus
      });

      expect(updated).toBeNull();
    });

    it('should not update if no changes provided', () => {
      const before = repository.findById(recipientId);
      const updated = repository.update(recipientId, {});

      expect(updated).toEqual(before);
    });
  });

  describe('delete', () => {
    let recipientId: string;

    beforeEach(() => {
      const recipient = repository.create({
        transferId: testTransferId,
        identifier: 'delete@example.com',
        transport: 'email'
      });
      recipientId = recipient.id;
    });

    it('should delete recipient', () => {
      const deleted = repository.delete(recipientId);
      expect(deleted).toBe(true);

      const recipient = repository.findById(recipientId);
      expect(recipient).toBeNull();
    });

    it('should return false for non-existent recipient', () => {
      const deleted = repository.delete('non-existent');
      expect(deleted).toBe(false);
    });
  });

  describe('findByTransferId', () => {
    beforeEach(() => {
      seedTestData(db);
    });

    it('should find all recipients for a transfer', () => {
      const recipients = repository.findByTransferId('transfer-1');

      expect(recipients).toHaveLength(2);
      expect(recipients.every(r => r.transferId === 'transfer-1')).toBe(true);
    });

    it('should return empty array for non-existent transfer', () => {
      const recipients = repository.findByTransferId('non-existent');
      expect(recipients).toHaveLength(0);
    });
  });

  describe('findByIdentifier', () => {
    beforeEach(() => {
      repository.create({
        transferId: testTransferId,
        identifier: 'duplicate@example.com',
        transport: 'email'
      });

      const transfer2 = transferRepository.create({
        type: 'incoming' as TransferType,
        transportType: 'email'
      });

      repository.create({
        transferId: transfer2.id,
        identifier: 'duplicate@example.com',
        transport: 'p2p'
      });
    });

    it('should find all recipients with same identifier', () => {
      const recipients = repository.findByIdentifier('duplicate@example.com');

      expect(recipients).toHaveLength(2);
      expect(recipients.every(r => r.identifier === 'duplicate@example.com')).toBe(true);
      expect(new Set(recipients.map(r => r.transferId)).size).toBe(2);
    });

    it('should return empty array for non-existent identifier', () => {
      const recipients = repository.findByIdentifier('nobody@example.com');
      expect(recipients).toHaveLength(0);
    });
  });

  describe('findByTransferIdAndStatus', () => {
    beforeEach(() => {
      repository.create({
        transferId: testTransferId,
        identifier: 'pending1@example.com',
        transport: 'email',
        status: 'pending' as RecipientStatus
      });

      repository.create({
        transferId: testTransferId,
        identifier: 'pending2@example.com',
        transport: 'email',
        status: 'pending' as RecipientStatus
      });

      repository.create({
        transferId: testTransferId,
        identifier: 'notified@example.com',
        transport: 'email',
        status: 'notified' as RecipientStatus
      });
    });

    it('should find recipients by transfer ID and status', () => {
      const pending = repository.findByTransferIdAndStatus(testTransferId, 'pending');
      expect(pending).toHaveLength(2);
      expect(pending.every(r => r.status === 'pending')).toBe(true);

      const notified = repository.findByTransferIdAndStatus(testTransferId, 'notified');
      expect(notified).toHaveLength(1);
      expect(notified[0].status).toBe('notified');
    });
  });

  describe('findPendingByTransport', () => {
    beforeEach(() => {
      repository.create({
        transferId: testTransferId,
        identifier: 'email1@example.com',
        transport: 'email',
        status: 'pending' as RecipientStatus
      });

      repository.create({
        transferId: testTransferId,
        identifier: 'email2@example.com',
        transport: 'email',
        status: 'pending' as RecipientStatus
      });

      repository.create({
        transferId: testTransferId,
        identifier: 'p2p@example.com',
        transport: 'p2p',
        status: 'pending' as RecipientStatus
      });

      repository.create({
        transferId: testTransferId,
        identifier: 'notified@example.com',
        transport: 'email',
        status: 'notified' as RecipientStatus
      });
    });

    it('should find pending recipients by transport', () => {
      const emailPending = repository.findPendingByTransport('email');
      expect(emailPending).toHaveLength(2);
      expect(emailPending.every(r => r.transport === 'email' && r.status === 'pending')).toBe(true);

      const p2pPending = repository.findPendingByTransport('p2p');
      expect(p2pPending).toHaveLength(1);
      expect(p2pPending[0].transport).toBe('p2p');
    });

    it('should order by creation date', () => {
      const pending = repository.findPendingByTransport('email');
      for (let i = 1; i < pending.length; i++) {
        expect(pending[i].createdAt.getTime()).toBeGreaterThanOrEqual(
          pending[i - 1].createdAt.getTime()
        );
      }
    });
  });

  describe('updateStatus', () => {
    let recipientId: string;

    beforeEach(() => {
      const recipient = repository.create({
        transferId: testTransferId,
        identifier: 'status@example.com',
        transport: 'email'
      });
      recipientId = recipient.id;
    });

    it('should update recipient status', () => {
      const updated = repository.updateStatus(recipientId, 'viewed');
      expect(updated).toBe(true);

      const recipient = repository.findById(recipientId);
      expect(recipient?.status).toBe('viewed');
    });

    it('should return false for non-existent recipient', () => {
      const updated = repository.updateStatus('non-existent', 'viewed');
      expect(updated).toBe(false);
    });
  });

  describe('markAsNotified', () => {
    let recipientId: string;

    beforeEach(() => {
      const recipient = repository.create({
        transferId: testTransferId,
        identifier: 'notify@example.com',
        transport: 'email'
      });
      recipientId = recipient.id;
    });

    it('should mark recipient as notified with timestamp', () => {
      const marked = repository.markAsNotified(recipientId);
      expect(marked).toBe(true);

      const recipient = repository.findById(recipientId);
      expect(recipient?.status).toBe('notified');
      expect(recipient?.notifiedAt).toBeInstanceOf(Date);
    });
  });

  describe('markAsViewed', () => {
    let recipientId: string;

    beforeEach(() => {
      const recipient = repository.create({
        transferId: testTransferId,
        identifier: 'view@example.com',
        transport: 'email'
      });
      recipientId = recipient.id;
    });

    it('should mark recipient as viewed with timestamp', () => {
      const marked = repository.markAsViewed(recipientId);
      expect(marked).toBe(true);

      const recipient = repository.findById(recipientId);
      expect(recipient?.status).toBe('viewed');
      expect(recipient?.viewedAt).toBeInstanceOf(Date);
    });
  });

  describe('markAsSigned', () => {
    let recipientId: string;

    beforeEach(() => {
      const recipient = repository.create({
        transferId: testTransferId,
        identifier: 'sign@example.com',
        transport: 'email'
      });
      recipientId = recipient.id;
    });

    it('should mark recipient as signed with timestamp', () => {
      const marked = repository.markAsSigned(recipientId);
      expect(marked).toBe(true);

      const recipient = repository.findById(recipientId);
      expect(recipient?.status).toBe('signed');
      expect(recipient?.signedAt).toBeInstanceOf(Date);
    });
  });

  describe('deleteByTransferId', () => {
    beforeEach(() => {
      for (let i = 0; i < 3; i++) {
        repository.create({
          transferId: testTransferId,
          identifier: `bulk${i}@example.com`,
          transport: 'email'
        });
      }
    });

    it('should delete all recipients for a transfer', () => {
      const deleted = repository.deleteByTransferId(testTransferId);
      expect(deleted).toBe(3);

      const remaining = repository.findByTransferId(testTransferId);
      expect(remaining).toHaveLength(0);
    });

    it('should return 0 for non-existent transfer', () => {
      const deleted = repository.deleteByTransferId('non-existent');
      expect(deleted).toBe(0);
    });
  });

  describe('edge cases', () => {
    it('should handle special characters in identifier', () => {
      const specialIdentifier = 'user+tag@example.com';
      const recipient = repository.create({
        transferId: testTransferId,
        identifier: specialIdentifier,
        transport: 'email'
      });

      const retrieved = repository.findById(recipient.id);
      expect(retrieved?.identifier).toBe(specialIdentifier);
    });

    it('should handle complex preferences object', () => {
      const complexPrefs = {
        nested: {
          deeply: {
            value: 'test'
          }
        },
        array: [1, 2, 3],
        boolean: true,
        null: null
      };

      const recipient = repository.create({
        transferId: testTransferId,
        identifier: 'complex@example.com',
        transport: 'email',
        preferences: complexPrefs
      });

      const retrieved = repository.findById(recipient.id);
      expect(retrieved?.preferences).toEqual(complexPrefs);
    });

    it('should handle Discord and Telegram identifiers', () => {
      const discordRecipient = repository.create({
        transferId: testTransferId,
        identifier: 'discord:123456789',
        transport: 'discord'
      });

      const telegramRecipient = repository.create({
        transferId: testTransferId,
        identifier: 'telegram:@username',
        transport: 'telegram'
      });

      expect(discordRecipient.identifier).toBe('discord:123456789');
      expect(telegramRecipient.identifier).toBe('telegram:@username');
    });
  });
});