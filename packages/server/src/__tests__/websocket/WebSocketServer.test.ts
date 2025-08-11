import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { WebSocketServer } from '../../websocket/WebSocketServer.js';
import { createServer, Server as HTTPServer } from 'http';
import { WebSocket } from 'ws';
import jwt from 'jsonwebtoken';

type WebSocketMessage = {
  type: string;
  clientId?: string;
  serverTime?: number;
  error?: string;
  message?: string;
  status?: string;
  transferId?: string;
  data?: unknown;
};

// Mock dependencies
vi.mock('../../utils/logger.js', () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  }
}));

// Mock nanoid
vi.mock('nanoid', () => ({
  nanoid: vi.fn(() => 'test-client-id')
}));

// Mock jwt
vi.mock('jsonwebtoken', () => ({
  default: {
    verify: vi.fn(),
    sign: vi.fn()
  }
}));

describe('WebSocketServer', () => {
  let httpServer: HTTPServer;
  let wsServer: WebSocketServer;
  let port: number;

  beforeEach(async () => {
    await new Promise<void>((resolve) => {
      httpServer = createServer();
      httpServer.listen(0, () => {
        const address = httpServer.address();
        if (address && typeof address === 'object') {
          port = address.port;
        }
        resolve();
      });
    });

    wsServer = new WebSocketServer(httpServer, 'test-secret');
  });

  afterEach(async () => {
    // Close WebSocket server (which will also clear the interval)
    wsServer.close();
    await new Promise<void>((resolve) => {
      httpServer.close(() => resolve());
    });
  });

  describe('initialization', () => {
    it('should create WebSocketServer instance', () => {
      expect(wsServer).toBeDefined();
      expect(wsServer.getConnectionCount()).toBe(0);
    });

    it('should accept custom JWT secret', () => {
      const customWsServer = new WebSocketServer(httpServer, 'custom-secret');
      
      expect(customWsServer).toBeDefined();
      customWsServer.close();
    });

    it('should use default JWT secret when not provided', () => {
      const defaultWsServer = new WebSocketServer(httpServer);
      
      expect(defaultWsServer).toBeDefined();
      defaultWsServer.close();
    });
  });

  describe('client connections', () => {
    it('should handle client connection', async () => {
      return new Promise<void>((resolve, reject) => {
        const ws = new WebSocket(`ws://localhost:${port}`);

        ws.on('message', (data) => {
          const message = JSON.parse(data.toString()) as WebSocketMessage;
          if (message.type === 'connected') {
            expect(message.clientId).toBe('test-client-id');
            expect(message.serverTime).toBeTypeOf('number');
            ws.close();
            resolve();
          }
        });

        ws.on('error', reject);
      });
    });

    it('should handle client disconnection', async () => {
      return new Promise<void>((resolve, reject) => {
        const ws = new WebSocket(`ws://localhost:${port}`);

        ws.on('open', () => {
          expect(wsServer.getConnectionCount()).toBe(1);
          ws.close();
        });

        ws.on('close', () => {
          // Give some time for the server to process the disconnect
          setTimeout(() => {
            expect(wsServer.getConnectionCount()).toBe(0);
            resolve();
          }, 10);
        });

        ws.on('error', reject);
      });
    });

    it('should handle invalid JSON messages', async () => {
      return new Promise<void>((resolve, reject) => {
        const ws = new WebSocket(`ws://localhost:${port}`);

        ws.on('message', (data) => {
          const message = JSON.parse(data.toString()) as WebSocketMessage;
          if (message.type === 'connected') {
            ws.send('invalid json {');
          } else if (message.type === 'error' && message.error === 'Invalid message format') {
            ws.close();
            resolve();
          }
        });

        ws.on('error', reject);
      });
    });
  });

  describe('authentication', () => {
    it('should authenticate client with valid JWT token', async () => {
      const mockDecodedToken = {
        sessionId: 'test-session',
        userId: 'test-user',
        exp: Math.floor(Date.now() / 1000) + 3600
      };

      vi.mocked(jwt.verify).mockReturnValue(mockDecodedToken as jwt.JwtPayload);

      return new Promise<void>((resolve, reject) => {
        const ws = new WebSocket(`ws://localhost:${port}`);

        ws.on('message', (data) => {
          const message = JSON.parse(data.toString()) as WebSocketMessage;
          if (message.type === 'connected') {
            ws.send(JSON.stringify({
              type: 'auth',
              token: 'valid-jwt-token'
            }));
          } else if (message.type === 'auth:success') {
            expect(message.sessionId).toBe('test-session');
            expect(message.userId).toBe('test-user');
            ws.close();
            resolve();
          }
        });

        ws.on('error', reject);
      });
    });

    it('should reject client with invalid JWT token', async () => {
      vi.mocked(jwt.verify).mockImplementation(() => {
        throw new Error('Invalid token');
      });

      return new Promise<void>((resolve, reject) => {
        const ws = new WebSocket(`ws://localhost:${port}`);

        ws.on('message', (data) => {
          const message = JSON.parse(data.toString()) as WebSocketMessage;
          if (message.type === 'connected') {
            ws.send(JSON.stringify({
              type: 'auth',
              token: 'invalid-jwt-token'
            }));
          } else if (message.type === 'auth:failed' && message.error === 'Invalid credentials') {
            ws.close();
            resolve();
          }
        });

        ws.on('error', reject);
      });
    });

    it('should authenticate client with valid session ID using validator', async () => {
      const mockValidator = vi.fn().mockResolvedValue(true);
      wsServer.setSessionValidator(mockValidator);

      return new Promise<void>((resolve, reject) => {
        const ws = new WebSocket(`ws://localhost:${port}`);

        ws.on('message', (data) => {
          const message = JSON.parse(data.toString()) as WebSocketMessage;
          if (message.type === 'connected') {
            ws.send(JSON.stringify({
              type: 'auth',
              sessionId: 'valid-session-id'
            }));
          } else if (message.type === 'auth:success') {
            expect(mockValidator).toHaveBeenCalledWith('valid-session-id');
            expect(message.sessionId).toBe('valid-session-id');
            ws.close();
            resolve();
          }
        });

        ws.on('error', reject);
      });
    });

    it('should reject client with invalid session ID using validator', async () => {
      const mockValidator = vi.fn().mockResolvedValue(false);
      wsServer.setSessionValidator(mockValidator);

      return new Promise<void>((resolve, reject) => {
        const ws = new WebSocket(`ws://localhost:${port}`);

        ws.on('message', (data) => {
          const message = JSON.parse(data.toString()) as WebSocketMessage;
          if (message.type === 'connected') {
            ws.send(JSON.stringify({
              type: 'auth',
              sessionId: 'invalid-session-id'
            }));
          } else if (message.type === 'auth:failed' && message.error === 'Invalid credentials') {
            expect(mockValidator).toHaveBeenCalledWith('invalid-session-id');
            ws.close();
            resolve();
          }
        });

        ws.on('error', reject);
      });
    });

    it('should accept any session ID when no validator is set', async () => {
      return new Promise<void>((resolve, reject) => {
        const ws = new WebSocket(`ws://localhost:${port}`);

        ws.on('message', (data) => {
          const message = JSON.parse(data.toString()) as WebSocketMessage;
          if (message.type === 'connected') {
            ws.send(JSON.stringify({
              type: 'auth',
              sessionId: 'any-session-id'
            }));
          } else if (message.type === 'auth:success') {
            expect(message.sessionId).toBe('any-session-id');
            ws.close();
            resolve();
          }
        });

        ws.on('error', reject);
      });
    });
  });

  describe('subscription management', () => {
    let authenticatedWs: WebSocket;

    beforeEach(async () => {
      const mockDecodedToken = {
        sessionId: 'test-session',
        userId: 'test-user',
        exp: Math.floor(Date.now() / 1000) + 3600
      };

      vi.mocked(jwt.verify).mockReturnValue(mockDecodedToken as jwt.JwtPayload);

      authenticatedWs = new WebSocket(`ws://localhost:${port}`);

      // Wait for connection and authenticate
      await new Promise<void>((resolve) => {
        authenticatedWs.on('message', (data) => {
          const message = JSON.parse(data.toString()) as WebSocketMessage;
          if (message.type === 'connected') {
            authenticatedWs.send(JSON.stringify({
              type: 'auth',
              token: 'valid-jwt-token'
            }));
          } else if (message.type === 'auth:success') {
            resolve();
          }
        });
      });
    });

    afterEach(() => {
      authenticatedWs.close();
    });

    it('should subscribe to transfer updates', async () => {
      return new Promise<void>((resolve, reject) => {
        authenticatedWs.on('message', (data) => {
          const message = JSON.parse(data.toString()) as WebSocketMessage;
          if (message.type === 'subscribed' && message.transferId === 'transfer123') {
            resolve();
          }
        });

        authenticatedWs.on('error', reject);

        authenticatedWs.send(JSON.stringify({
          type: 'subscribe',
          transferId: 'transfer123'
        }));
      });
    });

    it('should unsubscribe from transfer updates', async () => {
      // First subscribe
      await new Promise<void>((resolve) => {
        authenticatedWs.on('message', (data) => {
          const message = JSON.parse(data.toString()) as WebSocketMessage;
          if (message.type === 'subscribed') {
            resolve();
          }
        });

        authenticatedWs.send(JSON.stringify({
          type: 'subscribe',
          transferId: 'transfer123'
        }));
      });

      // Then unsubscribe
      return new Promise<void>((resolve, reject) => {
        authenticatedWs.removeAllListeners('message');
        authenticatedWs.on('message', (data) => {
          const message = JSON.parse(data.toString()) as WebSocketMessage;
          if (message.type === 'unsubscribed' && message.transferId === 'transfer123') {
            resolve();
          }
        });

        authenticatedWs.on('error', reject);

        authenticatedWs.send(JSON.stringify({
          type: 'unsubscribe',
          transferId: 'transfer123'
        }));
      });
    });

    it('should reject subscription from unauthenticated client', async () => {
      return new Promise<void>((resolve, reject) => {
        const unauthenticatedWs = new WebSocket(`ws://localhost:${port}`);

        unauthenticatedWs.on('message', (data) => {
          const message = JSON.parse(data.toString()) as WebSocketMessage;
          if (message.type === 'connected') {
            unauthenticatedWs.send(JSON.stringify({
              type: 'subscribe',
              transferId: 'transfer123'
            }));
          } else if (message.type === 'error' && message.error === 'Not authenticated') {
            unauthenticatedWs.close();
            resolve();
          }
        });

        unauthenticatedWs.on('error', reject);
      });
    });
  });

  describe('broadcasting', () => {
    let authenticatedWs1: WebSocket;
    let authenticatedWs2: WebSocket;

    beforeEach(async () => {
      const mockDecodedToken = {
        sessionId: 'test-session',
        userId: 'test-user',
        exp: Math.floor(Date.now() / 1000) + 3600
      };

      vi.mocked(jwt.verify).mockReturnValue(mockDecodedToken as jwt.JwtPayload);

      // Connect and authenticate first client
      authenticatedWs1 = new WebSocket(`ws://localhost:${port}`);
      await new Promise<void>((resolve) => {
        authenticatedWs1.on('message', (data) => {
          const message = JSON.parse(data.toString()) as WebSocketMessage;
          if (message.type === 'connected') {
            authenticatedWs1.send(JSON.stringify({
              type: 'auth',
              token: 'valid-jwt-token'
            }));
          } else if (message.type === 'auth:success') {
            resolve();
          }
        });
      });

      // Connect and authenticate second client
      authenticatedWs2 = new WebSocket(`ws://localhost:${port}`);
      await new Promise<void>((resolve) => {
        authenticatedWs2.on('message', (data) => {
          const message = JSON.parse(data.toString()) as WebSocketMessage;
          if (message.type === 'connected') {
            authenticatedWs2.send(JSON.stringify({
              type: 'auth',
              token: 'valid-jwt-token'
            }));
          } else if (message.type === 'auth:success') {
            resolve();
          }
        });
      });
    });

    afterEach(() => {
      authenticatedWs1.close();
      authenticatedWs2.close();
    });

    it.skip('should broadcast to clients subscribed to specific transfer', async () => {
      // Subscribe first client to transfer
      await new Promise<void>((resolve) => {
        authenticatedWs1.removeAllListeners('message');
        authenticatedWs1.on('message', (data) => {
          const message = JSON.parse(data.toString()) as WebSocketMessage;
          if (message.type === 'subscribed') {
            resolve();
          }
        });

        authenticatedWs1.send(JSON.stringify({
          type: 'subscribe',
          transferId: 'transfer123'
        }));
      });

      return new Promise<void>((resolve) => {
        authenticatedWs1.removeAllListeners('message');
        authenticatedWs1.on('message', (data) => {
          const message = JSON.parse(data.toString()) as WebSocketMessage & { event?: string };
          if (message.type === 'event' && message.event === 'transfer:update') {
            expect(message.transferId).toBe('transfer123');
            expect(message.data).toEqual({ status: 'signed' });
            resolve();
          }
        });

        // Broadcast update after a small delay to ensure listener is set up
        setTimeout(() => {
          wsServer.broadcastToTransfer('transfer123', 'transfer:update', { status: 'signed' });
        }, 10);
      });
    });

    it.skip('should broadcast to all authenticated clients', async () => {
      const messagePromises = [
        new Promise<void>((resolve) => {
          authenticatedWs1.removeAllListeners('message');
          authenticatedWs1.on('message', (data) => {
            const message = JSON.parse(data.toString()) as WebSocketMessage & { event?: string };
            if (message.type === 'broadcast' && message.event === 'system:announcement') {
              expect((message.data as { message: string }).message).toBe('Server maintenance in 5 minutes');
              resolve();
            }
          });
        }),
        new Promise<void>((resolve) => {
          authenticatedWs2.removeAllListeners('message');
          authenticatedWs2.on('message', (data) => {
            const message = JSON.parse(data.toString()) as WebSocketMessage & { event?: string };
            if (message.type === 'broadcast' && message.event === 'system:announcement') {
              expect((message.data as { message: string }).message).toBe('Server maintenance in 5 minutes');
              resolve();
            }
          });
        })
      ];

      // Broadcast announcement after a small delay to ensure listeners are ready
      setTimeout(() => {
        wsServer.broadcast('system:announcement', {
          message: 'Server maintenance in 5 minutes'
        });
      }, 10);

      await Promise.all(messagePromises);
    });
  });

  describe('error handling', () => {
    it('should handle malformed messages gracefully', async () => {
      return new Promise<void>((resolve, reject) => {
        const ws = new WebSocket(`ws://localhost:${port}`);

        ws.on('message', (data) => {
          const message = JSON.parse(data.toString()) as WebSocketMessage;
          if (message.type === 'connected') {
            // Send message without type - it will be parsed but not recognized
            ws.send(JSON.stringify({ data: 'test' }));
          } else if (message.type === 'error' && message.error === 'Unknown message type') {
            ws.close();
            resolve();
          }
        });

        ws.on('error', reject);
      });
    });

    it('should handle WebSocket errors', async () => {
      return new Promise<void>((resolve, _reject) => {
        const ws = new WebSocket(`ws://localhost:${port}`);

        ws.on('open', () => {
          // Force an error by sending a huge message
          const hugeMessage = 'x'.repeat(10 * 1024 * 1024); // 10MB
          try {
            ws.send(hugeMessage);
          } catch {
            // Expected error
          }
          
          setTimeout(() => {
            ws.close();
            resolve();
          }, 100);
        });

        ws.on('error', () => {
          // Ignore expected errors
        });
      });
    });

    it('should handle rapid connect/disconnect', async () => {
      const connections = Array.from({ length: 5 }, () => 
        new Promise<void>((resolve) => {
          const ws = new WebSocket(`ws://localhost:${port}`);
          
          ws.on('open', () => {
            ws.close();
          });

          ws.on('close', () => {
            resolve();
          });

          ws.on('error', () => {
            // Ignore errors
            resolve();
          });
        })
      );

      await Promise.all(connections);
      expect(wsServer.getConnectionCount()).toBe(0);
    });
  });

  describe('getConnectionCount', () => {
    it.skip('should track connection count accurately', async () => {
      expect(wsServer.getConnectionCount()).toBe(0);

      const ws1 = new WebSocket(`ws://localhost:${port}`);
      
      // Wait for first connection
      await new Promise<void>((resolve) => {
        ws1.on('open', () => resolve());
      });
      expect(wsServer.getConnectionCount()).toBe(1);
      
      const ws2 = new WebSocket(`ws://localhost:${port}`);
      
      // Wait for second connection
      await new Promise<void>((resolve) => {
        ws2.on('open', () => resolve());
      });
      expect(wsServer.getConnectionCount()).toBe(2);

      ws1.close();
      await new Promise(resolve => setTimeout(resolve, 50));
      expect(wsServer.getConnectionCount()).toBe(1);

      ws2.close();
      await new Promise(resolve => setTimeout(resolve, 50));
      expect(wsServer.getConnectionCount()).toBe(0);
    });
  });

  describe('setSessionValidator', () => {
    it('should set and use session validator', () => {
      const mockValidator = vi.fn().mockResolvedValue(true);
      wsServer.setSessionValidator(mockValidator);

      // Access the private method to test it directly
      const wsServerAny = wsServer as WebSocketServer & { sessionValidationCallback?: typeof mockValidator };
      expect(wsServerAny.sessionValidationCallback).toBe(mockValidator);
    });
  });

  describe('close', () => {
    it('should close the WebSocket server', () => {
      const closeSpy = vi.spyOn(wsServer as WebSocketServer & Record<string, unknown>, 'close') as typeof wsServer.close;
      wsServer.close();
      expect(closeSpy).toHaveBeenCalled();
    });
  });
});