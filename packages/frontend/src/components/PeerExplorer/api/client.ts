import {
	TransportConfig,
	DiscoveryFilters,
	ConnectionOptions,
	TransferData,
	MessageData,
	EnhancedPeer,
	TransportStatus,
	Transfer,
	Message,
} from '../types';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api';

class APIError extends Error {
	constructor(
		message: string,
		public status: number,
		public code?: string,
	) {
		super(message);
		this.name = 'APIError';
	}
}

async function fetchAPI<T = unknown>(endpoint: string, options: RequestInit = {}): Promise<T> {
	const url = `${API_BASE_URL}${endpoint}`;
	const response = await fetch(url, {
		headers: {
			'Content-Type': 'application/json',
			...options.headers,
		},
		...options,
	});

	if (!response.ok) {
		const errorData = await response.json().catch(() => ({})) as { error?: { message?: string; code?: string } };
		throw new APIError(
			errorData.error?.message || `HTTP ${response.status}`,
			response.status,
			errorData.error?.code,
		);
	}

	return response.json() as Promise<T>;
}

export class PeerExplorerApiClient {
	// Connection Management
	async initializeTransports(config: TransportConfig) {
		return fetchAPI<{
			initialized: boolean;
			transports: Record<string, { status: string; [key: string]: unknown }>;
		}>('/connections/initialize', {
			method: 'POST',
			body: JSON.stringify(config),
		});
	}

	async getConnectionStatus() {
		return fetchAPI<{
			connections: { active: number; pending: number; failed: number };
			transports: Record<string, TransportStatus>;
		}>('/connections/status');
	}

	// Peer Discovery & Management
	async discoverPeers(filters: DiscoveryFilters) {
		return fetchAPI<{
			peers: EnhancedPeer[];
			total: number;
			discovered: number;
		}>('/peers/discover', {
			method: 'POST',
			body: JSON.stringify(filters),
		});
	}

	async getPeerDetails(peerId: string) {
		return fetchAPI<EnhancedPeer>(`/peers/${peerId}`);
	}

	async connectToPeer(peerId: string, options: ConnectionOptions) {
		return fetchAPI<{
			connected: boolean;
			connectionId: string;
			transport: string;
			latency: number;
			encrypted: boolean;
			sessionToken: string;
		}>(`/peers/${peerId}/connect`, {
			method: 'POST',
			body: JSON.stringify(options),
		});
	}

	async disconnectFromPeer(peerId: string) {
		return fetchAPI<{
			disconnected: boolean;
			peerId: string;
		}>(`/peers/${peerId}/disconnect`, {
			method: 'POST',
		});
	}

	// Document Transfers
	async sendDocumentToPeer(peerId: string, transfer: TransferData) {
		return fetchAPI<{
			transferId: string;
			status: string;
			transport: string;
			deliveryStatus: {
				sent?: number;
				delivered?: number;
				read?: number;
				signed?: number;
			};
			trackingUrl: string;
		}>(`/peers/${peerId}/transfers`, {
			method: 'POST',
			body: JSON.stringify(transfer),
		});
	}

	async getPeerTransfers(
		peerId: string,
		options: {
			type?: 'sent' | 'received' | 'all';
			status?: string;
			limit?: number;
			offset?: number;
		} = {},
	) {
		const params = new URLSearchParams();
		Object.entries(options).forEach(([key, value]) => {
			if (value !== undefined) {
				params.append(key, value.toString());
			}
		});

		return fetchAPI<{
			transfers: Transfer[];
			total: number;
		}>(`/peers/${peerId}/transfers?${params}`);
	}

	// Messaging
	async sendMessage(peerId: string, message: MessageData) {
		return fetchAPI<{
			messageId: string;
			status: string;
			transport: string;
			timestamp: number;
			deliveryStatus: {
				sent?: number;
				delivered?: number;
				read?: number;
			};
		}>(`/peers/${peerId}/messages`, {
			method: 'POST',
			body: JSON.stringify(message),
		});
	}

	async getMessageHistory(
		peerId: string,
		options: {
			before?: string;
			after?: string;
			limit?: number;
		} = {},
	) {
		const params = new URLSearchParams();
		Object.entries(options).forEach(([key, value]) => {
			if (value !== undefined) {
				params.append(key, value.toString());
			}
		});

		return fetchAPI<{
			messages: Message[];
			hasMore: boolean;
		}>(`/peers/${peerId}/messages?${params}`);
	}

	async markMessagesAsRead(
		peerId: string,
		options: {
			messageIds?: string[];
			readAll?: boolean;
		},
	) {
		return fetchAPI<{
			updated: number;
			lastReadTimestamp: number;
		}>(`/peers/${peerId}/messages/read`, {
			method: 'POST',
			body: JSON.stringify(options),
		});
	}

	// Group Management
	async createGroup(group: {
		name: string;
		description?: string;
		members: Array<{
			peerId: string;
			role: 'admin' | 'member';
		}>;
		settings: {
			allowMemberInvites: boolean;
			requireEncryption: boolean;
			defaultTransport: string;
		};
	}) {
		return fetchAPI<{
			groupId: string;
			name: string;
			members: number;
			created: number;
		}>('/groups', {
			method: 'POST',
			body: JSON.stringify(group),
		});
	}

	async sendToGroup(
		groupId: string,
		data: {
			type: 'document' | 'message';
			documents?: unknown[];
			message?: string;
			transport?: string;
			excludeMembers?: string[];
		},
	) {
		return fetchAPI<{
			sent: boolean;
			recipients: Array<{
				peerId: string;
				status: string;
				transport: string;
			}>;
		}>(`/groups/${groupId}/send`, {
			method: 'POST',
			body: JSON.stringify(data),
		});
	}

	// Transport-Specific Operations
	async getP2PNetworkStatus() {
		return fetchAPI<{
			nodeId: string;
			addresses: string[];
			connectedPeers: number;
			discoveredPeers: number;
			dht: {
				enabled: boolean;
				providers: number;
				records: number;
			};
			bandwidth: {
				totalIn: number;
				totalOut: number;
				rateIn: number;
				rateOut: number;
			};
			protocols: string[];
		}>('/transports/p2p/network');
	}

	async getEmailQueueStatus() {
		return fetchAPI<{
			queue: {
				pending: number;
				processing: number;
				failed: number;
				completed: number;
			};
			smtp: {
				connected: boolean;
				host: string;
				lastError?: string;
			};
			limits: {
				dailyLimit: number;
				used: number;
				resetTime: number;
			};
		}>('/transports/email/queue');
	}
}

export { APIError };