import type { 
  Transport, 
  TransportCapabilities,
  OutgoingTransfer,
  TransferResult,
  IncomingTransferHandler,
  TransportError
} from '@firmachain/firma-sign-core';
import { EventEmitter } from 'events';
import { logger } from '../utils/logger.js';

export interface TransportConfig {
  [key: string]: any;
}

export class TransportManager extends EventEmitter {
  private transports: Map<string, Transport> = new Map();
  private handlers: Map<string, IncomingTransferHandler> = new Map();
  private initialized = false;

  async register(transport: Transport): Promise<void> {
    if (this.transports.has(transport.name)) {
      throw new Error(`Transport ${transport.name} is already registered`);
    }

    logger.info(`Registering transport: ${transport.name}`);
    this.transports.set(transport.name, transport);

    const handler: IncomingTransferHandler = {
      onTransferReceived: async (transfer) => {
        logger.info(`Transfer received via ${transport.name}:`, { transferId: transfer.transferId });
        this.emit('transfer:received', { transport: transport.name, transfer });
      },
      onError: (error: TransportError) => {
        logger.error(`Transport error in ${transport.name}:`, error);
        this.emit('transport:error', { transport: transport.name, error });
      }
    };

    this.handlers.set(transport.name, handler);
    transport.receive(handler);
  }

  async configure(transportName: string, config: TransportConfig): Promise<void> {
    const transport = this.transports.get(transportName);
    if (!transport) {
      throw new Error(`Transport ${transportName} not found`);
    }

    if (!transport.validateConfig(config)) {
      throw new Error(`Invalid configuration for transport ${transportName}`);
    }

    await transport.initialize(config);
    logger.info(`Transport ${transportName} initialized`);
  }

  async send(transportName: string, transfer: OutgoingTransfer): Promise<TransferResult> {
    const transport = this.transports.get(transportName);
    if (!transport) {
      throw new Error(`Transport ${transportName} not found`);
    }

    logger.info(`Sending transfer via ${transportName}:`, { transferId: transfer.transferId });
    return await transport.send(transfer);
  }

  getAvailableTransports(): Array<{ name: string; capabilities: TransportCapabilities }> {
    return Array.from(this.transports.entries()).map(([name, transport]) => ({
      name,
      capabilities: transport.capabilities
    }));
  }

  async shutdown(): Promise<void> {
    logger.info('Shutting down all transports');
    
    const shutdownPromises = Array.from(this.transports.values()).map(transport =>
      transport.shutdown().catch(err => 
        logger.error(`Error shutting down ${transport.name}:`, err)
      )
    );

    await Promise.all(shutdownPromises);
    this.transports.clear();
    this.handlers.clear();
    this.removeAllListeners();
  }
}