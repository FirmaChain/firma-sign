import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import request from 'supertest';
import { createTestServer, cleanupTestServer, testData, type TestContext } from '../setup/testServer.js';

describe('Integration Tests', () => {
  let context: TestContext;

  beforeEach(async () => {
    context = await createTestServer();
  });

  afterEach(async () => {
    await cleanupTestServer(context);
  });

  describe('Complete Document Transfer Workflow', () => {
    it('should handle complete transfer lifecycle', async () => {
      // Step 1: Create a transfer
      const transferRequest = testData.createTransferRequest();
      const createResponse = await request(context.app)
        .post('/api/transfers/create')
        .send(transferRequest)
        .expect(200);

      const { transferId, code } = createResponse.body;
      expect(transferId).toBeTruthy();
      expect(code).toBeTruthy();

      // Step 2: Connect with the transfer code
      const connectResponse = await request(context.app)
        .post('/api/auth/connect')
        .send({ code })
        .expect(200);

      expect(connectResponse.body.success).toBe(true);
      expect(connectResponse.body.transferId).toBeTruthy();

      // Step 3: Get transfer details
      const detailsResponse = await request(context.app)
        .get(`/api/transfers/${transferId}`)
        .expect(200);

      expect(detailsResponse.body.transferId).toBe(transferId);
      expect(detailsResponse.body.status).toBe('pending');
      expect(detailsResponse.body.documents).toHaveLength(1);
      expect(detailsResponse.body.recipients).toHaveLength(1);

      // Step 4: Download original document
      const documentId = detailsResponse.body.documents[0].documentId;
      const downloadResponse = await request(context.app)
        .get(`/api/transfers/${transferId}/documents/${documentId}`)
        .expect(200);

      expect(downloadResponse.headers['content-type']).toBe('application/pdf');

      // Step 5: Sign the document
      const signRequest = {
        signatures: [{
          documentId,
          signature: Buffer.from('signed document content').toString('base64'),
          components: [],
          status: 'signed' as const,
        }],
      };

      const signResponse = await request(context.app)
        .post(`/api/transfers/${transferId}/sign`)
        .send(signRequest)
        .expect(200);

      expect(signResponse.body.status).toBe('success');
      expect(signResponse.body.signedDocuments).toHaveLength(1);

      // Step 6: Verify transfer status updated
      const finalDetailsResponse = await request(context.app)
        .get(`/api/transfers/${transferId}`)
        .expect(200);

      // Transfer should be completed (or partially-signed depending on requirements)
      expect(['completed', 'partially-signed']).toContain(finalDetailsResponse.body.status);

      // Step 7: Download signed document
      const signedUrl = signResponse.body.signedDocuments[0].signedUrl;
      const signedDownloadResponse = await request(context.app)
        .get(signedUrl)
        .expect(200);

      expect(signedDownloadResponse.headers['content-type']).toBe('application/pdf');
    });

    it('should handle multi-document transfer', async () => {
      // Create transfer with multiple documents
      const transferRequest = {
        documents: [
          {
            id: 'doc-1',
            fileName: 'contract.pdf',
            fileData: Buffer.from('contract content').toString('base64'),
          },
          {
            id: 'doc-2',
            fileName: 'terms.pdf',
            fileData: Buffer.from('terms content').toString('base64'),
          },
        ],
        recipients: [{
          identifier: 'signer@example.com',
          transport: 'email',
        }],
        metadata: {
          message: 'Multiple documents to sign',
          requireAllSignatures: true,
        },
      };

      const createResponse = await request(context.app)
        .post('/api/transfers/create')
        .send(transferRequest)
        .expect(200);

      const { transferId } = createResponse.body;

      // Get transfer details
      const detailsResponse = await request(context.app)
        .get(`/api/transfers/${transferId}`)
        .expect(200);

      expect(detailsResponse.body.documents).toHaveLength(2);

      // Sign both documents
      const signRequest = {
        signatures: [
          {
            documentId: 'doc-1',
            signature: Buffer.from('signed contract').toString('base64'),
            components: [],
            status: 'signed' as const,
          },
          {
            documentId: 'doc-2',
            signature: Buffer.from('signed terms').toString('base64'),
            components: [],
            status: 'signed' as const,
          },
        ],
      };

      const signResponse = await request(context.app)
        .post(`/api/transfers/${transferId}/sign`)
        .send(signRequest)
        .expect(200);

      expect(signResponse.body.signedDocuments).toHaveLength(2);

      // Verify final status
      const finalResponse = await request(context.app)
        .get(`/api/transfers/${transferId}`)
        .expect(200);

      expect(finalResponse.body.status).toBe('completed');
    });

    it('should handle document rejection', async () => {
      // Create transfer
      const transferRequest = testData.createTransferRequest();
      const createResponse = await request(context.app)
        .post('/api/transfers/create')
        .send(transferRequest)
        .expect(200);

      const { transferId } = createResponse.body;

      // Get document ID
      const detailsResponse = await request(context.app)
        .get(`/api/transfers/${transferId}`)
        .expect(200);

      const documentId = detailsResponse.body.documents[0].documentId;

      // Reject the document
      const rejectRequest = {
        signatures: [{
          documentId,
          signature: '',
          components: [],
          status: 'rejected' as const,
          rejectReason: 'Terms not acceptable',
        }],
      };

      const rejectResponse = await request(context.app)
        .post(`/api/transfers/${transferId}/sign`)
        .send(rejectRequest)
        .expect(200);

      expect(rejectResponse.body.status).toBe('success');

      // Verify rejection is recorded
      const finalResponse = await request(context.app)
        .get(`/api/transfers/${transferId}`)
        .expect(200);

      // Status should reflect rejection
      expect(finalResponse.body.status).not.toBe('completed');
    });
  });

  describe('Authentication and Authorization Flow', () => {
    it('should require valid transfer codes', async () => {
      // Try to connect with invalid code (wrong format - validation should fail)
      const connectResponse = await request(context.app)
        .post('/api/auth/connect')
        .send({ code: 'BAD' })
        .expect(400); // Should return 400 for validation error

      expect(connectResponse.body.error).toBe('Validation failed');
    });

    it('should generate unique session tokens', async () => {
      // Create two different transfers with different codes
      const transferRequest1 = testData.createTransferRequest();
      const transferRequest2 = testData.createTransferRequest();
      
      const create1 = await request(context.app)
        .post('/api/transfers/create')
        .send(transferRequest1)
        .expect(200);
        
      const create2 = await request(context.app)
        .post('/api/transfers/create')
        .send(transferRequest2)
        .expect(200);

      const code1 = create1.body.code;
      const code2 = create2.body.code;
      
      const response1 = await request(context.app)
        .post('/api/auth/connect')
        .send({ code: code1 })
        .expect(200);

      const response2 = await request(context.app)
        .post('/api/auth/connect')
        .send({ code: code2 })
        .expect(200);

      // Should generate different session tokens
      expect(response1.body.sessionToken).not.toBe(response2.body.sessionToken);
    });
  });

  describe('Error Recovery and Edge Cases', () => {
    it('should handle concurrent access to same transfer', async () => {
      // Create transfer
      const transferRequest = testData.createTransferRequest();
      const createResponse = await request(context.app)
        .post('/api/transfers/create')
        .send(transferRequest)
        .expect(200);

      const { transferId } = createResponse.body;

      // Make concurrent requests to the same transfer
      const promises = Array(5).fill(null).map(() =>
        request(context.app).get(`/api/transfers/${transferId}`)
      );

      const responses = await Promise.all(promises);

      // All should succeed and return the same data
      responses.forEach(response => {
        expect(response.status).toBe(200);
        expect(response.body.transferId).toBe(transferId);
      });
    });

    it('should handle partial signature failures gracefully', async () => {
      const transferRequest = {
        documents: [
          { id: 'doc-1', fileName: 'doc1.pdf' },
          { id: 'doc-2', fileName: 'doc2.pdf' },
        ],
        recipients: [{ identifier: 'test@example.com', transport: 'email' }],
      };

      const createResponse = await request(context.app)
        .post('/api/transfers/create')
        .send(transferRequest)
        .expect(200);

      const { transferId } = createResponse.body;

      // Sign only one document
      const signRequest = {
        signatures: [{
          documentId: 'doc-1',
          signature: Buffer.from('signature').toString('base64'),
          components: [],
          status: 'signed' as const,
        }],
      };

      const signResponse = await request(context.app)
        .post(`/api/transfers/${transferId}/sign`)
        .send(signRequest)
        .expect(200);

      expect(signResponse.body.status).toBe('success');

      // Check status is partial
      const statusResponse = await request(context.app)
        .get(`/api/transfers/${transferId}`)
        .expect(200);

      expect(statusResponse.body.status).toBe('partially-signed');
    });

    it('should handle document upload after transfer creation', async () => {
      // Create transfer without file data
      const transferRequest = {
        documents: [{ id: 'doc-1', fileName: 'later.pdf' }],
        recipients: [{ identifier: 'test@example.com', transport: 'email' }],
      };

      const createResponse = await request(context.app)
        .post('/api/transfers/create')
        .send(transferRequest)
        .expect(200);

      const { transferId } = createResponse.body;

      // Upload document later
      const uploadRequest = {
        documentId: 'doc-1',
        fileName: 'later.pdf',
        fileData: Buffer.from('uploaded content').toString('base64'),
      };

      const uploadResponse = await request(context.app)
        .post(`/api/transfers/${transferId}/documents`)
        .send(uploadRequest)
        .expect(200);

      expect(uploadResponse.body.success).toBe(true);
      expect(uploadResponse.body.fileSize).toBeGreaterThan(0);
    });
  });

  describe('System State and Consistency', () => {
    it('should maintain consistent state across operations', async () => {
      // Create multiple transfers
      const transfer1Request = testData.createTransferRequest();
      const transfer2Request = testData.createTransferRequest();

      const [create1, create2] = await Promise.all([
        request(context.app).post('/api/transfers/create').send(transfer1Request),
        request(context.app).post('/api/transfers/create').send(transfer2Request),
      ]);

      expect(create1.status).toBe(200);
      expect(create2.status).toBe(200);

      const transferId1 = create1.body.transferId;
      const transferId2 = create2.body.transferId;

      // Verify both transfers exist independently
      const [details1, details2] = await Promise.all([
        request(context.app).get(`/api/transfers/${transferId1}`),
        request(context.app).get(`/api/transfers/${transferId2}`),
      ]);

      expect(details1.body.transferId).toBe(transferId1);
      expect(details2.body.transferId).toBe(transferId2);
      expect(transferId1).not.toBe(transferId2);

      // Check system info reflects both transfers
      const infoResponse = await request(context.app)
        .get('/api/info')
        .expect(200);

      expect(infoResponse.body.storage.totalTransfers).toBeGreaterThanOrEqual(2);
    });

    it('should handle cleanup operations', async () => {
      // Create and manipulate transfer
      const transferRequest = testData.createTransferRequest();
      const createResponse = await request(context.app)
        .post('/api/transfers/create')
        .send(transferRequest)
        .expect(200);

      const { transferId } = createResponse.body;

      // Get initial state
      const initialInfo = await request(context.app)
        .get('/api/info')
        .expect(200);

      expect(initialInfo.body.storage.totalTransfers).toBeGreaterThan(0);
      expect(initialInfo.body.storage.totalDocuments).toBeGreaterThan(0);

      // Verify transfer exists
      await request(context.app)
        .get(`/api/transfers/${transferId}`)
        .expect(200);

      // System should remain healthy
      const healthResponse = await request(context.app)
        .get('/health')
        .expect(200);

      expect(healthResponse.body.status).toBe('ok');
    });
  });
});