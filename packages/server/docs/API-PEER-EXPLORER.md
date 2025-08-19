# Peer Explorer API

## Overview

The Peer Explorer API provides a unified interface for discovering and connecting with other users across multiple transport protocols (P2P, Email, Discord, Telegram, etc.). It enables document transfers and real-time messaging through various communication channels.

## Core Concepts

### Connection

A connection represents a communication channel with another user, regardless of the underlying transport protocol.

### Peer

A peer is another user in the network who can receive documents and messages.

### Transport

The underlying protocol used for communication (P2P, Email, Discord, etc.).

## Base URL

```
http://localhost:8080/api
```

## WebSocket Endpoint

```
ws://localhost:8080/explorer
```

## REST API Endpoints

### Connection Management

#### Initialize Connection Manager

Initialize the connection manager with selected transports.

```http
POST /api/connections/initialize
```

**Request Body:**

```json
{
	"transports": ["p2p", "email", "discord"],
	"config": {
		"p2p": {
			"port": 9090,
			"enableDHT": true,
			"enableMDNS": true
		},
		"email": {
			"smtp": {
				"host": "smtp.gmail.com",
				"port": 587,
				"auth": {
					"user": "user@example.com",
					"pass": "password"
				}
			}
		},
		"discord": {
			"botToken": "discord-bot-token",
			"guildId": "guild-id"
		}
	}
}
```

**Response:**

```json
{
	"initialized": true,
	"transports": {
		"p2p": {
			"status": "active",
			"nodeId": "12D3KooWEyoppNCUx8Yx66oV9fJnriXwCcXwDDUA2kj6vnc6iDEp",
			"addresses": ["/ip4/192.168.1.100/tcp/9090"]
		},
		"email": {
			"status": "active",
			"address": "user@example.com"
		},
		"discord": {
			"status": "active",
			"username": "FirmaSign#1234"
		}
	}
}
```

#### Get Connection Status

Get the current status of all connections and transports.

```http
GET /api/connections/status
```

**Response:**

```json
{
	"connections": {
		"active": 15,
		"pending": 3,
		"failed": 1
	},
	"transports": {
		"p2p": {
			"status": "active",
			"connections": 10,
			"bandwidth": {
				"in": 1024000,
				"out": 512000
			}
		},
		"email": {
			"status": "active",
			"connections": 5,
			"queue": 2
		},
		"discord": {
			"status": "inactive",
			"error": "Bot token expired"
		}
	}
}
```

### Peer Discovery & Management

#### Discover Peers

Discover available peers across all configured transports.

```http
POST /api/peers/discover
```

**Request Body:**

```json
{
	"transports": ["p2p", "email"], // Optional: specific transports to use
	"query": "alice@example.com", // Optional: search query
	"filters": {
		"online": true,
		"verified": true
	}
}
```

**Response:**

```json
{
	"peers": [
		{
			"peerId": "peer-123",
			"displayName": "Alice Johnson",
			"identifiers": {
				"p2p": "12D3KooWEyoppNCUx8Yx66oV9fJnriXwCcXwDDUA2kj6vnc6iDEp",
				"email": "alice@example.com",
				"discord": "Alice#1234"
			},
			"availableTransports": ["p2p", "email"],
			"status": "online",
			"verified": true,
			"lastSeen": 1234567890000,
			"capabilities": {
				"maxFileSize": 104857600,
				"supportsEncryption": true,
				"supportsMessaging": true
			}
		}
	],
	"total": 25,
	"discovered": 10
}
```

#### List Peers

Get list of all known peers categorized by status.

```http
GET /api/peers/:peerId
```

**Response:**

```json
{
	"peerId": "peer-123",
	"displayName": "Alice Johnson",
	"avatar": "data:image/png;base64,...",
	"identifiers": {
		"p2p": "12D3KooWEyoppNCUx8Yx66oV9fJnriXwCcXwDDUA2kj6vnc6iDEp",
		"email": "alice@example.com",
		"discord": "Alice#1234",
		"telegram": "@alice_johnson"
	},
	"transports": {
		"p2p": {
			"status": "connected",
			"addresses": ["/ip4/192.168.1.100/tcp/9090"],
			"latency": 15,
			"bandwidth": {
				"in": 1024000,
				"out": 512000
			}
		},
		"email": {
			"status": "available",
			"verified": true
		}
	},
	"publicKey": "-----BEGIN PUBLIC KEY-----...",
	"transferHistory": {
		"sent": 15,
		"received": 8,
		"lastTransfer": 1234567890000
	},
	"trustLevel": "verified",
	"metadata": {
		"organization": "FirmaChain",
		"department": "Engineering"
	}
}
```

#### Connect to Peer

Establish a connection with a peer using specified transport.

```http
POST /api/peers/:peerId/connect
```

**Request Body:**

```json
{
	"transport": "p2p", // Required: transport to use
	"fallbackTransports": ["email", "discord"], // Optional: fallback order
	"options": {
		"encrypted": true,
		"priority": "high"
	}
}
```

**Response:**

```json
{
	"connected": true,
	"connectionId": "conn-456",
	"transport": "p2p",
	"latency": 15,
	"encrypted": true,
	"sessionToken": "session-token-123"
}
```

#### Disconnect from Peer

Disconnect from a specific peer.

```http
POST /api/peers/:peerId/disconnect
```

**Response:**

```json
{
	"disconnected": true,
	"peerId": "peer-123"
}
```

### Document Transfer via Peer Explorer

#### Send Documents to Peer

Send documents directly to a peer using the best available transport.

```http
POST /api/peers/:peerId/transfers
```

**Request Body:**

```json
{
	"documents": [
		{
			"id": "doc-1",
			"fileName": "contract.pdf",
			"fileData": "base64-encoded-data",
			"components": [
				/* signature fields, etc. */
			]
		}
	],
	"transport": "auto", // "auto" | "p2p" | "email" | etc.
	"options": {
		"encrypted": true,
		"requireSignature": true,
		"deadline": "2024-12-31T23:59:59Z",
		"message": "Please review and sign this contract"
	},
	"fallbackTransports": ["email", "discord"]
}
```

**Response:**

```json
{
	"transferId": "transfer-789",
	"status": "sent",
	"transport": "p2p", // Actually used transport
	"deliveryStatus": {
		"sent": 1234567890000,
		"delivered": null,
		"read": null,
		"signed": null
	},
	"trackingUrl": "/api/transfers/transfer-789"
}
```

#### Get Peer Transfers

Get all transfers with a specific peer.

```http
GET /api/peers/:peerId/transfers
```

**Query Parameters:**

- `type`: "sent" | "received" | "all"
- `status`: Transfer status filter
- `limit`: Number of results
- `offset`: Pagination offset

**Response:**

```json
{
	"transfers": [
		{
			"transferId": "transfer-789",
			"type": "sent",
			"documentCount": 2,
			"transport": "p2p",
			"status": "completed",
			"createdAt": 1234567890000,
			"completedAt": 1234567891000
		}
	],
	"total": 15
}
```

### Messaging

#### Send Message to Peer

Send a text message to a peer.

```http
POST /api/peers/:peerId/messages
```

**Request Body:**

```json
{
	"content": "Hello, can you review the document I sent?",
	"type": "text", // "text" | "file" | "transfer_notification"
	"transport": "auto", // Let system choose best transport
	"attachments": [
		{
			"type": "transfer_reference",
			"transferId": "transfer-789"
		}
	],
	"encrypted": true
}
```

**Response:**

```json
{
	"messageId": "msg-123",
	"status": "sent",
	"transport": "p2p",
	"timestamp": 1234567890000,
	"deliveryStatus": {
		"sent": 1234567890000,
		"delivered": null,
		"read": null
	}
}
```

#### Get Message History

Get message history with a peer.

```http
GET /api/peers/:peerId/messages
```

**Query Parameters:**

- `before`: Message ID or timestamp
- `after`: Message ID or timestamp
- `limit`: Number of messages (default: 50)

**Response:**

```json
{
	"messages": [
		{
			"messageId": "msg-123",
			"type": "text",
			"content": "Hello, can you review the document I sent?",
			"direction": "outgoing",
			"transport": "p2p",
			"timestamp": 1234567890000,
			"status": "delivered",
			"attachments": [
				{
					"type": "transfer_reference",
					"transferId": "transfer-789",
					"fileName": "contract.pdf"
				}
			]
		},
		{
			"messageId": "msg-124",
			"type": "text",
			"content": "Sure, I'll review it now.",
			"direction": "incoming",
			"transport": "p2p",
			"timestamp": 1234567891000,
			"status": "read"
		}
	],
	"hasMore": true
}
```

#### Mark Messages as Read

Mark messages from a peer as read.

```http
POST /api/peers/:peerId/messages/read
```

**Request Body:**

```json
{
	"messageIds": ["msg-124", "msg-125"], // Optional: specific messages
	"readAll": true // Optional: mark all as read
}
```

**Response:**

```json
{
	"updated": 2,
	"lastReadTimestamp": 1234567891000
}
```

### Peer Groups

#### Create Peer Group

Create a group for multi-party document transfers and messaging.

```http
POST /api/groups
```

**Request Body:**

```json
{
	"name": "Contract Review Team",
	"description": "Team for reviewing Q4 contracts",
	"members": [
		{
			"peerId": "peer-123",
			"role": "admin"
		},
		{
			"peerId": "peer-456",
			"role": "member"
		}
	],
	"settings": {
		"allowMemberInvites": true,
		"requireEncryption": true,
		"defaultTransport": "p2p"
	}
}
```

**Response:**

```json
{
	"groupId": "group-789",
	"name": "Contract Review Team",
	"members": 3,
	"created": 1234567890000
}
```

#### Send to Group

Send documents or messages to all group members.

```http
POST /api/groups/:groupId/send
```

**Request Body:**

```json
{
	"type": "document", // "document" | "message"
	"documents": [
		/* ... */
	],
	"message": "Please review and sign by EOD",
	"transport": "auto",
	"excludeMembers": ["peer-789"] // Optional: exclude specific members
}
```

**Response:**

```json
{
	"sent": true,
	"recipients": [
		{
			"peerId": "peer-123",
			"status": "sent",
			"transport": "p2p"
		},
		{
			"peerId": "peer-456",
			"status": "sent",
			"transport": "email"
		}
	]
}
```

### Transport-Specific Operations

#### P2P Network Status

Get P2P network statistics and connected nodes.

```http
GET /api/transports/p2p/network
```

**Response:**

```json
{
	"nodeId": "12D3KooWEyoppNCUx8Yx66oV9fJnriXwCcXwDDUA2kj6vnc6iDEp",
	"addresses": ["/ip4/192.168.1.100/tcp/9090", "/ip4/0.0.0.0/tcp/9091/ws"],
	"connectedPeers": 15,
	"discoveredPeers": 45,
	"dht": {
		"enabled": true,
		"providers": 120,
		"records": 340
	},
	"bandwidth": {
		"totalIn": 104857600,
		"totalOut": 52428800,
		"rateIn": 1024000,
		"rateOut": 512000
	},
	"protocols": ["/firma-sign/1.0.0", "/firma-sign/transfer/1.0.0", "/firma-sign/message/1.0.0"]
}
```

#### Email Queue Status

Get email transport queue and delivery status.

```http
GET /api/transports/email/queue
```

**Response:**

```json
{
	"queue": {
		"pending": 5,
		"processing": 2,
		"failed": 1,
		"completed": 150
	},
	"smtp": {
		"connected": true,
		"host": "smtp.gmail.com",
		"lastError": null
	},
	"limits": {
		"dailyLimit": 1000,
		"used": 152,
		"resetTime": 1234567890000
	}
}
```

## WebSocket Events

Connect to WebSocket for real-time peer updates and messaging.

```javascript
const ws = new WebSocket('ws://localhost:8080/explorer');
```

### Client → Server Events

#### Subscribe to Peer Updates

```json
{
	"type": "subscribe",
	"peerId": "peer-123"
}
```

#### Join Group

```json
{
	"type": "join_group",
	"groupId": "group-789"
}
```

#### Send Instant Message

```json
{
	"type": "message",
	"peerId": "peer-123",
	"content": "Document signed!",
	"transport": "p2p"
}
```

### Server → Client Events

#### Peer Status Update

```json
{
	"type": "peer:status",
	"peerId": "peer-123",
	"status": "online",
	"transport": "p2p",
	"timestamp": 1234567890000
}
```

#### Peer Discovered

```json
{
	"type": "peer:discovered",
	"peer": {
		"peerId": "peer-456",
		"displayName": "Bob Smith",
		"transports": ["p2p", "email"]
	}
}
```

#### Message Received

```json
{
	"type": "message:received",
	"message": {
		"messageId": "msg-789",
		"peerId": "peer-123",
		"content": "Thanks for the document!",
		"timestamp": 1234567890000
	}
}
```

#### Transfer Received

```json
{
	"type": "transfer:received",
	"transfer": {
		"transferId": "transfer-123",
		"peerId": "peer-456",
		"documentCount": 2,
		"transport": "p2p"
	}
}
```

#### Group Update

```json
{
	"type": "group:update",
	"groupId": "group-789",
	"event": "member_joined",
	"data": {
		"peerId": "peer-999",
		"displayName": "Charlie Brown"
	}
}
```

#### Transport Status

```json
{
	"type": "transport:status",
	"transport": "p2p",
	"status": "reconnecting",
	"details": {
		"reason": "Network change detected",
		"retryIn": 5000
	}
}
```

## Error Responses

```json
{
	"error": {
		"code": "PEER_NOT_FOUND",
		"message": "Peer with ID peer-123 not found",
		"details": {
			"peerId": "peer-123",
			"searchedTransports": ["p2p", "email"]
		}
	}
}
```

### Error Codes

- `TRANSPORT_NOT_AVAILABLE`: Requested transport not configured
- `PEER_NOT_FOUND`: Peer not found in network
- `PEER_OFFLINE`: Peer is currently offline
- `CONNECTION_FAILED`: Failed to establish connection
- `TRANSFER_FAILED`: Document transfer failed
- `MESSAGE_DELIVERY_FAILED`: Message could not be delivered
- `GROUP_NOT_FOUND`: Group does not exist
- `PERMISSION_DENIED`: Insufficient permissions for operation
- `TRANSPORT_ERROR`: Transport-specific error
- `QUOTA_EXCEEDED`: Message or transfer quota exceeded

## Rate Limiting

- Peer discovery: 10 requests per minute
- Message sending: 100 messages per minute per peer
- Document transfers: 20 transfers per hour per peer
- Group operations: 30 requests per minute

## Security Considerations

### Peer Verification

- Public key verification for P2P connections
- Email domain verification
- Discord/Telegram account verification

### Encryption

- End-to-end encryption for P2P messages and transfers
- TLS for email transport
- Transport-specific encryption for other protocols

### Trust Levels

1. **Unverified**: New peer, no verification
2. **Email Verified**: Email address confirmed
3. **Identity Verified**: Multiple transports verified
4. **Trusted**: Manual trust or organization member

## Transport Selection Algorithm

The system automatically selects the best transport based on:

1. **Availability**: Is the peer online on this transport?
2. **Capability**: Does the transport support required features?
3. **Performance**: Latency and bandwidth considerations
4. **Preference**: User-defined transport preferences
5. **Fallback**: Automatic fallback to alternative transports

## Usage Examples

### Discover and Connect to Peer

```javascript
// Discover peers
const response = await fetch('/api/peers/discover', {
	method: 'POST',
	body: JSON.stringify({
		query: 'alice@example.com',
	}),
});
const { peers } = await response.json();

// Connect to first peer
const peer = peers[0];
const connectResponse = await fetch(`/api/peers/${peer.peerId}/connect`, {
	method: 'POST',
	body: JSON.stringify({
		transport: 'auto',
		fallbackTransports: ['email'],
	}),
});
```

### Send Document with Message

```javascript
// Send document to peer
const transferResponse = await fetch(`/api/peers/${peerId}/transfers`, {
	method: 'POST',
	body: JSON.stringify({
		documents: [documentData],
		transport: 'auto',
		options: {
			message: 'Please sign this contract',
		},
	}),
});

// Follow up with message
const messageResponse = await fetch(`/api/peers/${peerId}/messages`, {
	method: 'POST',
	body: JSON.stringify({
		content: 'I just sent you the contract. Let me know if you have questions!',
		attachments: [
			{
				type: 'transfer_reference',
				transferId: transferResponse.transferId,
			},
		],
	}),
});
```

### Real-time Messaging

```javascript
const ws = new WebSocket('ws://localhost:8080/explorer');

ws.onopen = () => {
	// Subscribe to peer updates
	ws.send(
		JSON.stringify({
			type: 'subscribe',
			peerId: 'peer-123',
		}),
	);
};

ws.onmessage = (event) => {
	const data = JSON.parse(event.data);

	switch (data.type) {
		case 'message:received':
			console.log('New message:', data.message);
			break;
		case 'peer:status':
			console.log('Peer status:', data.status);
			break;
		case 'transfer:received':
			console.log('New transfer:', data.transfer);
			break;
	}
};

// Send instant message
ws.send(
	JSON.stringify({
		type: 'message',
		peerId: 'peer-123',
		content: 'Are you available for a quick review?',
	}),
);
```
