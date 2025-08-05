# P2P Transport Testing and Demo

This document explains how to test and demonstrate the P2P transport functionality with the provided test code and peer scripts.

## Test Structure

### Unit Tests
- **`P2PTransport.test.ts`** - Core transport functionality tests
- **`integration.test.ts`** - Real network integration tests  
- **`scenarios.test.ts`** - Scenario-based workflow tests

### Demo Scripts
- **`server-peer.ts`** - Server peer that hosts and shares files
- **`client-peer.ts`** - Client peer that discovers and downloads files

## Running Tests

### Prerequisites
```bash
# Ensure dependencies are installed
pnpm install

# Build the package
pnpm build
```

### Run All Tests
```bash
# Run complete test suite
pnpm test

# Run specific test file
pnpm test src/__tests__/P2PTransport.test.ts

# Run tests in watch mode
pnpm test:watch
```

### Test Coverage
The tests cover:
- ✅ Transport initialization and configuration
- ✅ Peer discovery (mDNS and DHT)
- ✅ Single and multi-document transfers
- ✅ Large file handling
- ✅ Error scenarios and recovery
- ✅ Concurrent operations
- ✅ Network resilience
- ✅ Transport lifecycle management

## Demo Scenario: File Sharing Between Peers

### 1. Start Server Peer (Terminal 1)
```bash
# Start server on port 9090 with test documents
pnpm tsx scripts/server-peer.ts 9090 ./test-documents

# Output shows:
🌐 Firma-Sign P2P Server Peer
===============================
🚀 Starting P2P Server Peer...
📂 Documents directory: /path/to/test-documents
🔌 Port: 9090
📚 Loading document catalog...
📝 Created sample document: sample-contract.pdf
📝 Created sample document: agreement.txt
📝 Created sample document: technical-spec.md
📄 Added: sample-contract.pdf (573 bytes, ID: a1b2c3d4)
📄 Added: agreement.txt (892 bytes, ID: e5f6g7h8)
📄 Added: technical-spec.md (1247 bytes, ID: i9j0k1l2)
✅ Loaded 3 documents into catalog
✅ Server peer started successfully!
🆔 Peer ID: 12D3KooWEyoppNCUx8Yx66oV9fJnriXwCcXwDDUA2kj6vnc6iDEp
📋 Documents in catalog: 3
```

### 2. Start Client Peer (Terminal 2)
```bash
# Start client on port 9091 with downloads directory
pnpm tsx scripts/client-peer.ts 9091 ./downloads

# Output shows:
📱 Firma-Sign P2P Client Peer
==============================
🚀 Starting P2P Client Peer...
📂 Downloads directory: /path/to/downloads
🔌 Port: 9091
✅ Client peer started successfully!
🆔 Peer ID: 12D3KooWBvbH1jEKVA8dhfgKiGuUkXJKxJDfZeB8NjFxHXzQW5xK
```

### 3. Discover and Connect Peers

In the client terminal:
```bash
p2p-client> discover
🔍 Discovering peers...
📡 Current connections: 1
📋 Previously known peers:
  12D3KooWEyoppNCUx... (0 docs, 2m ago)

p2p-client> peers
👥 KNOWN PEERS
  12D3KooWEyoppNCUx... (0 docs, 2m ago)
```

### 4. Request Files from Server

In the client terminal:
```bash
p2p-client> request 12D3KooWEyoppNCUx8Yx66oV9fJnriXwCcXwDDUA2kj6vnc6iDEp
📞 Requesting file from 12D3KooWEyoppNCUx8Yx66oV9fJnriXwCcXwDDUA2kj6vnc6iDEp...
✅ File request sent successfully
```

### 5. Server Sends Documents

In the server terminal:
```bash
p2p-server> send a1b2c3d4 12D3KooWBvbH1jEKVA8dhfgKiGuUkXJKxJDfZeB8NjFxHXzQW5xK
📤 Sending document sample-contract.pdf to 12D3KooWBvbH1jEKVA8dhfgKiGuUkXJKxJDfZeB8NjFxHXzQW5xK...
✅ Document sent successfully
```

### 6. Client Receives Files

In the client terminal:
```bash
📥 INCOMING TRANSFER
  Transfer ID: server-send-1703851234567
  From: P2P Node (12D3KooWEyoppNCUx8Yx66oV9fJnriXwCcXwDDUA2kj6vnc6iDEp)
  Transport: p2p
  Documents: 1
  Status: delivered
  💾 Downloaded: 1703851234567_sample-contract.pdf (573 bytes)
  ✅ Transfer received successfully

p2p-client> downloads
📥 DOWNLOADED DOCUMENTS
  a1b2c3d4: 1703851234567_sample-contract.pdf (573 B) from P2P Node
```

## Test Scenarios Demonstrated

### 1. Basic File Transfer
- Server peer hosts multiple document types (PDF, TXT, MD)
- Client discovers server via peer discovery
- Client requests and receives documents
- Both peers maintain transfer statistics

### 2. Bidirectional Communication
- Client can send files to server
- Server can send files to client
- Both peers act as sender and receiver

### 3. Multiple Document Types
The demo includes:
- **PDF documents** - Sample contracts
- **Text files** - Agreements and specifications
- **Markdown files** - Technical documentation
- **JSON files** - File requests and metadata

### 4. Network Resilience
- Peers handle connection failures gracefully
- Automatic reconnection attempts
- Status monitoring and error reporting

### 5. Real-time Status Updates
Both peers provide:
- Connection counts
- Transfer statistics
- Document catalogs
- Peer discovery information

## Advanced Testing

### Multi-Peer Network
```bash
# Terminal 1 - Server
pnpm tsx scripts/server-peer.ts 9090

# Terminal 2 - Client 1  
pnpm tsx scripts/client-peer.ts 9091

# Terminal 3 - Client 2
pnpm tsx scripts/client-peer.ts 9092

# Terminal 4 - Client 3
pnpm tsx scripts/client-peer.ts 9093
```

### Performance Testing
```bash
# Run scenario tests for performance validation
pnpm test src/__tests__/scenarios.test.ts -t "Large File Transfer"

# Run integration tests for network validation
pnpm test src/__tests__/integration.test.ts -t "Real Network"
```

### Error Simulation
```bash
# Run error handling tests
pnpm test src/__tests__/P2PTransport.test.ts -t "Error Handling"

# Test network interruption scenarios
pnpm test src/__tests__/scenarios.test.ts -t "Error Recovery"
```

## Monitoring and Debugging

### Enable Debug Logging
```bash
# Enable all libp2p debug logs
DEBUG=libp2p:* pnpm tsx scripts/server-peer.ts

# Enable specific module logs
DEBUG=libp2p:connection,libp2p:transport pnpm tsx scripts/client-peer.ts
```

### Status Commands
Both peer scripts support interactive commands:

**Server Commands:**
- `status` - Show connection and transfer statistics
- `catalog` - List available documents
- `send <doc-id> <peer-id>` - Send document to peer
- `peers` - Show connected peers

**Client Commands:**
- `discover` - Discover available peers
- `peers` - Show known peers
- `downloads` - Show downloaded documents
- `send <file> <peer-id>` - Send file to peer
- `request <peer-id>` - Request files from peer

### Network Troubleshooting

1. **Connection Issues:**
   - Check firewall settings
   - Verify ports are available
   - Enable mDNS for local discovery

2. **Transfer Failures:**
   - Verify peer IDs are correct
   - Check file sizes against limits
   - Monitor debug logs for errors

3. **Discovery Problems:**
   - Ensure peers are on same network (for mDNS)
   - Add bootstrap nodes for DHT
   - Check network connectivity

## Performance Characteristics

Based on test results:
- **Small files (< 1MB)**: Sub-second transfers
- **Large files (5-50MB)**: Transfers complete within seconds
- **Concurrent transfers**: Supports multiple simultaneous operations
- **Connection limits**: Configurable (default 50 connections per peer)
- **Memory usage**: Efficient streaming for large files

## Security Features

- **Peer Authentication**: Each peer has cryptographic identity
- **Encrypted Connections**: All data encrypted in transit
- **Hash Verification**: Document integrity validation
- **Transport Security**: Built-in libp2p security protocols

This demo showcases a complete P2P document transfer system suitable for decentralized document signing workflows.