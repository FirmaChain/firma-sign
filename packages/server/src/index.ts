import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import swaggerUi from 'swagger-ui-express';
import { createServer } from 'http';
import { ConfigManager } from './config/ConfigManager.js';
import { TransportManager } from './transport/TransportManager.js';
import { StorageManager } from './storage/StorageManager.js';
import { WebSocketServer } from './websocket/WebSocketServer.js';
import { createTransferRoutes } from './api/routes/transfers.js';
import { createAuthRoutes } from './api/routes/auth.js';
import { createBlockchainRoutes } from './api/routes/blockchain.js';
import { validateSession } from './api/routes/auth.js';
import { createDocumentRoutes } from './api/routes/documents.js';
import { DocumentService } from './services/DocumentService.js';
import { SQLiteDatabase } from '@firmachain/firma-sign-database-sqlite';
import { MockLocalStorage } from './storage/MockLocalStorage.js';
import { swaggerSpec } from './config/swagger.js';
import { logger } from './utils/logger.js';

// Initialize configuration
const configManager = new ConfigManager();

async function initializeServer() {
  try {
    // Load configuration
    await configManager.load();
    const config = configManager.get();
    
    logger.info('Configuration loaded', {
      port: config.server.port,
      storage: config.storage.basePath,
      transports: Object.keys(config.transports).filter(key => config.transports[key as keyof typeof config.transports])
    });

    const app = express();
    const httpServer = createServer(app);

    const { sessionSecret } = config.server;

    // Initialize database and storage backends
    const database = new SQLiteDatabase();
    const localStorage = new MockLocalStorage();
    
    // Initialize managers with configuration
    const transportManager = new TransportManager(configManager);
    const storageManager = new StorageManager(configManager, database, localStorage);
    const documentService = new DocumentService(configManager, localStorage, database);
    const wsServer = new WebSocketServer(httpServer, sessionSecret);

    // Set up WebSocket session validation
    wsServer.setSessionValidator((sessionId: string) => {
      return Promise.resolve(validateSession(sessionId) !== null);
    });
    
    // Initialize services in sequence (StorageManager must initialize first)
    await transportManager.initialize();
    await storageManager.initialize();  // This initializes database and storage
    await documentService.initialize(); // This depends on storage being initialized

    return { app, httpServer, transportManager, storageManager, documentService, wsServer, config, database };
  } catch (error) {
    logger.error('Failed to initialize server:', error);
    process.exit(1);
  }
}

// Start server initialization and setup
initializeServer().then(({ app, httpServer, transportManager, storageManager, documentService, wsServer, config, database }) => {
  const { port, rateLimiting, corsOrigin } = config.server;

  // Middleware setup
  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", "data:", "https:"],
      },
    },
  }));
  app.use(cors({
    origin: corsOrigin,
    credentials: true
  }));
  app.use(express.json({ limit: '50mb' }));

  const limiter = rateLimit({
    windowMs: rateLimiting.windowMs,
    max: rateLimiting.maxRequests
  });
  app.use('/api', limiter);

  // Swagger documentation endpoints
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
    customCss: '.swagger-ui .topbar { display: none }',
    customSiteTitle: 'Firma-Sign API Documentation',
  }));

  // Serve OpenAPI spec as JSON
  app.get('/api-docs.json', (_req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(swaggerSpec);
  });

  // Routes setup
  app.use('/api/transfers', createTransferRoutes(transportManager, storageManager, documentService));
  app.use('/api/auth', createAuthRoutes());
  app.use('/api/blockchain', createBlockchainRoutes());
  app.use('/api/documents', createDocumentRoutes(documentService));

  // Transport availability endpoint
  app.get('/api/transports/available', (_req, res) => {
    void (async () => {
    try {
      const transportInfo = await transportManager.getTransportInfo();
      res.json({
        transports: transportInfo.map(t => ({
          type: t.name.split('-').pop(), // Extract transport type from package name
          enabled: t.isInstalled,
          configured: t.isConfigured,
          status: t.status,
          version: t.version,
          features: t.isInstalled ? ['send', 'receive'] : [],
          installCommand: t.installCommand
        }))
      });
    } catch (error) {
      logger.error('Error getting transport info:', error);
      res.status(500).json({ error: 'Failed to get transport information' });
    }
    })();
  });

  // System info endpoint
  app.get('/api/info', (_req, res) => {
    void (async () => {
    try {
      const storageInfo = await storageManager.getStorageInfo();
      const connectionStats = wsServer.getConnectionStats();
      
      res.json({
        version: '1.0.0', // TODO: Get from package.json
        uptime: process.uptime(),
        storage: storageInfo,
        websocket: connectionStats,
        transports: {
          ready: transportManager.isReady(),
          status: transportManager.getTransportsStatus()
        }
      });
    } catch (error) {
      logger.error('Error getting system info:', error);
      res.status(500).json({ error: 'Failed to get system information' });
    }
    })();
  });

  // Health check endpoint
  app.get('/health', (_req, res) => {
    void (async () => {
    try {
      const storageInfo = await storageManager.getStorageInfo();
      const isHealthy = storageInfo.databaseConnected && transportManager.isReady();
      
      res.status(isHealthy ? 200 : 503).json({
        status: isHealthy ? 'ok' : 'degraded',
        uptime: process.uptime(),
        connections: wsServer.getConnectionCount(),
        services: {
          database: storageInfo.databaseConnected ? 'connected' : 'disconnected',
          storage: (storageInfo.storageStatus as { available?: boolean }).available ? 'available' : 'unavailable',
          transports: transportManager.isReady() ? 'ready' : 'not ready'
        }
      });
    } catch (error) {
      logger.error('Health check error:', error);
      res.status(503).json({
        status: 'error',
        error: 'Health check failed'
      });
    }
    })();
  });

  // Event handlers
  transportManager.on('transfer:received', (data: { transport: string; transfer: { transferId: string } }) => {
    const { transport, transfer } = data;
    logger.info(`Transfer received via ${transport}:`, { transferId: transfer.transferId });
    wsServer.broadcastToTransfer(transfer.transferId, 'transfer:update', {
      status: 'received',
      transport,
      timestamp: Date.now()
    });
  });

  transportManager.on('transport:error', (data: { transport: string; error: Error }) => {
    const { transport, error } = data;
    logger.error(`Transport error in ${transport}:`, error);
    wsServer.broadcast('transport:error', {
      transport,
      error: error.message,
      timestamp: Date.now()
    });
  });

  // Signal handlers with proper cleanup
  const shutdown = async () => {
    logger.info('Shutting down server gracefully...');
    
    // Close HTTP server
    httpServer.close(() => {
      logger.info('HTTP server closed');
    });

    // Shutdown all services
    await Promise.all([
      transportManager.shutdown(),
      storageManager.close(),
      documentService.close(),
      database.shutdown()
    ]);
    
    wsServer.close();
    logger.info('All services shut down successfully');
    process.exit(0);
  };

  process.on('SIGTERM', () => void shutdown());
  process.on('SIGINT', () => void shutdown());

  // Start the HTTP server
  httpServer.listen(port, () => {
    logger.info(`🚀 Firma-Sign server running on port ${port}`);
    logger.info(`📡 WebSocket server ready`);
    logger.info(`💾 Storage initialized at ${config.storage.basePath}`);
    logger.info(`📚 API Documentation available at http://localhost:${port}/api-docs`);
    logger.info(`📄 OpenAPI spec available at http://localhost:${port}/api-docs.json`);
    logger.info(`🔧 Configuration loaded from ${process.env.CONFIG_PATH || 'environment variables'}`);
    
    if (transportManager.isReady()) {
      logger.info(`🚛 Transport system ready`);
    } else {
      logger.warn(`⚠️  No transports configured. Install and configure transport packages to enable document transfers.`);
    }
  });

}).catch((error) => {
  logger.error('Failed to start server:', error);
  process.exit(1);
});

// Global error handlers
process.on('uncaughtException', (error) => {
  logger.error('Uncaught exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled rejection at:', promise, 'reason:', reason);
  process.exit(1);
});