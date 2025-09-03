import { vi, expect } from 'vitest';
import express from 'express';
import http from 'http';
import WebSocket from 'ws';
import { nanoid } from 'nanoid';
import type { TransportManager } from '../../transport/TransportManager.js';
import type { StorageManager } from '../../storage/StorageManager.js';
import type { DocumentService } from '../../services/DocumentService.js';
import { WebSocketServer } from '../../websocket/WebSocketServer.js';
import { createTransferRoutes } from '../../api/routes/transfers.js';
import { createDocumentRoutes } from '../../api/routes/documents.js';
import type { Transfer, Document } from '../../types/database.js';
import type { StorageResult } from '@firmachain/firma-sign-core';

// Define transport result type
interface TransportResult {
	success: boolean;
	transferId: string;
	timestamp: number;
}

export interface MockPeer {
	id: string;
	app: express.Application;
	server?: http.Server;
	wsServer?: WebSocketServer;
	wsClient?: WebSocket;
	port?: number;
	transportManager: Partial<TransportManager>;
	storageManager: Partial<StorageManager>;
	documentService: Partial<DocumentService>;
}

export interface TestDocument {
	id: string;
	fileName: string;
	fileData: string;
	fileSize: number;
	fileHash: string;
	mimeType?: string;
}

export interface TestTransfer {
	id: string;
	fromPeer: string;
	toPeer: string;
	documents: TestDocument[];
	status: 'pending' | 'completed' | 'failed';
	createdAt: Date;
}

/**
 * Creates a mock peer with all necessary services
 */
export function createMockPeer(peerId: string): MockPeer {
	const transportManager: Partial<TransportManager> = {
		send: vi.fn().mockResolvedValue({ success: true }),
		receive: vi.fn(),
		isTransportAvailable: vi.fn().mockReturnValue(true),
		getTransportCapabilities: vi.fn().mockReturnValue({
			supportsBatch: true,
			supportsEncryption: true,
			maxFileSize: 100 * 1024 * 1024,
		}),
	};

	const storageManager: Partial<StorageManager> = {
		createTransfer: vi.fn().mockImplementation((transfer) => ({
			...transfer,
			id: transfer.transferId || nanoid(),
			createdAt: new Date(),
			updatedAt: new Date(),
		})),
		getTransfer: vi.fn(),
		getTransferWithDetails: vi.fn(),
		listTransfers: vi.fn().mockResolvedValue([]),
		updateTransferSignatures: vi.fn(),
		getDocumentById: vi.fn(),
		getDocumentsByTransferId: vi.fn().mockResolvedValue([]),
		documentExists: vi.fn().mockResolvedValue(true),
		getDocument: vi.fn(),
		saveDocument: vi.fn().mockResolvedValue({
			success: true,
			hash: 'mock-hash-' + nanoid(),
			path: '/mock/path',
			size: 1024,
			timestamp: Date.now(),
		}),
		saveSignedDocument: vi.fn(),
		getSignedDocument: vi.fn(),
		updateDocumentMetadata: vi.fn(),
	};

	const documentService: Partial<DocumentService> = {
		storeDocument: vi.fn().mockImplementation((_buffer, fileName) => ({
			id: 'doc-' + nanoid(),
			originalName: fileName,
			size: 100, // Default size
			hash: 'hash-' + nanoid(),
			category: 'uploaded',
			status: 'pending',
			mimeType: 'application/pdf',
			uploadedAt: new Date(),
			version: 1,
		})),
		getDocument: vi.fn(),
		updateDocumentStatus: vi.fn(),
		searchDocuments: vi.fn().mockResolvedValue([]),
		deleteDocument: vi.fn(),
		moveDocument: vi.fn(),
		createVersion: vi.fn(),
		getDocumentVersions: vi.fn().mockResolvedValue([]),
		archiveOldDocuments: vi.fn().mockResolvedValue(0),
		getStorageStats: vi.fn().mockResolvedValue({
			totalDocuments: 0,
			totalSize: 0,
			categoryBreakdown: {},
		}),
	};

	const app = express();
	app.use(express.json({ limit: '100mb' }));

	// Add test middleware
	app.use((req, res, next) => {
		req.headers['x-peer-id'] = peerId;
		next();
	});

	// Mount routes
	app.use(
		'/api/transfers',
		createTransferRoutes(
			transportManager as TransportManager,
			storageManager as StorageManager,
			documentService as DocumentService,
		),
	);
	app.use('/api/documents', createDocumentRoutes(documentService as DocumentService));

	// Add test endpoints
	app.get('/test/peer-info', (req, res) => {
		res.json({ peerId, status: 'active' });
	});

	return {
		id: peerId,
		app,
		transportManager,
		storageManager,
		documentService,
	};
}

/**
 * Creates a test document with default values
 */
export function createTestDocument(overrides?: Partial<TestDocument>): TestDocument {
	const content = overrides?.fileData || 'Test document content';
	const buffer = Buffer.from(content, typeof content === 'string' ? 'utf8' : 'base64');

	return {
		id: 'doc-' + nanoid(),
		fileName: 'test-document.pdf',
		fileData: buffer.toString('base64'),
		fileSize: buffer.length,
		fileHash: 'hash-' + nanoid(),
		mimeType: 'application/pdf',
		...overrides,
	};
}

/**
 * Creates a test transfer
 */
export function createTestTransfer(
	fromPeer: string,
	toPeer: string,
	documents: TestDocument[],
): TestTransfer {
	return {
		id: 'transfer-' + nanoid(),
		fromPeer,
		toPeer,
		documents,
		status: 'pending',
		createdAt: new Date(),
	};
}

/**
 * Simulates a P2P file transfer between two mock peers
 */
export function simulateP2PTransfer(
	sender: MockPeer,
	receiver: MockPeer,
	document: TestDocument,
): Promise<{ transferId: string; success: boolean }> {
	const transferId = 'transfer-' + nanoid();

	// Mock sender creating the transfer
	vi.mocked(sender.storageManager.createTransfer).mockResolvedValueOnce({
		id: transferId,
		type: 'outgoing',
		status: 'pending',
		createdAt: new Date(),
		updatedAt: new Date(),
	} as Transfer);

	// Mock receiver receiving the transfer
	vi.mocked(receiver.storageManager.createTransfer).mockResolvedValueOnce({
		id: transferId,
		type: 'incoming',
		status: 'pending',
		sender: {
			senderId: sender.id,
			name: `Peer ${sender.id}`,
		},
		createdAt: new Date(),
		updatedAt: new Date(),
	} as Transfer);

	// Mock document storage on both sides
	vi.mocked(sender.storageManager.saveDocument).mockResolvedValueOnce({
		success: true,
		hash: document.fileHash,
		path: `/transfers/${transferId}/${document.fileName}`,
		size: document.fileSize,
		timestamp: Date.now(),
	} as StorageResult);

	vi.mocked(receiver.storageManager.saveDocument).mockResolvedValueOnce({
		success: true,
		hash: document.fileHash,
		path: `/transfers/${transferId}/${document.fileName}`,
		size: document.fileSize,
		timestamp: Date.now(),
	} as StorageResult);

	// Mock transport send
	vi.mocked(sender.transportManager.send).mockResolvedValueOnce({
		success: true,
		transferId,
		timestamp: Date.now(),
	} as TransportResult);

	return {
		transferId,
		success: true,
	};
}

/**
 * Mocks a successful document signing flow
 */
export function mockDocumentSigning(
	peer: MockPeer,
	transferId: string,
	documentId: string,
	_signature: string,
): void {
	// Mock getting the transfer
	vi.mocked(peer.storageManager.getTransfer).mockResolvedValueOnce({
		id: transferId,
		type: 'incoming',
		status: 'pending',
		sender: { senderId: 'sender-peer' },
	} as Transfer);

	// Mock getting the document
	vi.mocked(peer.storageManager.getDocumentById).mockResolvedValueOnce({
		id: documentId,
		transferId,
		fileName: 'document.pdf',
		status: 'pending',
	} as Document);

	// Mock saving signed document
	vi.mocked(peer.storageManager.saveSignedDocument).mockResolvedValueOnce(undefined);

	// Mock updating signatures
	vi.mocked(peer.storageManager.updateTransferSignatures).mockResolvedValueOnce(undefined);
}

/**
 * Sets up WebSocket connections between peers
 */
export async function setupWebSocketConnection(
	peer1: MockPeer,
	peer2: MockPeer,
	port1: number,
	port2: number,
): Promise<void> {
	// Create HTTP servers if not exists
	if (!peer1.server) {
		peer1.server = http.createServer(peer1.app);
		peer1.port = port1;
		await new Promise<void>((resolve) => {
			peer1.server!.listen(port1, () => resolve());
		});
	}

	if (!peer2.server) {
		peer2.server = http.createServer(peer2.app);
		peer2.port = port2;
		await new Promise<void>((resolve) => {
			peer2.server!.listen(port2, () => resolve());
		});
	}

	// Create WebSocket servers
	peer1.wsServer = new WebSocketServer();
	peer1.wsServer.attach(peer1.server);

	peer2.wsServer = new WebSocketServer();
	peer2.wsServer.attach(peer2.server);

	// Establish WebSocket clients
	peer1.wsClient = new WebSocket(`ws://localhost:${port2}`);
	peer2.wsClient = new WebSocket(`ws://localhost:${port1}`);

	// Wait for connections
	await Promise.all([
		new Promise((resolve) => peer1.wsClient!.on('open', resolve)),
		new Promise((resolve) => peer2.wsClient!.on('open', resolve)),
	]);
}

/**
 * Cleans up WebSocket connections and servers
 */
export async function cleanupPeerConnections(peers: MockPeer[]): Promise<void> {
	for (const peer of peers) {
		if (peer.wsClient) {
			peer.wsClient.close();
		}

		if (peer.server) {
			await new Promise<void>((resolve) => {
				peer.server!.close(() => resolve());
			});
		}
	}
}

/**
 * Waits for a specific event on a WebSocket
 */
export function waitForWebSocketMessage(
	ws: WebSocket,
	eventType: string,
	timeout = 5000,
): Promise<unknown> {
	return new Promise((resolve, reject) => {
		const timer = setTimeout(() => {
			reject(new Error(`Timeout waiting for ${eventType} message`));
		}, timeout);

		const messageHandler = (data: WebSocket.Data) => {
			try {
				const message = JSON.parse(data.toString());
				if (message.type === eventType) {
					clearTimeout(timer);
					ws.off('message', messageHandler);
					resolve(message);
				}
			} catch {
				// Ignore parse errors
			}
		};

		ws.on('message', messageHandler);
	});
}

/**
 * Creates a batch of test documents
 */
export function createTestDocumentBatch(count: number): TestDocument[] {
	return Array.from({ length: count }, (_, i) =>
		createTestDocument({
			id: `doc-${i}`,
			fileName: `document-${i}.pdf`,
			fileData: Buffer.from(`Document ${i} content`).toString('base64'),
		}),
	);
}

/**
 * Validates transfer structure
 */
export function validateTransferStructure(transfer: unknown): void {
	expect(transfer).toHaveProperty('transferId');
	expect(transfer).toHaveProperty('type');
	expect(transfer).toHaveProperty('status');
	expect(transfer).toHaveProperty('documents');
	expect(Array.isArray(transfer.documents)).toBe(true);

	if (transfer.documents.length > 0) {
		const doc = transfer.documents[0];
		expect(doc).toHaveProperty('documentId');
		expect(doc).toHaveProperty('fileName');
		expect(doc).toHaveProperty('status');
	}
}

/**
 * Mocks a failed transfer scenario
 */
export function mockTransferFailure(peer: MockPeer, error: string = 'Transfer failed'): void {
	vi.mocked(peer.storageManager.createTransfer).mockRejectedValueOnce(new Error(error));
	vi.mocked(peer.transportManager.send).mockRejectedValueOnce(new Error(error));
}

/**
 * Creates mock data for transfer statistics
 */
export function createTransferStats(peerId: string) {
	return {
		peerId,
		totalTransfers: 0,
		successfulTransfers: 0,
		failedTransfers: 0,
		pendingTransfers: 0,
		totalBytesTransferred: 0,
		averageTransferTime: 0,
		lastTransferAt: null as Date | null,
	};
}

/**
 * Simulates network latency
 */
export async function simulateNetworkLatency(ms: number): Promise<void> {
	return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Creates a mock P2P transport response
 */
export function createMockTransportResponse(success = true) {
	return {
		success,
		transferId: 'transfer-' + nanoid(),
		timestamp: Date.now(),
		peerId: 'peer-' + nanoid(),
		...(success ? {} : { error: 'Transport error' }),
	};
}
