/**
 * Core transport interface that all transport implementations must follow
 */

import { OutgoingTransfer, TransferResult } from './transfer';
import { IncomingTransferHandler } from './handler';

export interface Transport {
  /**
   * Unique identifier for this transport
   */
  readonly name: string;

  /**
   * Version of the transport implementation
   */
  readonly version: string;

  /**
   * Capabilities and limitations of this transport
   */
  readonly capabilities: TransportCapabilities;

  /**
   * Initialize the transport with configuration
   */
  initialize(config: TransportConfig): Promise<void>;

  /**
   * Gracefully shutdown the transport
   */
  shutdown(): Promise<void>;

  /**
   * Send documents through this transport
   */
  send(transfer: OutgoingTransfer): Promise<TransferResult>;

  /**
   * Start receiving documents through this transport
   */
  receive(handler: IncomingTransferHandler): void;

  /**
   * Stop receiving documents
   */
  stopReceiving(): void;

  /**
   * Get current status of the transport
   */
  getStatus(): TransportStatus;

  /**
   * Validate configuration for this transport
   */
  validateConfig(config: unknown): config is TransportConfig;
}

export interface TransportCapabilities {
  /**
   * Maximum file size supported in bytes
   */
  maxFileSize: number;

  /**
   * Whether this transport supports batch document transfers
   */
  supportsBatch: boolean;

  /**
   * Whether this transport provides end-to-end encryption
   */
  supportsEncryption: boolean;

  /**
   * Whether this transport can send notifications
   */
  supportsNotifications: boolean;

  /**
   * Whether this transport supports resumable transfers
   */
  supportsResume: boolean;

  /**
   * Required configuration fields
   */
  requiredConfig: string[];
}

export interface TransportConfig {
  [key: string]: unknown;
}

export interface TransportStatus {
  isInitialized: boolean;
  isReceiving: boolean;
  activeTransfers: number;
  lastError?: string;
  statistics?: TransportStatistics;
}

export interface TransportStatistics {
  totalSent: number;
  totalReceived: number;
  totalErrors: number;
  averageTransferTime?: number;
}