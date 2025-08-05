# Configuration

## Configuration Options

The P2P transport can be configured with the following options:

### Basic Configuration

```typescript
interface P2PTransportConfig {
  port?: number;              // P2P listening port
  enableDHT?: boolean;        // Enable DHT for peer discovery
  enableMDNS?: boolean;       // Enable mDNS for local discovery
  bootstrapNodes?: string[];  // Bootstrap node addresses
  announceAddresses?: string[]; // Addresses to announce
  maxConnections?: number;    // Maximum peer connections
  connectionTimeout?: number; // Connection timeout in milliseconds
}
```

## Configuration Examples

### Default Configuration

```typescript
const transport = new P2PTransport();
await transport.initialize({
  port: 9090
});
```

This uses the default settings:
- DHT enabled
- mDNS enabled
- Max 50 connections
- Standard transports (TCP, WebSocket, WebRTC)

### Production Configuration

```typescript
await transport.initialize({
  port: 9090,
  enableDHT: true,
  enableMDNS: false, // Disable for production
  bootstrapNodes: [
    '/dns4/node1.example.com/tcp/9090/p2p/QmNode1...',
    '/dns4/node2.example.com/tcp/9090/p2p/QmNode2...',
    '/dns4/node3.example.com/tcp/9090/p2p/QmNode3...'
  ],
  announceAddresses: [
    '/dns4/mynode.example.com/tcp/9090'
  ],
  maxConnections: 100,
  connectionTimeout: 60000 // 1 minute
});
```

### Local Development Configuration

```typescript
await transport.initialize({
  port: 9090,
  enableDHT: false,  // Faster startup
  enableMDNS: true,  // Find local peers
  maxConnections: 10 // Lower for development
});
```

### NAT Traversal Configuration

```typescript
await transport.initialize({
  port: 9090,
  enableDHT: true,
  announceAddresses: [
    '/ip4/0.0.0.0/tcp/9090',
    '/dns4/mynode.dyndns.org/tcp/9090'
  ]
});
```

## Network Addresses

### Listen Addresses

The transport automatically listens on:
- `/ip4/0.0.0.0/tcp/{port}` - TCP connections
- `/ip4/0.0.0.0/tcp/{port+1}/ws` - WebSocket connections

### Announce Addresses

Custom announce addresses for nodes behind NAT:

```typescript
announceAddresses: [
  '/ip4/203.0.113.1/tcp/9090',        // Public IP
  '/dns4/example.com/tcp/9090',        // DNS name
  '/dnsaddr/example.com'               // DNS address
]
```

## Bootstrap Nodes

### Public Bootstrap Nodes

For testing, you can use IPFS bootstrap nodes:

```typescript
bootstrapNodes: [
  '/dnsaddr/bootstrap.libp2p.io/p2p/QmNnooDu7bfjPFoTZYxMNLWUQJyrVwtbZg5gBMjTezGAJN',
  '/dnsaddr/bootstrap.libp2p.io/p2p/QmQCU2EcMqAqQPR2i9bChDtGNJchTbq5TbXJJ16u19uLTa',
  '/dnsaddr/bootstrap.libp2p.io/p2p/QmbLHAnMoJPWSCR5Zhtx6BHJX9KiKNN6tpvbUcqanj75Nb',
  '/dnsaddr/bootstrap.libp2p.io/p2p/QmcZf59bWwK5XFi76CZX8cbJ4BhTzzA3gU1ZjYZcYW3dwt'
]
```

### Private Bootstrap Nodes

For production, use your own bootstrap nodes:

```typescript
bootstrapNodes: [
  '/ip4/10.0.0.1/tcp/9090/p2p/QmYourNode1...',
  '/ip4/10.0.0.2/tcp/9090/p2p/QmYourNode2...'
]
```

## Environment Variables

The transport can also be configured via environment variables:

```bash
# P2P port
P2P_PORT=9090

# Enable/disable features
P2P_ENABLE_DHT=true
P2P_ENABLE_MDNS=false

# Bootstrap nodes (comma-separated)
P2P_BOOTSTRAP_NODES="/dns4/node1.example.com/tcp/9090/p2p/Qm..."

# Connection limits
P2P_MAX_CONNECTIONS=100
P2P_CONNECTION_TIMEOUT=60000
```

## Advanced Configuration

### Custom Transports

```typescript
// Example: TCP-only configuration
const customConfig = {
  port: 9090,
  transports: ['tcp'], // Coming in future versions
  enableDHT: true
};
```

### Connection Manager

```typescript
// Fine-tuned connection management
const config = {
  port: 9090,
  maxConnections: 200,
  minConnections: 10,
  connectionTimeout: 30000,
  maxData: 100 * 1024 * 1024, // 100MB per connection
  maxEventLoopDelay: 150 // milliseconds
};
```

### Security Configuration

```typescript
// Enhanced security settings
const config = {
  port: 9090,
  enablePrivateNetwork: true,
  connectionGater: {
    allowedPeers: [
      'QmAllowedPeer1...',
      'QmAllowedPeer2...'
    ]
  }
};
```

## Troubleshooting Configuration

### Debug Configuration

```typescript
// Verbose logging
const config = {
  port: 9090,
  debug: true,
  logLevel: 'debug'
};
```

### Test Configuration

```typescript
// Minimal config for testing
const config = {
  port: 0, // Random port
  enableDHT: false,
  enableMDNS: false,
  maxConnections: 5
};
```

## Performance Tuning

### High Throughput

```typescript
const config = {
  port: 9090,
  maxConnections: 500,
  connectionTimeout: 120000,
  streamTimeout: 300000,
  maxStreamsPerConnection: 1024
};
```

### Low Latency

```typescript
const config = {
  port: 9090,
  enableDHT: false, // Faster peer resolution
  connectionTimeout: 5000,
  dialTimeout: 3000
};
```

### Resource Constrained

```typescript
const config = {
  port: 9090,
  maxConnections: 20,
  enableDHT: false,
  enableMDNS: true
};
```

## Monitoring

### Metrics Configuration

```typescript
const config = {
  port: 9090,
  metrics: {
    enabled: true,
    port: 9091,
    endpoint: '/metrics'
  }
};
```

### Health Check

```typescript
const config = {
  port: 9090,
  healthCheck: {
    enabled: true,
    interval: 30000,
    timeout: 5000
  }
};
```