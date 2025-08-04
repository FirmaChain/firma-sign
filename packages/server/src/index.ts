import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { createServer } from 'http';
import { TransportManager } from './transport/TransportManager.js';
import { StorageManager } from './storage/StorageManager.js';
import { WebSocketServer } from './websocket/WebSocketServer.js';
import { createTransferRoutes } from './api/routes/transfers.js';
import { createAuthRoutes } from './api/routes/auth.js';
import { createBlockchainRoutes } from './api/routes/blockchain.js';
import { logger } from './utils/logger.js';

const app = express();
const httpServer = createServer(app);

const PORT = process.env.PORT || 8080;
const HOST = process.env.HOST || '0.0.0.0';

const transportManager = new TransportManager();
const storageManager = new StorageManager(process.env.STORAGE_PATH);
const wsServer = new WebSocketServer(httpServer);

app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  credentials: true
}));
app.use(express.json({ limit: '50mb' }));

const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'),
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100')
});
app.use('/api', limiter);

app.use('/api/transfers', createTransferRoutes(transportManager, storageManager));
app.use('/api/auth', createAuthRoutes());
app.use('/api/blockchain', createBlockchainRoutes());

app.get('/api/transports/available', (req, res) => {
  const transports = transportManager.getAvailableTransports();
  res.json({
    transports: transports.map(t => ({
      type: t.name,
      enabled: true,
      configured: true,
      features: Object.keys(t.capabilities)
    }))
  });
});

app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    uptime: process.uptime(),
    connections: wsServer.getConnectionCount()
  });
});

transportManager.on('transfer:received', ({ transport, transfer }) => {
  logger.info(`Transfer received via ${transport}:`, { transferId: transfer.transferId });
  wsServer.broadcastToTransfer(transfer.transferId, 'transfer:update', {
    status: 'received',
    transport
  });
});

transportManager.on('transport:error', ({ transport, error }) => {
  logger.error(`Transport error in ${transport}:`, error);
  wsServer.broadcast('transport:error', {
    transport,
    error: error.message
  });
});

process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, shutting down gracefully');
  
  httpServer.close(() => {
    logger.info('HTTP server closed');
  });

  await transportManager.shutdown();
  storageManager.close();
  wsServer.close();
  
  process.exit(0);
});

process.on('uncaughtException', (error) => {
  logger.error('Uncaught exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled rejection at:', promise, 'reason:', reason);
});

async function initializeTransports() {
  try {
    logger.info('Server configuration:');
    logger.info(`- Environment: ${process.env.NODE_ENV || 'development'}`);
    logger.info(`- Port: ${PORT}`);
    logger.info(`- Storage: ${process.env.STORAGE_PATH || '~/.firmasign'}`);
    
    logger.info('Transport configuration pending...');
    logger.info('To add transports, install the corresponding packages:');
    logger.info('- npm install @firmachain/firma-sign-transport-p2p');
    logger.info('- npm install @firmachain/firma-sign-transport-email');
    logger.info('- npm install @firmachain/firma-sign-transport-discord');
    
  } catch (error) {
    logger.error('Failed to initialize transports:', error);
    process.exit(1);
  }
}

initializeTransports().then(() => {
  httpServer.listen(PORT, HOST, () => {
    logger.info(`🚀 Firma-Sign server running at http://${HOST}:${PORT}`);
    logger.info(`📡 WebSocket server ready`);
    logger.info(`💾 Storage initialized at ${process.env.STORAGE_PATH || '~/.firmasign'}`);
  });
});