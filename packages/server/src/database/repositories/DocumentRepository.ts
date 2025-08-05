import { BaseRepository } from '../BaseRepository';
import { DatabaseConnection } from '../Database';
import { nanoid } from 'nanoid';
import { Document, DocumentStatus } from '../../types';

export interface DocumentRow {
  id: string;
  transfer_id: string;
  file_name: string;
  file_size: number;
  file_hash: string;
  status: string;
  signed_at: number | null;
  signed_by: string | null;
  blockchain_tx_original: string | null;
  blockchain_tx_signed: string | null;
  created_at: number;
  [key: string]: unknown;
}

export class DocumentRepository extends BaseRepository<Document> {
  constructor(dbConnection: DatabaseConnection) {
    super(dbConnection, 'documents');
  }
  
  create(data: Partial<Document>): Document {
    const id = data.id || nanoid();
    const now = Math.floor(Date.now() / 1000);
    
    const stmt = this.db.prepare(`
      INSERT INTO documents (
        id, transfer_id, file_name, file_size, file_hash, 
        status, signed_at, signed_by, blockchain_tx_original, 
        blockchain_tx_signed, created_at
      ) VALUES (
        @id, @transfer_id, @file_name, @file_size, @file_hash,
        @status, @signed_at, @signed_by, @blockchain_tx_original,
        @blockchain_tx_signed, @created_at
      )
    `);
    
    stmt.run({
      id,
      transfer_id: data.transferId!,
      file_name: data.fileName!,
      file_size: data.fileSize!,
      file_hash: data.fileHash!,
      status: data.status || 'pending',
      signed_at: data.signedAt ? Math.floor(data.signedAt.getTime() / 1000) : null,
      signed_by: data.signedBy || null,
      blockchain_tx_original: data.blockchainTxOriginal || null,
      blockchain_tx_signed: data.blockchainTxSigned || null,
      created_at: now
    });
    
    return this.findById(id)!;
  }
  
  update(id: string, data: Partial<Document>): Document | null {
    const existing = this.findById(id);
    if (!existing) return null;
    
    const updates: string[] = [];
    const params: Record<string, unknown> = { id };
    
    if (data.status !== undefined) {
      updates.push('status = @status');
      params.status = data.status;
    }
    
    if (data.signedAt !== undefined) {
      updates.push('signed_at = @signed_at');
      params.signed_at = Math.floor(data.signedAt.getTime() / 1000);
    }
    
    if (data.signedBy !== undefined) {
      updates.push('signed_by = @signed_by');
      params.signed_by = data.signedBy;
    }
    
    if (data.blockchainTxOriginal !== undefined) {
      updates.push('blockchain_tx_original = @blockchain_tx_original');
      params.blockchain_tx_original = data.blockchainTxOriginal;
    }
    
    if (data.blockchainTxSigned !== undefined) {
      updates.push('blockchain_tx_signed = @blockchain_tx_signed');
      params.blockchain_tx_signed = data.blockchainTxSigned;
    }
    
    if (updates.length === 0) return existing;
    
    const stmt = this.db.prepare(`
      UPDATE documents 
      SET ${updates.join(', ')}
      WHERE id = @id
    `);
    
    stmt.run(params);
    return this.findById(id);
  }
  
  findByTransferId(transferId: string): Document[] {
    const stmt = this.db.prepare('SELECT * FROM documents WHERE transfer_id = ?');
    const rows = stmt.all(transferId);
    return rows.map(row => this.mapRowToEntity(row as DocumentRow));
  }
  
  findByStatus(status: DocumentStatus): Document[] {
    const stmt = this.db.prepare('SELECT * FROM documents WHERE status = ?');
    const rows = stmt.all(status);
    return rows.map(row => this.mapRowToEntity(row as DocumentRow));
  }
  
  findByTransferIdAndStatus(transferId: string, status: DocumentStatus): Document[] {
    const stmt = this.db.prepare(`
      SELECT * FROM documents 
      WHERE transfer_id = ? AND status = ?
    `);
    const rows = stmt.all(transferId, status);
    return rows.map(row => this.mapRowToEntity(row as DocumentRow));
  }
  
  deleteByTransferId(transferId: string): number {
    const stmt = this.db.prepare('DELETE FROM documents WHERE transfer_id = ?');
    const result = stmt.run(transferId);
    return result.changes;
  }
  
  updateBlockchainHash(id: string, type: 'original' | 'signed', txHash: string): boolean {
    const column = type === 'original' ? 'blockchain_tx_original' : 'blockchain_tx_signed';
    const stmt = this.db.prepare(`UPDATE documents SET ${column} = ? WHERE id = ?`);
    const result = stmt.run(txHash, id);
    return result.changes > 0;
  }
  
  protected mapRowToEntity(row: Record<string, unknown>): Document {
    const docRow = row as unknown as DocumentRow;
    return {
      id: docRow.id,
      transferId: docRow.transfer_id,
      fileName: docRow.file_name,
      fileSize: docRow.file_size,
      fileHash: docRow.file_hash,
      status: docRow.status as DocumentStatus,
      signedAt: docRow.signed_at ? new Date(docRow.signed_at * 1000) : undefined,
      signedBy: docRow.signed_by || undefined,
      blockchainTxOriginal: docRow.blockchain_tx_original || undefined,
      blockchainTxSigned: docRow.blockchain_tx_signed || undefined,
      createdAt: new Date(docRow.created_at * 1000)
    };
  }
  
  protected mapEntityToRow(entity: Partial<Document>): Partial<DocumentRow> {
    return {
      transfer_id: entity.transferId,
      file_name: entity.fileName,
      file_size: entity.fileSize,
      file_hash: entity.fileHash,
      status: entity.status,
      signed_at: entity.signedAt ? Math.floor(entity.signedAt.getTime() / 1000) : undefined,
      signed_by: entity.signedBy,
      blockchain_tx_original: entity.blockchainTxOriginal,
      blockchain_tx_signed: entity.blockchainTxSigned
    };
  }
}