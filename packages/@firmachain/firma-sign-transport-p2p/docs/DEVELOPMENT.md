# Development Guide

## Prerequisites

- Node.js 18+
- pnpm
- Understanding of P2P networking concepts

## Setup

1. Clone the repository
2. Install dependencies:
```bash
pnpm install
```

## Development Workflow

### Building

```bash
# Build the package
pnpm build

# Build in watch mode
pnpm dev
```

### Testing

```bash
# Run tests
pnpm test

# Run tests in watch mode
pnpm test:watch
```

### Linting

```bash
# Run linter
pnpm lint

# Fix linting issues
pnpm lint --fix
```

## Project Structure

```
src/
├── P2PTransport.ts    # Main transport implementation
├── types.ts           # Type definitions
└── index.ts           # Package exports
```

## Working with libp2p

### Creating a Node

```typescript
import { createLibp2p } from 'libp2p';
import { tcp } from '@libp2p/tcp';

const node = await createLibp2p({
  addresses: {
    listen: ['/ip4/0.0.0.0/tcp/0']
  },
  transports: [tcp()]
});

await node.start();
```

### Implementing Protocols

```typescript
// Define protocol
const PROTOCOL = '/my-app/1.0.0';

// Handle protocol
node.handle(PROTOCOL, async ({ stream }) => {
  // Handle incoming stream
});

// Dial protocol
const stream = await node.dialProtocol(peerId, PROTOCOL);
```

### Stream Handling

```typescript
import { pipe } from 'it-pipe';
import { fromString, toString } from 'uint8arrays';

// Send data
await pipe(
  ['Hello World'],
  (source) => map(source, (str) => fromString(str)),
  stream.sink
);

// Receive data
const data = await pipe(
  stream.source,
  (source) => map(source, (buf) => toString(buf.subarray())),
  async (source) => {
    const chunks = [];
    for await (const chunk of source) {
      chunks.push(chunk);
    }
    return chunks.join('');
  }
);
```

## Testing P2P Connections

### Local Testing

```typescript
// Create two nodes for testing
const node1 = await createTestNode(9091);
const node2 = await createTestNode(9092);

// Connect nodes
await node1.dial(node2.getMultiaddrs()[0]);

// Verify connection
const connections = node1.getConnections(node2.peerId);
expect(connections).toHaveLength(1);
```

### Multi-Node Testing

```typescript
describe('P2P Network', () => {
  let nodes: Libp2p[] = [];

  beforeEach(async () => {
    // Create network of nodes
    for (let i = 0; i < 5; i++) {
      const node = await createTestNode(9090 + i);
      nodes.push(node);
    }
  });

  afterEach(async () => {
    // Clean up
    await Promise.all(nodes.map(n => n.stop()));
  });

  test('should discover peers', async () => {
    // Test peer discovery
  });
});
```

## Debugging

### Enable Debug Logging

```bash
# Enable all libp2p debug logs
DEBUG=libp2p:* pnpm dev

# Enable specific module logs
DEBUG=libp2p:tcp,libp2p:connection pnpm dev
```

### Common Issues

#### Port Already in Use

```bash
# Find process using port
lsof -i :9090

# Kill process
kill -9 <PID>
```

#### Connection Refused

- Check firewall settings
- Verify correct multiaddr format
- Ensure both nodes are running

#### Peer Discovery Not Working

- Check mDNS is enabled
- Verify nodes are on same network
- Try manual dial with full address

### Debug Utilities

```typescript
// Log all events
node.addEventListener('peer:discovery', (evt) => {
  console.log('Discovered:', evt.detail.id);
});

node.addEventListener('connection:open', (evt) => {
  console.log('Connected:', evt.detail.remotePeer);
});

// Monitor connections
setInterval(() => {
  console.log('Connections:', node.getConnections().length);
  console.log('Peers:', node.getPeers().length);
}, 5000);
```

## Performance Testing

### Throughput Testing

```typescript
async function testThroughput(size: number) {
  const data = crypto.randomBytes(size);
  const start = Date.now();
  
  await transport.send({
    transferId: 'perf-test',
    documents: [{
      id: 'test',
      fileName: 'test.bin',
      mimeType: 'application/octet-stream',
      size: data.length,
      data
    }],
    recipients: [...]
  });
  
  const duration = Date.now() - start;
  const throughput = (size / duration) * 1000; // bytes/sec
  console.log(`Throughput: ${throughput / 1024 / 1024} MB/s`);
}
```

### Connection Scaling

```typescript
async function testConnectionScaling(count: number) {
  const connections = [];
  
  for (let i = 0; i < count; i++) {
    const conn = await node.dial(peerAddr);
    connections.push(conn);
  }
  
  console.log(`Established ${connections.length} connections`);
}
```

## Contributing

### Code Style

- Use TypeScript strict mode
- Follow ESLint rules
- Add JSDoc comments for public APIs
- Write tests for new features

### Pull Request Process

1. Create feature branch
2. Write tests
3. Update documentation
4. Run linting and tests
5. Submit PR with description

### Testing Requirements

- Unit tests for all public methods
- Integration tests for protocols
- Error case coverage
- Performance benchmarks for changes

## Advanced Topics

### Custom Protocols

```typescript
// Implement custom protocol
class CustomProtocol {
  static PROTOCOL = '/firma-sign/custom/1.0.0';
  
  constructor(private node: Libp2p) {
    this.node.handle(CustomProtocol.PROTOCOL, this.handler);
  }
  
  private handler = async ({ stream, connection }) => {
    // Protocol implementation
  };
}
```

### NAT Traversal

```typescript
// Configure for NAT traversal
const node = await createLibp2p({
  transports: [
    tcp(),
    webSockets(),
    webRTC() // Best for NAT traversal
  ],
  services: {
    autoNAT: autoNAT(),
    uPnPNAT: uPnPNAT()
  }
});
```

### Connection Encryption

```typescript
// Custom encryption configuration
import { noise } from '@chainsafe/libp2p-noise';
import { tls } from '@libp2p/tls';

const node = await createLibp2p({
  connectionEncryption: [noise(), tls()]
});
```

## Resources

- [libp2p Documentation](https://docs.libp2p.io/)
- [libp2p Examples](https://github.com/libp2p/js-libp2p/tree/master/examples)
- [Protocol Specs](https://github.com/libp2p/specs)
- [P2P Networking Concepts](https://docs.libp2p.io/concepts/)