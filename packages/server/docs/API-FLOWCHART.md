# Firma-Sign Server API Flowchart & Process Documentation

## Overview

The Firma-Sign server acts as a document management and transfer hub, allowing users to:

- Upload and manage PDF documents
- Send documents to recipients for signing
- Receive and sign documents from others
- Export signed documents

## Core Components

```
┌─────────────────────────────────────────────────────┐
│                  Firma-Sign Server                   │
├─────────────────────────────────────────────────────┤
│  Storage Manager (Local)  │  Transport Manager (P2P) │
│  - File Explorer API      │  - Send Documents        │
│  - Document Storage       │  - Receive Documents     │
│  - Metadata Management    │  - Connection Keys       │
└─────────────────────────────────────────────────────┘
```

## 1. Document Management Flow

### 1.1 Upload Document

```
User uploads PDF with metadata
        ↓
[POST /api/documents/upload]
        ↓
Server validates PDF
        ↓
Generate unique document ID
        ↓
Store in local storage:
  - PDF file → /storage/documents/{docId}/document.pdf
  - Metadata → /storage/documents/{docId}/metadata.json
        ↓
Return document ID to user
```

### 1.2 File Explorer

```
User requests file list
        ↓
[GET /api/storage/explorer]
        ↓
Server reads local storage
        ↓
Returns structured file tree:
  {
    "documents": [
      {
        "id": "doc-123",
        "name": "Contract.pdf",
        "size": 1024000,
        "created": "2024-01-01",
        "status": "draft|pending|signed",
        "metadata": {...}
      }
    ],
    "transfers": {
      "outgoing": [...],
      "incoming": [...]
    }
  }
```

### 1.3 Document Operations

```
[GET /api/documents/{docId}]        → Get document details
[GET /api/documents/{docId}/pdf]    → Download PDF
[PUT /api/documents/{docId}]        → Update document/metadata
[DELETE /api/documents/{docId}]     → Delete document
[GET /api/documents/{docId}/metadata] → Get metadata only
```

## 2. P2P Transport Integration

### 2.1 Simple P2P Transport Usage

The server uses the `@firmachain/firma-sign-transport-p2p` package which handles all connection complexity internally:

```typescript
// Server just uses simple interface
import { P2PTransport } from '@firmachain/firma-sign-transport-p2p';

const p2pTransport = new P2PTransport();

// Initialize with simple config
await p2pTransport.initialize({
	mode: 'auto', // auto|relay|direct
	// That's it! Package handles all complexity
});

// Send document - transport handles connection
await p2pTransport.send({
	transferId: 'transfer-123',
	documents: [pdfDocument],
	recipients: ['connection-key'],
});

// Receive documents - transport handles discovery
p2pTransport.receive({
	onTransferReceived: async (transfer) => {
		// Handle incoming document
	},
});
```

### 2.2 How transport-p2p Handles Connections

```
┌─────────────────────────────────────────────────────────────┐
│         @firmachain/firma-sign-transport-p2p Package         │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Internally handles:                                         │
│  ✓ NAT traversal (STUN/TURN)                               │
│  ✓ Peer discovery                                           │
│  ✓ Connection fallbacks                                     │
│  ✓ Encryption                                               │
│  ✓ Retry logic                                              │
│                                                              │
│  Server just calls:                                         │
│  • initialize() - start transport                           │
│  • generateConnectionKey() - create shareable key           │
│  • connectWithKey() - connect to peer                       │
│  • send() - send document                                   │
│  • receive() - listen for documents                         │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### 2.3 Connection Key (Simplified)

```
What the server sees:
"ABC-123" → Simple 6-character code

What transport-p2p handles internally:
- Peer discovery
- NAT traversal
- Fallback to relay if needed
- Encryption keys
- Connection metadata

Server doesn't need to know these details!
```

## 3. Document Transfer Flow (Sending)

### 3.1 Initiate Transfer (Server Side)

```
User selects document to send
        ↓
[POST /api/transfers/send]
Body: {
  documentId: "doc-123",
  recipients: ["recipient@email.com"],
  metadata: { ... }
}
        ↓
Server simple process:
  1. Load document from storage
  2. Create transfer record
  3. Call P2P transport to generate key
        ↓
// Server code:
const connectionKey = await p2pTransport.generateConnectionKey({
  transferId: 'transfer-123',
  timeout: 3600000  // 1 hour
});
        ↓
Server responds with:
{
  "connectionKey": "ABC-123",
  "transferId": "transfer-123",
  "status": "waiting_for_peer",
  "expires": "2024-01-15T11:00:00Z"
}
```

### 3.2 How Server Uses P2P Transport

```
// Simple server implementation
class TransferService {
  async sendDocument(documentId, recipients) {
    // 1. Get document from storage
    const doc = await storage.getDocument(documentId);

    // 2. Generate connection key (transport handles complexity)
    const key = await p2pTransport.generateConnectionKey({
      transferId: generateId()
    });

    // 3. Wait for recipient to connect (transport handles this)
    p2pTransport.onPeerConnected(key, async (peer) => {
      // 4. Send document (transport handles encryption, chunking, etc.)
      await p2pTransport.send({
        documents: [doc],
        to: peer
      });
    });

    return { connectionKey: key };
  }
}

// The P2P transport package handles all the complex stuff internally!
```

## 4. Document Transfer Flow (Receiving)

### 4.1 Connect to Transfer (Receiver Side)

```
Recipient enters connection key
        ↓
[POST /api/transfers/connect]
Body: {
  connectionKey: "ABC-123"
}
        ↓
Server simple process:
  1. Call P2P transport to connect
  2. Receive document automatically
  3. Store in local storage
        ↓
// Server code:
const transfer = await p2pTransport.connectWithKey('ABC-123');

// Transport automatically handles:
// - Finding the peer
// - Establishing connection
// - Receiving the document
// - Decryption

// Server just stores the received document
await storage.saveIncoming(transfer.documents, transfer.metadata);
        ↓
Return transfer details to recipient
```

### 4.2 View & Sign Document

```
Recipient views document
        ↓
[GET /api/transfers/incoming/{transferId}]
        ↓
Returns:
  - PDF for viewing
  - Metadata
  - Required signature fields
        ↓
Recipient signs document
        ↓
[POST /api/transfers/incoming/{transferId}/sign]
Body: {
  signatures: [
    {
      fieldId: "signature_1",
      data: "base64_signature_image",
      timestamp: "2024-01-15T10:30:00Z"
    }
  ]
}
        ↓
Server updates document with signatures
        ↓
Send signed document back to sender
```

## 5. Complete API Structure

### 5.1 Storage Management APIs

```
File Explorer:
GET  /api/storage/explorer           → Browse all files
GET  /api/storage/explorer/{path}    → Browse specific directory
POST /api/storage/create-folder      → Create new folder
DELETE /api/storage/{path}           → Delete file/folder
MOVE /api/storage/move              → Move/rename files

Document Management:
POST /api/documents/upload          → Upload new document
GET  /api/documents                 → List all documents
GET  /api/documents/{docId}         → Get document details
GET  /api/documents/{docId}/pdf     → Download PDF
GET  /api/documents/{docId}/metadata → Get metadata
PUT  /api/documents/{docId}/metadata → Update metadata
DELETE /api/documents/{docId}       → Delete document
```

### 5.2 Transfer APIs

```
Sending:
POST /api/transfers/send            → Initiate new transfer
GET  /api/transfers/outgoing        → List outgoing transfers
GET  /api/transfers/outgoing/{id}   → Get transfer status
POST /api/transfers/outgoing/{id}/cancel → Cancel transfer

Receiving:
POST /api/transfers/connect         → Connect with key
GET  /api/transfers/incoming        → List incoming transfers
GET  /api/transfers/incoming/{id}   → Get transfer details
POST /api/transfers/incoming/{id}/sign → Sign document
POST /api/transfers/incoming/{id}/reject → Reject document

P2P Status APIs (Simple):
GET  /api/transfers/status/{key}    → Check transfer status
GET  /api/transfers/peers           → List active connections

Connection Management:
GET  /api/transfers/connection/{key} → Check connection status
POST /api/transfers/refresh-key     → Generate new key
```

### 5.3 Export APIs

```
POST /api/export/signed             → Export signed PDF
Body: {
  transferId: "transfer-123",
  format: "pdf|pdf-a",
  includeAuditTrail: true
}

GET  /api/export/{exportId}/download → Download exported file
```

## 6. Data Structures

### 6.1 Document Metadata Structure

```json
{
	"id": "doc-123",
	"title": "Service Agreement",
	"description": "Contract for services",
	"created": "2024-01-01T00:00:00Z",
	"modified": "2024-01-15T00:00:00Z",
	"status": "draft|pending|signed|completed",
	"owner": {
		"id": "user-456",
		"name": "Alice Smith",
		"email": "alice@example.com"
	},
	"signers": [
		{
			"id": "signer-1",
			"email": "bob@example.com",
			"name": "Bob Johnson",
			"status": "pending|signed|rejected",
			"signedAt": null,
			"fields": [
				{
					"id": "field-1",
					"type": "signature",
					"page": 3,
					"position": { "x": 100, "y": 200 },
					"required": true,
					"value": null
				}
			]
		}
	],
	"workflow": {
		"requireAllSignatures": true,
		"signatureOrder": "parallel|sequential",
		"deadline": "2024-12-31T23:59:59Z"
	},
	"audit": [
		{
			"action": "created",
			"timestamp": "2024-01-01T00:00:00Z",
			"user": "alice@example.com"
		},
		{
			"action": "sent",
			"timestamp": "2024-01-02T00:00:00Z",
			"recipient": "bob@example.com"
		}
	]
}
```

### 6.2 Transfer Package Structure

```json
{
	"transferId": "transfer-789",
	"connectionKey": "ABC-123",
	"sender": {
		"id": "user-456",
		"name": "Alice Smith",
		"email": "alice@example.com"
	},
	"document": {
		"id": "doc-123",
		"fileName": "contract.pdf",
		"fileSize": 1024000,
		"hash": "sha256:abc123..."
	},
	"metadata": {
		/* Document metadata */
	},
	"transport": {
		"type": "p2p",
		"status": "waiting|connected|transferring|completed",
		"progress": 75,
		"peerId": "peer-xyz"
	},
	"created": "2024-01-15T10:00:00Z",
	"expires": "2024-01-15T11:00:00Z"
}
```

## 7. Error Handling

### Common Error Responses

```json
{
	"error": {
		"code": "DOCUMENT_NOT_FOUND",
		"message": "The requested document does not exist",
		"details": {
			"documentId": "doc-999"
		}
	}
}
```

### Error Codes

- `DOCUMENT_NOT_FOUND` - Document doesn't exist
- `INVALID_CONNECTION_KEY` - Connection key invalid/expired
- `TRANSFER_FAILED` - P2P transfer failed
- `SIGNATURE_REQUIRED` - Missing required signatures
- `STORAGE_ERROR` - File system error
- `VALIDATION_ERROR` - Invalid input data

## 8. Security Considerations

### Authentication Flow

```
1. Connection keys are single-use and expire
2. Each transfer has unique encryption
3. Documents are encrypted during P2P transfer
4. Signed documents include tamper-proof hash
```

### Access Control

```
- Documents are isolated per user/session
- Connection keys provide temporary access
- Audit trail for all operations
- No permanent storage of sensitive data
```

## 9. Frontend Integration Points

### Document Upload Component

```typescript
// Frontend calls
const response = await fetch('/api/documents/upload', {
	method: 'POST',
	body: formData, // PDF + metadata
});
const { documentId } = await response.json();
```

### File Explorer Component

```typescript
// Get file tree
const files = await fetch('/api/storage/explorer');
// Display in tree view with actions
```

### Transfer Component

```typescript
// Send document
const transfer = await fetch('/api/transfers/send', {
	method: 'POST',
	body: JSON.stringify({
		documentId,
		recipients,
		metadata,
	}),
});
// Share connection key
```

### Signing Component

```typescript
// Sign document
await fetch(`/api/transfers/incoming/${transferId}/sign`, {
	method: 'POST',
	body: JSON.stringify({ signatures }),
});
```

## 10. Complete User Journey

```
1. Alice uploads contract PDF
   → Server stores in local storage

2. Alice adds signing requirements
   → Metadata updated with signer info

3. Alice initiates transfer to Bob
   → Server generates connection key "ABC-123"

4. Alice shares key with Bob
   → Via email, chat, etc.

5. Bob connects with key
   → P2P connection established
   → Document downloaded to Bob's incoming folder

6. Bob views and signs document
   → Frontend shows PDF with signature fields
   → Bob adds signature

7. Bob sends signed document back
   → P2P transfer back to Alice

8. Alice receives signed document
   → Stored in completed transfers
   → Can export final signed PDF
```

## 11. Implementation Priority

### Phase 1 - Core Storage

1. File upload/download APIs
2. Basic file explorer
3. Metadata management

### Phase 2 - P2P Transfer

1. Connection key generation
2. P2P send/receive
3. Transfer status tracking

### Phase 3 - Signing Flow

1. Signature field management
2. Sign document API
3. Return signed documents

### Phase 4 - Export & Archive

1. Export signed PDFs
2. Audit trail
3. Document archival

## 12. Transport-P2P Package Responsibilities

### What transport-p2p Package Handles

```
The @firmachain/firma-sign-transport-p2p package handles ALL complexity:

✓ Connection establishment (NAT traversal, STUN/TURN)
✓ Peer discovery (signaling, DHT, etc.)
✓ Encryption and security
✓ Data chunking for large files
✓ Retry logic and error recovery
✓ Connection fallbacks (direct → relay)
✓ Progress tracking
```

### Simple Interface for Server

```typescript
// What the server needs to implement:
interface P2PTransport {
	// Initialize transport
	initialize(config?: { mode?: 'auto' | 'relay' | 'direct' }): Promise<void>;

	// Generate a shareable connection key
	generateConnectionKey(options: { transferId: string; timeout?: number }): Promise<string>; // Returns "ABC-123"

	// Connect using a key
	connectWithKey(key: string): Promise<IncomingTransfer>;

	// Send documents
	send(transfer: OutgoingTransfer): Promise<TransferResult>;

	// Listen for incoming transfers
	receive(handler: IncomingTransferHandler): void;

	// Get connection status
	getStatus(): TransportStatus;
}
```

### What Server Focuses On

```
The server only handles:
✓ Document storage management
✓ Metadata and user management
✓ REST API endpoints
✓ Business logic (signing workflow)
✓ Export functionality

The server does NOT handle:
✗ P2P connection details
✗ NAT traversal
✗ Signaling servers
✗ STUN/TURN configuration
✗ WebRTC complexity
```

## Questions to Consider

1. **Infrastructure**: Will you self-host signaling/TURN servers or use a service?
2. **Fallback Strategy**: What happens if P2P fails completely?
3. **Authentication**: How do users authenticate? Session-based or token-based?
4. **Multi-user**: Can multiple people sign the same document?
5. **Notifications**: How are users notified when documents arrive?
6. **Storage Limits**: Any limits on file size or number of documents?
7. **Persistence**: How long are documents kept? Archive policy?
8. **Connection Timeout**: How long to wait for peer connection?
9. **Offline Support**: Can recipients connect later if sender is offline?

## Next Steps

After review, we'll implement:

1. Basic storage APIs with local filesystem
2. P2P transport integration for transfers
3. Connection key mechanism
4. Signing workflow
5. Export functionality

This design ensures:

- Clear separation of concerns
- RESTful API patterns
- Extensible architecture
- Security best practices
- Frontend-friendly responses
