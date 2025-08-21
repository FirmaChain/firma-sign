import { WebSocketServer as WSServer, WebSocket } from 'ws';
import { Server as HTTPServer } from 'http';
import { EventEmitter } from 'events';
import { nanoid } from 'nanoid';
import jwt from 'jsonwebtoken';
import { logger } from '../utils/logger.js';
import { configManager } from '../config/ConfigManager.js';

interface Client {
  id: string;
  ws: WebSocket;
  transferIds: Set<string>;
  authenticated: boolean;
  sessionId?: string;
  userId?: string;
  connectedAt: number;
  lastActivity: number;
}

interface AuthMessage {
  type: 'auth';
  token?: string;
  sessionId?: string;
}

interface SubscribeMessage {
  type: 'subscribe';
  transferId: string;
}

interface UnsubscribeMessage {
  type: 'unsubscribe';
  transferId: string;
}

type WebSocketMessage = AuthMessage | SubscribeMessage | UnsubscribeMessage;

export class WebSocketServer extends EventEmitter {
  private wss: WSServer;
  private clients: Map<string, Client> = new Map();
  private jwtSecret: string;
  private sessionValidationCallback?: (sessionId: string) => Promise<boolean>;
  private cleanupInterval?: NodeJS.Timeout;

  constructor(server: HTTPServer, jwtSecret?: string) {
    super();
    this.jwtSecret = jwtSecret || configManager.getJwtSecret() || 'default-secret';
    this.wss = new WSServer({ 
      server,
      path: '/ws' // Specify a path to avoid conflicts with /explorer
    });
    this.setupWebSocketServer();
    this.startCleanupInterval();
  }

  /**
   * Set a callback to validate sessions
   */
  setSessionValidator(callback: (sessionId: string) => Promise<boolean>) {
    this.sessionValidationCallback = callback;
  }

  private setupWebSocketServer() {
    this.wss.on('connection', (ws: WebSocket) => {
      const clientId = nanoid();
      const now = Date.now();
      const client: Client = {
        id: clientId,
        ws,
        transferIds: new Set(),
        authenticated: false,
        connectedAt: now,
        lastActivity: now
      };

      this.clients.set(clientId, client);
      logger.info(`WebSocket client connected: ${clientId}`);

      ws.on('message', (data: Buffer) => {
        try {
          client.lastActivity = Date.now();
          const message = JSON.parse(data.toString()) as WebSocketMessage;
          this.handleMessage(client, message);
        } catch (error) {
          logger.error('Invalid WebSocket message:', error);
          this.sendError(client, 'Invalid message format');
        }
      });

      ws.on('close', () => {
        this.clients.delete(clientId);
        logger.info(`WebSocket client disconnected: ${clientId}`);
      });

      ws.on('error', (error) => {
        logger.error(`WebSocket error for client ${clientId}:`, error);
      });

      ws.on('pong', () => {
        client.lastActivity = Date.now();
      });

      this.sendMessage(client, {
        type: 'connected',
        clientId,
        serverTime: Date.now()
      });
    });
  }

  private handleMessage(client: Client, message: WebSocketMessage) {
    switch (message.type) {
      case 'auth':
        void this.handleAuth(client, message);
        break;
      case 'subscribe':
        this.handleSubscribe(client, message);
        break;
      case 'unsubscribe':
        this.handleUnsubscribe(client, message);
        break;
      default:
        this.sendError(client, 'Unknown message type');
    }
  }

  private async handleAuth(client: Client, message: AuthMessage) {
    try {
      let isValid = false;
      let sessionId: string | undefined;
      let userId: string | undefined;

      if (message.token) {
        // JWT token authentication
        try {
          const decoded = jwt.verify(message.token, this.jwtSecret) as { sessionId: string; userId: string; [key: string]: unknown };
          sessionId = decoded.sessionId;
          userId = decoded.userId;
          isValid = true;
        } catch (error) {
          logger.warn(`Invalid JWT token for client ${client.id}:`, (error as Error).message);
        }
      } else if (message.sessionId) {
        // Session ID authentication
        sessionId = message.sessionId;
        if (this.sessionValidationCallback) {
          isValid = await this.sessionValidationCallback(sessionId);
        } else {
          // Default validation - accept any session ID
          isValid = true;
        }
      }

      if (isValid) {
        client.authenticated = true;
        client.sessionId = sessionId;
        client.userId = userId;
        
        this.sendMessage(client, {
          type: 'auth:success',
          sessionId: client.sessionId,
          userId: client.userId
        });
        
        logger.info(`Client ${client.id} authenticated`, { sessionId, userId });
      } else {
        this.sendMessage(client, {
          type: 'auth:failed',
          error: 'Invalid credentials'
        });
        
        logger.warn(`Authentication failed for client ${client.id}`);
      }
    } catch (error) {
      logger.error(`Auth error for client ${client.id}:`, error);
      this.sendError(client, 'Authentication error');
    }
  }

  private handleSubscribe(client: Client, message: SubscribeMessage) {
    if (!client.authenticated) {
      this.sendError(client, 'Not authenticated');
      return;
    }

    const { transferId } = message;
    if (transferId) {
      client.transferIds.add(transferId);
      this.sendMessage(client, {
        type: 'subscribed',
        transferId,
        timestamp: Date.now()
      });
      
      logger.debug(`Client ${client.id} subscribed to transfer ${transferId}`);
    }
  }

  private handleUnsubscribe(client: Client, message: UnsubscribeMessage) {
    const { transferId } = message;
    if (transferId) {
      client.transferIds.delete(transferId);
      this.sendMessage(client, {
        type: 'unsubscribed',
        transferId,
        timestamp: Date.now()
      });
      
      logger.debug(`Client ${client.id} unsubscribed from transfer ${transferId}`);
    }
  }

  broadcastToTransfer(transferId: string, event: string, data: unknown) {
    const message = {
      type: 'event',
      event,
      transferId,
      data,
      timestamp: Date.now()
    };

    let count = 0;
    this.clients.forEach(client => {
      if (client.transferIds.has(transferId) && client.ws.readyState === WebSocket.OPEN) {
        this.sendMessage(client, message);
        count++;
      }
    });

    logger.debug(`Broadcast to ${count} clients for transfer ${transferId}`);
  }

  broadcast(event: string, data: unknown) {
    const message = {
      type: 'broadcast',
      event,
      data,
      timestamp: Date.now()
    };

    this.clients.forEach(client => {
      if (client.authenticated && client.ws.readyState === WebSocket.OPEN) {
        this.sendMessage(client, message);
      }
    });
  }

  private sendMessage(client: Client, message: unknown) {
    if (client.ws.readyState === WebSocket.OPEN) {
      client.ws.send(JSON.stringify(message));
    }
  }

  private sendError(client: Client, error: string) {
    this.sendMessage(client, {
      type: 'error',
      error
    });
  }

  /**
   * Start cleanup interval for inactive connections
   */
  private startCleanupInterval() {
    this.cleanupInterval = setInterval(() => {
      this.cleanupInactiveConnections();
      this.sendPing();
    }, 30000); // Every 30 seconds
  }

  /**
   * Clean up inactive connections
   */
  private cleanupInactiveConnections() {
    const now = Date.now();
    const timeout = 5 * 60 * 1000; // 5 minutes
    
    for (const [clientId, client] of this.clients) {
      if (now - client.lastActivity > timeout) {
        logger.info(`Closing inactive connection: ${clientId}`);
        client.ws.close();
        this.clients.delete(clientId);
      }
    }
  }

  /**
   * Send ping to all clients to keep connections alive
   */
  private sendPing() {
    for (const client of this.clients.values()) {
      if (client.ws.readyState === WebSocket.OPEN) {
        client.ws.ping();
      }
    }
  }

  /**
   * Send event to specific client
   */
  sendToClient(clientId: string, event: string, data: unknown): boolean {
    const client = this.clients.get(clientId);
    if (client && client.authenticated && client.ws.readyState === WebSocket.OPEN) {
      this.sendMessage(client, {
        type: 'event',
        event,
        data,
        timestamp: Date.now()
      });
      return true;
    }
    return false;
  }

  /**
   * Get connection statistics
   */
  getConnectionStats(): {
    total: number;
    authenticated: number;
    subscriptions: number;
    averageUptime: number;
  } {
    const now = Date.now();
    let authenticated = 0;
    let subscriptions = 0;
    let totalUptime = 0;

    for (const client of this.clients.values()) {
      if (client.authenticated) {
        authenticated++;
      }
      subscriptions += client.transferIds.size;
      totalUptime += now - client.connectedAt;
    }

    return {
      total: this.clients.size,
      authenticated,
      subscriptions,
      averageUptime: this.clients.size > 0 ? totalUptime / this.clients.size : 0
    };
  }

  /**
   * Get clients subscribed to a transfer
   */
  getTransferSubscribers(transferId: string): string[] {
    const subscribers: string[] = [];
    for (const client of this.clients.values()) {
      if (client.transferIds.has(transferId)) {
        subscribers.push(client.id);
      }
    }
    return subscribers;
  }

  getConnectionCount(): number {
    return this.clients.size;
  }

  getAuthenticatedCount(): number {
    return Array.from(this.clients.values()).filter(c => c.authenticated).length;
  }

  close() {
    logger.info('Closing WebSocket server');
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
    this.wss.close();
  }
}