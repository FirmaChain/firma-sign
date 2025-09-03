import Database from 'better-sqlite3';
import { DocumentEntity } from '@firmachain/firma-sign-core';
import { SQLiteRepository } from '../SQLiteRepository';

export class DocumentRepository extends SQLiteRepository<DocumentEntity> {
  constructor(db: Database.Database) {
    super(db, 'documents');
  }

  protected mapRowToEntity(row: Record<string, unknown>): DocumentEntity {
    return {
      id: row.id as string,
      transferId: row.transfer_id as string,
      fileName: row.file_name as string,
      fileSize: row.file_size as number,
      fileHash: row.file_hash as string,
      status: row.status as string,
      signedAt: row.signed_at ? this.deserializeValue(row.signed_at, 'date') as Date : undefined,
      signedBy: row.signed_by as string | undefined,
      blockchainTxOriginal: row.blockchain_tx_original as string | undefined,
      blockchainTxSigned: row.blockchain_tx_signed as string | undefined,
      createdAt: this.deserializeValue(row.created_at, 'date')
    };
  }

  protected mapEntityToRow(entity: Partial<DocumentEntity>): Record<string, unknown> {
    const row: Record<string, unknown> = {};
    
    if (entity.id !== undefined) row.id = entity.id;
    if (entity.transferId !== undefined) row.transfer_id = entity.transferId;
    if (entity.fileName !== undefined) row.file_name = entity.fileName;
    if (entity.fileSize !== undefined) row.file_size = entity.fileSize;
    if (entity.fileHash !== undefined) row.file_hash = entity.fileHash;
    if (entity.status !== undefined) row.status = entity.status;
    if (entity.signedAt !== undefined) row.signed_at = this.serializeValue(entity.signedAt);
    if (entity.signedBy !== undefined) row.signed_by = entity.signedBy;
    if (entity.blockchainTxOriginal !== undefined) row.blockchain_tx_original = entity.blockchainTxOriginal;
    if (entity.blockchainTxSigned !== undefined) row.blockchain_tx_signed = entity.blockchainTxSigned;
    if (entity.createdAt !== undefined) row.created_at = this.serializeValue(entity.createdAt);
    
    return row;
  }

  // Additional methods specific to documents
  async findByTransferId(transferId: string): Promise<DocumentEntity[]> {
    return this.find({ transferId });
  }

  async findByStatus(status: string): Promise<DocumentEntity[]> {
    return this.find({ status });
  }

  async markAsSigned(id: string, signedBy: string): Promise<DocumentEntity | null> {
    return this.update(id, {
      status: 'signed',
      signedAt: new Date(),
      signedBy
    });
  }

  async updateBlockchainHash(
    id: string, 
    type: 'original' | 'signed', 
    txHash: string
  ): Promise<DocumentEntity | null> {
    const updateData: Partial<DocumentEntity> = {};
    
    if (type === 'original') {
      updateData.blockchainTxOriginal = txHash;
    } else {
      updateData.blockchainTxSigned = txHash;
    }
    
    return this.update(id, updateData);
  }
}