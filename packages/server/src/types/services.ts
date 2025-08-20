// Type definitions for services

export interface DbRow {
	[key: string]: unknown;
}

export interface CountResult {
	count: number;
}

export interface PeerRow {
	id: string;
	display_name: string;
	avatar?: string;
	status: string;
	trust_level: string;
	last_seen: number;
	public_key?: string;
	metadata?: string;
	identifiers_str?: string;
	transports?: string;
}

export interface TransferRow {
	id: string;
	type: string;
	status: string;
	sender_id?: string;
	sender_name?: string;
	sender_email?: string;
	sender_public_key?: string;
	transport_type: string;
	transport_config?: string;
	metadata?: string;
	created_at: number;
	updated_at: number;
}

export interface DocumentRow {
	id: string;
	transfer_id: string;
	file_name: string;
	file_size?: number;
	mime_type?: string;
	hash?: string;
	status: string;
	signed_by?: string;
	signed_at?: number;
	blockchain_tx_original?: string;
	blockchain_tx_signed?: string;
	metadata?: string;
	created_at: number;
	updated_at: number;
}

export interface MessageRow {
	id: string;
	from_peer_id: string;
	to_peer_id: string;
	content?: string;
	type?: string;
	transport?: string;
	direction?: string;
	status: string;
	attachments?: string;
	encrypted?: number;
	sent_at?: number;
	delivered_at?: number;
	read_at?: number;
	created_at: number;
	metadata?: string;
}

export interface GroupRow {
	id: string;
	name: string;
	description?: string;
	owner_peer_id: string;
	settings?: string;
	created_at: number;
	updated_at: number;
}

export interface GroupMemberRow {
	id: string;
	group_id: string;
	peer_id: string;
	role: string;
	joined_at: number;
}

export interface PeerConnectionRow {
	id: string;
	local_peer_id: string;
	remote_peer_id: string;
	transport: string;
	status: string;
	direction: string;
	connected_at?: number;
	disconnected_at?: number;
	metadata?: string;
	created_at: number;
	updated_at: number;
}

export interface TransportConfigRow {
	id: string;
	transport: string;
	config: string;
	status: string;
	initialized_at?: number;
	created_at: number;
	updated_at: number;
}

export interface PeerTransferRow {
	id: string;
	transfer_id: string;
	from_peer_id?: string;
	to_peer_id?: string;
	transport: string;
	document_count: number;
	status: string;
	created_at: number;
	completed_at?: number;
}