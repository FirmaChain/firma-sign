# API Reference

## Interfaces

### Transport
Base interface that all transport implementations must implement.

```typescript
interface Transport {
  readonly name: string;
  readonly version: string;
  readonly capabilities: TransportCapabilities;
  
  initialize(config: TransportConfig): Promise<void>;
  shutdown(): Promise<void>;
  
  send(transfer: OutgoingTransfer): Promise<TransferResult>;
  receive(handler: IncomingTransferHandler): void;
  
  getStatus(): TransportStatus;
  validateConfig(config: unknown): config is TransportConfig;
}
```

### TransportCapabilities
Describes what a transport can do.

```typescript
interface TransportCapabilities {
  maxFileSize: number;
  supportsBatch: boolean;
  supportsEncryption: boolean;
  supportsNotifications: boolean;
  requiredConfig: string[];
}
```

### OutgoingTransfer
Data structure for sending documents.

```typescript
interface OutgoingTransfer {
  transferId: string;
  documents: Document[];
  recipients: Recipient[];
  options?: TransferOptions;
}
```

### IncomingTransferHandler
Handler for receiving transfers.

```typescript
interface IncomingTransferHandler {
  onTransferReceived(transfer: IncomingTransfer): Promise<void>;
  onError(error: TransportError): void;
}
```

### Document
Represents a document in a transfer.

```typescript
interface Document {
  id: string;
  fileName: string;
  mimeType: string;
  size: number;
  data: Buffer | Stream;
  hash?: string;
  metadata?: Record<string, any>;
}
```

### Recipient
Information about a transfer recipient.

```typescript
interface Recipient {
  id: string;
  identifier: string;
  transport: string;
  publicKey?: string;
  preferences?: RecipientPreferences;
}
```

### TransferResult
Result of a transfer operation.

```typescript
interface TransferResult {
  success: boolean;
  transferId: string;
  timestamp: number;
  recipients: Array<{
    recipientId: string;
    status: 'sent' | 'failed';
    error?: string;
  }>;
}
```

### TransportError
Error type for transport operations.

```typescript
interface TransportError extends Error {
  code: string;
  transport: string;
  details?: any;
}
```

### Storage
Base interface that all storage implementations must implement.

```typescript
interface Storage {
  readonly name: string;
  readonly version: string;
  readonly capabilities: StorageCapabilities;
  
  initialize(config: StorageConfig): Promise<void>;
  shutdown(): Promise<void>;
  
  save(path: string, data: Buffer | Readable): Promise<StorageResult>;
  read(path: string): Promise<Buffer>;
  readStream(path: string): Promise<Readable>;
  exists(path: string): Promise<boolean>;
  delete(path: string): Promise<void>;
  list(prefix: string): Promise<StorageEntry[]>;
  
  getStatus(): StorageStatus;
  validateConfig(config: unknown): config is StorageConfig;
}
```

### StorageCapabilities
Describes what a storage backend can do.

```typescript
interface StorageCapabilities {
  maxFileSize: number;
  supportsStreaming: boolean;
  supportsMetadata: boolean;
  supportsVersioning: boolean;
  supportsEncryption: boolean;
  supportsConcurrentAccess: boolean;
  supportsDirectoryListing: boolean;
  requiredConfig: string[];
}
```

### StorageResult
Result of a storage operation.

```typescript
interface StorageResult {
  success: boolean;
  path: string;
  size: number;
  hash?: string;
  versionId?: string;
  timestamp: number;
  metadata?: Record<string, unknown>;
}
```

### StorageEntry
Entry in a storage listing.

```typescript
interface StorageEntry {
  path: string;
  type: 'file' | 'directory';
  size: number;
  lastModified: number;
  metadata?: Record<string, unknown>;
}
```

### StorageError
Error type for storage operations.

```typescript
class StorageError extends Error {
  code: string;
  storage: string;
  details?: unknown;
}
```

## Utilities

### Hash Functions

#### generateHash
Generate SHA-256 hash of data.

```typescript
function generateHash(data: Buffer | string): string
```

**Example:**
```typescript
import { generateHash } from '@firmachain/firma-sign-core/utils';

const hash = generateHash(Buffer.from('Hello World'));
```

#### verifyHash
Verify data against a hash.

```typescript
function verifyHash(data: Buffer | string, expectedHash: string): boolean
```

### Encryption Functions

#### generateKeyPair
Generate RSA key pair.

```typescript
function generateKeyPair(): Promise<{
  publicKey: string;
  privateKey: string;
}>
```

#### encrypt
Encrypt data with public key.

```typescript
function encrypt(data: Buffer, publicKey: string): Promise<Buffer>
```

#### decrypt
Decrypt data with private key.

```typescript
function decrypt(encryptedData: Buffer, privateKey: string): Promise<Buffer>
```

### Validation Functions

#### validateTransferId
Validate transfer ID format.

```typescript
function validateTransferId(id: string): boolean
```

#### validateDocumentHash
Validate document hash format.

```typescript
function validateDocumentHash(hash: string): boolean
```

## Constants

### Transfer Status
```typescript
export const TransferStatus = {
  PENDING: 'pending',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  FAILED: 'failed',
  CANCELLED: 'cancelled'
} as const;
```

### Error Codes
```typescript
export const ErrorCodes = {
  TRANSPORT_NOT_INITIALIZED: 'TRANSPORT_NOT_INITIALIZED',
  INVALID_CONFIG: 'INVALID_CONFIG',
  TRANSFER_FAILED: 'TRANSFER_FAILED',
  DOCUMENT_TOO_LARGE: 'DOCUMENT_TOO_LARGE',
  RECIPIENT_NOT_FOUND: 'RECIPIENT_NOT_FOUND',
  ENCRYPTION_FAILED: 'ENCRYPTION_FAILED',
  NETWORK_ERROR: 'NETWORK_ERROR'
} as const;
```

## Type Guards

### isTransportError
Check if error is a TransportError.

```typescript
function isTransportError(error: unknown): error is TransportError
```

### isValidDocument
Check if object is a valid Document.

```typescript
function isValidDocument(obj: unknown): obj is Document
```

## Usage Examples

### Implementing a Transport

```typescript
import { Transport, TransportCapabilities } from '@firmachain/firma-sign-core';

export class CustomTransport implements Transport {
  name = 'custom';
  version = '1.0.0';
  
  capabilities: TransportCapabilities = {
    maxFileSize: 100 * 1024 * 1024, // 100MB
    supportsBatch: true,
    supportsEncryption: true,
    supportsNotifications: false,
    requiredConfig: ['apiKey', 'endpoint']
  };

  async initialize(config: any): Promise<void> {
    // Implementation
  }

  async send(transfer: OutgoingTransfer): Promise<TransferResult> {
    // Implementation
  }

  receive(handler: IncomingTransferHandler): void {
    // Implementation
  }

  // Other required methods...
}
```

### Using Utilities

```typescript
import { 
  generateHash, 
  encrypt, 
  validateTransferId 
} from '@firmachain/firma-sign-core/utils';

// Generate document hash
const documentHash = generateHash(documentBuffer);

// Encrypt document
const encrypted = await encrypt(documentBuffer, recipientPublicKey);

// Validate transfer ID
if (validateTransferId(transferId)) {
  // Process transfer
}
```