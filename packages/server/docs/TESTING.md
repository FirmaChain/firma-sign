# Server Testing Guide

## Overview

The server uses Vitest for testing, focusing on API endpoints, transport integration, and WebSocket functionality. Tests are organized by server-specific components.

## Quick Start

```bash
# Run all tests
pnpm test

# Watch mode for development
pnpm test:watch

# Coverage report
pnpm test:coverage
```

## Test Organization

```
tests/
├── api/                    # API endpoint tests
│   ├── auth.test.ts       # Authentication routes
│   ├── transfers.test.ts  # Transfer operations
│   └── transports.test.ts # Transport endpoints
├── transport/             # Transport integration
│   └── loader.test.ts     # Package loading tests
├── websocket/             # WebSocket tests
│   └── events.test.ts     # Real-time events
├── integration/           # Full flow tests
│   └── transfer-flow.test.ts
└── fixtures/              # Test data
    └── mocks.ts          # Mock packages
```

## Server-Specific Test Examples

### Testing API Routes

```typescript
// tests/api/transfers.test.ts
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { app, server } from '../../src/index';

describe('Transfer API', () => {
	afterAll(() => {
		server.close();
	});

	describe('POST /api/transfers/create', () => {
		it('should create transfer and return code', async () => {
			const res = await request(app)
				.post('/api/transfers/create')
				.send({
					documents: [{ id: 'doc-1', fileName: 'test.pdf' }],
					recipients: [{ identifier: 'test@example.com', transport: 'email' }],
				});

			expect(res.status).toBe(200);
			expect(res.body.code).toMatch(/^[A-Z0-9]{6}$/);
		});
	});
});
```

### Testing Transport Loading

```typescript
// tests/transport/loader.test.ts
import { describe, it, expect, vi } from 'vitest';
import { TransportLoader } from '../../src/transport/TransportLoader';

describe('TransportLoader', () => {
	it('should discover installed transport packages', async () => {
		const loader = new TransportLoader();

		// Mock package resolution
		vi.spyOn(loader, 'resolvePackage').mockResolvedValue('/path/to/package');

		const transport = await loader.loadTransport('@firmachain/firma-sign-transport-p2p');
		expect(transport).toBeDefined();
		expect(transport?.name).toBe('p2p');
	});

	it('should handle missing packages gracefully', async () => {
		const loader = new TransportLoader();
		const transport = await loader.loadTransport('@firmachain/non-existent');
		expect(transport).toBeNull();
	});
});
```

### Testing WebSocket Events

```typescript
// tests/websocket/events.test.ts
import { describe, it, expect } from 'vitest';
import { io, Socket } from 'socket.io-client';

describe('WebSocket Server', () => {
	let socket: Socket;

	beforeAll((done) => {
		socket = io('http://localhost:8080');
		socket.on('connect', done);
	});

	afterAll(() => {
		socket.disconnect();
	});

	it('should broadcast transfer updates', (done) => {
		socket.on('transfer:update', (data) => {
			expect(data.transferId).toBeDefined();
			expect(data.status).toBeDefined();
			done();
		});

		// Trigger update via API or directly
		socket.emit('subscribe', { transferId: 'test-123' });
	});
});
```

### Testing Storage Integration

```typescript
// tests/storage/integration.test.ts
import { describe, it, expect } from 'vitest';
import { StorageManager } from '../../src/storage/StorageManager';

describe('StorageManager Integration', () => {
	let storage: StorageManager;

	beforeEach(() => {
		// Use in-memory database for tests
		storage = new StorageManager(':memory:');
	});

	it('should coordinate database and file storage', async () => {
		const transfer = await storage.createTransfer({
			transferId: 'test-123',
			type: 'outgoing',
			documents: [{ id: 'doc-1', fileName: 'test.pdf' }],
		});

		expect(transfer.id).toBe('test-123');

		// Verify database entry
		const retrieved = await storage.getTransfer('test-123');
		expect(retrieved).toBeDefined();
	});
});
```

## Mocking Strategies

### Mock Transport Packages

```typescript
// tests/fixtures/mocks.ts
export const mockP2PTransport = {
	name: 'p2p',
	version: '1.0.0',
	capabilities: {
		maxFileSize: 100000000,
		supportsBatch: true,
		supportsEncryption: true,
	},
	initialize: vi.fn(),
	send: vi.fn().mockResolvedValue({ success: true }),
	receive: vi.fn(),
	shutdown: vi.fn(),
	getStatus: vi.fn(() => ({ connected: true })),
	validateConfig: vi.fn(() => true),
};

// Use in tests
vi.mock('@firmachain/firma-sign-transport-p2p', () => ({
	P2PTransport: class {
		constructor() {
			return mockP2PTransport;
		}
	},
}));
```

### Mock Storage Packages

```typescript
// Mock database package
vi.mock('@firmachain/firma-sign-database-sqlite', () => ({
	SQLiteDatabase: class {
		initialize = vi.fn();
		getRepository = vi.fn(() => ({
			create: vi.fn(),
			findById: vi.fn(),
			update: vi.fn(),
		}));
	},
}));

// Mock storage package
vi.mock('@firmachain/firma-sign-storage-local', () => ({
	LocalStorage: class {
		initialize = vi.fn();
		save = vi.fn().mockResolvedValue({ path: 'test', hash: 'abc123' });
		read = vi.fn().mockResolvedValue(Buffer.from('content'));
	},
}));
```

## Integration Testing

### Complete Transfer Flow

```typescript
// tests/integration/transfer-flow.test.ts
describe('Transfer Flow E2E', () => {
	it('should complete transfer with code authentication', async () => {
		// 1. Create transfer
		const createRes = await request(app)
			.post('/api/transfers/create')
			.send({
				documents: [{ id: 'doc-1', fileName: 'test.pdf' }],
				recipients: [{ identifier: 'test@example.com', transport: 'email' }],
			});

		const { transferId, code } = createRes.body;

		// 2. Connect with code
		const authRes = await request(app).post('/api/auth/connect').send({ code });

		expect(authRes.body.sessionToken).toBeDefined();
		const token = authRes.body.sessionToken;

		// 3. Get transfer
		const getRes = await request(app)
			.get(`/api/transfers/${transferId}`)
			.set('Authorization', `Bearer ${token}`);

		expect(getRes.body.transferId).toBe(transferId);

		// 4. Sign document
		const signRes = await request(app)
			.post(`/api/transfers/${transferId}/sign`)
			.set('Authorization', `Bearer ${token}`)
			.send({
				signatures: [
					{
						documentId: 'doc-1',
						signature: 'base64sig',
						status: 'signed',
					},
				],
			});

		expect(signRes.status).toBe(200);
	});
});
```

## Test Configuration

### Vitest Config

```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
	test: {
		globals: true,
		environment: 'node',
		setupFiles: ['./tests/setup.ts'],
		coverage: {
			provider: 'v8',
			reporter: ['text', 'html'],
			exclude: ['tests/**', '*.config.ts'],
		},
	},
});
```

### Test Setup

```typescript
// tests/setup.ts
import { beforeAll, afterAll } from 'vitest';

beforeAll(() => {
	// Set test environment
	process.env.NODE_ENV = 'test';
	process.env.LOG_LEVEL = 'error';
	process.env.STORAGE_PATH = ':memory:';
});

afterAll(() => {
	// Cleanup
});
```

## Coverage Goals

Aim for these coverage targets:

- API Routes: 90%+
- Transport Manager: 85%+
- Storage Manager: 85%+
- WebSocket: 80%+
- Overall: 85%+

## Running Specific Tests

```bash
# Test only API routes
pnpm test tests/api

# Test transport loading
pnpm test tests/transport

# Run single test file
pnpm test tests/api/auth.test.ts

# Run with pattern matching
pnpm test --grep "transfer"
```

## CI Integration

```yaml
# .github/workflows/test.yml
name: Server Tests
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    defaults:
      run:
        working-directory: packages/server

    steps:
      - uses: actions/checkout@v3
      - uses: pnpm/action-setup@v2
      - uses: actions/setup-node@v3
        with:
          node-version: 18
          cache: 'pnpm'

      - run: pnpm install
      - run: pnpm test:coverage

      - uses: codecov/codecov-action@v3
        with:
          files: ./packages/server/coverage/lcov.info
```

## Debugging Tests

```bash
# Run single test with verbose output
pnpm test --reporter=verbose tests/api/transfers.test.ts

# Debug with Node inspector
node --inspect-brk ./node_modules/vitest/vitest.mjs --run
```

## Best Practices

1. **Test Isolation**: Each test should be independent
2. **Mock External Dependencies**: Don't rely on actual packages in unit tests
3. **Use Fixtures**: Reuse test data across tests
4. **Test Error Cases**: Include failure scenarios
5. **Clean Up**: Close servers and connections after tests

## Common Issues

### Port Already in Use

Solution: Use dynamic ports in tests:

```typescript
const server = app.listen(0); // Random available port
const port = server.address().port;
```

### Database Lock

Solution: Use in-memory database for tests:

```typescript
new StorageManager(':memory:');
```

### Transport Not Found

Solution: Mock transport packages in tests instead of installing them.

## Related Documentation

- [Development Guide](./DEVELOPMENT.md)
- [API Reference](./API.md)
- [Troubleshooting](./TROUBLESHOOTING.md)
