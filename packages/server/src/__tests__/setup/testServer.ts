import express, { Express } from 'express';
import { Server } from 'http';
import cors from 'cors';
import { ConfigManager } from '../../config/ConfigManager.js';
import { TransportManager } from '../../transport/TransportManager.js';
import { StorageManager } from '../../storage/StorageManager.js';
import { DocumentService } from '../../services/DocumentService.js';
import { createTransferRoutes } from '../../api/routes/transfers.js';
import { createAuthRoutes } from '../../api/routes/auth.js';
import { createBlockchainRoutes } from '../../api/routes/blockchain.js';
import { createDocumentRoutes } from '../../api/routes/documents.js';
import { SQLiteDatabase } from '@firmachain/firma-sign-database-sqlite';
import { MockLocalStorage } from '../../storage/MockLocalStorage.js';
import { join } from 'path';
import { mkdtemp, rm, readdir, unlink } from 'fs/promises';
import { tmpdir } from 'os';

export interface TestContext {
	app: Express;
	server?: Server;
	configManager: ConfigManager;
	transportManager: TransportManager;
	storageManager: StorageManager;
	documentService: DocumentService;
	database: SQLiteDatabase;
	storage: MockLocalStorage;
	testDir: string;
}

/**
 * Create a test server with all services initialized
 */
export async function createTestServer(): Promise<TestContext> {
	// Create temporary directory for test
	const testDir = await mkdtemp(join(tmpdir(), 'firma-sign-test-'));

	// Create config manager with test configuration
	const configManager = new ConfigManager();

	// Set environment variables for test configuration
	process.env.STORAGE_PATH = testDir;
	process.env.LOG_LEVEL = 'error';
	process.env.LOG_DIR = join(testDir, 'logs');

	await configManager.load();

	// Initialize services - each test gets a fresh database instance
	const database = new SQLiteDatabase();
	const storage = new MockLocalStorage();
	const transportManager = new TransportManager(configManager);

	// Don't pre-initialize the database - let StorageManager do it
	// Initialize services that depend on the database
	const storageManager = new StorageManager(configManager, database, storage);
	const documentService = new DocumentService(configManager, storage, database);

	// Initialize storage manager (which will initialize the database internally)
	await storageManager.initialize();

	// Initialize other services
	await Promise.all([transportManager.initialize(), documentService.initialize()]);

	// Create Express app
	const app = express();

	// Middleware
	app.use(cors());
	app.use(express.json({ limit: '50mb' }));

	// Routes
	app.use(
		'/api/transfers',
		createTransferRoutes(transportManager, storageManager, documentService),
	);
	app.use('/api/auth', createAuthRoutes());
	app.use('/api/blockchain', createBlockchainRoutes());
	app.use('/api/documents', createDocumentRoutes(documentService));

	// System endpoints
	app.get('/api/transports/available', (req, res, next) => {
		(async () => {
			const transportInfo = await transportManager.getTransportInfo();
			res.json({
				transports: transportInfo.map((t) => ({
					type: t.name.split('-').pop(),
					enabled: t.isInstalled,
					configured: t.isConfigured,
					status: t.status,
					version: t.version || 'not-installed',
					features: t.isInstalled ? ['send', 'receive'] : [],
				})),
			});
		})().catch(next);
	});

	app.get('/api/info', (req, res, next) => {
		(async () => {
			const storageInfo = await storageManager.getStorageInfo();
			res.json({
				version: '1.0.0',
				uptime: process.uptime(),
				storage: storageInfo,
				transports: {
					ready: transportManager.isReady(),
					status: transportManager.getTransportsStatus(),
				},
			});
		})().catch(next);
	});

	app.get('/health', (req, res, next) => {
		(async () => {
			const storageInfo = await storageManager.getStorageInfo();
			const status = storageInfo.databaseConnected ? 'ok' : 'error';

			if (status === 'ok') {
				res.json({
					status,
					uptime: process.uptime(),
					version: '1.0.0',
					services: {
						database: 'connected',
						storage: 'connected',
						transports: {},
					},
				});
			} else {
				res.status(503).json({
					status: 'error',
					message: 'Database not connected',
				});
			}
		})().catch(next);
	});

	// Error handling middleware for malformed JSON
	app.use((err: unknown, req: express.Request, res: express.Response, next: express.NextFunction) => {
		if (err instanceof SyntaxError && 'body' in err) {
			return res.status(400).json({ error: 'Invalid JSON' });
		}
		next(err);
	});

	return {
		app,
		configManager,
		transportManager,
		storageManager,
		documentService,
		database,
		storage,
		testDir,
	};
}

/**
 * Clean up test server and resources
 */
export async function cleanupTestServer(context: TestContext): Promise<void> {
	if (!context) return;

	const { server, transportManager, storageManager, documentService, database, testDir } = context;

	// Close server if running
	if (server) {
		await new Promise<void>((resolve) => {
			server.close(() => resolve());
		});
	}

	// Shutdown services with error handling
	try {
		await Promise.all([
			transportManager?.shutdown().catch(() => {}),
			storageManager?.close().catch(() => {}),
			documentService?.close().catch(() => {}),
			database?.shutdown().catch(() => {}),
		]);
	} catch {
		// Ignore cleanup errors in tests
	}

	// Clean up test directory
	try {
		if (testDir) {
			await rm(testDir, { recursive: true, force: true });
		}
	} catch {
		// Ignore cleanup errors
	}

	// Clean up :memory:* files created by SQLite in-memory databases
	try {
		const serverDir = join(__dirname, '../../..');
		const files = await readdir(serverDir);

		for (const file of files) {
			if (file.startsWith(':memory:')) {
				const filePath = join(serverDir, file);
				try {
					await unlink(filePath);
				} catch {
					// Ignore cleanup errors for individual files
				}
			}
		}
	} catch {
		// Ignore cleanup errors
	}
}

/**
 * Create test data helpers
 */
export const testData = {
	createTransferRequest: () => {
		const uniqueId = Math.random().toString(36).substring(7);
		return {
			documents: [
				{
					id: `doc-${uniqueId}`,
					fileName: 'test.pdf',
					fileData: Buffer.from('test pdf content').toString('base64'),
				},
			],
			recipients: [
				{
					identifier: 'test@example.com',
					transport: 'email',
					preferences: {
						notificationEnabled: true,
					},
				},
			],
			metadata: {
				message: 'Test transfer',
				requireAllSignatures: true,
			},
		};
	},

	createSignRequest: (documentId = 'doc-1') => ({
		signatures: [
			{
				documentId,
				signature: Buffer.from('signature data').toString('base64'),
				components: [],
				status: 'signed',
			},
		],
	}),

	createConnectRequest: (code = 'ABC123') => ({
		code,
		transport: 'p2p',
	}),

	createDocumentUploadRequest: () => {
		const uniqueId = Math.random().toString(36).substring(7);
		return {
			documentId: `doc-${uniqueId}`,
			fileName: 'upload.pdf',
			fileData: Buffer.from('uploaded pdf content').toString('base64'),
			metadata: {
				uploadedBy: 'test-user',
			},
		};
	},
};
