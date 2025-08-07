# Server Development Guide

## Prerequisites

- Node.js 18+
- pnpm 8+
- See main [project setup](../../../README.md) for workspace installation

## Quick Start

```bash
# From project root
pnpm install

# Navigate to server
cd packages/server

# Copy environment config
cp .env.example .env

# Start development server
pnpm dev
```

## Development Scripts

| Command           | Description                       |
| ----------------- | --------------------------------- |
| `pnpm dev`        | Start with hot reload (tsx watch) |
| `pnpm start`      | Start production server           |
| `pnpm build`      | Build TypeScript                  |
| `pnpm test`       | Run tests                         |
| `pnpm lint`       | Run ESLint                        |
| `pnpm type-check` | Check TypeScript types            |

## Server Structure

```
src/
├── api/                 # API routes
│   ├── routes/         # Route handlers
│   └── middleware/     # Express middleware
├── config/             # Configuration management
├── storage/            # Storage integration
├── transport/          # Transport management
├── websocket/          # WebSocket server
├── utils/              # Utilities
├── types/              # TypeScript types
└── index.ts            # Entry point
```

## Working with Packages

The server integrates with several packages. See their documentation:

- **Database**: [@firmachain/firma-sign-database-sqlite](../../@firmachain/firma-sign-database-sqlite/README.md)
- **Storage**: [@firmachain/firma-sign-storage-local](../../@firmachain/firma-sign-storage-local/README.md)
- **Core Types**: [@firmachain/firma-sign-core](../../@firmachain/firma-sign-core/README.md)
- **P2P Transport**: [@firmachain/firma-sign-transport-p2p](../../@firmachain/firma-sign-transport-p2p/README.md)

## Adding Transport Support

### Install Transport Package

```bash
# Example: Add P2P transport
pnpm add @firmachain/firma-sign-transport-p2p

# Configure
echo "P2P_PORT=9090" >> .env

# Start server - transport auto-loads
pnpm dev
```

### Transport Auto-Discovery

The server automatically discovers installed `@firmachain/firma-sign-transport-*` packages. See [TransportLoader](../src/transport/TransportLoader.ts) for implementation.

## API Development

### Adding Endpoints

1. Create route file in `src/api/routes/`
2. Use Zod for validation
3. Register in `src/index.ts`

Example:

```typescript
// src/api/routes/myroute.ts
import { Router } from 'express';
import { z } from 'zod';
import { validateRequest } from '../middleware/validation.js';

const schema = z.object({
	field: z.string(),
});

export function createMyRoutes(): Router {
	const router = Router();

	router.post('/', validateRequest(schema), async (req, res) => {
		// Implementation
	});

	return router;
}
```

### Using Storage Manager

```typescript
import { StorageManager } from '../storage/StorageManager.js';

const storage = new StorageManager();

// Create transfer
await storage.createTransfer({
  transferId: 'id',
  type: 'outgoing',
  documents: [...]
});

// Save document
await storage.saveDocument(transferId, fileName, buffer);
```

## WebSocket Development

Emit events for real-time updates:

```typescript
// In route handler
wsServer.broadcastToTransfer(transferId, 'transfer:update', {
	status: 'completed',
});
```

See [WebSocket Events](./API.md#websocket-events) for event types.

## Database Operations

The server uses the SQLite database package. For direct database access:

```typescript
// Via StorageManager
const transfer = await storage.getTransfer(transferId);
const transfers = await storage.listTransfers('outgoing');
```

See [Database API](../../@firmachain/firma-sign-database-sqlite/docs/API.md) for details.

## Configuration

See [CONFIGURATION.md](./CONFIGURATION.md) for:

- Environment variables
- Config file format
- Package-specific settings

## Testing

```bash
# Run tests
pnpm test

# With coverage
pnpm test:coverage

# Watch mode
pnpm test:watch
```

See [TESTING.md](./TESTING.md) for writing tests.

## Debugging

### VS Code Launch Config

```json
{
	"type": "node",
	"request": "launch",
	"name": "Debug Server",
	"program": "${workspaceFolder}/packages/server/src/index.ts",
	"runtimeExecutable": "pnpm",
	"runtimeArgs": ["tsx"],
	"env": {
		"LOG_LEVEL": "debug"
	}
}
```

### Debug Logging

```bash
LOG_LEVEL=debug pnpm dev
```

## Common Tasks

### Reset Database

```bash
rm ./dev-storage/firma-sign.db
pnpm dev  # Recreates database
```

### Clear Storage

```bash
rm -rf ./dev-storage/storage/*
```

### Test Transport Loading

```bash
LOG_LEVEL=debug pnpm dev 2>&1 | grep -i transport
```

## Docker Development

```bash
# Build image
docker build -t firma-server-dev .

# Run with local storage
docker run -p 8080:8080 \
  -v $(pwd)/dev-storage:/data \
  -e STORAGE_PATH=/data \
  firma-server-dev
```

## Troubleshooting

See [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) for common issues.

## Contributing

1. Follow existing patterns in codebase
2. Add tests for new features
3. Update documentation
4. Run `pnpm lint` and `pnpm test` before committing

## Related Documentation

- [API Reference](./API.md)
- [Architecture](./ARCHITECTURE.md)
- [Configuration](./CONFIGURATION.md)
- [Testing](./TESTING.md)
