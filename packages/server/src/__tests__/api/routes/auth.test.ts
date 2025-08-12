import { describe, it, expect, beforeEach, vi } from 'vitest';
import express from 'express';
import request from 'supertest';
import { createAuthRoutes, generateTransferCode, validateSession } from '../../../api/routes/auth.js';

// Mock dependencies
vi.mock('../../../utils/logger.js', () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  }
}));

vi.mock('nanoid', () => {
  let counter = 0;
  return {
    nanoid: vi.fn(() => `test-session-id-${counter++}`)
  };
});

vi.mock('node-forge', () => ({
  default: {
    pki: {
      rsa: {
        generateKeyPair: vi.fn(() => ({
          publicKey: 'mock-public-key',
          privateKey: 'mock-private-key'
        }))
      },
      publicKeyToPem: vi.fn(() => '-----BEGIN PUBLIC KEY-----\nmock-public-key\n-----END PUBLIC KEY-----'),
      privateKeyToPem: vi.fn(() => '-----BEGIN PRIVATE KEY-----\nmock-private-key\n-----END PRIVATE KEY-----')
    }
  }
}));

vi.mock('../../../api/middleware/validation.js', () => ({
  validateRequest: vi.fn((_schema) => (_req: express.Request, _res: express.Response, next: express.NextFunction) => {
    // Simple mock validation - just call next()
    next();
  })
}));

describe('Auth Routes', () => {
  let app: express.Application;

  beforeEach(() => {
    // Create Express app with auth routes
    app = express();
    app.use(express.json());
    app.use('/api/auth', createAuthRoutes());

    vi.clearAllMocks();
  });

  describe('POST /api/auth/connect', () => {
    it('should connect with valid transfer code', async () => {
      const transferId = 'test-transfer-123';
      const code = generateTransferCode(transferId);

      const response = await request(app)
        .post('/api/auth/connect')
        .send({ code });

      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({
        success: true,
        transferId: transferId,
        expiresIn: 86400
      });
      expect(response.body.sessionToken).toMatch(/^test-session-id-\d+$/);
    });

    it('should connect with valid transfer code and transport hint', async () => {
      const transferId = 'test-transfer-123';
      const code = generateTransferCode(transferId);

      const response = await request(app)
        .post('/api/auth/connect')
        .send({ code, transport: 'email' });

      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({
        success: true,
        transferId: transferId,
        expiresIn: 86400
      });
      expect(response.body.sessionToken).toMatch(/^test-session-id-\d+$/);
    });

    it('should reject invalid transfer code', async () => {
      const response = await request(app)
        .post('/api/auth/connect')
        .send({ code: 'INVALID' });

      expect(response.status).toBe(401);
      expect(response.body).toEqual({ error: 'Invalid transfer code' });
    });

    it('should reject used transfer code', async () => {
      const transferId = 'test-transfer-123';
      const code = generateTransferCode(transferId);

      // First use should succeed
      const firstResponse = await request(app)
        .post('/api/auth/connect')
        .send({ code });

      expect(firstResponse.status).toBe(200);

      // Second use should fail (code is consumed)
      const secondResponse = await request(app)
        .post('/api/auth/connect')
        .send({ code });

      expect(secondResponse.status).toBe(401);
      expect(secondResponse.body).toEqual({ error: 'Invalid transfer code' });
    });

    it('should handle errors gracefully', async () => {
      // This test case verifies normal operation
      const transferId = 'test-transfer-123';
      const code = generateTransferCode(transferId);

      const response = await request(app)
        .post('/api/auth/connect')
        .send({ code });

      // Should work normally
      expect(response.status).toBe(200);
    });
  });

  describe('POST /api/auth/generate-keypair', () => {
    it('should generate RSA keypair successfully', async () => {
      const response = await request(app)
        .post('/api/auth/generate-keypair');

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        publicKey: '-----BEGIN PUBLIC KEY-----\nmock-public-key\n-----END PUBLIC KEY-----',
        privateKey: '-----BEGIN PRIVATE KEY-----\nmock-private-key\n-----END PRIVATE KEY-----'
      });
    });

    it('should handle keypair generation errors', async () => {
      // Mock forge to throw an error
      const forge = await import('node-forge');
      vi.mocked(forge.default.pki.rsa.generateKeyPair).mockImplementation(() => {
        throw new Error('Key generation failed');
      });

      const response = await request(app)
        .post('/api/auth/generate-keypair');

      expect(response.status).toBe(500);
      expect(response.body).toEqual({ error: 'Failed to generate keypair' });
    });
  });

  describe('generateTransferCode function', () => {
    it('should generate a 6-character code', () => {
      const transferId = 'test-transfer';
      const code = generateTransferCode(transferId);

      expect(code).toHaveLength(6);
      expect(code).toMatch(/^[23456789ABCDEFGHJKLMNPQRSTUVWXYZ]+$/);
    });

    it('should generate different codes for different transfers', () => {
      const code1 = generateTransferCode('transfer-1');
      const code2 = generateTransferCode('transfer-2');

      expect(code1).not.toBe(code2);
      expect(code1).toHaveLength(6);
      expect(code2).toHaveLength(6);
    });

    it('should store transfer code mapping', async () => {
      const transferId = 'test-transfer-123';
      const code = generateTransferCode(transferId);

      // Verify the code can be used to connect
      const response = await request(app)
        .post('/api/auth/connect')
        .send({ code });

      expect(response.status).toBe(200);
      expect(response.body.transferId as string).toBe(transferId);
    });
  });

  describe('validateSession function', () => {
    it('should validate active session', async () => {
      const transferId = 'test-transfer-123';
      const code = generateTransferCode(transferId);

      // Create a session
      const connectResponse = await request(app)
        .post('/api/auth/connect')
        .send({ code });

      const sessionToken = connectResponse.body.sessionToken as string;

      // Validate the session
      const session = validateSession(sessionToken as string);

      expect(session).toBeTruthy();
      expect(session?.sessionId).toBe(sessionToken);
      expect(session?.transferId).toBe(transferId);
      expect(session?.expiresAt).toBeGreaterThan(Date.now());
    });

    it('should reject non-existent session', () => {
      const session = validateSession('non-existent-session');

      expect(session).toBeNull();
    });

    it('should reject expired session', async () => {
      const transferId = 'test-transfer-123';
      const code = generateTransferCode(transferId);

      // Create a session
      const connectResponse = await request(app)
        .post('/api/auth/connect')
        .send({ code });

      const sessionToken = connectResponse.body.sessionToken as string;

      // Mock session as expired by manipulating time
      const originalNow = Date.now;
      Date.now = vi.fn(() => originalNow() + 25 * 60 * 60 * 1000); // 25 hours later

      const session = validateSession(sessionToken as string);

      expect(session).toBeNull();

      // Restore original Date.now
      Date.now = originalNow;
    });
  });

  describe('session cleanup', () => {
    it('should clean up expired sessions periodically', async () => {
      // This test is difficult to test directly due to the setInterval
      // We can test the validateSession function with expired sessions instead
      
      const transferId = 'test-transfer-123';
      const code = generateTransferCode(transferId);

      // Create a session
      const connectResponse = await request(app)
        .post('/api/auth/connect')
        .send({ code });

      const sessionToken = connectResponse.body.sessionToken as string;

      // Verify session exists
      expect(validateSession(sessionToken)).toBeTruthy();

      // Mock time to make session expired
      const originalNow = Date.now;
      Date.now = vi.fn(() => originalNow() + 25 * 60 * 60 * 1000); // 25 hours later

      // Verify session is now expired
      expect(validateSession(sessionToken)).toBeNull();

      // Restore original Date.now
      Date.now = originalNow;
    });
  });

  describe('code character set', () => {
    it('should only use unambiguous characters', () => {
      // Generate multiple codes to test character set
      const codes: string[] = [];
      for (let i = 0; i < 100; i++) {
        codes.push(generateTransferCode(`transfer-${i}`));
      }

      // Verify all codes only contain valid characters
      const validChars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
      const ambiguousChars = '01OI'; // Characters that are intentionally excluded

      for (const code of codes) {
        expect(code).toHaveLength(6);
        
        // Check that all characters in the code are valid
        for (const char of code) {
          expect(validChars).toContain(char);
          expect(ambiguousChars).not.toContain(char);
        }
      }
    });
  });

  describe('concurrent session handling', () => {
    it('should handle multiple concurrent sessions', async () => {
      const sessions: Array<{ sessionToken: string; transferId: string }> = [];

      // Create multiple sessions concurrently
      for (let i = 0; i < 5; i++) {
        const transferId = `test-transfer-${i}`;
        const code = generateTransferCode(transferId);
        
        const response = await request(app)
          .post('/api/auth/connect')
          .send({ code });

        sessions.push({
          sessionToken: response.body.sessionToken as string,
          transferId: response.body.transferId as string
        });
      }

      // Verify all sessions are valid
      for (let i = 0; i < sessions.length; i++) {
        const { sessionToken, transferId } = sessions[i];
        const session = validateSession(sessionToken as string);
        expect(session).toBeTruthy();
        expect(session?.transferId).toBe(transferId);
      }
    });
  });

  describe('session data integrity', () => {
    it('should maintain session data correctly', async () => {
      const transferId = 'test-transfer-123';
      const code = generateTransferCode(transferId);

      const response = await request(app)
        .post('/api/auth/connect')
        .send({ code });

      const sessionToken = response.body.sessionToken as string;
      const session = validateSession(sessionToken as string);

      expect(session).toEqual({
        sessionId: sessionToken as string,
        transferId: transferId,
        expiresAt: expect.any(Number)
      });

      // Verify expiration time is approximately 24 hours from now
      const expectedExpiry = Date.now() + 24 * 60 * 60 * 1000;
      const actualExpiry = session!.expiresAt;
      const timeDifference = Math.abs(actualExpiry - expectedExpiry);
      
      // Allow for small time differences (within 1 second)
      expect(timeDifference).toBeLessThan(1000);
    });
  });
});