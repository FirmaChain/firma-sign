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
    components: z.array(z.any()),
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

  router.post('/create', validateRequest(createTransferSchema), async (req, res) => {
    try {
      const transferId = nanoid();
      const { documents, recipients, metadata } = req.body;

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
  });

  router.get('/', async (req, res) => {
    try {
      const transfers = await storageManager.listTransfers();
      res.json({ transfers });
    } catch (error) {
      logger.error('Error listing transfers:', error);
      res.status(500).json({ error: 'Failed to list transfers' });
    }
  });

  router.get('/:transferId', async (req, res) => {
    try {
      const { transferId } = req.params;
      const transfer = await storageManager.getTransfer(transferId);
      
      if (!transfer) {
        return res.status(404).json({ error: 'Transfer not found' });
      }

      res.json(transfer);
    } catch (error) {
      logger.error('Error getting transfer:', error);
      res.status(500).json({ error: 'Failed to get transfer' });
    }
  });

  router.post('/:transferId/sign', validateRequest(signDocumentsSchema), async (req, res) => {
    try {
      const { transferId } = req.params;
      const { signatures, returnTransport } = req.body;

      const transfer = await storageManager.getTransfer(transferId);
      if (!transfer) {
        return res.status(404).json({ error: 'Transfer not found' });
      }

      await storageManager.updateTransferSignatures(transferId, signatures);

      if (returnTransport && transfer.type === 'incoming') {
        await transportManager.send(returnTransport, {
          transferId,
          documents: signatures.map(sig => ({
            documentId: sig.documentId,
            status: sig.status,
            signature: sig.signature
          })),
          recipients: [transfer.sender]
        });
      }

      res.json({ status: 'success' });
    } catch (error) {
      logger.error('Error signing documents:', error);
      res.status(500).json({ error: 'Failed to sign documents' });
    }
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