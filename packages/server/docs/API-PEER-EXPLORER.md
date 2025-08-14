# Peer Explorer API Reference

## Overview

This document defines the server API endpoints and WebSocket events required to support the Peer Explorer feature in the Firma-Sign frontend. These APIs enable P2P network management, peer discovery, and direct document transfers between peers.

## Base URL

```
http://localhost:8080/api
```

## P2P Network Management

### Initialize P2P Node

Start or restart the P2P node with configuration.

```http
POST /api/p2p/initialize
```

#### Request Body

```json
{
	"port": 9090,
	"enableDHT": true,
	"enableMDNS": true,
	"bootstrapNodes": [
		"/ip4/104.131.131.82/tcp/4001/p2p/QmaCpDMGvV2BGHeYERUEnRQAwe3N8SzbUtfsmvsqQLuvuJ"
	],
	"maxConnections": 50,
	"autoConnect": true
}
```

#### Response

```json
{
	"success": true,
	"peerId": "12D3KooWEyoppNCUx8Yx66oV9fJnriXwCcXwDDUA2kj6vnc6iDEp",
	"addresses": [
		"/ip4/192.168.1.100/tcp/9090/p2p/12D3KooWEyoppNCUx8Yx66oV9fJnriXwCcXwDDUA2kj6vnc6iDEp",
		"/ip4/127.0.0.1/tcp/9090/p2p/12D3KooWEyoppNCUx8Yx66oV9fJnriXwCcXwDDUA2kj6vnc6iDEp"
	],
	"protocols": ["/firma-sign/1.0.0", "/firma-sign/transfer/1.0.0"]
}
```

### Get Network Status

Get current P2P network status and statistics.

```http
GET /api/p2p/status
```

#### Response

```json
{
	"status": "connected",
	"peerId": "12D3KooWEyoppNCUx8Yx66oV9fJnriXwCcXwDDUA2kj6vnc6iDEp",
	"addresses": [
		"/ip4/192.168.1.100/tcp/9090/p2p/12D3KooWEyoppNCUx8Yx66oV9fJnriXwCcXwDDUA2kj6vnc6iDEp"
	],
	"connections": {
		"total": 15,
		"inbound": 8,
		"outbound": 7
	},
	"bandwidth": {
		"totalIn": 1048576,
		"totalOut": 524288,
		"rateIn": 1024,
		"rateOut": 512
	},
	"dht": {
		"enabled": true,
		"mode": "server",
		"routingTableSize": 25
	},
	"uptime": 3600,
	"startedAt": "2024-01-15T10:00:00Z"
}
```

### Shutdown P2P Node

Gracefully shutdown the P2P node.

```http
POST /api/p2p/shutdown
```

#### Response

```json
{
	"success": true,
	"message": "P2P node shutdown successfully"
}
```

## Peer Management

### List Peers

Get list of all known peers categorized by status.

```http
GET /api/p2p/peers
```

#### Query Parameters

- `status` (optional): Filter by status (`connected`, `discovered`, `recent`, `all`)
- `limit` (optional): Number of results per category (default: 50)
- `search` (optional): Search peers by ID or metadata

#### Response

```json
{
	"connected": [
		{
			"id": "12D3KooWBHvsEKBET6FhjnZF6x9pBCijvLW3eUsobCnnjKeb3pKk",
			"addresses": [
				"/ip4/192.168.1.101/tcp/9090/p2p/12D3KooWBHvsEKBET6FhjnZF6x9pBCijvLW3eUsobCnnjKeb3pKk"
			],
			"protocols": ["/firma-sign/1.0.0"],
			"connectedAt": "2024-01-15T10:15:00Z",
			"latency": 45,
			"tags": ["bootstrap", "relay"],
			"metadata": {
				"agent": "firma-sign/1.0.0",
				"platform": "linux",
				"version": "1.0.0"
			},
			"stats": {
				"transfersSent": 5,
				"transfersReceived": 3,
				"bytesTransferred": 10485760
			}
		}
	],
	"discovered": [
		{
			"id": "12D3KooWQvwRz7NkBfFtKmFmqzGXCsYBRYTDNmBdK3bVKkP8KLVq",
			"addresses": [
				"/ip4/192.168.1.102/tcp/9090/p2p/12D3KooWQvwRz7NkBfFtKmFmqzGXCsYBRYTDNmBdK3bVKkP8KLVq"
			],
			"discoveredAt": "2024-01-15T10:20:00Z",
			"discoveryMethod": "mdns"
		}
	],
	"recent": [
		{
			"id": "12D3KooWF7pZqFdkQZtJxHYSV5xzNKPaExydjCNfLkP7cLt5BF8X",
			"lastSeen": "2024-01-15T09:45:00Z",
			"disconnectedAt": "2024-01-15T09:50:00Z",
			"disconnectReason": "timeout"
		}
	],
	"total": {
		"connected": 15,
		"discovered": 8,
		"recent": 25
	}
}
```

### Get Peer Details

Get detailed information about a specific peer.

```http
GET /api/p2p/peers/:peerId
```

#### Response

```json
{
	"id": "12D3KooWBHvsEKBET6FhjnZF6x9pBCijvLW3eUsobCnnjKeb3pKk",
	"status": "connected",
	"addresses": ["/ip4/192.168.1.101/tcp/9090", "/ip4/192.168.1.101/tcp/9091/ws"],
	"protocols": [
		"/firma-sign/1.0.0",
		"/firma-sign/transfer/1.0.0",
		"/libp2p/circuit/relay/0.2.0/hop"
	],
	"connection": {
		"direction": "outbound",
		"latency": 45,
		"streams": 3,
		"connectedAt": "2024-01-15T10:15:00Z",
		"multiplexer": "yamux",
		"encryption": "noise"
	},
	"metadata": {
		"agent": "firma-sign/1.0.0",
		"platform": "linux",
		"version": "1.0.0",
		"publicKey": "-----BEGIN PUBLIC KEY-----..."
	},
	"stats": {
		"messagesReceived": 150,
		"messagesSent": 145,
		"bytesReceived": 5242880,
		"bytesSent": 4194304,
		"transfersCompleted": 8,
		"transfersFailed": 1,
		"averageLatency": 48,
		"connectionUptime": 3600
	},
	"transferHistory": [
		{
			"transferId": "transfer-abc123",
			"direction": "sent",
			"documentName": "contract.pdf",
			"size": 1048576,
			"timestamp": "2024-01-15T10:30:00Z",
			"status": "completed"
		}
	]
}
```

### Connect to Peer

Manually connect to a peer by ID or multiaddress.

```http
POST /api/p2p/peers/connect
```

#### Request Body

```json
{
	"peerId": "12D3KooWBHvsEKBET6FhjnZF6x9pBCijvLW3eUsobCnnjKeb3pKk",
	"addresses": ["/ip4/192.168.1.101/tcp/9090"]
}
```

#### Response

```json
{
	"success": true,
	"peerId": "12D3KooWBHvsEKBET6FhjnZF6x9pBCijvLW3eUsobCnnjKeb3pKk",
	"connection": {
		"latency": 45,
		"streams": 1,
		"direction": "outbound"
	}
}
```

### Disconnect from Peer

Disconnect from a specific peer.

```http
POST /api/p2p/peers/:peerId/disconnect
```

#### Response

```json
{
	"success": true,
	"message": "Disconnected from peer"
}
```

### Block/Unblock Peer

Block or unblock a peer.

```http
POST /api/p2p/peers/:peerId/block
POST /api/p2p/peers/:peerId/unblock
```

#### Response

```json
{
	"success": true,
	"peerId": "12D3KooWBHvsEKBET6FhjnZF6x9pBCijvLW3eUsobCnnjKeb3pKk",
	"status": "blocked" // or "unblocked"
}
```

## P2P Document Transfers

### Send Document to Peer

Send a document directly to a connected peer.

```http
POST /api/p2p/transfers/send
```

#### Request Body

```json
{
	"peerId": "12D3KooWBHvsEKBET6FhjnZF6x9pBCijvLW3eUsobCnnjKeb3pKk",
	"documents": [
		{
			"id": "doc-1",
			"fileName": "contract.pdf",
			"fileData": "base64-encoded-data",
			"fileSize": 1048576,
			"mimeType": "application/pdf",
			"hash": "sha256:abc123..."
		}
	],
	"metadata": {
		"message": "Please review this contract",
		"requireSignature": true,
		"deadline": "2024-12-31T23:59:59Z"
	}
}
```

#### Response

```json
{
	"success": true,
	"transferId": "transfer-xyz789",
	"peerId": "12D3KooWBHvsEKBET6FhjnZF6x9pBCijvLW3eUsobCnnjKeb3pKk",
	"status": "initiated",
	"estimatedTime": 10
}
```

### Get P2P Transfer Status

Get status of a P2P transfer.

```http
GET /api/p2p/transfers/:transferId
```

#### Response

```json
{
	"transferId": "transfer-xyz789",
	"type": "outgoing",
	"peerId": "12D3KooWBHvsEKBET6FhjnZF6x9pBCijvLW3eUsobCnnjKeb3pKk",
	"status": "in_progress",
	"progress": 65,
	"documents": [
		{
			"id": "doc-1",
			"fileName": "contract.pdf",
			"size": 1048576,
			"transferred": 681574,
			"status": "transferring"
		}
	],
	"startedAt": "2024-01-15T10:45:00Z",
	"estimatedCompletion": "2024-01-15T10:45:10Z",
	"speed": 104857,
	"error": null
}
```

### List P2P Transfers

List all P2P transfers.

```http
GET /api/p2p/transfers
```

#### Query Parameters

- `type` (optional): Filter by type (`incoming`, `outgoing`, `all`)
- `status` (optional): Filter by status (`active`, `completed`, `failed`)
- `peerId` (optional): Filter by peer ID
- `limit` (optional): Number of results (default: 50)
- `offset` (optional): Pagination offset

#### Response

```json
{
	"active": [
		{
			"transferId": "transfer-xyz789",
			"type": "outgoing",
			"peerId": "12D3KooWBHvsEKBET6FhjnZF6x9pBCijvLW3eUsobCnnjKeb3pKk",
			"documentName": "contract.pdf",
			"size": 1048576,
			"progress": 65,
			"speed": 104857,
			"status": "transferring",
			"startedAt": "2024-01-15T10:45:00Z"
		}
	],
	"completed": [
		{
			"transferId": "transfer-abc123",
			"type": "incoming",
			"peerId": "12D3KooWF7pZqFdkQZtJxHYSV5xzNKPaExydjCNfLkP7cLt5BF8X",
			"documentName": "report.pdf",
			"size": 524288,
			"status": "completed",
			"completedAt": "2024-01-15T10:30:00Z",
			"duration": 5
		}
	],
	"failed": [
		{
			"transferId": "transfer-def456",
			"type": "outgoing",
			"peerId": "12D3KooWQvwRz7NkBfFtKmFmqzGXCsYBRYTDNmBdK3bVKkP8KLVq",
			"documentName": "presentation.pdf",
			"size": 2097152,
			"status": "failed",
			"failedAt": "2024-01-15T09:50:00Z",
			"error": "Connection timeout"
		}
	],
	"pagination": {
		"total": 45,
		"limit": 50,
		"offset": 0,
		"hasMore": false
	}
}
```

### Cancel P2P Transfer

Cancel an active P2P transfer.

```http
POST /api/p2p/transfers/:transferId/cancel
```

#### Response

```json
{
	"success": true,
	"transferId": "transfer-xyz789",
	"status": "cancelled"
}
```

### Retry Failed Transfer

Retry a failed P2P transfer.

```http
POST /api/p2p/transfers/:transferId/retry
```

#### Response

```json
{
	"success": true,
	"transferId": "transfer-def456",
	"newTransferId": "transfer-ghi789",
	"status": "initiated"
}
```

## Peer Discovery

### Discover Peers

Trigger manual peer discovery.

```http
POST /api/p2p/discovery/scan
```

#### Request Body

```json
{
	"methods": ["dht", "mdns"],
	"timeout": 10000
}
```

#### Response

```json
{
	"success": true,
	"discovered": 5,
	"peers": [
		{
			"id": "12D3KooWQvwRz7NkBfFtKmFmqzGXCsYBRYTDNmBdK3bVKkP8KLVq",
			"addresses": ["/ip4/192.168.1.102/tcp/9090"],
			"discoveryMethod": "mdns"
		}
	]
}
```

### Get Bootstrap Nodes

Get list of bootstrap nodes.

```http
GET /api/p2p/discovery/bootstrap
```

#### Response

```json
{
	"nodes": [
		{
			"id": "QmaCpDMGvV2BGHeYERUEnRQAwe3N8SzbUtfsmvsqQLuvuJ",
			"address": "/ip4/104.131.131.82/tcp/4001",
			"status": "connected",
			"latency": 120
		}
	]
}
```

### Add Bootstrap Node

Add a new bootstrap node.

```http
POST /api/p2p/discovery/bootstrap
```

#### Request Body

```json
{
	"address": "/ip4/104.131.131.82/tcp/4001/p2p/QmaCpDMGvV2BGHeYERUEnRQAwe3N8SzbUtfsmvsqQLuvuJ"
}
```

#### Response

```json
{
	"success": true,
	"nodeId": "QmaCpDMGvV2BGHeYERUEnRQAwe3N8SzbUtfsmvsqQLuvuJ",
	"status": "added"
}
```

## Network Metrics

### Get Network Metrics

Get detailed network performance metrics.

```http
GET /api/p2p/metrics
```

#### Response

```json
{
	"bandwidth": {
		"totalIn": 10485760,
		"totalOut": 8388608,
		"rateIn": 10240,
		"rateOut": 8192,
		"peakIn": 51200,
		"peakOut": 40960
	},
	"connections": {
		"total": 15,
		"inbound": 8,
		"outbound": 7,
		"pending": 2,
		"averageLatency": 65,
		"medianLatency": 50
	},
	"transfers": {
		"active": 2,
		"completed": 45,
		"failed": 3,
		"totalBytes": 104857600,
		"successRate": 93.75
	},
	"peers": {
		"connected": 15,
		"discovered": 8,
		"blocked": 2,
		"turnover": 0.2
	},
	"uptime": 3600,
	"messagesPerSecond": 12.5,
	"protocolStats": {
		"/firma-sign/transfer/1.0.0": {
			"requests": 150,
			"responses": 148,
			"errors": 2
		}
	}
}
```

### Get Peer Connection Quality

Get connection quality metrics for a specific peer.

```http
GET /api/p2p/peers/:peerId/quality
```

#### Response

```json
{
	"peerId": "12D3KooWBHvsEKBET6FhjnZF6x9pBCijvLW3eUsobCnnjKeb3pKk",
	"quality": "excellent",
	"metrics": {
		"latency": {
			"current": 45,
			"average": 48,
			"min": 35,
			"max": 120,
			"jitter": 5
		},
		"packetLoss": 0.01,
		"bandwidth": {
			"upload": 512000,
			"download": 1024000
		},
		"reliability": 0.99,
		"uptime": 3600,
		"lastError": null
	},
	"score": 95
}
```

## WebSocket Events

Connect to WebSocket for real-time P2P updates:

```javascript
const ws = new WebSocket('ws://localhost:8080/p2p');
```

### Client → Server Events

#### Subscribe to P2P Events

```json
{
	"type": "subscribe",
	"events": ["peer:discovery", "peer:connect", "transfer:progress"]
}
```

#### Request Peer List Update

```json
{
	"type": "peers:refresh"
}
```

### Server → Client Events

#### Peer Discovered

```json
{
	"type": "peer:discovery",
	"peer": {
		"id": "12D3KooWQvwRz7NkBfFtKmFmqzGXCsYBRYTDNmBdK3bVKkP8KLVq",
		"addresses": ["/ip4/192.168.1.102/tcp/9090"],
		"discoveryMethod": "mdns",
		"timestamp": "2024-01-15T10:20:00Z"
	}
}
```

#### Peer Connected

```json
{
	"type": "peer:connect",
	"peer": {
		"id": "12D3KooWBHvsEKBET6FhjnZF6x9pBCijvLW3eUsobCnnjKeb3pKk",
		"direction": "inbound",
		"latency": 45,
		"timestamp": "2024-01-15T10:15:00Z"
	}
}
```

#### Peer Disconnected

```json
{
	"type": "peer:disconnect",
	"peer": {
		"id": "12D3KooWF7pZqFdkQZtJxHYSV5xzNKPaExydjCNfLkP7cLt5BF8X",
		"reason": "timeout",
		"timestamp": "2024-01-15T09:50:00Z"
	}
}
```

#### Transfer Progress

```json
{
	"type": "transfer:progress",
	"transferId": "transfer-xyz789",
	"peerId": "12D3KooWBHvsEKBET6FhjnZF6x9pBCijvLW3eUsobCnnjKeb3pKk",
	"progress": 75,
	"speed": 104857,
	"remainingTime": 3,
	"timestamp": "2024-01-15T10:45:05Z"
}
```

#### Transfer Completed

```json
{
	"type": "transfer:complete",
	"transferId": "transfer-xyz789",
	"peerId": "12D3KooWBHvsEKBET6FhjnZF6x9pBCijvLW3eUsobCnnjKeb3pKk",
	"duration": 10,
	"size": 1048576,
	"timestamp": "2024-01-15T10:45:10Z"
}
```

#### Transfer Failed

```json
{
	"type": "transfer:failed",
	"transferId": "transfer-def456",
	"peerId": "12D3KooWQvwRz7NkBfFtKmFmqzGXCsYBRYTDNmBdK3bVKkP8KLVq",
	"error": "Connection lost",
	"timestamp": "2024-01-15T09:50:00Z"
}
```

#### Network Status Update

```json
{
	"type": "network:status",
	"status": "connected",
	"connections": 15,
	"bandwidth": {
		"in": 10240,
		"out": 8192
	},
	"timestamp": "2024-01-15T10:45:00Z"
}
```

#### Incoming Transfer Request

```json
{
	"type": "transfer:incoming",
	"transferId": "transfer-incoming-123",
	"peerId": "12D3KooWBHvsEKBET6FhjnZF6x9pBCijvLW3eUsobCnnjKeb3pKk",
	"documents": [
		{
			"fileName": "proposal.pdf",
			"size": 2097152
		}
	],
	"metadata": {
		"message": "Please review this proposal"
	},
	"timestamp": "2024-01-15T11:00:00Z"
}
```

## Error Responses

All error responses follow this format:

```json
{
	"error": {
		"code": "P2P_NOT_INITIALIZED",
		"message": "P2P node is not initialized",
		"details": {
			"suggestion": "Call /api/p2p/initialize first"
		}
	}
}
```

### P2P-Specific Error Codes

- `P2P_NOT_INITIALIZED`: P2P node not initialized
- `P2P_ALREADY_INITIALIZED`: P2P node already running
- `PEER_NOT_FOUND`: Peer not found in network
- `PEER_NOT_CONNECTED`: Peer is not connected
- `PEER_BLOCKED`: Peer is blocked
- `CONNECTION_FAILED`: Failed to connect to peer
- `CONNECTION_TIMEOUT`: Connection timed out
- `TRANSFER_NOT_FOUND`: Transfer not found
- `TRANSFER_FAILED`: Transfer operation failed
- `TRANSFER_CANCELLED`: Transfer was cancelled
- `DISCOVERY_FAILED`: Peer discovery failed
- `INVALID_PEER_ID`: Invalid peer ID format
- `INVALID_MULTIADDR`: Invalid multiaddress format
- `NETWORK_ERROR`: General network error
- `PROTOCOL_ERROR`: Protocol negotiation failed

## Rate Limiting

P2P API endpoints have specific rate limits:

- P2P initialization: 1 request per minute
- Peer operations: 30 requests per minute
- Transfer operations: 60 requests per minute
- Discovery operations: 10 requests per minute
- Metrics endpoints: 120 requests per minute

## Security Considerations

### Peer Authentication

- Each peer has a cryptographic identity
- Peer IDs are derived from public keys
- All connections use encryption (TLS/Noise)

### Transfer Security

- Documents are encrypted during transfer
- Hash verification for integrity
- Optional end-to-end encryption with recipient's public key

### Access Control

- JWT authentication required for API access
- Peer blocking and allowlisting support
- Rate limiting to prevent abuse

## Implementation Notes

### Server Components Required

1. **P2PManager Service**
   - Initialize and manage libp2p node
   - Handle peer connections
   - Manage transfer operations

2. **PeerRepository**
   - Store peer information in database
   - Track peer history and statistics
   - Manage blocked peers list

3. **TransferService**
   - Handle P2P document transfers
   - Track transfer progress
   - Manage transfer queue

4. **WebSocket Handler**
   - Emit real-time P2P events
   - Handle client subscriptions
   - Broadcast network updates

### Database Schema Additions

```sql
-- Peers table
CREATE TABLE peers (
  id TEXT PRIMARY KEY,           -- Peer ID
  nickname TEXT,                  -- User-friendly name
  first_seen INTEGER NOT NULL,   -- Unix timestamp
  last_seen INTEGER NOT NULL,    -- Unix timestamp
  status TEXT NOT NULL,           -- connected/disconnected/blocked
  metadata TEXT,                  -- JSON metadata
  stats TEXT,                     -- JSON statistics
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

-- P2P Transfers table
CREATE TABLE p2p_transfers (
  id TEXT PRIMARY KEY,
  peer_id TEXT NOT NULL,
  type TEXT NOT NULL,             -- incoming/outgoing
  status TEXT NOT NULL,           -- active/completed/failed/cancelled
  document_id TEXT,
  document_name TEXT,
  size INTEGER,
  progress INTEGER,
  started_at INTEGER NOT NULL,
  completed_at INTEGER,
  error TEXT,
  metadata TEXT,                  -- JSON metadata
  FOREIGN KEY (peer_id) REFERENCES peers(id)
);

-- Peer connections table
CREATE TABLE peer_connections (
  id TEXT PRIMARY KEY,
  peer_id TEXT NOT NULL,
  direction TEXT NOT NULL,        -- inbound/outbound
  connected_at INTEGER NOT NULL,
  disconnected_at INTEGER,
  latency INTEGER,
  quality TEXT,                   -- excellent/good/poor
  FOREIGN KEY (peer_id) REFERENCES peers(id)
);
```

---

**Status**: API design complete. Ready for server implementation to support Peer Explorer frontend feature.
