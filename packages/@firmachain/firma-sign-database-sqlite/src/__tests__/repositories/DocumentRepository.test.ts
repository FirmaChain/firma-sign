import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { SQLiteDatabase } from '../../SQLiteDatabase';
import { DocumentRepository } from '../../repositories/DocumentRepository';
import { DocumentEntity, TransferEntity } from '@firmachain/firma-sign-core';
import { createTestDatabase, cleanupTestDatabase, seedTestData } from '../utils/testDb';

describe('DocumentRepository', () => {
  let database: SQLiteDatabase;
  let repository: DocumentRepository;

  beforeEach(async () => {
    database = await createTestDatabase();
    const db = database.getDatabaseInstance()!;
    repository = new DocumentRepository(db);
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

    it('should create a new document', async () => {
      const document = await repository.create({
        id: 'test-doc-1',
        transferId: 'test-transfer',
        fileName: 'test.pdf',
        fileSize: 1024,
        fileHash: 'hash123',
        status: 'pending'
      });

      expect(document).toBeDefined();
      expect(document.id).toBe('test-doc-1');
      expect(document.transferId).toBe('test-transfer');
      expect(document.fileName).toBe('test.pdf');
      expect(document.fileSize).toBe(1024);
      expect(document.fileHash).toBe('hash123');
      expect(document.status).toBe('pending');
      expect(document.createdAt).toBeInstanceOf(Date);
    });

    it('should auto-generate ID if not provided', async () => {
      const document = await repository.create({
        transferId: 'test-transfer',
        fileName: 'test.pdf',
        fileSize: 2048,
        fileHash: 'hash456',
        status: 'pending'
      });

      expect(document.id).toBeDefined();
      expect(document.id.length).toBeGreaterThan(0);
    });
  });

  describe('findByTransferId', () => {
    beforeEach(async () => {
      await seedTestData(database);
    });

    it('should find all documents for a transfer', async () => {
      const documents = await repository.findByTransferId('transfer-1');
      
      expect(documents).toBeDefined();
      expect(documents.length).toBe(2);
      expect(documents.every(d => d.transferId === 'transfer-1')).toBe(true);
    });

    it('should return empty array for non-existent transfer', async () => {
      const documents = await repository.findByTransferId('non-existent');
      expect(documents).toEqual([]);
    });
  });

  describe('findByStatus', () => {
    beforeEach(async () => {
      await seedTestData(database);
    });

    it('should find documents by status', async () => {
      const documents = await repository.findByStatus('pending');
      
      expect(documents).toBeDefined();
      expect(documents.length).toBeGreaterThan(0);
      expect(documents.every(d => d.status === 'pending')).toBe(true);
    });

    it('should find signed documents', async () => {
      const documents = await repository.findByStatus('signed');
      
      expect(documents).toBeDefined();
      expect(documents.length).toBeGreaterThan(0);
      expect(documents.every(d => d.status === 'signed')).toBe(true);
    });
  });

  describe('markAsSigned', () => {
    beforeEach(async () => {
      await seedTestData(database);
    });

    it('should mark document as signed', async () => {
      const updated = await repository.markAsSigned('doc-1', 'signer-123');
      
      expect(updated).toBeDefined();
      expect(updated?.status).toBe('signed');
      expect(updated?.signedBy).toBe('signer-123');
      expect(updated?.signedAt).toBeInstanceOf(Date);
    });

    it('should return null for non-existent document', async () => {
      const updated = await repository.markAsSigned('non-existent', 'signer-123');
      expect(updated).toBeNull();
    });
  });

  describe('updateBlockchainHash', () => {
    beforeEach(async () => {
      await seedTestData(database);
    });

    it('should update original blockchain hash', async () => {
      const updated = await repository.updateBlockchainHash(
        'doc-1',
        'original',
        'tx-hash-original'
      );
      
      expect(updated).toBeDefined();
      expect(updated?.blockchainTxOriginal).toBe('tx-hash-original');
    });

    it('should update signed blockchain hash', async () => {
      const updated = await repository.updateBlockchainHash(
        'doc-1',
        'signed',
        'tx-hash-signed'
      );
      
      expect(updated).toBeDefined();
      expect(updated?.blockchainTxSigned).toBe('tx-hash-signed');
    });
  });

  describe('update', () => {
    beforeEach(async () => {
      await seedTestData(database);
    });

    it('should update document fields', async () => {
      const updated = await repository.update('doc-1', {
        status: 'rejected',
        fileName: 'updated.pdf'
      });

      expect(updated).toBeDefined();
      expect(updated?.status).toBe('rejected');
      expect(updated?.fileName).toBe('updated.pdf');
    });
  });

  describe('delete', () => {
    beforeEach(async () => {
      await seedTestData(database);
    });

    it('should delete document by ID', async () => {
      const deleted = await repository.delete('doc-1');
      expect(deleted).toBe(true);

      const document = await repository.findById('doc-1');
      expect(document).toBeNull();
    });

    it('should return false when deleting non-existent document', async () => {
      const deleted = await repository.delete('non-existent');
      expect(deleted).toBe(false);
    });
  });
});