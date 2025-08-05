import { BaseRepository } from '../BaseRepository';
import { DatabaseConnection } from '../Database';
import { nanoid } from 'nanoid';
import { Recipient, RecipientStatus } from '../../types';

export interface RecipientRow {
  id: string;
  transfer_id: string;
  identifier: string;
  transport: string;
  status: string;
  preferences: string | null;
  notified_at: number | null;
  viewed_at: number | null;
  signed_at: number | null;
  created_at: number;
  [key: string]: unknown;
}

export class RecipientRepository extends BaseRepository<Recipient> {
  constructor(dbConnection: DatabaseConnection) {
    super(dbConnection, 'recipients');
  }
  
  create(data: Partial<Recipient>): Recipient {
    const id = data.id || nanoid();
    const now = Math.floor(Date.now() / 1000);
    
    const stmt = this.db.prepare(`
      INSERT INTO recipients (
        id, transfer_id, identifier, transport, status,
        preferences, notified_at, viewed_at, signed_at, created_at
      ) VALUES (
        @id, @transfer_id, @identifier, @transport, @status,
        @preferences, @notified_at, @viewed_at, @signed_at, @created_at
      )
    `);
    
    stmt.run({
      id,
      transfer_id: data.transferId!,
      identifier: data.identifier!,
      transport: data.transport!,
      status: data.status || 'pending',
      preferences: data.preferences ? JSON.stringify(data.preferences) : null,
      notified_at: data.notifiedAt ? Math.floor(data.notifiedAt.getTime() / 1000) : null,
      viewed_at: data.viewedAt ? Math.floor(data.viewedAt.getTime() / 1000) : null,
      signed_at: data.signedAt ? Math.floor(data.signedAt.getTime() / 1000) : null,
      created_at: now
    });
    
    return this.findById(id)!;
  }
  
  update(id: string, data: Partial<Recipient>): Recipient | null {
    const existing = this.findById(id);
    if (!existing) return null;
    
    const updates: string[] = [];
    const params: Record<string, unknown> = { id };
    
    if (data.status !== undefined) {
      updates.push('status = @status');
      params.status = data.status;
    }
    
    if (data.preferences !== undefined) {
      updates.push('preferences = @preferences');
      params.preferences = JSON.stringify(data.preferences);
    }
    
    if (data.notifiedAt !== undefined) {
      updates.push('notified_at = @notified_at');
      params.notified_at = Math.floor(data.notifiedAt.getTime() / 1000);
    }
    
    if (data.viewedAt !== undefined) {
      updates.push('viewed_at = @viewed_at');
      params.viewed_at = Math.floor(data.viewedAt.getTime() / 1000);
    }
    
    if (data.signedAt !== undefined) {
      updates.push('signed_at = @signed_at');
      params.signed_at = Math.floor(data.signedAt.getTime() / 1000);
    }
    
    if (updates.length === 0) return existing;
    
    const stmt = this.db.prepare(`
      UPDATE recipients 
      SET ${updates.join(', ')}
      WHERE id = @id
    `);
    
    stmt.run(params);
    return this.findById(id);
  }
  
  findByTransferId(transferId: string): Recipient[] {
    const stmt = this.db.prepare('SELECT * FROM recipients WHERE transfer_id = ?');
    const rows = stmt.all(transferId);
    return rows.map(row => this.mapRowToEntity(row as RecipientRow));
  }
  
  findByIdentifier(identifier: string): Recipient[] {
    const stmt = this.db.prepare('SELECT * FROM recipients WHERE identifier = ?');
    const rows = stmt.all(identifier);
    return rows.map(row => this.mapRowToEntity(row as RecipientRow));
  }
  
  findByTransferIdAndStatus(transferId: string, status: RecipientStatus): Recipient[] {
    const stmt = this.db.prepare(`
      SELECT * FROM recipients 
      WHERE transfer_id = ? AND status = ?
    `);
    const rows = stmt.all(transferId, status);
    return rows.map(row => this.mapRowToEntity(row as RecipientRow));
  }
  
  findPendingByTransport(transport: string): Recipient[] {
    const stmt = this.db.prepare(`
      SELECT * FROM recipients 
      WHERE transport = ? AND status = 'pending'
      ORDER BY created_at ASC
    `);
    const rows = stmt.all(transport);
    return rows.map(row => this.mapRowToEntity(row as RecipientRow));
  }
  
  updateStatus(id: string, status: RecipientStatus): boolean {
    const stmt = this.db.prepare('UPDATE recipients SET status = ? WHERE id = ?');
    const result = stmt.run(status, id);
    return result.changes > 0;
  }
  
  markAsNotified(id: string): boolean {
    const stmt = this.db.prepare(`
      UPDATE recipients 
      SET notified_at = ?, status = 'notified' 
      WHERE id = ?
    `);
    const result = stmt.run(Math.floor(Date.now() / 1000), id);
    return result.changes > 0;
  }
  
  markAsViewed(id: string): boolean {
    const stmt = this.db.prepare(`
      UPDATE recipients 
      SET viewed_at = ?, status = 'viewed' 
      WHERE id = ?
    `);
    const result = stmt.run(Math.floor(Date.now() / 1000), id);
    return result.changes > 0;
  }
  
  markAsSigned(id: string): boolean {
    const stmt = this.db.prepare(`
      UPDATE recipients 
      SET signed_at = ?, status = 'signed' 
      WHERE id = ?
    `);
    const result = stmt.run(Math.floor(Date.now() / 1000), id);
    return result.changes > 0;
  }
  
  deleteByTransferId(transferId: string): number {
    const stmt = this.db.prepare('DELETE FROM recipients WHERE transfer_id = ?');
    const result = stmt.run(transferId);
    return result.changes;
  }
  
  protected mapRowToEntity(row: Record<string, unknown>): Recipient {
    const recipientRow = row as unknown as RecipientRow;
    return {
      id: recipientRow.id,
      transferId: recipientRow.transfer_id,
      identifier: recipientRow.identifier,
      transport: recipientRow.transport,
      status: recipientRow.status as RecipientStatus,
      preferences: recipientRow.preferences ? JSON.parse(recipientRow.preferences) as Record<string, unknown> : undefined,
      notifiedAt: recipientRow.notified_at ? new Date(recipientRow.notified_at * 1000) : undefined,
      viewedAt: recipientRow.viewed_at ? new Date(recipientRow.viewed_at * 1000) : undefined,
      signedAt: recipientRow.signed_at ? new Date(recipientRow.signed_at * 1000) : undefined,
      createdAt: new Date(recipientRow.created_at * 1000)
    };
  }
  
  protected mapEntityToRow(entity: Partial<Recipient>): Partial<RecipientRow> {
    return {
      transfer_id: entity.transferId,
      identifier: entity.identifier,
      transport: entity.transport,
      status: entity.status,
      preferences: entity.preferences ? JSON.stringify(entity.preferences) : undefined,
      notified_at: entity.notifiedAt ? Math.floor(entity.notifiedAt.getTime() / 1000) : undefined,
      viewed_at: entity.viewedAt ? Math.floor(entity.viewedAt.getTime() / 1000) : undefined,
      signed_at: entity.signedAt ? Math.floor(entity.signedAt.getTime() / 1000) : undefined
    };
  }
}