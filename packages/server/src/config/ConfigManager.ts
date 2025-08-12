import { z } from 'zod';
import { promises as fs } from 'fs';
import path from 'path';
import os from 'os';
import { logger } from '../utils/logger.js';

// Configuration schemas
const ServerConfigSchema = z.object({
  port: z.number().default(8080),
  host: z.string().default('0.0.0.0'),
  corsOrigin: z.string().default('http://localhost:5173'),
  sessionSecret: z.string().optional(),
  rateLimiting: z.object({
    windowMs: z.number().default(900000), // 15 minutes
    maxRequests: z.number().default(100)
  }).default({})
});

const StorageConfigSchema = z.object({
  basePath: z.string().default(path.join(os.homedir(), '.firmasign'))
});

const TransportConfigSchema = z.object({
  p2p: z.object({
    port: z.number().default(9090),
    enableDHT: z.boolean().default(true),
    enableMDNS: z.boolean().default(true),
    bootstrapNodes: z.array(z.string()).optional(),
    announceAddresses: z.array(z.string()).optional(),
    maxConnections: z.number().default(50),
    connectionTimeout: z.number().default(30000)
  }).optional(),
  email: z.object({
    smtp: z.object({
      host: z.string(),
      port: z.number(),
      secure: z.boolean().default(true),
      auth: z.object({
        user: z.string(),
        pass: z.string()
      })
    }),
    from: z.string()
  }).optional(),
  discord: z.object({
    botToken: z.string(),
    clientId: z.string(),
    guildId: z.string().optional()
  }).optional(),
  telegram: z.object({
    botToken: z.string(),
    webhookUrl: z.string().optional()
  }).optional(),
  web: z.object({
    baseUrl: z.string(),
    uploadSizeLimit: z.number().default(100 * 1024 * 1024) // 100MB
  }).optional()
});

const LoggingConfigSchema = z.object({
  level: z.enum(['error', 'warn', 'info', 'debug']).default('info'),
  directory: z.string().default('./logs')
});

const BlockchainConfigSchema = z.object({
  enabled: z.boolean().default(false),
  network: z.enum(['mainnet', 'testnet']).default('testnet'),
  rpcUrl: z.string().optional(),
  contractAddress: z.string().optional(),
  privateKey: z.string().optional()
});

const ConfigSchema = z.object({
  server: ServerConfigSchema.default({}),
  storage: StorageConfigSchema.default({}),
  transports: TransportConfigSchema.default({}),
  logging: LoggingConfigSchema.default({}),
  blockchain: BlockchainConfigSchema.default({})
});

export type Config = z.infer<typeof ConfigSchema>;
export type ServerConfig = z.infer<typeof ServerConfigSchema>;
export type StorageConfig = z.infer<typeof StorageConfigSchema>;
export type TransportConfig = z.infer<typeof TransportConfigSchema>;
export type LoggingConfig = z.infer<typeof LoggingConfigSchema>;
export type BlockchainConfig = z.infer<typeof BlockchainConfigSchema>;

export class ConfigManager {
  private config: Config;
  private configPath?: string;

  constructor() {
    this.config = ConfigSchema.parse({});
  }

  /**
   * Load configuration from multiple sources with hierarchy:
   * 1. Environment variables (highest priority)
   * 2. Configuration file (JSON)
   * 3. Default values (lowest priority)
   */
  async load(configPath?: string): Promise<Config> {
    // Step 1: Load defaults
    this.config = ConfigSchema.parse({});

    // Step 2: Load from config file if provided
    if (configPath || process.env.CONFIG_PATH) {
      const path = configPath || process.env.CONFIG_PATH!;
      await this.loadFromFile(path);
    }

    // Step 3: Override with environment variables (highest priority)
    this.loadFromEnvironment();

    // Validate final configuration
    this.config = ConfigSchema.parse(this.config);

    logger.info('Configuration loaded', {
      source: configPath ? 'file' : 'environment',
      path: configPath
    });

    return this.config;
  }

  private async loadFromFile(filePath: string): Promise<void> {
    try {
      const resolvedPath = this.resolvePath(filePath);
      const content = await fs.readFile(resolvedPath, 'utf-8');
      const fileConfig = JSON.parse(content) as Partial<Config>;
      
      // Deep merge with existing config
      this.config = this.deepMerge(this.config, fileConfig) as Config;
      this.configPath = resolvedPath;
      
      logger.info(`Configuration loaded from file: ${resolvedPath}`);
    } catch (error) {
      logger.warn(`Failed to load config file from ${filePath}:`, error);
    }
  }

  private loadFromEnvironment(): void {
    // Server configuration
    if (process.env.PORT) {
      this.config.server.port = parseInt(process.env.PORT, 10);
    }
    if (process.env.HOST) {
      this.config.server.host = process.env.HOST;
    }
    if (process.env.CORS_ORIGIN) {
      this.config.server.corsOrigin = process.env.CORS_ORIGIN;
    }
    if (process.env.SESSION_SECRET) {
      this.config.server.sessionSecret = process.env.SESSION_SECRET;
    }
    if (process.env.RATE_LIMIT_WINDOW_MS) {
      this.config.server.rateLimiting.windowMs = parseInt(process.env.RATE_LIMIT_WINDOW_MS, 10);
    }
    if (process.env.RATE_LIMIT_MAX_REQUESTS) {
      this.config.server.rateLimiting.maxRequests = parseInt(process.env.RATE_LIMIT_MAX_REQUESTS, 10);
    }

    // Storage configuration
    if (process.env.STORAGE_PATH) {
      this.config.storage.basePath = this.resolvePath(process.env.STORAGE_PATH);
    }

    // Logging configuration
    if (process.env.LOG_LEVEL) {
      this.config.logging.level = process.env.LOG_LEVEL as 'debug' | 'info' | 'warn' | 'error';
    }
    if (process.env.LOG_DIR) {
      this.config.logging.directory = this.resolvePath(process.env.LOG_DIR);
    } else {
      // Resolve default logging directory
      this.config.logging.directory = this.resolvePath(this.config.logging.directory);
    }

    // P2P Transport configuration - set defaults if package is installed
    // Always create default P2P config if not exists
    if (!this.config.transports.p2p) {
      this.config.transports.p2p = {
        port: 9090,
        enableDHT: false,  // Disable DHT by default for local development
        enableMDNS: true,   // Enable mDNS for local discovery
        maxConnections: 50,
        connectionTimeout: 30000
      };
    }
    
    // Override with environment variables if provided
    if (process.env.P2P_PORT || process.env.P2P_ENABLE_DHT !== undefined || 
        process.env.P2P_ENABLE_MDNS !== undefined || process.env.P2P_BOOTSTRAP_NODES) {
      
      if (process.env.P2P_PORT) {
        this.config.transports.p2p.port = parseInt(process.env.P2P_PORT, 10);
      }
      if (process.env.P2P_ENABLE_DHT !== undefined) {
        this.config.transports.p2p.enableDHT = process.env.P2P_ENABLE_DHT === 'true';
      }
      if (process.env.P2P_ENABLE_MDNS !== undefined) {
        this.config.transports.p2p.enableMDNS = process.env.P2P_ENABLE_MDNS === 'true';
      }
      if (process.env.P2P_BOOTSTRAP_NODES) {
        this.config.transports.p2p.bootstrapNodes = process.env.P2P_BOOTSTRAP_NODES.split(',');
      }
    }

    // Email Transport configuration
    if (process.env.SMTP_HOST) {
      this.config.transports.email = this.config.transports.email || { 
        smtp: { host: '', port: 587, secure: true, auth: { user: '', pass: '' } },
        from: ''
      };
      this.config.transports.email.smtp.host = process.env.SMTP_HOST;
    }
    if (process.env.SMTP_PORT) {
      this.config.transports.email = this.config.transports.email || {
        smtp: { host: '', port: 587, secure: true, auth: { user: '', pass: '' } },
        from: ''
      };
      this.config.transports.email.smtp.port = parseInt(process.env.SMTP_PORT, 10);
    }
    if (process.env.SMTP_USER) {
      this.config.transports.email = this.config.transports.email || {
        smtp: { host: '', port: 587, secure: true, auth: { user: '', pass: '' } },
        from: ''
      };
      this.config.transports.email.smtp.auth.user = process.env.SMTP_USER;
    }
    if (process.env.SMTP_PASS) {
      this.config.transports.email = this.config.transports.email || {
        smtp: { host: '', port: 587, secure: true, auth: { user: '', pass: '' } },
        from: ''
      };
      this.config.transports.email.smtp.auth.pass = process.env.SMTP_PASS;
    }
    if (process.env.EMAIL_FROM) {
      this.config.transports.email = this.config.transports.email || {
        smtp: { host: '', port: 587, secure: true, auth: { user: '', pass: '' } },
        from: ''
      };
      this.config.transports.email.from = process.env.EMAIL_FROM;
    }

    // Discord Transport configuration
    if (process.env.DISCORD_BOT_TOKEN) {
      this.config.transports.discord = this.config.transports.discord || {
        botToken: '',
        clientId: ''
      };
      this.config.transports.discord.botToken = process.env.DISCORD_BOT_TOKEN;
    }
    if (process.env.DISCORD_CLIENT_ID) {
      this.config.transports.discord = this.config.transports.discord || {
        botToken: '',
        clientId: ''
      };
      this.config.transports.discord.clientId = process.env.DISCORD_CLIENT_ID;
    }

    // Telegram Transport configuration
    if (process.env.TELEGRAM_BOT_TOKEN) {
      this.config.transports.telegram = this.config.transports.telegram || {
        botToken: ''
      };
      this.config.transports.telegram.botToken = process.env.TELEGRAM_BOT_TOKEN;
    }

    // Blockchain configuration
    if (process.env.BLOCKCHAIN_ENABLED) {
      this.config.blockchain.enabled = process.env.BLOCKCHAIN_ENABLED === 'true';
    }
    if (process.env.BLOCKCHAIN_NETWORK) {
      this.config.blockchain.network = process.env.BLOCKCHAIN_NETWORK as 'mainnet' | 'testnet';
    }
    if (process.env.BLOCKCHAIN_RPC_URL) {
      this.config.blockchain.rpcUrl = process.env.BLOCKCHAIN_RPC_URL;
    }
    if (process.env.BLOCKCHAIN_CONTRACT_ADDRESS) {
      this.config.blockchain.contractAddress = process.env.BLOCKCHAIN_CONTRACT_ADDRESS;
    }
    if (process.env.BLOCKCHAIN_PRIVATE_KEY) {
      this.config.blockchain.privateKey = process.env.BLOCKCHAIN_PRIVATE_KEY;
    }
  }

  private resolvePath(inputPath: string): string {
    // Handle tilde expansion
    if (inputPath.startsWith('~')) {
      return path.join(os.homedir(), inputPath.slice(1));
    }
    return path.resolve(inputPath);
  }

  private deepMerge(target: Record<string, unknown>, source: Record<string, unknown>): Record<string, unknown> {
    const result = { ...target };
    
    for (const key in source) {
      if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
        result[key] = this.deepMerge(
          (result[key] as Record<string, unknown>) || {}, 
          source[key] as Record<string, unknown>
        );
      } else {
        result[key] = source[key];
      }
    }
    
    return result;
  }

  get(): Config {
    return this.config;
  }

  getServer(): ServerConfig {
    return this.config.server;
  }

  getStorage(): StorageConfig {
    return this.config.storage;
  }

  getTransports(): TransportConfig {
    return this.config.transports;
  }

  getLogging(): LoggingConfig {
    return this.config.logging;
  }

  getBlockchain(): BlockchainConfig {
    return this.config.blockchain;
  }

  /**
   * Get configuration for a specific transport
   */
  getTransportConfig(transportName: string): unknown {
    return this.config.transports[transportName as keyof TransportConfig];
  }

  /**
   * Validate a configuration object against the schema
   */
  static validate(config: unknown): Config {
    return ConfigSchema.parse(config);
  }

  /**
   * Generate a default configuration file
   */
  static async generateDefaultConfig(outputPath: string): Promise<void> {
    const defaultConfig = ConfigSchema.parse({});
    const content = JSON.stringify(defaultConfig, null, 2);
    await fs.writeFile(outputPath, content, 'utf-8');
    logger.info(`Default configuration generated at: ${outputPath}`);
  }
}