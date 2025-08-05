export type TransferType = 'incoming' | 'outgoing';
export type TransferStatus = 'pending' | 'ready' | 'partially-signed' | 'completed' | 'cancelled';
export type DocumentStatus = 'pending' | 'signed' | 'rejected';
export type RecipientStatus = 'pending' | 'notified' | 'viewed' | 'signing' | 'signed' | 'rejected';

export interface Transfer {
  id: string;
  type: TransferType;
  status: TransferStatus;
  sender?: SenderInfo;
  transportType: string;
  transportConfig?: Record<string, unknown>;
  metadata?: TransferMetadata;
  createdAt: Date;
  updatedAt: Date;
}

export interface SenderInfo {
  senderId: string;
  name: string;
  email?: string;
  publicKey: string;
  transport: string;
  timestamp: number;
  verificationStatus: 'verified' | 'unverified';
}

export interface TransferMetadata {
  deadline?: string;
  message?: string;
  requireAllSignatures?: boolean;
}

export interface Document {
  id: string;
  transferId: string;
  fileName: string;
  fileSize: number;
  fileHash: string;
  status: DocumentStatus;
  signedAt?: Date;
  signedBy?: string;
  blockchainTxOriginal?: string;
  blockchainTxSigned?: string;
  createdAt: Date;
}

export interface Recipient {
  id: string;
  transferId: string;
  identifier: string;
  transport: string;
  status: RecipientStatus;
  preferences?: RecipientPreferences;
  notifiedAt?: Date;
  viewedAt?: Date;
  signedAt?: Date;
  createdAt: Date;
}

export interface RecipientPreferences {
  fallbackTransport?: string;
  notificationEnabled?: boolean;
  [key: string]: unknown;
}