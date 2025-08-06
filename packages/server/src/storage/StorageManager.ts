import { promises as fs } from 'fs';
import path from 'path';
import os from 'os';
import { logger } from '../utils/logger.js';
import { 
  Database,
  Repository,
  TransferEntity,
  DocumentEntity,
  RecipientEntity
} from '@firmachain/firma-sign-core';
import { SQLiteDatabase } from '@firmachain/firma-sign-database-sqlite';
import { 
  Transfer, 
  Document, 
  Recipient,
  TransferType,
  DocumentStatus,
  RecipientStatus,
  SenderInfo
} from '../types/database.js';

export class StorageManager {
  private database: Database;
  private transferRepo!: Repository<TransferEntity>;
  private documentRepo!: Repository<DocumentEntity>;
  private recipientRepo!: Repository<RecipientEntity>;
  private storagePath: string;
  private isInitialized = false;

  constructor(storagePath?: string, database?: Database) {
    this.storagePath = storagePath || path.join(os.homedir(), '.firma-sign');
    this.database = database || new SQLiteDatabase();
    
    // Initialize database and storage asynchronously
    void this.initialize();
  }

  private async initialize() {
    if (this.isInitialized) return;
    
    await this.initializeStorage();
    
    const dbPath = path.join(this.storagePath, 'firma-sign.db');
    await this.database.initialize({
      database: dbPath
    });
    
    this.transferRepo = this.database.getRepository<TransferEntity>('Transfer');
    this.documentRepo = this.database.getRepository<DocumentEntity>('Document');
    this.recipientRepo = this.database.getRepository<RecipientEntity>('Recipient');
    
    this.isInitialized = true;
  }

  private async initializeStorage() {
    const dirs = [
      this.storagePath,
      path.join(this.storagePath, 'transfers'),
      path.join(this.storagePath, 'transfers', 'outgoing'),
      path.join(this.storagePath, 'transfers', 'incoming'),
      path.join(this.storagePath, 'config'),
      path.join(this.storagePath, 'logs')
    ];

    for (const dir of dirs) {
      await fs.mkdir(dir, { recursive: true });
    }
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
    await this.ensureInitialized();
    
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

    const transferDir = path.join(
      this.storagePath,
      'transfers',
      transferData.type,
      transferData.transferId
    );

    await fs.mkdir(path.join(transferDir, 'documents'), { recursive: true });
    await fs.mkdir(path.join(transferDir, 'signed'), { recursive: true });
    
    if (transferData.metadata) {
      await fs.writeFile(
        path.join(transferDir, 'metadata.json'),
        JSON.stringify(transferData.metadata, null, 2)
      );
    }

    return this.mapTransferEntityToTransfer(result.transfer);
  }

  async getTransfer(transferId: string): Promise<Transfer | null> {
    await this.ensureInitialized();
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
    await this.ensureInitialized();
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
    await this.ensureInitialized();
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
    await this.ensureInitialized();
    
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
      
      // Update transfer status if all documents are signed
      const allDocs = await documentRepo.find({ transferId });
      const allSigned = allDocs.every(d => d.status === 'signed');
      
      if (allSigned) {
        await transferRepo.update(transferId, {
          status: 'completed',
          updatedAt: new Date()
        });
      }
    });
  }

  async saveDocument(transferId: string, fileName: string, data: Buffer): Promise<void> {
    const transfer = await this.getTransfer(transferId);
    if (!transfer) {
      throw new Error('Transfer not found');
    }

    const filePath = path.join(
      this.storagePath,
      'transfers',
      transfer.type,
      transferId,
      'documents',
      fileName
    );

    await fs.writeFile(filePath, data);
    logger.info(`Document saved: ${fileName} for transfer ${transferId}`);
  }

  async getDocument(transferId: string, fileName: string): Promise<Buffer> {
    const transfer = await this.getTransfer(transferId);
    if (!transfer) {
      throw new Error('Transfer not found');
    }

    const filePath = path.join(
      this.storagePath,
      'transfers',
      transfer.type,
      transferId,
      'documents',
      fileName
    );

    return await fs.readFile(filePath);
  }

  async updateRecipientStatus(recipientId: string, status: RecipientStatus): Promise<void> {
    await this.ensureInitialized();
    
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
    await this.ensureInitialized();
    
    const updates: Partial<DocumentEntity> = {};
    if (type === 'original') {
      updates.blockchainTxOriginal = txHash;
    } else {
      updates.blockchainTxSigned = txHash;
    }
    
    await this.documentRepo.update(documentId, updates);
  }
  
  async getDocumentsByTransferId(transferId: string): Promise<Document[]> {
    await this.ensureInitialized();
    const documents = await this.documentRepo.find({ transferId });
    return documents.map(d => this.mapDocumentEntityToDocument(d));
  }
  
  async getRecipientsByTransferId(transferId: string): Promise<Recipient[]> {
    await this.ensureInitialized();
    const recipients = await this.recipientRepo.find({ transferId });
    return recipients.map(r => this.mapRecipientEntityToRecipient(r));
  }
  
  async getDocumentById(documentId: string): Promise<Document | null> {
    await this.ensureInitialized();
    const document = await this.documentRepo.findById(documentId);
    return document ? this.mapDocumentEntityToDocument(document) : null;
  }
  
  async getRecipientById(recipientId: string): Promise<Recipient | null> {
    await this.ensureInitialized();
    const recipient = await this.recipientRepo.findById(recipientId);
    return recipient ? this.mapRecipientEntityToRecipient(recipient) : null;
  }
  
  async close(): Promise<void> {
    if (this.isInitialized) {
      await this.database.shutdown();
      this.isInitialized = false;
    }
  }
  
  private async ensureInitialized(): Promise<void> {
    if (!this.isInitialized) {
      await this.initialize();
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