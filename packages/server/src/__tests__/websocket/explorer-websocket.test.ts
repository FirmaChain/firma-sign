import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from 'vitest';
import WebSocket from 'ws';
import { createServer, Server } from 'http';
import { ExplorerWebSocketServer } from '../../websocket/ExplorerWebSocket';
import { PeerService } from '../../services/PeerService';
import { MessageService } from '../../services/MessageService';
import { GroupService } from '../../services/GroupService';
import { ConnectionManager } from '../../services/ConnectionManager';

describe('Explorer WebSocket Server', () => {
	let httpServer: Server;
	let wsServer: ExplorerWebSocketServer;
	let peerService: PeerService;
	let messageService: MessageService;
	let groupService: GroupService;
	let wsClient: WebSocket;
	const TEST_PORT = 8081;

	beforeAll((done) => {
		// Create HTTP server
		httpServer = createServer();
		
		// Create service mocks
		const connectionManager = new ConnectionManager();
		peerService = new PeerService(connectionManager);
		messageService = new MessageService();
		groupService = new GroupService(peerService, messageService);
		
		// Create WebSocket server
		wsServer = new ExplorerWebSocketServer(
			httpServer,
			peerService,
			messageService,
			groupService
		);
		
		// Start server
		httpServer.listen(TEST_PORT, done);
	});

	afterAll((done) => {
		if (wsClient && wsClient.readyState === WebSocket.OPEN) {
			wsClient.close();
		}
		httpServer.close(done);
	});

	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe('Connection Management', () => {
		it('should accept WebSocket connections', (done) => {
			wsClient = new WebSocket(`ws://localhost:${TEST_PORT}/explorer`);
			
			wsClient.on('open', () => {
				expect(wsClient.readyState).toBe(WebSocket.OPEN);
				done();
			});
		});

		it('should send connection confirmation', (done) => {
			wsClient = new WebSocket(`ws://localhost:${TEST_PORT}/explorer`);
			
			wsClient.on('message', (data) => {
				const message = JSON.parse(data.toString());
				if (message.type === 'connected') {
					expect(message).toHaveProperty('clientId');
					expect(message).toHaveProperty('timestamp');
					done();
				}
			});
		});

		it('should handle client disconnection', (done) => {
			wsClient = new WebSocket(`ws://localhost:${TEST_PORT}/explorer`);
			
			wsClient.on('open', () => {
				wsClient.close();
				// Give server time to process disconnection
				setTimeout(() => {
					expect(wsClient.readyState).toBe(WebSocket.CLOSED);
					done();
				}, 100);
			});
		});
	});

	describe('Peer Subscriptions', () => {
		beforeEach((done) => {
			wsClient = new WebSocket(`ws://localhost:${TEST_PORT}/explorer`);
			wsClient.on('open', done);
		});

		it('should handle peer subscription', (done) => {
			wsClient.on('message', (data) => {
				const message = JSON.parse(data.toString());
				if (message.type === 'subscribed') {
					expect(message.peerId).toBe('peer-123');
					done();
				}
			});

			wsClient.send(JSON.stringify({
				type: 'subscribe',
				peerId: 'peer-123'
			}));
		});

		it('should handle peer unsubscription', (done) => {
			// First subscribe
			wsClient.send(JSON.stringify({
				type: 'subscribe',
				peerId: 'peer-123'
			}));

			// Then unsubscribe
			setTimeout(() => {
				wsClient.on('message', (data) => {
					const message = JSON.parse(data.toString());
					if (message.type === 'unsubscribed') {
						expect(message.peerId).toBe('peer-123');
						done();
					}
				});

				wsClient.send(JSON.stringify({
					type: 'unsubscribe',
					peerId: 'peer-123'
				}));
			}, 100);
		});

		it('should broadcast peer status updates to subscribers', (done) => {
			// Subscribe to peer
			wsClient.send(JSON.stringify({
				type: 'subscribe',
				peerId: 'peer-123'
			}));

			// Listen for status updates
			wsClient.on('message', (data) => {
				const message = JSON.parse(data.toString());
				if (message.type === 'peer:status') {
					expect(message.peerId).toBe('peer-123');
					expect(message.status).toBe('online');
					done();
				}
			});

			// Simulate peer connection event
			setTimeout(() => {
				peerService.emit('peer:connected', {
					peerId: 'peer-123',
					transport: 'p2p'
				});
			}, 100);
		});
	});

	describe('Group Management', () => {
		beforeEach((done) => {
			wsClient = new WebSocket(`ws://localhost:${TEST_PORT}/explorer`);
			wsClient.on('open', done);
		});

		it('should handle joining a group', (done) => {
			wsClient.on('message', (data) => {
				const message = JSON.parse(data.toString());
				if (message.type === 'joined_group') {
					expect(message.groupId).toBe('group-123');
					done();
				}
			});

			wsClient.send(JSON.stringify({
				type: 'join_group',
				groupId: 'group-123'
			}));
		});

		it('should handle leaving a group', (done) => {
			// First join
			wsClient.send(JSON.stringify({
				type: 'join_group',
				groupId: 'group-123'
			}));

			// Then leave
			setTimeout(() => {
				wsClient.on('message', (data) => {
					const message = JSON.parse(data.toString());
					if (message.type === 'left_group') {
						expect(message.groupId).toBe('group-123');
						done();
					}
				});

				wsClient.send(JSON.stringify({
					type: 'leave_group',
					groupId: 'group-123'
				}));
			}, 100);
		});

		it('should broadcast group updates to members', (done) => {
			// Join group
			wsClient.send(JSON.stringify({
				type: 'join_group',
				groupId: 'group-123'
			}));

			// Listen for group updates
			wsClient.on('message', (data) => {
				const message = JSON.parse(data.toString());
				if (message.type === 'group:update') {
					expect(message.groupId).toBe('group-123');
					expect(message.event).toBe('message_sent');
					done();
				}
			});

			// Simulate group message event
			setTimeout(() => {
				groupService.emit('group:message', {
					groupId: 'group-123',
					senderPeerId: 'peer-456',
					type: 'text'
				});
			}, 100);
		});
	});

	describe('Messaging', () => {
		beforeEach((done) => {
			wsClient = new WebSocket(`ws://localhost:${TEST_PORT}/explorer`);
			wsClient.on('open', done);
		});

		it('should handle sending messages', (done) => {
			// Mock the message service
			vi.spyOn(messageService, 'sendMessage').mockResolvedValue({
				messageId: 'msg-123',
				status: 'sent',
				timestamp: Date.now()
			});

			wsClient.on('message', (data) => {
				const message = JSON.parse(data.toString());
				if (message.type === 'message:sent') {
					expect(message.messageId).toBe('msg-123');
					expect(message.status).toBe('sent');
					done();
				}
			});

			wsClient.send(JSON.stringify({
				type: 'message',
				peerId: 'peer-123',
				content: 'Hello peer!',
				transport: 'auto'
			}));
		});

		it('should handle message send errors', (done) => {
			// Mock message service to reject
			vi.spyOn(messageService, 'sendMessage')
				.mockRejectedValue(new Error('Send failed'));

			wsClient.on('message', (data) => {
				const message = JSON.parse(data.toString());
				if (message.type === 'error') {
					expect(message.error).toBe('Failed to send message');
					done();
				}
			});

			wsClient.send(JSON.stringify({
				type: 'message',
				peerId: 'peer-123',
				content: 'Hello peer!'
			}));
		});

		it('should broadcast received messages to subscribers', (done) => {
			// Subscribe to peer
			wsClient.send(JSON.stringify({
				type: 'subscribe',
				peerId: 'peer-123'
			}));

			// Listen for message notifications
			wsClient.on('message', (data) => {
				const message = JSON.parse(data.toString());
				if (message.type === 'message:received') {
					expect(message.message.peerId).toBe('peer-456');
					expect(message.message.content).toBe('New message received');
					done();
				}
			});

			// Simulate message received event
			setTimeout(() => {
				messageService.emit('message:sent', {
					messageId: 'msg-123',
					fromPeerId: 'peer-456',
					toPeerId: 'peer-123',
					timestamp: Date.now()
				});
			}, 100);
		});
	});

	describe('Transfer Events', () => {
		beforeEach((done) => {
			wsClient = new WebSocket(`ws://localhost:${TEST_PORT}/explorer`);
			wsClient.on('open', done);
		});

		it('should broadcast transfer sent events', (done) => {
			// Subscribe to peer
			wsClient.send(JSON.stringify({
				type: 'subscribe',
				peerId: 'peer-123'
			}));

			// Listen for transfer events
			wsClient.on('message', (data) => {
				const message = JSON.parse(data.toString());
				if (message.type === 'transfer:sent') {
					expect(message.transferId).toBe('transfer-123');
					expect(message.peerId).toBe('peer-123');
					done();
				}
			});

			// Simulate transfer sent event
			setTimeout(() => {
				peerService.emit('transfer:sent', {
					transferId: 'transfer-123',
					peerId: 'peer-123'
				});
			}, 100);
		});

		it('should emit transfer received events', (done) => {
			// Subscribe to peer
			wsClient.send(JSON.stringify({
				type: 'subscribe',
				peerId: 'peer-123'
			}));

			// Listen for transfer events
			wsClient.on('message', (data) => {
				const message = JSON.parse(data.toString());
				if (message.type === 'transfer:received') {
					expect(message.transfer.transferId).toBe('transfer-456');
					expect(message.transfer.peerId).toBe('peer-123');
					done();
				}
			});

			// Simulate transfer received
			setTimeout(() => {
				wsServer.emitTransferReceived({
					transferId: 'transfer-456',
					fromPeerId: 'peer-123',
					documentCount: 2,
					transport: 'p2p'
				});
			}, 100);
		});
	});

	describe('Transport Status', () => {
		beforeEach((done) => {
			wsClient = new WebSocket(`ws://localhost:${TEST_PORT}/explorer`);
			wsClient.on('open', done);
		});

		it('should broadcast transport status updates', (done) => {
			wsClient.on('message', (data) => {
				const message = JSON.parse(data.toString());
				if (message.type === 'transport:status') {
					expect(message.transport).toBe('p2p');
					expect(message.status).toBe('connected');
					done();
				}
			});

			wsServer.emitTransportStatus('p2p', 'connected', {
				peerId: '12D3KooWTest'
			});
		});

		it('should broadcast peer discovery events', (done) => {
			wsClient.on('message', (data) => {
				const message = JSON.parse(data.toString());
				if (message.type === 'peer:discovered') {
					expect(message.peer.peerId).toBe('peer-789');
					expect(message.peer.displayName).toBe('Charlie');
					done();
				}
			});

			wsServer.emitPeerDiscovered({
				peerId: 'peer-789',
				displayName: 'Charlie',
				transports: ['p2p', 'email']
			});
		});
	});

	describe('Error Handling', () => {
		beforeEach((done) => {
			wsClient = new WebSocket(`ws://localhost:${TEST_PORT}/explorer`);
			wsClient.on('open', done);
		});

		it('should handle invalid message format', (done) => {
			wsClient.on('message', (data) => {
				const message = JSON.parse(data.toString());
				if (message.type === 'error') {
					expect(message.error).toBe('Invalid message format');
					done();
				}
			});

			wsClient.send('invalid json');
		});

		it('should handle unknown message types', (done) => {
			wsClient.on('message', (data) => {
				const message = JSON.parse(data.toString());
				if (message.type === 'error') {
					expect(message.error).toContain('Unknown message type');
					done();
				}
			});

			wsClient.send(JSON.stringify({
				type: 'unknown_type',
				data: 'test'
			}));
		});
	});

	describe('Broadcast Functions', () => {
		let wsClient1: WebSocket;
		let wsClient2: WebSocket;

		beforeEach((done) => {
			let connectedCount = 0;
			
			wsClient1 = new WebSocket(`ws://localhost:${TEST_PORT}/explorer`);
			wsClient2 = new WebSocket(`ws://localhost:${TEST_PORT}/explorer`);
			
			const checkConnected = () => {
				connectedCount++;
				if (connectedCount === 2) {
					done();
				}
			};
			
			wsClient1.on('open', checkConnected);
			wsClient2.on('open', checkConnected);
		});

		afterEach(() => {
			if (wsClient1) wsClient1.close();
			if (wsClient2) wsClient2.close();
		});

		it('should broadcast to all clients', (done) => {
			let receivedCount = 0;
			const checkReceived = () => {
				receivedCount++;
				if (receivedCount === 2) {
					done();
				}
			};

			wsClient1.on('message', (data) => {
				const message = JSON.parse(data.toString());
				if (message.type === 'test:broadcast') {
					checkReceived();
				}
			});

			wsClient2.on('message', (data) => {
				const message = JSON.parse(data.toString());
				if (message.type === 'test:broadcast') {
					checkReceived();
				}
			});

			// Wait for connection messages to be processed
			setTimeout(() => {
				wsServer.broadcast({
					type: 'test:broadcast',
					data: 'test data'
				});
			}, 100);
		});

		it('should only broadcast to peer subscribers', (done) => {
			// Client 1 subscribes to peer-123
			wsClient1.send(JSON.stringify({
				type: 'subscribe',
				peerId: 'peer-123'
			}));

			// Client 2 does not subscribe
			
			let client1Received = false;
			let timeoutId: NodeJS.Timeout;

			wsClient1.on('message', (data) => {
				const message = JSON.parse(data.toString());
				if (message.type === 'peer:status') {
					client1Received = true;
					// Wait to ensure client2 doesn't receive
					timeoutId = setTimeout(() => {
						expect(client1Received).toBe(true);
						done();
					}, 200);
				}
			});

			wsClient2.on('message', (data) => {
				const message = JSON.parse(data.toString());
				if (message.type === 'peer:status') {
					clearTimeout(timeoutId);
					done(new Error('Client 2 should not receive peer status'));
				}
			});

			// Emit peer status after subscription is processed
			setTimeout(() => {
				peerService.emit('peer:connected', {
					peerId: 'peer-123',
					transport: 'p2p'
				});
			}, 100);
		});

		it('should only broadcast to group members', (done) => {
			// Client 1 joins group
			wsClient1.send(JSON.stringify({
				type: 'join_group',
				groupId: 'group-123'
			}));

			// Client 2 does not join
			
			let client1Received = false;
			let timeoutId: NodeJS.Timeout;

			wsClient1.on('message', (data) => {
				const message = JSON.parse(data.toString());
				if (message.type === 'group:update') {
					client1Received = true;
					// Wait to ensure client2 doesn't receive
					timeoutId = setTimeout(() => {
						expect(client1Received).toBe(true);
						done();
					}, 200);
				}
			});

			wsClient2.on('message', (data) => {
				const message = JSON.parse(data.toString());
				if (message.type === 'group:update') {
					clearTimeout(timeoutId);
					done(new Error('Client 2 should not receive group update'));
				}
			});

			// Emit group event after join is processed
			setTimeout(() => {
				groupService.emit('group:member:added', {
					groupId: 'group-123',
					peerId: 'peer-456',
					role: 'member'
				});
			}, 100);
		});
	});
});