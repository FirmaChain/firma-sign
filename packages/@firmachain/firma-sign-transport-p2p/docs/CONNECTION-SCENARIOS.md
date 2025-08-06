# P2P Transport Connection Scenarios Guide

## Overview

This guide explains how the `@firmachain/firma-sign-transport-p2p` package handles different network environments and connection scenarios. The package automatically adapts to various network conditions to establish the best possible connection.

## Connection Modes

The transport package supports three connection modes that you can configure:

```typescript
const p2pTransport = new P2PTransport();

// Let the package choose the best method automatically (recommended)
await p2pTransport.initialize({ mode: 'auto' });

// Force direct P2P only (fastest but may fail in restrictive networks)
await p2pTransport.initialize({ mode: 'direct' });

// Always use relay server (works everywhere but slower)
await p2pTransport.initialize({ mode: 'relay' });
```

## Connection Scenarios

### 1. Same WiFi/Local Network

**Scenario**: Both peers are on the same local network (home WiFi, office LAN)

**What happens**:

- Transport discovers peers via local network broadcast
- Direct connection established immediately
- No internet required after initial setup
- Fastest possible transfer speeds
- Data never leaves the local network

**Configuration**:

```typescript
// Automatic mode will detect and use local connection
await p2pTransport.initialize({
	mode: 'auto',
	enableLocalDiscovery: true, // Enabled by default
});

// Generate connection key
const key = await p2pTransport.generateConnectionKey({
	transferId: 'transfer-123',
	preferLocal: true, // Hints to prefer local discovery
});
```

**Connection flow**:

```
Peer A (Same Network)     Local Network      Peer B (Same Network)
        │                       │                     │
        ├──── Broadcast ────────┼─────────────────────┤
        │    Discovery          │                     │
        │                       │                     │
        ├═══════════ Direct Local Connection ════════┤
        │         (No internet needed)               │
```

### 2. Different Locations/Networks

**Scenario**: Peers are in different locations (different cities, countries)

**What happens**:

- Transport uses STUN servers to discover public IPs
- Attempts direct connection through NAT
- Falls back to relay if direct fails
- Encrypted end-to-end communication

**Configuration**:

```typescript
await p2pTransport.initialize({
	mode: 'auto',
	stunServers: [
		'stun:stun.l.google.com:19302', // Free Google STUN
		'stun:stun1.l.google.com:19302',
	],
	relayServers: [
		'turn:relay.yourcompany.com:3478', // Your relay server
	],
});
```

**Connection flow**:

```
Peer A (City A)          Internet           Peer B (City B)
      │                     │                     │
      ├── STUN Request ─────┼──────────────────→ │
      │   (Get public IP)   │                    │
      │                     │                     │
      ├════ Try Direct P2P Connection ═══════════┤
      │    (Works 70-80% of the time)           │
      │                     │                     │
      └── If fails, use ────┼──────────────────→│
          Relay Server      │                    │
```

### 3. Behind Corporate Firewall

**Scenario**: One or both peers behind strict corporate firewall

**What happens**:

- Direct P2P usually blocked
- Transport automatically detects this
- Falls back to HTTPS relay
- May use WebSocket for persistent connection
- All traffic appears as normal HTTPS

**Configuration**:

```typescript
await p2pTransport.initialize({
	mode: 'auto',
	fallbackToRelay: true, // Always true in auto mode
	relayProtocol: 'https', // Use HTTPS for firewall compatibility
	websocketFallback: true, // Use WebSocket if needed
});

// For very strict firewalls, force relay mode
await p2pTransport.initialize({
	mode: 'relay', // Skip P2P attempts, go straight to relay
	relayServers: [
		'https://relay.yourcompany.com:443', // Use HTTPS port
	],
});
```

**Connection flow**:

```
Peer A (Corporate)     Firewall    Relay Server    Peer B
      │                   X              │            │
      ├── Direct P2P ─────X──────────────────────────┤
      │   (Blocked)       X              │            │
      │                   │              │            │
      ├── HTTPS/WSS ──────✓──────────────┼───────────┤
      │   (Allowed)       │              │            │
      │                   │              │            │
      └═══════════ Via Relay Server ═════════════════┘
              (Appears as normal HTTPS traffic)
```

### 4. Mobile Networks (4G/5G)

**Scenario**: One or both peers on mobile network

**What happens**:

- Carrier-grade NAT makes direct P2P difficult
- Transport uses TURN relay more often
- Optimizes for bandwidth usage
- Handles network changes gracefully

**Configuration**:

```typescript
await p2pTransport.initialize({
	mode: 'auto',
	mobileOptimization: true, // Reduces bandwidth usage
	adaptiveBitrate: true, // Adjusts to network speed
	resumable: true, // Handle network switches
});

// Listen for network changes
p2pTransport.on('networkChange', () => {
	console.log('Network changed, reconnecting...');
});
```

### 5. One Peer Behind Double NAT

**Scenario**: Home router behind ISP router (double NAT)

**What happens**:

- STUN discovers multiple NAT layers
- Transport tries UDP hole punching
- Higher chance of needing relay
- Still works but may be slower

**Configuration**:

```typescript
await p2pTransport.initialize({
	mode: 'auto',
	aggressiveNatTraversal: true, // Try harder to punch through
	multipleStunServers: true, // Use multiple STUN servers
});
```

### 6. Symmetric NAT (Most Challenging)

**Scenario**: Both peers behind symmetric NAT (some corporate/carrier networks)

**What happens**:

- Direct P2P almost impossible
- Transport quickly detects and uses relay
- Full relay mode for entire transfer
- Still secure with end-to-end encryption

**Configuration**:

```typescript
await p2pTransport.initialize({
	mode: 'auto',
	symmetricNatDetection: true, // Detect symmetric NAT early
	quickFallback: true, // Don't waste time on P2P attempts
});
```

### 7. Mixed Scenarios

**Scenario**: Various combinations of the above

**Example**: Office computer (firewall) to home computer (NAT) to mobile (4G)

**Configuration**:

```typescript
// Universal configuration that handles everything
await p2pTransport.initialize({
	mode: 'auto',

	// Local discovery for same network
	enableLocalDiscovery: true,

	// Public STUN servers for NAT traversal
	stunServers: [
		'stun:stun.l.google.com:19302',
		'stun:stun2.l.google.com:19302',
		'stun:stun3.l.google.com:19302',
	],

	// Relay servers for fallback
	relayServers: [
		'turns:relay1.firma-sign.com:443', // HTTPS relay
		'turn:relay2.firma-sign.com:3478', // Standard TURN
	],

	// Optimizations
	adaptiveBitrate: true,
	resumable: true,
	mobileOptimization: true,

	// Timeouts
	connectionTimeout: 30000, // 30 seconds to establish
	transferTimeout: 3600000, // 1 hour for transfer
});
```

## Connection Success Rates by Scenario

| Scenario               | Direct P2P Success | Relay Needed | Speed               |
| ---------------------- | ------------------ | ------------ | ------------------- |
| Same WiFi              | 100%               | Never        | Fastest (100+ MB/s) |
| Home to Home           | 85-90%             | 10-15%       | Fast (10-50 MB/s)   |
| Home to Mobile         | 70-80%             | 20-30%       | Medium (1-10 MB/s)  |
| Office to Home         | 40-60%             | 40-60%       | Medium (1-10 MB/s)  |
| Office to Office       | 20-30%             | 70-80%       | Slow (0.5-5 MB/s)   |
| Behind Strict Firewall | 0-10%              | 90-100%      | Slow (0.5-5 MB/s)   |
| Symmetric NAT          | 0-5%               | 95-100%      | Slow (0.5-5 MB/s)   |

## Diagnostic Tools

The package includes diagnostic tools to understand connection issues:

```typescript
// Check connection capability
const diagnosis = await p2pTransport.diagnoseConnection();
console.log(diagnosis);
// Output:
// {
//   natType: 'moderate',  // 'open', 'moderate', 'strict', 'symmetric'
//   canDirectP2P: true,
//   needsRelay: false,
//   localIP: '192.168.1.100',
//   publicIP: '203.0.113.45',
//   stunReachable: true,
//   relayReachable: true
// }

// Test connection to specific peer
const testResult = await p2pTransport.testConnection('ABC-123');
console.log(testResult);
// Output:
// {
//   reachable: true,
//   method: 'direct',  // 'direct', 'relay', 'failed'
//   latency: 45,       // milliseconds
//   bandwidth: 10.5    // MB/s estimate
// }
```

## Best Practices

### 1. Always Use Auto Mode

```typescript
// Let the package figure out the best connection method
await p2pTransport.initialize({ mode: 'auto' });
```

### 2. Provide Multiple Fallback Options

```typescript
// Configure multiple STUN and relay servers
await p2pTransport.initialize({
	stunServers: [
		/* multiple servers */
	],
	relayServers: [
		/* multiple servers */
	],
});
```

### 3. Handle Connection Events

```typescript
p2pTransport.on('connectionEstablished', (info) => {
	console.log(`Connected via ${info.method}`); // 'direct' or 'relay'
});

p2pTransport.on('connectionFailed', (error) => {
	console.error('Connection failed:', error);
	// Maybe try again or notify user
});

p2pTransport.on('fallbackToRelay', () => {
	console.log('Direct P2P failed, using relay server');
});
```

### 4. Optimize for Your Use Case

**For Internal Company Use**:

```typescript
// Prefer local network, with relay fallback
await p2pTransport.initialize({
	mode: 'auto',
	preferLocal: true,
	relayServers: ['internal-relay.company.com'],
});
```

**For Public Internet Use**:

```typescript
// Optimize for various network conditions
await p2pTransport.initialize({
	mode: 'auto',
	adaptiveBitrate: true,
	mobileOptimization: true,
	resumable: true,
});
```

**For High Security Environments**:

```typescript
// Force relay through controlled servers
await p2pTransport.initialize({
	mode: 'relay',
	relayServers: ['secure-relay.company.com'],
	encryption: 'aes-256-gcm',
});
```

## Troubleshooting

### Connection Fails Immediately

- Check if connection key is valid
- Verify network connectivity
- Ensure firewall allows outbound HTTPS

### Connection Succeeds but Transfer Fails

- Check file size limits
- Verify available disk space
- Look for network interruptions

### Slow Transfer Speeds

- Check if using relay (normal for relay)
- Test bandwidth with diagnostic tool
- Consider network congestion

### Cannot Connect from Office

- Corporate firewall likely blocking
- Try forcing relay mode
- Use HTTPS relay on port 443

## Summary

The `@firmachain/firma-sign-transport-p2p` package automatically handles various network scenarios:

1. **Best case** (same network): Direct local connection, maximum speed
2. **Good case** (home networks): Direct P2P via NAT traversal, good speed
3. **Challenging case** (firewalls): Relay fallback, moderate speed
4. **Worst case** (symmetric NAT): Full relay, slower but reliable

The package abstracts all this complexity, providing a simple interface that "just works" in any network environment. The auto mode intelligently chooses the best connection method without requiring manual configuration.
