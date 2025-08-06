import Database from 'better-sqlite3';
import { TransferEntity } from '@firmachain/firma-sign-core';
import { SQLiteRepository } from '../SQLiteRepository';

export class TransferRepository extends SQLiteRepository<TransferEntity> {
  constructor(db: Database.Database) {
    super(db, 'transfers');
  }

  protected mapRowToEntity(row: Record<string, unknown>): TransferEntity {
    return {
      id: row.id as string,
      type: row.type as 'incoming' | 'outgoing',
      status: row.status as string,
      senderId: row.sender_id as string | undefined,
      senderName: row.sender_name as string | undefined,
      senderEmail: row.sender_email as string | undefined,
      senderPublicKey: row.sender_public_key as string | undefined,
      transportType: row.transport_type as string,
      transportConfig: this.deserializeValue(row.transport_config, 'json'),
      metadata: this.deserializeValue(row.metadata, 'json'),
      createdAt: this.deserializeValue(row.created_at, 'date'),
      updatedAt: this.deserializeValue(row.updated_at, 'date')
    };
  }

  protected mapEntityToRow(entity: Partial<TransferEntity>): Record<string, unknown> {
    const row: Record<string, unknown> = {};
    
    if (entity.id !== undefined) row.id = entity.id;
    if (entity.type !== undefined) row.type = entity.type;
    if (entity.status !== undefined) row.status = entity.status;
    if (entity.senderId !== undefined) row.sender_id = entity.senderId;
    if (entity.senderName !== undefined) row.sender_name = entity.senderName;
    if (entity.senderEmail !== undefined) row.sender_email = entity.senderEmail;
    if (entity.senderPublicKey !== undefined) row.sender_public_key = entity.senderPublicKey;
    if (entity.transportType !== undefined) row.transport_type = entity.transportType;
    if (entity.transportConfig !== undefined) row.transport_config = this.serializeValue(entity.transportConfig);
    if (entity.metadata !== undefined) row.metadata = this.serializeValue(entity.metadata);
    if (entity.createdAt !== undefined) row.created_at = this.serializeValue(entity.createdAt);
    if (entity.updatedAt !== undefined) row.updated_at = this.serializeValue(entity.updatedAt);
    
    return row;
  }

  // Additional methods specific to transfers
  async findByType(type: 'incoming' | 'outgoing'): Promise<TransferEntity[]> {
    return this.find({ type });
  }

  async findByStatus(status: string): Promise<TransferEntity[]> {
    return this.find({ status });
  }

  async findRecent(limit: number = 10): Promise<TransferEntity[]> {
    return this.findAll({ 
      orderBy: { createdAt: 'desc' }, 
      limit 
    });
  }

  async updateStatus(id: string, status: string): Promise<TransferEntity | null> {
    return this.update(id, { status, updatedAt: new Date() });
  }
}