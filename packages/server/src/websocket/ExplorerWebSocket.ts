import { WebSocketServer, WebSocket } from 'ws';
import { Server } from 'http';
import { EventEmitter } from 'events';
import { logger } from '../utils/logger';
import { PeerService } from '../services/PeerService';
import { MessageService } from '../services/MessageService';
import { GroupService } from '../services/GroupService';

interface WebSocketClient {
	id: string;
	ws: WebSocket;
	peerId?: string;
	subscriptions: Set<string>;
	groups: Set<string>;
}

export class ExplorerWebSocketServer extends EventEmitter {
	private wss: WebSocketServer;
	private clients: Map<string, WebSocketClient> = new Map();
	private peerService: PeerService;
	private messageService: MessageService;
	private groupService: GroupService;

	constructor(
		server: Server,
		peerService: PeerService,
		messageService: MessageService,
		groupService: GroupService
	) {
		super();
		this.peerService = peerService;
		this.messageService = messageService;
		this.groupService = groupService;

		// Create WebSocket server
		try {
			this.wss = new WebSocketServer({
				server,
				path: '/explorer',
			});
			logger.info('ExplorerWebSocketServer initialized on path /explorer');
		} catch (error) {
			logger.error('Failed to initialize ExplorerWebSocketServer:', error);
			throw error;
		}

		this.setupWebSocketServer();
		this.setupEventListeners();
	}

	private setupWebSocketServer(): void {
		// Add error handling for the WebSocket server itself
		this.wss.on('error', (error: Error) => {
			logger.error('ExplorerWebSocketServer error:', error);
		});

		this.wss.on('connection', (ws: WebSocket) => {
			const clientId = this.generateClientId();
			const client: WebSocketClient = {
				id: clientId,
				ws,
				subscriptions: new Set(),
				groups: new Set(),
			};

			this.clients.set(clientId, client);
			logger.info(`WebSocket client connected: ${clientId}`);

			// Send connection confirmation
			this.sendToClient(client, {
				type: 'connected',
				clientId,
				timestamp: Date.now(),
			});

			// Handle messages from client
			ws.on('message', (data: Buffer) => {
				try {
					const message = JSON.parse(data.toString()) as unknown;
					this.handleClientMessage(client, message);
				} catch (error) {
					logger.error('Invalid WebSocket message', error);
					this.sendToClient(client, {
						type: 'error',
						error: 'Invalid message format',
					});
				}
			});

			// Handle client disconnect
			ws.on('close', () => {
				logger.info(`WebSocket client disconnected: ${clientId}`);
				this.clients.delete(clientId);
			});

			ws.on('error', (error) => {
				logger.error(`WebSocket error for client ${clientId}`, error);
			});
		});
	}

	private setupEventListeners(): void {
		// Listen to peer service events
		this.peerService.on('peer:connected', (data: { peerId: string; transport?: string }) => {
			this.broadcastToPeerSubscribers(data.peerId, {
				type: 'peer:status',
				peerId: data.peerId,
				status: 'online',
				transport: data.transport,
				timestamp: Date.now(),
			});
		});

		this.peerService.on('peer:disconnected', (data: { peerId: string }) => {
			this.broadcastToPeerSubscribers(data.peerId, {
				type: 'peer:status',
				peerId: data.peerId,
				status: 'offline',
				timestamp: Date.now(),
			});
		});

		this.peerService.on('transfer:sent', (data: { transferId: string; peerId: string }) => {
			this.broadcastToPeerSubscribers(data.peerId, {
				type: 'transfer:sent',
				transferId: data.transferId,
				peerId: data.peerId,
				timestamp: Date.now(),
			});
		});

		// Listen to message service events
		this.messageService.on('message:sent', (data: { messageId: string; fromPeerId: string; toPeerId: string; timestamp: number }) => {
			this.broadcastToPeerSubscribers(data.toPeerId, {
				type: 'message:received',
				message: {
					messageId: data.messageId,
					peerId: data.fromPeerId,
					content: 'New message received', // Don't send actual content in notification
					timestamp: data.timestamp,
				},
			});
		});

		// Listen to group service events
		this.groupService.on('group:message', (data: { groupId: string; senderPeerId: string; type: string }) => {
			this.broadcastToGroup(data.groupId, {
				type: 'group:update',
				groupId: data.groupId,
				event: 'message_sent',
				data: {
					senderPeerId: data.senderPeerId,
					type: data.type,
				},
			});
		});

		this.groupService.on('group:member:added', (data: { groupId: string; peerId: string; role: string }) => {
			this.broadcastToGroup(data.groupId, {
				type: 'group:update',
				groupId: data.groupId,
				event: 'member_joined',
				data: {
					peerId: data.peerId,
					role: data.role,
				},
			});
		});
	}

	private handleClientMessage(client: WebSocketClient, message: unknown): void {
		const msg = message as { type?: string; peerId?: string; groupId?: string; content?: string; transport?: string };
		try {
			switch (msg.type) {
				case 'subscribe':
					if (msg.peerId) this.handleSubscribe(client, msg.peerId);
					break;
				case 'unsubscribe':
					if (msg.peerId) this.handleUnsubscribe(client, msg.peerId);
					break;
				case 'join_group':
					if (msg.groupId) this.handleJoinGroup(client, msg.groupId);
					break;
				case 'leave_group':
					if (msg.groupId) this.handleLeaveGroup(client, msg.groupId);
					break;
				case 'message':
					void this.handleSendMessage(client, msg);
					break;
				default:
					this.sendToClient(client, {
						type: 'error',
						error: `Unknown message type: ${msg.type}`,
					});
			}
		} catch (error) {
			logger.error('Error handling WebSocket message', error);
			this.sendToClient(client, {
				type: 'error',
				error: 'Failed to process message',
			});
		}
	}

	private handleSubscribe(client: WebSocketClient, peerId: string): void {
		client.subscriptions.add(peerId);
		this.sendToClient(client, {
			type: 'subscribed',
			peerId,
		});
	}

	private handleUnsubscribe(client: WebSocketClient, peerId: string): void {
		client.subscriptions.delete(peerId);
		this.sendToClient(client, {
			type: 'unsubscribed',
			peerId,
		});
	}

	private handleJoinGroup(client: WebSocketClient, groupId: string): void {
		client.groups.add(groupId);
		this.sendToClient(client, {
			type: 'joined_group',
			groupId,
		});
	}

	private handleLeaveGroup(client: WebSocketClient, groupId: string): void {
		client.groups.delete(groupId);
		this.sendToClient(client, {
			type: 'left_group',
			groupId,
		});
	}

	private async handleSendMessage(client: WebSocketClient, message: { peerId?: string; content?: string; transport?: string }): Promise<void> {
		try {
			if (!message.peerId) {
				throw new Error('Peer ID is required');
			}
			const result = await this.messageService.sendMessage('self', message.peerId, {
				content: message.content ?? '',
				transport: message.transport || 'auto',
			});

			this.sendToClient(client, {
				type: 'message:sent',
				messageId: result.messageId,
				status: result.status,
			});
		} catch {
			this.sendToClient(client, {
				type: 'error',
				error: 'Failed to send message',
			});
		}
	}

	private broadcastToPeerSubscribers(peerId: string, data: unknown): void {
		for (const client of this.clients.values()) {
			if (client.subscriptions.has(peerId)) {
				this.sendToClient(client, data);
			}
		}
	}

	private broadcastToGroup(groupId: string, data: unknown): void {
		for (const client of this.clients.values()) {
			if (client.groups.has(groupId)) {
				this.sendToClient(client, data);
			}
		}
	}

	private sendToClient(client: WebSocketClient, data: unknown): void {
		if (client.ws.readyState === WebSocket.OPEN) {
			client.ws.send(JSON.stringify(data));
		}
	}

	private generateClientId(): string {
		return `client-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
	}

	public broadcast(data: unknown): void {
		for (const client of this.clients.values()) {
			this.sendToClient(client, data);
		}
	}

	public emitTransportStatus(transport: string, status: string, details?: unknown): void {
		this.broadcast({
			type: 'transport:status',
			transport,
			status,
			details,
			timestamp: Date.now(),
		});
	}

	public emitPeerDiscovered(peer: unknown): void {
		this.broadcast({
			type: 'peer:discovered',
			peer,
			timestamp: Date.now(),
		});
	}

	public emitTransferReceived(transfer: { transferId: string; fromPeerId: string; documentCount: number; transport: string }): void {
		this.broadcastToPeerSubscribers(transfer.fromPeerId, {
			type: 'transfer:received',
			transfer: {
				transferId: transfer.transferId,
				peerId: transfer.fromPeerId,
				documentCount: transfer.documentCount,
				transport: transfer.transport,
			},
			timestamp: Date.now(),
		});
	}
}