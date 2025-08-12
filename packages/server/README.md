# Firma-Sign Server

The backend server for the Firma-Sign decentralized document signing system.

## Overview

This server implements:

- Multi-protocol transport management (P2P, Email, Discord, Telegram, Web)
- Local document storage with SQLite metadata
- WebSocket real-time updates
- RESTful API for document transfers
- Basic authentication with transfer codes

## Installation

```bash
# Install dependencies
pnpm install

# Copy environment configuration
cp .env.example .env

# Edit .env with your configuration
```

## Development

```bash
# Run in development mode with hot reload
pnpm dev

# Type checking
pnpm type-check

# Linting
pnpm lint

# Run tests
pnpm test
```

## Production

```bash
# Build the server
pnpm build

# Start the server
pnpm start
```

## API Documentation

The server provides interactive API documentation using Swagger/OpenAPI:

### Accessing Documentation

Once the server is running:

- **Swagger UI**: http://localhost:8080/api-docs
- **OpenAPI Spec**: http://localhost:8080/api-docs.json

### Features

- Interactive API testing interface
- Complete request/response schemas
- Authentication details
- Example payloads
- Error response documentation

## Architecture

### Directory Structure

```
src/
├── api/          # REST API routes and middleware
│   └── swagger/  # OpenAPI/Swagger documentation
├── config/       # Configuration including Swagger setup
├── services/     # Business logic services
├── storage/      # Local storage management
├── transport/    # Transport protocol management
├── websocket/    # WebSocket server for real-time updates
├── utils/        # Utility functions and logger
└── index.ts      # Main server entry point
```

### Key Components

1. **TransportManager**: Manages different transport protocols
2. **StorageManager**: Handles local document storage and SQLite database
3. **WebSocketServer**: Provides real-time updates to clients
4. **API Routes**: RESTful endpoints for document operations

## Documentation

- [API Reference](./docs/API.md) - Detailed API documentation
- [API Flowchart](./docs/API-FLOWCHART.md) - Visual API flow documentation
- [Architecture](./docs/ARCHITECTURE.md) - System architecture details
- [Development Guide](./docs/DEVELOPMENT.md) - Development setup and workflow
- [Configuration](./docs/CONFIGURATION.md) - Configuration options
- [Testing](./docs/TESTING.md) - Testing guide
- [Troubleshooting](./docs/TROUBLESHOOTING.md) - Common issues and solutions

## API Endpoints

### Authentication

- `POST /api/auth/connect` - Connect with transfer code
- `POST /api/auth/generate-keypair` - Generate RSA keypair

### Transfers

- `POST /api/transfers/create` - Create new transfer
- `GET /api/transfers` - List transfers
- `GET /api/transfers/:transferId` - Get transfer details
- `POST /api/transfers/:transferId/sign` - Sign documents

### System

- `GET /api/transports/available` - List available transports
- `GET /health` - Health check

## WebSocket Events

### Client → Server

- `auth` - Authenticate connection
- `subscribe` - Subscribe to transfer updates
- `unsubscribe` - Unsubscribe from transfer

### Server → Client

- `connected` - Connection established
- `transfer:update` - Transfer status update
- `transport:error` - Transport error notification

## Storage

Documents are stored locally at `~/.firmasign/` (configurable):

```
~/.firmasign/
├── transfers/
│   ├── outgoing/
│   └── incoming/
├── config/
├── logs/
└── firma-sign.db
```

## Environment Variables

See `.env.example` for all configuration options.

Key variables:

- `PORT` - Server port (default: 8080)
- `STORAGE_PATH` - Local storage path
- `LOG_LEVEL` - Logging level
- `CORS_ORIGIN` - Allowed CORS origin

## Adding Transport Protocols

To add transport support, install the corresponding package:

```bash
# P2P Transport
pnpm add @firmachain/firma-sign-transport-p2p

# Email Transport
pnpm add @firmachain/firma-sign-transport-email

# Discord Transport
pnpm add @firmachain/firma-sign-transport-discord
```

Then register it in the server initialization.

## Security

- CORS protection with configurable origins
- Rate limiting on API endpoints
- Helmet.js for security headers
- Transfer codes expire after single use
- Sessions expire after 24 hours

## License

MIT
