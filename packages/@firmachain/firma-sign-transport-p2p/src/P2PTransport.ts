import { createLibp2p, Libp2p } from 'libp2p';
import { tcp } from '@libp2p/tcp';
import { webSockets } from '@libp2p/websockets';
// WebRTC import is conditionally loaded to avoid native dependencies in tests
import { mplex } from '@libp2p/mplex';
import { yamux } from '@chainsafe/libp2p-yamux';
import { noise } from '@chainsafe/libp2p-noise';
import { tls } from '@libp2p/tls';
import { kadDHT } from '@libp2p/kad-dht';
import { mdns } from '@libp2p/mdns';
import { identify } from '@libp2p/identify';
import { pipe } from 'it-pipe';
import { fromString as uint8ArrayFromString } from 'uint8arrays/from-string';
import { toString as uint8ArrayToString } from 'uint8arrays/to-string';
import { nanoid } from 'nanoid';
import { peerIdFromString } from '@libp2p/peer-id';
import { multiaddr } from '@multiformats/multiaddr';
import type {
  Transport,
  TransportCapabilities,
  TransportConfig,
  TransportStatus,
  OutgoingTransfer,
  TransferResult,
  IncomingTransferHandler,
  TransportError,
  IncomingTransfer,
  Document,
  SenderInfo,
} from '@firmachain/firma-sign-core';
import type { P2PTransportConfig, ConnectionInfo } from './types';
import { P2P_TRANSFER_PROTOCOL, DEFAULT_P2P_PORT } from './types';

export class P2PTransport implements Transport {
  readonly name = 'p2p';
  readonly version = '1.0.0';
  readonly capabilities: TransportCapabilities = {
    maxFileSize: 500 * 1024 * 1024, // 500MB
    supportsBatch: true,
    supportsEncryption: true,
    supportsNotifications: true,
    supportsResume: true,
    requiredConfig: ['port'],
  };

  private node: Libp2p | null = null;
  private config: P2PTransportConfig = {};
  private handlers: Map<string, IncomingTransferHandler> = new Map();
  private connections: Map<string, ConnectionInfo> = new Map();
  private isInitialized = false;

  async initialize(config: TransportConfig): Promise<void> {
    if (this.isInitialized) {
      throw new Error('P2P transport already initialized');
    }

    if (!this.validateConfig(config)) {
      throw new Error('Invalid P2P transport configuration');
    }

    this.config = config as P2PTransportConfig;
    const options = await this.buildNodeOptions(this.config);

    try {
      this.node = await createLibp2p(options);
      await this.node.start();
      
      // Debug: Log actual listening addresses
      console.log('🔌 P2P Transport listening on:');
      this.node.getMultiaddrs().forEach(addr => {
        console.log(`   ${addr.toString()}`);
      });
      
      this.setupProtocolHandlers();
      this.setupEventHandlers();
      
      this.isInitialized = true;
    } catch (error) {
      throw new Error(`Failed to initialize P2P transport: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async shutdown(): Promise<void> {
    if (!this.node) return;

    try {
      await this.node.stop();
      this.node = null;
      this.handlers.clear();
      this.connections.clear();
      this.isInitialized = false;
    } catch (error) {
      throw new Error(`Failed to shutdown P2P transport: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async send(transfer: OutgoingTransfer): Promise<TransferResult> {
    if (!this.node) {
      // Return failed result instead of throwing for graceful error handling
      const recipientResults = transfer.recipients.map(recipient => ({
        recipientId: recipient.id,
        success: false,
        status: 'failed' as const,
        error: 'P2P transport not initialized',
      }));

      return {
        success: false,
        transferId: transfer.transferId,
        recipientResults,
      };
    }

    const results = await Promise.allSettled(
      transfer.recipients.map(recipient => this.sendToRecipient(transfer, recipient.identifier))
    );

    const recipientResults = results.map((result, index) => ({
      recipientId: transfer.recipients[index].id,
      success: result.status === 'fulfilled',
      status: result.status === 'fulfilled' ? 'sent' as const : 'failed' as const,
      error: result.status === 'rejected' ? String(result.reason) : undefined,
    }));

    return {
      success: recipientResults.some(r => r.success),
      transferId: transfer.transferId,
      recipientResults,
    };
  }

  receive(handler: IncomingTransferHandler): void {
    const handlerId = nanoid();
    this.handlers.set(handlerId, handler);
  }

  stopReceiving(): void {
    this.handlers.clear();
  }

  getStatus(): TransportStatus {
    if (!this.node) {
      return {
        isInitialized: false,
        isReceiving: false,
        activeTransfers: 0,
        lastError: 'Not initialized',
      };
    }

    const connections = this.node.getConnections();

    return {
      isInitialized: this.isInitialized,
      isReceiving: this.handlers.size > 0,
      activeTransfers: connections.length,
      statistics: {
        totalSent: 0,
        totalReceived: 0,
        totalErrors: 0,
      },
    };
  }

  /**
   * Get list of connected peers
   */
  getConnectedPeers(): Array<{ peerId: string; direction: string; multiaddrs: string[] }> {
    if (!this.node) return [];
    
    const connections = this.node.getConnections();
    const peersMap = new Map<string, { peerId: string; direction: string; multiaddrs: string[] }>();
    
    connections.forEach(conn => {
      const peerId = conn.remotePeer.toString();
      if (!peersMap.has(peerId)) {
        peersMap.set(peerId, {
          peerId,
          direction: conn.direction,
          multiaddrs: [conn.remoteAddr.toString()]
        });
      } else {
        peersMap.get(peerId)!.multiaddrs.push(conn.remoteAddr.toString());
      }
    });
    
    return Array.from(peersMap.values());
  }

  /**
   * Manually connect to a peer
   */
  async connectToPeer(multiaddrStr: string): Promise<void> {
    if (!this.node) throw new Error('Transport not initialized');
    
    try {
      console.log(`🔗 Attempting to connect to: ${multiaddrStr}`);
      
      // For debugging: log our own peer info
      console.log(`📍 Our peer ID: ${this.node.peerId.toString()}`);
      console.log(`📍 Our addresses:`, this.node.getMultiaddrs().map(ma => ma.toString()));
      
      // Check if we're already connected
      const connections = this.node.getConnections();
      console.log(`📊 Current connections: ${connections.length}`);
      
      // Try to parse the multiaddr to extract peer ID
      const peerIdMatch = multiaddrStr.match(/\/p2p\/([^/]+)$/);
      if (peerIdMatch) {
        const targetPeerId = peerIdMatch[1];
        const existingConn = connections.find(c => c.remotePeer.toString() === targetPeerId);
        if (existingConn) {
          console.log(`✅ Already connected to peer ${targetPeerId}`);
          return;
        }
      }
      
      // libp2p dial expects either a PeerId or a properly formatted multiaddr
      console.log('🔄 Initiating connection...');
      
      // If the multiaddr contains a peer ID, we can try different approaches
      if (peerIdMatch && peerIdMatch[1]) {
        const targetPeerId = peerIdMatch[1];
        
        // First, let's check if we have any existing addresses for this peer
        // Using the libp2p node's services to check peer addresses
        try {
          const peerId = peerIdFromString(targetPeerId);
          const addresses = await this.node.peerStore.get(peerId);
          if (addresses && addresses.addresses && addresses.addresses.length > 0) {
            console.log(`📋 Found ${addresses.addresses.length} known addresses for peer ${targetPeerId}`);
          }
        } catch {
          // Peer not in address book yet
        }
        
        // Try to dial using the peer ID directly
        // This will work if the peer is already known (via discovery)
        try {
          const peerId = peerIdFromString(targetPeerId);
          const connection = await this.node.dial(peerId);
          console.log(`✅ Successfully connected using peer ID: ${targetPeerId}`);
          console.log(`📡 Connection ID: ${connection.id}`);
          console.log(`🔄 Connection status: ${connection.status}`);
          return;
        } catch {
          console.log('⚠️  Direct peer ID dial failed, trying full multiaddr...');
        }
      }
      
      // If direct peer ID didn't work, use the full multiaddr
      // Now we have the proper multiaddr package imported
      try {
        console.log('📍 Parsing multiaddr:', multiaddrStr);
         
        const ma = multiaddr(multiaddrStr);
        console.log('✅ Multiaddr parsed successfully');
        
         
        const connection = await this.node.dial(ma);
        
        console.log(`✅ Successfully connected to peer: ${connection.remotePeer.toString()}`);
        console.log(`📡 Connection ID: ${connection.id}`);
        console.log(`🔄 Connection status: ${connection.status}`);
      } catch (error) {
        console.error('❌ Failed to connect with multiaddr:', error);
        throw new Error(`Unable to connect using multiaddr: ${multiaddrStr}`);
      }
      
    } catch (error) {
      console.error('❌ Connection error:', error);
      
      // More detailed error analysis
      if (error instanceof Error) {
        if (error.message.includes('ECONNREFUSED')) {
          console.log('❌ Connection refused - the server is not listening on this address');
          console.log('💡 Tips:');
          console.log('   - Verify the server is running: Check the server terminal');
          console.log('   - Check the IP address: Use the actual IP, not localhost if on different machines');
          console.log('   - Verify the port: Server uses TWO ports (e.g., 9090 for TCP, 9091 for WebSocket)');
        } else if (error.message.includes('No transport available')) {
          console.log('❌ No compatible transport - check the protocol in the multiaddr');
          console.log('💡 Make sure to use /tcp/ not /ws/ for the primary connection');
        } else if (error.message.includes('dial to self')) {
          console.log('❌ Cannot dial to self - you are trying to connect to your own peer ID');
        }
      }
      
      throw new Error(`Failed to connect to peer: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  validateConfig(config: unknown): config is TransportConfig {
    if (typeof config !== 'object' || config === null) {
      return false;
    }

    const p2pConfig = config as P2PTransportConfig;
    
    // Port is required as per capabilities.requiredConfig
    if (p2pConfig.port === undefined || typeof p2pConfig.port !== 'number') {
      return false;
    }
    
    // Validate port range
    if (p2pConfig.port < 1024 || p2pConfig.port > 65535) {
      return false;
    }

    return true;
  }

  private async buildNodeOptions(config: P2PTransportConfig) {
    const port = config.port || DEFAULT_P2P_PORT;
    console.log(`🔧 P2P Transport config - Requested port: ${config.port}, Using port: ${port}`);
    
    // Build transports array, conditionally including WebRTC
    const transports = [tcp(), webSockets()];
    
    // Only include WebRTC if explicitly enabled and not in test environment
    const isTestEnv = process.env.NODE_ENV === 'test' || process.env.VITEST === 'true';
    if (config.enableWebRTC === true && !isTestEnv) {
      try {
        // Dynamic import to avoid native dependency in tests
        const webRTCModule = await import('@libp2p/webrtc');
        // eslint-disable-next-line @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-explicit-any
        transports.push(webRTCModule.webRTC() as any);
      } catch (error) {
        console.warn('WebRTC transport not available:', error instanceof Error ? error.message : String(error));
      }
    }
    
    return {
      addresses: {
        listen: [
          `/ip4/0.0.0.0/tcp/${port}`,
          `/ip4/0.0.0.0/tcp/${port + 1}/ws`,
        ],
      },
      transports,
      streamMuxers: [yamux(), mplex()],
       
      connectionEncrypters: [noise(), tls()],
      services: {
        identify: identify(), // Required by DHT and other services
        ...(config.enableDHT !== false && { dht: kadDHT() }),
        ...(config.enableMDNS !== false && { mdns: mdns() }),
      },
      connectionManager: {
        maxConnections: config.maxConnections || 50,
        minConnections: 2,
        autoDial: true,
      },
    };
  }

  private setupProtocolHandlers(): void {
    if (!this.node) return;

    void this.node.handle(P2P_TRANSFER_PROTOCOL, ({ stream, connection }) => {
      void (async () => {
        try {
          const data = await pipe(
          stream.source,
          async function* (source) {
            const chunks: Uint8Array[] = [];
            for await (const chunk of source) {
              chunks.push(chunk.subarray());
            }
            yield chunks;
          },
          async (source) => {
            const chunks: Uint8Array[] = [];
            for await (const chunk of source) {
              chunks.push(...chunk);
            }
            return chunks;
          }
        );

        interface TransferDataType {
          transferId: string;
          documents: Array<{
            id: string;
            fileName: string;
            mimeType: string;
            size: number;
            data: string;
            hash?: string;
            metadata?: Record<string, unknown>;
          }>;
          sender?: SenderInfo;
          options?: unknown;
        }
        const transferData = JSON.parse(uint8ArrayToString(Buffer.concat(data))) as TransferDataType;
        const remotePeer = connection.remotePeer.toString();
        const incomingTransfer = this.mapToIncomingTransfer(transferData, remotePeer);
        
        for (const handler of this.handlers.values()) {
          await handler.onTransferReceived(incomingTransfer);
        }

          await pipe([uint8ArrayFromString(JSON.stringify({ success: true }))], stream.sink);
        } catch (error) {
          const transportError: TransportError = {
            name: 'TransportError',
            message: `Failed to handle transfer: ${error instanceof Error ? error.message : String(error)}`,
            code: 'TRANSFER_RECEIVE_FAILED',
            transport: this.name,
            details: error as Record<string, unknown>,
          };

          for (const handler of this.handlers.values()) {
            handler.onError(transportError);
          }
        }
      })();
    });
  }

  private setupEventHandlers(): void {
    if (!this.node) return;

    // Peer discovery event
    this.node.addEventListener('peer:discovery', (event) => {
      const peerInfo = event.detail;
      console.log(`🔍 Discovered peer: ${peerInfo.id.toString()}`);
      
      // Auto-dial discovered peers (optional, can be controlled by config)
      if (this.config.autoDialPeers !== false) {
        void this.node!.dial(peerInfo.id).catch(err => {
          console.log(`⚠️  Could not dial peer ${peerInfo.id.toString()}: ${err instanceof Error ? err.message : String(err)}`);
        });
      }
    });

    this.node.addEventListener('connection:open', (event) => {
      const connection = event.detail;
      console.log(`✅ Connected to peer: ${connection.remotePeer.toString()}`);
      this.connections.set(connection.id, {
        id: connection.id,
        remotePeer: connection.remotePeer.toString(),
        remoteAddr: connection.remoteAddr,
        status: 'open',
        direction: connection.direction,
        timeline: {
          open: Date.now(),
        },
      });
    });

    this.node.addEventListener('connection:close', (event) => {
      const connection = event.detail;
      console.log(`❌ Disconnected from peer: ${connection.remotePeer.toString()}`);
      this.connections.delete(connection.id);
    });
  }

  private async sendToRecipient(transfer: OutgoingTransfer, peerId: string): Promise<void> {
    if (!this.node) {
      throw new Error('Node not initialized');
    }

    const peer = peerIdFromString(peerId);
    const stream = await this.node.dialProtocol(peer, P2P_TRANSFER_PROTOCOL);
    
    const transferData = {
      transferId: transfer.transferId,
      documents: transfer.documents.map(doc => ({
        ...doc,
        data: doc.data instanceof Buffer ? doc.data.toString('base64') : doc.data,
      })),
      sender: {
        senderId: this.node.peerId.toString(),
        name: 'P2P Node',
        transport: this.name,
        timestamp: Date.now(),
        verificationStatus: 'verified' as const,
      },
      options: transfer.options,
    };

    await pipe(
      [uint8ArrayFromString(JSON.stringify(transferData))],
      stream.sink
    );

    const response = await pipe(
      stream.source,
      async function* (source) {
        const chunks: Uint8Array[] = [];
        for await (const chunk of source) {
          chunks.push(chunk.subarray());
        }
        yield chunks;
      },
      async (source) => {
        const chunks: Uint8Array[] = [];
        for await (const chunk of source) {
          chunks.push(...chunk);
        }
        return chunks;
      }
    );

    const result = JSON.parse(uint8ArrayToString(Buffer.concat(response))) as { success: boolean };
    if (!result.success) {
      throw new Error('Transfer rejected by peer');
    }
  }

  private mapToIncomingTransfer(data: {
    transferId: string;
    documents: Array<{
      id: string;
      fileName: string;
      mimeType: string;
      size: number;
      data: string;
      hash?: string;
      metadata?: Record<string, unknown>;
    }>;
    sender?: SenderInfo;
    options?: unknown;
  }, senderId: string): IncomingTransfer {
    const documents: Document[] = data.documents.map(doc => ({
      id: doc.id,
      fileName: doc.fileName,
      fileSize: doc.size,
      mimeType: doc.mimeType,
      hash: doc.hash || '',
      data: Buffer.from(doc.data, 'base64'),
      metadata: doc.metadata ? {
        createdAt: new Date(),
        ...doc.metadata,
      } : undefined,
    }));

    const sender: SenderInfo = data.sender || {
      senderId,
      name: `Peer ${senderId.slice(-6)}`,
      transport: this.name,
      timestamp: new Date(),
      verificationStatus: 'unverified' as const,
    };

    return {
      transferId: data.transferId,
      documents,
      sender,
      createdAt: new Date(),
      status: 'delivered' as const,
      transport: this.name,
      metadata: {
        requireAllSignatures: false,
        requiredSignatures: 1,
      },
    };
  }
}