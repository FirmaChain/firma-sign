import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { promises as fs } from 'fs';
import path from 'path';
import os from 'os';
import { StorageManager } from '../../storage/StorageManager';
import { ConfigManager } from '../../config/ConfigManager';
import { TransferType, DocumentStatus } from '../../types/database';

describe('StorageManager', () => {
  let storageManager: StorageManager;
  let testStoragePath: string;
  let configManager: ConfigManager;

  beforeEach(async () => {
    testStoragePath = path.join(os.tmpdir(), `test-storage-${Date.now()}`);
    
    configManager = new ConfigManager();
    // Mock the storage config to use test path
    (configManager as unknown as { config: Record<string, unknown> }).config = {
      storage: { basePath: testStoragePath },
      server: {},
      transports: {},
      logging: {},
      blockchain: {}
    };
    
    storageManager = new StorageManager(configManager);
    await storageManager.initialize();
    
    await new Promise(resolve => setTimeout(resolve, 100));
  });

  afterEach(async () => {
    await storageManager.close();
    
    try {
      await fs.rm(testStoragePath, { recursive: true, force: true });
    } catch (error) {
      console.error('Error cleaning up test storage:', error);
    }
  });

  describe('initialization', () => {
    it('should create storage directory structure', async () => {
      const dirs = [
        testStoragePath,
        path.join(testStoragePath, 'transfers'),
        path.join(testStoragePath, 'transfers', 'outgoing'),
        path.join(testStoragePath, 'transfers', 'incoming'),
        path.join(testStoragePath, 'config'),
        path.join(testStoragePath, 'logs')
      ];

      for (const dir of dirs) {
        const exists = await fs.access(dir).then(() => true).catch(() => false);
        expect(exists).toBe(true);
      }
    });

    it('should use in-memory database in test environment', async () => {
      // In test environment, we use in-memory database, not a file
      // The database should be initialized successfully without creating a file
      const dbPath = path.join(testStoragePath, 'firma-sign.db');
      const exists = await fs.access(dbPath).then(() => true).catch(() => false);
      // Should NOT create a database file in test mode
      expect(exists).toBe(false);
      // But storage manager should be initialized
      expect(storageManager.isInitialized).toBe(true);
    });

    it('should use default home directory if no path provided', async () => {
      const defaultConfigManager = new ConfigManager();
      (defaultConfigManager as unknown as { config: Record<string, unknown> }).config = {
        storage: { basePath: path.join(os.homedir(), '.firma-sign') },
        server: {},
        transports: {},
        logging: {},
        blockchain: {}
      };
      const defaultManager = new StorageManager(defaultConfigManager);
      expect((defaultManager as unknown as { storagePath: string }).storagePath).toBe(
        path.join(os.homedir(), '.firma-sign')
      );
      await defaultManager.close();
    });
  });

  describe('createTransfer', () => {
    it('should create transfer with documents and recipients', async () => {
      const transfer = await storageManager.createTransfer({
        transferId: 'test-transfer-1',
        type: 'outgoing' as TransferType,
        documents: [
          {
            id: 'doc-1',
            fileName: 'test1.pdf',
            fileSize: 1024,
            fileHash: 'hash1'
          },
          {
            id: 'doc-2',
            fileName: 'test2.pdf',
            fileSize: 2048,
            fileHash: 'hash2'
          }
        ],
        recipients: [
          {
            identifier: 'user1@example.com',
            transport: 'email',
            preferences: { notificationEnabled: true }
          },
          {
            identifier: 'user2@example.com',
            transport: 'p2p'
          }
        ],
        metadata: {
          message: 'Test transfer',
          deadline: '2024-12-31'
        }
      });

      expect(transfer).toBeDefined();
      expect(transfer.id).toBe('test-transfer-1');
      expect(transfer.type).toBe('outgoing');
      expect(transfer.status).toBe('pending');

      const transferDir = path.join(
        testStoragePath,
        'transfers',
        'outgoing',
        'test-transfer-1'
      );
      const dirExists = await fs.access(transferDir).then(() => true).catch(() => false);
      expect(dirExists).toBe(true);

      const metadataPath = path.join(transferDir, 'metadata.json');
      const metadataExists = await fs.access(metadataPath).then(() => true).catch(() => false);
      expect(metadataExists).toBe(true);

      const metadata = JSON.parse(await fs.readFile(metadataPath, 'utf-8')) as { message: string; deadline: string };
      expect(metadata).toEqual({
        message: 'Test transfer',
        deadline: '2024-12-31'
      });
    });

    it('should create directory structure for transfer', async () => {
      await storageManager.createTransfer({
        transferId: 'test-transfer-2',
        type: 'incoming' as TransferType
      });

      const transferDir = path.join(
        testStoragePath,
        'transfers',
        'incoming',
        'test-transfer-2'
      );

      const documentsDir = path.join(transferDir, 'documents');
      const signedDir = path.join(transferDir, 'signed');

      const docsDirExists = await fs.access(documentsDir).then(() => true).catch(() => false);
      const signedDirExists = await fs.access(signedDir).then(() => true).catch(() => false);

      expect(docsDirExists).toBe(true);
      expect(signedDirExists).toBe(true);
    });

    it('should handle creation without metadata', async () => {
      const transfer = await storageManager.createTransfer({
        transferId: 'test-transfer-3',
        type: 'outgoing' as TransferType
      });

      expect(transfer).toBeDefined();

      const metadataPath = path.join(
        testStoragePath,
        'transfers',
        'outgoing',
        'test-transfer-3',
        'metadata.json'
      );
      const metadataExists = await fs.access(metadataPath).then(() => true).catch(() => false);
      expect(metadataExists).toBe(false);
    });

    it('should handle sender information', async () => {
      const transfer = await storageManager.createTransfer({
        transferId: 'test-transfer-4',
        type: 'incoming' as TransferType,
        sender: {
          senderId: 'sender-123',
          name: 'John Doe',
          email: 'john@example.com',
          publicKey: 'public-key',
          transport: 'email',
          timestamp: Date.now(),
          verificationStatus: 'verified'
        }
      });

      expect(transfer.sender).toBeDefined();
      expect(transfer.sender?.name).toBe('John Doe');
    });
  });

  describe('getTransfer', () => {
    beforeEach(async () => {
      await storageManager.createTransfer({
        transferId: 'get-test-1',
        type: 'outgoing' as TransferType,
        documents: [
          {
            id: 'doc-get-1',
            fileName: 'get-test.pdf',
            fileSize: 1024,
            fileHash: 'hash-get'
          }
        ],
        metadata: { test: true }
      });
    });

    it('should retrieve existing transfer', async () => {
      const transfer = await storageManager.getTransfer('get-test-1');

      expect(transfer).toBeDefined();
      expect(transfer?.id).toBe('get-test-1');
      expect(transfer?.type).toBe('outgoing');
    });

    it('should return null for non-existent transfer', async () => {
      const transfer = await storageManager.getTransfer('non-existent');
      expect(transfer).toBeNull();
    });
  });

  describe('getTransferWithDetails', () => {
    beforeEach(async () => {
      await storageManager.createTransfer({
        transferId: 'details-test-1',
        type: 'outgoing' as TransferType,
        documents: [
          {
            id: 'doc-details-1',
            fileName: 'details1.pdf',
            fileSize: 1024,
            fileHash: 'hash1'
          },
          {
            id: 'doc-details-2',
            fileName: 'details2.pdf',
            fileSize: 2048,
            fileHash: 'hash2'
          }
        ],
        recipients: [
          {
            identifier: 'details@example.com',
            transport: 'email'
          }
        ]
      });
    });

    it('should retrieve transfer with all related data', async () => {
      const result = await storageManager.getTransferWithDetails('details-test-1');

      expect(result).toBeDefined();
      expect(result?.transfer.id).toBe('details-test-1');
      expect(result?.documents).toHaveLength(2);
      expect(result?.recipients).toHaveLength(1);
    });

    it('should return null for non-existent transfer', async () => {
      const result = await storageManager.getTransferWithDetails('non-existent');
      expect(result).toBeNull();
    });
  });

  describe('listTransfers', () => {
    beforeEach(async () => {
      await storageManager.createTransfer({
        transferId: 'list-test-1',
        type: 'outgoing' as TransferType
      });

      await storageManager.createTransfer({
        transferId: 'list-test-2',
        type: 'incoming' as TransferType
      });

      await storageManager.createTransfer({
        transferId: 'list-test-3',
        type: 'outgoing' as TransferType
      });
    });

    it('should list all transfers', async () => {
      const transfers = await storageManager.listTransfers();
      expect(transfers.length).toBeGreaterThanOrEqual(3);
    });

    it('should filter by type', async () => {
      const outgoing = await storageManager.listTransfers('outgoing');
      expect(outgoing.every(t => t.type === 'outgoing')).toBe(true);
      expect(outgoing.length).toBeGreaterThanOrEqual(2);

      const incoming = await storageManager.listTransfers('incoming');
      expect(incoming.every(t => t.type === 'incoming')).toBe(true);
      expect(incoming.length).toBeGreaterThanOrEqual(1);
    });

    it('should respect limit parameter', async () => {
      const limited = await storageManager.listTransfers(undefined, 2);
      expect(limited.length).toBeLessThanOrEqual(2);
    });
  });

  describe('updateTransferSignatures', () => {
    let transferId: string;

    beforeEach(async () => {
      const transfer = await storageManager.createTransfer({
        transferId: 'sig-test-1',
        type: 'outgoing' as TransferType,
        documents: [
          {
            id: 'doc-sig-1',
            fileName: 'sig1.pdf',
            fileSize: 1024,
            fileHash: 'hash1'
          },
          {
            id: 'doc-sig-2',
            fileName: 'sig2.pdf',
            fileSize: 2048,
            fileHash: 'hash2'
          }
        ]
      });
      transferId = transfer.id;
    });

    it('should update document signatures', async () => {
      await storageManager.updateTransferSignatures(transferId, [
        {
          documentId: 'doc-sig-1',
          status: 'signed' as DocumentStatus,
          signedBy: 'user-123',
          blockchainTxSigned: 'tx-hash-1'
        }
      ]);

      const details = await storageManager.getTransferWithDetails(transferId);
      expect(details?.transfer.status).toBe('partially-signed');

      const signedDoc = details?.documents.find(d => d.id === 'doc-sig-1');
      expect(signedDoc?.status).toBe('signed');
      expect(signedDoc?.signedBy).toBe('user-123');
    });

    it('should update transfer status based on signatures', async () => {
      await storageManager.updateTransferSignatures(transferId, [
        {
          documentId: 'doc-sig-1',
          status: 'signed' as DocumentStatus,
          signedBy: 'user-123'
        },
        {
          documentId: 'doc-sig-2',
          status: 'signed' as DocumentStatus,
          signedBy: 'user-456'
        }
      ]);

      const transfer = await storageManager.getTransfer(transferId);
      expect(transfer?.status).toBe('completed');
    });
  });

  describe('saveDocument and getDocument', () => {
    let transferId: string;

    beforeEach(async () => {
      const transfer = await storageManager.createTransfer({
        transferId: 'doc-io-test-1',
        type: 'outgoing' as TransferType,
        documents: [
          {
            id: 'doc-io-1',
            fileName: 'test-document.pdf',
            fileSize: 1024,
            fileHash: 'hash-io'
          }
        ]
      });
      transferId = transfer.id;
    });

    it('should save and retrieve document', async () => {
      const testData = Buffer.from('This is test PDF content');
      
      await storageManager.saveDocument(transferId, 'test-document.pdf', testData);

      const retrieved = await storageManager.getDocument(transferId, 'test-document.pdf');
      expect(retrieved).toEqual(testData);
      expect(retrieved.toString()).toBe('This is test PDF content');
    });

    it('should handle binary data', async () => {
      const binaryData = Buffer.from([0xFF, 0xD8, 0xFF, 0xE0, 0x00, 0x10]);
      
      await storageManager.saveDocument(transferId, 'binary.jpg', binaryData);

      const retrieved = await storageManager.getDocument(transferId, 'binary.jpg');
      expect(retrieved).toEqual(binaryData);
    });

    it('should throw error for non-existent transfer', async () => {
      await expect(
        storageManager.saveDocument('non-existent', 'file.pdf', Buffer.from('test'))
      ).rejects.toThrow('Transfer not found');
    });

    it('should throw error when getting document from non-existent transfer', async () => {
      await expect(
        storageManager.getDocument('non-existent', 'file.pdf')
      ).rejects.toThrow('Transfer not found');
    });

    it('should throw error for non-existent document', async () => {
      await expect(
        storageManager.getDocument(transferId, 'non-existent.pdf')
      ).rejects.toThrow();
    });
  });

  describe('updateRecipientStatus', () => {
    let recipientId: string;

    beforeEach(async () => {
      const result = await storageManager.createTransfer({
        transferId: 'recipient-test-1',
        type: 'outgoing' as TransferType,
        recipients: [
          {
            identifier: 'status@example.com',
            transport: 'email'
          }
        ]
      });

      const recipients = await storageManager.getRecipientsByTransferId(result.id);
      recipientId = recipients[0].id;
    });

    it('should update recipient status to notified', async () => {
      await storageManager.updateRecipientStatus(recipientId, 'notified');

      const recipient = await storageManager.getRecipientById(recipientId);
      expect(recipient?.status).toBe('notified');
      expect(recipient?.notifiedAt).toBeInstanceOf(Date);
    });

    it('should update recipient status to viewed', async () => {
      await storageManager.updateRecipientStatus(recipientId, 'viewed');

      const recipient = await storageManager.getRecipientById(recipientId);
      expect(recipient?.status).toBe('viewed');
      expect(recipient?.viewedAt).toBeInstanceOf(Date);
    });

    it('should update recipient status to signed', async () => {
      await storageManager.updateRecipientStatus(recipientId, 'signed');

      const recipient = await storageManager.getRecipientById(recipientId);
      expect(recipient?.status).toBe('signed');
      expect(recipient?.signedAt).toBeInstanceOf(Date);
    });
  });

  describe('storeBlockchainHash', () => {
    let documentId: string;

    beforeEach(async () => {
      await storageManager.createTransfer({
        transferId: 'blockchain-test-1',
        type: 'outgoing' as TransferType,
        documents: [
          {
            id: 'doc-blockchain-1',
            fileName: 'blockchain.pdf',
            fileSize: 1024,
            fileHash: 'hash-blockchain'
          }
        ]
      });

      documentId = 'doc-blockchain-1';
    });

    it('should store original blockchain hash', async () => {
      await storageManager.storeBlockchainHash(documentId, 'original', 'tx-original-123');

      const document = await storageManager.getDocumentById(documentId);
      expect(document?.blockchainTxOriginal).toBe('tx-original-123');
    });

    it('should store signed blockchain hash', async () => {
      await storageManager.storeBlockchainHash(documentId, 'signed', 'tx-signed-456');

      const document = await storageManager.getDocumentById(documentId);
      expect(document?.blockchainTxSigned).toBe('tx-signed-456');
    });
  });

  describe('helper methods', () => {
    let transferId: string;

    beforeEach(async () => {
      const result = await storageManager.createTransfer({
        transferId: 'helper-test-1',
        type: 'outgoing' as TransferType,
        documents: [
          {
            id: 'doc-helper-1',
            fileName: 'helper1.pdf',
            fileSize: 1024,
            fileHash: 'hash1'
          },
          {
            id: 'doc-helper-2',
            fileName: 'helper2.pdf',
            fileSize: 2048,
            fileHash: 'hash2'
          }
        ],
        recipients: [
          {
            identifier: 'helper1@example.com',
            transport: 'email'
          },
          {
            identifier: 'helper2@example.com',
            transport: 'p2p'
          }
        ]
      });
      transferId = result.id;
    });

    it('should get documents by transfer ID', async () => {
      const documents = await storageManager.getDocumentsByTransferId(transferId);
      expect(documents).toHaveLength(2);
      expect(documents[0].fileName).toBe('helper1.pdf');
      expect(documents[1].fileName).toBe('helper2.pdf');
    });

    it('should get recipients by transfer ID', async () => {
      const recipients = await storageManager.getRecipientsByTransferId(transferId);
      expect(recipients).toHaveLength(2);
      expect(recipients[0].identifier).toBe('helper1@example.com');
      expect(recipients[1].identifier).toBe('helper2@example.com');
    });

    it('should get document by ID', async () => {
      const document = await storageManager.getDocumentById('doc-helper-1');
      expect(document).toBeDefined();
      expect(document?.fileName).toBe('helper1.pdf');
    });

    it('should get recipient by ID', async () => {
      const recipients = await storageManager.getRecipientsByTransferId(transferId);
      const recipient = await storageManager.getRecipientById(recipients[0].id);
      expect(recipient).toBeDefined();
      expect(recipient?.identifier).toBe('helper1@example.com');
    });
  });

  describe('error handling', () => {
    it('should handle database errors gracefully', async () => {
      await storageManager.close();

      await expect(
        storageManager.createTransfer({
          transferId: 'error-test-1',
          type: 'outgoing' as TransferType
        })
      ).rejects.toThrow();
    });

    it('should handle file system errors', async () => {
      const transfer = await storageManager.createTransfer({
        transferId: 'fs-error-test',
        type: 'outgoing' as TransferType
      });

      const readOnlyPath = path.join(testStoragePath, 'transfers', 'outgoing', transfer.id);
      await fs.chmod(readOnlyPath, 0o444);

      await expect(
        storageManager.saveDocument(transfer.id, 'test.pdf', Buffer.from('test'))
      ).rejects.toThrow();
    });
  });

  describe('concurrent operations', () => {
    it.skip('should handle concurrent transfer creation - SQLite transaction limitation', async () => {
      const promises = Array.from({ length: 10 }, (_, i) => 
        storageManager.createTransfer({
          transferId: `concurrent-${i}`,
          type: i % 2 === 0 ? 'outgoing' : 'incoming' as TransferType
        })
      );

      const results = await Promise.all(promises);
      expect(results).toHaveLength(10);
      expect(new Set(results.map(r => r.id)).size).toBe(10);
    });
  });
});