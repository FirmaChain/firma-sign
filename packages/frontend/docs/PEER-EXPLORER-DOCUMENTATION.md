# Peer Explorer Documentation

## Overview

A P2P network explorer for the Firma-Sign frontend that provides real-time peer discovery, connection management, and document transfer capabilities. The Peer Explorer enables users to visualize the P2P network, manage peer connections, and initiate document transfers directly to connected peers.

## Layout Design

### Overall Application Layout

```
┌─────────────────────────────────────────────────────────────────────┐
│                        Header (firma-sign)                          │
├─────────────┬──────────────────────────────────────┬──────────────┤
│             │                                       │              │
│   Sidebar   │       Main Content Area              │ Right Panel  │
│   (250px)   │                                       │   (300px)    │
│             │                                       │              │
│ ┌─────────┐ │ ┌───────────────────────────────────┐│ ┌──────────┐│
│ │File     │ │ │                                    ││ │Peer      ││
│ │Explorer │ │ │    Document Editor/Viewer          ││ │Explorer  ││
│ │         │ │ │                                    ││ │          ││
│ │- Files  │ │ │                                    ││ │- Network ││
│ │- Search │ │ │                                    ││ │  Status  ││
│ │- Tree   │ │ │                                    ││ │- Peers   ││
│ └─────────┘ │ └───────────────────────────────────┘│ │- Transfer││
│             │                                       │ └──────────┘│
└─────────────┴──────────────────────────────────────┴──────────────┘
```

### Peer Explorer Component Structure

```
PeerExplorer
├── Header Section
│   ├── Title ("Network Peers")
│   ├── Connection Status Indicator
│   └── Action Buttons (Connect, Refresh, Settings)
├── Network Status
│   ├── Local Peer ID
│   ├── Connection Count
│   ├── Network Health
│   └── Bootstrap Status
├── Search Bar
│   ├── Search Peers Input
│   ├── Filter Options (Online/Offline/All)
│   └── Clear Button
├── Peer List
│   ├── Connected Peers Section
│   │   ├── Peer Card
│   │   │   ├── Peer Avatar/Icon
│   │   │   ├── Peer ID (truncated)
│   │   │   ├── Connection Quality
│   │   │   ├── Last Activity
│   │   │   └── Action Buttons
│   │   └── Real-time Status Updates
│   ├── Discovered Peers Section
│   │   └── Available for Connection
│   └── Recent Peers Section
│       └── Previously Connected
├── Transfer Panel (Collapsible)
│   ├── Active Transfers
│   ├── Transfer Progress
│   └── Transfer History
└── Context Menu (Right-click on peer)
    ├── Send Document
    ├── View Details
    ├── Copy Peer ID
    ├── Block Peer
    └── Disconnect
```

## Component Hierarchy

```typescript
<App>
  <div className="flex">
    <Sidebar>
      <FileExplorer />
    </Sidebar>
    <MainContent>
      <DocumentsModule />
    </MainContent>
    <RightPanel>
      <PeerExplorer>
        <PeerExplorerHeader />
        <NetworkStatus />
        <PeerSearch />
        <PeerList>
          <ConnectedPeers>
            <PeerCard />
          </ConnectedPeers>
          <DiscoveredPeers>
            <PeerCard />
          </DiscoveredPeers>
          <RecentPeers>
            <PeerCard />
          </RecentPeers>
        </PeerList>
        <TransferPanel />
        <PeerContextMenu />
      </PeerExplorer>
    </RightPanel>
  </div>
</App>
```

## Features

### 1. Network Visualization

- **Real-time Status**: Show current network health and connectivity
- **Peer Discovery**: Automatic discovery via DHT and mDNS
- **Connection Graph**: Visual representation of peer connections
- **Network Metrics**: Latency, bandwidth, connection quality
- **Bootstrap Nodes**: Display and manage bootstrap connections

### 2. Peer Management

- **Peer List Views**:
  - Connected Peers (active connections)
  - Discovered Peers (available to connect)
  - Recent Peers (connection history)
  - Blocked Peers (user blacklist)
- **Peer Information**:
  - Peer ID (full and truncated views)
  - Connection status and quality
  - Last seen timestamp
  - Transfer statistics
  - Geographic location (if available)
- **Peer Actions**:
  - Connect/Disconnect
  - Send documents
  - View detailed info
  - Block/Unblock
  - Add to favorites

### 3. Search and Filter

- **Real-time Search**: Filter peers as you type
- **Advanced Filters**:
  - Connection status (connected, discovered, offline)
  - Connection quality (excellent, good, poor)
  - Activity (active, idle, inactive)
  - Transfer history (has transfers, no transfers)
- **Sorting Options**:
  - By connection quality
  - By last activity
  - By peer ID
  - By transfer count

### 4. Document Transfer

- **Quick Transfer**: Drag document from File Explorer to peer
- **Transfer Methods**:
  - Direct send to single peer
  - Broadcast to multiple peers
  - Request document from peer
- **Transfer Management**:
  - Progress tracking with percentage
  - Pause/Resume capability
  - Cancel transfers
  - Retry failed transfers
- **Transfer History**:
  - Completed transfers log
  - Failed transfers with reasons
  - Transfer statistics

### 5. Connection Management

- **Auto-connect**: Automatically connect to discovered peers
- **Connection Limits**: Manage maximum connections
- **Connection Quality**:
  - Visual indicators (green/yellow/red)
  - Latency measurements
  - Packet loss detection
- **Reconnection**: Automatic reconnection to lost peers
- **Manual Connection**: Connect via peer ID input

### 6. Visual Indicators

- **Peer Status**:
  - 🟢 Connected/Online
  - 🟡 Connecting/Discovered
  - 🔴 Offline/Disconnected
  - ⚫ Blocked
- **Connection Quality**:
  - 📶 Excellent (< 50ms)
  - 📶 Good (50-150ms)
  - 📶 Poor (> 150ms)
- **Transfer Status**:
  - ⬆️ Uploading
  - ⬇️ Downloading
  - ✅ Completed
  - ❌ Failed

## User Interactions

### Basic Workflows

1. **Connecting to a Peer**
   - Click "Connect" on discovered peer
   - Or enter peer ID manually
   - Connection established automatically
   - Status updates in real-time

2. **Sending a Document**
   - Method 1: Drag document from File Explorer to peer
   - Method 2: Right-click peer → "Send Document"
   - Method 3: Select document → Click send button
   - Progress shown in Transfer Panel

3. **Managing Connections**
   - View all connected peers
   - Monitor connection quality
   - Disconnect inactive peers
   - Set connection preferences

## Data Structure

```typescript
interface Peer {
	id: string; // Peer ID (libp2p format)
	nickname?: string; // User-friendly name
	status: 'connected' | 'discovered' | 'offline';
	connectionQuality?: 'excellent' | 'good' | 'poor';
	addresses: string[]; // Multiaddresses
	protocols: string[]; // Supported protocols
	lastSeen: Date;
	connectedAt?: Date;
	metadata: {
		version?: string;
		platform?: string;
		capabilities?: string[];
	};
	stats: {
		transfersSent: number;
		transfersReceived: number;
		bytesTransferred: number;
		averageLatency?: number;
	};
}

interface Transfer {
	id: string;
	type: 'outgoing' | 'incoming';
	peerId: string;
	documentId: string;
	documentName: string;
	size: number;
	progress: number; // 0-100
	status: 'pending' | 'active' | 'completed' | 'failed';
	startedAt: Date;
	completedAt?: Date;
	error?: string;
	speed?: number; // bytes/second
	remainingTime?: number; // seconds
}

interface PeerExplorerState {
	localPeerId: string;
	networkStatus: 'connecting' | 'connected' | 'disconnected';
	peers: {
		connected: Peer[];
		discovered: Peer[];
		recent: Peer[];
		blocked: string[]; // Peer IDs
	};
	transfers: {
		active: Transfer[];
		history: Transfer[];
	};
	searchQuery: string;
	filterStatus: 'all' | 'connected' | 'discovered' | 'offline';
	sortBy: 'quality' | 'activity' | 'id' | 'transfers';
	selectedPeers: string[];
}
```

## Technical Implementation

### Components

1. **PeerExplorer.tsx**: Main component coordinating peer management
2. **PeerExplorerHeader.tsx**: Header with network status and actions
3. **NetworkStatus.tsx**: Network health and statistics display
4. **PeerSearch.tsx**: Search and filter functionality
5. **PeerList.tsx**: List of peers organized by status
6. **PeerCard.tsx**: Individual peer display with actions
7. **TransferPanel.tsx**: Active and historical transfers
8. **PeerContextMenu.tsx**: Right-click actions for peers
9. **ConnectionDialog.tsx**: Manual peer connection modal

### Hooks

1. **useP2PNetwork.ts**: P2P network connection and management
2. **usePeerDiscovery.ts**: Peer discovery via DHT/mDNS
3. **usePeerConnection.ts**: Individual peer connection handling
4. **useTransferManager.ts**: Document transfer operations
5. **usePeerSearch.ts**: Search and filter logic
6. **usePeerStorage.ts**: Persist peer data and preferences
7. **useNetworkMetrics.ts**: Network quality monitoring

### State Management

#### Network State

- Stored in memory with real-time updates
- Connection status via WebSocket to server
- Peer list synchronized with P2P transport

#### Transfer State

- Active transfers in memory
- History persisted to localStorage: `peerExplorer_transferHistory`
- Progress updates via WebSocket events

#### User Preferences

- Stored in localStorage:
  - `peerExplorer_favorites`: Favorite peer IDs
  - `peerExplorer_blocked`: Blocked peer IDs
  - `peerExplorer_autoConnect`: Auto-connect preference
  - `peerExplorer_maxConnections`: Connection limit

### P2P Integration

```typescript
// Integration with @firmachain/firma-sign-transport-p2p
import { P2PTransport } from '@firmachain/firma-sign-transport-p2p';

const transport = new P2PTransport();

// Initialize P2P connection
await transport.initialize({
	port: 9090,
	enableDHT: true,
	enableMDNS: true,
});

// Listen for peer events
transport.on('peer:discovery', (peer) => {
	// Update discovered peers list
});

transport.on('peer:connect', (peer) => {
	// Update connected peers list
});

// Send document to peer
await transport.send({
	transferId: 'transfer-123',
	documents: [document],
	recipients: [
		{
			id: 'recipient1',
			identifier: peerId,
			transport: 'p2p',
		},
	],
});
```

### Data Flow

```
P2P Network Events → WebSocket → React State → UI Update
                                      ↓
                              localStorage (preferences)

Transfer Flow:
User selects document → Drag to peer → Create transfer
                                   ↓
                          P2PTransport.send()
                                   ↓
                          Progress updates via WebSocket
                                   ↓
                          UI updates with progress
```

## Styling

### Color Scheme

```css
/* Matches File Explorer theme */
--peer-panel-bg: #1e1e1e;
--peer-card-bg: #2a2d2e;
--peer-card-hover: #3c3c3c;
--peer-card-selected: #094771;
--connection-excellent: #4caf50;
--connection-good: #ffc107;
--connection-poor: #f44336;
--transfer-progress: #2196f3;
--text-primary: #cccccc;
--text-secondary: #969696;
```

### Layout Specifications

- **Panel Width**: 300px (resizable)
- **Min Width**: 250px
- **Max Width**: 500px
- **Peer Card Height**: 72px
- **Avatar Size**: 40px
- **Icon Size**: 16px
- **Font Size**: 13px
- **Card Spacing**: 8px

## Keyboard Shortcuts

| Shortcut           | Action                   |
| ------------------ | ------------------------ |
| `Ctrl/Cmd + P`     | Focus peer search        |
| `Enter`            | Connect to selected peer |
| `Delete`           | Disconnect selected peer |
| `Ctrl/Cmd + T`     | Open transfer panel      |
| `Ctrl/Cmd + Click` | Multi-select peers       |
| `Arrow Keys`       | Navigate peer list       |
| `Ctrl/Cmd + R`     | Refresh peer list        |
| `Ctrl/Cmd + D`     | Send document to peer    |

## Performance Considerations

1. **Virtual Scrolling**: For large peer lists (100+ peers)
2. **Debounced Updates**: Batch network status updates
3. **Lazy Loading**: Load peer details on demand
4. **Connection Pooling**: Reuse existing connections
5. **Transfer Chunking**: Stream large files in chunks
6. **WebSocket Optimization**: Compress messages, batch updates
7. **Memoization**: Cache peer cards and calculations

## Accessibility

- ARIA labels for all peer actions
- Keyboard navigation through peer list
- Screen reader announcements for status changes
- Focus management for dialogs
- High contrast mode support
- Alternative text for all icons

## Integration Points

### With File Explorer

- Drag and drop files to peers
- Visual feedback during drag operations
- Transfer initiation from file context menu

### With DocumentsModule

- Send open document to peer
- Receive documents from peers
- Update document status after transfer

### With Server WebSocket

- Real-time peer status updates
- Transfer progress notifications
- Network health monitoring

### With P2P Transport

- Direct integration with libp2p
- Protocol handling for transfers
- Connection management

## Component File Structure

```
src/components/
├── PeerExplorer/
│   ├── PeerExplorer.tsx           # Main component
│   ├── PeerExplorerHeader.tsx     # Header with actions
│   ├── NetworkStatus.tsx          # Network statistics
│   ├── PeerSearch.tsx             # Search and filter
│   ├── PeerList.tsx               # Organized peer list
│   ├── PeerCard.tsx               # Individual peer display
│   ├── TransferPanel.tsx          # Transfer management
│   ├── PeerContextMenu.tsx        # Right-click menu
│   ├── ConnectionDialog.tsx       # Manual connection
│   ├── types.ts                   # TypeScript types
│   ├── utils.ts                   # Helper functions
│   └── hooks/
│       ├── useP2PNetwork.ts       # Network management
│       ├── usePeerDiscovery.ts    # Peer discovery
│       ├── usePeerConnection.ts   # Connection handling
│       ├── useTransferManager.ts  # Transfer operations
│       ├── usePeerSearch.ts       # Search logic
│       ├── usePeerStorage.ts      # Data persistence
│       └── useNetworkMetrics.ts   # Quality monitoring
```

## Future Enhancements

1. **Network Visualization**: Interactive network graph view
2. **Peer Reputation**: Trust scoring based on transfer history
3. **Group Transfers**: Send to multiple peers simultaneously
4. **Peer Chat**: Simple messaging between peers
5. **Transfer Scheduling**: Queue transfers for optimal bandwidth
6. **Bandwidth Limiting**: Control upload/download speeds
7. **Peer Profiles**: Custom avatars and display names
8. **Transfer Encryption**: End-to-end encryption options
9. **Relay Nodes**: Support for relay connections
10. **Mobile Support**: Responsive design for tablets
11. **Peer Analytics**: Detailed connection statistics
12. **Auto-discovery**: Bluetooth and LAN discovery
13. **Transfer Compression**: Automatic file compression
14. **Peer Clustering**: Group peers by location/network
15. **Notification System**: Desktop notifications for events

## Security Considerations

1. **Peer Verification**: Validate peer identities
2. **Transfer Authentication**: Verify transfer integrity
3. **Rate Limiting**: Prevent spam and DoS
4. **Blacklisting**: Block malicious peers
5. **Encryption**: All transfers encrypted by default
6. **Permission System**: Control who can send documents
7. **Audit Log**: Track all peer interactions

## Benefits

1. **Decentralized**: No central server dependency
2. **Direct Transfer**: Peer-to-peer document sharing
3. **Real-time Updates**: Live network status
4. **User Control**: Full control over connections
5. **Privacy**: No third-party involvement
6. **Efficiency**: Optimal routing and transfer
7. **Resilience**: Network continues despite node failures
8. **Scalability**: Grows with network size

## Review Checklist

- [ ] Layout positioned on right side
- [ ] P2P network integration defined
- [ ] Peer discovery mechanisms documented
- [ ] Transfer functionality specified
- [ ] Real-time updates configured
- [ ] Search and filter capabilities
- [ ] Drag and drop from File Explorer
- [ ] Connection management features
- [ ] Visual indicators and status
- [ ] Keyboard shortcuts defined
- [ ] Performance optimizations planned
- [ ] Accessibility requirements met
- [ ] Security measures outlined
- [ ] Component structure defined
- [ ] State management designed

---

**Status**: Documentation complete. Ready for implementation phase.

## Implementation Roadmap

### Phase 1: Basic Setup (Week 1)

- [ ] Create component structure
- [ ] Implement basic UI layout
- [ ] Set up P2P transport integration
- [ ] Basic peer discovery

### Phase 2: Core Features (Week 2)

- [ ] Peer list management
- [ ] Connection handling
- [ ] Search and filter
- [ ] Network status display

### Phase 3: Transfer System (Week 3)

- [ ] Document transfer implementation
- [ ] Progress tracking
- [ ] Transfer history
- [ ] Drag and drop support

### Phase 4: Polish & Testing (Week 4)

- [ ] Performance optimization
- [ ] Error handling
- [ ] Testing and debugging
- [ ] Documentation updates
