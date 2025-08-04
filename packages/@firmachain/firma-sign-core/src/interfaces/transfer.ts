/**
 * Transfer-related interfaces
 */

import { Document } from './document';

export interface Transfer {
	/**
	 * Unique identifier for this transfer
	 */
	transferId: string;

	/**
	 * When the transfer was created
	 */
	createdAt: Date;

	/**
	 * Current status of the transfer
	 */
	status: TransferStatus;

	/**
	 * Transport used for this transfer
	 */
	transport: string;
}

export interface OutgoingTransfer extends Transfer {
	/**
	 * Documents to be sent
	 */
	documents: Document[];

	/**
	 * Recipients of the documents
	 */
	recipients: Recipient[];

	/**
	 * Transfer options
	 */
	options?: TransferOptions;

	/**
	 * Sender information
	 */
	sender: SenderInfo;
}

export interface IncomingTransfer extends Transfer {
	/**
	 * Documents received
	 */
	documents: Document[];

	/**
	 * Information about the sender
	 */
	sender: SenderInfo;

	/**
	 * Transfer metadata
	 */
	metadata: TransferMetadata;
}

export interface Recipient {
	/**
	 * Unique identifier for the recipient
	 */
	id: string;

	/**
	 * Recipient identifier (email, discord ID, etc.)
	 */
	identifier: string;

	/**
	 * Display name
	 */
	name?: string;

	/**
	 * Which documents this recipient should sign
	 */
	documentIds?: string[];

	/**
	 * Recipient-specific options
	 */
	options?: RecipientOptions;
}

export interface RecipientOptions {
	/**
	 * Preferred transport for this recipient
	 */
	preferredTransport?: string;

	/**
	 * Whether to send notifications
	 */
	notificationEnabled?: boolean;

	/**
	 * Custom message for this recipient
	 */
	message?: string;
}

export interface SenderInfo {
	/**
	 * Unique sender identifier
	 */
	senderId: string;

	/**
	 * Organization or person name
	 */
	name: string;

	/**
	 * Contact email
	 */
	email?: string;

	/**
	 * Public key for verification
	 */
	publicKey?: string;

	/**
	 * Transport used by sender
	 */
	transport: string;

	/**
	 * When the transfer was sent
	 */
	timestamp: Date;

	/**
	 * Verification status
	 */
	verificationStatus: 'verified' | 'unverified' | 'failed';
}

export interface TransferOptions {
	/**
	 * Deadline for signing
	 */
	deadline?: Date;

	/**
	 * Whether all signatures are required
	 */
	requireAllSignatures?: boolean;

	/**
	 * Custom message for all recipients
	 */
	message?: string;

	/**
	 * Whether to encrypt the transfer
	 */
	encrypt?: boolean;

	/**
	 * Priority level
	 */
	priority?: 'low' | 'normal' | 'high';
}

export interface TransferMetadata {
	/**
	 * Deadline for signing
	 */
	deadline?: Date;

	/**
	 * Custom message from sender
	 */
	message?: string;

	/**
	 * Whether all signatures are required
	 */
	requireAllSignatures: boolean;

	/**
	 * Number of required signatures
	 */
	requiredSignatures: number;

	/**
	 * Additional custom metadata
	 */
	[key: string]: unknown;
}

export interface TransferResult {
	/**
	 * Whether the transfer was successful
	 */
	success: boolean;

	/**
	 * Transfer ID if successful
	 */
	transferId?: string;

	/**
	 * Error message if failed
	 */
	error?: string;

	/**
	 * Detailed results per recipient
	 */
	recipientResults?: RecipientResult[];
}

export interface RecipientResult {
	/**
	 * Recipient ID
	 */
	recipientId: string;

	/**
	 * Whether delivery was successful
	 */
	success: boolean;

	/**
	 * Delivery status
	 */
	status: 'sent' | 'delivered' | 'failed';

	/**
	 * Error message if failed
	 */
	error?: string;

	/**
	 * Additional delivery information
	 */
	deliveryInfo?: Record<string, unknown>;
}

export type TransferStatus =
	| 'pending'
	| 'sending'
	| 'sent'
	| 'delivered'
	| 'opened'
	| 'signing'
	| 'partially-signed'
	| 'completed'
	| 'failed'
	| 'cancelled';
