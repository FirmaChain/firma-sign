import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { DatabaseConnection } from '../../../database/Database';
import { DocumentRepository } from '../../../database/repositories/DocumentRepository';
import { TransferRepository } from '../../../database/repositories/TransferRepository';
import { createTestDatabase, cleanupTestDatabase, seedTestData } from '../../utils/testDb';
import { DocumentStatus, TransferType, TransferStatus } from '../../../types/database';

describe('DocumentRepository', () => {
  let db: DatabaseConnection;
  let repository: DocumentRepository;
  let transferRepository: TransferRepository;
  let testTransferId: string;

  beforeEach(() => {
    db = createTestDatabase();
    repository = new DocumentRepository(db);
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
    it('should create a new document', () => {
      const document = repository.create({
        id: 'doc-test-1',
        transferId: testTransferId,
        fileName: 'test-document.pdf',
        fileSize: 2048,
        fileHash: 'hash-abc123',
        status: 'pending' as DocumentStatus
      });

      expect(document).toBeDefined();
      expect(document.id).toBe('doc-test-1');
      expect(document.transferId).toBe(testTransferId);
      expect(document.fileName).toBe('test-document.pdf');
      expect(document.fileSize).toBe(2048);
      expect(document.fileHash).toBe('hash-abc123');
      expect(document.status).toBe('pending');
      expect(document.createdAt).toBeInstanceOf(Date);
    });

    it('should auto-generate ID if not provided', () => {
      const document = repository.create({
        transferId: testTransferId,
        fileName: 'auto-id.pdf',
        fileSize: 1024,
        fileHash: 'hash-xyz'
      });

      expect(document.id).toBeDefined();
      expect(document.id.length).toBeGreaterThan(0);
    });

    it('should handle signed document data', () => {
      const signedAt = new Date();
      const document = repository.create({
        transferId: testTransferId,
        fileName: 'signed.pdf',
        fileSize: 1024,
        fileHash: 'hash-signed',
        status: 'signed' as DocumentStatus,
        signedAt,
        signedBy: 'user-123',
        blockchainTxOriginal: 'tx-original-hash',
        blockchainTxSigned: 'tx-signed-hash'
      });

      expect(document.status).toBe('signed');
      expect(document.signedAt).toBeDefined();
      expect(document.signedBy).toBe('user-123');
      expect(document.blockchainTxOriginal).toBe('tx-original-hash');
      expect(document.blockchainTxSigned).toBe('tx-signed-hash');
    });

    it('should enforce foreign key constraint', () => {
      expect(() => {
        repository.create({
          transferId: 'non-existent-transfer',
          fileName: 'test.pdf',
          fileSize: 1024,
          fileHash: 'hash'
        });
      }).toThrow();
    });
  });

  describe('findById', () => {
    beforeEach(() => {
      seedTestData(db);
    });

    it('should find document by ID', () => {
      const document = repository.findById('doc-1');

      expect(document).toBeDefined();
      expect(document?.id).toBe('doc-1');
      expect(document?.fileName).toBe('test-doc-1.pdf');
      expect(document?.fileSize).toBe(1024);
      expect(document?.fileHash).toBe('hash-1');
    });

    it('should return null for non-existent document', () => {
      const document = repository.findById('non-existent');
      expect(document).toBeNull();
    });

    it('should properly handle signed document data', () => {
      const document = repository.findById('doc-2');

      expect(document?.status).toBe('signed');
      expect(document?.signedAt).toBeInstanceOf(Date);
      expect(document?.signedBy).toBe('recipient-1');
      expect(document?.blockchainTxOriginal).toBe('tx-original-1');
      expect(document?.blockchainTxSigned).toBe('tx-signed-1');
    });
  });

  describe('update', () => {
    let docId: string;

    beforeEach(() => {
      const doc = repository.create({
        transferId: testTransferId,
        fileName: 'update-test.pdf',
        fileSize: 1024,
        fileHash: 'hash-update',
        status: 'pending' as DocumentStatus
      });
      docId = doc.id;
    });

    it('should update document status', () => {
      const updated = repository.update(docId, {
        status: 'signed' as DocumentStatus
      });

      expect(updated).toBeDefined();
      expect(updated?.status).toBe('signed');
      expect(updated?.id).toBe(docId);
    });

    it('should update signature information', () => {
      const signedAt = new Date();
      const updated = repository.update(docId, {
        status: 'signed' as DocumentStatus,
        signedAt,
        signedBy: 'signer-123'
      });

      expect(updated?.signedAt).toBeDefined();
      expect(updated?.signedBy).toBe('signer-123');
    });

    it('should update blockchain hashes', () => {
      const updated = repository.update(docId, {
        blockchainTxOriginal: 'new-tx-original',
        blockchainTxSigned: 'new-tx-signed'
      });

      expect(updated?.blockchainTxOriginal).toBe('new-tx-original');
      expect(updated?.blockchainTxSigned).toBe('new-tx-signed');
    });

    it('should return null for non-existent document', () => {
      const updated = repository.update('non-existent', {
        status: 'signed' as DocumentStatus
      });

      expect(updated).toBeNull();
    });

    it('should not update if no changes provided', () => {
      const before = repository.findById(docId);
      const updated = repository.update(docId, {});

      expect(updated).toEqual(before);
    });
  });

  describe('delete', () => {
    let docId: string;

    beforeEach(() => {
      const doc = repository.create({
        transferId: testTransferId,
        fileName: 'delete-test.pdf',
        fileSize: 1024,
        fileHash: 'hash-delete'
      });
      docId = doc.id;
    });

    it('should delete document', () => {
      const deleted = repository.delete(docId);
      expect(deleted).toBe(true);

      const document = repository.findById(docId);
      expect(document).toBeNull();
    });

    it('should return false for non-existent document', () => {
      const deleted = repository.delete('non-existent');
      expect(deleted).toBe(false);
    });
  });

  describe('findByTransferId', () => {
    beforeEach(() => {
      seedTestData(db);
    });

    it('should find all documents for a transfer', () => {
      const documents = repository.findByTransferId('transfer-1');

      expect(documents).toHaveLength(2);
      expect(documents.every(d => d.transferId === 'transfer-1')).toBe(true);
    });

    it('should return empty array for non-existent transfer', () => {
      const documents = repository.findByTransferId('non-existent');
      expect(documents).toHaveLength(0);
    });

    it('should return documents in consistent order', () => {
      const documents = repository.findByTransferId('transfer-1');
      const ids = documents.map(d => d.id);

      const documents2 = repository.findByTransferId('transfer-1');
      const ids2 = documents2.map(d => d.id);

      expect(ids).toEqual(ids2);
    });
  });

  describe('findByStatus', () => {
    beforeEach(() => {
      repository.create({
        transferId: testTransferId,
        fileName: 'pending1.pdf',
        fileSize: 1024,
        fileHash: 'hash1',
        status: 'pending' as DocumentStatus
      });

      repository.create({
        transferId: testTransferId,
        fileName: 'pending2.pdf',
        fileSize: 1024,
        fileHash: 'hash2',
        status: 'pending' as DocumentStatus
      });

      repository.create({
        transferId: testTransferId,
        fileName: 'signed1.pdf',
        fileSize: 1024,
        fileHash: 'hash3',
        status: 'signed' as DocumentStatus
      });
    });

    it('should find documents by status', () => {
      const pending = repository.findByStatus('pending');
      expect(pending).toHaveLength(2);
      expect(pending.every(d => d.status === 'pending')).toBe(true);

      const signed = repository.findByStatus('signed');
      expect(signed).toHaveLength(1);
      expect(signed[0].status).toBe('signed');
    });
  });

  describe('findByTransferIdAndStatus', () => {
    let transfer2Id: string;

    beforeEach(() => {
      const transfer2 = transferRepository.create({
        type: 'incoming' as TransferType,
        status: 'pending' as TransferStatus,
        transportType: 'email'
      });
      transfer2Id = transfer2.id;

      repository.create({
        transferId: testTransferId,
        fileName: 'doc1.pdf',
        fileSize: 1024,
        fileHash: 'hash1',
        status: 'pending' as DocumentStatus
      });

      repository.create({
        transferId: testTransferId,
        fileName: 'doc2.pdf',
        fileSize: 1024,
        fileHash: 'hash2',
        status: 'signed' as DocumentStatus
      });

      repository.create({
        transferId: transfer2Id,
        fileName: 'doc3.pdf',
        fileSize: 1024,
        fileHash: 'hash3',
        status: 'pending' as DocumentStatus
      });
    });

    it('should find documents by transfer ID and status', () => {
      const results = repository.findByTransferIdAndStatus(testTransferId, 'pending');

      expect(results).toHaveLength(1);
      expect(results[0].transferId).toBe(testTransferId);
      expect(results[0].status).toBe('pending');
    });

    it('should return empty array when no matches', () => {
      const results = repository.findByTransferIdAndStatus(testTransferId, 'rejected');
      expect(results).toHaveLength(0);
    });
  });

  describe('deleteByTransferId', () => {
    beforeEach(() => {
      repository.create({
        transferId: testTransferId,
        fileName: 'doc1.pdf',
        fileSize: 1024,
        fileHash: 'hash1'
      });

      repository.create({
        transferId: testTransferId,
        fileName: 'doc2.pdf',
        fileSize: 1024,
        fileHash: 'hash2'
      });

      repository.create({
        transferId: testTransferId,
        fileName: 'doc3.pdf',
        fileSize: 1024,
        fileHash: 'hash3'
      });
    });

    it('should delete all documents for a transfer', () => {
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

  describe('updateBlockchainHash', () => {
    let docId: string;

    beforeEach(() => {
      const doc = repository.create({
        transferId: testTransferId,
        fileName: 'blockchain-test.pdf',
        fileSize: 1024,
        fileHash: 'hash-blockchain'
      });
      docId = doc.id;
    });

    it('should update original blockchain hash', () => {
      const updated = repository.updateBlockchainHash(docId, 'original', 'tx-hash-123');
      expect(updated).toBe(true);

      const document = repository.findById(docId);
      expect(document?.blockchainTxOriginal).toBe('tx-hash-123');
      expect(document?.blockchainTxSigned).toBeUndefined();
    });

    it('should update signed blockchain hash', () => {
      const updated = repository.updateBlockchainHash(docId, 'signed', 'tx-hash-456');
      expect(updated).toBe(true);

      const document = repository.findById(docId);
      expect(document?.blockchainTxSigned).toBe('tx-hash-456');
      expect(document?.blockchainTxOriginal).toBeUndefined();
    });

    it('should return false for non-existent document', () => {
      const updated = repository.updateBlockchainHash('non-existent', 'original', 'tx-hash');
      expect(updated).toBe(false);
    });
  });

  describe('edge cases', () => {
    it('should handle very large file sizes', () => {
      const largeSize = 2147483647;
      const document = repository.create({
        transferId: testTransferId,
        fileName: 'large.pdf',
        fileSize: largeSize,
        fileHash: 'hash-large'
      });

      expect(document.fileSize).toBe(largeSize);
    });

    it('should handle special characters in file names', () => {
      const specialName = 'test "file" with \'quotes\' & special <chars>.pdf';
      const document = repository.create({
        transferId: testTransferId,
        fileName: specialName,
        fileSize: 1024,
        fileHash: 'hash-special'
      });

      const retrieved = repository.findById(document.id);
      expect(retrieved?.fileName).toBe(specialName);
    });

    it('should handle very long file names', () => {
      const longName = 'a'.repeat(255) + '.pdf';
      const document = repository.create({
        transferId: testTransferId,
        fileName: longName,
        fileSize: 1024,
        fileHash: 'hash-long'
      });

      expect(document.fileName).toBe(longName);
    });
  });
});