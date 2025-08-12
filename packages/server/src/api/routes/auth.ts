import { Router } from 'express';
import { z } from 'zod';
import { nanoid } from 'nanoid';
import forge from 'node-forge';
import { validateRequest } from '../middleware/validation.js';
import { logger } from '../../utils/logger.js';

const connectSchema = z.object({
  code: z.string().length(6),
  transport: z.string().optional()
});

interface Session {
  sessionId: string;
  transferId: string;
  expiresAt: number;
}

const sessions = new Map<string, Session>();
const transferCodes = new Map<string, string>();

export function createAuthRoutes(): Router {
  const router = Router();

  router.post('/connect', validateRequest(connectSchema), (req, res) => {
    try {
      const { code } = req.body as { code: string; transport?: string };
      
      const transferId = transferCodes.get(code);
      if (!transferId) {
        return res.status(401).json({ error: 'Invalid transfer code' });
      }

      const sessionId = nanoid();
      const session: Session = {
        sessionId,
        transferId,
        expiresAt: Date.now() + 24 * 60 * 60 * 1000
      };

      sessions.set(sessionId, session);
      transferCodes.delete(code);

      logger.info(`Session created for transfer ${transferId}`);

      res.json({
        success: true,
        transferId,
        sessionToken: sessionId, // Use sessionId as the token
        expiresIn: 86400 // 24 hours in seconds
      });
    } catch (error) {
      logger.error('Error in connect:', error);
      res.status(500).json({ error: 'Failed to connect' });
    }
  });

  router.post('/generate-keypair', (req, res) => {
    try {
      const keypair = forge.pki.rsa.generateKeyPair({ bits: 2048 });
      const publicKeyPem = forge.pki.publicKeyToPem(keypair.publicKey);
      const privateKeyPem = forge.pki.privateKeyToPem(keypair.privateKey);

      res.json({
        publicKey: publicKeyPem,
        privateKey: privateKeyPem
      });
    } catch (error) {
      logger.error('Error generating keypair:', error);
      res.status(500).json({ error: 'Failed to generate keypair' });
    }
  });

  setInterval(() => {
    const now = Date.now();
    for (const [sessionId, session] of sessions.entries()) {
      if (session.expiresAt < now) {
        sessions.delete(sessionId);
        logger.info(`Session expired: ${sessionId}`);
      }
    }
  }, 60 * 60 * 1000);

  return router;
}

export function generateTransferCode(transferId: string): string {
  const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  transferCodes.set(code, transferId);
  return code;
}

export function validateSession(sessionId: string): Session | null {
  const session = sessions.get(sessionId);
  if (!session || session.expiresAt < Date.now()) {
    return null;
  }
  return session;
}