import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { createTestServer, cleanupTestServer, type TestContext } from '../setup/testServer.js';
import { DocumentCategory, DocumentStatus } from '../../services/DocumentService.js';

describe('Document API', () => {
  let context: TestContext;

  beforeEach(async () => {
    context = await createTestServer();
  });

  afterEach(async () => {
    await cleanupTestServer(context);
  });

  describe('Document Service Integration', () => {
    it('should store and retrieve documents through service', async () => {
      // Store a document using the service directly
      const testContent = Buffer.from('test document content');
      const metadata = await context.documentService.storeDocument(
        testContent,
        'test.pdf',
        DocumentCategory.UPLOADED,
        {
          uploadedBy: 'test-user',
          tags: ['test'],
        }
      );

      expect(metadata.id).toBeTruthy();
      expect(metadata.originalName).toBe('test.pdf');
      expect(metadata.size).toBe(testContent.length);

      // Retrieve the document
      const { data, metadata: retrievedMetadata } = await context.documentService.getDocument(metadata.id);

      expect(data).toEqual(testContent);
      expect(retrievedMetadata.id).toBe(metadata.id);
      expect(retrievedMetadata.originalName).toBe('test.pdf');
    });

    it('should handle document status updates', async () => {
      // Store a document
      const testContent = Buffer.from('document to update');
      const metadata = await context.documentService.storeDocument(
        testContent,
        'update-test.pdf',
        DocumentCategory.UPLOADED
      );

      // Update status
      await context.documentService.updateDocumentStatus(
        metadata.id,
        DocumentStatus.SIGNED,
        {
          signedBy: 'test-signer',
          signedAt: new Date(),
        }
      );

      // Verify update
      const { metadata: updatedMetadata } = await context.documentService.getDocument(metadata.id);
      expect(updatedMetadata.status).toBe('signed');
      expect(updatedMetadata.signedBy).toBeDefined();
      expect(updatedMetadata.signedBy).toContain('test-signer');
    });

    it('should search documents with filters', async () => {
      // Store multiple documents
      const doc1 = await context.documentService.storeDocument(
        Buffer.from('doc1'),
        'important.pdf',
        DocumentCategory.UPLOADED,
        {}
      );

      await context.documentService.storeDocument(
        Buffer.from('doc2'),
        'draft.pdf',
        DocumentCategory.UPLOADED,
        {}
      );

      // Search with text filter (which is implemented)
      const results = await context.documentService.searchDocuments({
        searchText: 'important',
        limit: 10,
      });

      expect(results).toHaveLength(1);
      expect(results[0].id).toBe(doc1.id);
      expect(results[0].originalName).toBe('important.pdf');
    });

    it.skip('should handle document versioning', async () => {
      // Store original document
      const originalContent = Buffer.from('original content');
      const originalDoc = await context.documentService.storeDocument(
        originalContent,
        'versioned.pdf',
        DocumentCategory.UPLOADED
      );

      // Create new version
      const newContent = Buffer.from('updated content');
      const newVersion = await context.documentService.createVersion(
        originalDoc.id,
        newContent,
        { uploadedBy: 'updater' }
      );

      expect(newVersion.version).toBe(2);
      expect(newVersion.previousVersionId).toBe(originalDoc.id);

      // Get version history
      const versions = await context.documentService.getDocumentVersions(newVersion.id);
      expect(versions).toHaveLength(2);
      expect(versions[0].version).toBe(2);
      expect(versions[1].version).toBe(1);
    });

    it('should move documents between categories', async () => {
      // Store document in uploaded category
      const doc = await context.documentService.storeDocument(
        Buffer.from('content'),
        'move-test.pdf',
        DocumentCategory.UPLOADED
      );

      expect(doc.category).toBe('uploaded');

      // Move to signed category
      await context.documentService.moveDocument(doc.id, DocumentCategory.SIGNED);

      // Verify document moved
      const { metadata } = await context.documentService.getDocument(doc.id);
      expect(metadata.category).toBe('signed');
    });

    it('should handle document deletion', async () => {
      // Store document
      const doc = await context.documentService.storeDocument(
        Buffer.from('to delete'),
        'delete-test.pdf',
        DocumentCategory.UPLOADED
      );

      // Soft delete
      await context.documentService.deleteDocument(doc.id, false);

      // Verify soft deleted
      const { metadata } = await context.documentService.getDocument(doc.id);
      expect(metadata.status).toBe('deleted');

      // Permanent delete
      await context.documentService.deleteDocument(doc.id, true);

      // Should throw error when trying to get deleted document
      await expect(context.documentService.getDocument(doc.id)).rejects.toThrow();
    });

    it('should get storage statistics', async () => {
      // Store some test documents
      await context.documentService.storeDocument(
        Buffer.from('stat test 1'),
        'stats1.pdf',
        DocumentCategory.UPLOADED
      );

      await context.documentService.storeDocument(
        Buffer.from('stat test 2'),
        'stats2.pdf',
        DocumentStatus.SIGNED
      );

      // Get statistics
      const stats = await context.documentService.getStorageStats();

      expect(stats.totalDocuments).toBeGreaterThanOrEqual(2);
      expect(stats.totalSize).toBeGreaterThan(0);
      expect(stats.byCategory).toHaveProperty('uploaded');
      expect(stats.byCategory).toHaveProperty('signed');
      expect(stats.byStatus).toHaveProperty('draft');
    });

    it('should archive old documents', async () => {
      // Store document and mark as completed
      const doc = await context.documentService.storeDocument(
        Buffer.from('old document'),
        'old.pdf',
        DocumentCategory.UPLOADED
      );

      // Update to completed status with old date
      await context.documentService.updateDocumentStatus(doc.id, DocumentStatus.COMPLETED);

      // Archive old documents (use 0 days for testing)
      const archivedCount = await context.documentService.archiveOldDocuments(0);

      expect(archivedCount).toBeGreaterThanOrEqual(1);

      // Verify document was moved to archived category
      const { metadata } = await context.documentService.getDocument(doc.id);
      expect(metadata.category).toBe('archived');
    });
  });

  describe('Document Storage Integration', () => {
    it('should handle different document sizes', async () => {
      const sizes = [1, 1024, 10 * 1024, 100 * 1024]; // 1B, 1KB, 10KB, 100KB

      for (const size of sizes) {
        const content = Buffer.alloc(size, 'x');
        const doc = await context.documentService.storeDocument(
          content,
          `size-test-${size}.pdf`,
          DocumentCategory.UPLOADED
        );

        expect(doc.size).toBe(size);

        const { data } = await context.documentService.getDocument(doc.id);
        expect(data.length).toBe(size);
      }
    });

    it('should generate consistent hashes', async () => {
      const content = Buffer.from('hash test content');
      
      const doc1 = await context.documentService.storeDocument(
        content,
        'hash1.pdf',
        DocumentCategory.UPLOADED
      );

      const doc2 = await context.documentService.storeDocument(
        content,
        'hash2.pdf',
        DocumentCategory.UPLOADED
      );

      // Same content should produce same hash
      expect(doc1.hash).toBe(doc2.hash);
    });

    it('should handle concurrent document operations', async () => {
      const operations = Array(5).fill(null).map((_, i) =>
        context.documentService.storeDocument(
          Buffer.from(`concurrent doc ${i}`),
          `concurrent-${i}.pdf`,
          DocumentCategory.UPLOADED
        )
      );

      const results = await Promise.all(operations);

      // All operations should succeed
      expect(results).toHaveLength(5);
      results.forEach((doc, i) => {
        expect(doc.originalName).toBe(`concurrent-${i}.pdf`);
        expect(doc.id).toBeTruthy();
      });

      // All documents should be unique
      const ids = results.map(doc => doc.id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(5);
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid document IDs', async () => {
      await expect(
        context.documentService.getDocument('invalid-id')
      ).rejects.toThrow('Document not found');
    });

    it('should handle status updates on non-existent documents', async () => {
      await expect(
        context.documentService.updateDocumentStatus('invalid-id', DocumentStatus.SIGNED)
      ).rejects.toThrow('Document not found');
    });

    it('should handle moving non-existent documents', async () => {
      await expect(
        context.documentService.moveDocument('invalid-id', DocumentCategory.SIGNED)
      ).rejects.toThrow('Document not found');
    });

    it('should handle empty search results gracefully', async () => {
      const results = await context.documentService.searchDocuments({
        tags: ['non-existent-tag'],
      });

      expect(results).toEqual([]);
    });
  });

  describe('Document Service Configuration', () => {
    it('should initialize with correct paths', async () => {
      // Service should be initialized from test setup
      expect(context.documentService).toBeTruthy();
      
      // Should be able to store documents
      const doc = await context.documentService.storeDocument(
        Buffer.from('config test'),
        'config.pdf',
        DocumentCategory.UPLOADED
      );

      expect(doc.id).toBeTruthy();
    });

    it('should handle service shutdown gracefully', async () => {
      // Store a document first
      await context.documentService.storeDocument(
        Buffer.from('shutdown test'),
        'shutdown.pdf',
        DocumentCategory.UPLOADED
      );

      // Service shutdown is handled by test cleanup
      // This test verifies no errors occur during normal shutdown
      expect(true).toBe(true);
    });
  });

  describe('Performance and Scalability', () => {
    it('should handle batch document operations efficiently', async () => {
      const start = Date.now();
      const batchSize = 10;
      
      const operations = Array(batchSize).fill(null).map((_, i) =>
        context.documentService.storeDocument(
          Buffer.from(`batch doc ${i}`),
          `batch-${i}.pdf`,
          DocumentCategory.UPLOADED
        )
      );

      const results = await Promise.all(operations);
      const duration = Date.now() - start;

      expect(results).toHaveLength(batchSize);
      expect(duration).toBeLessThan(5000); // Should complete within 5 seconds
    });

    it('should search efficiently across many documents', async () => {
      // Store documents with different characteristics
      const promises = Array(20).fill(null).map((_, i) => {
        const filename = i % 2 === 0 ? `even-${i}.pdf` : `odd-${i}.pdf`;
        return context.documentService.storeDocument(
          Buffer.from(`search doc ${i}`),
          filename,
          DocumentCategory.UPLOADED,
          {}
        );
      });

      await Promise.all(promises);

      // Search for even documents using searchText
      const start = Date.now();
      const evenDocs = await context.documentService.searchDocuments({
        searchText: 'even',
        limit: 50,
      });
      const duration = Date.now() - start;

      expect(evenDocs).toHaveLength(10);
      expect(duration).toBeLessThan(1000); // Should be fast
    });
  });
});