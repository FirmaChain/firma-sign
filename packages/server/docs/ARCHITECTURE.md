# Server Architecture

## Overview

The Firma-Sign server orchestrates document transfers using the modular package architecture. It acts as the integration layer between transport packages, storage packages, and the web API.

For overall system architecture, see the [main architecture document](../../../docs/BACKEND-ARCHITECTURE.md).

## Server's Role in the System

The server package specifically handles:

1. **HTTP/WebSocket API** - Client communication layer
2. **Transport Orchestration** - Dynamic loading and management of transport packages
3. **Session Management** - Transfer code authentication and JWT sessions
4. **Event Routing** - Real-time updates via WebSocket
5. **Configuration Management** - Hierarchical config system

## Integration with Package Ecosystem

```
┌─────────────────────────────────────────┐
│            Client Applications           │
└────────────────┬────────────────────────┘
                 │ HTTP/WebSocket
┌────────────────▼────────────────────────┐
│         Server Package (This)           │
│  ┌────────────────────────────────────┐ │
│  │   Express.js + WebSocket Server    │ │
│  └────────────────┬───────────────────┘ │
│  ┌────────────────▼───────────────────┐ │
│  │    TransportManager (Dynamic)      │ │
│  │    StorageManager (Integration)    │ │
│  └────────────────┬───────────────────┘ │
└───────────────────┼─────────────────────┘
                    │ Uses
    ┌───────────────┼───────────────┐
    │               │               │
┌───▼────┐    ┌────▼────┐    ┌────▼────┐
│  Core  │    │Storage  │    │Database │
│Package │    │Packages │    │Packages │
└────────┘    └─────────┘    └─────────┘
              ┌─────────┐    ┌─────────┐
              │Transport│    │Document │
              │Packages │    │Package  │
              └─────────┘    └─────────┘
```

## Server Components

### TransportManager

Dynamically loads and manages transport packages:

```typescript
class TransportManager {
	// Discovers @firmachain/firma-sign-transport-* packages
	// Implements the pattern defined in core package
	// Routes transfers to appropriate transport
}
```

See [TransportLoader implementation](../src/transport/TransportLoader.ts) for package discovery.

### StorageManager

Integrates storage and database packages:

```typescript
class StorageManager {
	// Uses @firmachain/firma-sign-database-sqlite
	// Uses @firmachain/firma-sign-storage-local
	// Coordinates file storage with metadata
}
```

### ConfigManager

Server-specific configuration handling:

- Environment variable priority
- JSON configuration files
- Transport-specific configs passed to packages
- See [CONFIGURATION.md](./CONFIGURATION.md) for details

### WebSocketServer

Real-time event system:

- Transfer subscription management
- Event broadcasting to connected clients
- JWT-based authentication

## API Route Structure

```
/api/
├── auth/           # Authentication & transfer codes
│   ├── connect     # Code-based authentication
│   └── keypair     # RSA key generation
├── transfers/      # Transfer operations
│   ├── create      # New transfer
│   ├── :id         # Get transfer
│   └── :id/sign    # Sign documents
├── blockchain/     # Hash verification (planned)
└── transports/     # Transport status
    └── available   # List loaded transports
```

## Data Flow

### Transfer Creation Flow

```
1. Client Request → API Route
2. API → StorageManager.createTransfer()
   - Uses SQLite database package for metadata
   - Creates directory structure via storage package
3. Generate transfer code
4. Return to client
```

### Document Signing Flow

```
1. Receiver connects with code → Auth endpoint
2. Download document → StorageManager → LocalStorage package
3. Sign document → Upload signed version
4. StorageManager updates database via SQLite package
5. WebSocket broadcasts update
```

### Transport Send Flow

```
1. API determines transport from recipient
2. TransportManager loads appropriate package
3. Calls transport.send() with OutgoingTransfer
4. Transport package handles protocol-specific sending
```

## Session Management

The server implements transfer code authentication:

```
6-digit Code → JWT Token → Session Access
```

- Codes are single-use
- JWT tokens expire after 24 hours
- Sessions tied to specific transfer IDs

## Event System

WebSocket events for real-time updates:

```
Transport Event → TransportManager → EventEmitter
                                   ↓
                            WebSocketServer
                                   ↓
                          Subscribed Clients
```

## Error Handling

Server-specific error handling:

1. **API Validation**: Zod schemas for all endpoints
2. **Transport Errors**: Caught and logged by TransportManager
3. **Storage Errors**: Propagated from storage packages
4. **Rate Limiting**: Express middleware

## Security Implementation

- **CORS**: Configured for client origin
- **Rate Limiting**: Per-endpoint limits
- **Input Validation**: Zod schemas
- **Path Security**: Handled by storage package
- **Authentication**: JWT with transfer codes

## Performance Considerations

- **Async Operations**: All I/O is non-blocking
- **Package Loading**: Lazy loading of transports
- **Database Pooling**: Handled by SQLite package
- **Stream Support**: Via storage package

## Development Setup

See [DEVELOPMENT.md](./DEVELOPMENT.md) for:

- Running the server
- Adding transport packages
- Testing with different configurations

## Related Documentation

- **Core Interfaces**: [@firmachain/firma-sign-core](../../@firmachain/firma-sign-core/docs/ARCHITECTURE.md)
- **Storage Implementation**: [@firmachain/firma-sign-storage-local](../../@firmachain/firma-sign-storage-local/docs/ARCHITECTURE.md)
- **Database Schema**: [@firmachain/firma-sign-database-sqlite](../../@firmachain/firma-sign-database-sqlite/docs/ARCHITECTURE.md)
- **P2P Transport**: [@firmachain/firma-sign-transport-p2p](../../@firmachain/firma-sign-transport-p2p/docs/ARCHITECTURE.md)
