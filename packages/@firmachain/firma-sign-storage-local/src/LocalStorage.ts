import { promises as fs, createReadStream, createWriteStream } from 'fs';
import { Readable, pipeline } from 'stream';
import * as path from 'path';
import * as os from 'os';
import * as crypto from 'crypto';
import {
	Storage,
	StorageCapabilities,
	StorageConfig,
	StorageResult,
	StorageEntry,
	StorageMetadata,
	StorageStatus,
	StorageUsage,
	StorageError,
	StorageErrorCodes,
} from '@firmachain/firma-sign-core/interfaces/storage';
import { z } from 'zod';

/**
 * Configuration schema for LocalStorage
 */
const LocalStorageConfigSchema = z.object({
	basePath: z.string().optional(),
	maxFileSize: z.number().optional().default(100 * 1024 * 1024), // 100MB default
	ensureDirectories: z.boolean().optional().default(true),
	useChecksum: z.boolean().optional().default(true),
});

export type LocalStorageConfig = z.infer<typeof LocalStorageConfigSchema>;

/**
 * Local filesystem storage implementation
 */
export class LocalStorage implements Storage {
	readonly name = 'local';
	readonly version = '1.0.0';
	readonly capabilities: StorageCapabilities = {
		maxFileSize: 100 * 1024 * 1024, // 100MB default, can be configured
		supportsStreaming: true,
		supportsMetadata: true,
		supportsVersioning: false,
		supportsEncryption: false,
		supportsConcurrentAccess: false,
		supportsDirectoryListing: true,
		requiredConfig: [],
	};

	private basePath: string = '';
	private initialized = false;
	private config: LocalStorageConfig = {
		maxFileSize: 100 * 1024 * 1024,
		ensureDirectories: true,
		useChecksum: true,
	};

	async initialize(config: StorageConfig): Promise<void> {
		if (this.initialized) {
			throw new StorageError(
				'Storage already initialized',
				StorageErrorCodes.OPERATION_FAILED,
				this.name
			);
		}

		if (!this.validateConfig(config)) {
			throw new StorageError(
				'Invalid configuration',
				StorageErrorCodes.INVALID_CONFIG,
				this.name
			);
		}

		this.config = { ...this.config, ...config };
		this.basePath = this.expandPath(config.basePath || '~/.firmasign/storage');
		this.capabilities.maxFileSize = this.config.maxFileSize || this.capabilities.maxFileSize;

		// Ensure base directory exists
		if (this.config.ensureDirectories) {
			await this.ensureDirectory(this.basePath);
		}

		this.initialized = true;
	}

	async shutdown(): Promise<void> {
		this.initialized = false;
	}

	async save(filePath: string, data: Buffer | Readable): Promise<StorageResult> {
		this.checkInitialized();

		const fullPath = this.resolvePath(filePath);
		const dir = path.dirname(fullPath);

		// Ensure directory exists
		if (this.config.ensureDirectories) {
			await this.ensureDirectory(dir);
		}

		let size = 0;
		let hash: string | undefined;

		try {
			if (Buffer.isBuffer(data)) {
				// Handle Buffer
				size = data.length;
				this.checkFileSize(size);

				if (this.config.useChecksum) {
					hash = crypto.createHash('sha256').update(data).digest('hex');
				}

				await fs.writeFile(fullPath, data);
			} else {
				// Handle Stream
				const writeStream = createWriteStream(fullPath);
				const hashStream = this.config.useChecksum ? crypto.createHash('sha256') : null;

				await new Promise<void>((resolve, reject) => {
					let totalSize = 0;

					data.on('data', (chunk: Buffer) => {
						totalSize += chunk.length;
						if (totalSize > this.capabilities.maxFileSize) {
							data.destroy();
							writeStream.destroy();
							reject(
								new StorageError(
									`File size exceeds maximum allowed size of ${this.capabilities.maxFileSize} bytes`,
									StorageErrorCodes.FILE_TOO_LARGE,
									this.name
								)
							);
						}
						if (hashStream) {
							hashStream.update(chunk);
						}
					});

					data.on('end', () => {
						size = totalSize;
						if (hashStream) {
							hash = hashStream.digest('hex');
						}
					});

					pipeline(data, writeStream, (err) => {
						if (err) reject(err);
						else resolve();
					});
				});
			}

			// Write metadata file if we have hash
			if (hash) {
				const metadataPath = `${fullPath}.meta`;
				const metadata = {
					hash,
					size,
					timestamp: Date.now(),
				};
				await fs.writeFile(metadataPath, JSON.stringify(metadata, null, 2));
			}

			return {
				success: true,
				path: filePath,
				size,
				hash,
				timestamp: Date.now(),
			};
		} catch (error) {
			if (error instanceof StorageError) {
				throw error;
			}
			throw new StorageError(
				`Failed to save file: ${(error as Error).message}`,
				StorageErrorCodes.OPERATION_FAILED,
				this.name,
				error
			);
		}
	}

	async read(filePath: string): Promise<Buffer> {
		this.checkInitialized();

		const fullPath = this.resolvePath(filePath);

		try {
			const data = await fs.readFile(fullPath);
			return data;
		} catch (error) {
			if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
				throw new StorageError(
					`File not found: ${filePath}`,
					StorageErrorCodes.NOT_FOUND,
					this.name
				);
			}
			throw new StorageError(
				`Failed to read file: ${(error as Error).message}`,
				StorageErrorCodes.OPERATION_FAILED,
				this.name,
				error
			);
		}
	}

	async readStream(filePath: string): Promise<Readable> {
		this.checkInitialized();

		const fullPath = this.resolvePath(filePath);

		try {
			await fs.access(fullPath);
			return createReadStream(fullPath);
		} catch (error) {
			if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
				throw new StorageError(
					`File not found: ${filePath}`,
					StorageErrorCodes.NOT_FOUND,
					this.name
				);
			}
			throw new StorageError(
				`Failed to create read stream: ${(error as Error).message}`,
				StorageErrorCodes.OPERATION_FAILED,
				this.name,
				error
			);
		}
	}

	async exists(filePath: string): Promise<boolean> {
		this.checkInitialized();

		const fullPath = this.resolvePath(filePath);

		try {
			await fs.access(fullPath);
			return true;
		} catch {
			return false;
		}
	}

	async delete(filePath: string): Promise<void> {
		this.checkInitialized();

		const fullPath = this.resolvePath(filePath);

		try {
			const stats = await fs.stat(fullPath);

			if (stats.isDirectory()) {
				await fs.rmdir(fullPath, { recursive: true });
			} else {
				await fs.unlink(fullPath);
				// Also try to delete metadata file if it exists
				try {
					await fs.unlink(`${fullPath}.meta`);
				} catch {
					// Ignore if metadata file doesn't exist
				}
			}
		} catch (error) {
			if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
				// File doesn't exist, consider it deleted
				return;
			}
			throw new StorageError(
				`Failed to delete: ${(error as Error).message}`,
				StorageErrorCodes.OPERATION_FAILED,
				this.name,
				error
			);
		}
	}

	async list(prefix: string): Promise<StorageEntry[]> {
		this.checkInitialized();

		const fullPath = this.resolvePath(prefix);
		const entries: StorageEntry[] = [];

		try {
			const items = await fs.readdir(fullPath, { withFileTypes: true });

			for (const item of items) {
				// Skip metadata files
				if (item.name.endsWith('.meta')) {
					continue;
				}

				const itemPath = path.join(fullPath, item.name);
				const relativePath = path.relative(this.basePath, itemPath);
				const stats = await fs.stat(itemPath);

				entries.push({
					path: relativePath,
					type: item.isDirectory() ? 'directory' : 'file',
					size: stats.size,
					lastModified: stats.mtimeMs,
				});
			}

			return entries;
		} catch (error) {
			if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
				return [];
			}
			throw new StorageError(
				`Failed to list directory: ${(error as Error).message}`,
				StorageErrorCodes.OPERATION_FAILED,
				this.name,
				error
			);
		}
	}

	async createDirectory(dirPath: string): Promise<void> {
		this.checkInitialized();

		const fullPath = this.resolvePath(dirPath);

		try {
			await fs.mkdir(fullPath, { recursive: true });
		} catch (error) {
			throw new StorageError(
				`Failed to create directory: ${(error as Error).message}`,
				StorageErrorCodes.OPERATION_FAILED,
				this.name,
				error
			);
		}
	}

	async getMetadata(filePath: string): Promise<StorageMetadata> {
		this.checkInitialized();

		const fullPath = this.resolvePath(filePath);
		const metadataPath = `${fullPath}.meta`;

		try {
			const metadataContent = await fs.readFile(metadataPath, 'utf-8');
			const metadata = JSON.parse(metadataContent);

			return {
				customMetadata: metadata,
			};
		} catch (error) {
			if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
				return {};
			}
			throw new StorageError(
				`Failed to get metadata: ${(error as Error).message}`,
				StorageErrorCodes.OPERATION_FAILED,
				this.name,
				error
			);
		}
	}

	async setMetadata(filePath: string, metadata: StorageMetadata): Promise<void> {
		this.checkInitialized();

		const fullPath = this.resolvePath(filePath);
		const metadataPath = `${fullPath}.meta`;

		try {
			// Check if file exists
			await fs.access(fullPath);

			// Write metadata
			await fs.writeFile(metadataPath, JSON.stringify(metadata, null, 2));
		} catch (error) {
			if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
				throw new StorageError(
					`File not found: ${filePath}`,
					StorageErrorCodes.NOT_FOUND,
					this.name
				);
			}
			throw new StorageError(
				`Failed to set metadata: ${(error as Error).message}`,
				StorageErrorCodes.OPERATION_FAILED,
				this.name,
				error
			);
		}
	}

	getStatus(): StorageStatus {
		return {
			available: true,
			initialized: this.initialized,
			lastOperation: Date.now(),
			details: {
				basePath: this.basePath,
				maxFileSize: this.capabilities.maxFileSize,
			},
		};
	}

	async getUsage(): Promise<StorageUsage> {
		this.checkInitialized();

		let totalSize = 0;
		let fileCount = 0;
		let directoryCount = 0;

		const processDirectory = async (dirPath: string): Promise<void> => {
			const items = await fs.readdir(dirPath, { withFileTypes: true });

			for (const item of items) {
				const itemPath = path.join(dirPath, item.name);

				if (item.isDirectory()) {
					directoryCount++;
					await processDirectory(itemPath);
				} else if (!item.name.endsWith('.meta')) {
					fileCount++;
					const stats = await fs.stat(itemPath);
					totalSize += stats.size;
				}
			}
		};

		try {
			await processDirectory(this.basePath);

			return {
				used: totalSize,
				fileCount,
				directoryCount,
			};
		} catch (error) {
			throw new StorageError(
				`Failed to get usage: ${(error as Error).message}`,
				StorageErrorCodes.OPERATION_FAILED,
				this.name,
				error
			);
		}
	}

	validateConfig(config: unknown): config is LocalStorageConfig {
		try {
			LocalStorageConfigSchema.parse(config);
			return true;
		} catch {
			return false;
		}
	}

	/**
	 * Private helper methods
	 */

	private checkInitialized(): void {
		if (!this.initialized) {
			throw new StorageError(
				'Storage not initialized',
				StorageErrorCodes.NOT_INITIALIZED,
				this.name
			);
		}
	}

	private checkFileSize(size: number): void {
		if (size > this.capabilities.maxFileSize) {
			throw new StorageError(
				`File size ${size} exceeds maximum allowed size of ${this.capabilities.maxFileSize} bytes`,
				StorageErrorCodes.FILE_TOO_LARGE,
				this.name
			);
		}
	}

	private expandPath(filePath: string): string {
		if (filePath.startsWith('~')) {
			return path.join(os.homedir(), filePath.slice(1));
		}
		return path.resolve(filePath);
	}

	private resolvePath(filePath: string): string {
		// Normalize path and ensure it's within basePath
		const normalized = path.normalize(filePath);
		const resolved = path.resolve(this.basePath, normalized);

		// Security check: ensure path is within basePath
		if (!resolved.startsWith(this.basePath)) {
			throw new StorageError(
				'Path traversal detected',
				StorageErrorCodes.PERMISSION_DENIED,
				this.name
			);
		}

		return resolved;
	}

	private async ensureDirectory(dirPath: string): Promise<void> {
		try {
			await fs.mkdir(dirPath, { recursive: true });
		} catch (error) {
			throw new StorageError(
				`Failed to ensure directory: ${(error as Error).message}`,
				StorageErrorCodes.OPERATION_FAILED,
				this.name,
				error
			);
		}
	}
}