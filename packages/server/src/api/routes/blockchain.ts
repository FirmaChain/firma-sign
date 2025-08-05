import { Router } from 'express';
import { z } from 'zod';
import crypto from 'crypto';
import { validateRequest } from '../middleware/validation.js';
import { logger } from '../../utils/logger.js';

const storeHashSchema = z.object({
  transferId: z.string(),
  documentHash: z.string(),
  type: z.enum(['original', 'signed']),
  metadata: z.object({
    fileName: z.string(),
    signers: z.array(z.string())
  }).optional()
});

const compareHashSchema = z.object({
  documentData: z.string(),
  expectedHash: z.string(),
  transactionId: z.string()
});

interface StoredHash {
  transferId: string;
  hash: string;
  transactionId: string;
  blockNumber: number;
  timestamp: number;
  type: 'original' | 'signed';
}

const hashStorage = new Map<string, StoredHash[]>();
let mockBlockNumber = 1000;

export function createBlockchainRoutes(): Router {
  const router = Router();

  router.post('/store-hash', validateRequest(storeHashSchema), (req, res) => {
    try {
      const { transferId, documentHash, type } = req.body as { transferId: string; documentHash: string; type: 'original' | 'signed' };

      const transactionId = `0x${crypto.randomBytes(32).toString('hex')}`;
      const blockNumber = ++mockBlockNumber;
      
      const storedHash: StoredHash = {
        transferId,
        hash: documentHash,
        transactionId,
        blockNumber,
        timestamp: Date.now(),
        type
      };

      const existing = hashStorage.get(transferId) || [];
      existing.push(storedHash);
      hashStorage.set(transferId, existing);

      logger.info(`Hash stored for transfer ${transferId}:`, {
        type,
        transactionId,
        blockNumber
      });

      res.json({
        success: true,
        transactionId,
        blockNumber,
        timestamp: storedHash.timestamp
      });
    } catch (error) {
      logger.error('Error storing hash:', error);
      res.status(500).json({ error: 'Failed to store hash' });
    }
  });

  router.get('/verify-hash/:transferId', (req, res) => {
    try {
      const { transferId } = req.params;
      
      const hashes = hashStorage.get(transferId) || [];
      
      const response = {
        transferId,
        hashes: {
          original: hashes.find(h => h.type === 'original'),
          signed: hashes.find(h => h.type === 'signed')
        },
        verified: hashes.length > 0
      };

      res.json(response);
    } catch (error) {
      logger.error('Error verifying hash:', error);
      res.status(500).json({ error: 'Failed to verify hash' });
    }
  });

  router.post('/compare-hash', validateRequest(compareHashSchema), (req, res) => {
    try {
      const { documentData, expectedHash, transactionId } = req.body as { documentData: string; expectedHash: string; transactionId: string };
      
      const documentBuffer = Buffer.from(documentData, 'base64');
      const calculatedHash = crypto
        .createHash('sha256')
        .update(documentBuffer)
        .digest('hex');

      const isValid = calculatedHash === expectedHash;

      let storedHash = null;
      for (const hashes of hashStorage.values()) {
        const found = hashes.find(h => h.transactionId === transactionId);
        if (found) {
          storedHash = found;
          break;
        }
      }

      res.json({
        valid: isValid && storedHash !== null,
        calculatedHash,
        expectedHash,
        transactionFound: storedHash !== null
      });
    } catch (error) {
      logger.error('Error comparing hash:', error);
      res.status(500).json({ error: 'Failed to compare hash' });
    }
  });

  router.get('/transaction/:transactionId', (req, res) => {
    try {
      const { transactionId } = req.params;
      
      let foundHash = null;
      for (const hashes of hashStorage.values()) {
        const found = hashes.find(h => h.transactionId === transactionId);
        if (found) {
          foundHash = found;
          break;
        }
      }

      if (!foundHash) {
        return res.status(404).json({ error: 'Transaction not found' });
      }

      res.json({
        transactionId,
        hash: foundHash.hash,
        blockNumber: foundHash.blockNumber,
        timestamp: foundHash.timestamp,
        transferId: foundHash.transferId,
        type: foundHash.type
      });
    } catch (error) {
      logger.error('Error getting transaction:', error);
      res.status(500).json({ error: 'Failed to get transaction' });
    }
  });

  return router;
}