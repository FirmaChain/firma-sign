# Transport Architecture & Connection Lifecycle

## Overview

This document provides a comprehensive guide to Firma-Sign's transport architecture, covering both the current connection lifecycle implementation and the future persistent transport architecture vision. It ensures P2P connections remain stable during development, provides resilient frontend connectivity, and outlines the roadmap for a fully persistent transport layer.

## Table of Contents

1. [Current Implementation](#current-implementation)
2. [Future Vision: Persistent Transport Architecture](#future-vision-persistent-transport-architecture)
3. [Problem Statement & Solutions](#problem-statement--solutions)
4. [Connection Lifecycle](#connection-lifecycle)
5. [Configuration](#configuration)
6. [Implementation Strategy](#implementation-strategy)
7. [Benefits](#benefits)
8. [Monitoring & Observability](#monitoring--observability)
9. [Security Considerations](#security-considerations)
10. [Testing Strategy](#testing-strategy)
11. [Troubleshooting](#troubleshooting)
12. [Migration Plan](#migration-plan)
13. [Future Enhancements](#future-enhancements)

---

## Current Implementation

### Key Improvements Implemented

#### 1. Server Transport Persistence

- **Graceful Shutdown Options**: TransportManager supports preserving connections during development hot reloads
- **Development-Aware Configuration**: Dynamic P2P port allocation in development to avoid conflicts
- **Smart Reconnection**: Automatic reconnection attempts for existing transport instances

#### 2. Frontend WebSocket Resilience

- **Infinite Reconnection**: In development mode, WebSocket connections retry indefinitely
- **Faster Reconnection**: 1-second retry interval in development (vs 3 seconds in production)
- **Improved Error Handling**: Better handling of connection failures and server restarts

#### 3. Development Experience

- **Port Conflict Avoidance**: Random port selection for P2P transport in development
- **Preserved State**: Transport connections survive server restarts when possible
- **Better Logging**: Detailed connection lifecycle information

---

## Future Vision: Persistent Transport Architecture

### Problem Statement

#### Current Issues

1. **Server Restart Breaks Connections**: Development file changes cause server restarts, breaking all P2P connections
2. **Frontend Dependency**: Transport lifecycle is coupled to frontend connection state
3. **Lost Peer Discovery**: Discovered peers are lost on restart, requiring rediscovery
4. **Development Friction**: Developers must manually reconnect peers after each code change

#### Impact

- Poor development experience with constant reconnections
- Lost network state during development iterations
- Inconsistent P2P network topology
- Frontend errors when transport becomes unavailable

### Solution: Persistent Transport Layer

#### Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│                 Persistent Layer                        │
├─────────────────────────────────────────────────────────┤
│  ┌─────────────────┐  ┌─────────────────┐              │
│  │ Transport Pool  │  │  State Store    │              │
│  │ - P2P Node      │  │  - Peer DB      │              │
│  │ - Connections   │  │  - Connection   │              │
│  │ - Discovery     │  │    History      │              │
│  └─────────────────┘  └─────────────────┘              │
├─────────────────────────────────────────────────────────┤
│                 Server Layer                            │
├─────────────────────────────────────────────────────────┤
│  ┌─────────────────┐  ┌─────────────────┐              │
│  │ Transport Mgr   │  │ WebSocket Mgr   │              │
│  │ - References    │  │ - Event Bridge  │              │
│  │ - API Proxy     │  │ - State Sync    │              │
│  └─────────────────┘  └─────────────────┘              │
├─────────────────────────────────────────────────────────┤
│                 Frontend Layer                          │
├─────────────────────────────────────────────────────────┤
│  ┌─────────────────┐  ┌─────────────────┐              │
│  │ Peer Explorer   │  │ WebSocket Client│              │
│  │ - UI State      │  │ - Auto Reconnect│              │
│  │ - Actions       │  │ - State Sync    │              │
│  └─────────────────┘  └─────────────────┘              │
└─────────────────────────────────────────────────────────┘
```

#### Key Components

##### 1. Persistent Transport Pool

- **Independent Process**: Runs separately from the main server
- **Long-Running**: Survives server restarts
- **State Persistence**: Saves peer connections and discovery state
- **API Interface**: Provides REST/WebSocket API for transport operations

##### 2. Transport State Store

- **Peer Database**: SQLite database storing discovered peers
- **Connection History**: Track successful connections and preferences
- **Network Topology**: Maintain network graph for optimal routing
- **Configuration Cache**: Store transport configurations

##### 3. Server Transport Manager (Proxy)

- **Reference Manager**: Maintains references to persistent transports
- **API Proxy**: Forwards transport operations to persistent layer
- **Event Bridge**: Bridges transport events to WebSocket clients
- **Graceful Reconnection**: Reconnects to persistent layer on restart

##### 4. Frontend State Sync

- **Auto-Reconnection**: Automatically reconnect WebSocket on disconnection
- **State Restoration**: Restore UI state from server on reconnection
- **Optimistic Updates**: Continue showing cached state during reconnections
- **Error Recovery**: Handle transport unavailability gracefully

---

## Connection Lifecycle

### Current: Normal Operation Flow

```
1. Server Startup
   ├── Load Configuration (with dynamic ports in dev)
   ├── Initialize TransportManager
   ├── Start P2P Transport on available ports
   ├── Start WebSocket servers (:8080/ws, :8080/explorer)
   └── Begin peer discovery (mDNS enabled, DHT disabled in dev)

2. Frontend Connection
   ├── Connect to ws://localhost:8080/explorer
   ├── Subscribe to peer events
   ├── Receive real-time transport status updates
   └── Display connected peers and transfer state

3. P2P Network Formation
   ├── Discover peers via mDNS (local network)
   ├── Establish peer connections automatically
   ├── Maintain connection pool
   └── Enable direct document transfers
```

### Current: Development Hot Reload Flow

```
1. File Change Detected (tsx/nodemon)
   ├── Server receives SIGUSR2 signal
   ├── Graceful shutdown with preserveConnections=true
   ├── HTTP server closes
   ├── WebSocket servers close
   └── P2P transport connections preserved

2. Server Restart
   ├── New server instance starts
   ├── Attempts to reconnect to existing transports
   ├── WebSocket servers restart on same ports
   └── Frontend auto-reconnects to WebSocket

3. State Restoration
   ├── P2P peers still connected (if preserve succeeded)
   ├── Frontend receives updated transport state
   ├── UI updates with current peer list
   └── Document transfers can continue immediately
```

### Current: Frontend Disconnection/Reconnection

```
1. Connection Loss (server restart, network issue)
   ├── WebSocket connection closes
   ├── Frontend detects disconnection
   ├── Auto-reconnection starts (1s interval in dev)
   └── UI shows connection status

2. Reconnection Success
   ├── WebSocket connection re-established
   ├── Subscribe to previous peer subscriptions
   ├── Sync current transport state
   └── Update UI with latest peer information

3. Infinite Retry (Development)
   ├── maxReconnectAttempts = -1 in development
   ├── Continues retrying until server is back
   ├── No manual intervention required
   └── Seamless development experience
```

### Future: Persistent Transport Lifecycle

#### Normal Operation

```
1. Transport Daemon Starts → Initialize P2P Node
2. Server Starts → Connect to Transport Daemon
3. Frontend Connects → Subscribe to Transport Events
4. Peer Discovery → Persistent Connections Maintained
5. Document Transfers → Via Persistent P2P Connections
```

#### Server Restart (Development)

```
1. Server Stops → Transport Daemon Continues Running
2. P2P Connections → Remain Active
3. Server Restarts → Reconnect to Transport Daemon
4. Frontend Reconnects → Restore State from Transport
5. Operations Resume → No Peer Rediscovery Needed
```

#### Frontend Disconnect

```
1. Frontend Closes → WebSocket Disconnects
2. Transport Daemon → Continues P2P Operations
3. Peer Connections → Remain Active
4. Frontend Reconnects → State Synchronized
5. UI Updates → Reflect Current Transport State
```

---

## Configuration

### Current Implementation

#### Server Configuration

##### Dynamic Port Selection

```typescript
// Development: Random port to avoid conflicts
const basePort = isDevelopment() ? 9090 + Math.floor(Math.random() * 100) : 9090;

// Production: Fixed port
const basePort = 9090;
```

##### Graceful Shutdown Options

```typescript
// Preserve connections in development
await transportManager.shutdown({
	graceful: true,
	preserveConnections: isDevelopment() && isHotReload,
});
```

#### Frontend Configuration

##### Development-Optimized WebSocket

```typescript
const DEFAULT_OPTIONS = {
	url: 'ws://localhost:8080/explorer',
	reconnectInterval: import.meta.env.DEV ? 1000 : 3000,
	maxReconnectAttempts: import.meta.env.DEV ? -1 : 10, // Infinite in dev
	enableHeartbeat: true,
	heartbeatInterval: 30000,
};
```

### Future: Persistent Transport Configuration

#### Transport Daemon Configuration

```yaml
# transport-daemon.yml
transport:
  p2p:
    port: 9092
    persistent: true
    stateFile: ~/.firmasign/p2p-state.db
    discovery:
      dht: true
      mdns: true
      bootstrap:
        - /dnsaddr/bootstrap.libp2p.io/p2p/QmNnooDu7bfjPFoTZYxMNLWUQJyrVwtbZg5gBMjTezGAJN

api:
  port: 9094
  host: localhost
  endpoints:
    - /peers
    - /connections
    - /transfers
    - /discovery

storage:
  stateDir: ~/.firmasign/transport-state
  peerDatabase: peers.db
  connectionHistory: connections.db
```

#### Server Configuration

```yaml
# server.yml
transport:
  daemon:
    url: http://localhost:9094
    reconnectInterval: 1000
    maxRetries: 10
    healthCheck: true

websocket:
  transportBridge: true
  stateSync: true
  autoReconnect: true
```

#### Frontend Configuration

```typescript
// frontend config
const WEBSOCKET_CONFIG = {
	url: 'ws://localhost:8080/explorer',
	autoReconnect: true,
	maxRetries: -1, // infinite
	retryInterval: 1000,
	stateSync: true,
	offlineMode: true,
};
```

---

## Implementation Strategy

### Phase 1: Transport Process Separation

1. Create standalone transport daemon
2. Move P2P transport to separate process
3. Implement IPC communication between server and transport
4. Add state persistence for peer discovery

### Phase 2: Server Proxy Layer

1. Convert TransportManager to proxy pattern
2. Implement transport process lifecycle management
3. Add automatic reconnection to transport daemon
4. Bridge events between transport and WebSocket clients

### Phase 3: Frontend Resilience

1. Implement WebSocket auto-reconnection
2. Add state caching and restoration
3. Handle transport unavailability in UI
4. Add connection status indicators

### Phase 4: Development Tools

1. Add transport daemon management to dev scripts
2. Implement hot-reload without transport restart
3. Add peer connection debugging tools
4. Create transport state inspection UI

---

## Signal Handling

### Server Signal Processing

- **SIGTERM**: Production graceful shutdown
- **SIGINT**: User-initiated shutdown (Ctrl+C)
- **SIGUSR2**: Development hot reload (tsx/nodemon)

### Signal-Specific Behavior

```typescript
const shutdown = async (signal?: string) => {
	const isDevelopment = configManager.isDevelopment();
	const isHotReload = signal === 'SIGUSR2' || isDevelopment;

	// Preserve transport connections for development hot reloads
	const preserveTransports = isDevelopment && isHotReload;

	await transportManager.shutdown({
		graceful: true,
		preserveConnections: preserveTransports,
	});
};
```

---

## Benefits

### For Development

- **No Lost Connections**: Peer connections survive server restarts
- **Faster Iterations**: Immediate reconnection without manual intervention / No need to wait for peer rediscovery
- **Consistent State**: UI reflects actual network state
- **Better Debugging**: Detailed connection lifecycle logging / Transport state is always accessible
- **Conflict Avoidance**: Dynamic port allocation prevents conflicts

### For Production

- **Reliable Connections**: Robust error handling and recovery
- **Graceful Shutdowns**: Proper cleanup on server termination
- **Network Resilience**: Automatic recovery from network issues
- **State Consistency**: Reliable frontend state synchronization
- **High Availability**: Transport layer independent of web server
- **Fault Tolerance**: Server crashes don't break P2P network
- **Scalability**: Multiple server instances can share transport layer
- **Monitoring**: Centralized transport state monitoring

### For Users

- **Seamless Experience**: Transparent reconnections
- **Real-time Updates**: Live connection status / Live transport status
- **Better Performance**: Persistent peer connections / Cached connection state
- **Clear Feedback**: Connection status indicators
- **Reliable Connections**: Consistent peer availability

---

## Error Handling & Recovery

### Transport Connection Failures

- **Port Conflicts**: Automatic port selection in development
- **Connection Drops**: Automatic peer reconnection via libp2p
- **Transport Failures**: Graceful degradation with error reporting

### WebSocket Connection Issues

- **Connection Refused**: Automatic retry with exponential backoff
- **Server Unavailable**: Infinite retry in development
- **Network Partitions**: Resume when network is restored

### Frontend State Management

- **Optimistic Updates**: Show cached state during reconnections
- **State Synchronization**: Restore current state on reconnection
- **Error Display**: Clear user feedback for connection issues

---

## Monitoring & Observability

### Current Implementation

#### Server Logs

```
[info] 🚀 Firma-Sign server running on port 8080
[info] 📡 WebSocket servers ready:
[info]    - Main WebSocket: ws://localhost:8080/ws
[info]    - Explorer WebSocket: ws://localhost:8080/explorer
[info] 🔌 P2P Transport listening on:
[info]    /ip4/127.0.0.1/tcp/9092/p2p/12D3Koo...
[info] 🚛 Transport system ready
```

#### Frontend Connection Status

- Connection state in Peer Explorer header
- Reconnection attempt counter
- Last successful connection time
- Current transport status

#### P2P Network Status

- Connected peer count
- Discovery events
- Connection quality indicators
- Transfer success rates

### Future: Comprehensive Monitoring

#### Transport Daemon Metrics

- Active peer connections
- Discovery events per minute
- Transfer success rates
- Connection latency distribution

#### Server Metrics

- Transport daemon connection status
- WebSocket client connections
- Event bridge throughput
- Reconnection frequency

#### Frontend Metrics

- WebSocket connection uptime
- State sync performance
- UI update latency
- User-perceived availability

---

## Security Considerations

### Current Implementation

- TLS/Noise encryption for P2P connections
- WebSocket authentication tokens
- Secure peer identity verification

### Future: Enhanced Security

#### Transport Isolation

- Transport daemon runs with minimal privileges
- IPC communication over secure channels
- Peer identity verification maintained
- Network traffic encryption enforced

#### State Protection

- Encrypted state persistence
- Access control for transport API
- Audit logging for all operations
- Regular state backup and rotation

---

## Testing Strategy

### Current Testing

#### Unit Tests

- Connection lifecycle scenarios
- WebSocket reconnection logic
- Transport configuration validation

### Future: Comprehensive Testing

#### Unit Tests

- Transport daemon functionality
- Server proxy operations
- Frontend state management
- Error handling scenarios

#### Integration Tests

- End-to-end connection flows
- Server restart scenarios
- Frontend reconnection logic
- State synchronization accuracy

#### Load Tests

- Multiple simultaneous connections
- High-frequency state updates
- Network partition recovery
- Resource usage under load

---

## Troubleshooting

### Common Issues

#### Port Already in Use

```bash
# Check what's using the port
lsof -ti:8080,9092,9093

# Kill processes if needed
kill -9 $(lsof -ti:8080,9092,9093)
```

#### WebSocket Connection Fails

- Check server is running: `http://localhost:8080/health`
- Verify WebSocket endpoint: `ws://localhost:8080/explorer`
- Check browser console for detailed error messages

#### P2P Transport Not Starting

- Check for port conflicts in logs
- Verify P2P configuration
- Ensure no firewall blocking P2P ports

#### Frontend Not Reconnecting

- Check browser developer tools for WebSocket errors
- Verify server WebSocket endpoint is accessible
- Look for CORS issues in development

### Debug Commands

```bash
# Check server health
curl http://localhost:8080/health

# Check transport status
curl http://localhost:8080/api/transports/available

# Check system info
curl http://localhost:8080/api/info

# Monitor WebSocket connection
# Open browser dev tools → Network → WS tab
```

---

## Migration Plan

### Development Environment

1. Start transport daemon automatically with `pnpm dev`
2. Configure server to use transport daemon
3. Update frontend for auto-reconnection
4. Test hot-reload scenarios

### Production Environment

1. Deploy transport daemon as separate service
2. Configure service discovery between components
3. Set up monitoring and alerting
4. Implement rolling deployment strategy

---

## Future Enhancements

### Current Roadmap

1. **Transport State Persistence**: Save P2P peer connections to database
2. **Advanced Reconnection**: Intelligent peer rediscovery strategies
3. **Connection Quality Monitoring**: Real-time connection health metrics
4. **Multi-Instance Support**: Shared transport layer across server instances

### Configuration Options

1. **Configurable Persistence**: Option to disable connection preservation
2. **Custom Retry Strategies**: User-defined reconnection patterns
3. **Transport Priorities**: Preferred transport selection
4. **Bandwidth Management**: Connection throttling and optimization

### Advanced Features

- Multi-transport support (P2P + Email + Discord)
- Intelligent peer routing
- Bandwidth optimization
- Network topology visualization

### Operational Improvements

- Auto-scaling transport capacity
- Predictive peer discovery
- Connection quality monitoring
- Performance optimization suggestions

---

## Conclusion

This architecture provides a comprehensive solution for transport management in Firma-Sign, addressing both immediate development needs and long-term scalability goals. The current implementation offers significant improvements to development experience, while the future persistent transport architecture ensures enterprise-grade reliability and performance.

The phased approach allows for incremental implementation while maintaining backward compatibility and system stability throughout the migration process.
