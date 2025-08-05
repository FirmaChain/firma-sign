# Architecture

## Overview

The P2P transport package implements a decentralized document transfer system using libp2p. It provides direct peer-to-peer connections without requiring centralized servers for document exchange.

## Core Components

### 1. Transport Layer

```
P2PTransport
├── Libp2p Node
│   ├── TCP Transport
│   ├── WebSocket Transport
│   └── WebRTC Transport
├── Protocol Handlers
│   ├── Transfer Protocol
│   └── Discovery Protocol
└── Connection Manager
    ├── Peer Store
    └── Connection Pool
```

### 2. Network Stack

```
Application Layer
├── Firma-Sign Transfer Protocol
└── Document Exchange

Transport Layer
├── Stream Multiplexing (Yamux/Mplex)
├── Encryption (TLS/Noise)
└── Transport Protocols
    ├── TCP
    ├── WebSocket
    └── WebRTC

Discovery Layer
├── DHT (Kademlia)
├── mDNS
└── Bootstrap Nodes
```

### 3. Data Flow

```
Sender                          Network                         Receiver
   |                               |                               |
   |-- Initialize Transport ------>|                               |
   |                               |                               |
   |-- Discover Peer ------------->|<------ Announce Presence ----|
   |                               |                               |
   |-- Establish Connection ------>|<------ Accept Connection ----|
   |                               |                               |
   |-- Send Transfer Data -------->|-------> Receive Transfer --->|
   |                               |                               |
   |<- Acknowledge Receipt --------|<------ Send Confirmation ----|
```

## Design Decisions

### 1. Protocol Design

The transport uses custom protocols built on libp2p:

- **Transfer Protocol** (`/firma-sign/transfer/1.0.0`): Handles document transfers
- **Base Protocol** (`/firma-sign/1.0.0`): General communication

### 2. Security Model

- **Peer Identity**: Each node has a cryptographic identity
- **Encrypted Connections**: All connections use TLS or Noise
- **Protocol Negotiation**: Secure protocol selection

### 3. Connection Management

- **Max Connections**: Limited to prevent resource exhaustion
- **Auto Dial**: Automatic connection to discovered peers
- **Connection Pruning**: Remove idle connections

## Technical Architecture

### Libp2p Configuration

```typescript
{
  addresses: {
    listen: [
      '/ip4/0.0.0.0/tcp/9090',      // TCP
      '/ip4/0.0.0.0/tcp/9091/ws',   // WebSocket
    ]
  },
  transports: [tcp(), webSockets(), webRTC()],
  streamMuxers: [yamux(), mplex()],
  services: {
    dht: kadDHT(),    // Distributed Hash Table
    mdns: mdns(),     // Local discovery
  }
}
```

### Protocol Implementation

Transfer protocol handles:
1. Transfer metadata exchange
2. Document streaming
3. Receipt confirmation
4. Error handling

### Discovery Mechanisms

#### DHT (Distributed Hash Table)
- Global peer discovery
- Content routing
- Peer routing

#### mDNS (Multicast DNS)
- Local network discovery
- Zero configuration
- Automatic peer finding

#### Bootstrap Nodes
- Initial network entry points
- Help new nodes join network
- Maintain network connectivity

## Performance Considerations

### 1. Connection Pooling
- Reuse existing connections
- Limit concurrent connections
- Connection timeout management

### 2. Stream Multiplexing
- Multiple transfers per connection
- Efficient resource usage
- Parallel operations

### 3. Large File Handling
- Streaming for large documents
- Chunked transfer support
- Progress tracking

## Security Architecture

### 1. Transport Security
- TLS 1.3 for TCP connections
- Noise protocol for other transports
- Perfect forward secrecy

### 2. Peer Authentication
- Ed25519 key pairs
- Peer ID verification
- Trust on first use (TOFU)

### 3. Data Integrity
- Message authentication
- Transfer verification
- Hash validation

## Scalability

### Network Size
- DHT scales logarithmically
- Connection limits prevent overload
- Efficient routing algorithms

### Transfer Size
- Streaming for large files
- Configurable chunk sizes
- Memory-efficient processing

### Concurrent Operations
- Multiple simultaneous transfers
- Non-blocking operations
- Event-driven architecture

## Error Handling

### Connection Errors
- Automatic retry with backoff
- Alternative transport fallback
- Graceful degradation

### Transfer Errors
- Transfer resumption support
- Partial transfer recovery
- Error propagation to handlers

### Network Partitions
- Peer rediscovery
- Connection healing
- State synchronization

## Future Enhancements

### 1. Relay Support
- NAT traversal improvements
- Circuit relay for unreachable peers
- Relay discovery

### 2. Content Addressing
- IPFS integration
- Content-based routing
- Distributed storage

### 3. Advanced Features
- Publish/subscribe messaging
- Group transfers
- Bandwidth management

## Dependencies

### Core Dependencies
- **libp2p**: P2P networking stack
- **@libp2p/tcp**: TCP transport
- **@libp2p/websockets**: WebSocket transport
- **@libp2p/webrtc**: WebRTC transport
- **@libp2p/kad-dht**: DHT implementation
- **@libp2p/mdns**: mDNS discovery

### Security Dependencies
- **@libp2p/crypto**: Cryptographic operations
- Built-in TLS/Noise in libp2p

## Testing Strategy

### Unit Tests
- Protocol handler logic
- Connection management
- Error scenarios

### Integration Tests
- Multi-node networks
- Transfer scenarios
- Discovery mechanisms

### Performance Tests
- Large file transfers
- Many concurrent connections
- Network stress testing