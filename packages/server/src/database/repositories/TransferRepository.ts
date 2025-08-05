import { BaseRepository } from '../BaseRepository';
import { DatabaseConnection } from '../Database';
import { nanoid } from 'nanoid';
import { 
  Transfer, 
  TransferType, 
  TransferStatus
} from '../../types';

export interface TransferRow {
  id: string;
  type: string;
  status: string;
  sender_id: string | null;
  sender_name: string | null;
  sender_email: string | null;
  sender_public_key: string | null;
  transport_type: string;
  transport_config: string | null;
  metadata: string | null;
  created_at: number;
  updated_at: number;
  [key: string]: unknown;
}

export class TransferRepository extends BaseRepository<Transfer> {
  constructor(dbConnection: DatabaseConnection) {
    super(dbConnection, 'transfers');
  }
  
  create(data: Partial<Transfer>): Transfer {
    const id = data.id || nanoid();
    const now = Math.floor(Date.now() / 1000);
    
    const row: TransferRow = {
      id,
      type: data.type || 'outgoing',
      status: data.status || 'pending',
      sender_id: data.sender?.senderId || null,
      sender_name: data.sender?.name || null,
      sender_email: data.sender?.email || null,
      sender_public_key: data.sender?.publicKey || null,
      transport_type: data.transportType || 'p2p',
      transport_config: data.transportConfig ? JSON.stringify(data.transportConfig) : null,
      metadata: data.metadata ? JSON.stringify(data.metadata) : null,
      created_at: now,
      updated_at: now
    };
    
    const stmt = this.db.prepare(`
      INSERT INTO transfers (
        id, type, status, sender_id, sender_name, sender_email, 
        sender_public_key, transport_type, transport_config, metadata,
        created_at, updated_at
      ) VALUES (
        @id, @type, @status, @sender_id, @sender_name, @sender_email,
        @sender_public_key, @transport_type, @transport_config, @metadata,
        @created_at, @updated_at
      )
    `);
    
    stmt.run(row);
    return this.findById(id)!;
  }
  
  update(id: string, data: Partial<Transfer>): Transfer | null {
    const existing = this.findById(id);
    if (!existing) return null;
    
    const updates: string[] = [];
    const params: Record<string, unknown> = { id };
    
    if (data.status !== undefined) {
      updates.push('status = @status');
      params.status = data.status;
    }
    
    if (data.sender !== undefined) {
      updates.push('sender_id = @sender_id');
      updates.push('sender_name = @sender_name');
      updates.push('sender_email = @sender_email');
      updates.push('sender_public_key = @sender_public_key');
      params.sender_id = data.sender.senderId;
      params.sender_name = data.sender.name;
      params.sender_email = data.sender.email || null;
      params.sender_public_key = data.sender.publicKey;
    }
    
    if (data.transportConfig !== undefined) {
      updates.push('transport_config = @transport_config');
      params.transport_config = JSON.stringify(data.transportConfig);
    }
    
    if (data.metadata !== undefined) {
      updates.push('metadata = @metadata');
      params.metadata = JSON.stringify(data.metadata);
    }
    
    updates.push('updated_at = @updated_at');
    params.updated_at = Math.floor(Date.now() / 1000);
    
    const stmt = this.db.prepare(`
      UPDATE transfers 
      SET ${updates.join(', ')}
      WHERE id = @id
    `);
    
    stmt.run(params);
    return this.findById(id);
  }
  
  findByType(type: TransferType): Transfer[] {
    const stmt = this.db.prepare('SELECT * FROM transfers WHERE type = ?');
    const rows = stmt.all(type);
    return rows.map(row => this.mapRowToEntity(row as TransferRow));
  }
  
  findByStatus(status: TransferStatus): Transfer[] {
    const stmt = this.db.prepare('SELECT * FROM transfers WHERE status = ?');
    const rows = stmt.all(status);
    return rows.map(row => this.mapRowToEntity(row as TransferRow));
  }
  
  findRecent(limit: number = 10): Transfer[] {
    const stmt = this.db.prepare(`
      SELECT * FROM transfers 
      ORDER BY created_at DESC 
      LIMIT ?
    `);
    const rows = stmt.all(limit);
    return rows.map(row => this.mapRowToEntity(row as TransferRow));
  }
  
  findByTypeAndStatus(type: TransferType, status: TransferStatus): Transfer[] {
    const stmt = this.db.prepare(`
      SELECT * FROM transfers 
      WHERE type = ? AND status = ?
      ORDER BY created_at DESC
    `);
    const rows = stmt.all(type, status);
    return rows.map(row => this.mapRowToEntity(row as TransferRow));
  }
  
  protected mapRowToEntity(row: Record<string, unknown>): Transfer {
    const transferRow = row as unknown as TransferRow;
    return {
      id: transferRow.id,
      type: transferRow.type as TransferType,
      status: transferRow.status as TransferStatus,
      sender: transferRow.sender_id ? {
        senderId: transferRow.sender_id,
        name: transferRow.sender_name!,
        email: transferRow.sender_email || undefined,
        publicKey: transferRow.sender_public_key!,
        transport: transferRow.transport_type,
        timestamp: transferRow.created_at * 1000,
        verificationStatus: 'unverified'
      } : undefined,
      transportType: transferRow.transport_type,
      transportConfig: transferRow.transport_config ? JSON.parse(transferRow.transport_config) as Record<string, unknown> : undefined,
      metadata: transferRow.metadata ? JSON.parse(transferRow.metadata) as Record<string, unknown> : undefined,
      createdAt: new Date(transferRow.created_at * 1000),
      updatedAt: new Date(transferRow.updated_at * 1000)
    };
  }
  
  protected mapEntityToRow(entity: Partial<Transfer>): Partial<TransferRow> {
    return {
      type: entity.type,
      status: entity.status,
      sender_id: entity.sender?.senderId,
      sender_name: entity.sender?.name,
      sender_email: entity.sender?.email,
      sender_public_key: entity.sender?.publicKey,
      transport_type: entity.transportType,
      transport_config: entity.transportConfig ? JSON.stringify(entity.transportConfig) : undefined,
      metadata: entity.metadata ? JSON.stringify(entity.metadata) : undefined
    };
  }
}