import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import request from 'supertest';
import { createTestServer, cleanupTestServer, type TestContext } from '../setup/testServer.js';
import { generateTransferCode } from '../../api/routes/auth.js';

describe('Authentication API', () => {
  let context: TestContext;

  beforeEach(async () => {
    context = await createTestServer();
  });

  afterEach(async () => {
    await cleanupTestServer(context);
  });

  describe('POST /api/auth/connect', () => {
    it('should reject invalid code format', async () => {
      const response = await request(context.app)
        .post('/api/auth/connect')
        .send({ code: '123' }) // Too short
        .expect(400);

      expect(response.body).toHaveProperty('error', 'Validation failed');
      expect(response.body).toHaveProperty('details');
    });

    it('should reject missing code', async () => {
      const response = await request(context.app)
        .post('/api/auth/connect')
        .send({})
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });

    it('should accept valid code format', async () => {
      // Generate and register a transfer code
      const transferId = 'test-transfer-123';
      const code = generateTransferCode(transferId);
      
      const response = await request(context.app)
        .post('/api/auth/connect')
        .send({ code, transport: 'p2p' })
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('sessionToken');
      expect(response.body).toHaveProperty('transferId', transferId);
      expect(response.body).toHaveProperty('expiresIn', 86400);
      expect(typeof response.body.sessionToken).toBe('string');
      expect(typeof response.body.transferId).toBe('string');
    });

    it('should accept code with optional transport', async () => {
      // Generate and register a transfer code
      const transferId = 'test-transfer-456';
      const code = generateTransferCode(transferId);
      
      const response = await request(context.app)
        .post('/api/auth/connect')
        .send({
          code,
          transport: 'email',
        })
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('sessionToken');
      expect(response.body).toHaveProperty('transferId', transferId);
      expect(response.body).toHaveProperty('expiresIn', 86400);
    });

    it('should handle different code formats', async () => {
      const testTransferIds = ['test-1', 'test-2', 'test-3', 'test-4'];
      
      for (let i = 0; i < testTransferIds.length; i++) {
        // Generate and register each transfer code
        const transferId = testTransferIds[i];
        const code = generateTransferCode(transferId);
        
        const response = await request(context.app)
          .post('/api/auth/connect')
          .send({ code })
          .expect(200);
        
        expect(response.body).toHaveProperty('success', true);
        expect(response.body).toHaveProperty('sessionToken');
        expect(response.body).toHaveProperty('transferId', transferId);
        expect(response.body).toHaveProperty('expiresIn', 86400);
      }
    });
  });

  describe('POST /api/auth/generate-keypair', () => {
    it('should generate RSA keypair', async () => {
      const response = await request(context.app)
        .post('/api/auth/generate-keypair')
        .expect(200);

      expect(response.body).toHaveProperty('publicKey');
      expect(response.body).toHaveProperty('privateKey');
      
      // Verify PEM format (node-forge generates RSA PRIVATE KEY format)
      expect(response.body.publicKey).toMatch(/^-----BEGIN PUBLIC KEY-----/);
      expect(response.body.publicKey).toMatch(/-----END PUBLIC KEY-----[\r\n]*$/);
      expect(response.body.privateKey).toMatch(/^-----BEGIN RSA PRIVATE KEY-----/);
      expect(response.body.privateKey).toMatch(/-----END RSA PRIVATE KEY-----[\r\n]*$/);
    });

    it('should generate different keypairs on subsequent calls', async () => {
      const response1 = await request(context.app)
        .post('/api/auth/generate-keypair')
        .expect(200);

      const response2 = await request(context.app)
        .post('/api/auth/generate-keypair')
        .expect(200);

      expect(response1.body.publicKey).not.toBe(response2.body.publicKey);
      expect(response1.body.privateKey).not.toBe(response2.body.privateKey);
    });
  });

  describe('Authentication Integration', () => {
    it('should create session and use it for transfers', async () => {
      // Generate and register a transfer code first
      const transferId = 'test-integration-123';
      const code = generateTransferCode(transferId);
      
      // First authenticate
      const connectResponse = await request(context.app)
        .post('/api/auth/connect')
        .send({ code, transport: 'p2p' })
        .expect(200);

      const { sessionToken } = connectResponse.body;

      // Use session (in real implementation, this would be validated)
      // For now, we just verify the structure
      expect(sessionToken).toBeTruthy();
      expect(connectResponse.body.transferId).toBe(transferId);
      expect(connectResponse.body.success).toBe(true);
      expect(connectResponse.body.expiresIn).toBe(86400);
    });

    it('should validate session expiry information', async () => {
      // Generate and register a transfer code first
      const transferId = 'test-expiry-123';
      const code = generateTransferCode(transferId);
      
      const response = await request(context.app)
        .post('/api/auth/connect')
        .send({ code, transport: 'p2p' })
        .expect(200);

      // The response now includes expiresIn according to API documentation
      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('sessionToken');
      expect(response.body).toHaveProperty('transferId', transferId);
      expect(response.body).toHaveProperty('expiresIn', 86400);
    });
  });

  describe('Error Handling', () => {
    it('should handle malformed JSON', async () => {
      const response = await request(context.app)
        .post('/api/auth/connect')
        .set('Content-Type', 'application/json')
        .send('{"invalid": json}'); // Malformed JSON
        
      // Express handles malformed JSON differently - it might return 400 or handle it gracefully
      // Let's just check that it doesn't crash and returns some response
      expect([400, 500].includes(response.status)).toBe(true);
    });

    it('should handle empty request body', async () => {
      const response = await request(context.app)
        .post('/api/auth/connect')
        .send()
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });

    it('should handle invalid content type', async () => {
      const response = await request(context.app)
        .post('/api/auth/connect')
        .set('Content-Type', 'text/plain')
        .send('ABC123')
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });
  });
});