# Firma-Sign API Reference

## Overview

This document provides a unified API reference for the Firma-Sign document signing system, covering both server REST endpoints and WebSocket events, as well as client-side integration patterns.

### Architecture Integration

The API integrates with the modular package ecosystem:

- **Transport Layer**: [@firmachain/firma-sign-core](../../@firmachain/firma-sign-core/docs/API.md) Transport interface
- **Storage**: [@firmachain/firma-sign-storage-local](../../@firmachain/firma-sign-storage-local/docs/API.md)
- **Database**: [@firmachain/firma-sign-database-sqlite](../../@firmachain/firma-sign-database-sqlite/docs/API.md)
- **P2P Transport**: [@firmachain/firma-sign-transport-p2p](../../@firmachain/firma-sign-transport-p2p/docs/API.md)
- **Document Components**: [@firmachain/firma-sign-documents](../../@firmachain/firma-sign-documents/docs/API.md)

### Document Formation Process

Documents in Firma-Sign follow a unified lifecycle across frontend and backend:

1. **Client Upload**: PDF files uploaded via frontend API
2. **Server Processing**: Documents processed by DocumentService with metadata extraction
3. **Storage Organization**: Hierarchical storage with category-based organization
4. **Transfer Integration**: Documents linked to transfers for multi-party workflows
5. **Status Tracking**: Real-time status updates via WebSocket

### Unified Document Interface

```typescript
interface Document {
	// Core identification
	id: string;
	originalName: string;
	fileName: string; // Sanitized filename for storage

	// Content metadata
	size: number;
	hash: string;
	mimeType: string;

	// Organization
	category: DocumentCategory;
	status: DocumentStatus;

	// Transfer context
	transferId?: string;

	// Temporal tracking
	uploadedAt: Date;
	lastModified: Date;
	signedAt?: Date;

	// User context
	uploadedBy?: string;
	signedBy?: string[];

	// Versioning
	version: number;
	previousVersionId?: string;

	// Extensibility
	tags?: string[];
	metadata?: Record<string, unknown>;
}
```

### Document Categories

```typescript
enum DocumentCategory {
	UPLOADED = 'uploaded', // User uploaded documents
	RECEIVED = 'received', // Documents received from others
	SENT = 'sent', // Documents sent to others
	SIGNED = 'signed', // Documents that have been signed
	TEMPLATES = 'templates', // Document templates
	ARCHIVED = 'archived', // Archived documents
	DELETED = 'deleted', // Soft-deleted documents
}
```

### Document Status States

```typescript
enum DocumentStatus {
	DRAFT = 'draft', // Initial upload state
	PENDING = 'pending', // Awaiting action
	IN_PROGRESS = 'in_progress', // Being processed
	SIGNED = 'signed', // Successfully signed
	COMPLETED = 'completed', // Workflow complete
	REJECTED = 'rejected', // Rejected by signer
	EXPIRED = 'expired', // Past deadline
	ARCHIVED = 'archived', // Moved to archive
	DELETED = 'deleted', // Soft deleted
}
```

## Base URL

```
http://localhost:8080/api
```

## Authentication

### Connect with Transfer Code

Authenticate using a 6-digit transfer code to access documents.

```http
POST /api/auth/connect
```

#### Request Body

```json
{
	"code": "ABC123",
	"transport": "p2p" // Optional transport hint
}
```

#### Response

```json
{
	"success": true,
	"transferId": "transfer-123",
	"sessionToken": "jwt-token-here",
	"expiresIn": 86400
}
```

### Generate Key Pair

Generate RSA key pair for encryption.

```http
POST /api/auth/generate-keypair
```

#### Response

```json
{
	"publicKey": "-----BEGIN PUBLIC KEY-----...",
	"privateKey": "-----BEGIN PRIVATE KEY-----..."
}
```

## Document Management

### Upload Document

Upload a new document to the system.

```http
POST /api/documents/upload
```

#### Request Body (multipart/form-data)

- `document`: PDF file
- `category`: Document category (default: 'uploaded')
- `transferId`: Optional transfer ID to associate
- `tags`: JSON array of tags
- `metadata`: JSON object with additional metadata

#### Response

```json
{
	"success": true,
	"document": {
		"id": "doc-1710123456789-abc123",
		"originalName": "contract.pdf",
		"fileName": "contract.pdf",
		"size": 2048000,
		"hash": "sha256:abc123...",
		"mimeType": "application/pdf",
		"category": "uploaded",
		"status": "draft",
		"uploadedAt": "2024-03-11T10:30:56.789Z",
		"version": 1,
		"tags": [],
		"transferId": "transfer-xyz"
	}
}
```

### Get Document

Download a document by ID.

```http
GET /api/documents/{documentId}
```

#### Response

Binary PDF data with headers:

- `Content-Type: application/pdf`
- `Content-Disposition: attachment; filename="contract.pdf"`

### Get Document Metadata

Get document metadata without downloading the file.

```http
GET /api/documents/{documentId}/metadata
```

#### Response

```json
{
	"success": true,
	"metadata": {
		"id": "doc-1710123456789-abc123",
		"originalName": "contract.pdf",
		"fileName": "contract.pdf",
		"size": 2048000,
		"hash": "sha256:abc123...",
		"mimeType": "application/pdf",
		"category": "uploaded",
		"status": "draft",
		"uploadedAt": "2024-03-11T10:30:56.789Z",
		"lastModified": "2024-03-11T10:30:56.789Z",
		"version": 1,
		"tags": ["contract", "legal"]
	}
}
```

### Search Documents

Search documents with filters.

```http
GET /api/documents?category=uploaded&status=draft&limit=20&offset=0
```

#### Query Parameters

- `category`: Filter by document category
- `status`: Filter by document status
- `transferId`: Filter by transfer ID
- `uploadedBy`: Filter by uploader
- `signedBy`: Filter by signer
- `tags`: Filter by tags (multiple allowed)
- `fromDate`: Filter from date (ISO string)
- `toDate`: Filter to date (ISO string)
- `searchText`: Text search in filename
- `limit`: Page size (default: 100)
- `offset`: Page offset (default: 0)

#### Response

```json
{
	"success": true,
	"documents": [
		/* array of document metadata */
	],
	"total": 25,
	"limit": 20,
	"offset": 0
}
```

### Update Document Status

Update the status of a document.

```http
PATCH /api/documents/{documentId}
```

#### Request Body

```json
{
	"status": "signed",
	"signedBy": "user@example.com",
	"signedAt": "2024-03-11T14:30:00Z"
}
```

### Move Document Category

Move a document to a different category.

```http
POST /api/documents/{documentId}/move
```

#### Request Body

```json
{
	"category": "signed"
}
```

### Document Versions

#### Get Document Versions

```http
GET /api/documents/{documentId}/versions
```

#### Create New Version

```http
POST /api/documents/{documentId}/versions
```

#### Request Body (multipart/form-data)

- `document`: PDF file (new version)
- `metadata`: JSON object with version metadata

### Delete Document

Delete a document (soft delete by default).

```http
DELETE /api/documents/{documentId}?permanent=false
```

#### Query Parameters

- `permanent`: Set to `true` for permanent deletion

## Transfers

### Create Transfer

Create a new document transfer with recipients.

```http
POST /api/transfers/create
```

#### Request Body

```json
{
	"documents": [
		{
			"id": "doc-1710123456789-abc123",
			"fileName": "contract.pdf",
			"fileData": "base64-encoded-data" // Optional, can reference existing document
		}
	],
	"recipients": [
		{
			"identifier": "user@example.com",
			"transport": "email",
			"signerAssignments": {
				"doc-1710123456789-abc123": true
			},
			"preferences": {
				"fallbackTransport": "web",
				"notificationEnabled": true
			}
		}
	],
	"metadata": {
		"deadline": "2024-12-31T23:59:59Z",
		"message": "Please sign this contract",
		"requireAllSignatures": true
	}
}
```

#### Response

```json
{
	"transferId": "transfer-xyz",
	"code": "ABC123",
	"status": "created"
}
```

### List Transfers

Get all transfers for the current user.

```http
GET /api/transfers
```

#### Query Parameters

- `type` (optional): Filter by transfer type (`incoming` or `outgoing`)
- `status` (optional): Filter by status (`pending`, `ready`, `partially-signed`, `completed`)
- `limit` (optional): Number of results (default: 100)
- `offset` (optional): Pagination offset

#### Response

```json
{
	"transfers": [
		{
			"transferId": "transfer-123",
			"type": "incoming",
			"sender": {
				"senderId": "sender-123",
				"name": "Alice Johnson",
				"email": "alice@example.com",
				"transport": "p2p",
				"timestamp": 1234567890000,
				"verificationStatus": "verified"
			},
			"documentCount": 2,
			"status": "pending",
			"createdAt": 1234567890000,
			"updatedAt": 1234567890000
		}
	],
	"total": 15,
	"hasMore": false
}
```

### Get Transfer Details

Get detailed information about a specific transfer.

```http
GET /api/transfers/:transferId
```

#### Response

```json
{
	"transferId": "transfer-123",
	"type": "incoming",
	"sender": {
		"senderId": "sender-123",
		"name": "Alice Johnson",
		"email": "alice@example.com",
		"publicKey": "-----BEGIN PUBLIC KEY-----...",
		"transport": "p2p",
		"timestamp": 1234567890000,
		"verificationStatus": "verified"
	},
	"status": "ready",
	"transport": {
		"type": "p2p",
		"deliveryStatus": "delivered"
	},
	"documents": [
		{
			"documentId": "doc-1",
			"fileName": "contract.pdf",
			"fileSize": 2048000,
			"fileHash": "sha256:abc123...",
			"status": "pending",
			"url": "/api/transfers/transfer-123/documents/doc-1",
			"expires": 1234567890000
		}
	],
	"recipients": [
		{
			"id": "recipient-1",
			"identifier": "bob@example.com",
			"transport": "email",
			"status": "notified",
			"notifiedAt": 1234567890000
		}
	],
	"metadata": {
		"deadline": "2024-12-31T23:59:59Z",
		"message": "Please sign this contract",
		"requireAllSignatures": true,
		"createdAt": 1234567890000
	}
}
```

### Sign Documents

Sign documents in a transfer.

```http
POST /api/transfers/:transferId/sign
```

#### Request Body

```json
{
	"signatures": [
		{
			"documentId": "doc-1",
			"signature": "base64-encoded-signature-data",
			"components": [
				{
					"id": "comp-1",
					"type": "SIGNATURE",
					"pageNumber": 0,
					"position": { "x": 100, "y": 200 },
					"size": { "width": 200, "height": 80 },
					"data": "base64-signature-image"
				}
			],
			"status": "signed",
			"rejectReason": null
		}
	],
	"returnTransport": "email" // Optional different return transport
}
```

#### Response

```json
{
	"status": "success",
	"signedDocuments": [
		{
			"documentId": "doc-1",
			"signedUrl": "/api/transfers/transfer-123/documents/doc-1/signed",
			"blockchainTx": "0x123..."
		}
	]
}
```

### Download Document

Download a document from a transfer.

```http
GET /api/transfers/:transferId/documents/:documentId
```

#### Headers

- `Authorization`: Bearer token from auth/connect

#### Response

Binary PDF data with appropriate headers:

- `Content-Type: application/pdf`
- `Content-Disposition: attachment; filename="contract.pdf"`

### Upload Document

Upload a document to an existing transfer.

```http
POST /api/transfers/:transferId/documents
```

#### Request Body (multipart/form-data)

- `file`: PDF file
- `documentId`: Unique document identifier
- `metadata`: JSON metadata (optional)

#### Response

```json
{
	"success": true,
	"documentId": "doc-1",
	"fileName": "contract.pdf",
	"fileSize": 2048000,
	"fileHash": "sha256:abc123..."
}
```

## Transport Management

### List Available Transports

Returns loaded transport packages and their capabilities (as defined in [@firmachain/firma-sign-core Transport interface](../../@firmachain/firma-sign-core/docs/API.md#transport)).

```http
GET /api/transports/available
```

#### Response

Returns transport capabilities from loaded packages:

```json
{
	"transports": [
		{
			"type": "p2p",
			"enabled": true,
			"configured": true,
			"features": ["maxFileSize", "supportsBatch", "supportsEncryption"],
			"capabilities": {
				/* See Transport.capabilities in core package */
			}
		}
	]
}
```

## Peer Explorer & Network Management

The Peer Explorer API provides a unified interface for discovering and connecting with other users across multiple transport protocols (P2P, Email, Discord, Telegram, etc.).

### WebSocket Endpoint

```
ws://localhost:8080/explorer
```

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
	"transports": ["p2p", "email"], // Optional: specific transports
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

#### Get Peer Details

Get detailed information about a specific peer.

```http
GET /api/peers/{peerId}
```

#### Connect to Peer

Establish a connection to a peer.

```http
POST /api/peers/{peerId}/connect
```

**Request Body:**

```json
{
	"transport": "p2p", // Preferred transport
	"fallbackTransports": ["email"], // Fallback options
	"timeout": 30000
}
```

#### Send Document to Peer

Send a document directly to a connected peer.

```http
POST /api/peers/{peerId}/transfers
```

**Request Body:**

```json
{
	"documentId": "doc-1710123456789-abc123",
	"transport": "p2p", // Optional: specify transport
	"message": "Please review and sign",
	"deadline": "2024-12-31T23:59:59Z",
	"requireSignature": true
}
```

### Messaging

#### Send Message to Peer

Send a message to a connected peer.

```http
POST /api/peers/{peerId}/messages
```

**Request Body:**

```json
{
	"type": "text",
	"content": "Hello, can you review this document?",
	"transport": "p2p", // Optional: specify transport
	"attachments": [
		{
			"type": "document_reference",
			"documentId": "doc-1710123456789-abc123"
		}
	]
}
```

#### Get Message History

Get message history with a peer.

```http
GET /api/peers/{peerId}/messages?limit=50&offset=0
```

### Group Management

#### Create Group

Create a group for multi-party document workflows.

```http
POST /api/groups
```

**Request Body:**

```json
{
	"name": "Legal Review Team",
	"description": "Group for legal document reviews",
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

#### Send Document to Group

Send a document to all group members.

```http
POST /api/groups/{groupId}/transfers
```

## Blockchain

### Store Document Hash

Store document hash on blockchain.

```http
POST /api/blockchain/store-hash
```

#### Request Body

```json
{
	"transferId": "transfer-123",
	"documentHash": "sha256:abc123...",
	"type": "original",
	"metadata": {
		"fileName": "contract.pdf",
		"signers": ["alice@example.com", "bob@example.com"]
	}
}
```

#### Response

```json
{
	"success": true,
	"transactionId": "0x123...",
	"blockNumber": 12345,
	"timestamp": 1234567890000
}
```

### Verify Document Hash

Verify document hash against blockchain record.

```http
GET /api/blockchain/verify-hash/:transferId
```

#### Response

```json
{
	"transferId": "transfer-123",
	"hashes": {
		"original": {
			"hash": "sha256:abc123...",
			"transactionId": "0x123...",
			"blockNumber": 12345,
			"timestamp": 1234567890000
		},
		"signed": {
			"hash": "sha256:def456...",
			"transactionId": "0x456...",
			"blockNumber": 12346,
			"timestamp": 1234567891000
		}
	},
	"verified": true
}
```

### Compare Document Hash

Compare document data with blockchain hash.

```http
POST /api/blockchain/compare-hash
```

#### Request Body

```json
{
	"documentData": "base64-encoded-document",
	"expectedHash": "sha256:abc123...",
	"transactionId": "0x123..."
}
```

#### Response

```json
{
	"matches": true,
	"calculatedHash": "sha256:abc123...",
	"blockchainHash": "sha256:abc123...",
	"transactionDetails": {
		"blockNumber": 12345,
		"timestamp": 1234567890000,
		"confirmations": 10
	}
}
```

## System

### Health Check

Check server health status.

```http
GET /health
```

#### Response

```json
{
	"status": "ok",
	"uptime": 3600,
	"connections": 10,
	"version": "1.0.0",
	"services": {
		"database": "connected",
		"storage": "connected",
		"transports": {
			"p2p": "connected",
			"email": "disconnected"
		}
	}
}
```

### Server Info

Get server information and capabilities.

```http
GET /api/info
```

#### Response

```json
{
	"version": "1.0.0",
	"nodeId": "node-123",
	"capabilities": {
		"maxFileSize": 104857600,
		"supportedTransports": ["p2p", "email", "web"],
		"blockchainEnabled": true,
		"encryptionAlgorithms": ["RSA-2048", "AES-256"]
	},
	"limits": {
		"maxTransferSize": 524288000,
		"maxDocumentsPerTransfer": 10,
		"maxRecipientsPerTransfer": 50,
		"transferCodeExpiry": 3600
	}
}
```

## WebSocket Events

Connect to WebSocket for real-time updates:

```javascript
const ws = new WebSocket('ws://localhost:8080/ws');
```

### Client → Server Events

#### Authenticate

```json
{
	"type": "auth",
	"token": "jwt-token-from-connect"
}
```

#### Subscribe to Transfer

```json
{
	"type": "subscribe",
	"transferId": "transfer-123"
}
```

#### Unsubscribe from Transfer

```json
{
	"type": "unsubscribe",
	"transferId": "transfer-123"
}
```

### Server → Client Events

#### Connection Established

```json
{
	"type": "connected",
	"sessionId": "session-123"
}
```

#### Transfer Update

```json
{
	"type": "transfer:update",
	"transferId": "transfer-123",
	"status": "partially-signed",
	"updatedFields": ["status", "documents"],
	"timestamp": 1234567890000
}
```

#### Document Signed

```json
{
	"type": "document:signed",
	"transferId": "transfer-123",
	"documentId": "doc-1",
	"signedBy": "bob@example.com",
	"timestamp": 1234567890000
}
```

#### Transport Error

```json
{
	"type": "transport:error",
	"transport": "email",
	"error": "SMTP connection failed",
	"timestamp": 1234567890000
}
```

#### Blockchain Confirmation

```json
{
	"type": "blockchain:confirmed",
	"transferId": "transfer-123",
	"transactionId": "0x123...",
	"confirmations": 6,
	"timestamp": 1234567890000
}
```

## Error Responses

All error responses follow this format:

```json
{
	"error": {
		"code": "TRANSFER_NOT_FOUND",
		"message": "Transfer with ID transfer-123 not found",
		"details": {
			"transferId": "transfer-123"
		}
	}
}
```

### Common Error Codes

- `INVALID_REQUEST`: Request validation failed
- `UNAUTHORIZED`: Authentication required
- `FORBIDDEN`: Insufficient permissions
- `NOT_FOUND`: Resource not found
- `TRANSFER_NOT_FOUND`: Transfer not found
- `DOCUMENT_NOT_FOUND`: Document not found
- `TRANSPORT_NOT_AVAILABLE`: Transport not configured
- `TRANSPORT_ERROR`: Transport operation failed
- `STORAGE_ERROR`: Storage operation failed
- `DATABASE_ERROR`: Database operation failed
- `BLOCKCHAIN_ERROR`: Blockchain operation failed
- `RATE_LIMIT_EXCEEDED`: Too many requests
- `INTERNAL_ERROR`: Internal server error

## Rate Limiting

API endpoints are rate limited:

- Default: 100 requests per 15 minutes
- Authentication endpoints: 10 requests per 15 minutes
- File upload/download: 20 requests per 15 minutes

Rate limit headers are included in responses:

- `X-RateLimit-Limit`: Maximum requests allowed
- `X-RateLimit-Remaining`: Requests remaining
- `X-RateLimit-Reset`: Unix timestamp when limit resets

## Pagination

List endpoints support pagination:

```http
GET /api/transfers?limit=20&offset=40
```

Paginated responses include:

```json
{
  "data": [...],
  "pagination": {
    "total": 100,
    "limit": 20,
    "offset": 40,
    "hasMore": true
  }
}
```
