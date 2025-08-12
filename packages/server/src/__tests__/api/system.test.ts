import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import request from 'supertest';
import { createTestServer, cleanupTestServer, type TestContext } from '../setup/testServer.js';

describe('System API', () => {
  let context: TestContext;

  beforeEach(async () => {
    context = await createTestServer();
  });

  afterEach(async () => {
    await cleanupTestServer(context);
  });

  describe('GET /health', () => {
    it('should return health status', async () => {
      const response = await request(context.app)
        .get('/health')
        .expect(200);

      expect(response.body).toHaveProperty('status');
      expect(response.body).toHaveProperty('uptime');
      expect(response.body).toHaveProperty('version');
      expect(response.body).toHaveProperty('services');
      expect(typeof response.body.uptime).toBe('number');
      expect(response.body.uptime).toBeGreaterThanOrEqual(0);
    });

    it('should indicate healthy services', async () => {
      const response = await request(context.app)
        .get('/health')
        .expect(200);

      expect(response.body.status).toBe('ok');
      expect(response.body.services).toHaveProperty('database', 'connected');
      expect(response.body.services).toHaveProperty('storage', 'connected');
      expect(response.body.services).toHaveProperty('transports');
    });

    it('should include version information', async () => {
      const response = await request(context.app)
        .get('/health')
        .expect(200);

      expect(response.body).toHaveProperty('version');
      expect(typeof response.body.version).toBe('string');
      expect(response.body.version).toMatch(/^\d+\.\d+\.\d+$/);
    });
  });

  describe('GET /api/info', () => {
    it('should return server information', async () => {
      const response = await request(context.app)
        .get('/api/info')
        .expect(200);

      expect(response.body).toHaveProperty('version');
      expect(response.body).toHaveProperty('uptime');
      expect(response.body).toHaveProperty('storage');
      expect(response.body).toHaveProperty('transports');
      expect(typeof response.body.uptime).toBe('number');
    });

    it('should include storage information', async () => {
      const response = await request(context.app)
        .get('/api/info')
        .expect(200);

      expect(response.body.storage).toHaveProperty('storagePath');
      expect(response.body.storage).toHaveProperty('databaseConnected');
      expect(response.body.storage).toHaveProperty('totalTransfers');
      expect(response.body.storage).toHaveProperty('totalDocuments');
      expect(typeof response.body.storage.storagePath).toBe('string');
      expect(typeof response.body.storage.databaseConnected).toBe('boolean');
      expect(typeof response.body.storage.totalTransfers).toBe('number');
      expect(typeof response.body.storage.totalDocuments).toBe('number');
    });

    it('should include transport information', async () => {
      const response = await request(context.app)
        .get('/api/info')
        .expect(200);

      expect(response.body.transports).toHaveProperty('ready');
      expect(response.body.transports).toHaveProperty('status');
      expect(typeof response.body.transports.ready).toBe('boolean');
      expect(typeof response.body.transports.status).toBe('object');
    });

    it('should show realistic uptime', async () => {
      const response = await request(context.app)
        .get('/api/info')
        .expect(200);

      // Should be a positive number representing seconds
      expect(response.body.uptime).toBeGreaterThanOrEqual(0);
      // Should be reasonable (less than a day for test)
      expect(response.body.uptime).toBeLessThan(86400);
    });
  });

  describe('GET /api/transports/available', () => {
    it('should list available transports', async () => {
      const response = await request(context.app)
        .get('/api/transports/available')
        .expect(200);

      expect(response.body).toHaveProperty('transports');
      expect(Array.isArray(response.body.transports)).toBe(true);
    });

    it('should provide transport details', async () => {
      const response = await request(context.app)
        .get('/api/transports/available')
        .expect(200);

      // Even if no transports are installed, the array should exist
      if (response.body.transports.length > 0) {
        const transport = response.body.transports[0];
        expect(transport).toHaveProperty('type');
        expect(transport).toHaveProperty('enabled');
        expect(transport).toHaveProperty('configured');
        expect(transport).toHaveProperty('status');
        expect(transport).toHaveProperty('version');
        expect(transport).toHaveProperty('features');
        expect(typeof transport.type).toBe('string');
        expect(typeof transport.enabled).toBe('boolean');
        expect(typeof transport.configured).toBe('boolean');
        expect(Array.isArray(transport.features)).toBe(true);
      }
    });

    it('should handle empty transport list', async () => {
      // In test environment, no transports may be available
      const response = await request(context.app)
        .get('/api/transports/available')
        .expect(200);

      expect(response.body.transports).toEqual(expect.any(Array));
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid routes gracefully', async () => {
      const response = await request(context.app)
        .get('/api/invalid-endpoint')
        .expect(404);

      expect(response.status).toBe(404);
    });

    it('should handle method not allowed', async () => {
      const response = await request(context.app)
        .post('/health')
        .expect(404);

      expect(response.status).toBe(404);
    });
  });

  describe('Rate Limiting', () => {
    it('should not rate limit system endpoints', async () => {
      // Make multiple requests quickly
      const promises = Array(10).fill(null).map(() =>
        request(context.app).get('/health')
      );

      const responses = await Promise.all(promises);
      
      // All should succeed (no rate limiting on health check)
      responses.forEach(response => {
        expect(response.status).toBe(200);
      });
    });
  });

  describe('CORS Headers', () => {
    it('should include CORS headers', async () => {
      const response = await request(context.app)
        .get('/health');

      expect(response.headers).toHaveProperty('access-control-allow-origin');
    });

    it('should handle preflight requests', async () => {
      const response = await request(context.app)
        .options('/api/info')
        .set('Origin', 'http://localhost:3000')
        .set('Access-Control-Request-Method', 'GET');

      expect(response.status).toBeLessThan(300);
    });
  });

  describe('Content Type', () => {
    it('should return JSON content type', async () => {
      const response = await request(context.app)
        .get('/api/info')
        .expect(200);

      expect(response.headers['content-type']).toMatch(/application\/json/);
    });

    it('should handle accept headers', async () => {
      const response = await request(context.app)
        .get('/api/info')
        .set('Accept', 'application/json')
        .expect(200);

      expect(response.headers['content-type']).toMatch(/application\/json/);
    });
  });

  describe('Performance', () => {
    it('should respond to health check quickly', async () => {
      const start = Date.now();
      
      await request(context.app)
        .get('/health')
        .expect(200);
      
      const duration = Date.now() - start;
      
      // Health check should be fast (under 100ms)
      expect(duration).toBeLessThan(100);
    });

    it('should handle concurrent requests', async () => {
      const promises = Array(20).fill(null).map(() =>
        request(context.app).get('/health')
      );

      const responses = await Promise.all(promises);
      
      responses.forEach(response => {
        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('status');
      });
    });
  });
});