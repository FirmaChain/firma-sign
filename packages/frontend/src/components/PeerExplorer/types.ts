export interface EnhancedPeer {
	peerId: string; // Unique peer identifier
	displayName: string; // User-friendly name
	avatar?: string; // Profile image (base64 or URL)
	identifiers: {
		p2p?: string; // libp2p peer ID
		email?: string; // Email address
		discord?: string; // Discord username
		telegram?: string; // Telegram username
	};
	transports: {
		[transportType: string]: {
			status: 'connected' | 'available' | 'offline' | 'error';
			addresses?: string[]; // Multi-addresses for P2P
			latency?: number; // Connection latency in ms
			bandwidth?: { in: number; out: number };
			verified?: boolean; // Transport verification status
			lastSeen?: Date;
		};
	};
	availableTransports: string[]; // Active transport types
	status: 'online' | 'partial' | 'offline'; // Overall status
	trustLevel: 'unverified' | 'email_verified' | 'identity_verified' | 'trusted';
	publicKey?: string; // For encryption
	transferHistory: {
		sent: number;
		received: number;
		lastTransfer?: Date;
		totalBytes: number;
	};
	capabilities: {
		maxFileSize: number;
		supportsEncryption: boolean;
		supportsMessaging: boolean;
		supportedTransports: string[];
	};
	metadata: {
		organization?: string;
		department?: string;
		timezone?: string;
	};
}

export interface PeerGroup {
	groupId: string;
	name: string;
	description?: string;
	members: Array<{
		peerId: string;
		role: 'admin' | 'member';
		joinedAt: Date;
	}>;
	settings: {
		allowMemberInvites: boolean;
		requireEncryption: boolean;
		defaultTransport: string;
	};
	createdAt: Date;
	lastActivity: Date;
}

export interface Message {
	messageId: string;
	peerId: string;
	type: 'text' | 'file' | 'transfer_notification';
	content: string;
	direction: 'incoming' | 'outgoing';
	transport: string;
	timestamp: Date;
	status: 'pending' | 'sent' | 'delivered' | 'read';
	attachments?: Array<{
		type: 'transfer_reference' | 'file';
		transferId?: string;
		fileName?: string;
		data?: string;
	}>;
	encrypted: boolean;
}

export interface Transfer {
	transferId: string;
	type: 'outgoing' | 'incoming';
	peerId: string;
	groupId?: string; // For group transfers
	documentCount: number;
	transport: string;
	fallbackTransports?: string[];
	status: 'pending' | 'active' | 'completed' | 'failed' | 'cancelled';
	progress: number; // 0-100
	deliveryStatus: {
		sent?: Date;
		delivered?: Date;
		read?: Date;
		signed?: Date;
	};
	options: {
		encrypted: boolean;
		requireSignature: boolean;
		deadline?: Date;
		message?: string;
	};
	createdAt: Date;
	completedAt?: Date;
	error?: string;
}

export interface TransportStatus {
	type: string;
	status: 'active' | 'inactive' | 'error' | 'connecting';
	connections: number;
	config: Record<string, unknown>;
	metrics?: {
		latency?: number;
		bandwidth?: { in: number; out: number };
		queue?: { pending: number; processing: number; failed: number };
		uptime?: number;
	};
	error?: string;
}

export interface PeerExplorerState {
	transports: {
		initialized: boolean;
		available: TransportStatus[];
		selected: string[]; // Active transport types
	};
	networkStatus: 'disconnected' | 'connecting' | 'connected' | 'partial';
	peers: {
		connected: EnhancedPeer[];
		discovered: EnhancedPeer[];
		recent: EnhancedPeer[];
		blocked: string[]; // Peer IDs
		favorites: string[]; // Peer IDs
	};
	groups: PeerGroup[];
	transfers: {
		active: Transfer[];
		history: Transfer[];
	};
	messages: {
		[peerId: string]: Message[];
	};
	searchQuery: string;
	filters: {
		status: 'all' | 'connected' | 'discovered' | 'offline' | 'verified';
		transports: string[]; // Filter by transport availability
		trustLevel: 'all' | 'verified' | 'trusted';
		groups: string[]; // Filter by group membership
	};
	sortBy: 'quality' | 'activity' | 'trust' | 'transfers' | 'name';
	selectedPeers: string[];
	selectedGroups: string[];
}

// WebSocket Events
export interface WebSocketEvent {
	type: string;
	[key: string]: unknown;
}

export interface PeerStatusEvent extends WebSocketEvent {
	type: 'peer:status';
	peerId: string;
	status: 'online' | 'partial' | 'offline';
	transport: string;
	timestamp: number;
}

export interface PeerDiscoveredEvent extends WebSocketEvent {
	type: 'peer:discovered';
	peer: EnhancedPeer;
}

export interface MessageReceivedEvent extends WebSocketEvent {
	type: 'message:received';
	message: Message;
}

export interface TransferReceivedEvent extends WebSocketEvent {
	type: 'transfer:received';
	transfer: Transfer;
}

export interface TransportStatusEvent extends WebSocketEvent {
	type: 'transport:status';
	transport: string;
	status: 'active' | 'inactive' | 'error' | 'connecting';
	details?: Record<string, unknown>;
}

// API Types
export interface TransportConfig {
	transports: string[];
	config: {
		[transportType: string]: Record<string, unknown>;
	};
}

export interface DiscoveryFilters {
	transports?: string[];
	query?: string;
	filters?: {
		online?: boolean;
		verified?: boolean;
	};
}

export interface ConnectionOptions {
	transport: string;
	fallbackTransports?: string[];
	options?: {
		encrypted?: boolean;
		priority?: 'high' | 'normal' | 'low';
	};
}

export interface TransferData {
	documents: Array<{
		id: string;
		fileName: string;
		fileData: string;
		components?: unknown[];
	}>;
	transport?: string;
	options?: {
		encrypted?: boolean;
		requireSignature?: boolean;
		deadline?: string;
		message?: string;
	};
	fallbackTransports?: string[];
}

export interface MessageData {
	content: string;
	type?: 'text' | 'file' | 'transfer_notification';
	transport?: string;
	attachments?: Array<{
		type: 'transfer_reference' | 'file';
		transferId?: string;
		data?: string;
	}>;
	encrypted?: boolean;
}

// Constants
export const TRANSPORT_TYPES = {
	P2P: 'p2p',
	EMAIL: 'email',
	DISCORD: 'discord',
	TELEGRAM: 'telegram',
} as const;

export const TRUST_LEVELS = {
	UNVERIFIED: 'unverified',
	EMAIL_VERIFIED: 'email_verified',
	IDENTITY_VERIFIED: 'identity_verified',
	TRUSTED: 'trusted',
} as const;

export const PEER_STATUS = {
	ONLINE: 'online',
	PARTIAL: 'partial',
	OFFLINE: 'offline',
} as const;

export const TRANSPORT_STATUS = {
	ACTIVE: 'active',
	INACTIVE: 'inactive',
	ERROR: 'error',
	CONNECTING: 'connecting',
} as const;