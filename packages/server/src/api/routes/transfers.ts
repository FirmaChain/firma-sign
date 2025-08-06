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
    try {
      const transfers = storageManager.listTransfers();
      res.json({ transfers });
    } catch (error) {
      logger.error('Error listing transfers:', error);
      res.status(500).json({ error: 'Failed to list transfers' });
    }
  });

  router.get('/:transferId', (req, res) => void (async () => {
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
  })());

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