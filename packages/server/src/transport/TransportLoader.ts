import type { Transport } from '@firmachain/firma-sign-core';
import { logger } from '../utils/logger.js';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);

export interface TransportPackage {
  name: string;
  version: string;
  transport: Transport;
  isInstalled: boolean;
}

/**
 * TransportLoader dynamically discovers and loads transport packages
 * Follows the pattern of searching for @firmachain/firma-sign-transport-* packages
 */
export class TransportLoader {
  private knownTransports = [
    '@firmachain/firma-sign-transport-p2p',
    '@firmachain/firma-sign-transport-email',
    '@firmachain/firma-sign-transport-discord',
    '@firmachain/firma-sign-transport-telegram',
    '@firmachain/firma-sign-transport-web'
  ];

  /**
   * Discover all installed transport packages
   */
  async discoverTransports(): Promise<TransportPackage[]> {
    const discovered: TransportPackage[] = [];

    for (const packageName of this.knownTransports) {
      try {
        const transportPackage = await this.loadTransportPackage(packageName);
        if (transportPackage) {
          discovered.push(transportPackage);
          logger.info(`Discovered transport package: ${packageName}`);
        }
      } catch (error) {
        logger.debug(`Transport package ${packageName} not available:`, (error as Error).message);
      }
    }

    // Also try to discover custom transport packages by checking node_modules
    const customTransports = await this.discoverCustomTransports();
    discovered.push(...customTransports);

    return discovered;
  }

  /**
   * Load a specific transport package
   */
  private async loadTransportPackage(packageName: string): Promise<TransportPackage | null> {
    try {
      // First check if package is installed
      const packageInfo = this.getPackageInfo(packageName);
      if (!packageInfo) {
        return null;
      }

      // Dynamic import of the transport package
      const module = await import(packageName) as Record<string, unknown>;
      
      // Look for common export patterns
      let TransportClass = module.default || module[this.getTransportClassName(packageName)];
      
      if (!TransportClass) {
        // Try to find any export that looks like a transport class
        for (const [, value] of Object.entries(module)) {
          if (typeof value === 'function' && this.isTransportClass(value)) {
            TransportClass = value;
            break;
          }
        }
      }

      if (!TransportClass) {
        logger.warn(`No transport class found in package ${packageName}`);
        return null;
      }

      // Create instance and validate it implements Transport interface
      const transport = new (TransportClass as new () => Transport)();
      if (!this.validateTransport(transport)) {
        logger.warn(`Invalid transport implementation in package ${packageName}`);
        return null;
      }

      return {
        name: packageName,
        version: packageInfo.version,
        transport,
        isInstalled: true
      };

    } catch (error) {
      logger.debug(`Failed to load transport package ${packageName}:`, (error as Error).message);
      return null;
    }
  }

  /**
   * Get package information from package.json
   */
  private getPackageInfo(packageName: string): { version: string } | null {
    try {
      const packageJsonPath = require.resolve(`${packageName}/package.json`);
      const packageJson = require(packageJsonPath) as { version: string };
      return {
        version: packageJson.version
      };
    } catch {
      return null;
    }
  }

  /**
   * Generate expected transport class name from package name
   */
  private getTransportClassName(packageName: string): string {
    // @firmachain/firma-sign-transport-p2p -> P2PTransport
    const parts = packageName.split('-');
    const transportType = parts[parts.length - 1];
    return transportType.charAt(0).toUpperCase() + transportType.slice(1) + 'Transport';
  }

  /**
   * Check if a class implements the Transport interface
   */
  private isTransportClass(cls: unknown): boolean {
    if (typeof cls !== 'function') return false;
    
    try {
      const instance = new (cls as new () => unknown)();
      return this.validateTransport(instance);
    } catch {
      return false;
    }
  }

  /**
   * Validate that an object implements the Transport interface
   */
  private validateTransport(transport: unknown): transport is Transport {
    if (!transport || typeof transport !== 'object') return false;
    
    const t = transport as Record<string, unknown>;
    return (
      typeof t.name === 'string' &&
      typeof t.version === 'string' &&
      typeof t.capabilities === 'object' &&
      typeof t.initialize === 'function' &&
      typeof t.shutdown === 'function' &&
      typeof t.send === 'function' &&
      typeof t.receive === 'function' &&
      typeof t.getStatus === 'function' &&
      typeof t.validateConfig === 'function'
    );
  }

  /**
   * Discover custom transport packages in node_modules
   * This searches for packages that match the naming pattern but aren't in the known list
   */
  private async discoverCustomTransports(): Promise<TransportPackage[]> {
    const discovered: TransportPackage[] = [];

    try {
      const fs = await import('fs').then(m => m.promises);
      const path = await import('path');
      
      // Look in node_modules for packages matching the pattern
      const nodeModulesPath = path.resolve('node_modules');
      const firmaChainScope = path.join(nodeModulesPath, '@firmachain');
      
      try {
        const packages = await fs.readdir(firmaChainScope);
        
        for (const packageDir of packages) {
          if (packageDir.startsWith('firma-sign-transport-') && 
              !this.knownTransports.includes(`@firmachain/${packageDir}`)) {
            
            const packageName = `@firmachain/${packageDir}`;
            try {
              const transportPackage = await this.loadTransportPackage(packageName);
              if (transportPackage) {
                discovered.push(transportPackage);
                logger.info(`Discovered custom transport package: ${packageName}`);
              }
            } catch (error) {
              logger.debug(`Failed to load custom transport ${packageName}:`, (error as Error).message);
            }
          }
        }
      } catch {
        // @firmachain scope doesn't exist, that's fine
      }
    } catch (error) {
      logger.debug('Error discovering custom transports:', (error as Error).message);
    }

    return discovered;
  }

  /**
   * Get list of all known transport packages (installed and not installed)
   */
  getAllTransportInfo(): Promise<Array<{ name: string; isInstalled: boolean; version?: string }>> {
    const info: Array<{ name: string; isInstalled: boolean; version?: string }> = [];

    for (const packageName of this.knownTransports) {
      const packageInfo = this.getPackageInfo(packageName);
      info.push({
        name: packageName,
        isInstalled: !!packageInfo,
        version: packageInfo?.version
      });
    }

    return Promise.resolve(info);
  }

  /**
   * Check if a specific transport package is installed
   */
  isTransportInstalled(packageName: string): boolean {
    return !!this.getPackageInfo(packageName);
  }

  /**
   * Get installation command for a transport package
   */
  getInstallCommand(packageName: string, packageManager: 'npm' | 'pnpm' | 'yarn' = 'pnpm'): string {
    return `${packageManager} add ${packageName}`;
  }

  /**
   * Get suggested transport packages for installation
   */
  getSuggestedTransports(): Array<{ name: string; description: string; installCommand: string }> {
    return [
      {
        name: '@firmachain/firma-sign-transport-p2p',
        description: 'Peer-to-peer transport using libp2p',
        installCommand: this.getInstallCommand('@firmachain/firma-sign-transport-p2p')
      },
      {
        name: '@firmachain/firma-sign-transport-email',
        description: 'Email transport using SMTP',
        installCommand: this.getInstallCommand('@firmachain/firma-sign-transport-email')
      },
      {
        name: '@firmachain/firma-sign-transport-discord',
        description: 'Discord bot transport',
        installCommand: this.getInstallCommand('@firmachain/firma-sign-transport-discord')
      },
      {
        name: '@firmachain/firma-sign-transport-telegram',
        description: 'Telegram bot transport',
        installCommand: this.getInstallCommand('@firmachain/firma-sign-transport-telegram')
      },
      {
        name: '@firmachain/firma-sign-transport-web',
        description: 'Web-based link sharing transport',
        installCommand: this.getInstallCommand('@firmachain/firma-sign-transport-web')
      }
    ];
  }
}