import { promises as fs } from 'fs';
import path from 'path';
import os from 'os';
import { Readable } from 'stream';
import { 
  Storage, 
  StorageCapabilities, 
  StorageConfig, 
  StorageResult, 
  StorageEntry, 
  StorageStatus,
  StorageError,
  StorageErrorCodes
} from '@firmachain/firma-sign-core';

/**
 * Mock LocalStorage implementation for the server
 * This is a simplified version of the actual LocalStorage package
 */
export class MockLocalStorage implements Storage {
  readonly name = 'mock-local';
  readonly version = '1.0.0';
  readonly capabilities: StorageCapabilities = {
    maxFileSize: 5 * 1024 * 1024 * 1024, // 5GB
    supportsStreaming: true,
    supportsMetadata: false,
    supportsVersioning: false,
    supportsEncryption: false,
    supportsConcurrentAccess: true,
    supportsDirectoryListing: true,
    requiredConfig: ['basePath']
  };

  private basePath = '';
  private initialized = false;

  async initialize(config: StorageConfig): Promise<void> {
    const basePath = config.basePath as string || path.join(os.homedir(), '.firmasign', 'storage');
    this.basePath = path.resolve(basePath);
    
    // Ensure base path exists
    await fs.mkdir(this.basePath, { recursive: true });
    
    this.initialized = true;
  }

  shutdown(): Promise<void> {
    this.initialized = false;
    return Promise.resolve();
  }

  async save(filePath: string, data: Buffer | Readable): Promise<StorageResult> {
    if (!this.initialized) {
      throw new StorageError('Storage not initialized', StorageErrorCodes.NOT_INITIALIZED, this.name);
    }

    const fullPath = path.join(this.basePath, filePath);
    
    // Ensure directory exists
    await fs.mkdir(path.dirname(fullPath), { recursive: true });
    
    let size: number;
    if (Buffer.isBuffer(data)) {
      await fs.writeFile(fullPath, data);
      size = data.length;
    } else {
      // Handle stream
      const { createWriteStream } = await import('fs');
      const writeStream = createWriteStream(fullPath);
      size = await new Promise((resolve, reject) => {
        let totalSize = 0;
        data.on('data', (chunk: Buffer) => {
          totalSize += chunk.length;
        });
        data.pipe(writeStream);
        data.on('end', () => resolve(totalSize));
        data.on('error', reject);
      });
    }

    return {
      success: true,
      path: filePath,
      size,
      timestamp: Date.now()
    };
  }

  async read(filePath: string): Promise<Buffer> {
    if (!this.initialized) {
      throw new StorageError('Storage not initialized', StorageErrorCodes.NOT_INITIALIZED, this.name);
    }

    const fullPath = path.join(this.basePath, filePath);
    try {
      return await fs.readFile(fullPath);
    } catch (error) {
      throw new StorageError(
        `Failed to read file: ${filePath}`, 
        StorageErrorCodes.NOT_FOUND, 
        this.name, 
        error
      );
    }
  }

  async readStream(filePath: string): Promise<Readable> {
    if (!this.initialized) {
      throw new StorageError('Storage not initialized', StorageErrorCodes.NOT_INITIALIZED, this.name);
    }

    const fullPath = path.join(this.basePath, filePath);
    const { createReadStream } = await import('fs');
    return createReadStream(fullPath);
  }

  async exists(filePath: string): Promise<boolean> {
    if (!this.initialized) {
      return false;
    }

    const fullPath = path.join(this.basePath, filePath);
    try {
      await fs.access(fullPath);
      return true;
    } catch {
      return false;
    }
  }

  async delete(filePath: string): Promise<void> {
    if (!this.initialized) {
      throw new StorageError('Storage not initialized', StorageErrorCodes.NOT_INITIALIZED, this.name);
    }

    const fullPath = path.join(this.basePath, filePath);
    try {
      const stat = await fs.stat(fullPath);
      if (stat.isDirectory()) {
        await fs.rmdir(fullPath, { recursive: true });
      } else {
        await fs.unlink(fullPath);
      }
    } catch (error) {
      throw new StorageError(
        `Failed to delete: ${filePath}`, 
        StorageErrorCodes.OPERATION_FAILED, 
        this.name, 
        error
      );
    }
  }

  async list(prefix: string): Promise<StorageEntry[]> {
    if (!this.initialized) {
      throw new StorageError('Storage not initialized', StorageErrorCodes.NOT_INITIALIZED, this.name);
    }

    const fullPath = path.join(this.basePath, prefix);
    try {
      const entries = await fs.readdir(fullPath, { withFileTypes: true });
      const result: StorageEntry[] = [];

      for (const entry of entries) {
        const entryPath = path.join(prefix, entry.name);
        const fullEntryPath = path.join(fullPath, entry.name);
        const stat = await fs.stat(fullEntryPath);
        
        result.push({
          path: entryPath,
          type: entry.isDirectory() ? 'directory' : 'file',
          size: stat.size,
          lastModified: stat.mtime.getTime()
        });
      }

      return result;
    } catch (error) {
      throw new StorageError(
        `Failed to list directory: ${prefix}`, 
        StorageErrorCodes.NOT_FOUND, 
        this.name, 
        error
      );
    }
  }

  async createDirectory(dirPath: string): Promise<void> {
    if (!this.initialized) {
      throw new StorageError('Storage not initialized', StorageErrorCodes.NOT_INITIALIZED, this.name);
    }

    const fullPath = path.join(this.basePath, dirPath);
    await fs.mkdir(fullPath, { recursive: true });
  }

  getStatus(): StorageStatus {
    return {
      available: this.initialized,
      initialized: this.initialized,
      lastOperation: Date.now()
    };
  }

  validateConfig(config: unknown): config is StorageConfig {
    return typeof config === 'object' && config !== null;
  }
}