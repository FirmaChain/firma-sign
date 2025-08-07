# @firmachain/firma-sign-core

Core interfaces and utilities for the Firma-Sign document signing transport system.

## Installation

```bash
npm install @firmachain/firma-sign-core
```

## Overview

This package provides the core interfaces and utilities that all Firma-Sign transport and storage implementations must use. It ensures consistency across different transport methods (P2P, email, Discord, etc.) and storage backends (local, S3, Azure, IPFS, etc.), while providing common utilities for document handling.

## Key Interfaces

### Transport

The main interface that all transport implementations must follow:

```typescript
import { Transport } from '@firmachain/firma-sign-core';

class MyTransport implements Transport {
	name = 'my-transport';
	version = '1.0.0';

	async initialize(config: TransportConfig): Promise<void> {
		// Initialize your transport
	}

	async send(transfer: OutgoingTransfer): Promise<TransferResult> {
		// Implement sending logic
	}

	// ... other required methods
}
```

### Document Interfaces

```typescript
import { Document, SignedDocument } from '@firmachain/firma-sign-core';

const document: Document = {
	id: 'doc123',
	fileName: 'contract.pdf',
	fileSize: 1024000,
	mimeType: 'application/pdf',
	hash: 'sha256hash...',
	data: 'base64EncodedData',
};
```

### Document Preparation

For documents with form fields and signature components:

```typescript
import {
	DocumentComponent,
	prepareDocumentForExport,
	DocumentExport,
} from '@firmachain/firma-sign-core';

// Components from the frontend editor (like sample-components.json)
const components: DocumentComponent[] = [
	{
		id: 'comp-1',
		type: 'SIGNATURE',
		pageNumber: 0,
		position: { x: 120, y: 250 },
		size: { width: 180, height: 70 },
		assigned: {
			email: 'alice@example.com',
			name: 'Alice Johnson',
			color: '#3b82f6',
		},
		config: { required: true },
	},
];

// Prepare document for sending
const exportData: DocumentExport = prepareDocumentForExport(
	pdfData, // Uint8Array or base64 string
	components,
	{
		fileName: 'contract.pdf',
		fileSize: 1024000,
		pageCount: 2,
		title: 'Service Agreement',
	},
	{
		deadline: new Date('2024-12-31'),
		requireAllSigners: true,
	},
);
```

### Transfer Interfaces

```typescript
import { OutgoingTransfer, IncomingTransfer } from '@firmachain/firma-sign-core';

const transfer: OutgoingTransfer = {
	transferId: 'transfer123',
	documents: [document],
	recipients: [
		{
			id: 'recipient1',
			identifier: 'user@example.com',
			name: 'John Doe',
		},
	],
	sender: {
		senderId: 'sender123',
		name: 'Alice Smith',
		transport: 'email',
		timestamp: new Date(),
		verificationStatus: 'verified',
	},
};
```

## Utilities

### Hash Utilities

```typescript
import { generateHash, verifyHash, generateDocumentId } from '@firmachain/firma-sign-core';

// Generate hash of document
const hash = generateHash(documentData);

// Verify document integrity
const isValid = verifyHash(documentData, expectedHash);

// Generate unique document ID
const docId = generateDocumentId(hash);
```

### Encryption Utilities

```typescript
import { encrypt, decrypt, generateTransferCode } from '@firmachain/firma-sign-core';

// Encrypt document data
const encrypted = encrypt(documentData, password);

// Decrypt document data
const decrypted = decrypt(encrypted, password);

// Generate 6-digit transfer code
const code = generateTransferCode();
```

### Validation Utilities

```typescript
import { isValidEmail, isValidTransferId, generateTransferId } from '@firmachain/firma-sign-core';

// Validate email
if (isValidEmail('user@example.com')) {
	// Valid email
}

// Generate valid transfer ID
const transferId = generateTransferId();
```

### Document Preparation Utilities

```typescript
import {
	extractSigners,
	getComponentsForSigner,
	getSigningProgress,
	validateSignedComponents,
} from '@firmachain/firma-sign-core';

// Extract unique signers from components
const signers = extractSigners(components);

// Get components for a specific signer
const aliceComponents = getComponentsForSigner(components, 'alice@example.com');

// Track signing progress
const progress = getSigningProgress(preparedDoc, signedComponents);
console.log(`${progress.percentage}% complete`);

// Validate all required components are signed
const validation = validateSignedComponents(preparedDoc, signedComponents);
if (!validation.valid) {
	console.log('Missing signatures:', validation.missing);
}
```

### Storage

The main interface that all storage implementations must follow:

```typescript
import { Storage } from '@firmachain/firma-sign-core';

class MyStorage implements Storage {
	name = 'my-storage';
	version = '1.0.0';

	async initialize(config: StorageConfig): Promise<void> {
		// Initialize your storage backend
	}

	async save(path: string, data: Buffer): Promise<StorageResult> {
		// Implement save logic
	}

	async read(path: string): Promise<Buffer> {
		// Implement read logic
	}

	// ... other required methods
}
```

## Creating a Custom Transport

To create your own transport implementation:

1. Install the core package:

```bash
npm install @firmachain/firma-sign-core
```

2. Implement the Transport interface:

```typescript
import {
	Transport,
	TransportCapabilities,
	OutgoingTransfer,
	TransferResult,
} from '@firmachain/firma-sign-core';

export class CustomTransport implements Transport {
	name = 'custom';
	version = '1.0.0';

	capabilities: TransportCapabilities = {
		maxFileSize: 50 * 1024 * 1024, // 50MB
		supportsBatch: true,
		supportsEncryption: true,
		supportsNotifications: false,
		supportsResume: false,
		requiredConfig: ['apiKey', 'endpoint'],
	};

	async initialize(config: any): Promise<void> {
		// Your initialization logic
	}

	async send(transfer: OutgoingTransfer): Promise<TransferResult> {
		// Your sending logic
		return {
			success: true,
			transferId: transfer.transferId,
		};
	}

	// Implement other required methods...
}
```

3. Publish your transport package

## Creating a Custom Storage

To create your own storage implementation:

1. Install the core package:

```bash
npm install @firmachain/firma-sign-core
```

2. Implement the Storage interface:

```typescript
import {
	Storage,
	StorageCapabilities,
	StorageResult,
	StorageEntry,
} from '@firmachain/firma-sign-core';

export class CustomStorage implements Storage {
	name = 'custom';
	version = '1.0.0';

	capabilities: StorageCapabilities = {
		maxFileSize: 1024 * 1024 * 1024, // 1GB
		supportsStreaming: true,
		supportsMetadata: true,
		supportsVersioning: false,
		supportsEncryption: true,
		supportsConcurrentAccess: true,
		supportsDirectoryListing: true,
		requiredConfig: ['endpoint', 'apiKey'],
	};

	async initialize(config: any): Promise<void> {
		// Your initialization logic
	}

	async save(path: string, data: Buffer | Readable): Promise<StorageResult> {
		// Your save logic
		return {
			success: true,
			path: path,
			size: data.length,
			timestamp: Date.now(),
		};
	}

	async read(path: string): Promise<Buffer> {
		// Your read logic
	}

	// Implement other required methods...
}
```

3. Publish your storage package

## Development

### Building

```bash
npm run build
```

### Testing

```bash
npm test
```

### Type Checking

```bash
npm run type-check
```

## License

MIT © FirmaChain

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## Documentation

- [API Reference](./docs/API.md) - Detailed API documentation
- [Architecture](./docs/ARCHITECTURE.md) - Package architecture

## Links

- [GitHub Repository](https://github.com/firmachain/firma-sign)
- [Documentation](https://github.com/firmachain/firma-sign#readme)
- [npm Package](https://www.npmjs.com/package/@firmachain/firma-sign-core)
