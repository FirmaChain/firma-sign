# Testing Guide

## Overview

The server package includes comprehensive test coverage for all database operations, repositories, and storage management functionality.

## Test Structure

```
src/__tests__/
├── utils/
│   └── testDb.ts           # Test utilities and helpers
├── database/
│   ├── Database.test.ts    # DatabaseConnection tests
│   └── repositories/
│       ├── TransferRepository.test.ts
│       ├── DocumentRepository.test.ts
│       └── RecipientRepository.test.ts
├── database/
│   └── TransactionManager.test.ts
└── storage/
    └── StorageManager.test.ts  # Integration tests
```

## Running Tests

### All Tests
```bash
# Run all tests
pnpm test

# Run tests in watch mode
pnpm test:watch

# Run tests with coverage
pnpm test:coverage

# Run tests with UI
pnpm test:ui
```

### Specific Test Suites
```bash
# Run only database tests
pnpm test:db

# Run only storage tests  
pnpm test:storage

# Run integration tests
pnpm test:integration
```

## Test Coverage

### Database Layer
- **DatabaseConnection**: 100% coverage
  - Table initialization
  - Index creation
  - Foreign key constraints
  - Transaction support
  - Connection management

- **Repositories**: ~95% coverage each
  - CRUD operations
  - Custom query methods
  - Edge cases and error handling
  - Transaction support

- **TransactionManager**: 100% coverage
  - Atomic operations
  - Rollback on errors
  - Complex workflows

### Storage Layer
- **StorageManager**: ~90% coverage
  - File system operations
  - Database integration
  - Document I/O
  - Error handling

## Writing Tests

### Test Utilities

```typescript
import { createTestDatabase, cleanupTestDatabase, seedTestData } from '../utils/testDb';

// Create test database
const db = createTestDatabase();

// Seed with test data
await seedTestData(db);

// Clean up after tests
cleanupTestDatabase(db);
```

### Repository Tests Example

```typescript
describe('TransferRepository', () => {
  let db: DatabaseConnection;
  let repository: TransferRepository;

  beforeEach(() => {
    db = createTestDatabase();
    repository = new TransferRepository(db);
  });

  afterEach(() => {
    cleanupTestDatabase(db);
  });

  it('should create a transfer', () => {
    const transfer = repository.create({
      type: 'outgoing',
      transportType: 'p2p'
    });
    
    expect(transfer).toBeDefined();
  });
});
```

### Integration Tests Example

```typescript
describe('StorageManager', () => {
  let storageManager: StorageManager;
  let testStoragePath: string;

  beforeEach(async () => {
    testStoragePath = path.join(os.tmpdir(), `test-${Date.now()}`);
    storageManager = new StorageManager(testStoragePath);
  });

  afterEach(async () => {
    storageManager.close();
    await fs.rm(testStoragePath, { recursive: true });
  });
});
```

## Test Data

The `seedTestData` function provides consistent test data:
- 2 transfers (1 incoming, 1 outgoing)
- 2 documents per transfer
- 2 recipients per transfer
- Various status states

## Best Practices

1. **Isolation**: Each test uses its own database instance
2. **Cleanup**: Always clean up resources after tests
3. **Atomicity**: Test transactions and rollbacks
4. **Edge Cases**: Test boundary conditions and errors
5. **Type Safety**: Use proper TypeScript types

## Debugging Tests

```bash
# Run specific test file
pnpm vitest run src/__tests__/database/Database.test.ts

# Run tests matching pattern
pnpm vitest -t "should create transfer"

# Debug with Node inspector
node --inspect-brk ./node_modules/.bin/vitest run
```

## CI/CD Integration

The test suite is designed for CI/CD pipelines:
- Fast execution (~5-10 seconds)
- Isolated database instances
- No external dependencies
- Deterministic results

## Coverage Goals

- Minimum 80% code coverage
- 100% coverage for critical paths
- All error cases tested
- Edge cases documented