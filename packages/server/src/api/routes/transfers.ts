import { Router } from 'express';
import { z } from 'zod';
import { nanoid } from 'nanoid';
import type { TransportManager } from '../../transport/TransportManager.js';
import type { StorageManager } from '../../storage/StorageManager.js';
import type { DocumentService } from '../../services/DocumentService.js';
import { validateRequest } from '../middleware/validation.js';
import { logger } from '../../utils/logger.js';
import { generateHash } from '@firmachain/firma-sign-core';
import { generateTransferCode } from './auth.js';

const createTransferSchema = z.object({
  documents: z.array(z.object({
    id: z.string(),
    fileName: z.string(),
    fileData: z.string().optional()
  })).min(1, "At least one document is required"),
  recipients: z.array(z.object({
    identifier: z.string(),
    transport: z.enum(['p2p', 'email', 'discord', 'telegram', 'web']),
    signerAssignments: z.record(z.boolean()).optional(),
    preferences: z.object({
      fallbackTransport: z.string().optional(),
      notificationEnabled: z.boolean().optional()
    }).optional()
  })).min(1, "At least one recipient is required"),
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
  })).min(1, "At least one signature is required"),
  returnTransport: z.string().optional()
});

const simpleTransferSchema = z.object({
  documentId: z.string(),
  recipients: z.array(z.object({
    peerId: z.string().optional(),
    identifier: z.string().optional(),
    transport: z.string()
  })).min(1, "At least one recipient is required"),
  requiresSignature: z.boolean().optional(),
  message: z.string().optional()
});

export function createTransferRoutes(
  transportManager: TransportManager,
  storageManager: StorageManager,
  documentService?: DocumentService
): Router {
  const router = Router();

  // Simple transfer route for frontend
  router.post('/', validateRequest(simpleTransferSchema), (req, res) => {
    void (async () => {
    try {
      const transferId = nanoid();
      const body = req.body as {
        documentId: string;
        recipients: Array<{ peerId?: string; identifier?: string; transport: string }>;
        requiresSignature?: boolean;
        message?: string;
      };
      const { documentId, recipients, message } = body;

      // Get document metadata if DocumentService is available
      let document;
      if (documentService) {
        try {
          const result = await documentService.getDocument(documentId);
          document = result.metadata;
        } catch (error) {
          logger.warn(`Document ${documentId} not found in DocumentService, creating transfer anyway`, error);
        }
      }

      // Format recipients for storage
      const formattedRecipients = recipients.map(rec => ({
        identifier: rec.peerId || rec.identifier || '',
        transport: rec.transport,
        preferences: {}
      }));

      // Create the transfer record
      await storageManager.createTransfer({
        transferId,
        type: 'outgoing',
        documents: [{
          id: documentId,
          fileName: document?.originalName || `document-${documentId}.pdf`,
          fileHash: document?.hash,
          fileSize: document?.size
        }],
        recipients: formattedRecipients,
        metadata: {
          message,
          createdAt: Date.now()
        }
      });

      logger.info(`Simple transfer created: ${transferId} for document: ${documentId}`);

      res.json({
        transferId,
        status: 'created'
      });
    } catch (error) {
      logger.error('Error creating simple transfer:', error);
      res.status(500).json({ error: 'Failed to create transfer' });
    }
    })();
  });

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

      // First, create the transfer record so documents can reference it
      await storageManager.createTransfer({
        transferId,
        type: 'outgoing',
        documents: documents.map(doc => ({
          id: doc.id,
          fileName: doc.fileName,
          fileHash: undefined,
          fileSize: undefined
        })),
        recipients,
        metadata: {
          ...metadata,
          createdAt: Date.now()
        }
      });

      // Now process documents and calculate their hashes if file data is provided
      await Promise.all(documents.map(async (doc) => {
        let fileHash: string | undefined;
        let fileSize: number | undefined;
        
        if (doc.fileData) {
          try {
            const buffer = Buffer.from(doc.fileData, 'base64');
            fileHash = generateHash(buffer);
            fileSize = buffer.length;
            
            // Store the document file using StorageManager
            await storageManager.saveDocument(transferId, doc.fileName, buffer);
          } catch (err) {
            logger.warn(`Failed to process document data for ${doc.fileName}:`, err);
          }
        }
        
        // Update the document in the database with hash and size if we processed it
        if (fileHash && fileSize) {
          try {
            await storageManager.updateDocumentMetadata(doc.id, { fileHash, fileSize });
          } catch (err) {
            logger.warn(`Failed to update document metadata for ${doc.fileName}:`, err);
          }
        }

        // Document processing completed
      }));

      logger.info(`Transfer created: ${transferId}`);

      res.json({
        transferId,
        code: generateTransferCode(transferId),
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
      const { type, status, limit = '100', offset = '0' } = req.query;
      const limitNum = parseInt(limit as string, 10);
      const offsetNum = parseInt(offset as string, 10);
      
      // Validate parameters
      if (limitNum < 1 || limitNum > 1000) {
        return res.status(400).json({ error: 'Limit must be between 1 and 1000' });
      }
      if (offsetNum < 0) {
        return res.status(400).json({ error: 'Offset must be non-negative' });
      }
      
      let transfers = await storageManager.listTransfers(
        type as 'incoming' | 'outgoing' | undefined, 
        limitNum + offsetNum // Fetch enough for pagination
      );
      
      // Filter by status if provided
      if (status) {
        const validStatuses = ['pending', 'ready', 'partially-signed', 'completed'];
        if (!validStatuses.includes(status as string)) {
          return res.status(400).json({ error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` });
        }
        transfers = transfers.filter(t => t.status === status);
      }
      
      // Apply pagination
      const paginatedTransfers = transfers.slice(offsetNum, offsetNum + limitNum);
      
      // Format transfers for response
      const formattedTransfers = await Promise.all(paginatedTransfers.map(async (transfer) => {
        // Get document count for the transfer
        const documents = await storageManager.getDocumentsByTransferId(transfer.id);
        
        return {
          transferId: transfer.id,
          type: transfer.type,
          sender: transfer.sender,
          documentCount: documents.length,
          status: transfer.status,
          createdAt: transfer.createdAt.getTime(),
          updatedAt: transfer.updatedAt.getTime()
        };
      }));
      
      res.json({ 
        transfers: formattedTransfers,
        total: transfers.length,
        hasMore: offsetNum + limitNum < transfers.length
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

      // Process each signature
      const signedDocuments = [];
      for (const sig of signatures) {
        if (sig.status === 'signed' && sig.signature) {
          // Save the signed version
          const document = await storageManager.getDocumentById(sig.documentId);
          if (document) {
            const signedFileName = `signed-${document.fileName}`;
            const signedData = Buffer.from(sig.signature, 'base64');
            
            // Save signed document
            await storageManager.saveSignedDocument(transferId, signedFileName, signedData);
            
            // Calculate blockchain hash if needed
            const blockchainTx = generateHash(signedData);
            
            // Update document status in database
            await storageManager.updateTransferSignatures(transferId, [{
              documentId: sig.documentId,
              status: 'signed',
              signedBy: 'user', // In real implementation, get from session
              blockchainTxSigned: blockchainTx
            }]);
            
            signedDocuments.push({
              documentId: sig.documentId,
              signedUrl: `/api/transfers/${transferId}/documents/${sig.documentId}/signed`,
              blockchainTx
            });
          }
        } else if (sig.status === 'rejected') {
          // Update document status to rejected
          await storageManager.updateTransferSignatures(transferId, [{
            documentId: sig.documentId,
            status: 'rejected',
            signedBy: undefined
          }]);
        }
      }

      if (returnTransport && transfer.type === 'incoming' && transfer.sender) {
        // Create return transfer with signed documents
        const returnTransferId = nanoid();
        await storageManager.createTransfer({
          transferId: returnTransferId,
          type: 'outgoing',
          documents: signedDocuments.map(d => ({
            id: nanoid(),
            fileName: `signed-${d.documentId}.pdf`,
            fileHash: d.blockchainTx
          })),
          recipients: [{
            identifier: transfer.sender.senderId || transfer.sender.email || '',
            transport: returnTransport,
            preferences: {}
          }],
          metadata: {
            originalTransferId: transferId,
            returnTransport: true,
            createdAt: Date.now()
          }
        });
        
        logger.info(`Return transfer created: ${returnTransferId} via ${returnTransport}`);
      }

      res.json({ 
        status: 'success',
        signedDocuments
      });
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

