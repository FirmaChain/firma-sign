import { promises as fs } from 'fs';
import path from 'path';
import os from 'os';
import { logger } from '../utils/logger.js';
import { DatabaseConnection } from '../database/Database.js';
import { TransferRepository } from '../database/repositories/TransferRepository.js';
import { DocumentRepository } from '../database/repositories/DocumentRepository.js';
import { RecipientRepository } from '../database/repositories/RecipientRepository.js';
import { TransactionManager } from '../database/TransactionManager.js';
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
  private dbConnection: DatabaseConnection;
  private transferRepo: TransferRepository;
  private documentRepo: DocumentRepository;
  private recipientRepo: RecipientRepository;
  private transactionManager: TransactionManager;
  private storagePath: string;

  constructor(storagePath?: string) {
    this.storagePath = storagePath || path.join(os.homedir(), '.firma-sign');
    void this.initializeStorage();
    
    const dbPath = path.join(this.storagePath, 'firma-sign.db');
    this.dbConnection = DatabaseConnection.getInstance(dbPath);
    
    this.transferRepo = new TransferRepository(this.dbConnection);
    this.documentRepo = new DocumentRepository(this.dbConnection);
    this.recipientRepo = new RecipientRepository(this.dbConnection);
    this.transactionManager = new TransactionManager(this.dbConnection);
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
    const result = this.transactionManager.createTransferWithDocuments(transferData);

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

    return result.transfer;
  }

  getTransfer(transferId: string): Transfer | null {
    const transfer = this.transferRepo.findById(transferId);
    if (!transfer) {
      return null;
    }
    return transfer;
  }
  
  getTransferWithDetails(transferId: string): {
    transfer: Transfer;
    documents: Document[];
    recipients: Recipient[];
  } | null {
    const transfer = this.transferRepo.findById(transferId);
    if (!transfer) {
      return null;
    }
    
    const documents = this.documentRepo.findByTransferId(transferId);
    const recipients = this.recipientRepo.findByTransferId(transferId);
    
    return {
      transfer,
      documents,
      recipients
    };
  }

  listTransfers(type?: TransferType, limit: number = 100): Transfer[] {
    if (type) {
      return this.transferRepo.findByType(type);
    }
    return this.transferRepo.findRecent(limit);
  }

  updateTransferSignatures(transferId: string, signatures: Array<{
    documentId: string;
    status: DocumentStatus;
    signedBy?: string;
    blockchainTxSigned?: string;
  }>): void {
    this.transactionManager.signDocumentsAndUpdateTransfer({
      transferId,
      signatures
    });
  }

  async saveDocument(transferId: string, fileName: string, data: Buffer): Promise<void> {
    const transfer = this.getTransfer(transferId);
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
    const transfer = this.getTransfer(transferId);
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

  updateRecipientStatus(recipientId: string, status: RecipientStatus): void {
    if (status === 'notified') {
      this.recipientRepo.markAsNotified(recipientId);
    } else if (status === 'viewed') {
      this.recipientRepo.markAsViewed(recipientId);
    } else if (status === 'signed') {
      this.recipientRepo.markAsSigned(recipientId);
    } else {
      this.recipientRepo.updateStatus(recipientId, status);
    }
  }
  
  storeBlockchainHash(documentId: string, type: 'original' | 'signed', txHash: string): void {
    this.documentRepo.updateBlockchainHash(documentId, type, txHash);
  }
  
  getDocumentsByTransferId(transferId: string): Document[] {
    return this.documentRepo.findByTransferId(transferId);
  }
  
  getRecipientsByTransferId(transferId: string): Recipient[] {
    return this.recipientRepo.findByTransferId(transferId);
  }
  
  getDocumentById(documentId: string): Document | null {
    return this.documentRepo.findById(documentId);
  }
  
  getRecipientById(recipientId: string): Recipient | null {
    return this.recipientRepo.findById(recipientId);
  }
  
  close(): void {
    this.dbConnection.close();
  }
}