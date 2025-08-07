# Server API Reference

## Overview

The Firma-Sign server provides RESTful API endpoints and WebSocket events for document transfer operations. It integrates with the modular packages documented in the main project:

- **Transport Layer**: See [@firmachain/firma-sign-core](../../@firmachain/firma-sign-core/docs/API.md) for Transport interface
- **Storage**: See [@firmachain/firma-sign-storage-local](../../@firmachain/firma-sign-storage-local/docs/API.md)
- **Database**: See [@firmachain/firma-sign-database-sqlite](../../@firmachain/firma-sign-database-sqlite/docs/API.md)
- **P2P Transport**: See [@firmachain/firma-sign-transport-p2p](../../@firmachain/firma-sign-transport-p2p/docs/API.md)

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

### Generate Keypair

Generate RSA keypair for encryption.

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
			"id": "doc-1",
			"fileName": "contract.pdf",
			"fileData": "base64-encoded-data" // Optional, can be uploaded separately
		}
	],
	"recipients": [
		{
			"identifier": "user@example.com",
			"transport": "email",
			"signerAssignments": {
				"doc-1": true
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
const ws = new WebSocket('ws://localhost:8080');
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
