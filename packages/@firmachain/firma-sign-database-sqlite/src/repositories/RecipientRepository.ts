import Database from 'better-sqlite3';
import { RecipientEntity } from '@firmachain/firma-sign-core';
import { SQLiteRepository } from '../SQLiteRepository';

export class RecipientRepository extends SQLiteRepository<RecipientEntity> {
  constructor(db: Database.Database) {
    super(db, 'recipients');
  }

  protected mapRowToEntity(row: Record<string, unknown>): RecipientEntity {
    return {
      id: row.id as string,
      transferId: row.transfer_id as string,
      identifier: row.identifier as string,
      transport: row.transport as string,
      status: row.status as string,
      preferences: this.deserializeValue(row.preferences, 'json'),
      notifiedAt: row.notified_at ? this.deserializeValue(row.notified_at, 'date') : undefined,
      viewedAt: row.viewed_at ? this.deserializeValue(row.viewed_at, 'date') : undefined,
      signedAt: row.signed_at ? this.deserializeValue(row.signed_at, 'date') : undefined,
      createdAt: this.deserializeValue(row.created_at, 'date')
    };
  }

  protected mapEntityToRow(entity: Partial<RecipientEntity>): Record<string, unknown> {
    const row: Record<string, unknown> = {};
    
    if (entity.id !== undefined) row.id = entity.id;
    if (entity.transferId !== undefined) row.transfer_id = entity.transferId;
    if (entity.identifier !== undefined) row.identifier = entity.identifier;
    if (entity.transport !== undefined) row.transport = entity.transport;
    if (entity.status !== undefined) row.status = entity.status;
    if (entity.preferences !== undefined) row.preferences = this.serializeValue(entity.preferences);
    if (entity.notifiedAt !== undefined) row.notified_at = this.serializeValue(entity.notifiedAt);
    if (entity.viewedAt !== undefined) row.viewed_at = this.serializeValue(entity.viewedAt);
    if (entity.signedAt !== undefined) row.signed_at = this.serializeValue(entity.signedAt);
    if (entity.createdAt !== undefined) row.created_at = this.serializeValue(entity.createdAt);
    
    return row;
  }

  // Additional methods specific to recipients
  async findByTransferId(transferId: string): Promise<RecipientEntity[]> {
    return this.find({ transferId });
  }

  async findByStatus(status: string): Promise<RecipientEntity[]> {
    return this.find({ status });
  }

  async markAsNotified(id: string): Promise<RecipientEntity | null> {
    return this.update(id, {
      status: 'notified',
      notifiedAt: new Date()
    });
  }

  async markAsViewed(id: string): Promise<RecipientEntity | null> {
    return this.update(id, {
      status: 'viewed',
      viewedAt: new Date()
    });
  }

  async markAsSigned(id: string): Promise<RecipientEntity | null> {
    return this.update(id, {
      status: 'signed',
      signedAt: new Date()
    });
  }

  async updateStatus(id: string, status: string): Promise<RecipientEntity | null> {
    return this.update(id, { status });
  }
}