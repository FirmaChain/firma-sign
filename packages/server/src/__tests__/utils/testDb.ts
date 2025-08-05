import { DatabaseConnection } from '../../database/Database';
import fs from 'fs';
import path from 'path';
import os from 'os';

export function createTestDatabase(): DatabaseConnection {
  const testDbPath = path.join(os.tmpdir(), `test-${Date.now()}-${Math.random()}.db`);
  // Reset the singleton instance to ensure each test gets a fresh database
  (DatabaseConnection as unknown as { instance: DatabaseConnection | null }).instance = null;
  return DatabaseConnection.getInstance(testDbPath);
}

export function cleanupTestDatabase(db: DatabaseConnection): void {
  try {
    if (!db) {
      console.warn('Database connection is undefined, skipping cleanup');
      return;
    }
    
    // Access the private db property to get the database path
    const database = db.getDatabase();
    const dbPath = database?.name;
    
    // Close the database connection
    db.close();
    
    // Remove the database file
    if (dbPath && fs.existsSync(dbPath)) {
      fs.unlinkSync(dbPath);
    }
  } catch (error) {
    console.error('Error cleaning up test database:', error);
  }
}

export function seedTestData(db: DatabaseConnection) {
  const database = db.getDatabase();
  
  const transfers = [
    {
      id: 'transfer-1',
      type: 'outgoing',
      status: 'pending',
      sender_id: 'sender-1',
      sender_name: 'Test Sender',
      sender_email: 'sender@test.com',
      sender_public_key: 'test-public-key',
      transport_type: 'p2p',
      transport_config: JSON.stringify({ port: 9090 }),
      metadata: JSON.stringify({ message: 'Test transfer' }),
      created_at: Math.floor(Date.now() / 1000),
      updated_at: Math.floor(Date.now() / 1000)
    },
    {
      id: 'transfer-2',
      type: 'incoming',
      status: 'ready',
      sender_id: 'sender-2',
      sender_name: 'Another Sender',
      sender_email: null,
      sender_public_key: 'another-public-key',
      transport_type: 'email',
      transport_config: null,
      metadata: JSON.stringify({ deadline: '2024-12-31' }),
      created_at: Math.floor(Date.now() / 1000) - 3600,
      updated_at: Math.floor(Date.now() / 1000) - 3600
    }
  ];
  
  const documents = [
    {
      id: 'doc-1',
      transfer_id: 'transfer-1',
      file_name: 'test-doc-1.pdf',
      file_size: 1024,
      file_hash: 'hash-1',
      status: 'pending',
      signed_at: null,
      signed_by: null,
      blockchain_tx_original: null,
      blockchain_tx_signed: null,
      created_at: Math.floor(Date.now() / 1000)
    },
    {
      id: 'doc-2',
      transfer_id: 'transfer-1',
      file_name: 'test-doc-2.pdf',
      file_size: 2048,
      file_hash: 'hash-2',
      status: 'signed',
      signed_at: Math.floor(Date.now() / 1000) - 1800,
      signed_by: 'recipient-1',
      blockchain_tx_original: 'tx-original-1',
      blockchain_tx_signed: 'tx-signed-1',
      created_at: Math.floor(Date.now() / 1000)
    }
  ];
  
  const recipients = [
    {
      id: 'recipient-1',
      transfer_id: 'transfer-1',
      identifier: 'user1@example.com',
      transport: 'email',
      status: 'notified',
      preferences: JSON.stringify({ notificationEnabled: true }),
      notified_at: Math.floor(Date.now() / 1000) - 1800,
      viewed_at: null,
      signed_at: null,
      created_at: Math.floor(Date.now() / 1000)
    },
    {
      id: 'recipient-2',
      transfer_id: 'transfer-1',
      identifier: 'user2@example.com',
      transport: 'p2p',
      status: 'signed',
      preferences: null,
      notified_at: Math.floor(Date.now() / 1000) - 3600,
      viewed_at: Math.floor(Date.now() / 1000) - 2400,
      signed_at: Math.floor(Date.now() / 1000) - 1800,
      created_at: Math.floor(Date.now() / 1000)
    }
  ];
  
  database.transaction(() => {
    for (const transfer of transfers) {
      database.prepare(`
        INSERT INTO transfers (
          id, type, status, sender_id, sender_name, sender_email,
          sender_public_key, transport_type, transport_config, metadata,
          created_at, updated_at
        ) VALUES (
          @id, @type, @status, @sender_id, @sender_name, @sender_email,
          @sender_public_key, @transport_type, @transport_config, @metadata,
          @created_at, @updated_at
        )
      `).run(transfer);
    }
    
    for (const doc of documents) {
      database.prepare(`
        INSERT INTO documents (
          id, transfer_id, file_name, file_size, file_hash, status,
          signed_at, signed_by, blockchain_tx_original, blockchain_tx_signed,
          created_at
        ) VALUES (
          @id, @transfer_id, @file_name, @file_size, @file_hash, @status,
          @signed_at, @signed_by, @blockchain_tx_original, @blockchain_tx_signed,
          @created_at
        )
      `).run(doc);
    }
    
    for (const recipient of recipients) {
      database.prepare(`
        INSERT INTO recipients (
          id, transfer_id, identifier, transport, status, preferences,
          notified_at, viewed_at, signed_at, created_at
        ) VALUES (
          @id, @transfer_id, @identifier, @transport, @status, @preferences,
          @notified_at, @viewed_at, @signed_at, @created_at
        )
      `).run(recipient);
    }
  })();
}