import 'dotenv/config';
import express, { Express } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { createServer } from 'http';
import { logger } from './utils/logger';
import { initializeDatabase, closeDatabase } from './database';

// Services
import { ConnectionManager } from './services/ConnectionManager';
import { PeerService } from './services/PeerService';
import { MessageService } from './services/MessageService';
import { GroupService } from './services/GroupService';

// Routes
import { initializeConnectionRoutes } from './api/routes/connections';
import { initializePeerRoutes } from './api/routes/peers';
import { initializeGroupRoutes } from './api/routes/groups';
import { initializeTransportRoutes } from './api/routes/transports';

// WebSocket
import { ExplorerWebSocketServer } from './websocket/ExplorerWebSocket';

const app: Express = express();
const httpServer = createServer(app);

// Initialize services
const connectionManager = new ConnectionManager();
const peerService = new PeerService(connectionManager);
const messageService = new MessageService();
const groupService = new GroupService(peerService, messageService);

// Initialize WebSocket server
new ExplorerWebSocketServer(httpServer, peerService, messageService, groupService);

// Middleware
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
	origin: true,
	credentials: true,
	methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
	allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(express.json({ limit: '50mb' }));

// Rate limiting
const limiter = rateLimit({
	windowMs: 15 * 60 * 1000, // 15 minutes
	max: 100,
});
app.use('/api', limiter);

// API Routes
app.use('/api/connections', initializeConnectionRoutes(connectionManager));
app.use('/api/peers', initializePeerRoutes(peerService, messageService));
app.use('/api/groups', initializeGroupRoutes(groupService));
app.use('/api/transports', initializeTransportRoutes(connectionManager));

// Health check
app.get('/health', (req, res) => {
	res.json({
		status: 'ok',
		uptime: process.uptime(),
		timestamp: Date.now(),
	});
});

// Error handling middleware
app.use((err: Error, req: express.Request, res: express.Response, _next: express.NextFunction) => {
	logger.error('Unhandled error:', err);
	res.status(500).json({
		error: {
			code: 'INTERNAL_ERROR',
			message: 'An internal error occurred',
			details: process.env.NODE_ENV === 'development' && err instanceof Error ? err.message : undefined,
		},
	});
});

// Initialize database and start server
function startServer() {
	try {
		// Initialize database
		initializeDatabase({ path: process.env.DB_PATH || './firma-sign.db' });
		logger.info('Database initialized');

		const PORT = process.env.PORT || 8080;
		
		httpServer.listen(PORT, () => {
			logger.info(`🚀 Firma-Sign Peer Explorer server running on port ${PORT}`);
			logger.info(`📡 WebSocket endpoint: ws://localhost:${PORT}/explorer`);
			logger.info(`🔧 Environment: ${process.env.NODE_ENV || 'development'}`);
		});
	} catch (error) {
		logger.error('Failed to start server:', error);
		process.exit(1);
	}
}

// Graceful shutdown
async function shutdown() {
	logger.info('Shutting down server...');
	
	httpServer.close(() => {
		logger.info('HTTP server closed');
	});

	await connectionManager.shutdown();
	closeDatabase();
	
	logger.info('Server shutdown complete');
	process.exit(0);
}

process.on('SIGTERM', () => void shutdown());
process.on('SIGINT', () => void shutdown());

// Start the server
void startServer();

export { app, httpServer };