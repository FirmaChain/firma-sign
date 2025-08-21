import { Router, Request, Response, NextFunction } from 'express';
import { PeerService } from '../../services/PeerService.js';
import { MessageService } from '../../services/MessageService.js';
import { GroupService } from '../../services/GroupService.js';
import { logger } from '../../utils/logger.js';

// Helper function to wrap async route handlers
function asyncHandler(fn: (req: Request, res: Response, next: NextFunction) => Promise<void>) {
	return (req: Request, res: Response, next: NextFunction): void => {
		Promise.resolve(fn(req, res, next)).catch(next);
	};
}

export function createPeerExplorerRoutes(
	peerService: PeerService,
	messageService: MessageService,
	groupService: GroupService,
): Router {
	const router = Router();

	// Initialize transports
	router.post('/connections/initialize', asyncHandler(async (req, res): Promise<void> => {
		try {
			const { transports, config } = req.body as {
				transports: string[];
				config: Record<string, unknown>;
			};

			// Initialize requested transports
			const initialized = await peerService.initializeTransports(transports, config);

			// Get status for each transport
			const transportStatuses: Record<string, unknown> = {};
			for (const transport of transports) {
				transportStatuses[transport] = {
					status: initialized ? 'active' : 'inactive',
					connections: 0,
					config: config[transport] || {},
				};
			}

			res.json({
				initialized: true,
				transports: transportStatuses,
			});
		} catch (error) {
			logger.error('Failed to initialize transports:', error);
			res.status(500).json({
				error: { message: 'Failed to initialize transports', code: 'INIT_FAILED' },
			});
		}
	}));

	// Get connection status
	router.get('/connections/status', (_req, res): void => {
		try {
			const status = peerService.getConnectionStatus();
			res.json(status);
		} catch (error) {
			logger.error('Failed to get connection status:', error);
			res.status(500).json({
				error: { message: 'Failed to get connection status', code: 'STATUS_ERROR' },
			});
		}
	});

	// Discover peers
	router.post('/peers/discover', asyncHandler(async (req, res): Promise<void> => {
		try {
			const filters = req.body as {
				transports: string[];
				query?: string;
				filters?: Record<string, unknown>;
			};

			const peers = await peerService.discoverPeers(filters);

			res.json({
				peers: peers.peers,
				total: peers.total,
				discovered: peers.discovered,
			});
		} catch (error) {
			logger.error('Failed to discover peers:', error);
			res.status(500).json({
				error: { message: 'Failed to discover peers', code: 'DISCOVERY_ERROR' },
			});
		}
	}));

	// Get peer details
	router.get('/peers/:peerId', asyncHandler(async (req, res): Promise<void> => {
		try {
			const { peerId } = req.params;
			const peer = await peerService.getPeerDetails(peerId);

			if (!peer) {
				res.status(404).json({
					error: { message: 'Peer not found', code: 'PEER_NOT_FOUND' },
				});
				return;
			}

			res.json(peer);
		} catch (error) {
			logger.error('Failed to get peer details:', error);
			res.status(500).json({
				error: { message: 'Failed to get peer details', code: 'DETAILS_ERROR' },
			});
		}
	}));

	// Connect to peer
	router.post('/peers/:peerId/connect', asyncHandler(async (req, res): Promise<void> => {
		try {
			const { peerId } = req.params;
			const options = req.body as {
				preferredTransport?: string;
				fallbackTransports?: string[];
			};

			const result = await peerService.connectToPeer(peerId, {
				preferredTransport: options.preferredTransport || 'p2p',
				fallbackTransports: options.fallbackTransports,
			});

			res.json({
				connected: result.connected,
				connectionId: result.connectionId || '',
				transport: result.transport,
				latency: result.latency || 0,
				encrypted: true,
				sessionToken: result.sessionToken || '',
			});
		} catch (error) {
			logger.error('Failed to connect to peer:', error);
			res.status(500).json({
				error: { message: 'Failed to connect to peer', code: 'CONNECTION_ERROR' },
			});
		}
	}));

	// Disconnect from peer
	router.post('/peers/:peerId/disconnect', asyncHandler(async (req, res): Promise<void> => {
		try {
			const { peerId } = req.params;
			const result = await peerService.disconnectFromPeer(peerId);

			res.json({
				disconnected: result.disconnected,
				peerId,
			});
		} catch (error) {
			logger.error('Failed to disconnect from peer:', error);
			res.status(500).json({
				error: { message: 'Failed to disconnect from peer', code: 'DISCONNECT_ERROR' },
			});
		}
	}));

	// Send message to peer
	router.post('/peers/:peerId/messages', asyncHandler(async (req, res): Promise<void> => {
		try {
			const { peerId } = req.params;
			const message = req.body as {
				content: string;
				transport?: string;
				attachments?: Array<{ transferId?: string; fileName?: string }>;
			};

			const result = await messageService.sendMessage('self', peerId, {
				content: message.content,
				transport: message.transport,
				attachments: message.attachments?.map(a => ({
					type: 'file',
					...a,
				})),
			});

			res.json({
				messageId: result.messageId,
				status: result.status,
				transport: result.transport,
				timestamp: Date.now(),
			});
		} catch (error) {
			logger.error('Failed to send message:', error);
			res.status(500).json({
				error: { message: 'Failed to send message', code: 'MESSAGE_ERROR' },
			});
		}
	}));

	// Get messages with peer
	router.get('/peers/:peerId/messages', (req, res): void => {
		try {
			const { limit = 50 } = req.query;

			// For now, return empty messages since the method doesn't exist yet
			const messages: unknown[] = [];

			res.json({
				messages,
				total: messages.length,
				hasMore: messages.length === Number(limit),
			});
		} catch (error) {
			logger.error('Failed to get messages:', error);
			res.status(500).json({
				error: { message: 'Failed to get messages', code: 'MESSAGES_ERROR' },
			});
		}
	});

	// Send transfer to peer
	router.post('/peers/:peerId/transfers', asyncHandler(async (req, res): Promise<void> => {
		try {
			const { peerId } = req.params;
			const transfer = req.body as {
				documentIds: string[];
				transport?: string;
				options?: Record<string, unknown>;
			};

			const result = await peerService.sendTransfer(peerId, transfer);

			res.json({
				transferId: result.transferId,
				status: result.status,
				transport: result.transport,
			});
		} catch (error) {
			logger.error('Failed to send transfer:', error);
			res.status(500).json({
				error: { message: 'Failed to send transfer', code: 'TRANSFER_ERROR' },
			});
		}
	}));

	// Get transfers with peer
	router.get('/peers/:peerId/transfers', asyncHandler(async (req, res): Promise<void> => {
		try {
			const { peerId } = req.params;
			const transfers = await peerService.getTransfers(peerId);

			res.json({
				transfers,
				total: transfers.length,
			});
		} catch (error) {
			logger.error('Failed to get transfers:', error);
			res.status(500).json({
				error: { message: 'Failed to get transfers', code: 'TRANSFERS_ERROR' },
			});
		}
	}));

	// Create group
	router.post('/groups', asyncHandler(async (req, res): Promise<void> => {
		try {
			const group = req.body as {
				name: string;
				description?: string;
				members: Array<{ peerId: string; role: 'admin' | 'member' }>;
			};

			// The groupService.createGroup needs ownerPeerId and options
			const createdGroup = await groupService.createGroup('self', {
				name: group.name,
				description: group.description,
				members: group.members || [],
				settings: {
					allowMemberInvites: true,
					requireEncryption: false,
					defaultTransport: 'p2p',
				},
			});
			const result = { groupId: createdGroup.groupId, created: true };

			res.json({
				groupId: result.groupId,
				created: true,
			});
		} catch (error) {
			logger.error('Failed to create group:', error);
			res.status(500).json({
				error: { message: 'Failed to create group', code: 'GROUP_ERROR' },
			});
		}
	}));

	// Get groups
	router.get('/groups', (_req, res): void => {
		try {
			// Use getGroups method - return empty for now
			const groups: unknown[] = [];

			res.json({
				groups,
				total: groups.length,
			});
		} catch (error) {
			logger.error('Failed to get groups:', error);
			res.status(500).json({
				error: { message: 'Failed to get groups', code: 'GROUPS_ERROR' },
			});
		}
	});

	return router;
}