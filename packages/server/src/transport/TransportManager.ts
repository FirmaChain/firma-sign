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
import { TransportLoader } from './TransportLoader.js';
import type { ConfigManager } from '../config/ConfigManager.js';

export interface TransportConfig {
  [key: string]: unknown;
}

export class TransportManager extends EventEmitter {
  private transports: Map<string, Transport> = new Map();
  private handlers: Map<string, IncomingTransferHandler> = new Map();
  private loader: TransportLoader;
  private configManager: ConfigManager;
  private initialized = false;

  constructor(configManager: ConfigManager) {
    super();
    this.configManager = configManager;
    this.loader = new TransportLoader();
  }

  /**
   * Initialize the transport manager by discovering and configuring transports
   */
  async initialize(): Promise<void> {
    if (this.initialized) return;

    logger.info('Initializing transport manager...');
    
    // Discover installed transport packages
    const discoveredTransports = await this.loader.discoverTransports();
    
    if (discoveredTransports.length === 0) {
      logger.warn('No transport packages found. Install transport packages to enable document transfers:');
      const suggested = this.loader.getSuggestedTransports();
      suggested.forEach(transport => {
        logger.warn(`  ${transport.installCommand} # ${transport.description}`);
      });
    }

    // Register and configure discovered transports
    for (const { transport } of discoveredTransports) {
      try {
        this.register(transport);
        
        // Get transport-specific configuration
        const transportConfig = this.configManager.getTransportConfig(this.getTransportType(transport.name)) as TransportConfig;
        
        if (transportConfig) {
          await this.configure(transport.name, transportConfig);
          logger.info(`✅ Transport ${transport.name} configured and ready`);
        } else {
          logger.info(`⚠️  Transport ${transport.name} registered but not configured`);
        }
      } catch (error) {
        logger.error(`❌ Failed to initialize transport ${transport.name}:`, error);
      }
    }

    this.initialized = true;
    logger.info(`Transport manager initialized with ${this.transports.size} transport(s)`);
  }

  /**
   * Get transport type from package name
   * @example '@firmachain/firma-sign-transport-p2p' -> 'p2p'
   */
  private getTransportType(packageName: string): string {
    const parts = packageName.split('-');
    return parts[parts.length - 1];
  }

  register(transport: Transport): void {
    if (this.transports.has(transport.name)) {
      throw new Error(`Transport ${transport.name} is already registered`);
    }

    logger.info(`Registering transport: ${transport.name}`);
    this.transports.set(transport.name, transport);

    const handler: IncomingTransferHandler = {
      onTransferReceived: (transfer) => {
        logger.info(`Transfer received via ${transport.name}:`, { transferId: transfer.transferId });
        this.emit('transfer:received', { transport: transport.name, transfer });
        return Promise.resolve();
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

  getAvailableTransports(): Array<{ name: string; capabilities: TransportCapabilities; configured: boolean }> {
    return Array.from(this.transports.entries()).map(([name, transport]) => ({
      name,
      capabilities: transport.capabilities,
      configured: transport.getStatus().isInitialized
    }));
  }

  /**
   * Get a specific transport by name
   */
  getTransport(transportName: string): Transport | undefined {
    return this.transports.get(transportName);
  }

  /**
   * Get detailed information about all transports (installed and not installed)
   */
  async getTransportInfo(): Promise<Array<{
    name: string;
    isInstalled: boolean;
    isConfigured: boolean;
    status?: string;
    version?: string;
    description?: string;
    installCommand?: string;
  }>> {
    const info = await this.loader.getAllTransportInfo();
    const suggested = this.loader.getSuggestedTransports();
    
    return info.map(transport => {
      const registeredTransport = this.transports.get(transport.name);
      const suggestedInfo = suggested.find(s => s.name === transport.name);
      
      return {
        name: transport.name,
        isInstalled: transport.isInstalled,
        isConfigured: registeredTransport ? registeredTransport.getStatus().isInitialized : false,
        status: registeredTransport?.getStatus().isInitialized ? 'ready' : 'not ready',
        version: transport.version,
        description: suggestedInfo?.description,
        installCommand: suggestedInfo?.installCommand
      };
    });
  }

  /**
   * Get status of all registered transports
   */
  getTransportsStatus(): Record<string, unknown> {
    const status: Record<string, unknown> = {};
    
    for (const [name, transport] of this.transports) {
      status[name] = transport.getStatus();
    }
    
    return status;
  }

  /**
   * Check if transport manager is ready (initialized and has at least one configured transport)
   */
  isReady(): boolean {
    if (!this.initialized) return false;
    
    for (const transport of this.transports.values()) {
      if (transport.getStatus().isInitialized) {
        return true;
      }
    }
    
    return false;
  }

  /**
   * Reconnect to existing transport instances (useful for development hot reload)
   */
  async reconnect(): Promise<void> {
    if (this.initialized) {
      logger.info('Attempting to reconnect to existing transports...');
      
      // Try to re-initialize existing transports that may still be running
      for (const [name, transport] of this.transports) {
        try {
          const status = transport.getStatus();
          if (!status.isInitialized) {
            const transportConfig = this.configManager.getTransportConfig(this.getTransportType(name)) as TransportConfig;
            if (transportConfig) {
              await this.configure(name, transportConfig);
              logger.info(`✅ Reconnected to transport ${name}`);
            }
          }
        } catch (error) {
          logger.warn(`⚠️  Could not reconnect to transport ${name}:`, error);
        }
      }
    }
  }

  async shutdown(options?: { graceful?: boolean; preserveConnections?: boolean }): Promise<void> {
    const { graceful = true, preserveConnections = false } = options || {};
    
    if (preserveConnections) {
      logger.info('Preserving transport connections during shutdown');
      // Don't actually shutdown transports, just clear references
      this.transports.clear();
      this.handlers.clear();
      this.removeAllListeners();
      return;
    }

    logger.info(`${graceful ? 'Gracefully shutting down' : 'Force shutting down'} all transports`);
    
    const shutdownPromises = Array.from(this.transports.values()).map(transport =>
      transport.shutdown().catch(err => 
        logger.error(`Error shutting down ${transport.name}:`, err)
      )
    );

    if (graceful) {
      // Give transports 10 seconds to shutdown gracefully
      await Promise.race([
        Promise.all(shutdownPromises),
        new Promise(resolve => setTimeout(resolve, 10000))
      ]);
    } else {
      await Promise.all(shutdownPromises);
    }
    
    this.transports.clear();
    this.handlers.clear();
    this.removeAllListeners();
  }
}