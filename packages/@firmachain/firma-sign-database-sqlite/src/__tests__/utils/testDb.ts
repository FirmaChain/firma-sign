import { SQLiteDatabase } from '../../SQLiteDatabase';
import { TransferEntity, DocumentEntity, RecipientEntity } from '@firmachain/firma-sign-core';
import fs from 'fs';
import path from 'path';
import os from 'os';

export async function createTestDatabase(): Promise<SQLiteDatabase> {
  const testDbPath = path.join(os.tmpdir(), `test-${Date.now()}-${Math.random()}.db`);
  const database = new SQLiteDatabase();
  await database.initialize({
    database: testDbPath
  });
  return database;
}

export async function cleanupTestDatabase(database: SQLiteDatabase): Promise<void> {
  try {
    const db = database.getDatabaseInstance();
    const dbPath = db?.name;
    
    // Shutdown the database
    await database.shutdown();
    
    // Remove the database file
    if (dbPath && fs.existsSync(dbPath)) {
      fs.unlinkSync(dbPath);
    }
  } catch (error) {
    console.error('Error cleaning up test database:', error);
  }
}

export async function seedTestData(database: SQLiteDatabase): Promise<void> {
  const transferRepo = database.getRepository<TransferEntity>('Transfer');
  const documentRepo = database.getRepository<DocumentEntity>('Document');
  const recipientRepo = database.getRepository<RecipientEntity>('Recipient');
  
  // Create test transfers
  await transferRepo.create({
    id: 'transfer-1',
    type: 'outgoing',
    status: 'pending',
    senderId: 'sender-1',
    senderName: 'Test Sender',
    senderEmail: 'sender@test.com',
    senderPublicKey: 'test-public-key',
    transportType: 'p2p',
    transportConfig: { port: 9090 },
    metadata: { message: 'Test transfer' },
    createdAt: new Date(),
    updatedAt: new Date()
  });
  
  await transferRepo.create({
    id: 'transfer-2',
    type: 'incoming',
    status: 'ready',
    senderId: 'sender-2',
    senderName: 'Another Sender',
    senderEmail: undefined,
    senderPublicKey: 'another-public-key',
    transportType: 'email',
    transportConfig: undefined,
    metadata: { deadline: '2024-12-31' },
    createdAt: new Date(Date.now() - 3600000),
    updatedAt: new Date(Date.now() - 3600000)
  });
  
  // Create test documents
  await documentRepo.create({
    id: 'doc-1',
    transferId: 'transfer-1',
    fileName: 'test-doc-1.pdf',
    fileSize: 1024,
    fileHash: 'hash-1',
    status: 'pending',
    createdAt: new Date()
  });
  
  await documentRepo.create({
    id: 'doc-2',
    transferId: 'transfer-1',
    fileName: 'test-doc-2.pdf',
    fileSize: 2048,
    fileHash: 'hash-2',
    status: 'signed',
    signedAt: new Date(Date.now() - 1800000),
    signedBy: 'recipient-1',
    blockchainTxOriginal: 'tx-original-1',
    blockchainTxSigned: 'tx-signed-1',
    createdAt: new Date()
  });
  
  // Create test recipients
  await recipientRepo.create({
    id: 'recipient-1',
    transferId: 'transfer-1',
    identifier: 'user1@example.com',
    transport: 'email',
    status: 'notified',
    preferences: { notificationEnabled: true },
    notifiedAt: new Date(Date.now() - 1800000),
    createdAt: new Date()
  });
  
  await recipientRepo.create({
    id: 'recipient-2',
    transferId: 'transfer-1',
    identifier: 'user2@example.com',
    transport: 'p2p',
    status: 'signed',
    notifiedAt: new Date(Date.now() - 3600000),
    viewedAt: new Date(Date.now() - 2400000),
    signedAt: new Date(Date.now() - 1800000),
    createdAt: new Date()
  });
}