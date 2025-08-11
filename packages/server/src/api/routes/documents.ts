import { Router, Request, Response, NextFunction } from 'express';
import multer from 'multer';
import { z } from 'zod';
import { logger } from '../../utils/logger.js';
import { validateRequest } from '../middleware/validation.js';
import { requireAuth } from '../middleware/auth.js';
import { DocumentService, DocumentCategory, DocumentStatus, DocumentFilter } from '../../services/DocumentService.js';

// Multer configuration for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB limit
  },
  fileFilter: (_req, file, cb) => {
    // Accept common document types
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain',
      'image/png',
      'image/jpeg'
    ];
    
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only PDF, DOC, DOCX, TXT, PNG, and JPEG files are allowed.'));
    }
  }
});

// Validation schemas
const uploadDocumentSchema = z.object({
  body: z.object({
    category: z.nativeEnum(DocumentCategory).optional().default(DocumentCategory.UPLOADED),
    transferId: z.string().optional(),
    tags: z.array(z.string()).optional(),
    metadata: z.record(z.unknown()).optional()
  })
});

const updateDocumentSchema = z.object({
  params: z.object({
    documentId: z.string()
  }),
  body: z.object({
    status: z.nativeEnum(DocumentStatus).optional(),
    tags: z.array(z.string()).optional(),
    metadata: z.record(z.unknown()).optional()
  })
});

const searchDocumentsSchema = z.object({
  query: z.object({
    category: z.nativeEnum(DocumentCategory).optional(),
    status: z.nativeEnum(DocumentStatus).optional(),
    transferId: z.string().optional(),
    uploadedBy: z.string().optional(),
    signedBy: z.string().optional(),
    tags: z.array(z.string()).optional(),
    fromDate: z.string().datetime().optional(),
    toDate: z.string().datetime().optional(),
    searchText: z.string().optional(),
    limit: z.string().transform(Number).optional(),
    offset: z.string().transform(Number).optional()
  })
});

const moveDocumentSchema = z.object({
  params: z.object({
    documentId: z.string()
  }),
  body: z.object({
    category: z.nativeEnum(DocumentCategory)
  })
});

const createVersionSchema = z.object({
  params: z.object({
    documentId: z.string()
  }),
  body: z.object({
    metadata: z.record(z.unknown()).optional()
  })
});

export function createDocumentRoutes(documentService: DocumentService): Router {
  const router = Router();

  /**
   * Upload a new document
   * POST /api/documents/upload
   */
  router.post(
    '/upload',
    requireAuth,
    upload.single('document'),
    validateRequest(uploadDocumentSchema),
    // eslint-disable-next-line @typescript-eslint/no-misused-promises
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        if (!req.file) {
          return res.status(400).json({ error: 'No file uploaded' });
        }

        const body = req.body as Record<string, unknown>;
        const validated = uploadDocumentSchema.parse({ body });
        const { category, transferId, tags, metadata } = validated.body;
        const uploadedBy = (req as Request & { user?: { id: string } }).user?.id;

        const document = await documentService.storeDocument(
          req.file.buffer,
          req.file.originalname,
          category,
          {
            transferId,
            uploadedBy,
            tags,
            metadata
          }
        );

        logger.info(`Document uploaded: ${document.id} by user: ${uploadedBy}`);
        
        res.status(201).json({
          success: true,
          document: {
            id: document.id,
            name: document.originalName,
            category: document.category,
            status: document.status,
            size: document.size,
            hash: document.hash,
            uploadedAt: document.uploadedAt
          }
        });
      } catch (error) {
        next(error);
      }
    }
  );

  /**
   * Get document by ID
   * GET /api/documents/:documentId
   */
  router.get(
    '/:documentId',
    requireAuth,
    // eslint-disable-next-line @typescript-eslint/no-misused-promises
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const { documentId } = req.params;
        const { data, metadata } = await documentService.getDocument(documentId);

        res.setHeader('Content-Type', metadata.mimeType);
        res.setHeader('Content-Disposition', `attachment; filename="${metadata.originalName}"`);
        res.setHeader('Content-Length', metadata.size.toString());
        res.send(data);
      } catch (error) {
        next(error);
      }
    }
  );

  /**
   * Get document metadata
   * GET /api/documents/:documentId/metadata
   */
  router.get(
    '/:documentId/metadata',
    requireAuth,
    // eslint-disable-next-line @typescript-eslint/no-misused-promises
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const { documentId } = req.params;
        const { metadata } = await documentService.getDocument(documentId);

        res.json({
          success: true,
          metadata
        });
      } catch (error) {
        next(error);
      }
    }
  );

  /**
   * Update document status or metadata
   * PATCH /api/documents/:documentId
   */
  router.patch(
    '/:documentId',
    requireAuth,
    validateRequest(updateDocumentSchema),
    // eslint-disable-next-line @typescript-eslint/no-misused-promises
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const { documentId } = req.params;
        const body = req.body as Record<string, unknown>;
        const validated = updateDocumentSchema.parse({ params: req.params, body });
        const { status } = validated.body;
        // Note: tags and metadata updates are not yet implemented

        if (status) {
          const signedBy = (req as Request & { user?: { id: string } }).user?.id;
          await documentService.updateDocumentStatus(documentId, status, {
            signedBy: status === DocumentStatus.SIGNED ? signedBy : undefined,
            signedAt: status === DocumentStatus.SIGNED ? new Date() : undefined
          });
        }

        // TODO: Add support for updating tags and metadata

        res.json({
          success: true,
          message: 'Document updated successfully'
        });
      } catch (error) {
        next(error);
      }
    }
  );

  /**
   * Search documents
   * GET /api/documents
   */
  router.get(
    '/',
    requireAuth,
    validateRequest(searchDocumentsSchema),
    // eslint-disable-next-line @typescript-eslint/no-misused-promises
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const filter: DocumentFilter = {
          category: req.query.category as DocumentCategory | undefined,
          status: req.query.status as DocumentStatus | undefined,
          transferId: req.query.transferId as string | undefined,
          uploadedBy: req.query.uploadedBy as string | undefined,
          signedBy: req.query.signedBy as string | undefined,
          tags: req.query.tags as string[] | undefined,
          fromDate: req.query.fromDate ? new Date(req.query.fromDate as string) : undefined,
          toDate: req.query.toDate ? new Date(req.query.toDate as string) : undefined,
          searchText: req.query.searchText as string | undefined,
          limit: req.query.limit ? Number(req.query.limit) : 100,
          offset: req.query.offset ? Number(req.query.offset) : 0
        };

        const documents = await documentService.searchDocuments(filter);

        res.json({
          success: true,
          documents,
          total: documents.length,
          limit: filter.limit,
          offset: filter.offset
        });
      } catch (error) {
        next(error);
      }
    }
  );

  /**
   * Move document to different category
   * POST /api/documents/:documentId/move
   */
  router.post(
    '/:documentId/move',
    requireAuth,
    validateRequest(moveDocumentSchema),
    // eslint-disable-next-line @typescript-eslint/no-misused-promises
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const { documentId } = req.params;
        const body = req.body as Record<string, unknown>;
        const validated = moveDocumentSchema.parse({ params: req.params, body });
        const { category } = validated.body;

        await documentService.moveDocument(documentId, category);

        res.json({
          success: true,
          message: `Document moved to ${category} category`
        });
      } catch (error) {
        next(error);
      }
    }
  );

  /**
   * Create a new version of a document
   * POST /api/documents/:documentId/versions
   */
  router.post(
    '/:documentId/versions',
    requireAuth,
    upload.single('document'),
    validateRequest(createVersionSchema),
    // eslint-disable-next-line @typescript-eslint/no-misused-promises
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        if (!req.file) {
          return res.status(400).json({ error: 'No file uploaded' });
        }

        const { documentId } = req.params;
        const body = req.body as Record<string, unknown>;
        const validated = createVersionSchema.parse({ params: req.params, body });
        const { metadata } = validated.body;
        const uploadedBy = (req as Request & { user?: { id: string } }).user?.id;

        const newVersion = await documentService.createVersion(
          documentId,
          req.file.buffer,
          {
            uploadedBy,
            metadata
          }
        );

        res.status(201).json({
          success: true,
          document: {
            id: newVersion.id,
            name: newVersion.originalName,
            version: newVersion.version,
            previousVersionId: newVersion.previousVersionId,
            uploadedAt: newVersion.uploadedAt
          }
        });
      } catch (error) {
        next(error);
      }
    }
  );

  /**
   * Get document version history
   * GET /api/documents/:documentId/versions
   */
  router.get(
    '/:documentId/versions',
    requireAuth,
    // eslint-disable-next-line @typescript-eslint/no-misused-promises
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const { documentId } = req.params;
        const versions = await documentService.getDocumentVersions(documentId);

        res.json({
          success: true,
          versions
        });
      } catch (error) {
        next(error);
      }
    }
  );

  /**
   * Delete a document
   * DELETE /api/documents/:documentId
   */
  router.delete(
    '/:documentId',
    requireAuth,
    // eslint-disable-next-line @typescript-eslint/no-misused-promises
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const { documentId } = req.params;
        const permanent = req.query.permanent === 'true';

        await documentService.deleteDocument(documentId, permanent);

        res.json({
          success: true,
          message: permanent ? 'Document permanently deleted' : 'Document marked as deleted'
        });
      } catch (error) {
        next(error);
      }
    }
  );

  /**
   * Archive old documents
   * POST /api/documents/archive
   */
  router.post(
    '/archive',
    requireAuth,
    // eslint-disable-next-line @typescript-eslint/no-misused-promises
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const olderThanDays = (req.body as { olderThanDays?: number }).olderThanDays ?? 90;
        const archivedCount = await documentService.archiveOldDocuments(olderThanDays);

        res.json({
          success: true,
          message: `Archived ${archivedCount} documents older than ${olderThanDays} days`
        });
      } catch (error) {
        next(error);
      }
    }
  );

  /**
   * Get storage statistics
   * GET /api/documents/stats
   */
  router.get(
    '/stats',
    requireAuth,
    // eslint-disable-next-line @typescript-eslint/no-misused-promises
    async (_req: Request, res: Response, next: NextFunction) => {
      try {
        const stats = await documentService.getStorageStats();

        res.json({
          success: true,
          stats
        });
      } catch (error) {
        next(error);
      }
    }
  );

  return router;
}