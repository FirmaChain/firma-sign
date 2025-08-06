# Database Architecture for Firma-Sign

## Overview

The Firma-Sign system now supports multiple database implementations through a common interface defined in `@firmachain/firma-sign-core`. This allows the server package and other components to use different database backends (SQLite, PostgreSQL, MongoDB, etc.) without changing application code.

## Architecture

### 1. Database Interface (`@firmachain/firma-sign-core`)

The core package defines the database contracts that all implementations must follow:

```typescript
// Main database interface
interface Database {
	name: string;
	version: string;
	capabilities: DatabaseCapabilities;

	initialize(config: DatabaseConfig): Promise<void>;
	shutdown(): Promise<void>;

	getRepository<T>(entityName: string): Repository<T>;
	transaction<T>(fn: (tx: Transaction) => Promise<T>): Promise<T>;

	getStatus(): DatabaseStatus;
	migrate(): Promise<void>;
}

// Repository pattern for entity operations
interface Repository<T> {
	findById(id: string): Promise<T | null>;
	findAll(options?: QueryOptions): Promise<T[]>;
	find(criteria: Partial<T>, options?: QueryOptions): Promise<T[]>;
	create(data: Partial<T>): Promise<T>;
	update(id: string, data: Partial<T>): Promise<T | null>;
	delete(id: string): Promise<boolean>;
	// ... batch operations, counting, etc.
}
```

### 2. SQLite Implementation (`@firmachain/firma-sign-database-sqlite`)

The SQLite implementation provides:

- Zero-configuration database
- File-based storage
- Full ACID compliance
- Transaction support
- Suitable for development and single-server deployments

```typescript
import { SQLiteDatabase } from '@firmachain/firma-sign-database-sqlite';

const database = new SQLiteDatabase();
await database.initialize({
	database: './firma-sign.db',
});
```

### 3. Entity Definitions

The core package defines standard entities used across all implementations:

- **TransferEntity**: Document transfer records
- **DocumentEntity**: Individual documents in transfers
- **RecipientEntity**: Transfer recipients

## Migration Path

### From Server's Built-in Database

The server package previously had SQLite tightly coupled. Here's how to migrate:

#### Before (Tightly Coupled):

```typescript
// server/src/storage/StorageManager.ts
import { DatabaseConnection } from '../database/Database';

class StorageManager {
	private dbConnection: DatabaseConnection;

	constructor() {
		this.dbConnection = DatabaseConnection.getInstance(dbPath);
	}
}
```

#### After (Using Database Interface):

```typescript
// server/src/storage/StorageManager.ts
import { Database } from '@firmachain/firma-sign-core';
import { SQLiteDatabase } from '@firmachain/firma-sign-database-sqlite';

class StorageManager {
	private database: Database;

	constructor(database?: Database) {
		// Use provided database or default to SQLite
		this.database = database || new SQLiteDatabase();
	}

	async initialize() {
		await this.database.initialize({
			database: path.join(this.storagePath, 'firma-sign.db'),
		});
	}
}
```

## Creating New Database Implementations

### PostgreSQL Example

```typescript
// @firmachain/firma-sign-database-postgres
import { Database, DatabaseCapabilities } from '@firmachain/firma-sign-core';
import { Pool } from 'pg';

export class PostgreSQLDatabase implements Database {
	name = 'postgresql';
	version = '1.0.0';
	capabilities: DatabaseCapabilities = {
		supportsTransactions: true,
		supportsNestedTransactions: true,
		supportsFullTextSearch: true,
		supportsJSONFields: true,
		supportsConcurrentConnections: true,
		supportsReplication: true,
		maxConnectionPoolSize: 20,
		requiredConfig: ['host', 'port', 'database', 'username', 'password'],
	};

	private pool?: Pool;

	async initialize(config: DatabaseConfig): Promise<void> {
		this.pool = new Pool({
			host: config.host,
			port: config.port,
			database: config.database,
			user: config.username,
			password: config.password,
			max: config.poolSize || 20,
		});

		// Create tables if needed
		await this.migrate();
	}

	// ... implement other methods
}
```

### MongoDB Example

```typescript
// @firmachain/firma-sign-database-mongodb
import { Database } from '@firmachain/firma-sign-core';
import { MongoClient, Db } from 'mongodb';

export class MongoDatabase implements Database {
	name = 'mongodb';
	version = '1.0.0';

	private client?: MongoClient;
	private db?: Db;

	async initialize(config: DatabaseConfig): Promise<void> {
		const url =
			config.connectionString || `mongodb://${config.host}:${config.port}/${config.database}`;

		this.client = new MongoClient(url);
		await this.client.connect();
		this.db = this.client.db(config.database);

		// Create collections and indexes
		await this.migrate();
	}

	// ... implement other methods
}
```

## Configuration Examples

### Development (SQLite)

```typescript
const database = new SQLiteDatabase();
await database.initialize({
	database: './dev.db',
});
```

### Production (PostgreSQL)

```typescript
const database = new PostgreSQLDatabase();
await database.initialize({
	host: 'db.example.com',
	port: 5432,
	database: 'firma_sign',
	username: process.env.DB_USER,
	password: process.env.DB_PASS,
	poolSize: 20,
	ssl: true,
});
```

### Cloud (MongoDB)

```typescript
const database = new MongoDatabase();
await database.initialize({
	connectionString: process.env.MONGODB_URI,
	database: 'firma-sign',
});
```

## Benefits of This Architecture

1. **Flexibility**: Switch databases without changing application code
2. **Testability**: Easy to mock database for testing
3. **Scalability**: Start with SQLite, migrate to PostgreSQL when needed
4. **Maintainability**: Database logic separated from business logic
5. **Extensibility**: Add new database types easily

## Package Structure

```
packages/
├── @firmachain/
│   ├── firma-sign-core/           # Database interfaces
│   │   └── src/interfaces/
│   │       └── database.ts        # Database contracts
│   ├── firma-sign-database-sqlite/  # SQLite implementation
│   ├── firma-sign-database-postgres/ # PostgreSQL (future)
│   └── firma-sign-database-mongodb/  # MongoDB (future)
└── server/                         # Uses database interface
    └── src/
        └── storage/
            └── StorageManager.ts   # Database-agnostic
```

## Next Steps

1. **Refactor Server Package**: Update server to use database interface
2. **Add PostgreSQL Support**: Create PostgreSQL implementation
3. **Add MongoDB Support**: Create MongoDB implementation
4. **Migration Tools**: Create tools to migrate data between databases
5. **Performance Benchmarks**: Compare different database implementations

## Example Usage in Server

```typescript
// server/src/index.ts
import { Database } from '@firmachain/firma-sign-core';
import { SQLiteDatabase } from '@firmachain/firma-sign-database-sqlite';
import { PostgreSQLDatabase } from '@firmachain/firma-sign-database-postgres';

// Choose database based on environment
const database: Database =
	process.env.DATABASE_TYPE === 'postgres' ? new PostgreSQLDatabase() : new SQLiteDatabase();

// Initialize with config
await database.initialize({
	...getDatabaseConfig(),
});

// Use in storage manager
const storageManager = new StorageManager(database);
```

## Testing

```typescript
// Easy to mock for testing
class MockDatabase implements Database {
	// ... mock implementation
}

const storage = new StorageManager(new MockDatabase());
```

## Conclusion

This database abstraction provides the flexibility needed for Firma-Sign to scale from development to production, supporting different deployment scenarios while maintaining clean, testable code.
