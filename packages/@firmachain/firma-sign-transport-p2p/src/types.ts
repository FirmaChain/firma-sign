export interface P2PTransportConfig {
  port?: number;
  enableDHT?: boolean;
  enableMDNS?: boolean;
  enableWebRTC?: boolean;
  bootstrapNodes?: string[];
  announceAddresses?: string[];
  maxConnections?: number;
  connectionTimeout?: number;
}

export interface P2PTransportOptions {
  peerId?: string;
  privateKey?: string;
  listen?: string[];
  announce?: string[];
}

export interface PeerInfo {
  id: string;
  addresses: unknown[]; // Multiaddr instances
  protocols: string[];
  metadata?: Record<string, unknown>;
}

export interface ConnectionInfo {
  id: string;
  remotePeer: string;
  remoteAddr: unknown; // Multiaddr instance
  status: 'connecting' | 'open' | 'closing' | 'closed';
  direction: 'inbound' | 'outbound';
  timeline: {
    open?: number;
    upgraded?: number;
    close?: number;
  };
}

export const P2P_PROTOCOL = '/firma-sign/1.0.0';
export const P2P_TRANSFER_PROTOCOL = '/firma-sign/transfer/1.0.0';
export const DEFAULT_P2P_PORT = 9090;