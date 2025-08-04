# API Reference

## REST Endpoints

### Authentication

#### POST /api/auth/connect
Connect with a transfer code to establish a session.

**Request Body:**
```typescript
{
  code: string;       // 6-character transfer code
  transport?: string; // Optional transport hint
}
```

**Response:**
```typescript
{
  sessionId: string;
  transferId: string;
  transport: string;
}
```

#### POST /api/auth/generate-keypair
Generate an RSA keypair for encryption.

**Response:**
```typescript
{
  publicKey: string;  // PEM-encoded public key
  privateKey: string; // PEM-encoded private key
}
```

### Transfers

#### POST /api/transfers/create
Create a new document transfer.

**Request Body:**
```typescript
{
  documents: Array<{
    id: string;
    fileName: string;
    fileData?: string; // Base64 encoded
  }>;
  recipients: Array<{
    identifier: string;
    transport: 'p2p' | 'email' | 'discord' | 'telegram' | 'web';
    signerAssignments?: Record<string, boolean>;
    preferences?: {
      fallbackTransport?: string;
      notificationEnabled?: boolean;
    };
  }>;
  metadata?: {
    deadline?: string;
    message?: string;
    requireAllSignatures?: boolean;
  };
}
```

**Response:**
```typescript
{
  transferId: string;
  code: string;       // 6-character transfer code
  status: string;
}
```

#### GET /api/transfers
List all transfers.

**Response:**
```typescript
{
  transfers: Array<{
    transferId: string;
    type: 'incoming' | 'outgoing';
    sender?: SenderInfo;
    recipients?: Array<RecipientInfo>;
    documentCount: number;
    status: string;
    createdAt: number;
    updatedAt: number;
  }>;
}
```

#### GET /api/transfers/:transferId
Get details of a specific transfer.

**Response:**
```typescript
{
  transferId: string;
  sender: SenderInfo;
  status: string;
  transport: {
    type: string;
    deliveryStatus: string;
  };
  documents: Array<{
    documentId: string;
    fileName: string;
    fileSize: number;
    status: string;
    signedBy?: string;
    signedAt?: number;
    url?: string;
    expires?: number;
  }>;
  metadata: object;
}
```

#### POST /api/transfers/:transferId/sign
Sign documents in a transfer.

**Request Body:**
```typescript
{
  signatures: Array<{
    documentId: string;
    signature: string;     // Base64 encoded
    components: any[];
    status: 'signed' | 'rejected';
    rejectReason?: string;
  }>;
  returnTransport?: string;
}
```

### Blockchain

#### POST /api/blockchain/store-hash
Store a document hash on the blockchain.

**Request Body:**
```typescript
{
  transferId: string;
  documentHash: string;
  type: 'original' | 'signed';
  metadata?: {
    fileName: string;
    signers: string[];
  };
}
```

#### GET /api/blockchain/verify-hash/:transferId
Verify document hashes for a transfer.

**Response:**
```typescript
{
  transferId: string;
  hashes: {
    original?: HashInfo;
    signed?: HashInfo;
  };
  verified: boolean;
}
```

### System

#### GET /api/transports/available
List available transport protocols.

**Response:**
```typescript
{
  transports: Array<{
    type: string;
    enabled: boolean;
    configured: boolean;
    features: string[];
  }>;
}
```

#### GET /health
Health check endpoint.

**Response:**
```typescript
{
  status: 'ok';
  uptime: number;
  connections: number;
}
```

## WebSocket API

### Connection
Connect to: `ws://localhost:8080`

### Client → Server Messages

#### Authentication
```typescript
{
  type: 'auth';
  token?: string;
}
```

#### Subscribe to Transfer
```typescript
{
  type: 'subscribe';
  transferId: string;
}
```

#### Unsubscribe
```typescript
{
  type: 'unsubscribe';
  transferId: string;
}
```

### Server → Client Messages

#### Connected
```typescript
{
  type: 'connected';
  clientId: string;
}
```

#### Transfer Update
```typescript
{
  type: 'event';
  event: string;
  transferId: string;
  data: any;
  timestamp: number;
}
```

#### Error
```typescript
{
  type: 'error';
  error: string;
}
```

## Core Classes

### TransportManager
Manages transport protocol implementations.

```typescript
class TransportManager extends EventEmitter {
  async register(transport: Transport): Promise<void>
  async configure(transportName: string, config: TransportConfig): Promise<void>
  async send(transportName: string, transfer: OutgoingTransfer): Promise<TransferResult>
  getAvailableTransports(): Array<TransportInfo>
  async shutdown(): Promise<void>
}
```

### StorageManager
Handles local document storage and metadata.

```typescript
class StorageManager {
  constructor(storagePath?: string)
  async createTransfer(transfer: Partial<Transfer>): Promise<void>
  async getTransfer(transferId: string): Promise<Transfer | null>
  async listTransfers(): Promise<Transfer[]>
  async updateTransferSignatures(transferId: string, signatures: any[]): Promise<void>
  async saveDocument(transferId: string, fileName: string, data: Buffer): Promise<void>
  async getDocument(transferId: string, fileName: string): Promise<Buffer>
  close(): void
}
```

### WebSocketServer
Provides real-time updates to connected clients.

```typescript
class WebSocketServer extends EventEmitter {
  constructor(server: HTTPServer)
  broadcastToTransfer(transferId: string, event: string, data: any): void
  broadcast(event: string, data: any): void
  getConnectionCount(): number
  close(): void
}
```