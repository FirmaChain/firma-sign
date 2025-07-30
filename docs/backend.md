# Firma-Sign Backend Architecture

## Overview

The Firma-Sign backend implements a multi-protocol document signing system that supports various communication channels while maintaining security and decentralization. Initially built with P2P connections inspired by BitTorrent and Magic Wormhole, the architecture is designed to scale across multiple transport protocols including email, messaging platforms (Discord, Telegram), and web links, enabling organizations to choose the most suitable method for their workflow.

## Core Concepts

### 1. Decentralized Architecture

The system operates as a hybrid P2P network where each node functions as both server and client:
- Each node can **send** documents (server role) and **receive** documents (client role) simultaneously
- Nodes discover and connect to each other using encrypted keys
- Documents are extracted from the web interface and stored locally before transfer
- Similar to P2P chat systems where every participant is both sender and receiver
- Local storage in `~/.firmasign/storage/` ensures privacy and control

### 2. Dual Role Architecture

Each **Firma-Sign Node** operates with dual capabilities:

**As a Sender (Server Role)**:
- Extracts documents from web interface
- Stores documents locally in `~/.firmasign/storage/outgoing/`
- Generates transfer codes for recipients
- Serves documents to requesting nodes
- Tracks signing status and completions

**As a Receiver (Client Role)**:
- Connects using received transfer codes
- Downloads documents to `~/.firmasign/storage/incoming/`
- Enables local signing through web interface
- Returns signed documents to sender
- Maintains signing history

**Web Interface** (for both roles):
- Upload and prepare documents for sending
- View and sign received documents
- Manage transfer history
- Configure transport preferences

### 3. Security Model

Inspired by Magic Wormhole's security approach:
- **PAKE (Password-Authenticated Key Exchange)**: Short, human-readable codes for secure connections
- **End-to-end encryption**: Documents encrypted during transfer
- **No central authority**: Each server maintains its own trust relationships

## System Architecture

### Multi-Protocol Transport Layer

```
                    +---------------------+
                    |   Transport Layer   |
                    |    Abstraction      |
                    +----------+----------+
                               |
         +--------------------+|+--------------------+
         |                     |                     |
    +----v-----+        +------v-------+      +------v------+
    |   P2P    |        |    Email     |      |  Messenger  |
    | (Default)|        |  Transport   |      | (Discord,   |
    |          |        |              |      |  Telegram)  |
    +----+-----+        +------+-------+      +------+------+
         |                     |                     |
         +---------------------+---------------------+
                               |
                    +----------v----------+
                    |   Server Node       |
                    |   (Organization)    |
                    +----------+----------+
                               |
                         +-----v-----+
                         |  Signer   |
                         |  Client   |
                         +-----------+
```

### P2P Connection (Default)

```
+------------------------+         +------------------------+
|   Firma-Sign Node A    |         |   Firma-Sign Node B    |
|                        |         |                        |
| +--------------------+ |         | +--------------------+ |
| |   Web Interface    | |         | |   Web Interface    | |
| | - Upload Document  | |         | | - View Document    | |
| | - Generate Code    | |         | | - Sign Document    | |
| +--------+-----------+ |         | +--------+-----------+ |
|          |             |         |          |             |
| +--------v-----------+ |         | +--------v-----------+ |
| |   Local Storage    | |         | |   Local Storage    | |
| | ~/.firmasign/      | |<------->| | ~/.firmasign/      | |
| | storage/           | | P2P     | | storage/           | |
| +--------------------+ | Transfer| +--------------------+ |
+------------------------+         +------------------------+
     Sender Role                        Receiver Role
```

### Alternative Transport Flows

```
Email Transport:
Org A Server -> Email Service -> Recipient Email -> Org B Server

Messenger Transport:
Org A Server -> Bot API -> Chat Platform -> User -> Org B Server

Web Link Transport:
Org A Server -> Generate Link -> Share URL -> Browser -> Org B Server
```

## Key Features

### 1. Transport Protocol Abstraction

The system uses a pluggable transport layer that supports multiple communication protocols:

#### P2P Transport (Default)
- **DHT (Distributed Hash Table)**: For server discovery in the network
- **Encrypted Key Exchange**: Servers authenticate using pre-shared keys
- **WebRTC/WebSocket**: For real-time communication between servers
- **NAT Traversal**: Using STUN/TURN servers for connectivity

#### Email Transport
- **SMTP/IMAP Integration**: Send documents as encrypted attachments
- **Automatic Processing**: Server monitors inbox for signing requests
- **Fallback Support**: Works when direct connections aren't possible
- **Enterprise Friendly**: Compatible with existing email infrastructure

#### Messenger Transport
- **Bot Integration**: Discord, Telegram bots for document delivery
- **Interactive Flow**: Users interact through familiar chat interfaces
- **Mobile Friendly**: Leverages existing mobile apps
- **Notification Support**: Real-time updates through platform notifications

#### Web Link Transport
- **Temporary URLs**: Time-limited access links
- **Browser-Based**: No client installation required
- **QR Code Support**: Easy mobile access
- **Server-Hosted**: Documents temporarily stored on sender's server

### 2. Unified Document Transfer Protocol

The transfer protocol adapts to the selected transport method while maintaining consistent security:

1. **Document Preparation Phase**
   - User uploads document via web interface
   - Document extracted and saved to `~/.firmasign/storage/outgoing/{transferId}/`
   - Metadata (signers, deadlines, etc.) stored alongside document
   - Transfer code generated containing: document ID + authentication token + transport hint

2. **Initiation Phase**
   - Sender node selects transport protocol based on recipient preferences
   - Transfer code shared via selected channel (P2P code, email, messenger, web link)
   - Document remains in local storage, not transmitted until requested

3. **Connection Phase**
   - **P2P**: Direct node-to-node connection established
   - **Email**: Recipient node processes incoming email with code
   - **Messenger**: Bot receives code from user, initiates node connection
   - **Web Link**: Browser connects to sender's node via HTTPS

4. **Transfer Phase**
   - Recipient requests document using transfer code
   - Document read from `~/.firmasign/storage/outgoing/` and encrypted
   - Transferred to recipient's `~/.firmasign/storage/incoming/{transferId}/`
   - Progress tracked, integrity verified with checksums

5. **Signing Phase**
   - Recipient views document through web interface
   - Signs document locally, creating signed version
   - Signed document saved to `incoming/{transferId}/document-signed.pdf`
   - Returned to sender via same or different transport
   - Sender receives signed copy in `outgoing/{transferId}/document-signed.pdf`

### 3. Client-Server Communication

- **WebSocket**: For real-time updates
- **REST API**: For document operations
- **Short-lived tokens**: For authentication
- **Progressive Web App**: For cross-platform client

## Technical Stack

### Server Components


```
firma-sign-node/
├── src/
│   ├── transports/
│   │   ├── base.ts
│   │   ├── p2p/
│   │   │   ├── discovery.ts
│   │   │   ├── connection.ts
│   │   │   └── index.ts
│   │   ├── email/
│   │   │   ├── smtp.ts
│   │   │   ├── imap.ts
│   │   │   └── index.ts
│   │   ├── messenger/
│   │   │   ├── discord.ts
│   │   │   ├── telegram.ts
│   │   │   └── index.ts
│   │   └── web/
│   │       ├── server.ts
│   │       ├── storage.ts
│   │       └── index.ts
│   ├── core/
│   │   ├── router.ts
│   │   ├── encryption.ts
│   │   └── transfer.ts
│   ├── api/
│   │   ├── auth.ts
│   │   ├── documents.ts
│   │   ├── transport.ts
│   │   └── status.ts
│   ├── storage/
│   │   ├── manager.ts
│   │   ├── temporary.ts
│   │   └── metadata.ts
│   ├── web/
│   │   ├── server.ts
│   │   ├── routes.ts
│   │   └── static/
│   └── security/
│       ├── pake.ts
│       └── keys.ts
└── config/
    ├── transports.json
    ├── peers.json
    └── credentials/

~/.firmasign/
├── storage/
│   ├── outgoing/
│   │   ├── {transferId}/
│   │   │   ├── document.pdf
│   │   │   └── metadata.json
│   ├── incoming/
│   │   ├── {transferId}/
│   │   │   ├── document.pdf
│   │   │   ├── document-signed.pdf
│   │   │   └── metadata.json
│   └── temp/
├── config/
│   ├── node.json
│   └── preferences.json
└── logs/
```
### Technology Choices

#### Core Technologies
- **Node.js + TypeScript**: Server implementation
- **SQLite**: Local metadata storage
- **Redis**: Session and cache management
- **Rust**: Performance-critical cryptographic operations


#### Transport-Specific Libraries
- **P2P Transport**:
  - **libp2p**: P2P networking library
  - **WebRTC**: Direct peer connections
  - **STUN/TURN**: NAT traversal

- **Email Transport**:
  - **Nodemailer**: SMTP client
  - **node-imap**: IMAP client
  - **mailparser**: Email parsing

- **Messenger Transport**:
  - **discord.js**: Discord bot framework
  - **node-telegram-bot-api**: Telegram bot API
  - **Webhook support**: For real-time updates

- **Web Transport**:
  - **Express.js**: HTTP server
  - **Short URL service**: Link generation
  - **QR Code generator**: Mobile access

## API Specification

### Server-to-Server Protocol

```typescript
// Peer Discovery
interface PeerAnnounce {
  nodeId: string;
  publicKey: string;
  capabilities: string[];
  timestamp: number;
}

// Document Transfer
interface TransferRequest {
  transferId: string;
  documentHash: string;
  senderNodeId: string;
  recipientCode: string;
  transport: {
    type: 'p2p' | 'email' | 'discord' | 'telegram' | 'web';
    config?: {
      email?: string;
      discordUserId?: string;
      telegramChatId?: string;
      webLinkExpiry?: number;
    };
  };
  metadata: {
    fileName: string;
    fileSize: number;
    signers: string[];
  };
}
```

### Client-Server API

```typescript
// POST /api/transfers/create
interface CreateTransferRequest {
  documentId: string;
  recipients: Array<{
    identifier: string;  // Email, Discord ID, etc.
    transport: 'p2p' | 'email' | 'discord' | 'telegram' | 'web';
    preferences?: {
      fallbackTransport?: string;
      notificationEnabled?: boolean;
    };
  }>;
}

// POST /api/auth/connect
interface ConnectRequest {
  code: string;  // 6-digit transfer code
  transport?: string;  // Optional transport hint
}

// GET /api/documents/:transferId
interface DocumentResponse {
  transferId: string;
  status: 'pending' | 'ready' | 'signed' | 'completed';
  transport: {
    type: string;
    deliveryStatus: 'sent' | 'delivered' | 'opened' | 'signed';
  };
  document?: {
    url: string;  // Temporary download URL
    expires: number;
  };
}

// POST /api/documents/:transferId/sign
interface SignRequest {
  signature: string;  // Base64 encoded signature data
  components: any[];  // Signature components from frontend
  returnTransport?: string;  // Optional different return transport
}

// GET /api/transports/available
interface AvailableTransportsResponse {
  transports: Array<{
    type: string;
    enabled: boolean;
    configured: boolean;
    features: string[];
  }>;
}

```

## Transport Configuration

### Email Transport Configuration

```json
{
  "email": {
    "smtp": {
      "host": "smtp.example.com",
      "port": 587,
      "secure": false,
      "auth": {
        "user": "firma-sign@example.com",
        "pass": "encrypted_password"
      }
    },
    "imap": {
      "host": "imap.example.com",
      "port": 993,
      "secure": true,
      "auth": {
        "user": "firma-sign@example.com",
        "pass": "encrypted_password"
      }
    },
    "polling_interval": 30000,
    "max_attachment_size": "25MB"
  }
}
```

### Messenger Transport Configuration

```json
{
  "discord": {
    "bot_token": "encrypted_token",
    "application_id": "app_id",
    "guild_ids": ["guild1", "guild2"],
    "commands": {
      "sign": "Request document signature",
      "status": "Check signing status"
    }
  },
  "telegram": {
    "bot_token": "encrypted_token",
    "webhook_url": "https://server.example.com/telegram",
    "allowed_chat_types": ["private", "group"]
  }
}
```

### Web Transport Configuration

```json
{
  "web": {
    "base_url": "https://sign.example.com",
    "link_expiry": 86400,
    "max_downloads": 3,
    "require_auth": true,
    "storage": {
      "type": "local",
      "path": "/var/firma-sign/web-transfers"
    }
  }
}
```

## Security Considerations

### 1. Authentication & Authorization

- **PAKE-based authentication**: No passwords transmitted
- **Short-lived transfer codes**: Expire after first use or timeout
- **TLS for all connections**: Server-to-server and client-server
- **Certificate pinning**: For known peer servers

### 2. Document Security

- **End-to-end encryption**: Documents encrypted at rest and in transit
- **Forward secrecy**: New keys for each transfer
- **Document integrity**: SHA-256 checksums
- **Audit trail**: Cryptographically signed transfer logs

### 3. Network Security

- **DDoS protection**: Rate limiting and traffic analysis
- **Firewall-friendly**: Works over standard HTTPS ports
- **IP allowlisting**: Optional restriction for server peers

## Implementation Phases

### Phase 1: Core Infrastructure & Transport Abstraction
- Basic server implementation with transport layer abstraction
- Client-server WebSocket communication
- Local document storage and retrieval
- Simple authentication system
- Transport router and plugin architecture

### Phase 2: P2P Transport (Default)
- Server discovery mechanism using DHT
- Direct peer-to-peer connections
- WebRTC/WebSocket implementation
- Basic encryption and PAKE authentication

### Phase 3: Alternative Transports
- **Email Transport**: SMTP/IMAP integration
- **Web Link Transport**: Temporary URL generation
- Transport fallback mechanisms
- Unified encryption across all transports

### Phase 4: Messenger Integrations
- Discord bot implementation
- Telegram bot implementation
- Other messenger platforms (Slack, WhatsApp)
- Interactive signing workflows

### Phase 5: Enterprise Features
- Multi-signature workflows across transports
- Advanced audit logging with transport tracking
- Integration APIs for custom transports
- Performance optimization and load balancing
- Transport preference learning

## Conventions

### Code Organization

1. **Modular Architecture**: Separate concerns into distinct modules
2. **TypeScript First**: Strong typing for all components
3. **Event-Driven**: Use event emitters for loose coupling
4. **Dependency Injection**: For testability and flexibility

### API Design

1. **RESTful principles**: For client-server communication
2. **GraphQL consideration**: For complex queries
3. **WebSocket events**: For real-time updates
4. **Version management**: API versioning from start

### Security Practices

1. **Security by default**: Encrypt everything
2. **Least privilege**: Minimal permissions
3. **Regular audits**: Security scanning
4. **Open source review**: Community security input

## Deployment Architecture

```yaml
# docker-compose.yml example
version: '3.8'
services:
  firma-server:
    image: firmachain/firma-sign-server
    environment:
      - NODE_ID=${NODE_ID}
      - NODE_PRIVATE_KEY=${NODE_PRIVATE_KEY}
    ports:
      - "8080:8080"    # HTTP API
      - "8443:8443"    # WebSocket
      - "9090:9090"    # P2P
    volumes:
      - ./data:/app/data
      - ./config:/app/config
```

## Monitoring & Operations

### Metrics to Track

- Transfer success rate
- Connection latency between peers
- Document processing time
- Active connections
- Storage usage

### Logging Strategy

- Structured JSON logging
- Separate audit logs for compliance
- Debug logs for development
- Performance metrics

## Blockchain Integration

### Document Hash Storage on Firmachain

After a document is successfully signed, the system can optionally store the document hash on Firmachain to create an immutable proof of the signing event:

- **Document Hash**: SHA-256 hash of the signed document
- **Timestamp**: Block time when hash was recorded
- **Signer Information**: Addresses or identifiers of all parties
- **Verification**: Anyone can verify the document hasn't been altered by comparing hashes

This provides a permanent, tamper-proof record without storing the actual document content on-chain.

## Future Considerations

1. **Enhanced Transport Protocols**: Support for more messaging platforms and communication channels
2. **Improved Security**: Advanced encryption methods and zero-knowledge proofs
3. **Mobile Applications**: Native iOS and Android apps for signing on the go
4. **Batch Operations**: Multiple document signing in a single session
5. **Workflow Automation**: Template-based signing processes

## References

- [Magic Wormhole Protocol](https://magic-wormhole.readthedocs.io/en/latest/welcome.html#design)
- [libp2p Documentation](https://docs.libp2p.io/)
- [WebRTC Data Channels](https://developer.mozilla.org/en-US/docs/Web/API/WebRTC_API/Using_data_channels)
- [PAKE Protocols](https://tools.ietf.org/html/rfc5054)