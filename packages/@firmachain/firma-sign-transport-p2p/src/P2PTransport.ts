import { createLibp2p, Libp2p } from 'libp2p';
import { tcp } from '@libp2p/tcp';
import { webSockets } from '@libp2p/websockets';
// WebRTC import is conditionally loaded to avoid native dependencies in tests
import { mplex } from '@libp2p/mplex';
import { yamux } from '@chainsafe/libp2p-yamux';
import { kadDHT } from '@libp2p/kad-dht';
import { mdns } from '@libp2p/mdns';
import { pipe } from 'it-pipe';
import { fromString as uint8ArrayFromString } from 'uint8arrays/from-string';
import { toString as uint8ArrayToString } from 'uint8arrays/to-string';
import { nanoid } from 'nanoid';
import { peerIdFromString } from '@libp2p/peer-id';
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
    const options = this.buildNodeOptions(this.config);

    try {
      this.node = await createLibp2p(options);
      await this.node.start();
      
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

  private buildNodeOptions(config: P2PTransportConfig) {
    const port = config.port || DEFAULT_P2P_PORT;
    
    // Build transports array, conditionally including WebRTC
    const transports = [tcp(), webSockets()];
    
    // Only include WebRTC if explicitly enabled and not in test environment
    const isTestEnv = process.env.NODE_ENV === 'test' || process.env.VITEST === 'true';
    if (config.enableWebRTC === true && !isTestEnv) {
      try {
        // Dynamic import to avoid native dependency in tests
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const webRTCModule = require('@libp2p/webrtc') as { webRTC: () => unknown };
        transports.push(webRTCModule.webRTC());
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
      services: {
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

    this.node.addEventListener('connection:open', (event) => {
      const connection = event.detail;
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