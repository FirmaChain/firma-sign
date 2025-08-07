# @firmachain/firma-sign-database-sqlite

SQLite database implementation for the Firma-Sign document signing system.

## Installation

```bash
npm install @firmachain/firma-sign-database-sqlite
```

## Overview

This package provides a SQLite implementation of the Firma-Sign database interface. It offers a lightweight, file-based database solution perfect for development, testing, and single-server deployments.

## Features

- **Full ACID compliance** with transaction support
- **Zero configuration** - works out of the box
- **File-based storage** - no server required
- **Full-text search** support
- **JSON field support** for flexible metadata
- **Automatic schema creation** and migration
- **Type-safe repositories** for all entities

## Usage

### Basic Setup

```typescript
import { SQLiteDatabase } from '@firmachain/firma-sign-database-sqlite';

// Create database instance
const database = new SQLiteDatabase();

// Initialize with configuration
await database.initialize({
	database: '/path/to/firma-sign.db',
});

// Get repositories
const transferRepo = database.getRepository<TransferEntity>('Transfer');
const documentRepo = database.getRepository<DocumentEntity>('Document');
const recipientRepo = database.getRepository<RecipientEntity>('Recipient');
```

### Repository Operations

```typescript
// Create a transfer
const transfer = await transferRepo.create({
	type: 'outgoing',
	status: 'pending',
	transportType: 'p2p',
	metadata: { deadline: '2024-12-31' },
});

// Find transfers
const outgoingTransfers = await transferRepo.find({ type: 'outgoing' });
const recentTransfers = await transferRepo.findAll({
	orderBy: { createdAt: 'desc' },
	limit: 10,
});

// Update transfer
await transferRepo.update(transfer.id, {
	status: 'completed',
});

// Delete transfer
await transferRepo.delete(transfer.id);
```

### Transactions

```typescript
// Execute operations in a transaction
await database.transaction(async (tx) => {
	const transferRepo = tx.getRepository<TransferEntity>('Transfer');
	const documentRepo = tx.getRepository<DocumentEntity>('Document');

	// Create transfer
	const transfer = await transferRepo.create({
		type: 'outgoing',
		status: 'pending',
	});

	// Create documents
	await documentRepo.createMany([
		{
			transferId: transfer.id,
			fileName: 'doc1.pdf',
			fileSize: 1024,
			fileHash: 'hash1',
		},
		{
			transferId: transfer.id,
			fileName: 'doc2.pdf',
			fileSize: 2048,
			fileHash: 'hash2',
		},
	]);

	// If any operation fails, all changes are rolled back
});
```

### Advanced Queries

```typescript
// Count entities
const pendingCount = await transferRepo.count({ status: 'pending' });

// Check existence
const exists = await transferRepo.exists({ id: 'transfer-123' });

// Batch operations
await documentRepo.updateMany({ status: 'pending' }, { status: 'expired' });

await recipientRepo.deleteMany({ status: 'cancelled' });
```

## Configuration

### Configuration Options

```typescript
interface DatabaseConfig {
	database?: string; // Path to database file (default: ./firma-sign.db)
	connectionString?: string; // Alternative: SQLite connection string
	timeout?: number; // Query timeout in milliseconds
	options?: {
		wal?: boolean; // Use WAL mode (default: true)
		foreignKeys?: boolean; // Enforce foreign keys (default: true)
	};
}
```

### Examples

```typescript
// Development configuration
await database.initialize({
	database: './dev.db',
});

// Production configuration
await database.initialize({
	database: '/var/lib/firma-sign/production.db',
	options: {
		wal: true,
		foreignKeys: true,
	},
});

// In-memory database for testing
await database.initialize({
	database: ':memory:',
});
```

## Database Schema

The SQLite implementation creates the following tables:

### transfers

- `id` (TEXT PRIMARY KEY)
- `type` (TEXT) - 'incoming' or 'outgoing'
- `status` (TEXT)
- `sender_id`, `sender_name`, `sender_email`, `sender_public_key` (TEXT)
- `transport_type` (TEXT)
- `transport_config` (TEXT/JSON)
- `metadata` (TEXT/JSON)
- `created_at`, `updated_at` (INTEGER/Unix timestamp)

### documents

- `id` (TEXT PRIMARY KEY)
- `transfer_id` (TEXT FOREIGN KEY)
- `file_name` (TEXT)
- `file_size` (INTEGER)
- `file_hash` (TEXT)
- `status` (TEXT)
- `signed_at` (INTEGER)
- `signed_by` (TEXT)
- `blockchain_tx_original`, `blockchain_tx_signed` (TEXT)
- `created_at` (INTEGER)

### recipients

- `id` (TEXT PRIMARY KEY)
- `transfer_id` (TEXT FOREIGN KEY)
- `identifier` (TEXT)
- `transport` (TEXT)
- `status` (TEXT)
- `preferences` (TEXT/JSON)
- `notified_at`, `viewed_at`, `signed_at` (INTEGER)
- `created_at` (INTEGER)

## Performance

### Optimization Tips

1. **Use transactions** for bulk operations
2. **Enable WAL mode** for better concurrency
3. **Create appropriate indexes** for your queries
4. **Use VACUUM** periodically to optimize file size

### Benchmarks

- Insert: ~10,000 records/second
- Query with index: ~100,000 records/second
- Transaction rollback: Instant
- Database size: ~1KB per transfer with documents

## Migration from Server Package

If you're migrating from the server package's built-in database:

```typescript
// Old (server package)
import { StorageManager } from '../server/storage';
const storage = new StorageManager();

// New (database package)
import { SQLiteDatabase } from '@firmachain/firma-sign-database-sqlite';
const database = new SQLiteDatabase();
await database.initialize({ database: './firma-sign.db' });

// The database schema is compatible, so existing data is preserved
```

## Development

```bash
# Install dependencies
pnpm install

# Build package
pnpm build

# Run tests
pnpm test

# Type checking
pnpm type-check
```

## Documentation

- [API Reference](./docs/API.md) - Detailed API documentation
- [Architecture](./docs/ARCHITECTURE.md) - Database architecture and design
- [Development Guide](./docs/DEVELOPMENT.md) - Development setup and workflow

## License

MIT © FirmaChain

## Support

For issues and questions, please visit the [GitHub repository](https://github.com/firmachain/firma-sign).
