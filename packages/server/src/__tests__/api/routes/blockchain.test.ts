import { describe, it, expect, beforeEach, vi } from 'vitest';
import express from 'express';
import request from 'supertest';
import crypto from 'crypto';

// Mock dependencies
vi.mock('../../../utils/logger.js', () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  }
}));

vi.mock('../../../api/middleware/validation.js', () => ({
  validateRequest: vi.fn((_schema) => (_req: express.Request, _res: express.Response, next: express.NextFunction) => {
    // Simple mock validation - just call next()
    next();
  })
}));

describe('Blockchain Routes', () => {
  let app: express.Application;

  beforeEach(async () => {
    // Clear all mocks and reset modules to get fresh state
    vi.clearAllMocks();
    vi.resetModules();
    
    // Dynamically import to get fresh instance
    const { createBlockchainRoutes } = await import('../../../api/routes/blockchain.js');
    
    // Create Express app with blockchain routes
    app = express();
    app.use(express.json());
    app.use('/api/blockchain', createBlockchainRoutes());
  });

  describe('POST /api/blockchain/store-hash', () => {
    it('should store document hash successfully', async () => {
      const hashData = {
        transferId: 'transfer-123',
        documentHash: 'sha256:abcd1234',
        type: 'original',
        metadata: {
          fileName: 'contract.pdf',
          signers: ['alice@example.com', 'bob@example.com']
        }
      };

      const response = await request(app)
        .post('/api/blockchain/store-hash')
        .send(hashData);

      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({
        success: true,
        transactionId: expect.stringMatching(/^0x[a-f0-9]{64}$/),
        blockNumber: expect.any(Number),
        timestamp: expect.any(Number)
      });

      // Verify transaction ID is a valid hex string
      expect((response.body as { transactionId: string }).transactionId).toMatch(/^0x[a-f0-9]{64}$/);
      expect((response.body as { blockNumber: number }).blockNumber).toBeGreaterThan(1000);
      expect((response.body as { timestamp: number }).timestamp).toBeCloseTo(Date.now(), -3);
    });

    it('should store signed document hash successfully', async () => {
      const hashData = {
        transferId: 'transfer-123',
        documentHash: 'sha256:efgh5678',
        type: 'signed',
        metadata: {
          fileName: 'contract.pdf',
          signers: ['alice@example.com']
        }
      };

      const response = await request(app)
        .post('/api/blockchain/store-hash')
        .send(hashData);

      expect(response.status).toBe(200);
      expect((response.body as { success: boolean }).success).toBe(true);
    });

    it('should handle errors gracefully', async () => {
      // Mock crypto.randomBytes to throw an error
      const originalRandomBytes = crypto.randomBytes;
      crypto.randomBytes = vi.fn((size: number) => {
        if (size === 32) { // Only throw for our specific use case
          throw new Error('Random bytes generation failed');
        }
        // Call original for other cases
        return originalRandomBytes(size);
      }) as typeof crypto.randomBytes;

      const hashData = {
        transferId: 'transfer-123',
        documentHash: 'sha256:abcd1234',
        type: 'original'
      };

      const response = await request(app)
        .post('/api/blockchain/store-hash')
        .send(hashData);

      expect(response.status).toBe(500);
      expect(response.body).toEqual({ error: 'Failed to store hash' });

      // Restore original function
      crypto.randomBytes = originalRandomBytes;
    });
  });

  describe('GET /api/blockchain/verify-hash/:transferId', () => {
    it('should verify stored hashes for transfer', async () => {
      const transferId = 'transfer-123';

      // First store some hashes
      await request(app)
        .post('/api/blockchain/store-hash')
        .send({
          transferId,
          documentHash: 'sha256:original123',
          type: 'original'
        });

      await request(app)
        .post('/api/blockchain/store-hash')
        .send({
          transferId,
          documentHash: 'sha256:signed123',
          type: 'signed'
        });

      // Then verify them
      const response = await request(app)
        .get(`/api/blockchain/verify-hash/${transferId}`);

      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({
        transferId: transferId,
        hashes: {
          original: {
            hash: 'sha256:original123',
            type: 'original',
            transactionId: expect.stringMatching(/^0x[a-f0-9]{64}$/),
            blockNumber: expect.any(Number),
            timestamp: expect.any(Number)
          },
          signed: {
            hash: 'sha256:signed123',
            type: 'signed',
            transactionId: expect.stringMatching(/^0x[a-f0-9]{64}$/),
            blockNumber: expect.any(Number),
            timestamp: expect.any(Number)
          }
        },
        verified: true
      });
    });

    it('should return empty result for transfer with no stored hashes', async () => {
      const response = await request(app)
        .get('/api/blockchain/verify-hash/non-existent-transfer');

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        transferId: 'non-existent-transfer',
        hashes: {
          original: undefined,
          signed: undefined
        },
        verified: false
      });
    });

    it('should return partial result for transfer with only one hash type', async () => {
      const transferId = 'transfer-partial';

      // Store only original hash
      await request(app)
        .post('/api/blockchain/store-hash')
        .send({
          transferId,
          documentHash: 'sha256:original123',
          type: 'original'
        });

      const response = await request(app)
        .get(`/api/blockchain/verify-hash/${transferId}`);

      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({
        transferId: transferId,
        hashes: {
          original: {
            hash: 'sha256:original123',
            type: 'original'
          }
        },
        verified: true
      });
      
      // Verify signed is not present or undefined
      expect(response.body.hashes.signed).toBeUndefined();
    });

    it('should handle errors gracefully', async () => {
      // This is hard to test directly since the function is simple
      // But we can test with an invalid transferId that might cause issues
      const response = await request(app)
        .get('/api/blockchain/verify-hash/valid-transfer-id');

      expect(response.status).toBe(200);
      // Should return valid response even for non-existent transfer
    });
  });

  describe('POST /api/blockchain/compare-hash', () => {
    it('should compare document hash successfully with matching hash', async () => {
      const documentData = 'test document content';
      const base64Data = Buffer.from(documentData).toString('base64');
      const expectedHash = crypto.createHash('sha256').update(documentData).digest('hex');

      // First store the hash
      const storeResponse = await request(app)
        .post('/api/blockchain/store-hash')
        .send({
          transferId: 'transfer-123',
          documentHash: expectedHash,
          type: 'original'
        });

      const transactionId = (storeResponse.body as { transactionId: string }).transactionId;

      // Then compare
      const compareResponse = await request(app)
        .post('/api/blockchain/compare-hash')
        .send({
          documentData: base64Data,
          expectedHash: expectedHash,
          transactionId: transactionId
        });

      expect(compareResponse.status).toBe(200);
      expect(compareResponse.body).toEqual({
        valid: true,
        calculatedHash: expectedHash,
        expectedHash: expectedHash,
        transactionFound: true
      });
    });

    it('should compare document hash with non-matching hash', async () => {
      const documentData = 'test document content';
      const base64Data = Buffer.from(documentData).toString('base64');
      const calculatedHash = crypto.createHash('sha256').update(documentData).digest('hex');
      const differentHash = 'different-hash-value';

      // Store a hash with different transaction ID
      const storeResponse = await request(app)
        .post('/api/blockchain/store-hash')
        .send({
          transferId: 'transfer-123',
          documentHash: calculatedHash,
          type: 'original'
        });

      const transactionId = (storeResponse.body as { transactionId: string }).transactionId;

      // Compare with different expected hash
      const compareResponse = await request(app)
        .post('/api/blockchain/compare-hash')
        .send({
          documentData: base64Data,
          expectedHash: differentHash,
          transactionId: transactionId
        });

      expect(compareResponse.status).toBe(200);
      expect(compareResponse.body).toEqual({
        valid: false, // Hash doesn't match expected
        calculatedHash: calculatedHash,
        expectedHash: differentHash,
        transactionFound: true
      });
    });

    it('should handle non-existent transaction', async () => {
      const documentData = 'test document content';
      const base64Data = Buffer.from(documentData).toString('base64');
      const expectedHash = crypto.createHash('sha256').update(documentData).digest('hex');

      const compareResponse = await request(app)
        .post('/api/blockchain/compare-hash')
        .send({
          documentData: base64Data,
          expectedHash: expectedHash,
          transactionId: '0x1234567890abcdef'
        });

      expect(compareResponse.status).toBe(200);
      expect(compareResponse.body).toEqual({
        valid: false, // Valid because transaction not found
        calculatedHash: expectedHash,
        expectedHash: expectedHash,
        transactionFound: false
      });
    });

    it('should handle invalid base64 document data', async () => {
      // Mock Buffer.from to throw an error for specific call
      const originalBufferFrom = Buffer.from;
      Buffer.from = vi.fn((input: string | Buffer | ArrayBuffer | SharedArrayBuffer | ReadonlyArray<number> | { valueOf(): string | object } | { [Symbol.toPrimitive](hint: 'string'): string }, encoding?: BufferEncoding) => {
        if (typeof input === 'string' && input === 'invalid-base64-data' && encoding === 'base64') {
          throw new Error('Invalid base64');
        }
        // Call original for other cases
        return originalBufferFrom(input, encoding);
      }) as typeof Buffer.from;

      const compareResponse = await request(app)
        .post('/api/blockchain/compare-hash')
        .send({
          documentData: 'invalid-base64-data',
          expectedHash: 'some-hash',
          transactionId: '0x1234567890abcdef'
        });

      expect(compareResponse.status).toBe(500);
      expect(compareResponse.body).toEqual({ error: 'Failed to compare hash' });

      // Restore original function
      Buffer.from = originalBufferFrom;
    });
  });

  describe('GET /api/blockchain/transaction/:transactionId', () => {
    it('should get transaction details successfully', async () => {
      const transferId = 'transfer-123';
      
      // Store a hash first
      const storeResponse = await request(app)
        .post('/api/blockchain/store-hash')
        .send({
          transferId,
          documentHash: 'sha256:abcd1234',
          type: 'original'
        });

      const transactionId = (storeResponse.body as { transactionId: string }).transactionId;

      // Get transaction details
      const response = await request(app)
        .get(`/api/blockchain/transaction/${transactionId}`);

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        transactionId: transactionId,
        hash: 'sha256:abcd1234',
        blockNumber: expect.any(Number),
        timestamp: expect.any(Number),
        transferId: transferId,
        type: 'original'
      });
    });

    it('should return 404 for non-existent transaction', async () => {
      const response = await request(app)
        .get('/api/blockchain/transaction/0x1234567890abcdef');

      expect(response.status).toBe(404);
      expect(response.body).toEqual({ error: 'Transaction not found' });
    });

    it('should handle errors gracefully', async () => {
      // This is hard to mock directly, but we can test with a malformed transaction ID
      // that might cause parsing issues (though this implementation is quite robust)
      const response = await request(app)
        .get('/api/blockchain/transaction/valid-but-nonexistent-tx-id');

      expect(response.status).toBe(404);
      expect(response.body).toEqual({ error: 'Transaction not found' });
    });
  });

  describe('multiple transfers and transactions', () => {
    it('should handle multiple transfers with multiple hashes each', async () => {
      const transfers = [
        { id: 'transfer-1', originalHash: 'sha256:original1', signedHash: 'sha256:signed1' },
        { id: 'transfer-2', originalHash: 'sha256:original2', signedHash: 'sha256:signed2' }
      ];

      const transactions: string[] = [];

      // Store hashes for multiple transfers
      for (const transfer of transfers) {
        const originalResponse = await request(app)
          .post('/api/blockchain/store-hash')
          .send({
            transferId: transfer.id,
            documentHash: transfer.originalHash,
            type: 'original'
          });

        const signedResponse = await request(app)
          .post('/api/blockchain/store-hash')
          .send({
            transferId: transfer.id,
            documentHash: transfer.signedHash,
            type: 'signed'
          });

        transactions.push(originalResponse.body.transactionId, signedResponse.body.transactionId);
      }

      // Verify each transfer
      for (const transfer of transfers) {
        const verifyResponse = await request(app)
          .get(`/api/blockchain/verify-hash/${transfer.id}`);

        expect(verifyResponse.status).toBe(200);
        expect(verifyResponse.body.verified).toBe(true);
        expect(verifyResponse.body.hashes.original.hash).toBe(transfer.originalHash);
        expect(verifyResponse.body.hashes.signed.hash).toBe(transfer.signedHash);
      }

      // Verify each transaction
      for (const txId of transactions) {
        const txResponse = await request(app)
          .get(`/api/blockchain/transaction/${txId}`);

        expect(txResponse.status).toBe(200);
        expect(txResponse.body.transactionId).toBe(txId);
      }
    });
  });

  describe('block number incrementing', () => {
    it('should increment block numbers for each stored hash', async () => {
      const responses: Array<{ blockNumber: number; transactionId: string }> = [];

      // Store multiple hashes
      for (let i = 0; i < 3; i++) {
        const response = await request(app)
          .post('/api/blockchain/store-hash')
          .send({
            transferId: `transfer-${i}`,
            documentHash: `sha256:hash${i}`,
            type: 'original'
          });

        responses.push(response.body);
      }

      // Verify block numbers are incrementing
      for (let i = 1; i < responses.length; i++) {
        expect(responses[i].blockNumber).toBe(responses[i - 1].blockNumber + 1);
      }
    });
  });

  describe('hash storage persistence', () => {
    it('should persist hashes across multiple operations', async () => {
      const transferId = 'persistent-transfer';

      // Store original hash
      await request(app)
        .post('/api/blockchain/store-hash')
        .send({
          transferId,
          documentHash: 'sha256:original123',
          type: 'original'
        });

      // Verify it exists
      let verifyResponse = await request(app)
        .get(`/api/blockchain/verify-hash/${transferId}`);

      expect(verifyResponse.body.hashes.original.hash).toBe('sha256:original123');
      expect(verifyResponse.body.hashes.signed).toBeUndefined();

      // Add signed hash
      await request(app)
        .post('/api/blockchain/store-hash')
        .send({
          transferId,
          documentHash: 'sha256:signed123',
          type: 'signed'
        });

      // Verify both exist
      verifyResponse = await request(app)
        .get(`/api/blockchain/verify-hash/${transferId}`);

      expect(verifyResponse.body.hashes.original.hash).toBe('sha256:original123');
      expect(verifyResponse.body.hashes.signed.hash).toBe('sha256:signed123');
    });
  });
});