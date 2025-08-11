import { Router } from 'express';
import { z } from 'zod';
import { nanoid } from 'nanoid';
import type { TransportManager } from '../../transport/TransportManager.js';
import type { StorageManager } from '../../storage/StorageManager.js';
import { validateRequest } from '../middleware/validation.js';
import { logger } from '../../utils/logger.js';

const createTransferSchema = z.object({
  documents: z.array(z.object({
    id: z.string(),
    fileName: z.string(),
    fileData: z.string().optional()
  })),
  recipients: z.array(z.object({
    identifier: z.string(),
    transport: z.enum(['p2p', 'email', 'discord', 'telegram', 'web']),
    signerAssignments: z.record(z.boolean()).optional(),
    preferences: z.object({
      fallbackTransport: z.string().optional(),
      notificationEnabled: z.boolean().optional()
    }).optional()
  })),
  metadata: z.object({
    deadline: z.string().optional(),
    message: z.string().optional(),
    requireAllSignatures: z.boolean().optional()
  }).optional()
});

const signDocumentsSchema = z.object({
  signatures: z.array(z.object({
    documentId: z.string(),
    signature: z.string(),
    components: z.array(z.unknown()),
    status: z.enum(['signed', 'rejected']),
    rejectReason: z.string().optional()
  })),
  returnTransport: z.string().optional()
});

export function createTransferRoutes(
  transportManager: TransportManager,
  storageManager: StorageManager
): Router {
  const router = Router();

  router.post('/create', validateRequest(createTransferSchema), (req, res) => {
    void (async () => {
    try {
      const transferId = nanoid();
      const body = req.body as {
        documents: Array<{ id: string; fileName: string; fileData?: string }>;
        recipients: Array<{ identifier: string; transport: string; signerAssignments?: Record<string, boolean>; preferences?: { fallbackTransport?: string; notificationEnabled?: boolean } }>;
        metadata?: { deadline?: string; message?: string; requireAllSignatures?: boolean };
      };
      const { documents, recipients, metadata } = body;

      await storageManager.createTransfer({
        transferId,
        type: 'outgoing',
        documents,
        recipients,
        metadata: {
          ...metadata,
          createdAt: Date.now()
        }
      });

      logger.info(`Transfer created: ${transferId}`);

      res.json({
        transferId,
        code: generateTransferCode(),
        status: 'created'
      });
    } catch (error) {
      logger.error('Error creating transfer:', error);
      res.status(500).json({ error: 'Failed to create transfer' });
    }
    })();
  });

  router.get('/', (req, res) => {
    void (async () => {
    try {
      const { type, limit = '100', offset = '0' } = req.query;
      const limitNum = parseInt(limit as string, 10);
      const offsetNum = parseInt(offset as string, 10);
      
      const transfers = await storageManager.listTransfers(
        type as 'incoming' | 'outgoing' | undefined, 
        limitNum
      );
      
      // Simple pagination (could be enhanced)
      const paginatedTransfers = transfers.slice(offsetNum, offsetNum + limitNum);
      
      res.json({ 
        transfers: paginatedTransfers,
        pagination: {
          total: transfers.length,
          limit: limitNum,
          offset: offsetNum,
          hasMore: offsetNum + limitNum < transfers.length
        }
      });
    } catch (error) {
      logger.error('Error listing transfers:', error);
      res.status(500).json({ error: 'Failed to list transfers' });
    }
    })();
  });

  router.get('/:transferId', (req, res) => {
    void (async () => {
    try {
      const { transferId } = req.params;
      const transferDetails = await storageManager.getTransferWithDetails(transferId);
      
      if (!transferDetails) {
        return res.status(404).json({ error: 'Transfer not found' });
      }

      const { transfer, documents, recipients } = transferDetails;

      // Build response according to API documentation
      res.json({
        transferId: transfer.id,
        type: transfer.type,
        sender: transfer.sender,
        status: transfer.status,
        transport: {
          type: transfer.transportType,
          deliveryStatus: 'delivered' // TODO: Track actual delivery status
        },
        documents: documents.map(doc => ({
          documentId: doc.id,
          fileName: doc.fileName,
          fileSize: doc.fileSize,
          fileHash: doc.fileHash,
          status: doc.status,
          url: `/api/transfers/${transferId}/documents/${doc.id}`,
          expires: null // TODO: Add document expiry
        })),
        recipients: recipients.map(rec => ({
          id: rec.id,
          identifier: rec.identifier,
          transport: rec.transport,
          status: rec.status,
          notifiedAt: rec.notifiedAt?.getTime(),
          viewedAt: rec.viewedAt?.getTime(),
          signedAt: rec.signedAt?.getTime()
        })),
        metadata: {
          ...transfer.metadata,
          createdAt: transfer.createdAt.getTime(),
          updatedAt: transfer.updatedAt.getTime()
        }
      });
    } catch (error) {
      logger.error('Error getting transfer:', error);
      res.status(500).json({ error: 'Failed to get transfer' });
    }
    })();
  });

  router.post('/:transferId/sign', validateRequest(signDocumentsSchema), (req, res) => void (async () => {
    try {
      const { transferId } = req.params;
      const body = req.body as {
        signatures: Array<{ documentId: string; signature: string; components: unknown[]; status: 'signed' | 'rejected'; rejectReason?: string }>;
        returnTransport?: string;
      };
      const { signatures, returnTransport } = body;

      const transfer = await storageManager.getTransfer(transferId);
      if (!transfer) {
        return res.status(404).json({ error: 'Transfer not found' });
      }

      await storageManager.updateTransferSignatures(transferId, signatures);

      if (returnTransport && transfer.type === 'incoming' && transfer.sender) {
        // For now, we'll just emit an event for the return transport
        // The actual implementation would need a proper OutgoingTransfer structure
        // which includes sender info, created date, status, etc.
        logger.info(`Return transport requested via ${returnTransport} for transfer ${transferId}`);
        
        // TODO: Implement proper return transport handling
        // This would require creating a new transfer in the opposite direction
        // with the signed documents
      }

      res.json({ status: 'success' });
    } catch (error) {
      logger.error('Error signing documents:', error);
      res.status(500).json({ error: 'Failed to sign documents' });
    }
  })());

  // Document download route
  router.get('/:transferId/documents/:documentId', (req, res) => {
    void (async () => {
    try {
      const { transferId, documentId } = req.params;
      
      // Get document metadata
      const document = await storageManager.getDocumentById(documentId);
      if (!document) {
        return res.status(404).json({ error: 'Document not found' });
      }
      
      // Verify document belongs to transfer
      if (document.transferId !== transferId) {
        return res.status(404).json({ error: 'Document not found in transfer' });
      }
      
      // Check if document file exists
      const exists = await storageManager.documentExists(transferId, document.fileName);
      if (!exists) {
        return res.status(404).json({ error: 'Document file not found' });
      }
      
      // Get document data
      const documentData = await storageManager.getDocument(transferId, document.fileName);
      
      // Set appropriate headers
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${document.fileName}"`);
      res.setHeader('Content-Length', documentData.length);
      
      res.send(documentData);
    } catch (error) {
      logger.error('Error downloading document:', error);
      res.status(500).json({ error: 'Failed to download document' });
    }
    })();
  });

  // Document upload route
  router.post('/:transferId/documents', (req, res) => {
    void (async () => {
    try {
      const { transferId } = req.params;
      const { documentId, fileName, fileData } = req.body as {
        documentId: string;
        fileName: string;
        fileData: string;
        metadata?: unknown;
      };
      
      if (!documentId || !fileName || !fileData) {
        return res.status(400).json({ error: 'Missing required fields: documentId, fileName, fileData' });
      }
      
      // Verify transfer exists
      const transfer = await storageManager.getTransfer(transferId);
      if (!transfer) {
        return res.status(404).json({ error: 'Transfer not found' });
      }
      
      // Convert base64 to buffer
      let documentBuffer: Buffer;
      try {
        documentBuffer = Buffer.from(fileData, 'base64');
      } catch {
        return res.status(400).json({ error: 'Invalid file data encoding' });
      }
      
      // Save document file
      const saveResult = await storageManager.saveDocument(transferId, fileName, documentBuffer);
      
      // Update document in database if it exists, otherwise it should have been created during transfer creation
      const existingDoc = await storageManager.getDocumentById(documentId);
      if (existingDoc) {
        // Update with actual file info
        // TODO: Add method to update document metadata in StorageManager
        logger.info(`Document ${documentId} updated with file data`);
      }
      
      res.json({
        success: true,
        documentId,
        fileName,
        fileSize: documentBuffer.length,
        fileHash: saveResult.hash || undefined
      });
    } catch (error) {
      logger.error('Error uploading document:', error);
      res.status(500).json({ error: 'Failed to upload document' });
    }
    })();
  });

  // Get signed document
  router.get('/:transferId/documents/:documentId/signed', (req, res) => {
    void (async () => {
    try {
      const { transferId, documentId } = req.params;
      
      // Get document metadata
      const document = await storageManager.getDocumentById(documentId);
      if (!document) {
        return res.status(404).json({ error: 'Document not found' });
      }
      
      // Verify document belongs to transfer and is signed
      if (document.transferId !== transferId) {
        return res.status(404).json({ error: 'Document not found in transfer' });
      }
      
      if (document.status !== 'signed') {
        return res.status(400).json({ error: 'Document is not signed' });
      }
      
      // Check if signed document file exists
      const signedFileName = `signed-${document.fileName}`;
      const exists = await storageManager.documentExists(transferId, signedFileName, true);
      if (!exists) {
        return res.status(404).json({ error: 'Signed document file not found' });
      }
      
      // Get signed document data
      const documentData = await storageManager.getSignedDocument(transferId, signedFileName);
      
      // Set appropriate headers
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${signedFileName}"`);
      res.setHeader('Content-Length', documentData.length);
      
      res.send(documentData);
    } catch (error) {
      logger.error('Error downloading signed document:', error);
      res.status(500).json({ error: 'Failed to download signed document' });
    }
    })();
  });

  return router;
}

function generateTransferCode(): string {
  const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}