# @firmachain/firma-sign-storage-local

Local filesystem storage implementation for the Firma-Sign document signing system.

## Installation

```bash
npm install @firmachain/firma-sign-storage-local
# or
yarn add @firmachain/firma-sign-storage-local
# or
pnpm add @firmachain/firma-sign-storage-local
```

## Overview

This package provides a local filesystem storage backend for Firma-Sign. It implements the Storage interface from `@firmachain/firma-sign-core` and provides reliable, secure local file storage with metadata support, checksums, and directory management.

## Features

- 📁 **Local Filesystem Storage**: Store documents directly on the local filesystem
- 🔒 **Path Security**: Prevents path traversal attacks
- ✅ **Checksum Support**: Automatic SHA-256 hash generation for integrity verification
- 📊 **Metadata Management**: Store and retrieve custom metadata for files
- 🌊 **Streaming Support**: Efficient handling of large files with streams
- 📂 **Directory Operations**: Create, list, and manage directories
- 📈 **Usage Statistics**: Track storage usage and file counts
- 🔧 **Configurable**: Customize base path, file size limits, and behavior

## Quick Start

```typescript
import { LocalStorage } from '@firmachain/firma-sign-storage-local';

// Create storage instance
const storage = new LocalStorage();

// Initialize with configuration
await storage.initialize({
	basePath: '~/.firmasign/storage', // Supports tilde expansion
	maxFileSize: 100 * 1024 * 1024, // 100MB limit
	ensureDirectories: true, // Auto-create directories
	useChecksum: true, // Generate SHA-256 hashes
});

// Save a document
const result = await storage.save('documents/contract.pdf', documentBuffer);
console.log(`Saved to ${result.path} with hash ${result.hash}`);

// Read a document
const data = await storage.read('documents/contract.pdf');

// Check if file exists
const exists = await storage.exists('documents/contract.pdf');

// List files in directory
const files = await storage.list('documents');

// Delete a file
await storage.delete('documents/contract.pdf');

// Shutdown when done
await storage.shutdown();
```

## Configuration

### Configuration Options

```typescript
interface LocalStorageConfig {
	basePath?: string; // Base directory for storage (default: ~/.firmasign/storage)
	maxFileSize?: number; // Maximum file size in bytes (default: 100MB)
	ensureDirectories?: boolean; // Auto-create directories (default: true)
	useChecksum?: boolean; // Generate checksums for files (default: true)
}
```

### Example Configurations

```typescript
// Development configuration
await storage.initialize({
	basePath: './dev-storage',
	maxFileSize: 50 * 1024 * 1024, // 50MB
	ensureDirectories: true,
	useChecksum: true,
});

// Production configuration
await storage.initialize({
	basePath: '/var/firma-sign/storage',
	maxFileSize: 500 * 1024 * 1024, // 500MB
	ensureDirectories: true,
	useChecksum: true,
});

// Testing configuration
await storage.initialize({
	basePath: '/tmp/firma-sign-test',
	maxFileSize: 10 * 1024 * 1024, // 10MB
	ensureDirectories: true,
	useChecksum: false, // Skip checksums for speed
});
```

## API Reference

### Core Methods

#### `initialize(config: LocalStorageConfig): Promise<void>`

Initialize the storage backend with configuration.

#### `save(path: string, data: Buffer | Readable): Promise<StorageResult>`

Save data to the specified path. Supports both Buffer and Stream inputs.

#### `read(path: string): Promise<Buffer>`

Read file content as a Buffer.

#### `readStream(path: string): Promise<Readable>`

Read file content as a Stream for efficient large file handling.

#### `exists(path: string): Promise<boolean>`

Check if a file or directory exists.

#### `delete(path: string): Promise<void>`

Delete a file or directory (recursively for directories).

#### `list(prefix: string): Promise<StorageEntry[]>`

List files and directories at the specified path.

### Directory Operations

#### `createDirectory(path: string): Promise<void>`

Create a directory (creates parent directories if needed).

### Metadata Operations

#### `getMetadata(path: string): Promise<StorageMetadata>`

Retrieve metadata for a file.

#### `setMetadata(path: string, metadata: StorageMetadata): Promise<void>`

Set metadata for a file.

### Storage Information

#### `getStatus(): StorageStatus`

Get current storage status and configuration.

#### `getUsage(): Promise<StorageUsage>`

Get storage usage statistics including file count and total size.

#### `validateConfig(config: unknown): boolean`

Validate configuration object.

## Storage Structure

Files are organized with optional metadata files:

```
basePath/
├── documents/
│   ├── contract.pdf
│   ├── contract.pdf.meta    # Metadata and checksum
│   └── invoice.pdf
├── transfers/
│   ├── outgoing/
│   │   └── transfer-123/
│   └── incoming/
│       └── transfer-456/
└── temp/
```

## Metadata Files

When checksums are enabled, metadata files are automatically created:

```json
{
	"hash": "sha256:abcd1234...",
	"size": 1024000,
	"timestamp": 1234567890000
}
```

## Security Features

### Path Traversal Protection

The storage implementation prevents path traversal attacks:

```typescript
// These will throw errors:
await storage.save('../../../etc/passwd', data); // ❌ Blocked
await storage.read('../../sensitive/file'); // ❌ Blocked
```

### Checksum Verification

Automatic SHA-256 hash generation for integrity verification:

```typescript
const result = await storage.save('document.pdf', data);
console.log(`Document hash: ${result.hash}`);
```

## Stream Support

Efficient handling of large files using streams:

```typescript
import { createReadStream } from 'fs';

// Save from stream
const inputStream = createReadStream('large-file.pdf');
await storage.save('documents/large-file.pdf', inputStream);

// Read as stream
const outputStream = await storage.readStream('documents/large-file.pdf');
outputStream.pipe(process.stdout);
```

## Error Handling

The storage uses typed errors from `@firmachain/firma-sign-core`:

```typescript
import { StorageError, StorageErrorCodes } from '@firmachain/firma-sign-core';

try {
	await storage.read('non-existent.pdf');
} catch (error) {
	if (error instanceof StorageError) {
		switch (error.code) {
			case StorageErrorCodes.NOT_FOUND:
				console.log('File not found');
				break;
			case StorageErrorCodes.PERMISSION_DENIED:
				console.log('Permission denied');
				break;
			case StorageErrorCodes.FILE_TOO_LARGE:
				console.log('File too large');
				break;
			default:
				console.log('Storage error:', error.message);
		}
	}
}
```

## Usage Examples

### Document Transfer Storage

```typescript
// Store outgoing transfer
const transferId = 'transfer-123';
const transferPath = `transfers/outgoing/${transferId}`;

await storage.createDirectory(transferPath);
await storage.save(`${transferPath}/document.pdf`, documentData);
await storage.save(`${transferPath}/metadata.json`, Buffer.from(JSON.stringify(metadata)));

// List transfer contents
const files = await storage.list(transferPath);
console.log('Transfer files:', files);
```

### Batch Operations

```typescript
// Save multiple documents
const documents = [
	{ path: 'batch/doc1.pdf', data: buffer1 },
	{ path: 'batch/doc2.pdf', data: buffer2 },
	{ path: 'batch/doc3.pdf', data: buffer3 },
];

const results = await Promise.all(documents.map((doc) => storage.save(doc.path, doc.data)));

// Get storage usage
const usage = await storage.getUsage();
console.log(`Files: ${usage.fileCount}, Size: ${usage.used} bytes`);
```

### With Metadata

```typescript
// Save document with metadata
await storage.save('document.pdf', documentData);
await storage.setMetadata('document.pdf', {
	contentType: 'application/pdf',
	customMetadata: {
		author: 'John Doe',
		department: 'Legal',
		confidentiality: 'high',
	},
});

// Retrieve metadata
const metadata = await storage.getMetadata('document.pdf');
console.log('Document metadata:', metadata);
```

## Capabilities

The LocalStorage implementation provides these capabilities:

```typescript
{
  maxFileSize: 100 * 1024 * 1024,      // 100MB (configurable)
  supportsStreaming: true,              // Stream support for large files
  supportsMetadata: true,               // Custom metadata support
  supportsVersioning: false,            // No version control
  supportsEncryption: false,            // No built-in encryption
  supportsConcurrentAccess: false,      // Single-process access
  supportsDirectoryListing: true,       // Directory operations
  requiredConfig: []                    // No required configuration
}
```

## Testing

Run the comprehensive test suite:

```bash
# Run tests
pnpm test

# Run tests with coverage
pnpm test:coverage

# Run tests in watch mode
pnpm test:watch
```

## Development

```bash
# Install dependencies
pnpm install

# Build the package
pnpm build

# Run in development mode
pnpm dev

# Type checking
pnpm type-check

# Linting
pnpm lint
```

## Integration with Server

This storage package is designed to be used with the Firma-Sign server:

```typescript
// In packages/server
import { LocalStorage } from '@firmachain/firma-sign-storage-local';

const storage = new LocalStorage();
await storage.initialize({
	basePath: process.env.STORAGE_PATH || '~/.firmasign/storage',
});

// Use storage in your server
app.post('/upload', async (req, res) => {
	const result = await storage.save(`uploads/${filename}`, fileData);
	res.json({ success: true, path: result.path, hash: result.hash });
});
```

## Documentation

- [API Reference](./docs/API.md) - Detailed API documentation
- [Architecture](./docs/ARCHITECTURE.md) - Storage architecture and design
- [Development Guide](./docs/DEVELOPMENT.md) - Development setup and workflow

## License

MIT © FirmaChain

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## Links

- [GitHub Repository](https://github.com/firmachain/firma-sign)
- [Core Package](https://www.npmjs.com/package/@firmachain/firma-sign-core)
- [Documentation](https://github.com/firmachain/firma-sign#readme)
