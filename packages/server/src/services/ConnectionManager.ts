import { EventEmitter } from 'events';
import { logger } from '../utils/logger';
import { getDatabase, generateId, now } from '../database';
import { P2PTransport } from '@firmachain/firma-sign-transport-p2p';

export interface TransportConfig {
	p2p?: {
		port?: number;
		enableDHT?: boolean;
		enableMDNS?: boolean;
	};
	email?: {
		smtp: {
			host: string;
			port: number;
			auth: {
				user: string;
				pass: string;
			};
		};
	};
	discord?: {
		botToken: string;
		guildId: string;
	};
}

export interface TransportStatus {
	status: 'active' | 'inactive' | 'error';
	nodeId?: string;
	addresses?: string[];
	address?: string;
	username?: string;
	error?: string;
}

export interface ConnectionStatus {
	connections: {
		active: number;
		pending: number;
		failed: number;
	};
	transports: Record<string, TransportStatus>;
}

interface TransportInstance {
	initialize(config: unknown): Promise<void>;
	getStatus(): unknown;
	send?(data: unknown): Promise<unknown>;
	receive?(handler: unknown): void;
	shutdown?(): Promise<void>;
	disconnect?(peerId: string): Promise<{ success: boolean }>;
	discoverPeers?(): Promise<unknown[]>;
	connect?(peerId: string): Promise<{ success: boolean }>;
}

export class ConnectionManager extends EventEmitter {
	private transports: Map<string, TransportInstance> = new Map();
	private transportStatus: Map<string, TransportStatus> = new Map();
	private db = getDatabase();

	async initialize(transports: string[], config: unknown): Promise<{ initialized: boolean; transports: Record<string, TransportStatus> }> {
		const result: Record<string, TransportStatus> = {};

		for (const transport of transports) {
			try {
				const transportConfig = config as TransportConfig;
				switch (transport) {
					case 'p2p':
						result.p2p = await this.initializeP2P(transportConfig.p2p);
						break;
					case 'email':
						result.email = await this.initializeEmail(transportConfig.email);
						break;
					case 'discord':
						result.discord = await this.initializeDiscord(transportConfig.discord);
						break;
					default:
						logger.warn(`Unknown transport: ${transport}`);
				}
			} catch (error) {
				logger.error(`Failed to initialize ${transport}`, error);
				result[transport] = {
					status: 'error',
					error: error instanceof Error ? error.message : 'Unknown error',
				};
			}
		}

		// Store configuration in database
		this.saveTransportConfigs(transports, config as TransportConfig);

		return {
			initialized: true,
			transports: result,
		};
	}

	private async initializeP2P(config?: TransportConfig['p2p']): Promise<TransportStatus> {
		try {
			const p2pTransport = new P2PTransport();
			await p2pTransport.initialize({
				port: config?.port || 9090,
				enableDHT: config?.enableDHT ?? true,
				enableMDNS: config?.enableMDNS ?? true,
			});

			const status = p2pTransport.getStatus();
			const statusInfo = status as { info?: { peerId?: string; addresses?: string[] } };
			const result: TransportStatus = {
				status: 'active',
				nodeId: statusInfo.info?.peerId,
				addresses: statusInfo.info?.addresses,
			};

			this.transports.set('p2p', p2pTransport);
			this.transportStatus.set('p2p', result);

			logger.info('P2P transport initialized', { nodeId: result.nodeId });
			return result;
		} catch (error) {
			logger.error('Failed to initialize P2P transport', error);
			throw error;
		}
	}

	private initializeEmail(config?: TransportConfig['email']): Promise<TransportStatus> {
		// Email transport implementation would go here
		// For now, we'll simulate it
		if (!config?.smtp) {
			throw new Error('Email SMTP configuration required');
		}

		const result: TransportStatus = {
			status: 'active',
			address: config.smtp.auth.user,
		};

		this.transportStatus.set('email', result);
		logger.info('Email transport initialized', { address: result.address });
		return Promise.resolve(result);
	}

	private initializeDiscord(config?: TransportConfig['discord']): Promise<TransportStatus> {
		// Discord transport implementation would go here
		// For now, we'll simulate it
		if (!config?.botToken) {
			throw new Error('Discord bot token required');
		}

		const result: TransportStatus = {
			status: 'active',
			username: 'FirmaSign#1234', // This would come from Discord API
		};

		this.transportStatus.set('discord', result);
		logger.info('Discord transport initialized', { username: result.username });
		return Promise.resolve(result);
	}

	getStatus(): ConnectionStatus {
		const db = getDatabase();
		
		// Get connection counts
		const activeCount = db
			.prepare('SELECT COUNT(*) as count FROM peer_connections WHERE status = ?')
			.get('connected') as { count: number };
		
		const pendingCount = db
			.prepare('SELECT COUNT(*) as count FROM peer_connections WHERE status = ?')
			.get('connecting') as { count: number };
		
		const failedCount = db
			.prepare('SELECT COUNT(*) as count FROM peer_connections WHERE status = ?')
			.get('failed') as { count: number };

		// Build transport status
		const transports: Record<string, TransportStatus> = {};
		
		for (const [name, status] of this.transportStatus) {
			if (name === 'p2p' && this.transports.has('p2p')) {
				const p2p = this.transports.get('p2p');
				if (p2p?.getStatus) {
					const p2pStatus = p2p.getStatus() as { connections?: number };
					transports.p2p = {
						status: status.status,
						connections: p2pStatus.connections || 0,
						bandwidth: {
							in: 1024000, // These would come from actual metrics
							out: 512000,
						},
					} as unknown as TransportStatus;
				}
			} else if (name === 'email') {
				transports.email = {
					status: status.status,
					connections: 5, // Simulated
					queue: 2, // Simulated
				} as unknown as TransportStatus;
			} else if (name === 'discord') {
				transports.discord = {
					status: status.status,
					error: status.error,
				} as TransportStatus;
			}
		}

		return {
			connections: {
				active: activeCount.count,
				pending: pendingCount.count,
				failed: failedCount.count,
			},
			transports,
		};
	}

	private saveTransportConfigs(transports: string[], config: TransportConfig): void {
		const stmt = this.db.prepare(`
			INSERT OR REPLACE INTO transport_configs (id, transport, config, status, initialized_at, created_at, updated_at)
			VALUES (?, ?, ?, ?, ?, ?, ?)
		`);

		for (const transport of transports) {
			const status = this.transportStatus.get(transport);
			stmt.run(
				generateId('tconf'),
				transport,
				JSON.stringify(config[transport as keyof TransportConfig] || {}),
				status?.status || 'inactive',
				status?.status === 'active' ? now() : null,
				now(),
				now()
			);
		}
	}

	async shutdown(): Promise<void> {
		for (const [name, transport] of this.transports) {
			try {
				if (transport.shutdown) {
					await transport.shutdown();
				}
				logger.info(`${name} transport shutdown`);
			} catch (error) {
				logger.error(`Error shutting down ${name} transport`, error);
			}
		}
		
		this.transports.clear();
		this.transportStatus.clear();
	}

	getTransport(name: string): TransportInstance | undefined {
		return this.transports.get(name);
	}

	isTransportActive(name: string): boolean {
		return this.transports.has(name);
	}

	async sendViaTransport(transport: string, data: unknown): Promise<{ success: boolean; transport?: string; transferId?: string }> {
		const transportInstance = this.transports.get(transport);
		if (!transportInstance) {
			throw new Error(`Transport ${transport} not available`);
		}
		
		// This would call the actual transport's send method
		if (transportInstance.send) {
			const result = await transportInstance.send(data);
			return result as { success: boolean; transport?: string; transferId?: string };
		}
		
		// Simulate for now
		return { success: true, transport };
	}

	selectTransportForPeer(_peerId: string): Promise<string> {
		// Logic to select best transport for peer
		// For now, return first active transport
		for (const [name, status] of this.transportStatus) {
			if (status.status === 'active') {
				return Promise.resolve(name);
			}
		}
		
		return Promise.reject(new Error('No active transports available'));
	}

	async initializeTransport(transport: string, config?: unknown): Promise<void> {
		try {
			const typedConfig = config as TransportConfig;
			switch (transport) {
				case 'p2p':
					await this.initializeP2P(typedConfig?.p2p);
					break;
				case 'email':
					await this.initializeEmail(typedConfig?.email);
					break;
				case 'discord':
					await this.initializeDiscord(typedConfig?.discord);
					break;
				default:
					logger.warn(`Unknown transport: ${transport}`);
			}
		} catch (error) {
			logger.error(`Failed to initialize ${transport}`, error);
			throw error;
		}
	}
}