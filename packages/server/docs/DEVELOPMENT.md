# Development Guide

## Prerequisites

- Node.js 18 or higher
- pnpm package manager
- SQLite3

## Setup

1. Clone the repository
2. Install dependencies:
```bash
pnpm install
```

3. Configure environment:
```bash
cp .env.example .env
# Edit .env with your configuration
```

## Development Workflow

### Running the Server

```bash
# Development mode with hot reload
pnpm dev

# Production mode
pnpm build
pnpm start
```

### Code Structure

```
src/
├── api/              # REST API implementation
│   ├── routes/       # Route handlers
│   └── middleware/   # Express middleware
├── storage/          # Storage layer
│   └── StorageManager.ts
├── transport/        # Transport management
│   └── TransportManager.ts
├── websocket/        # WebSocket server
│   └── WebSocketServer.ts
├── utils/            # Utilities
│   └── logger.ts
└── index.ts          # Entry point
```

### Adding a New API Endpoint

1. Create route handler in `src/api/routes/`
2. Define validation schema using Zod
3. Add route to Express app in `index.ts`
4. Update API documentation

Example:
```typescript
// src/api/routes/example.ts
import { Router } from 'express';
import { z } from 'zod';
import { validateRequest } from '../middleware/validation.js';

const exampleSchema = z.object({
  field: z.string()
});

export function createExampleRoutes(): Router {
  const router = Router();
  
  router.post('/', validateRequest(exampleSchema), async (req, res) => {
    // Implementation
  });
  
  return router;
}
```

### Working with Transports

Transport packages are loaded dynamically. To add support:

1. Install transport package:
```bash
pnpm add @firmachain/firma-sign-transport-p2p
```

2. Register in server initialization:
```typescript
import { P2PTransport } from '@firmachain/firma-sign-transport-p2p';

const transport = new P2PTransport();
await transportManager.register(transport);
await transportManager.configure('p2p', { /* config */ });
```

### Database Migrations

Currently using simple schema initialization. For changes:
1. Update schema in `StorageManager.initializeDatabase()`
2. Add migration logic if needed
3. Test with fresh database

### Testing

```bash
# Run tests
pnpm test

# Run tests with coverage
pnpm test:coverage

# Run specific test file
pnpm test src/storage/StorageManager.test.ts
```

### Debugging

1. Enable debug logging:
```bash
LOG_LEVEL=debug pnpm dev
```

2. Use VS Code debugger:
```json
{
  "type": "node",
  "request": "launch",
  "name": "Debug Server",
  "program": "${workspaceFolder}/packages/server/src/index.ts",
  "preLaunchTask": "tsc: build - packages/server/tsconfig.json",
  "outFiles": ["${workspaceFolder}/packages/server/dist/**/*.js"]
}
```

### Code Style

- Use TypeScript strict mode
- Follow ESLint rules
- Format with Prettier
- Write JSDoc comments for public APIs

### Common Tasks

#### Adding Environment Variables
1. Add to `.env.example`
2. Update type definitions if needed
3. Document in CONFIGURATION.md

#### Updating Dependencies
```bash
# Update all dependencies
pnpm update

# Update specific dependency
pnpm update express
```

#### Building for Production
```bash
# Build TypeScript
pnpm build

# Run production build
NODE_ENV=production pnpm start
```

## Troubleshooting Development Issues

### Port Already in Use
```bash
# Find process using port 8080
lsof -i :8080

# Kill process
kill -9 <PID>
```

### Database Locked
Delete the database file and restart:
```bash
rm ~/.firmasign/firma-sign.db
pnpm dev
```

### TypeScript Errors
```bash
# Check types without building
pnpm type-check

# Clean and rebuild
rm -rf dist
pnpm build
```