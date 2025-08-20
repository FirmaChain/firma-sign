-- Peers table for managing peer information
CREATE TABLE IF NOT EXISTS peers (
    id TEXT PRIMARY KEY,
    display_name TEXT NOT NULL,
    avatar TEXT,
    public_key TEXT,
    trust_level TEXT DEFAULT 'unverified' CHECK(trust_level IN ('unverified', 'email_verified', 'identity_verified', 'trusted')),
    status TEXT DEFAULT 'offline' CHECK(status IN ('online', 'offline', 'away')),
    last_seen INTEGER NOT NULL,
    metadata TEXT, -- JSON
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL
);

-- Peer identifiers for multi-transport support
CREATE TABLE IF NOT EXISTS peer_identifiers (
    id TEXT PRIMARY KEY,
    peer_id TEXT NOT NULL,
    transport TEXT NOT NULL,
    identifier TEXT NOT NULL,
    verified BOOLEAN DEFAULT FALSE,
    created_at INTEGER NOT NULL,
    FOREIGN KEY (peer_id) REFERENCES peers(id) ON DELETE CASCADE,
    UNIQUE(transport, identifier)
);

-- Peer connections tracking
CREATE TABLE IF NOT EXISTS peer_connections (
    id TEXT PRIMARY KEY,
    peer_id TEXT NOT NULL,
    transport TEXT NOT NULL,
    connection_id TEXT,
    status TEXT DEFAULT 'disconnected',
    latency INTEGER,
    bandwidth_in INTEGER,
    bandwidth_out INTEGER,
    connected_at INTEGER,
    disconnected_at INTEGER,
    created_at INTEGER NOT NULL,
    FOREIGN KEY (peer_id) REFERENCES peers(id) ON DELETE CASCADE
);

-- Messages between peers
CREATE TABLE IF NOT EXISTS messages (
    id TEXT PRIMARY KEY,
    from_peer_id TEXT NOT NULL,
    to_peer_id TEXT NOT NULL,
    content TEXT,
    type TEXT DEFAULT 'text' CHECK(type IN ('text', 'file', 'transfer_notification')),
    transport TEXT NOT NULL,
    direction TEXT CHECK(direction IN ('incoming', 'outgoing')),
    status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'sent', 'delivered', 'read', 'failed')),
    attachments TEXT, -- JSON
    encrypted BOOLEAN DEFAULT FALSE,
    sent_at INTEGER NOT NULL,
    delivered_at INTEGER,
    read_at INTEGER,
    created_at INTEGER NOT NULL,
    FOREIGN KEY (from_peer_id) REFERENCES peers(id) ON DELETE CASCADE,
    FOREIGN KEY (to_peer_id) REFERENCES peers(id) ON DELETE CASCADE
);

-- Peer groups for multi-party communication
CREATE TABLE IF NOT EXISTS peer_groups (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    owner_peer_id TEXT NOT NULL,
    settings TEXT, -- JSON
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL,
    FOREIGN KEY (owner_peer_id) REFERENCES peers(id) ON DELETE CASCADE
);

-- Group members
CREATE TABLE IF NOT EXISTS group_members (
    id TEXT PRIMARY KEY,
    group_id TEXT NOT NULL,
    peer_id TEXT NOT NULL,
    role TEXT DEFAULT 'member' CHECK(role IN ('admin', 'member')),
    joined_at INTEGER NOT NULL,
    created_at INTEGER NOT NULL,
    FOREIGN KEY (group_id) REFERENCES peer_groups(id) ON DELETE CASCADE,
    FOREIGN KEY (peer_id) REFERENCES peers(id) ON DELETE CASCADE,
    UNIQUE(group_id, peer_id)
);

-- Transfer history between peers
CREATE TABLE IF NOT EXISTS peer_transfers (
    id TEXT PRIMARY KEY,
    transfer_id TEXT NOT NULL,
    from_peer_id TEXT NOT NULL,
    to_peer_id TEXT NOT NULL,
    transport TEXT NOT NULL,
    document_count INTEGER DEFAULT 0,
    status TEXT DEFAULT 'pending',
    created_at INTEGER NOT NULL,
    completed_at INTEGER,
    FOREIGN KEY (from_peer_id) REFERENCES peers(id) ON DELETE CASCADE,
    FOREIGN KEY (to_peer_id) REFERENCES peers(id) ON DELETE CASCADE
);

-- Transport configurations
CREATE TABLE IF NOT EXISTS transport_configs (
    id TEXT PRIMARY KEY,
    transport TEXT NOT NULL UNIQUE,
    config TEXT NOT NULL, -- JSON
    status TEXT DEFAULT 'inactive',
    initialized_at INTEGER,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_peer_identifiers_peer_id ON peer_identifiers(peer_id);
CREATE INDEX IF NOT EXISTS idx_peer_connections_peer_id ON peer_connections(peer_id);
CREATE INDEX IF NOT EXISTS idx_messages_from_peer ON messages(from_peer_id);
CREATE INDEX IF NOT EXISTS idx_messages_to_peer ON messages(to_peer_id);
CREATE INDEX IF NOT EXISTS idx_messages_status ON messages(status);
CREATE INDEX IF NOT EXISTS idx_group_members_group_id ON group_members(group_id);
CREATE INDEX IF NOT EXISTS idx_group_members_peer_id ON group_members(peer_id);
CREATE INDEX IF NOT EXISTS idx_peer_transfers_from_peer ON peer_transfers(from_peer_id);
CREATE INDEX IF NOT EXISTS idx_peer_transfers_to_peer ON peer_transfers(to_peer_id);