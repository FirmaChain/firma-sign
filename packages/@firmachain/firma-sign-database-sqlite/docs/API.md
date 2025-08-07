# API Reference

## Classes

### SQLiteDatabase

Main database implementation that implements the Database interface from @firmachain/firma-sign-core.

```typescript
class SQLiteDatabase implements Database {
	constructor(dbPath?: string);
	async initialize(config: DatabaseConfig): Promise<void>;
	async shutdown(): Promise<void>;
	createTransaction(): Transaction;
	getRepository<T>(entityName: string): Repository<T>;
}
```

### SQLiteRepository

Base repository class implementing the Repository interface.

```typescript
class SQLiteRepository<T> implements Repository<T> {
	create(entity: Partial<T>): T;
	update(id: string, entity: Partial<T>): T | null;
	delete(id: string): boolean;
	findById(id: string): T | null;
	findAll(): T[];
	findBy(criteria: Partial<T>): T[];
	count(criteria?: Partial<T>): number;
}
```

### SQLiteTransaction

Transaction management for atomic operations.

```typescript
class SQLiteTransaction implements Transaction {
	begin(): void;
	commit(): void;
	rollback(): void;
	execute<T>(callback: () => T): T;
}
```

## Repositories

### TransferRepository

Repository for managing Transfer entities.

```typescript
class TransferRepository extends SQLiteRepository<TransferEntity> {
	findByType(type: string): TransferEntity[];
	findByStatus(status: string): TransferEntity[];
	findRecent(limit: number): TransferEntity[];
}
```

### DocumentRepository

Repository for managing Document entities.

```typescript
class DocumentRepository extends SQLiteRepository<DocumentEntity> {
	findByTransferId(transferId: string): DocumentEntity[];
	findByStatus(status: string): DocumentEntity[];
	updateStatus(id: string, status: string): DocumentEntity | null;
}
```

### RecipientRepository

Repository for managing Recipient entities.

```typescript
class RecipientRepository extends SQLiteRepository<RecipientEntity> {
	findByTransferId(transferId: string): RecipientEntity[];
	findByIdentifier(identifier: string): RecipientEntity[];
	updateStatus(id: string, status: string): RecipientEntity | null;
}
```

## Entities

### TransferEntity

```typescript
interface TransferEntity {
	id: string;
	type: string;
	status: string;
	senderId?: string;
	senderName?: string;
	senderEmail?: string;
	senderPublicKey?: string;
	transportType: string;
	transportConfig?: any;
	metadata?: any;
	createdAt: Date;
	updatedAt: Date;
}
```

### DocumentEntity

```typescript
interface DocumentEntity {
	id: string;
	transferId: string;
	fileName: string;
	fileSize?: number;
	mimeType?: string;
	hash?: string;
	status: string;
	signedBy?: string;
	signedAt?: Date;
	metadata?: any;
	createdAt: Date;
	updatedAt: Date;
}
```

### RecipientEntity

```typescript
interface RecipientEntity {
	id: string;
	transferId: string;
	identifier: string;
	name?: string;
	transport: string;
	status: string;
	preferences?: any;
	signedAt?: Date;
	createdAt: Date;
	updatedAt: Date;
}
```

## Usage Examples

### Basic Usage

```typescript
import { SQLiteDatabase } from '@firmachain/firma-sign-database-sqlite';

const database = new SQLiteDatabase('./firma-sign.db');
await database.initialize({
	maxConnections: 10,
	enableWAL: true,
});

const transferRepo = database.getRepository<TransferEntity>('transfers');
const transfer = transferRepo.create({
	type: 'outgoing',
	status: 'pending',
	transportType: 'p2p',
});
```

### Transaction Usage

```typescript
const transaction = database.createTransaction();

try {
	transaction.begin();

	const transfer = transferRepo.create({
		/* ... */
	});
	const document = documentRepo.create({
		transferId: transfer.id,
		/* ... */
	});

	transaction.commit();
} catch (error) {
	transaction.rollback();
	throw error;
}
```
