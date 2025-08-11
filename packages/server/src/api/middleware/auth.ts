import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { logger } from '../../utils/logger.js';

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    sessionId: string;
    transferId?: string;
  };
}

/**
 * Middleware to require authentication
 */
export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
      res.status(401).json({ error: 'Authorization header required' });
      return;
    }

    const token = authHeader.startsWith('Bearer ') 
      ? authHeader.slice(7) 
      : authHeader;

    if (!token) {
      res.status(401).json({ error: 'Token required' });
      return;
    }

    // Get JWT secret from environment or use default for development
    const jwtSecret = process.env.JWT_SECRET || 'development-secret-key';

    try {
      const decoded = jwt.verify(token, jwtSecret) as {
        id: string;
        sessionId: string;
        transferId?: string;
        exp?: number;
      };

      // Check if token is expired
      if (decoded.exp && decoded.exp * 1000 < Date.now()) {
        res.status(401).json({ error: 'Token expired' });
        return;
      }

      // Attach user info to request
      (req as AuthenticatedRequest).user = {
        id: decoded.id || decoded.sessionId,
        sessionId: decoded.sessionId,
        transferId: decoded.transferId
      };

      next();
    } catch (error) {
      logger.warn('Invalid token:', error);
      res.status(401).json({ error: 'Invalid token' });
      return;
    }
  } catch (error) {
    logger.error('Auth middleware error:', error);
    res.status(500).json({ error: 'Authentication error' });
    return;
  }
}

/**
 * Optional authentication - doesn't fail if no token, but adds user if present
 */
export function optionalAuth(req: Request, _res: Response, next: NextFunction): void {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
      return next();
    }

    const token = authHeader.startsWith('Bearer ') 
      ? authHeader.slice(7) 
      : authHeader;

    if (!token) {
      return next();
    }

    const jwtSecret = process.env.JWT_SECRET || 'development-secret-key';

    try {
      const decoded = jwt.verify(token, jwtSecret) as {
        id: string;
        sessionId: string;
        transferId?: string;
        exp?: number;
      };

      if (!decoded.exp || decoded.exp * 1000 >= Date.now()) {
        (req as AuthenticatedRequest).user = {
          id: decoded.id || decoded.sessionId,
          sessionId: decoded.sessionId,
          transferId: decoded.transferId
        };
      }
    } catch {
      // Invalid token, but that's okay for optional auth
    }

    next();
  } catch (error) {
    logger.error('Optional auth middleware error:', error);
    next();
  }
}