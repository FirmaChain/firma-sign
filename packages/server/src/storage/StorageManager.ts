import { promises as fs } from 'fs';
import path from 'path';
import os from 'os';
import Database from 'better-sqlite3';
import { logger } from '../utils/logger.js';

export interface Transfer {
  transferId: string;
  type: 'incoming' | 'outgoing';
  documents: any[];
  recipients?: any[];
  sender?: any;
  metadata: any;
  status: string;
  createdAt: number;
  updatedAt: number;
}

export class StorageManager {
  private db: Database.Database;
  private storagePath: string;

  constructor(storagePath?: string) {
    this.storagePath = storagePath || path.join(os.homedir(), '.firmasign');
    this.initializeStorage();
    this.db = new Database(path.join(this.storagePath, 'firma-sign.db'));
    this.initializeDatabase();
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

  private initializeDatabase() {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS transfers (
        transferId TEXT PRIMARY KEY,
        type TEXT NOT NULL,
        status TEXT NOT NULL,
        metadata TEXT NOT NULL,
        createdAt INTEGER NOT NULL,
        updatedAt INTEGER NOT NULL
      );

      CREATE TABLE IF NOT EXISTS documents (
        id TEXT PRIMARY KEY,
        transferId TEXT NOT NULL,
        fileName TEXT NOT NULL,
        fileSize INTEGER,
        hash TEXT,
        status TEXT DEFAULT 'pending',
        FOREIGN KEY (transferId) REFERENCES transfers(transferId)
      );

      CREATE TABLE IF NOT EXISTS recipients (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        transferId TEXT NOT NULL,
        identifier TEXT NOT NULL,
        transport TEXT NOT NULL,
        status TEXT DEFAULT 'pending',
        preferences TEXT,
        FOREIGN KEY (transferId) REFERENCES transfers(transferId)
      );

      CREATE INDEX IF NOT EXISTS idx_transfers_type ON transfers(type);
      CREATE INDEX IF NOT EXISTS idx_transfers_status ON transfers(status);
      CREATE INDEX IF NOT EXISTS idx_documents_transfer ON documents(transferId);
      CREATE INDEX IF NOT EXISTS idx_recipients_transfer ON recipients(transferId);
    `);
  }

  async createTransfer(transfer: Partial<Transfer>): Promise<void> {
    const now = Date.now();
    const insertTransfer = this.db.prepare(`
      INSERT INTO transfers (transferId, type, status, metadata, createdAt, updatedAt)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    const insertDocument = this.db.prepare(`
      INSERT INTO documents (id, transferId, fileName, fileSize, hash)
      VALUES (?, ?, ?, ?, ?)
    `);

    const insertRecipient = this.db.prepare(`
      INSERT INTO recipients (transferId, identifier, transport, preferences)
      VALUES (?, ?, ?, ?)
    `);

    this.db.transaction(() => {
      insertTransfer.run(
        transfer.transferId,
        transfer.type,
        'created',
        JSON.stringify(transfer.metadata || {}),
        now,
        now
      );

      if (transfer.documents) {
        for (const doc of transfer.documents) {
          insertDocument.run(
            doc.id,
            transfer.transferId,
            doc.fileName,
            doc.fileSize || 0,
            doc.hash || null
          );
        }
      }

      if (transfer.recipients) {
        for (const recipient of transfer.recipients) {
          insertRecipient.run(
            transfer.transferId,
            recipient.identifier,
            recipient.transport,
            JSON.stringify(recipient.preferences || {})
          );
        }
      }
    })();

    const transferDir = path.join(
      this.storagePath,
      'transfers',
      transfer.type!,
      transfer.transferId!
    );

    await fs.mkdir(path.join(transferDir, 'documents'), { recursive: true });
    await fs.mkdir(path.join(transferDir, 'signed'), { recursive: true });
    
    if (transfer.metadata) {
      await fs.writeFile(
        path.join(transferDir, 'metadata.json'),
        JSON.stringify(transfer.metadata, null, 2)
      );
    }

    logger.info(`Transfer created: ${transfer.transferId}`);
  }

  async getTransfer(transferId: string): Promise<Transfer | null> {
    const transfer = this.db.prepare(`
      SELECT * FROM transfers WHERE transferId = ?
    `).get(transferId) as any;

    if (!transfer) {
      return null;
    }

    const documents = this.db.prepare(`
      SELECT * FROM documents WHERE transferId = ?
    `).all(transferId);

    const recipients = this.db.prepare(`
      SELECT * FROM recipients WHERE transferId = ?
    `).all(transferId);

    return {
      ...transfer,
      metadata: JSON.parse(transfer.metadata),
      documents,
      recipients: recipients.map((r: any) => ({
        ...r,
        preferences: JSON.parse(r.preferences)
      }))
    };
  }

  async listTransfers(): Promise<Transfer[]> {
    const transfers = this.db.prepare(`
      SELECT * FROM transfers ORDER BY createdAt DESC LIMIT 100
    `).all() as any[];

    return transfers.map(t => ({
      ...t,
      metadata: JSON.parse(t.metadata)
    }));
  }

  async updateTransferSignatures(transferId: string, signatures: any[]): Promise<void> {
    const updateDocument = this.db.prepare(`
      UPDATE documents SET status = ? WHERE transferId = ? AND id = ?
    `);

    const updateTransfer = this.db.prepare(`
      UPDATE transfers SET status = ?, updatedAt = ? WHERE transferId = ?
    `);

    this.db.transaction(() => {
      for (const sig of signatures) {
        updateDocument.run(sig.status, transferId, sig.documentId);
      }
      updateTransfer.run('partially-signed', Date.now(), transferId);
    })();

    logger.info(`Updated signatures for transfer: ${transferId}`);
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

  close(): void {
    this.db.close();
  }
}