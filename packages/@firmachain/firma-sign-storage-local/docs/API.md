# API Reference

## Class: LocalStorage

The main storage implementation for local filesystem operations.

```typescript
class LocalStorage implements Storage {
	constructor(basePath?: string);
	async initialize(config: StorageConfig): Promise<void>;
	async shutdown(): Promise<void>;
	async save(path: string, data: Buffer | Readable): Promise<StorageResult>;
	async read(path: string): Promise<Buffer>;
	async readStream(path: string): Promise<Readable>;
	async exists(path: string): Promise<boolean>;
	async delete(path: string): Promise<void>;
	async list(prefix: string): Promise<StorageEntry[]>;
	async createDirectory(path: string): Promise<void>;
	getStatus(): StorageStatus;
	validateConfig(config: unknown): config is StorageConfig;
}
```

### Properties

#### name

```typescript
readonly name: string = 'local'
```

#### version

```typescript
readonly version: string = '1.0.0'
```

#### capabilities

```typescript
readonly capabilities: StorageCapabilities = {
  maxFileSize: 5 * 1024 * 1024 * 1024, // 5GB
  supportsStreaming: true,
  supportsMetadata: true,
  supportsVersioning: false,
  supportsEncryption: false,
  supportsConcurrentAccess: true,
  supportsDirectoryListing: true,
  requiredConfig: ['basePath']
}
```

### Methods

#### initialize(config)

Initialize the storage with configuration.

```typescript
await storage.initialize({
	basePath: '/var/firma-sign/storage',
	permissions: 0o755,
});
```

#### save(path, data)

Save data to a file.

```typescript
const result = await storage.save('transfers/outgoing/doc.pdf', Buffer.from('content'));
```

#### read(path)

Read file contents as Buffer.

```typescript
const data = await storage.read('transfers/outgoing/doc.pdf');
```

#### readStream(path)

Read file as stream for large files.

```typescript
const stream = await storage.readStream('large-file.pdf');
stream.pipe(response);
```

#### exists(path)

Check if file or directory exists.

```typescript
const exists = await storage.exists('transfers/outgoing/doc.pdf');
```

#### delete(path)

Delete a file or empty directory.

```typescript
await storage.delete('transfers/outgoing/doc.pdf');
```

#### list(prefix)

List files and directories.

```typescript
const entries = await storage.list('transfers/outgoing');
entries.forEach((entry) => {
	console.log(`${entry.type}: ${entry.path} (${entry.size} bytes)`);
});
```

#### createDirectory(path)

Create a directory recursively.

```typescript
await storage.createDirectory('transfers/outgoing/2024/01');
```

## Interfaces

### StorageConfig

```typescript
interface StorageConfig {
	basePath: string;
	permissions?: number;
	encoding?: BufferEncoding;
}
```

### StorageResult

```typescript
interface StorageResult {
	success: boolean;
	path: string;
	size: number;
	timestamp: number;
	metadata?: Record<string, unknown>;
}
```

### StorageEntry

```typescript
interface StorageEntry {
	path: string;
	type: 'file' | 'directory';
	size: number;
	lastModified: number;
	metadata?: Record<string, unknown>;
}
```

### StorageStatus

```typescript
interface StorageStatus {
	available: boolean;
	totalSpace?: number;
	freeSpace?: number;
	usedSpace?: number;
}
```

## Error Handling

The storage implementation throws `StorageError` for various error conditions:

```typescript
try {
	await storage.read('non-existent.pdf');
} catch (error) {
	if (error instanceof StorageError) {
		console.error(`Storage error: ${error.code} - ${error.message}`);
	}
}
```

### Error Codes

- `ENOENT` - File or directory not found
- `EACCES` - Permission denied
- `ENOSPC` - No space left on device
- `EISDIR` - Is a directory (expected file)
- `ENOTDIR` - Not a directory (expected directory)

## Usage Examples

### Basic File Operations

```typescript
import { LocalStorage } from '@firmachain/firma-sign-storage-local';

const storage = new LocalStorage();
await storage.initialize({ basePath: './storage' });

// Save a file
await storage.save('document.pdf', pdfBuffer);

// Check if exists
if (await storage.exists('document.pdf')) {
	// Read the file
	const content = await storage.read('document.pdf');

	// Delete the file
	await storage.delete('document.pdf');
}
```

### Streaming Large Files

```typescript
// Save large file with stream
const readStream = fs.createReadStream('large-video.mp4');
await storage.save('videos/large-video.mp4', readStream);

// Read large file as stream
const stream = await storage.readStream('videos/large-video.mp4');
stream.pipe(outputStream);
```

### Directory Operations

```typescript
// Create nested directories
await storage.createDirectory('transfers/2024/01/15');

// List directory contents
const entries = await storage.list('transfers/2024');
for (const entry of entries) {
	if (entry.type === 'directory') {
		console.log(`Dir: ${entry.path}`);
	} else {
		console.log(`File: ${entry.path} (${entry.size} bytes)`);
	}
}
```
