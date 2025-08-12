import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { ConfigManager } from '../../config/ConfigManager.js';
import { promises as fs } from 'fs';
import path from 'path';
import os from 'os';

vi.mock('fs', () => ({
  promises: {
    readFile: vi.fn(),
    writeFile: vi.fn(),
  }
}));

vi.mock('../../utils/logger.js', () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  }
}));

describe('ConfigManager', () => {
  let configManager: ConfigManager;
  let originalEnv: NodeJS.ProcessEnv;

  beforeEach(() => {
    configManager = new ConfigManager();
    originalEnv = { ...process.env };
    
    // Clear environment variables
    delete process.env.PORT;
    delete process.env.HOST;
    delete process.env.CORS_ORIGIN;
    delete process.env.SESSION_SECRET;
    delete process.env.CONFIG_PATH;
    delete process.env.STORAGE_PATH;
    delete process.env.LOG_LEVEL;
    delete process.env.P2P_PORT;
    delete process.env.SMTP_HOST;
    delete process.env.DISCORD_BOT_TOKEN;
    delete process.env.BLOCKCHAIN_ENABLED;
  });

  afterEach(() => {
    process.env = originalEnv;
    vi.clearAllMocks();
  });

  describe('constructor', () => {
    it('should initialize with default configuration', () => {
      const config = configManager.get();
      
      expect(config).toEqual({
        server: {
          port: 8080,
          host: '0.0.0.0',
          corsOrigin: 'http://localhost:5173',
          sessionSecret: undefined,
          rateLimiting: {
            windowMs: 900000,
            maxRequests: 100
          }
        },
        storage: {
          basePath: path.join(os.homedir(), '.firmasign')
        },
        transports: {},
        logging: {
          level: 'info',
          directory: './logs'
        },
        blockchain: {
          enabled: false,
          network: 'testnet',
          rpcUrl: undefined,
          contractAddress: undefined,
          privateKey: undefined
        }
      });
    });
  });

  describe('load', () => {
    it('should load configuration from environment variables', async () => {
      process.env.PORT = '3000';
      process.env.HOST = '127.0.0.1';
      process.env.CORS_ORIGIN = 'https://example.com';
      process.env.SESSION_SECRET = 'test-secret';
      process.env.STORAGE_PATH = '/test/storage';
      process.env.LOG_LEVEL = 'debug';
      
      await configManager.load();
      const config = configManager.get();
      
      expect(config.server.port).toBe(3000);
      expect(config.server.host).toBe('127.0.0.1');
      expect(config.server.corsOrigin).toBe('https://example.com');
      expect(config.server.sessionSecret).toBe('test-secret');
      expect(config.storage.basePath).toBe('/test/storage');
      expect(config.logging.level).toBe('debug');
    });

    it('should load P2P transport configuration from environment', async () => {
      process.env.P2P_PORT = '9091';
      process.env.P2P_ENABLE_DHT = 'false';
      process.env.P2P_ENABLE_MDNS = 'true';
      process.env.P2P_BOOTSTRAP_NODES = '/ip4/1.2.3.4/tcp/9090/p2p/node1,/ip4/5.6.7.8/tcp/9090/p2p/node2';
      
      await configManager.load();
      const config = configManager.get();
      
      expect(config.transports.p2p).toEqual({
        port: 9091,
        enableDHT: false,
        enableMDNS: true,
        maxConnections: 50,
        connectionTimeout: 30000,
        bootstrapNodes: ['/ip4/1.2.3.4/tcp/9090/p2p/node1', '/ip4/5.6.7.8/tcp/9090/p2p/node2']
      });
    });

    it('should load email transport configuration from environment', async () => {
      process.env.SMTP_HOST = 'smtp.gmail.com';
      process.env.SMTP_PORT = '587';
      process.env.SMTP_USER = 'test@gmail.com';
      process.env.SMTP_PASS = 'password123';
      process.env.EMAIL_FROM = 'noreply@example.com';
      
      await configManager.load();
      const config = configManager.get();
      
      expect(config.transports.email).toEqual({
        smtp: {
          host: 'smtp.gmail.com',
          port: 587,
          secure: true,
          auth: {
            user: 'test@gmail.com',
            pass: 'password123'
          }
        },
        from: 'noreply@example.com'
      });
    });

    it('should load Discord transport configuration from environment', async () => {
      process.env.DISCORD_BOT_TOKEN = 'discord-token-123';
      process.env.DISCORD_CLIENT_ID = 'client-123';
      
      await configManager.load();
      const config = configManager.get();
      
      expect(config.transports.discord).toEqual({
        botToken: 'discord-token-123',
        clientId: 'client-123'
      });
    });

    it('should load Telegram transport configuration from environment', async () => {
      process.env.TELEGRAM_BOT_TOKEN = 'telegram-token-123';
      
      await configManager.load();
      const config = configManager.get();
      
      expect(config.transports.telegram).toEqual({
        botToken: 'telegram-token-123'
      });
    });

    it('should load blockchain configuration from environment', async () => {
      process.env.BLOCKCHAIN_ENABLED = 'true';
      process.env.BLOCKCHAIN_NETWORK = 'mainnet';
      process.env.BLOCKCHAIN_RPC_URL = 'https://rpc.example.com';
      process.env.BLOCKCHAIN_CONTRACT_ADDRESS = '0x123...';
      process.env.BLOCKCHAIN_PRIVATE_KEY = '0xabc...';
      
      await configManager.load();
      const config = configManager.get();
      
      expect(config.blockchain).toEqual({
        enabled: true,
        network: 'mainnet',
        rpcUrl: 'https://rpc.example.com',
        contractAddress: '0x123...',
        privateKey: '0xabc...'
      });
    });

    it('should load configuration from file', async () => {
      const mockConfig = {
        server: {
          port: 9000,
          corsOrigin: 'https://file.example.com'
        },
        storage: {
          basePath: '/file/storage'
        }
      };

      vi.mocked(fs.readFile).mockResolvedValue(JSON.stringify(mockConfig));
      
      await configManager.load('/test/config.json');
      const config = configManager.get();
      
      expect(config.server.port).toBe(9000);
      expect(config.server.corsOrigin).toBe('https://file.example.com');
      expect(config.storage.basePath).toBe('/file/storage');
    });

    it('should prioritize environment variables over file configuration', async () => {
      const mockConfig = {
        server: {
          port: 9000,
          corsOrigin: 'https://file.example.com'
        }
      };

      vi.mocked(fs.readFile).mockResolvedValue(JSON.stringify(mockConfig));
      process.env.PORT = '3000';
      process.env.CORS_ORIGIN = 'https://env.example.com';
      
      await configManager.load('/test/config.json');
      const config = configManager.get();
      
      // Environment variables should override file values
      expect(config.server.port).toBe(3000);
      expect(config.server.corsOrigin).toBe('https://env.example.com');
    });

    it('should handle file loading errors gracefully', async () => {
      vi.mocked(fs.readFile).mockRejectedValue(new Error('File not found'));
      
      // Should not throw and should return config
      const result = await configManager.load('/nonexistent/config.json');
      expect(result).toBeDefined();
      expect(result.server.port).toBe(8080);
      
      // Should still have default configuration
      const config = configManager.get();
      expect(config.server.port).toBe(8080);
    });

    it('should handle invalid JSON in config file gracefully', async () => {
      vi.mocked(fs.readFile).mockResolvedValue('invalid json {');
      
      // Should not throw and should return config
      const result = await configManager.load('/test/config.json');
      expect(result).toBeDefined();
      expect(result.server.port).toBe(8080);
      
      // Should still have default configuration
      const config = configManager.get();
      expect(config.server.port).toBe(8080);
    });

    it('should use CONFIG_PATH environment variable if no path provided', async () => {
      process.env.CONFIG_PATH = '/env/config.json';
      const mockConfig = { server: { port: 7000 } };
      vi.mocked(fs.readFile).mockResolvedValue(JSON.stringify(mockConfig));
      
      await configManager.load();
      
      expect(fs.readFile).toHaveBeenCalledWith('/env/config.json', 'utf-8');
    });
  });

  describe('getter methods', () => {
    beforeEach(async () => {
      process.env.PORT = '3000';
      process.env.STORAGE_PATH = '/test/storage';
      process.env.LOG_LEVEL = 'debug';
      process.env.P2P_PORT = '9091';
      process.env.BLOCKCHAIN_ENABLED = 'true';
      
      await configManager.load();
    });

    it('should return server configuration', () => {
      const serverConfig = configManager.getServer();
      
      expect(serverConfig.port).toBe(3000);
      expect(serverConfig.host).toBe('0.0.0.0');
      expect(serverConfig.corsOrigin).toBe('http://localhost:5173');
    });

    it('should return storage configuration', () => {
      const storageConfig = configManager.getStorage();
      
      expect(storageConfig.basePath).toBe('/test/storage');
    });

    it('should return transports configuration', () => {
      const transportsConfig = configManager.getTransports();
      
      expect(transportsConfig.p2p?.port).toBe(9091);
    });

    it('should return logging configuration', () => {
      const loggingConfig = configManager.getLogging();
      
      expect(loggingConfig.level).toBe('debug');
      // Directory will be resolved to absolute path
      expect(loggingConfig.directory).toContain('logs');
    });

    it('should return blockchain configuration', () => {
      const blockchainConfig = configManager.getBlockchain();
      
      expect(blockchainConfig.enabled).toBe(true);
      expect(blockchainConfig.network).toBe('testnet');
    });

    it('should return specific transport configuration', () => {
      const p2pConfig = configManager.getTransportConfig('p2p');
      
      expect(p2pConfig).toEqual({
        port: 9091,
        enableDHT: true,
        enableMDNS: true,
        maxConnections: 50,
        connectionTimeout: 30000
      });
    });

    it('should return undefined for non-existent transport configuration', () => {
      const nonExistentConfig = configManager.getTransportConfig('nonexistent');
      
      expect(nonExistentConfig).toBeUndefined();
    });
  });

  describe('path resolution', () => {
    it('should resolve tilde paths', async () => {
      process.env.STORAGE_PATH = '~/test/storage';
      
      await configManager.load();
      const config = configManager.get();
      
      expect(config.storage.basePath).toBe(path.join(os.homedir(), 'test/storage'));
    });

    it('should resolve relative paths', async () => {
      process.env.STORAGE_PATH = './relative/path';
      
      await configManager.load();
      const config = configManager.get();
      
      expect(config.storage.basePath).toBe(path.resolve('./relative/path'));
    });

    it('should keep absolute paths as-is', async () => {
      process.env.STORAGE_PATH = '/absolute/path';
      
      await configManager.load();
      const config = configManager.get();
      
      expect(config.storage.basePath).toBe('/absolute/path');
    });
  });

  describe('rate limiting configuration', () => {
    it('should load rate limiting configuration from environment', async () => {
      process.env.RATE_LIMIT_WINDOW_MS = '600000';
      process.env.RATE_LIMIT_MAX_REQUESTS = '200';
      
      await configManager.load();
      const config = configManager.get();
      
      expect(config.server.rateLimiting.windowMs).toBe(600000);
      expect(config.server.rateLimiting.maxRequests).toBe(200);
    });

    it('should use default rate limiting values', async () => {
      await configManager.load();
      const config = configManager.get();
      
      expect(config.server.rateLimiting.windowMs).toBe(900000); // 15 minutes
      expect(config.server.rateLimiting.maxRequests).toBe(100);
    });
  });

  describe('static methods', () => {
    describe('validate', () => {
      it('should validate valid configuration', () => {
        const validConfig = {
          server: {
            port: 8080,
            host: '0.0.0.0',
            corsOrigin: 'http://localhost:5173',
            rateLimiting: {
              windowMs: 900000,
              maxRequests: 100
            }
          },
          storage: {
            basePath: '/test/storage'
          },
          transports: {},
          logging: {
            level: 'info' as const,
            directory: './logs'
          },
          blockchain: {
            enabled: false,
            network: 'testnet' as const
          }
        };

        expect(() => ConfigManager.validate(validConfig)).not.toThrow();
      });

      it('should reject invalid configuration', () => {
        const invalidConfig = {
          server: {
            port: 'invalid-port', // Should be number
            host: '0.0.0.0'
          }
        };

        expect(() => ConfigManager.validate(invalidConfig)).toThrow();
      });
    });

    describe('generateDefaultConfig', () => {
      it('should generate default configuration file', async () => {
        const outputPath = '/test/default-config.json';
        
        await ConfigManager.generateDefaultConfig(outputPath);
        
        expect(fs.writeFile).toHaveBeenCalledWith(
          outputPath,
          expect.stringContaining('"port": 8080'),
          'utf-8'
        );
      });
    });
  });

  describe('deep merge functionality', () => {
    it('should deep merge nested objects', async () => {
      const mockConfig = {
        server: {
          port: 9000,
          rateLimiting: {
            windowMs: 600000
            // maxRequests not specified, should keep default
          }
        },
        transports: {
          p2p: {
            port: 9091
            // other P2P settings not specified, should use defaults
          }
        }
      };

      vi.mocked(fs.readFile).mockResolvedValue(JSON.stringify(mockConfig));
      
      await configManager.load('/test/config.json');
      const config = configManager.get();
      
      // Should merge file config with defaults
      expect(config.server.port).toBe(9000); // From file
      expect(config.server.host).toBe('0.0.0.0'); // Default
      expect(config.server.rateLimiting.windowMs).toBe(600000); // From file
      expect(config.server.rateLimiting.maxRequests).toBe(100); // Default
    });

    it('should handle array values correctly', async () => {
      const mockConfig = {
        transports: {
          p2p: {
            bootstrapNodes: ['/ip4/1.2.3.4/tcp/9090/p2p/node1']
          }
        }
      };

      vi.mocked(fs.readFile).mockResolvedValue(JSON.stringify(mockConfig));
      
      await configManager.load('/test/config.json');
      const config = configManager.get();
      
      expect(config.transports.p2p?.bootstrapNodes).toEqual(['/ip4/1.2.3.4/tcp/9090/p2p/node1']);
    });
  });
});