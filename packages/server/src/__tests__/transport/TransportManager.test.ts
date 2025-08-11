import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { TransportManager } from '../../transport/TransportManager.js';
import { ConfigManager } from '../../config/ConfigManager.js';
import { TransportLoader } from '../../transport/TransportLoader.js';
import type { 
  Transport, 
  OutgoingTransfer,
  IncomingTransfer,
  TransferResult,
  TransportError
} from '@firmachain/firma-sign-core';

// Mock dependencies
vi.mock('../../utils/logger.js', () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  }
}));

vi.mock('../../transport/TransportLoader.js', () => {
  return {
    TransportLoader: vi.fn().mockImplementation(() => ({
      discoverTransports: vi.fn(),
      getAllTransportInfo: vi.fn(),
      getSuggestedTransports: vi.fn(),
    }))
  };
});

vi.mock('../../config/ConfigManager.js', () => {
  return {
    ConfigManager: vi.fn().mockImplementation(() => ({
      getTransportConfig: vi.fn(),
    }))
  };
});

describe('TransportManager', () => {
  let transportManager: TransportManager;
  let mockConfigManager: ConfigManager;
  let mockTransportLoader: TransportLoader;

  // Mock transport implementation
  const createMockTransport = (name: string, isInitialized = false): Transport => {
    const transport: Transport = {
      name,
      version: '1.0.0',
      capabilities: {
        maxFileSize: 100 * 1024 * 1024,
        supportsBatch: true,
        supportsEncryption: true,
        supportsNotifications: false,
        supportsResume: false,
        requiredConfig: []
      },
      initialize: vi.fn().mockResolvedValue(undefined),
      shutdown: vi.fn().mockResolvedValue(undefined),
      send: vi.fn().mockResolvedValue({
        success: true,
        transferId: 'test-transfer',
        timestamp: Date.now(),
        recipients: []
      } as TransferResult),
      receive: vi.fn(),
      getStatus: vi.fn().mockReturnValue({
        isInitialized,
        lastActivity: Date.now()
      }),
      validateConfig: vi.fn().mockReturnValue(true)
    };

    return transport;
  };

  const createMockTransfer = (): OutgoingTransfer => ({
    transferId: 'test-transfer',
    documents: [{
      id: 'doc1',
      fileName: 'test.pdf',
      mimeType: 'application/pdf',
      size: 1024,
      data: Buffer.from('test content'),
      hash: 'testhash'
    }],
    recipients: [{
      id: 'recipient1',
      identifier: 'test@example.com',
      transport: 'email'
    }],
    sender: {
      senderId: 'sender1',
      name: 'Test Sender',
      transport: 'p2p',
      timestamp: Date.now(),
      verificationStatus: 'verified'
    }
  });

  beforeEach(() => {
    // Create mock instances
    mockConfigManager = new ConfigManager() as ConfigManager & Record<string, unknown>;
    mockTransportLoader = new TransportLoader() as TransportLoader & Record<string, unknown>;

    // Ensure all mock methods return expected values
    vi.mocked(mockTransportLoader.discoverTransports).mockResolvedValue([]);
    vi.mocked(mockTransportLoader.getAllTransportInfo).mockResolvedValue([]);
    vi.mocked(mockTransportLoader.getSuggestedTransports).mockReturnValue([]);
    vi.mocked(mockConfigManager.getTransportConfig).mockReturnValue(undefined);

    transportManager = new TransportManager(mockConfigManager);

    // Replace the loader instance with our mock
    (transportManager as TransportManager & Record<string, unknown>).loader = mockTransportLoader;

    vi.clearAllMocks();
  });

  afterEach(async () => {
    await transportManager.shutdown();
  });

  describe('constructor', () => {
    it('should create TransportManager with ConfigManager', () => {
      expect(transportManager).toBeDefined();
      expect(transportManager).toBeInstanceOf(TransportManager);
    });
  });

  describe('initialize', () => {
    it('should initialize with discovered transports', async () => {
      const mockTransport = createMockTransport('@firmachain/firma-sign-transport-p2p');
      const mockTransportConfig = { port: 9090, enableDHT: true };

      vi.mocked(mockTransportLoader.discoverTransports).mockResolvedValue([{
        name: '@firmachain/firma-sign-transport-p2p',
        version: '1.0.0',
        transport: mockTransport,
        isInstalled: true
      }]);

      vi.mocked(mockConfigManager.getTransportConfig).mockReturnValue(mockTransportConfig);

      await transportManager.initialize();

      expect(mockTransportLoader.discoverTransports).toHaveBeenCalled();
      expect(mockConfigManager.getTransportConfig).toHaveBeenCalledWith('p2p');
      expect(mockTransport.validateConfig).toHaveBeenCalledWith(mockTransportConfig);
      expect(mockTransport.initialize).toHaveBeenCalledWith(mockTransportConfig);
      expect(mockTransport.receive).toHaveBeenCalled();
    });

    it('should handle transports without configuration', async () => {
      const mockTransport = createMockTransport('@firmachain/firma-sign-transport-email');

      vi.mocked(mockTransportLoader.discoverTransports).mockResolvedValue([{
        name: '@firmachain/firma-sign-transport-email',
        version: '1.0.0',
        transport: mockTransport,
        isInstalled: true
      }]);

      vi.mocked(mockConfigManager.getTransportConfig).mockReturnValue(undefined);

      await transportManager.initialize();

      expect(mockTransport.initialize).not.toHaveBeenCalled();
      expect(mockTransport.receive).toHaveBeenCalled();
    });

    it('should warn when no transports are discovered', async () => {
      vi.mocked(mockTransportLoader.discoverTransports).mockResolvedValue([]);
      vi.mocked(mockTransportLoader.getSuggestedTransports).mockReturnValue([
        {
          name: '@firmachain/firma-sign-transport-p2p',
          description: 'P2P transport',
          installCommand: 'pnpm add @firmachain/firma-sign-transport-p2p'
        }
      ]);

      await transportManager.initialize();

      expect(mockTransportLoader.getSuggestedTransports).toHaveBeenCalled();
    });

    it('should handle transport initialization errors gracefully', async () => {
      const mockTransport = createMockTransport('@firmachain/firma-sign-transport-p2p');
      vi.mocked(mockTransport.initialize).mockRejectedValue(new Error('Initialization failed'));

      vi.mocked(mockTransportLoader.discoverTransports).mockResolvedValue([{
        name: '@firmachain/firma-sign-transport-p2p',
        version: '1.0.0',
        transport: mockTransport,
        isInstalled: true
      }]);

      vi.mocked(mockConfigManager.getTransportConfig).mockReturnValue({ port: 9090 });

      // Should not throw
      await expect(transportManager.initialize()).resolves.toBeUndefined();
    });

    it('should not reinitialize if already initialized', async () => {
      // Ensure mock is properly set up before first initialization
      vi.mocked(mockTransportLoader.discoverTransports).mockResolvedValue([]);
      
      await transportManager.initialize();
      
      const discoverSpy = vi.mocked(mockTransportLoader.discoverTransports);
      discoverSpy.mockClear();
      
      await transportManager.initialize();
      
      expect(discoverSpy).not.toHaveBeenCalled();
    });
  });

  describe('register', () => {
    it('should register a transport', () => {
      const mockTransport = createMockTransport('test-transport');

      transportManager.register(mockTransport);

      expect(mockTransport.receive).toHaveBeenCalled();
    });

    it('should throw error when registering duplicate transport', () => {
      const mockTransport = createMockTransport('test-transport');

      transportManager.register(mockTransport);

      expect(() => transportManager.register(mockTransport)).toThrow(
        'Transport test-transport is already registered'
      );
    });

    it('should set up event handlers for incoming transfers', () => {
      const mockTransport = createMockTransport('test-transport');
      const eventSpy = vi.fn();
      transportManager.on('transfer:received', eventSpy);

      transportManager.register(mockTransport);

      // Get the handler that was passed to transport.receive
      const handler = vi.mocked(mockTransport.receive).mock.calls[0][0];

      // Simulate incoming transfer
      const mockIncomingTransfer = {
        transferId: 'test-transfer',
        documents: [],
        sender: {
          senderId: 'sender1',
          name: 'Test Sender',
          transport: 'p2p',
          timestamp: Date.now(),
          verificationStatus: 'verified' as const
        }
      } as IncomingTransfer;

      void handler.onTransferReceived(mockIncomingTransfer);

      expect(eventSpy).toHaveBeenCalledWith({
        transport: 'test-transport',
        transfer: mockIncomingTransfer
      });
    });

    it('should set up error handlers for transport errors', () => {
      const mockTransport = createMockTransport('test-transport');
      const errorSpy = vi.fn();
      transportManager.on('transport:error', errorSpy);

      transportManager.register(mockTransport);

      // Get the handler that was passed to transport.receive
      const handler = vi.mocked(mockTransport.receive).mock.calls[0][0];

      // Simulate transport error
      const mockError = new Error('Test error') as TransportError;
      mockError.code = 'TEST_ERROR';
      mockError.transport = 'test-transport';

      handler.onError(mockError);

      expect(errorSpy).toHaveBeenCalledWith({
        transport: 'test-transport',
        error: mockError
      });
    });
  });

  describe('configure', () => {
    it('should configure a registered transport', async () => {
      const mockTransport = createMockTransport('test-transport');
      const config = { key: 'value' };

      transportManager.register(mockTransport);
      await transportManager.configure('test-transport', config);

      expect(mockTransport.validateConfig).toHaveBeenCalledWith(config);
      expect(mockTransport.initialize).toHaveBeenCalledWith(config);
    });

    it('should throw error when configuring non-existent transport', async () => {
      await expect(
        transportManager.configure('non-existent', {})
      ).rejects.toThrow('Transport non-existent not found');
    });

    it('should throw error when configuration is invalid', async () => {
      const mockTransport = createMockTransport('test-transport');
      vi.mocked(mockTransport.validateConfig).mockReturnValue(false);

      transportManager.register(mockTransport);

      await expect(
        transportManager.configure('test-transport', {})
      ).rejects.toThrow('Invalid configuration for transport test-transport');
    });
  });

  describe('send', () => {
    it('should send transfer using specified transport', async () => {
      const mockTransport = createMockTransport('test-transport', true);
      const mockTransfer = createMockTransfer();

      transportManager.register(mockTransport);

      const result = await transportManager.send('test-transport', mockTransfer);

      expect(mockTransport.send).toHaveBeenCalledWith(mockTransfer);
      expect(result.success).toBe(true);
    });

    it('should throw error when sending with non-existent transport', async () => {
      const mockTransfer = createMockTransfer();

      await expect(
        transportManager.send('non-existent', mockTransfer)
      ).rejects.toThrow('Transport non-existent not found');
    });
  });

  describe('getAvailableTransports', () => {
    it('should return list of available transports with their capabilities', () => {
      const mockTransport1 = createMockTransport('transport-1', true);
      const mockTransport2 = createMockTransport('transport-2', false);

      transportManager.register(mockTransport1);
      transportManager.register(mockTransport2);

      const available = transportManager.getAvailableTransports();

      expect(available).toHaveLength(2);
      expect(available[0]).toEqual({
        name: 'transport-1',
        capabilities: mockTransport1.capabilities,
        configured: true
      });
      expect(available[1]).toEqual({
        name: 'transport-2',
        capabilities: mockTransport2.capabilities,
        configured: false
      });
    });
  });

  describe('getTransportInfo', () => {
    it('should return detailed transport information', async () => {
      const mockTransport = createMockTransport('@firmachain/firma-sign-transport-p2p', true);
      transportManager.register(mockTransport);

      vi.mocked(mockTransportLoader.getAllTransportInfo).mockResolvedValue([
        {
          name: '@firmachain/firma-sign-transport-p2p',
          isInstalled: true,
          version: '1.0.0'
        },
        {
          name: '@firmachain/firma-sign-transport-email',
          isInstalled: false,
          version: undefined
        }
      ]);

      vi.mocked(mockTransportLoader.getSuggestedTransports).mockReturnValue([
        {
          name: '@firmachain/firma-sign-transport-p2p',
          description: 'P2P transport',
          installCommand: 'pnpm add @firmachain/firma-sign-transport-p2p'
        },
        {
          name: '@firmachain/firma-sign-transport-email',
          description: 'Email transport',
          installCommand: 'pnpm add @firmachain/firma-sign-transport-email'
        }
      ]);

      const info = await transportManager.getTransportInfo();

      expect(info).toHaveLength(2);
      expect(info[0]).toEqual({
        name: '@firmachain/firma-sign-transport-p2p',
        isInstalled: true,
        isConfigured: true,
        status: 'ready',
        version: '1.0.0',
        description: 'P2P transport',
        installCommand: 'pnpm add @firmachain/firma-sign-transport-p2p'
      });
      expect(info[1]).toEqual({
        name: '@firmachain/firma-sign-transport-email',
        isInstalled: false,
        isConfigured: false,
        status: 'not ready',
        version: undefined,
        description: 'Email transport',
        installCommand: 'pnpm add @firmachain/firma-sign-transport-email'
      });
    });
  });

  describe('getTransportsStatus', () => {
    it('should return status of all registered transports', () => {
      const mockTransport1 = createMockTransport('transport-1', true);
      const mockTransport2 = createMockTransport('transport-2', false);

      const status1 = { isInitialized: true, connections: 5 };
      const status2 = { isInitialized: false, error: 'Not configured' };

      vi.mocked(mockTransport1.getStatus).mockReturnValue(status1);
      vi.mocked(mockTransport2.getStatus).mockReturnValue(status2);

      transportManager.register(mockTransport1);
      transportManager.register(mockTransport2);

      const status = transportManager.getTransportsStatus();

      expect(status).toEqual({
        'transport-1': status1,
        'transport-2': status2
      });
    });
  });

  describe('isReady', () => {
    it('should return false when not initialized', () => {
      expect(transportManager.isReady()).toBe(false);
    });

    it('should return false when no transports are configured', async () => {
      vi.mocked(mockTransportLoader.discoverTransports).mockResolvedValue([]);

      await transportManager.initialize();

      expect(transportManager.isReady()).toBe(false);
    });

    it('should return true when at least one transport is configured', async () => {
      const mockTransport = createMockTransport('@firmachain/firma-sign-transport-p2p', true);

      vi.mocked(mockTransportLoader.discoverTransports).mockResolvedValue([{
        name: '@firmachain/firma-sign-transport-p2p',
        version: '1.0.0',
        transport: mockTransport,
        isInstalled: true
      }]);

      vi.mocked(mockConfigManager.getTransportConfig).mockReturnValue({ port: 9090 });

      await transportManager.initialize();

      expect(transportManager.isReady()).toBe(true);
    });

    it('should return false when transports are registered but not configured', async () => {
      const mockTransport = createMockTransport('@firmachain/firma-sign-transport-p2p', false);

      vi.mocked(mockTransportLoader.discoverTransports).mockResolvedValue([{
        name: '@firmachain/firma-sign-transport-p2p',
        version: '1.0.0',
        transport: mockTransport,
        isInstalled: true
      }]);

      vi.mocked(mockConfigManager.getTransportConfig).mockReturnValue(undefined);

      await transportManager.initialize();

      expect(transportManager.isReady()).toBe(false);
    });
  });

  describe('shutdown', () => {
    it('should shutdown all registered transports', async () => {
      const mockTransport1 = createMockTransport('transport-1');
      const mockTransport2 = createMockTransport('transport-2');

      transportManager.register(mockTransport1);
      transportManager.register(mockTransport2);

      await transportManager.shutdown();

      expect(mockTransport1.shutdown).toHaveBeenCalled();
      expect(mockTransport2.shutdown).toHaveBeenCalled();
    });

    it('should handle shutdown errors gracefully', async () => {
      const mockTransport1 = createMockTransport('transport-1');
      const mockTransport2 = createMockTransport('transport-2');

      vi.mocked(mockTransport1.shutdown).mockRejectedValue(new Error('Shutdown failed'));

      transportManager.register(mockTransport1);
      transportManager.register(mockTransport2);

      // Should not throw
      await expect(transportManager.shutdown()).resolves.toBeUndefined();

      expect(mockTransport1.shutdown).toHaveBeenCalled();
      expect(mockTransport2.shutdown).toHaveBeenCalled();
    });

    it('should clear all transports and handlers after shutdown', async () => {
      const mockTransport = createMockTransport('test-transport');
      transportManager.register(mockTransport);

      expect(transportManager.getAvailableTransports()).toHaveLength(1);

      await transportManager.shutdown();

      expect(transportManager.getAvailableTransports()).toHaveLength(0);
    });

    it('should remove all event listeners', async () => {
      const listener = vi.fn();
      transportManager.on('test-event', listener);

      await transportManager.shutdown();

      transportManager.emit('test-event');
      expect(listener).not.toHaveBeenCalled();
    });
  });

  describe('getTransportType', () => {
    it('should extract transport type from package name', () => {
      const manager = transportManager as TransportManager & Record<string, unknown>;

      expect(manager.getTransportType('@firmachain/firma-sign-transport-p2p')).toBe('p2p');
      expect(manager.getTransportType('@firmachain/firma-sign-transport-email')).toBe('email');
      expect(manager.getTransportType('@firmachain/firma-sign-transport-discord')).toBe('discord');
      expect(manager.getTransportType('custom-transport-telegram')).toBe('telegram');
    });
  });

  describe('event handling', () => {
    it('should emit transfer:received events', async () => {
      const mockTransport = createMockTransport('test-transport');
      const eventSpy = vi.fn();
      
      transportManager.on('transfer:received', eventSpy);
      transportManager.register(mockTransport);

      // Simulate receiving a transfer
      const handler = vi.mocked(mockTransport.receive).mock.calls[0][0];
      const mockIncomingTransfer = {
        transferId: 'test-transfer',
        documents: [],
        sender: {
          senderId: 'sender1',
          name: 'Test Sender',
          transport: 'p2p',
          timestamp: Date.now(),
          verificationStatus: 'verified' as const
        }
      } as IncomingTransfer;

      await handler.onTransferReceived(mockIncomingTransfer);

      expect(eventSpy).toHaveBeenCalledWith({
        transport: 'test-transport',
        transfer: mockIncomingTransfer
      });
    });

    it('should emit transport:error events', () => {
      const mockTransport = createMockTransport('test-transport');
      const errorSpy = vi.fn();
      
      transportManager.on('transport:error', errorSpy);
      transportManager.register(mockTransport);

      // Simulate transport error
      const handler = vi.mocked(mockTransport.receive).mock.calls[0][0];
      const mockError = new Error('Test error') as TransportError;
      mockError.code = 'TEST_ERROR';
      mockError.transport = 'test-transport';

      handler.onError(mockError);

      expect(errorSpy).toHaveBeenCalledWith({
        transport: 'test-transport',
        error: mockError
      });
    });
  });
});