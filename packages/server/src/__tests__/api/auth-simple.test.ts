import { describe, it, expect } from 'vitest';
import request from 'supertest';
import express from 'express';
import { createAuthRoutes, generateTransferCode } from '../../api/routes/auth.js';

describe('Authentication API - Simple', () => {
  const app = express();
  app.use(express.json());
  app.use('/api/auth', createAuthRoutes());

  describe('POST /api/auth/connect', () => {
    it('should handle connect request with valid code', async () => {
      // First generate a transfer code
      const transferId = 'test-transfer-123';
      const code = generateTransferCode(transferId);

      const response = await request(app)
        .post('/api/auth/connect')
        .send({ code })
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('sessionToken');
      expect(response.body).toHaveProperty('transferId', transferId);
      expect(response.body).toHaveProperty('expiresIn', 86400);
    });

    it('should validate required code field', async () => {
      const response = await request(app)
        .post('/api/auth/connect')
        .send({})
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });

    it('should reject invalid transfer code', async () => {
      const response = await request(app)
        .post('/api/auth/connect')
        .send({ code: 'ABC123' }) // Valid format but not registered
        .expect(401);

      expect(response.body).toHaveProperty('error');
    });

    it('should handle invalid code format', async () => {
      const response = await request(app)
        .post('/api/auth/connect')
        .send({ code: '123' }) // Too short
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });
  });

  describe('POST /api/auth/generate-keypair', () => {
    it('should generate keypair', async () => {
      const response = await request(app)
        .post('/api/auth/generate-keypair')
        .expect(200);

      expect(response.body).toHaveProperty('publicKey');
      expect(response.body).toHaveProperty('privateKey');
      expect(response.body.publicKey).toMatch(/^-----BEGIN PUBLIC KEY-----/);
      // node-forge generates RSA PRIVATE KEY format
      expect(response.body.privateKey).toMatch(/^-----BEGIN RSA PRIVATE KEY-----/);
    });

    it('should generate different keypairs on subsequent calls', async () => {
      const response1 = await request(app)
        .post('/api/auth/generate-keypair')
        .expect(200);

      const response2 = await request(app)
        .post('/api/auth/generate-keypair')
        .expect(200);

      expect(response1.body.publicKey).not.toBe(response2.body.publicKey);
      expect(response1.body.privateKey).not.toBe(response2.body.privateKey);
    });
  });
});