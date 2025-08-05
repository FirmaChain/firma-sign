# Troubleshooting

## Common Issues

### Transport Won't Initialize

#### Port Already in Use

**Problem**: Error "Error: listen EADDRINUSE: address already in use :::9090"

**Solution**:
```bash
# Find process using port
lsof -i :9090

# Kill the process
kill -9 <PID>

# Or use a different port
await transport.initialize({ port: 9091 });
```

#### Permission Denied

**Problem**: Cannot bind to port below 1024

**Solution**:
- Use a port above 1024 (recommended)
- Run with elevated permissions (not recommended)
- Use port forwarding

### Connection Issues

#### Cannot Connect to Peers

**Problem**: No connections established

**Solutions**:

1. Check firewall settings:
```bash
# Allow P2P port
sudo ufw allow 9090/tcp
sudo ufw allow 9091/tcp
```

2. Verify peer addresses:
```typescript
const status = transport.getStatus();
console.log('My addresses:', status.info.addresses);
```

3. Test with local peers first:
```typescript
await transport.initialize({
  port: 9090,
  enableMDNS: true // Enable local discovery
});
```

#### Connection Timeouts

**Problem**: Connections timeout before completing

**Solution**:
```typescript
await transport.initialize({
  port: 9090,
  connectionTimeout: 60000 // Increase timeout to 60 seconds
});
```

### Discovery Issues

#### Peers Not Found via DHT

**Problem**: DHT queries return no results

**Solutions**:

1. Ensure DHT is enabled:
```typescript
await transport.initialize({
  port: 9090,
  enableDHT: true
});
```

2. Add bootstrap nodes:
```typescript
await transport.initialize({
  port: 9090,
  bootstrapNodes: [
    '/dnsaddr/bootstrap.libp2p.io/p2p/QmNnooDu7bfjPFoTZYxMNLWUQJyrVwtbZg5gBMjTezGAJN'
  ]
});
```

3. Wait for DHT to populate:
```typescript
// DHT needs time to discover peers
setTimeout(() => {
  // Try operations after DHT has time to populate
}, 10000);
```

#### mDNS Not Working

**Problem**: Local peers not discovered

**Solutions**:

1. Check network configuration:
- Ensure multicast is enabled
- Verify peers are on same subnet
- Check for VPN interference

2. Enable mDNS explicitly:
```typescript
await transport.initialize({
  port: 9090,
  enableMDNS: true
});
```

### Transfer Issues

#### Transfer Fails

**Problem**: Document transfer fails with error

**Solutions**:

1. Check recipient peer ID:
```typescript
// Verify peer is connected
const connections = node.getConnections(peerId);
if (connections.length === 0) {
  // Dial peer first
  await node.dial(peerId);
}
```

2. Verify document size:
```typescript
// Check against max file size
if (document.size > transport.capabilities.maxFileSize) {
  throw new Error('Document too large');
}
```

3. Enable debug logging:
```bash
DEBUG=libp2p:* pnpm dev
```

#### Slow Transfers

**Problem**: Transfers are slower than expected

**Solutions**:

1. Check connection quality:
```typescript
// Monitor connection metrics
const connections = node.getConnections();
connections.forEach(conn => {
  console.log('Connection:', conn.id);
  console.log('Latency:', conn.stat.latency);
});
```

2. Use closer peers:
- Enable mDNS for local transfers
- Use geographically close bootstrap nodes

3. Optimize chunk size:
```typescript
// Adjust transfer chunk size (future feature)
const config = {
  transferChunkSize: 1024 * 1024 // 1MB chunks
};
```

### NAT Traversal Issues

#### Behind NAT/Firewall

**Problem**: Peers cannot connect to node behind NAT

**Solutions**:

1. Use WebRTC transport (automatic NAT traversal):
```typescript
// WebRTC is included by default
await transport.initialize({ port: 9090 });
```

2. Configure port forwarding:
```bash
# Forward external port to internal
# Router config: External 9090 -> Internal 9090
```

3. Use relay nodes (future feature):
```typescript
// Configure relay nodes
const config = {
  enableRelay: true,
  relayNodes: ['/dns4/relay.example.com/tcp/9090/p2p/...']
};
```

### Performance Issues

#### High CPU Usage

**Problem**: Node consuming too much CPU

**Solutions**:

1. Limit connections:
```typescript
await transport.initialize({
  port: 9090,
  maxConnections: 20 // Reduce from default 50
});
```

2. Disable unused features:
```typescript
await transport.initialize({
  port: 9090,
  enableDHT: false, // If not needed
  enableMDNS: false // If not needed
});
```

#### High Memory Usage

**Problem**: Memory usage grows over time

**Solutions**:

1. Monitor connections:
```typescript
setInterval(() => {
  const connections = node.getConnections();
  console.log(`Active connections: ${connections.length}`);
  
  // Close idle connections
  connections.forEach(conn => {
    if (isIdle(conn)) {
      conn.close();
    }
  });
}, 60000);
```

2. Limit peer store size:
```typescript
// Configure peer store limits (future feature)
const config = {
  peerStore: {
    maxPeers: 1000
  }
};
```

## Debug Mode

### Enable Comprehensive Logging

```bash
# All libp2p logs
DEBUG=libp2p:* pnpm dev

# Specific modules
DEBUG=libp2p:connection,libp2p:transport pnpm dev

# P2P transport logs
DEBUG=firma-sign:p2p:* pnpm dev
```

### Debug Utilities

```typescript
// Log all events
function debugNode(node: Libp2p) {
  node.addEventListener('peer:discovery', (evt) => {
    console.log('[Discovery] Found peer:', evt.detail.id);
  });

  node.addEventListener('connection:open', (evt) => {
    console.log('[Connection] Opened:', evt.detail.remotePeer);
  });

  node.addEventListener('connection:close', (evt) => {
    console.log('[Connection] Closed:', evt.detail.remotePeer);
  });

  // Monitor periodically
  setInterval(() => {
    const status = transport.getStatus();
    console.log('[Status]', status);
  }, 10000);
}
```

## Getting Help

### Collect Debug Information

Before reporting issues, collect:

1. Node status:
```typescript
const status = transport.getStatus();
console.log(JSON.stringify(status, null, 2));
```

2. Error logs:
```bash
DEBUG=libp2p:* pnpm dev 2> debug.log
```

3. Network configuration:
```bash
# Check network interfaces
ifconfig

# Check firewall
sudo iptables -L

# Check ports
netstat -an | grep 9090
```

### Support Resources

- GitHub Issues: Report bugs
- libp2p Documentation: [docs.libp2p.io](https://docs.libp2p.io)
- libp2p Forums: Community help
- Discord: Real-time chat support