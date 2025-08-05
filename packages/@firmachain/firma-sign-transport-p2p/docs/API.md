# API Reference

## Classes

### P2PTransport

Main P2P transport implementation.

#### Constructor

```typescript
new P2PTransport()
```

Creates a new P2P transport instance.

#### Methods

##### initialize

```typescript
async initialize(config: P2PTransportConfig): Promise<void>
```

Initialize the P2P node with configuration.

**Parameters:**
- `config` - P2P transport configuration

**Example:**
```typescript
await transport.initialize({
  port: 9090,
  enableDHT: true,
  enableMDNS: true,
  bootstrapNodes: [
    '/ip4/104.131.131.82/tcp/4001/p2p/QmaCpDMGvV2BGHeYERUEnRQAwe3N8SzbUtfsmvsqQLuvuJ'
  ]
});
```

##### send

```typescript
async send(transfer: OutgoingTransfer): Promise<TransferResult>
```

Send documents to recipients.

**Parameters:**
- `transfer` - Outgoing transfer data

**Returns:** Transfer result with status for each recipient

##### receive

```typescript
receive(handler: IncomingTransferHandler): void
```

Register a handler for incoming transfers.

**Parameters:**
- `handler` - Handler for incoming transfers

##### shutdown

```typescript
async shutdown(): Promise<void>
```

Stop the P2P node and clean up resources.

##### getStatus

```typescript
getStatus(): TransportStatus
```

Get current transport status.

**Returns:** Transport status including connection info

## Interfaces

### P2PTransportConfig

Configuration options for P2P transport.

```typescript
interface P2PTransportConfig {
  port?: number;              // P2P port (default: 9090)
  enableDHT?: boolean;        // Enable DHT (default: true)
  enableMDNS?: boolean;       // Enable mDNS (default: true)
  bootstrapNodes?: string[];  // Bootstrap node addresses
  announceAddresses?: string[]; // Addresses to announce
  maxConnections?: number;    // Max connections (default: 50)
  connectionTimeout?: number; // Connection timeout in ms
}
```

### PeerInfo

Information about a connected peer.

```typescript
interface PeerInfo {
  id: string;                    // Peer ID
  addresses: Multiaddr[];        // Peer addresses
  protocols: string[];           // Supported protocols
  metadata?: Record<string, any>; // Peer metadata
}
```

### ConnectionInfo

Information about a connection.

```typescript
interface ConnectionInfo {
  id: string;              // Connection ID
  remotePeer: string;      // Remote peer ID
  remoteAddr: Multiaddr;   // Remote address
  status: 'connecting' | 'open' | 'closing' | 'closed';
  direction: 'inbound' | 'outbound';
  timeline: {
    open?: number;       // Connection opened timestamp
    upgraded?: number;   // Protocol upgraded timestamp
    close?: number;      // Connection closed timestamp
  };
}
```

## Constants

### P2P_PROTOCOL

Base Firma-Sign protocol identifier.

```typescript
const P2P_PROTOCOL = '/firma-sign/1.0.0';
```

### P2P_TRANSFER_PROTOCOL

Transfer protocol identifier.

```typescript
const P2P_TRANSFER_PROTOCOL = '/firma-sign/transfer/1.0.0';
```

### DEFAULT_P2P_PORT

Default P2P listening port.

```typescript
const DEFAULT_P2P_PORT = 9090;
```

## Events

The P2P transport emits events through the libp2p node:

### connection:open

Emitted when a new connection is established.

```typescript
node.addEventListener('connection:open', (event) => {
  const connection = event.detail;
  console.log('Connected to:', connection.remotePeer);
});
```

### connection:close

Emitted when a connection is closed.

```typescript
node.addEventListener('connection:close', (event) => {
  const connection = event.detail;
  console.log('Disconnected from:', connection.remotePeer);
});
```

### peer:discovery

Emitted when a new peer is discovered.

```typescript
node.addEventListener('peer:discovery', (event) => {
  const peerInfo = event.detail;
  console.log('Discovered peer:', peerInfo.id);
});
```

## Error Codes

Common error codes returned by the transport:

- `TRANSPORT_NOT_INITIALIZED` - Transport not initialized
- `TRANSFER_SEND_FAILED` - Failed to send transfer
- `TRANSFER_RECEIVE_FAILED` - Failed to receive transfer
- `PEER_NOT_FOUND` - Peer not found in network
- `CONNECTION_FAILED` - Failed to establish connection

## Usage Examples

### Basic Setup

```typescript
import { P2PTransport } from '@firmachain/firma-sign-transport-p2p';

const transport = new P2PTransport();

// Initialize with default settings
await transport.initialize({ port: 9090 });

// Check status
const status = transport.getStatus();
console.log('Peer ID:', status.info.peerId);
console.log('Addresses:', status.info.addresses);
```

### Sending Files

```typescript
const result = await transport.send({
  transferId: 'transfer-123',
  documents: [{
    id: 'doc1',
    fileName: 'agreement.pdf',
    mimeType: 'application/pdf',
    size: 2048000,
    data: pdfBuffer,
    hash: 'sha256hash...'
  }],
  recipients: [{
    id: 'recipient1',
    identifier: '12D3KooWEyoppNCUx8Yx66oV9fJnriXwCcXwDDUA2kj6vnc6iDEp',
    transport: 'p2p'
  }]
});

console.log('Transfer success:', result.success);
result.recipients.forEach(r => {
  console.log(`Recipient ${r.recipientId}: ${r.status}`);
});
```

### Receiving Files

```typescript
transport.receive({
  onTransferReceived: async (transfer) => {
    console.log('Transfer ID:', transfer.transferId);
    console.log('Sender:', transfer.sender.senderId);
    
    for (const doc of transfer.documents) {
      console.log('Document:', doc.fileName);
      // Process document...
    }
  },
  onError: (error) => {
    console.error('Transport error:', error);
  }
});
```

### Advanced Configuration

```typescript
await transport.initialize({
  port: 9090,
  enableDHT: true,
  enableMDNS: false, // Disable mDNS
  bootstrapNodes: [
    '/dnsaddr/bootstrap.libp2p.io/p2p/QmNnooDu7bfjPFoTZYxMNLWUQJyrVwtbZg5gBMjTezGAJN',
    '/dnsaddr/bootstrap.libp2p.io/p2p/QmQCU2EcMqAqQPR2i9bChDtGNJchTbq5TbXJJ16u19uLTa'
  ],
  maxConnections: 100,
  connectionTimeout: 30000 // 30 seconds
});
```