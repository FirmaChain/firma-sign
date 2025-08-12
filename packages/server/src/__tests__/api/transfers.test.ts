import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import request from 'supertest';
import { createTestServer, cleanupTestServer, testData, type TestContext } from '../setup/testServer.js';

describe('Transfer API', () => {
  let context: TestContext;
  let createdTransferId: string;

  beforeEach(async () => {
    context = await createTestServer();
  });

  afterEach(async () => {
    await cleanupTestServer(context);
  });

  describe('POST /api/transfers/create', () => {
    it('should create a new transfer', async () => {
      const transferRequest = testData.createTransferRequest();

      const response = await request(context.app)
        .post('/api/transfers/create')
        .send(transferRequest)
        .expect(200);

      expect(response.body).toHaveProperty('transferId');
      expect(response.body).toHaveProperty('code');
      expect(response.body).toHaveProperty('status', 'created');
      expect(typeof response.body.transferId).toBe('string');
      expect(typeof response.body.code).toBe('string');
      expect(response.body.code).toMatch(/^[A-Z0-9]{6}$/);

      createdTransferId = response.body.transferId;
    });

    it('should validate required fields', async () => {
      const response = await request(context.app)
        .post('/api/transfers/create')
        .send({})
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });

    it('should validate documents array', async () => {
      const response = await request(context.app)
        .post('/api/transfers/create')
        .send({
          documents: [], // Empty documents
          recipients: [{ identifier: 'test@example.com', transport: 'email' }],
        })
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });

    it('should validate recipients array', async () => {
      const response = await request(context.app)
        .post('/api/transfers/create')
        .send({
          documents: [{ id: 'doc-1', fileName: 'test.pdf' }],
          recipients: [], // Empty recipients
        })
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });

    it('should validate transport types', async () => {
      const response = await request(context.app)
        .post('/api/transfers/create')
        .send({
          documents: [{ id: 'doc-1', fileName: 'test.pdf' }],
          recipients: [{ identifier: 'test@example.com', transport: 'invalid' }],
        })
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });

    it('should handle optional metadata', async () => {
      const transferRequest = {
        ...testData.createTransferRequest(),
        metadata: {
          deadline: '2024-12-31T23:59:59Z',
          message: 'Test message',
          requireAllSignatures: false,
        },
      };

      const response = await request(context.app)
        .post('/api/transfers/create')
        .send(transferRequest)
        .expect(200);

      expect(response.body.status).toBe('created');
    });

    it('should process document file data', async () => {
      const transferRequest = testData.createTransferRequest();

      const response = await request(context.app)
        .post('/api/transfers/create')
        .send(transferRequest)
        .expect(200);

      expect(response.body.transferId).toBeTruthy();
      createdTransferId = response.body.transferId;

      // Verify the transfer was stored
      const getResponse = await request(context.app)
        .get(`/api/transfers/${createdTransferId}`)
        .expect(200);

      expect(getResponse.body.documents).toHaveLength(1);
      expect(getResponse.body.documents[0].fileName).toBe('test.pdf');
    });
  });

  describe('GET /api/transfers', () => {
    beforeEach(async () => {
      // Create test transfer
      const transferRequest = testData.createTransferRequest();
      const response = await request(context.app)
        .post('/api/transfers/create')
        .send(transferRequest);
      createdTransferId = response.body.transferId;
    });

    it('should list all transfers', async () => {
      const response = await request(context.app)
        .get('/api/transfers')
        .expect(200);

      expect(response.body).toHaveProperty('transfers');
      expect(response.body).toHaveProperty('total');
      expect(response.body).toHaveProperty('hasMore');
      expect(Array.isArray(response.body.transfers)).toBe(true);
      expect(response.body.transfers.length).toBeGreaterThan(0);
    });

    it('should filter by type', async () => {
      const response = await request(context.app)
        .get('/api/transfers')
        .query({ type: 'outgoing' })
        .expect(200);

      expect(response.body.transfers).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ type: 'outgoing' })
        ])
      );
    });

    it('should filter by status', async () => {
      const response = await request(context.app)
        .get('/api/transfers')
        .query({ status: 'pending' })
        .expect(200);

      expect(response.body.transfers).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ status: 'pending' })
        ])
      );
    });

    it('should handle pagination', async () => {
      const response = await request(context.app)
        .get('/api/transfers')
        .query({ limit: 1, offset: 0 })
        .expect(200);

      expect(response.body.transfers).toHaveLength(1);
    });

    it('should validate limit parameter', async () => {
      const response = await request(context.app)
        .get('/api/transfers')
        .query({ limit: 2000 }) // Over max
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });

    it('should validate offset parameter', async () => {
      const response = await request(context.app)
        .get('/api/transfers')
        .query({ offset: -1 }) // Negative
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });

    it('should validate status parameter', async () => {
      const response = await request(context.app)
        .get('/api/transfers')
        .query({ status: 'invalid-status' })
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });
  });

  describe('GET /api/transfers/:transferId', () => {
    beforeEach(async () => {
      const transferRequest = testData.createTransferRequest();
      const response = await request(context.app)
        .post('/api/transfers/create')
        .send(transferRequest);
      createdTransferId = response.body.transferId;
    });

    it('should get transfer details', async () => {
      const response = await request(context.app)
        .get(`/api/transfers/${createdTransferId}`)
        .expect(200);

      expect(response.body).toHaveProperty('transferId', createdTransferId);
      expect(response.body).toHaveProperty('type');
      expect(response.body).toHaveProperty('status');
      expect(response.body).toHaveProperty('documents');
      expect(response.body).toHaveProperty('recipients');
      expect(response.body).toHaveProperty('metadata');
      expect(Array.isArray(response.body.documents)).toBe(true);
      expect(Array.isArray(response.body.recipients)).toBe(true);
    });

    it('should return 404 for non-existent transfer', async () => {
      const response = await request(context.app)
        .get('/api/transfers/non-existent-id')
        .expect(404);

      expect(response.body).toHaveProperty('error');
    });

    it('should include document URLs', async () => {
      const response = await request(context.app)
        .get(`/api/transfers/${createdTransferId}`)
        .expect(200);

      const document = response.body.documents[0];
      expect(document).toHaveProperty('url');
      expect(document.url).toContain(`/api/transfers/${createdTransferId}/documents/`);
    });
  });

  describe('POST /api/transfers/:transferId/sign', () => {
    beforeEach(async () => {
      const transferRequest = testData.createTransferRequest();
      const response = await request(context.app)
        .post('/api/transfers/create')
        .send(transferRequest);
      createdTransferId = response.body.transferId;
    });

    it('should sign documents', async () => {
      const signRequest = testData.createSignRequest();

      const response = await request(context.app)
        .post(`/api/transfers/${createdTransferId}/sign`)
        .send(signRequest)
        .expect(200);

      expect(response.body).toHaveProperty('status', 'success');
      expect(response.body).toHaveProperty('signedDocuments');
      expect(Array.isArray(response.body.signedDocuments)).toBe(true);
    });

    it('should validate signatures array', async () => {
      const response = await request(context.app)
        .post(`/api/transfers/${createdTransferId}/sign`)
        .send({ signatures: [] })
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });

    it('should validate signature status', async () => {
      const response = await request(context.app)
        .post(`/api/transfers/${createdTransferId}/sign`)
        .send({
          signatures: [{
            documentId: 'doc-1',
            signature: 'signature-data',
            status: 'invalid-status',
          }],
        })
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });

    it('should handle rejection status', async () => {
      const response = await request(context.app)
        .post(`/api/transfers/${createdTransferId}/sign`)
        .send({
          signatures: [{
            documentId: 'doc-1',
            signature: '',
            components: [],
            status: 'rejected',
            rejectReason: 'Document not acceptable',
          }],
        })
        .expect(200);

      expect(response.body.status).toBe('success');
    });

    it('should return 404 for non-existent transfer', async () => {
      const signRequest = testData.createSignRequest();

      const response = await request(context.app)
        .post('/api/transfers/non-existent-id/sign')
        .send(signRequest)
        .expect(404);

      expect(response.body).toHaveProperty('error');
    });

    it('should handle return transport', async () => {
      const signRequest = {
        ...testData.createSignRequest(),
        returnTransport: 'email',
      };

      const response = await request(context.app)
        .post(`/api/transfers/${createdTransferId}/sign`)
        .send(signRequest)
        .expect(200);

      expect(response.body.status).toBe('success');
    });
  });

  describe('Document Upload/Download', () => {
    beforeEach(async () => {
      const transferRequest = testData.createTransferRequest();
      const response = await request(context.app)
        .post('/api/transfers/create')
        .send(transferRequest);
      createdTransferId = response.body.transferId;
    });

    it('should upload document', async () => {
      const uploadRequest = testData.createDocumentUploadRequest();

      const response = await request(context.app)
        .post(`/api/transfers/${createdTransferId}/documents`)
        .send(uploadRequest)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('documentId');
      expect(response.body).toHaveProperty('fileName');
      expect(response.body).toHaveProperty('fileSize');
    });

    it('should validate upload request', async () => {
      const response = await request(context.app)
        .post(`/api/transfers/${createdTransferId}/documents`)
        .send({ fileName: 'test.pdf' }) // Missing required fields
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });

    it('should download document', async () => {
      // First get the transfer to find document ID
      const transferResponse = await request(context.app)
        .get(`/api/transfers/${createdTransferId}`)
        .expect(200);

      const documentId = transferResponse.body.documents[0].documentId;

      const response = await request(context.app)
        .get(`/api/transfers/${createdTransferId}/documents/${documentId}`)
        .expect(200);

      expect(response.headers['content-type']).toBe('application/pdf');
      expect(response.headers['content-disposition']).toContain('attachment');
    });

    it('should return 404 for non-existent document', async () => {
      const response = await request(context.app)
        .get(`/api/transfers/${createdTransferId}/documents/non-existent-doc`)
        .expect(404);

      expect(response.body).toHaveProperty('error');
    });
  });

  describe('Error Handling', () => {
    it('should handle malformed JSON in requests', async () => {
      const response = await request(context.app)
        .post('/api/transfers/create')
        .set('Content-Type', 'application/json')
        .send('{"invalid": json}')
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });

    it('should handle oversized requests', async () => {
      const largeData = 'x'.repeat(60 * 1024 * 1024); // 60MB, over 50MB limit
      
      const response = await request(context.app)
        .post('/api/transfers/create')
        .send({ data: largeData })
        .expect(413);

      expect(response.status).toBe(413);
    });
  });
});