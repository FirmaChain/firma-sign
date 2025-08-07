# Architecture

## Overview

The SQLite database package provides a robust, file-based database implementation for the Firma-Sign system. It implements the Database interface from @firmachain/firma-sign-core and provides persistence for transfers, documents, and recipients.

## Design Principles

### 1. Repository Pattern

- Clean separation between data access and business logic
- Type-safe entity management
- Consistent CRUD operations across all entities

### 2. Transaction Support

- ACID compliance for data integrity
- Atomic operations for complex workflows
- Rollback capability for error recovery

### 3. Performance Optimization

- WAL (Write-Ahead Logging) mode for concurrent access
- Prepared statements for query efficiency
- Connection pooling for resource management

## Component Architecture

```
SQLiteDatabase (Main Entry Point)
├── Connection Management
├── Schema Migration
├── Repository Factory
└── Transaction Manager
    ├── SQLiteRepository (Base)
    │   ├── TransferRepository
    │   ├── DocumentRepository
    │   └── RecipientRepository
    └── SQLiteTransaction
```

## Database Schema

### Tables Structure

```sql
-- Transfers table
CREATE TABLE transfers (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL,
  status TEXT NOT NULL,
  senderId TEXT,
  senderName TEXT,
  senderEmail TEXT,
  senderPublicKey TEXT,
  transportType TEXT NOT NULL,
  transportConfig TEXT,
  metadata TEXT,
  createdAt INTEGER NOT NULL,
  updatedAt INTEGER NOT NULL
);

-- Documents table
CREATE TABLE documents (
  id TEXT PRIMARY KEY,
  transferId TEXT NOT NULL,
  fileName TEXT NOT NULL,
  fileSize INTEGER,
  mimeType TEXT,
  hash TEXT,
  status TEXT NOT NULL,
  signedBy TEXT,
  signedAt INTEGER,
  metadata TEXT,
  createdAt INTEGER NOT NULL,
  updatedAt INTEGER NOT NULL,
  FOREIGN KEY (transferId) REFERENCES transfers(id)
);

-- Recipients table
CREATE TABLE recipients (
  id TEXT PRIMARY KEY,
  transferId TEXT NOT NULL,
  identifier TEXT NOT NULL,
  name TEXT,
  transport TEXT NOT NULL,
  status TEXT NOT NULL,
  preferences TEXT,
  signedAt INTEGER,
  createdAt INTEGER NOT NULL,
  updatedAt INTEGER NOT NULL,
  FOREIGN KEY (transferId) REFERENCES transfers(id)
);
```

### Indexes

```sql
CREATE INDEX idx_transfers_type ON transfers(type);
CREATE INDEX idx_transfers_status ON transfers(status);
CREATE INDEX idx_documents_transferId ON documents(transferId);
CREATE INDEX idx_documents_status ON documents(status);
CREATE INDEX idx_recipients_transferId ON recipients(transferId);
CREATE INDEX idx_recipients_identifier ON recipients(identifier);
```

## Data Flow

### Write Operations

1. Application calls repository method
2. Repository validates input data
3. SQL statement prepared and executed
4. Entity timestamps updated automatically
5. Result returned to application

### Read Operations

1. Application queries repository
2. Repository builds SQL query
3. Database executes query with indexes
4. Results mapped to entity objects
5. Typed entities returned to application

## Error Handling

### Database Errors

- Connection failures handled with retry logic
- Constraint violations returned as specific errors
- Transaction conflicts resolved with rollback

### Data Validation

- Entity validation before persistence
- Type checking at repository level
- Foreign key constraints enforced

## Performance Considerations

### Optimization Strategies

- WAL mode for better concurrency
- Statement caching for repeated queries
- Batch operations for bulk inserts
- Index usage for common queries

### Connection Management

- Single writer, multiple readers
- Connection pooling for efficiency
- Automatic cleanup on shutdown

## Migration Strategy

### Schema Versioning

- Version tracked in database
- Incremental migration scripts
- Rollback capability for downgrades

### Data Migration

- Backward compatibility maintained
- Data transformation utilities
- Zero-downtime migrations

## Security

### Data Protection

- SQL injection prevention via prepared statements
- Input sanitization at repository level
- Secure default configurations

### Access Control

- File-based permissions
- Database encryption support (optional)
- Audit logging capability

## Testing Strategy

### Unit Tests

- Repository method testing
- Transaction rollback scenarios
- Entity validation tests

### Integration Tests

- Multi-repository transactions
- Database migration tests
- Performance benchmarks

## Future Enhancements

### Planned Features

1. Full-text search capability
2. Database encryption
3. Replication support
4. Advanced query builder

### Scalability Paths

- PostgreSQL adapter option
- Horizontal sharding strategy
- Read replica support
