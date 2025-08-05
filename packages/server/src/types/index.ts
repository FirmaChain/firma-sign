export * from './database.js';

export interface TransferRequest {
  transferId: string;
  sender: {
    nodeId: string;
    name: string;
    email?: string;
    publicKey: string;
  };
  documents: Array<{
    documentId: string;
    fileName: string;
    fileSize: number;
    hash: string;
    signers: string[];
  }>;
  recipientCode: string;
  transport: {
    type: 'p2p' | 'email' | 'discord' | 'telegram' | 'web';
    config?: Record<string, unknown>;
  };
  metadata: {
    deadline?: string;
    message?: string;
    requireAllSignatures: boolean;
  };
}

export interface TransferResult {
  success: boolean;
  transferId: string;
  code?: string;
  error?: string;
}

export interface TransportConfig {
  [key: string]: unknown;
}

export interface OutgoingTransfer {
  transferId: string;
  documents: Array<{
    id: string;
    fileName: string;
    fileSize: number;
    fileHash: string;
  }>;
  recipients: Array<{
    identifier: string;
    transport: string;
  }>;
  options?: Record<string, unknown>;
}