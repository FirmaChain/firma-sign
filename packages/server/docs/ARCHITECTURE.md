# Server Architecture

## Overview

The Firma-Sign server is a standalone Node.js application that manages document transfers across multiple transport protocols. It provides REST APIs, WebSocket connections, and local storage management.

## Core Components

### 1. Transport Layer
```
TransportManager
├── Transport Registry
├── Configuration Management
├── Event Handling
└── Protocol Abstraction
```

The TransportManager acts as a central hub for all transport protocols, allowing the server to send and receive documents through various channels (P2P, Email, Discord, etc.).

### 2. Storage Layer
```
StorageManager
├── SQLite Database (metadata)
├── File System (documents)
└── Transfer Management
```

Documents are stored locally with metadata in SQLite and actual files on the filesystem.

### 3. API Layer
```
Express Server
├── REST Routes
│   ├── /api/auth
│   ├── /api/transfers
│   └── /api/blockchain
├── Middleware
│   ├── Validation
│   ├── Rate Limiting
│   └── Security
└── WebSocket Server
```

### 4. Real-time Communication
```
WebSocketServer
├── Client Management
├── Transfer Subscriptions
└── Event Broadcasting
```

## Data Flow

### Document Send Flow
1. Client uploads document via REST API
2. Server stores document locally
3. Server generates transfer code
4. Server prepares document for transport
5. Transport protocol handles delivery

### Document Receive Flow
1. Transport receives document
2. TransportManager emits receive event
3. Server stores document locally
4. WebSocket notifies subscribed clients
5. Client can download/sign via API

## Directory Structure
```
~/.firmasign/
├── transfers/
│   ├── outgoing/
│   │   └── {transferId}/
│   │       ├── documents/
│   │       ├── metadata.json
│   │       └── signed/
│   └── incoming/
│       └── {senderId}-{transferId}/
│           ├── sender.json
│           ├── documents/
│           └── signed/
├── firma-sign.db
├── config/
└── logs/
```

## Design Decisions

### 1. Local-First Storage
- Documents never leave the user's control
- No cloud dependencies
- Privacy by design

### 2. Transport Abstraction
- Pluggable transport system
- Protocol-agnostic document handling
- Easy to add new transports

### 3. Event-Driven Architecture
- Loose coupling between components
- Real-time updates via WebSocket
- Scalable notification system

### 4. Stateless Sessions
- Transfer codes for authentication
- No long-lived sessions
- Simple security model

## Security Architecture

### Authentication
- Transfer codes (6 characters, single use)
- Session tokens (24-hour expiry)
- No password storage

### Data Protection
- Documents encrypted in transit
- Local storage permissions
- Rate limiting on APIs

### Network Security
- CORS configuration
- Helmet.js headers
- HTTPS in production

## Database Schema

### transfers table
```sql
CREATE TABLE transfers (
  transferId TEXT PRIMARY KEY,
  type TEXT NOT NULL,
  status TEXT NOT NULL,
  metadata TEXT NOT NULL,
  createdAt INTEGER NOT NULL,
  updatedAt INTEGER NOT NULL
);
```

### documents table
```sql
CREATE TABLE documents (
  id TEXT PRIMARY KEY,
  transferId TEXT NOT NULL,
  fileName TEXT NOT NULL,
  fileSize INTEGER,
  hash TEXT,
  status TEXT DEFAULT 'pending',
  FOREIGN KEY (transferId) REFERENCES transfers(transferId)
);
```

### recipients table
```sql
CREATE TABLE recipients (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  transferId TEXT NOT NULL,
  identifier TEXT NOT NULL,
  transport TEXT NOT NULL,
  status TEXT DEFAULT 'pending',
  preferences TEXT,
  FOREIGN KEY (transferId) REFERENCES transfers(transferId)
);
```

## Scalability Considerations

### Current Limitations
- Single server instance
- Local file storage
- In-memory session storage

### Future Improvements
- Redis for session storage
- S3-compatible object storage
- Horizontal scaling with load balancer
- Message queue for transport events

## Dependencies

### Core Dependencies
- **express**: HTTP server and routing
- **ws**: WebSocket implementation
- **better-sqlite3**: SQLite database
- **winston**: Structured logging

### Security Dependencies
- **helmet**: Security headers
- **cors**: Cross-origin support
- **express-rate-limit**: API rate limiting
- **node-forge**: Cryptographic operations

### Utility Dependencies
- **nanoid**: ID generation
- **zod**: Schema validation
- **dotenv**: Environment configuration