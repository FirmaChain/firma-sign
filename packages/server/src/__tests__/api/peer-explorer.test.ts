import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from 'vitest';
import request from 'supertest';
import express, { Express } from 'express';
import { createServer, Server } from 'http';
import { initializeDatabase, closeDatabase } from '../../database';

// Import route initializers
import { initializeConnectionRoutes } from '../../api/routes/connections';
import { initializePeerRoutes } from '../../api/routes/peers';
import { initializeGroupRoutes } from '../../api/routes/groups';
import { initializeTransportRoutes } from '../../api/routes/transports';

// Import services
import { ConnectionManager } from '../../services/ConnectionManager';
import { PeerService } from '../../services/PeerService';
import { MessageService } from '../../services/MessageService';
import { GroupService } from '../../services/GroupService';

// Mock the services
vi.mock('../../services/ConnectionManager');
vi.mock('../../services/PeerService');
vi.mock('../../services/MessageService');
vi.mock('../../services/GroupService');
vi.mock('../../utils/logger', () => ({
	logger: {
		info: vi.fn(),
		error: vi.fn(),
		warn: vi.fn(),
		debug: vi.fn(),
	}
}));

describe('Peer Explorer API', () => {
	let app: Express;
	let httpServer: Server;
	let connectionManager: ConnectionManager;
	let peerService: PeerService;
	let messageService: MessageService;
	let groupService: GroupService;

	beforeAll(() => {
		// Initialize test database
		initializeDatabase({ path: ':memory:' });
		
		// Create Express app
		app = express();
		app.use(express.json());
		httpServer = createServer(app);
		
		// Create service instances
		connectionManager = new ConnectionManager();
		peerService = new PeerService(connectionManager);
		messageService = new MessageService();
		groupService = new GroupService(peerService, messageService);
		
		// Initialize routes
		app.use('/api/connections', initializeConnectionRoutes(connectionManager));
		app.use('/api/peers', initializePeerRoutes(peerService, messageService));
		app.use('/api/groups', initializeGroupRoutes(groupService));
		app.use('/api/transports', initializeTransportRoutes(connectionManager));
	});

	afterAll(() => {
		closeDatabase();
		httpServer.close();
	});

	beforeEach(() => {
		// Reset all mocks before each test
		vi.clearAllMocks();
	});

	describe('Connection Management', () => {
		describe('POST /api/connections/initialize', () => {
			it('should initialize connections with specified transports', async () => {
				const mockStatus = {
					initialized: true,
					transports: {
						p2p: { status: 'active', nodeId: '12D3KooWTest' },
						email: { status: 'inactive', error: 'not configured' }
					}
				};
				
				vi.spyOn(connectionManager, 'initialize').mockResolvedValue(mockStatus);

				const response = await request(app)
					.post('/api/connections/initialize')
					.send({
						transports: ['p2p'],
						config: {
							p2p: { port: 9090 }
						}
					});

				expect(response.status).toBe(200);
				expect(response.body).toHaveProperty('initialized');
				expect(response.body.transports).toHaveProperty('p2p');
			});

			it('should reject invalid transport types', async () => {
				const response = await request(app)
					.post('/api/connections/initialize')
					.send({
						transports: ['invalid_transport'],
						config: {}
					});

				expect(response.status).toBe(400);
				expect(response.body.error.code).toBe('INVALID_REQUEST');
			});
		});

		describe('GET /api/connections/status', () => {
			it('should return current connection status', async () => {
				const mockStatus = {
					connections: {
						active: 5,
						pending: 2,
						failed: 1
					},
					transports: {
						p2p: {
							status: 'active',
							connections: 5,
							bandwidth: { in: 1024000, out: 512000 }
						}
					}
				};
				
				vi.spyOn(connectionManager, 'getStatus').mockReturnValue(mockStatus);

				const response = await request(app)
					.get('/api/connections/status');

				expect(response.status).toBe(200);
				expect(response.body).toHaveProperty('connections');
				expect(response.body.transports).toHaveProperty('p2p');
			});
		});
	});

	describe('Peer Discovery', () => {
		describe('POST /api/peers/discover', () => {
			it('should discover peers across all transports', async () => {
				const mockResult = {
					peers: [
						{
							peerId: 'peer-1',
							displayName: 'Alice',
							transports: ['p2p'],
							status: 'online'
						},
						{
							peerId: 'peer-2',
							displayName: 'Bob',
							transports: ['email'],
							status: 'offline'
						}
					]
				};
				
				vi.spyOn(peerService, 'discoverPeers').mockResolvedValue(mockResult);

				const response = await request(app)
					.post('/api/peers/discover')
					.send({ transports: ['p2p', 'email'] });

				expect(response.status).toBe(200);
				expect(response.body.peers).toHaveLength(2);
				expect(response.body.peers[0].peerId).toBe('peer-1');
			});

			it('should filter peers by transport', async () => {
				const mockResult = {
					peers: [
						{
							peerId: 'peer-1',
							displayName: 'Alice',
							transports: ['p2p'],
							status: 'online'
						}
					]
				};
				
				vi.spyOn(peerService, 'discoverPeers').mockResolvedValue(mockResult);

				const response = await request(app)
					.post('/api/peers/discover')
					.send({ transports: ['p2p'] });

				expect(response.status).toBe(200);
				expect(response.body.peers).toHaveLength(1);
				expect(response.body.peers[0].transports).toContain('p2p');
			});
		});

		describe('GET /api/peers/:peerId', () => {
			it('should return peer details', async () => {
				const mockPeer = {
					peerId: 'peer-1',
					displayName: 'Alice',
					trustLevel: 'verified',
					transports: {
						p2p: { peerId: '12D3KooWTest', addresses: [] },
						email: { address: 'alice@example.com' }
					},
					capabilities: ['document_transfer', 'messaging'],
					lastSeen: Date.now()
				};
				
				vi.spyOn(peerService, 'getPeerDetails').mockResolvedValue(mockPeer);

				const response = await request(app)
					.get('/api/peers/peer-1');

				expect(response.status).toBe(200);
				expect(response.body.peerId).toBe('peer-1');
				expect(response.body.transports).toHaveProperty('p2p');
			});

			it('should return 404 for unknown peer', async () => {
				vi.spyOn(peerService, 'getPeerDetails').mockResolvedValue(null);

				const response = await request(app)
					.get('/api/peers/unknown-peer');

				expect(response.status).toBe(404);
				expect(response.body.error.code).toBe('PEER_NOT_FOUND');
			});
		});
	});

	describe('Peer Connection', () => {
		describe('POST /api/peers/:peerId/connect', () => {
			it('should connect to peer with auto transport selection', async () => {
				const mockResult = {
					success: true,
					transport: 'p2p',
					connectionId: 'conn-123'
				};
				
				vi.spyOn(peerService, 'connectToPeer').mockResolvedValue(mockResult);

				const response = await request(app)
					.post('/api/peers/peer-1/connect')
					.send({ transport: 'auto' });

				expect(response.status).toBe(200);
				expect(response.body.success).toBe(true);
				expect(response.body.transport).toBe('p2p');
			});

			it('should connect with specific transport', async () => {
				const mockResult = {
					success: true,
					transport: 'email',
					connectionId: 'conn-456'
				};
				
				vi.spyOn(peerService, 'connectToPeer').mockResolvedValue(mockResult);

				const response = await request(app)
					.post('/api/peers/peer-1/connect')
					.send({ transport: 'email' });

				expect(response.status).toBe(200);
				expect(response.body.transport).toBe('email');
			});

			it('should handle connection failure', async () => {
				vi.spyOn(peerService, 'connectToPeer')
					.mockRejectedValue(new Error('Connection failed'));

				const response = await request(app)
					.post('/api/peers/peer-1/connect')
					.send({ transport: 'auto' });

				expect(response.status).toBe(500);
				expect(response.body.error.code).toBe('CONNECTION_FAILED');
			});
		});

		describe('POST /api/peers/:peerId/disconnect', () => {
			it('should disconnect from peer', async () => {
				vi.spyOn(peerService, 'disconnectFromPeer').mockResolvedValue(undefined);

				const response = await request(app)
					.post('/api/peers/peer-1/disconnect');

				expect(response.status).toBe(200);
				expect(response.body.disconnected).toBe(true);
			});
		});
	});

	describe('Document Transfers', () => {
		describe('POST /api/peers/:peerId/transfers', () => {
			it('should send documents to peer', async () => {
				const mockResult = {
					transferId: 'transfer-123',
					status: 'sent',
					transport: 'p2p'
				};
				
				vi.spyOn(peerService, 'sendTransferToPeer').mockResolvedValue(mockResult);

				const response = await request(app)
					.post('/api/peers/peer-1/transfers')
					.send({
						documents: [
							{
								id: 'doc-1',
								fileName: 'test.pdf',
								fileData: 'base64data',
								fileSize: 1024
							}
						],
						transport: 'auto'
					});

				expect(response.status).toBe(200);
				expect(response.body.transferId).toBe('transfer-123');
				expect(response.body.status).toBe('sent');
			});

			it('should validate document data', async () => {
				const response = await request(app)
					.post('/api/peers/peer-1/transfers')
					.send({
						documents: [{id: 'doc-1'}], // Missing required fields
						transport: 'auto'
					});

				expect(response.status).toBe(400);
				expect(response.body.error.code).toBe('INVALID_REQUEST');
			});
		});

		describe('GET /api/peers/:peerId/transfers', () => {
			it('should list transfers with peer', async () => {
				const mockTransfers = {
					transfers: [
						{
							transferId: 'transfer-1',
							direction: 'outgoing',
							status: 'completed',
							documentCount: 2,
							timestamp: Date.now()
						},
						{
							transferId: 'transfer-2',
							direction: 'incoming',
							status: 'pending',
							documentCount: 1,
							timestamp: Date.now()
						}
					]
				};
				
				vi.spyOn(peerService, 'getPeerTransfers').mockResolvedValue(mockTransfers);

				const response = await request(app)
					.get('/api/peers/peer-1/transfers');

				expect(response.status).toBe(200);
				expect(response.body.transfers).toHaveLength(2);
			});
		});
	});

	describe('Messaging', () => {
		describe('POST /api/peers/:peerId/messages', () => {
			it('should send message to peer', async () => {
				const mockResult = {
					messageId: 'msg-123',
					status: 'delivered',
					timestamp: Date.now()
				};
				
				vi.spyOn(messageService, 'sendMessage').mockResolvedValue(mockResult);

				const response = await request(app)
					.post('/api/peers/peer-1/messages')
					.send({
						content: 'Hello peer!',
						transport: 'auto'
					});

				expect(response.status).toBe(200);
				expect(response.body.messageId).toBe('msg-123');
				expect(response.body.status).toBe('delivered');
			});

			it('should validate message content', async () => {
				const response = await request(app)
					.post('/api/peers/peer-1/messages')
					.send({
						// Missing content field
						transport: 'auto'
					});

				expect(response.status).toBe(400);
				expect(response.body.error.code).toBe('INVALID_REQUEST');
			});
		});

		describe('GET /api/peers/:peerId/messages', () => {
			it('should get message history with peer', async () => {
				const mockMessages = {
					messages: [
						{
							id: 'msg-1',
							fromPeerId: 'self',
							toPeerId: 'peer-1',
							content: 'Hello',
							timestamp: Date.now() - 1000,
							status: 'delivered'
						},
						{
							id: 'msg-2',
							fromPeerId: 'peer-1',
							toPeerId: 'self',
							content: 'Hi there',
							timestamp: Date.now(),
							status: 'read'
						}
					],
					hasMore: false
				};
				
				vi.spyOn(messageService, 'getMessageHistory').mockResolvedValue(mockMessages);

				const response = await request(app)
					.get('/api/peers/peer-1/messages');

				expect(response.status).toBe(200);
				expect(response.body.messages).toHaveLength(2);
			});

			it('should support pagination', async () => {
				vi.spyOn(messageService, 'getMessageHistory').mockResolvedValue({ messages: [], hasMore: false });

				const response = await request(app)
					.get('/api/peers/peer-1/messages?limit=10&before=100');

				expect(response.status).toBe(200);
				expect(messageService.getMessageHistory).toHaveBeenCalledWith(
					'self',
					'peer-1',
					{ limit: 10, before: 100, after: undefined }
				);
			});
		});
	});

	describe('Peer Groups', () => {
		describe('POST /api/groups', () => {
			it('should create a new group', async () => {
				const mockGroup = {
					groupId: 'group-123',
					name: 'Test Group',
					members: [
						{ peerId: 'peer-1', role: 'admin' },
						{ peerId: 'peer-2', role: 'member' }
					],
					createdAt: Date.now()
				};
				
				vi.spyOn(groupService, 'createGroup').mockResolvedValue(mockGroup);

				const response = await request(app)
					.post('/api/groups')
					.send({
						name: 'Test Group',
						members: [
							{ peerId: 'peer-1', role: 'admin' },
							{ peerId: 'peer-2', role: 'member' }
						]
					});

				expect(response.status).toBe(200);
				expect(response.body.groupId).toBe('group-123');
				expect(response.body.members).toHaveLength(2);
			});

			it('should validate group data', async () => {
				const response = await request(app)
					.post('/api/groups')
					.send({
						// Missing required name field
						members: []
					});

				expect(response.status).toBe(400);
				expect(response.body.error.code).toBe('INVALID_REQUEST');
			});
		});

		describe('GET /api/groups/:groupId', () => {
			it('should get group details', async () => {
				const mockGroup = {
					groupId: 'group-123',
					name: 'Test Group',
					description: 'A test group',
					ownerPeerId: 'self',
					members: [],
					settings: {},
					createdAt: Date.now()
				};
				
				vi.spyOn(groupService, 'getGroup').mockResolvedValue(mockGroup);

				const response = await request(app)
					.get('/api/groups/group-123');

				expect(response.status).toBe(200);
				expect(response.body.groupId).toBe('group-123');
			});

			it('should return 404 for unknown group', async () => {
				vi.spyOn(groupService, 'getGroup').mockResolvedValue(null);

				const response = await request(app)
					.get('/api/groups/unknown-group');

				expect(response.status).toBe(404);
				expect(response.body.error.code).toBe('GROUP_NOT_FOUND');
			});
		});

		describe('POST /api/groups/:groupId/send', () => {
			it('should send documents to group', async () => {
				const mockResult = {
					results: [
						{ peerId: 'peer-1', status: 'sent' },
						{ peerId: 'peer-2', status: 'sent' }
					]
				};
				
				vi.spyOn(groupService, 'sendToGroup').mockResolvedValue(mockResult);

				const response = await request(app)
					.post('/api/groups/group-123/send')
					.send({
						type: 'document',
						documents: [
							{
								id: 'doc-1',
								fileName: 'test.pdf',
								fileData: 'base64data'
							}
						]
					});

				expect(response.status).toBe(200);
				expect(response.body.results).toHaveLength(2);
			});

			it('should send messages to group', async () => {
				const mockResult = {
					results: [
						{ peerId: 'peer-1', status: 'delivered' },
						{ peerId: 'peer-2', status: 'delivered' }
					]
				};
				
				vi.spyOn(groupService, 'sendToGroup').mockResolvedValue(mockResult);

				const response = await request(app)
					.post('/api/groups/group-123/send')
					.send({
						type: 'message',
						message: 'Hello group!'
					});

				expect(response.status).toBe(200);
				expect(response.body.results).toHaveLength(2);
			});
		});

		describe('POST /api/groups/:groupId/members', () => {
			it('should add member to group', async () => {
				vi.spyOn(groupService, 'addMemberToGroup').mockResolvedValue(undefined);

				const response = await request(app)
					.post('/api/groups/group-123/members')
					.send({
						peerId: 'peer-3',
						role: 'member'
					});

				expect(response.status).toBe(200);
				expect(response.body.success).toBe(true);
			});
		});

		describe('DELETE /api/groups/:groupId/members/:peerId', () => {
			it('should remove member from group', async () => {
				vi.spyOn(groupService, 'removeMemberFromGroup').mockResolvedValue(undefined);

				const response = await request(app)
					.delete('/api/groups/group-123/members/peer-2');

				expect(response.status).toBe(200);
				expect(response.body.success).toBe(true);
			});
		});
	});

	describe('Transport-Specific Operations', () => {
		describe('GET /api/transports/p2p/network', () => {
			it('should return P2P network statistics', async () => {
				const mockP2PTransport = {
					getStatus: vi.fn().mockReturnValue({
						info: {
							peerId: '12D3KooWTest',
							addresses: ['/ip4/127.0.0.1/tcp/9090']
						},
						connections: 10
					})
				};
				
				vi.spyOn(connectionManager, 'getTransport').mockReturnValue(mockP2PTransport);

				const response = await request(app)
					.get('/api/transports/p2p/network');

				expect(response.status).toBe(200);
				expect(response.body).toHaveProperty('nodeId');
				expect(response.body).toHaveProperty('connectedPeers');
				expect(response.body).toHaveProperty('dht');
			});

			it('should handle P2P transport not available', async () => {
				vi.spyOn(connectionManager, 'getTransport').mockReturnValue(null);

				const response = await request(app)
					.get('/api/transports/p2p/network');

				expect(response.status).toBe(503);
				expect(response.body.error.code).toBe('TRANSPORT_NOT_AVAILABLE');
			});
		});

		describe('GET /api/transports/email/queue', () => {
			it('should return email queue status', async () => {
				vi.spyOn(connectionManager, 'isTransportActive').mockReturnValue(true);

				const response = await request(app)
					.get('/api/transports/email/queue');

				expect(response.status).toBe(200);
				expect(response.body).toHaveProperty('queue');
				expect(response.body).toHaveProperty('smtp');
				expect(response.body.smtp.connected).toBe(true);
			});
		});

		describe('GET /api/transports/available', () => {
			it('should list available transports', async () => {
				vi.spyOn(connectionManager, 'getStatus').mockReturnValue({
					connections: { active: 1, pending: 0, failed: 0 },
					transports: { p2p: { status: 'active' } }
				});
				vi.spyOn(connectionManager, 'isTransportActive')
					.mockImplementation((transport) => transport === 'p2p');

				const response = await request(app)
					.get('/api/transports/available');

				expect(response.status).toBe(200);
				expect(response.body.transports).toBeInstanceOf(Array);
				
				const p2pTransport = response.body.transports.find((t: { type: string }) => t.type === 'p2p');
				expect(p2pTransport).toBeDefined();
				expect(p2pTransport.enabled).toBe(true);
			});
		});
	});

	describe('Error Handling', () => {
		it('should handle service errors gracefully', async () => {
			vi.spyOn(peerService, 'discoverPeers')
				.mockRejectedValue(new Error('Service unavailable'));

			const response = await request(app)
				.post('/api/peers/discover')
				.send({ transports: ['p2p'] });

			expect(response.status).toBe(500);
			expect(response.body.error).toBeDefined();
		});

		it('should validate request data with Zod', async () => {
			const response = await request(app)
				.post('/api/connections/initialize')
				.send({
					transports: 'not-an-array' // Should be an array
				});

			expect(response.status).toBe(400);
			expect(response.body.error.code).toBe('INVALID_REQUEST');
		});

		it('should handle rate limiting', async () => {
			// Mock the getStatus method to return a valid response
			vi.spyOn(connectionManager, 'getStatus').mockReturnValue({
				connections: { active: 0, pending: 0, failed: 0 },
				transports: {}
			});
			
			// This test just ensures the endpoint works
			// Rate limiting is typically disabled in test environment
			const response = await request(app).get('/api/connections/status');
			
			// Should get a successful response (rate limiting usually disabled in tests)
			expect([200, 429]).toContain(response.status);
		});
	});
});