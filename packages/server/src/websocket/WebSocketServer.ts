import { WebSocketServer as WSServer, WebSocket } from 'ws';
import { Server as HTTPServer } from 'http';
import { EventEmitter } from 'events';
import { nanoid } from 'nanoid';
import { logger } from '../utils/logger.js';

interface Client {
  id: string;
  ws: WebSocket;
  transferIds: Set<string>;
  authenticated: boolean;
}

export class WebSocketServer extends EventEmitter {
  private wss: WSServer;
  private clients: Map<string, Client> = new Map();

  constructor(server: HTTPServer) {
    super();
    this.wss = new WSServer({ server });
    this.setupWebSocketServer();
  }

  private setupWebSocketServer() {
    this.wss.on('connection', (ws: WebSocket) => {
      const clientId = nanoid();
      const client: Client = {
        id: clientId,
        ws,
        transferIds: new Set(),
        authenticated: false
      };

      this.clients.set(clientId, client);
      logger.info(`WebSocket client connected: ${clientId}`);

      ws.on('message', (data: Buffer) => {
        try {
          const message = JSON.parse(data.toString());
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

      this.sendMessage(client, {
        type: 'connected',
        clientId
      });
    });
  }

  private handleMessage(client: Client, message: any) {
    switch (message.type) {
      case 'auth':
        this.handleAuth(client, message);
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

  private handleAuth(client: Client, message: any) {
    client.authenticated = true;
    this.sendMessage(client, {
      type: 'auth:success'
    });
  }

  private handleSubscribe(client: Client, message: any) {
    if (!client.authenticated) {
      this.sendError(client, 'Not authenticated');
      return;
    }

    const { transferId } = message;
    if (transferId) {
      client.transferIds.add(transferId);
      this.sendMessage(client, {
        type: 'subscribed',
        transferId
      });
    }
  }

  private handleUnsubscribe(client: Client, message: any) {
    const { transferId } = message;
    if (transferId) {
      client.transferIds.delete(transferId);
      this.sendMessage(client, {
        type: 'unsubscribed',
        transferId
      });
    }
  }

  broadcastToTransfer(transferId: string, event: string, data: any) {
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

  broadcast(event: string, data: any) {
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

  private sendMessage(client: Client, message: any) {
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

  getConnectionCount(): number {
    return this.clients.size;
  }

  close() {
    this.wss.close();
  }
}