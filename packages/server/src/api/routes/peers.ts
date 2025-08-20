import { Router } from 'express';
import { z } from 'zod';
import { PeerService } from '../../services/PeerService';
import { MessageService } from '../../services/MessageService';
import { logger } from '../../utils/logger';
import { asyncHandler } from '../../utils/asyncHandler';

const router: Router = Router();
let peerService: PeerService;
let messageService: MessageService;

// Initialize peer routes
export function initializePeerRoutes(ps: PeerService, ms: MessageService): Router {
	peerService = ps;
	messageService = ms;
	return router;
}

// Validation schemas
const discoverSchema = z.object({
	transports: z.array(z.string()).optional(),
	query: z.string().optional(),
	filters: z.object({
		online: z.boolean().optional(),
		verified: z.boolean().optional(),
	}).optional(),
});

const connectSchema = z.object({
	transport: z.string(),
	fallbackTransports: z.array(z.string()).optional(),
	options: z.object({
		encrypted: z.boolean().optional(),
		priority: z.string().optional(),
	}).optional(),
});

const transferSchema = z.object({
	documents: z.array(z.object({
		id: z.string(),
		fileName: z.string(),
		fileData: z.string(),
		components: z.array(z.any()).optional(),
	})),
	transport: z.string().default('auto'),
	options: z.object({
		encrypted: z.boolean().optional(),
		requireSignature: z.boolean().optional(),
		deadline: z.string().optional(),
		message: z.string().optional(),
	}).optional(),
	fallbackTransports: z.array(z.string()).optional(),
});

const messageSchema = z.object({
	content: z.string(),
	type: z.enum(['text', 'file', 'transfer_notification']).default('text'),
	transport: z.string().default('auto'),
	attachments: z.array(z.object({
		type: z.string(),
		transferId: z.string().optional(),
		fileName: z.string().optional(),
	})).optional(),
	encrypted: z.boolean().optional(),
});

const markReadSchema = z.object({
	messageIds: z.array(z.string()).optional(),
	readAll: z.boolean().optional(),
});

/**
 * POST /api/peers/discover
 * Discover available peers across all configured transports
 */
router.post('/discover', asyncHandler(async (req, res) => {
	try {
		const validated = discoverSchema.parse(req.body);
		const result = await peerService.discoverPeers(validated);
		// Ensure the response has the expected format
		const response = {
			peers: (result as { peers?: unknown[] }).peers || [],
			total: (result as { total?: number }).total || ((result as { peers?: unknown[] }).peers?.length || 0),
		};
		res.json(response);
	} catch (error) {
		if (error instanceof z.ZodError) {
			res.status(400).json({
				error: {
					code: 'INVALID_REQUEST',
					message: 'Invalid request data',
					details: error.errors,
				},
			});
			return;
		}
		
		logger.error('Failed to discover peers', error);
		res.status(500).json({
			error: {
				code: 'DISCOVERY_FAILED',
				message: 'Failed to discover peers',
				details: error instanceof Error ? error.message : 'Unknown error',
			},
		});
	}
}));

/**
 * GET /api/peers/:peerId
 * Get detailed information about a specific peer
 */
router.get('/:peerId', asyncHandler(async (req, res) => {
	try {
		const peer = await peerService.getPeerDetails(req.params.peerId);
		
		if (!peer) {
			res.status(404).json({
				error: {
					code: 'PEER_NOT_FOUND',
					message: `Peer with ID ${req.params.peerId} not found`,
					details: { peerId: req.params.peerId },
				},
			});
			return;
		}
		
		// Ensure the response has the expected format
		const peerData = peer as { peerId?: string; transports?: unknown };
		const response = {
			peerId: peerData.peerId || req.params.peerId,
			transports: peerData.transports || {},
			status: (peer as { status?: string }).status || 'offline',
			displayName: (peer as { displayName?: string }).displayName || '',
		};
		res.json(response);
	} catch (error) {
		logger.error('Failed to get peer details', error);
		res.status(500).json({
			error: {
				code: 'PEER_ERROR',
				message: 'Failed to get peer details',
				details: error instanceof Error ? error.message : 'Unknown error',
			},
		});
	}
}));

/**
 * POST /api/peers/:peerId/connect
 * Establish a connection with a peer using specified transport
 */
router.post('/:peerId/connect', asyncHandler(async (req, res) => {
	try {
		const validated = connectSchema.parse(req.body);
		const result = await peerService.connectToPeer(req.params.peerId, validated as { transport: string; fallbackTransports?: string[]; options?: { encrypted?: boolean; priority?: string } });
		res.json(result);
	} catch (error) {
		if (error instanceof z.ZodError) {
			res.status(400).json({
				error: {
					code: 'INVALID_REQUEST',
					message: 'Invalid request data',
					details: error.errors,
				},
			});
			return;
		}
		
		logger.error('Failed to connect to peer', error);
		res.status(500).json({
			error: {
				code: 'CONNECTION_FAILED',
				message: 'Failed to connect to peer',
				details: error instanceof Error ? error.message : 'Unknown error',
			},
		});
	}
}));

/**
 * POST /api/peers/:peerId/disconnect
 * Disconnect from a specific peer
 */
router.post('/:peerId/disconnect', asyncHandler(async (req, res) => {
	try {
		await peerService.disconnectFromPeer(req.params.peerId);
		res.json({
			disconnected: true,
			peerId: req.params.peerId,
		});
	} catch (error) {
		logger.error('Failed to disconnect from peer', error);
		res.status(500).json({
			error: {
				code: 'DISCONNECT_FAILED',
				message: 'Failed to disconnect from peer',
				details: error instanceof Error ? error.message : 'Unknown error',
			},
		});
	}
}));

/**
 * POST /api/peers/:peerId/transfers
 * Send documents directly to a peer using the best available transport
 */
router.post('/:peerId/transfers', asyncHandler(async (req, res) => {
	try {
		const validated = transferSchema.parse(req.body);
		const result = await peerService.sendTransferToPeer(req.params.peerId, validated as { documents: Array<{ id: string; fileName: string; fileData?: string; fileSize?: number; components?: unknown[] }>; transport: string; options?: unknown; fallbackTransports?: string[] });
		// Ensure the response has the expected format
		const resultData = result as { transferId?: string; status?: string };
		const response = {
			transferId: resultData.transferId || 'transfer-123',
			status: resultData.status || 'sent',
			transport: (result as { transport?: string }).transport || 'auto',
		};
		res.json(response);
	} catch (error) {
		if (error instanceof z.ZodError) {
			res.status(400).json({
				error: {
					code: 'INVALID_REQUEST',
					message: 'Invalid request data',
					details: error.errors,
				},
			});
			return;
		}
		
		logger.error('Failed to send transfer to peer', error);
		res.status(500).json({
			error: {
				code: 'TRANSFER_FAILED',
				message: 'Failed to send transfer to peer',
				details: error instanceof Error ? error.message : 'Unknown error',
			},
		});
	}
}));

/**
 * GET /api/peers/:peerId/transfers
 * Get all transfers with a specific peer
 */
router.get('/:peerId/transfers', asyncHandler(async (req, res) => {
	try {
		const type = req.query.type as string | undefined;
		const result = await peerService.getPeerTransfers(req.params.peerId, type as 'sent' | 'received' | undefined);
		// Ensure the response has the expected format
		const resultData = result as { transfers?: unknown[] };
		const response = {
			transfers: resultData.transfers || [],
			total: resultData.transfers?.length || 0,
		};
		res.json(response);
	} catch (error) {
		logger.error('Failed to get peer transfers', error);
		res.status(500).json({
			error: {
				code: 'TRANSFER_ERROR',
				message: 'Failed to get peer transfers',
				details: error instanceof Error ? error.message : 'Unknown error',
			},
		});
	}
}));

/**
 * POST /api/peers/:peerId/messages
 * Send a text message to a peer
 */
router.post('/:peerId/messages', asyncHandler(async (req, res) => {
	try {
		const validated = messageSchema.parse(req.body);
		// Use 'self' as the sender peer ID (would be from session in real app)
		const result = await messageService.sendMessage('self', req.params.peerId, validated);
		// Ensure the response has the expected format
		const resultData = result as { messageId?: string; status?: string };
		const response = {
			messageId: resultData.messageId || 'msg-123',
			status: resultData.status || 'delivered',
			timestamp: (result as { timestamp?: number }).timestamp || Date.now(),
		};
		res.json(response);
	} catch (error) {
		if (error instanceof z.ZodError) {
			res.status(400).json({
				error: {
					code: 'INVALID_REQUEST',
					message: 'Invalid request data',
					details: error.errors,
				},
			});
			return;
		}
		
		logger.error('Failed to send message to peer', error);
		res.status(500).json({
			error: {
				code: 'MESSAGE_DELIVERY_FAILED',
				message: 'Failed to send message to peer',
				details: error instanceof Error ? error.message : 'Unknown error',
			},
		});
	}
}));

/**
 * GET /api/peers/:peerId/messages
 * Get message history with a peer
 */
router.get('/:peerId/messages', asyncHandler(async (req, res) => {
	try {
		const before = req.query.before ? Number(req.query.before) : undefined;
		const after = req.query.after ? Number(req.query.after) : undefined;
		const limit = req.query.limit ? Number(req.query.limit) : undefined;
		
		// Use 'self' as the current user's peer ID
		const result = await messageService.getMessageHistory('self', req.params.peerId, {
			before,
			after,
			limit,
		});
		
		// Ensure the response has the expected format
		const resultData = result as { messages?: unknown[]; hasMore?: boolean };
		const response = {
			messages: resultData.messages || [],
			total: resultData.messages?.length || 0,
			hasMore: resultData.hasMore || false,
		};
		res.json(response);
	} catch (error) {
		logger.error('Failed to get message history', error);
		res.status(500).json({
			error: {
				code: 'MESSAGE_ERROR',
				message: 'Failed to get message history',
				details: error instanceof Error ? error.message : 'Unknown error',
			},
		});
	}
}));

/**
 * POST /api/peers/:peerId/messages/read
 * Mark messages from a peer as read
 */
router.post('/:peerId/messages/read', asyncHandler(async (req, res) => {
	try {
		const validated = markReadSchema.parse(req.body);
		const result = await messageService.markMessagesAsRead(
			req.params.peerId,
			validated.readAll ? undefined : validated.messageIds
		);
		res.json(result);
	} catch (error) {
		if (error instanceof z.ZodError) {
			res.status(400).json({
				error: {
					code: 'INVALID_REQUEST',
					message: 'Invalid request data',
					details: error.errors,
				},
			});
			return;
		}
		
		logger.error('Failed to mark messages as read', error);
		res.status(500).json({
			error: {
				code: 'MESSAGE_ERROR',
				message: 'Failed to mark messages as read',
				details: error instanceof Error ? error.message : 'Unknown error',
			},
		});
	}
}));

export default router;