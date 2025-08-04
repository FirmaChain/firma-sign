/**
 * Handler interfaces for receiving transfers
 */

import { IncomingTransfer } from './transfer';
import { SignedDocument } from './document';

export interface IncomingTransferHandler {
  /**
   * Called when a new transfer is received
   */
  onTransferReceived(transfer: IncomingTransfer): Promise<void>;

  /**
   * Called when a transfer is updated (e.g., status change)
   */
  onTransferUpdated?(transfer: IncomingTransfer): Promise<void>;

  /**
   * Called when documents are signed and ready to be returned
   */
  onDocumentsSigned?(documents: SignedDocument[], transferId: string): Promise<void>;

  /**
   * Called when an error occurs
   */
  onError(error: TransportError): void;
}

export interface TransportError extends Error {
  /**
   * Error code for programmatic handling
   */
  code: string;

  /**
   * Which transport encountered the error
   */
  transport: string;

  /**
   * Transfer ID if applicable
   */
  transferId?: string;

  /**
   * Additional error details
   */
  details?: Record<string, unknown>;

  /**
   * Whether the error is recoverable
   */
  recoverable?: boolean;
}

export class TransportErrorImpl extends Error implements TransportError {
  constructor(
    public code: string,
    public transport: string,
    message: string,
    public transferId?: string,
    public details?: Record<string, unknown>,
    public recoverable: boolean = false
  ) {
    super(message);
    this.name = 'TransportError';
  }
}