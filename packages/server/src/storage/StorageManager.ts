import path from 'path';
import { logger } from '../utils/logger.js';
import { 
  Database,
  Repository,
  TransferEntity,
  DocumentEntity,
  RecipientEntity,
  Storage,
  StorageResult
} from '@firmachain/firma-sign-core';
import { SQLiteDatabase } from '@firmachain/firma-sign-database-sqlite';
import { MockLocalStorage } from './MockLocalStorage.js';
import { 
  Transfer, 
  Document, 
  Recipient,
  TransferType,
  DocumentStatus,
  RecipientStatus,
  SenderInfo,
  TransferStatus
} from '../types/database.js';
import type { ConfigManager } from '../config/ConfigManager.js';

export class StorageManager {
  private readonly database: Database;
  private readonly storage: Storage;
  private transferRepo!: Repository<TransferEntity>;
  private documentRepo!: Repository<DocumentEntity>;
  private recipientRepo!: Repository<RecipientEntity>;
  private storagePath: string;
  // Keep configManager for potential future use
  private readonly configManager: ConfigManager;
  private isInitialized = false;

  constructor(configManager: ConfigManager, database?: Database, storage?: Storage) {
    this.configManager = configManager;
    const storageConfig = configManager.getStorage();
    this.storagePath = storageConfig.basePath;
    this.database = database || new SQLiteDatabase();
    this.storage = storage || new MockLocalStorage();
    
    // Don't auto-initialize in constructor
  }

  /**
   * Initialize storage and database
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) return;
    
    // Initialize file storage
    await this.storage.initialize({
      basePath: this.storagePath,
      maxFileSize: 500 * 1024 * 1024, // 500MB
      ensureDirectories: true,
      useChecksum: true
    });
    
    // Create required directory structure
    const dirs = [
      'transfers',
      'transfers/outgoing',
      'transfers/incoming',
      'config',
      'logs'
    ];
    
    for (const dir of dirs) {
      // Check if createDirectory method exists (it's optional in the interface)
      const storage = this.storage as Storage & { createDirectory?: (path: string) => Promise<void> };
      if (storage.createDirectory && typeof storage.createDirectory === 'function') {
        await storage.createDirectory(dir);
      }
    }
    
    // Initialize database
    const dbPath = path.join(this.storagePath, 'firma-sign.db');
    await this.database.initialize({
      database: dbPath
    });
    
    this.transferRepo = this.database.getRepository<TransferEntity>('Transfer');
    this.documentRepo = this.database.getRepository<DocumentEntity>('Document');
    this.recipientRepo = this.database.getRepository<RecipientEntity>('Recipient');
    
    this.isInitialized = true;
    logger.info(`Storage initialized at: ${this.storagePath}`);
  }



  async createTransfer(transferData: {
    transferId: string;
    type: TransferType;
    documents?: Array<{
      id: string;
      fileName: string;
      fileSize?: number;
      fileHash?: string;
    }>;
    recipients?: Array<{
      identifier: string;
      transport: string;
      preferences?: Record<string, unknown>;
    }>;
    sender?: SenderInfo;
    metadata?: Record<string, unknown>;
  }): Promise<Transfer> {
    this.ensureInitialized();
    
    // Use transaction to create transfer with documents and recipients
    const result = await this.database.transaction(async (tx) => {
      const transferRepo = tx.getRepository<TransferEntity>('Transfer');
      const documentRepo = tx.getRepository<DocumentEntity>('Document');
      const recipientRepo = tx.getRepository<RecipientEntity>('Recipient');
      
      // Create transfer
      const transfer = await transferRepo.create({
        id: transferData.transferId,
        type: transferData.type as 'incoming' | 'outgoing',
        status: 'pending',
        senderId: transferData.sender?.senderId,
        senderName: transferData.sender?.name,
        senderEmail: transferData.sender?.email,
        senderPublicKey: transferData.sender?.publicKey,
        transportType: transferData.sender?.transport || 'p2p',
        metadata: transferData.metadata,
        createdAt: new Date(),
        updatedAt: new Date()
      });
      
      // Create documents if provided
      const documents: DocumentEntity[] = [];
      if (transferData.documents) {
        for (const doc of transferData.documents) {
          const document = await documentRepo.create({
            id: doc.id,
            transferId: transferData.transferId,
            fileName: doc.fileName,
            fileSize: doc.fileSize || 0,
            fileHash: doc.fileHash || '',
            status: 'pending',
            createdAt: new Date()
          });
          documents.push(document);
        }
      }
      
      // Create recipients if provided
      const recipients: RecipientEntity[] = [];
      if (transferData.recipients) {
        for (const rec of transferData.recipients) {
          const recipient = await recipientRepo.create({
            transferId: transferData.transferId,
            identifier: rec.identifier,
            transport: rec.transport,
            status: 'pending',
            preferences: rec.preferences,
            createdAt: new Date()
          });
          recipients.push(recipient);
        }
      }
      
      return { transfer, documents, recipients };
    });

    // Create directory structure in storage
    const transferBasePath = `transfers/${transferData.type}/${transferData.transferId}`;
    const storage = this.storage as Storage & { createDirectory?: (path: string) => Promise<void> };
    if (storage.createDirectory) {
      await storage.createDirectory(`${transferBasePath}/documents`);
      await storage.createDirectory(`${transferBasePath}/signed`);
    }
    
    // Save metadata if provided
    if (transferData.metadata) {
      await this.saveTransferMetadata(transferData.transferId, transferData.metadata);
    }

    return this.mapTransferEntityToTransfer(result.transfer);
  }

  async getTransfer(transferId: string): Promise<Transfer | null> {
    this.ensureInitialized();
    const transfer = await this.transferRepo.findById(transferId);
    if (!transfer) {
      return null;
    }
    return this.mapTransferEntityToTransfer(transfer);
  }
  
  async getTransferWithDetails(transferId: string): Promise<{
    transfer: Transfer;
    documents: Document[];
    recipients: Recipient[];
  } | null> {
    this.ensureInitialized();
    const transfer = await this.transferRepo.findById(transferId);
    if (!transfer) {
      return null;
    }
    
    const documents = await this.documentRepo.find({ transferId });
    const recipients = await this.recipientRepo.find({ transferId });
    
    return {
      transfer: this.mapTransferEntityToTransfer(transfer),
      documents: documents.map(d => this.mapDocumentEntityToDocument(d)),
      recipients: recipients.map(r => this.mapRecipientEntityToRecipient(r))
    };
  }

  async listTransfers(type?: TransferType, limit: number = 100): Promise<Transfer[]> {
    this.ensureInitialized();
    let transfers: TransferEntity[];
    
    if (type) {
      transfers = await this.transferRepo.find({ type: type as 'incoming' | 'outgoing' }, { limit });
    } else {
      transfers = await this.transferRepo.findAll({ limit, orderBy: { createdAt: 'desc' } });
    }
    
    return transfers.map(t => this.mapTransferEntityToTransfer(t));
  }

  async updateTransferSignatures(transferId: string, signatures: Array<{
    documentId: string;
    status: DocumentStatus;
    signedBy?: string;
    blockchainTxSigned?: string;
  }>): Promise<void> {
    this.ensureInitialized();
    
    await this.database.transaction(async (tx) => {
      const documentRepo = tx.getRepository<DocumentEntity>('Document');
      const transferRepo = tx.getRepository<TransferEntity>('Transfer');
      
      for (const sig of signatures) {
        await documentRepo.update(sig.documentId, {
          status: sig.status,
          signedBy: sig.signedBy,
          signedAt: sig.status === 'signed' ? new Date() : undefined,
          blockchainTxSigned: sig.blockchainTxSigned
        });
      }
      
      // Update transfer status based on document signatures
      const allDocs = await documentRepo.find({ transferId });
      const signedCount = allDocs.filter(d => d.status === 'signed').length;
      const totalCount = allDocs.length;
      
      let newStatus: TransferStatus = 'pending';
      if (signedCount === totalCount && totalCount > 0) {
        newStatus = 'completed';
      } else if (signedCount > 0) {
        newStatus = 'partially-signed';
      }
      
      await transferRepo.update(transferId, {
        status: newStatus,
        updatedAt: new Date()
      });
    });
  }

  async saveDocument(transferId: string, fileName: string, data: Buffer): Promise<StorageResult> {
    this.ensureInitialized();
    
    const transfer = await this.getTransfer(transferId);
    if (!transfer) {
      throw new Error('Transfer not found');
    }

    const storagePath = `transfers/${transfer.type}/${transferId}/documents/${fileName}`;
    const result = await this.storage.save(storagePath, data);
    
    logger.info(`Document saved: ${fileName} for transfer ${transferId}`, {
      path: result.path,
      size: result.size,
      hash: result.hash
    });
    
    return result;
  }

  async getDocument(transferId: string, fileName: string): Promise<Buffer> {
    this.ensureInitialized();
    
    const transfer = await this.getTransfer(transferId);
    if (!transfer) {
      throw new Error('Transfer not found');
    }

    const storagePath = `transfers/${transfer.type}/${transferId}/documents/${fileName}`;
    return await this.storage.read(storagePath);
  }

  async updateRecipientStatus(recipientId: string, status: RecipientStatus): Promise<void> {
    this.ensureInitialized();
    
    const updates: Partial<RecipientEntity> = {
      status
    };
    
    if (status === 'notified') {
      updates.notifiedAt = new Date();
    } else if (status === 'viewed') {
      updates.viewedAt = new Date();
    } else if (status === 'signed') {
      updates.signedAt = new Date();
    }
    
    await this.recipientRepo.update(recipientId, updates);
  }
  
  async storeBlockchainHash(documentId: string, type: 'original' | 'signed', txHash: string): Promise<void> {
    this.ensureInitialized();
    
    const updates: Partial<DocumentEntity> = {};
    if (type === 'original') {
      updates.blockchainTxOriginal = txHash;
    } else {
      updates.blockchainTxSigned = txHash;
    }
    
    await this.documentRepo.update(documentId, updates);
  }
  
  async getDocumentsByTransferId(transferId: string): Promise<Document[]> {
    this.ensureInitialized();
    const documents = await this.documentRepo.find({ transferId });
    return documents.map(d => this.mapDocumentEntityToDocument(d));
  }
  
  async getRecipientsByTransferId(transferId: string): Promise<Recipient[]> {
    this.ensureInitialized();
    const recipients = await this.recipientRepo.find({ transferId });
    return recipients.map(r => this.mapRecipientEntityToRecipient(r));
  }
  
  async getDocumentById(documentId: string): Promise<Document | null> {
    this.ensureInitialized();
    const document = await this.documentRepo.findById(documentId);
    return document ? this.mapDocumentEntityToDocument(document) : null;
  }
  
  async getRecipientById(recipientId: string): Promise<Recipient | null> {
    this.ensureInitialized();
    const recipient = await this.recipientRepo.findById(recipientId);
    return recipient ? this.mapRecipientEntityToRecipient(recipient) : null;
  }
  
  /**
   * Save signed document to signed folder
   */
  async saveSignedDocument(transferId: string, fileName: string, data: Buffer): Promise<StorageResult> {
    this.ensureInitialized();
    
    const transfer = await this.getTransfer(transferId);
    if (!transfer) {
      throw new Error('Transfer not found');
    }

    const storagePath = `transfers/${transfer.type}/${transferId}/signed/${fileName}`;
    const result = await this.storage.save(storagePath, data);
    
    logger.info(`Signed document saved: ${fileName} for transfer ${transferId}`, {
      path: result.path,
      size: result.size,
      hash: result.hash
    });
    
    return result;
  }

  /**
   * Get signed document
   */
  async getSignedDocument(transferId: string, fileName: string): Promise<Buffer> {
    this.ensureInitialized();
    
    const transfer = await this.getTransfer(transferId);
    if (!transfer) {
      throw new Error('Transfer not found');
    }

    const storagePath = `transfers/${transfer.type}/${transferId}/signed/${fileName}`;
    return await this.storage.read(storagePath);
  }

  /**
   * Check if document exists
   */
  async documentExists(transferId: string, fileName: string, signed: boolean = false): Promise<boolean> {
    this.ensureInitialized();
    
    const transfer = await this.getTransfer(transferId);
    if (!transfer) {
      return false;
    }

    const folder = signed ? 'signed' : 'documents';
    const storagePath = `transfers/${transfer.type}/${transferId}/${folder}/${fileName}`;
    return await this.storage.exists(storagePath);
  }

  /**
   * Save transfer metadata
   */
  async saveTransferMetadata(transferId: string, metadata: Record<string, unknown>): Promise<StorageResult> {
    this.ensureInitialized();
    
    const transfer = await this.getTransfer(transferId);
    if (!transfer) {
      throw new Error('Transfer not found');
    }

    const storagePath = `transfers/${transfer.type}/${transferId}/metadata.json`;
    const data = Buffer.from(JSON.stringify(metadata, null, 2), 'utf-8');
    return await this.storage.save(storagePath, data);
  }

  /**
   * Get storage status and usage information
   */
  async getStorageInfo(): Promise<{
    storagePath: string;
    storageStatus: Record<string, unknown>;
    databaseConnected: boolean;
    totalTransfers: number;
    totalDocuments: number;
  }> {
    this.ensureInitialized();
    
    const storageStatus = this.storage.getStatus();
    const transferCount = await this.transferRepo.count();
    const documentCount = await this.documentRepo.count();
    
    return {
      storagePath: this.storagePath,
      storageStatus: storageStatus as unknown as Record<string, unknown>,
      databaseConnected: true,
      totalTransfers: transferCount,
      totalDocuments: documentCount
    };
  }

  async close(): Promise<void> {
    if (this.isInitialized) {
      await Promise.all([
        this.database.shutdown(),
        this.storage.shutdown()
      ]);
      this.isInitialized = false;
      logger.info('Storage manager closed');
    }
  }
  
  private ensureInitialized(): void {
    if (!this.isInitialized) {
      throw new Error('StorageManager is not initialized. Call initialize() first.');
    }
  }
  
  // Mapping functions to convert between entity and domain types
  private mapTransferEntityToTransfer(entity: TransferEntity): Transfer {
    return {
      id: entity.id,
      type: entity.type as TransferType,
      status: entity.status as 'pending' | 'ready' | 'partially-signed' | 'completed',
      sender: entity.senderId ? {
        senderId: entity.senderId,
        name: entity.senderName || '',
        email: entity.senderEmail,
        publicKey: entity.senderPublicKey || '',
        transport: entity.transportType,
        timestamp: entity.createdAt.getTime(),
        verificationStatus: 'unverified' as const
      } : undefined,
      transportType: entity.transportType,
      transportConfig: entity.transportConfig,
      metadata: entity.metadata,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt
    };
  }
  
  private mapDocumentEntityToDocument(entity: DocumentEntity): Document {
    return {
      id: entity.id,
      transferId: entity.transferId,
      fileName: entity.fileName,
      fileSize: entity.fileSize,
      fileHash: entity.fileHash,
      status: entity.status as DocumentStatus,
      signedAt: entity.signedAt,
      signedBy: entity.signedBy,
      blockchainTxOriginal: entity.blockchainTxOriginal,
      blockchainTxSigned: entity.blockchainTxSigned,
      createdAt: entity.createdAt
    };
  }
  
  private mapRecipientEntityToRecipient(entity: RecipientEntity): Recipient {
    return {
      id: entity.id,
      transferId: entity.transferId,
      identifier: entity.identifier,
      transport: entity.transport,
      status: entity.status as RecipientStatus,
      preferences: entity.preferences,
      notifiedAt: entity.notifiedAt,
      viewedAt: entity.viewedAt,
      signedAt: entity.signedAt,
      createdAt: entity.createdAt
    };
  }
}