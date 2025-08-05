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

### Important: Port Configuration
The P2P transport uses **TWO consecutive ports**:
- **Base Port (e.g., 9090)**: TCP connections for direct peer-to-peer
- **Base Port + 1 (e.g., 9091)**: WebSocket connections for browser compatibility

Make sure both ports are available before starting!

### 1. Start Server Peer (Terminal 1)
```bash
# Start server on port 9090 (will also use 9091 for WebSocket)
pnpm tsx scripts/server-peer.ts 9090 ./test-documents

# Output shows:
🌐 Firma-Sign P2P Server Peer
===============================
🚀 Starting P2P Server Peer...
📂 Documents directory: /path/to/test-documents
🔌 Port: 9090
🔧 P2P Transport config - Requested port: 9090, Using port: 9090
🔌 P2P Transport listening on:
   /ip4/127.0.0.1/tcp/9090/p2p/12D3KooW...     # TCP on port 9090
   /ip4/192.168.x.x/tcp/9090/p2p/12D3KooW...   # TCP on LAN IP
   /ip4/127.0.0.1/tcp/9091/ws/p2p/12D3KooW...  # WebSocket on port 9091
   /ip4/192.168.x.x/tcp/9091/ws/p2p/12D3KooW... # WebSocket on LAN IP
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
# Start client on port 9092 (will also use 9093 for WebSocket)
# Note: Must use different ports than server to avoid conflicts
pnpm tsx scripts/client-peer.ts 9092 ./downloads

# Output shows:
📱 Firma-Sign P2P Client Peer
==============================
🚀 Starting P2P Client Peer...
📂 Downloads directory: /path/to/downloads
🔌 Port: 9092
🔧 P2P Transport config - Requested port: 9092, Using port: 9092
🔌 P2P Transport listening on:
   /ip4/127.0.0.1/tcp/9092/p2p/12D3KooW...     # TCP on port 9092
   /ip4/192.168.x.x/tcp/9092/p2p/12D3KooW...   # TCP on LAN IP
   /ip4/127.0.0.1/tcp/9093/ws/p2p/12D3KooW...  # WebSocket on port 9093
   /ip4/192.168.x.x/tcp/9093/ws/p2p/12D3KooW... # WebSocket on LAN IP
✅ Client peer started successfully!
🆔 Peer ID: 12D3KooWBvbH1jEKVA8dhfgKiGuUkXJKxJDfZeB8NjFxHXzQW5xK
```

### 3. Discover and Connect Peers

P2P discovery works in two ways:

#### Automatic Discovery (mDNS - Local Network)
If both peers are on the same local network, they will automatically discover each other:
```bash
p2p-client> discover
🔍 Discovering peers...
📡 Current connections: 1
🟢 Connected peers:
  12D3KooWEyoppNCUx8Yx66oV9fJnriXwCcXwDDUA2kj6vnc6iDEp (inbound)
    /ip4/192.168.1.100/tcp/9090
```

#### Manual Connection
If peers are on different networks or mDNS is not working, connect manually:

1. Copy the server's multiaddr from its startup output:
```
🔌 P2P Transport listening on:
   /ip4/192.168.20.101/tcp/9090/p2p/12D3KooWEyoppNCUx8Yx66oV9fJnriXwCcXwDDUA2kj6vnc6iDEp
```

2. In the client terminal, connect using the full multiaddr:
```bash
p2p-client> connect /ip4/192.168.20.101/tcp/9090/p2p/12D3KooWEyoppNCUx8Yx66oV9fJnriXwCcXwDDUA2kj6vnc6iDEp
🔗 Connecting to /ip4/192.168.20.101/tcp/9090/p2p/12D3KooWEyoppNCUx8Yx66oV9fJnriXwCcXwDDUA2kj6vnc6iDEp...
✅ Connection initiated. Check "peers" command for status.

p2p-client> peers
👥 KNOWN PEERS
  12D3KooWEyoppNCUx... (0 docs, just now)
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

## Connection Diagnostics

### Test Connection Tool

Use the test-connection script to diagnose connection issues:

```bash
# Test connection to a peer
pnpm tsx scripts/test-connection.ts /ip4/127.0.0.1/tcp/9090/p2p/12D3KooWEyoppNCUx8Yx66oV9fJnriXwCcXwDDUA2kj6vnc6iDEp

# Output shows step-by-step connection process:
🔍 P2P Connection Test
======================

📍 Target: /ip4/127.0.0.1/tcp/9090/p2p/12D3KooW...
📊 Parsed: IP=127.0.0.1, Port=9090

1️⃣ Testing network connectivity...
✅ TCP connection successful

2️⃣ Creating test P2P node...
✅ Test node created
📍 Our Peer ID: 12D3KooWBvbH1jEKVA8dhfgKiGuUkXJKxJDfZeB8NjFxHXzQW5xK

3️⃣ Attempting P2P connection...
🔄 Dialing peer...
✅ P2P connection established!
📡 Remote Peer: 12D3KooWEyoppNCUx8Yx66oV9fJnriXwCcXwDDUA2kj6vnc6iDEp
🔗 Connection ID: 1234567890
📊 Status: open
📊 Active streams: 2
✅ Connection closed cleanly

🏁 Test complete
```

This tool helps identify:
- Network connectivity issues
- Incorrect multiaddr format
- Server not running
- Firewall blocking connections

## Advanced Testing

### Multi-Peer Network
```bash
# Terminal 1 - Server (uses ports 9090 & 9091)
pnpm tsx scripts/server-peer.ts 9090

# Terminal 2 - Client 1 (uses ports 9092 & 9093)
pnpm tsx scripts/client-peer.ts 9092

# Terminal 3 - Client 2 (uses ports 9094 & 9095)
pnpm tsx scripts/client-peer.ts 9094

# Terminal 4 - Client 3 (uses ports 9096 & 9097)
pnpm tsx scripts/client-peer.ts 9096
```

**Port Allocation Summary:**
- Server: 9090 (TCP) + 9091 (WebSocket)
- Client 1: 9092 (TCP) + 9093 (WebSocket)
- Client 2: 9094 (TCP) + 9095 (WebSocket)
- Client 3: 9096 (TCP) + 9097 (WebSocket)

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
- `connect <multiaddr>` - Manually connect to a peer
- `peers` - Show known peers
- `downloads` - Show downloaded documents
- `send <file> <peer-id>` - Send file to peer
- `request <peer-id>` - Request files from peer

### Network Troubleshooting

1. **Port Conflicts:**
   - Remember: Each peer uses TWO consecutive ports (base + base+1)
   - Check both ports are free: `lsof -i :9090 && lsof -i :9091`
   - Kill conflicting processes: `kill -9 <PID>`
   - Common error: "EADDRINUSE: address already in use"

2. **Connection Issues:**
   - Check firewall settings for both TCP and WebSocket ports
   - Verify all required ports are available
   - Enable mDNS for local discovery

3. **Transfer Failures:**
   - Verify peer IDs are correct
   - Check file sizes against limits
   - Monitor debug logs for errors

4. **Discovery Problems:**
   - **mDNS (Local Discovery)**:
     - Ensure peers are on same local network/subnet
     - Check firewall allows multicast (224.0.0.251:5353)
     - Disable VPN which may block multicast
     - Wait 5-10 seconds after starting for discovery
   
   - **Manual Connection**:
     - Use the full multiaddr including peer ID
     - Ensure the IP address is reachable (ping test)
     - Check both TCP and WebSocket ports are open
     - Try connecting to localhost first for testing
   
   - **Connection Refused**:
     - Verify the server is running and listening
     - Check the multiaddr is copied correctly
     - Ensure no NAT/firewall blocking the connection
     - Try using the LAN IP instead of localhost
   
   - **"All multiaddr dials failed" error**:
     - **Check server status**: Ensure server peer is actually running
     - **Verify IP address**: Use the actual IP from server output, not just 127.0.0.1
     - **Check both ports**: Remember server uses TWO ports (e.g., 9090 and 9091)
     - **Try WebSocket address**: If TCP fails, try the WebSocket multiaddr ending in /ws
     - **Test connectivity**: `ping <server-ip>` to verify network connectivity
     - **Firewall check**: Temporarily disable firewall to test
     - **Use correct format**: Full multiaddr must include /p2p/<peer-id> at the end

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