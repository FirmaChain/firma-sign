# @firmachain/firma-sign-transport-p2p

## Overview

P2P transport implementation for the Firma-Sign document signing system. This package provides direct peer-to-peer connectivity using libp2p, enabling secure document transfers without intermediary servers.

## Installation

```bash
pnpm add @firmachain/firma-sign-transport-p2p
```

## Quick Start

```typescript
import { P2PTransport } from '@firmachain/firma-sign-transport-p2p';

// Create and initialize transport
const transport = new P2PTransport();

await transport.initialize({
  port: 9090,
  enableDHT: true,
  enableMDNS: true
});

// Send documents
const result = await transport.send({
  transferId: 'transfer-123',
  documents: [{
    id: 'doc1',
    fileName: 'contract.pdf',
    mimeType: 'application/pdf',
    size: 1024000,
    data: documentBuffer
  }],
  recipients: [{
    id: 'recipient1',
    identifier: '12D3KooWEyoppNCUx8Yx66oV9fJnriXwCcXwDDUA2kj6vnc6iDEp',
    transport: 'p2p'
  }]
});

// Receive documents
transport.receive({
  onTransferReceived: async (transfer) => {
    console.log('Received:', transfer.transferId);
    console.log('From:', transfer.sender.senderId);
    console.log('Documents:', transfer.documents.length);
  },
  onError: (error) => {
    console.error('Error:', error);
  }
});
```

## Features

- **Multiple Transports**: TCP, WebSocket, and WebRTC
- **Peer Discovery**: DHT and mDNS
- **Stream Multiplexing**: Yamux and Mplex
- **NAT Traversal**: WebRTC for connectivity
- **Encryption**: Built-in with libp2p
- **Connection Management**: Automatic with limits

## Documentation

- [API Reference](./API.md)
- [Architecture](./ARCHITECTURE.md)
- [Development Guide](./DEVELOPMENT.md)
- [Configuration](./CONFIGURATION.md)
- [Troubleshooting](./TROUBLESHOOTING.md)

## License

MIT