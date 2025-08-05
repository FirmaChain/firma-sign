import { DatabaseConnection } from './Database.js';
import { TransferRepository } from './repositories/TransferRepository.js';
import { DocumentRepository } from './repositories/DocumentRepository.js';
import { RecipientRepository } from './repositories/RecipientRepository.js';
import { 
  Transfer, 
  Document, 
  Recipient,
  TransferType,
  TransferStatus,
  DocumentStatus,
  RecipientStatus,
  SenderInfo
} from '../types/database.js';
import { logger } from '../utils/logger.js';

export interface CreateTransferData {
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
}

export interface SignDocumentsData {
  transferId: string;
  signatures: Array<{
    documentId: string;
    status: DocumentStatus;
    signedBy?: string;
    blockchainTxSigned?: string;
  }>;
}

export class TransactionManager {
  private dbConnection: DatabaseConnection;
  private transferRepo: TransferRepository;
  private documentRepo: DocumentRepository;
  private recipientRepo: RecipientRepository;
  
  constructor(dbConnection: DatabaseConnection) {
    this.dbConnection = dbConnection;
    this.transferRepo = new TransferRepository(dbConnection);
    this.documentRepo = new DocumentRepository(dbConnection);
    this.recipientRepo = new RecipientRepository(dbConnection);
  }
  
  createTransferWithDocuments(data: CreateTransferData): {
    transfer: Transfer;
    documents: Document[];
    recipients: Recipient[];
  } {
    const db = this.dbConnection.getDatabase();
    
    return db.transaction(() => {
      const transfer = this.transferRepo.create({
        id: data.transferId,
        type: data.type,
        status: 'pending' as TransferStatus,
        sender: data.sender,
        transportType: 'p2p',
        metadata: data.metadata
      });
      
      const documents: Document[] = [];
      if (data.documents) {
        for (const doc of data.documents) {
          const document = this.documentRepo.create({
            id: doc.id,
            transferId: transfer.id,
            fileName: doc.fileName,
            fileSize: doc.fileSize || 0,
            fileHash: doc.fileHash || '',
            status: 'pending' as DocumentStatus
          });
          documents.push(document);
        }
      }
      
      const recipients: Recipient[] = [];
      if (data.recipients) {
        for (const rec of data.recipients) {
          const recipient = this.recipientRepo.create({
            transferId: transfer.id,
            identifier: rec.identifier,
            transport: rec.transport,
            preferences: rec.preferences,
            status: 'pending' as RecipientStatus
          });
          recipients.push(recipient);
        }
      }
      
      logger.info(`Transfer created with ${documents.length} documents and ${recipients.length} recipients`, {
        transferId: transfer.id
      });
      
      return { transfer, documents, recipients };
    })();
  }
  
  signDocumentsAndUpdateTransfer(data: SignDocumentsData): void {
    const db = this.dbConnection.getDatabase();
    
    db.transaction(() => {
      for (const sig of data.signatures) {
        this.documentRepo.update(sig.documentId, {
          status: sig.status,
          signedBy: sig.signedBy,
          signedAt: sig.status === 'signed' ? new Date() : undefined,
          blockchainTxSigned: sig.blockchainTxSigned
        });
      }
      
      const allDocs = this.documentRepo.findByTransferId(data.transferId);
      const allSigned = allDocs.every(doc => doc.status === 'signed');
      const someSigned = allDocs.some(doc => doc.status === 'signed');
      const someRejected = allDocs.some(doc => doc.status === 'rejected');
      
      let transferStatus: TransferStatus;
      if (allSigned) {
        transferStatus = 'completed';
      } else if (someRejected) {
        transferStatus = 'cancelled';
      } else if (someSigned) {
        transferStatus = 'partially-signed';
      } else {
        transferStatus = 'ready';
      }
      
      this.transferRepo.update(data.transferId, {
        status: transferStatus
      });
      
      logger.info(`Documents signed and transfer updated`, {
        transferId: data.transferId,
        status: transferStatus,
        signedCount: data.signatures.filter(s => s.status === 'signed').length
      });
    })();
  }
  
  deleteTransferAndRelatedData(transferId: string): boolean {
    const db = this.dbConnection.getDatabase();
    
    return db.transaction(() => {
      const documentsDeleted = this.documentRepo.deleteByTransferId(transferId);
      const recipientsDeleted = this.recipientRepo.deleteByTransferId(transferId);
      const transferDeleted = this.transferRepo.delete(transferId);
      
      logger.info(`Transfer and related data deleted`, {
        transferId,
        documentsDeleted,
        recipientsDeleted
      });
      
      return transferDeleted;
    })();
  }
}