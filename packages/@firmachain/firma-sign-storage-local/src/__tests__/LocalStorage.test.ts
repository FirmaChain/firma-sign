import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { promises as fs } from 'fs';
import * as path from 'path';
import * as os from 'os';
import { Readable } from 'stream';
import { LocalStorage } from '../LocalStorage';
import { StorageError } from '@firmachain/firma-sign-core/interfaces/storage';

describe('LocalStorage', () => {
	let storage: LocalStorage;
	let testBasePath: string;

	beforeEach(async () => {
		// Create a temporary directory for testing
		testBasePath = path.join(os.tmpdir(), `firma-sign-test-${Date.now()}`);
		await fs.mkdir(testBasePath, { recursive: true });
		
		storage = new LocalStorage();
	});

	afterEach(async () => {
		// Clean up test directory
		try {
			await fs.rm(testBasePath, { recursive: true, force: true });
		} catch {
			// Ignore cleanup errors
		}
	});

	describe('initialization', () => {
		it('should initialize with default configuration', async () => {
			await storage.initialize({ basePath: testBasePath });
			
			const status = storage.getStatus();
			expect(status.initialized).toBe(true);
			expect(status.available).toBe(true);
		});

		it('should initialize with custom configuration', async () => {
			await storage.initialize({
				basePath: testBasePath,
				maxFileSize: 50 * 1024 * 1024,
				ensureDirectories: false,
				useChecksum: false,
			});

			const status = storage.getStatus();
			expect(status.initialized).toBe(true);
			expect(storage.capabilities.maxFileSize).toBe(50 * 1024 * 1024);
		});

		it('should expand tilde in path', async () => {
			await storage.initialize({ basePath: '~/test-firma-sign' });
			
			const status = storage.getStatus();
			expect(status.details?.basePath).toContain(os.homedir());
		});

		it('should throw error if already initialized', async () => {
			await storage.initialize({ basePath: testBasePath });
			
			await expect(
				storage.initialize({ basePath: testBasePath })
			).rejects.toThrow(StorageError);
		});

		it('should validate configuration', () => {
			expect(storage.validateConfig({ basePath: testBasePath })).toBe(true);
			expect(storage.validateConfig({ invalid: 'config' })).toBe(true); // basePath is optional
			expect(storage.validateConfig({ maxFileSize: 'invalid' })).toBe(false);
		});
	});

	describe('save', () => {
		beforeEach(async () => {
			await storage.initialize({ basePath: testBasePath });
		});

		it('should save a Buffer', async () => {
			const data = Buffer.from('Hello, World!');
			const result = await storage.save('test.txt', data);

			expect(result.success).toBe(true);
			expect(result.path).toBe('test.txt');
			expect(result.size).toBe(data.length);
			expect(result.hash).toBeDefined();

			// Verify file exists
			const savedData = await fs.readFile(path.join(testBasePath, 'test.txt'));
			expect(savedData.toString()).toBe('Hello, World!');
		});

		it('should save a Stream', async () => {
			const data = 'Stream data content';
			const stream = Readable.from([data]);
			
			const result = await storage.save('stream-test.txt', stream);

			expect(result.success).toBe(true);
			expect(result.size).toBe(data.length);
			expect(result.hash).toBeDefined();

			// Verify file exists
			const savedData = await fs.readFile(path.join(testBasePath, 'stream-test.txt'));
			expect(savedData.toString()).toBe(data);
		});

		it('should create nested directories', async () => {
			const data = Buffer.from('Nested content');
			const result = await storage.save('dir1/dir2/nested.txt', data);

			expect(result.success).toBe(true);

			// Verify file exists in nested directory
			const savedData = await fs.readFile(path.join(testBasePath, 'dir1/dir2/nested.txt'));
			expect(savedData.toString()).toBe('Nested content');
		});

		it('should save metadata file when checksum is enabled', async () => {
			const data = Buffer.from('Data with metadata');
			await storage.save('with-meta.txt', data);

			// Check metadata file exists
			const metadataPath = path.join(testBasePath, 'with-meta.txt.meta');
			const metadata = JSON.parse(await fs.readFile(metadataPath, 'utf-8'));
			
			expect(metadata.hash).toBeDefined();
			expect(metadata.size).toBe(data.length);
			expect(metadata.timestamp).toBeDefined();
		});

		it('should throw error for file exceeding max size', async () => {
			// Reinitialize with small max size
			await storage.shutdown();
			storage = new LocalStorage();
			await storage.initialize({
				basePath: testBasePath,
				maxFileSize: 10, // 10 bytes
			});

			const data = Buffer.from('This is more than 10 bytes');
			
			await expect(
				storage.save('large.txt', data)
			).rejects.toThrow(StorageError);
		});

		it('should throw error if not initialized', async () => {
			const uninitializedStorage = new LocalStorage();
			const data = Buffer.from('test');

			await expect(
				uninitializedStorage.save('test.txt', data)
			).rejects.toThrow(StorageError);
		});
	});

	describe('read', () => {
		beforeEach(async () => {
			await storage.initialize({ basePath: testBasePath });
		});

		it('should read a file as Buffer', async () => {
			const originalData = 'Test content for reading';
			await fs.writeFile(path.join(testBasePath, 'read-test.txt'), originalData);

			const data = await storage.read('read-test.txt');
			expect(data.toString()).toBe(originalData);
		});

		it('should read from nested directories', async () => {
			const originalData = 'Nested content';
			const nestedPath = path.join(testBasePath, 'nested/dir');
			await fs.mkdir(nestedPath, { recursive: true });
			await fs.writeFile(path.join(nestedPath, 'file.txt'), originalData);

			const data = await storage.read('nested/dir/file.txt');
			expect(data.toString()).toBe(originalData);
		});

		it('should throw error for non-existent file', async () => {
			await expect(
				storage.read('non-existent.txt')
			).rejects.toThrow(StorageError);
		});
	});

	describe('readStream', () => {
		beforeEach(async () => {
			await storage.initialize({ basePath: testBasePath });
		});

		it('should read a file as Stream', async () => {
			const originalData = 'Stream read test';
			await fs.writeFile(path.join(testBasePath, 'stream.txt'), originalData);

			const stream = await storage.readStream('stream.txt');
			
			// Read stream content
			const chunks: Buffer[] = [];
			for await (const chunk of stream) {
				chunks.push(chunk as Buffer);
			}
			const data = Buffer.concat(chunks).toString();
			
			expect(data).toBe(originalData);
		});

		it('should throw error for non-existent file', async () => {
			await expect(
				storage.readStream('non-existent.txt')
			).rejects.toThrow(StorageError);
		});
	});

	describe('exists', () => {
		beforeEach(async () => {
			await storage.initialize({ basePath: testBasePath });
		});

		it('should return true for existing file', async () => {
			await fs.writeFile(path.join(testBasePath, 'exists.txt'), 'content');
			
			const exists = await storage.exists('exists.txt');
			expect(exists).toBe(true);
		});

		it('should return false for non-existent file', async () => {
			const exists = await storage.exists('not-exists.txt');
			expect(exists).toBe(false);
		});

		it('should return true for existing directory', async () => {
			await fs.mkdir(path.join(testBasePath, 'test-dir'));
			
			const exists = await storage.exists('test-dir');
			expect(exists).toBe(true);
		});
	});

	describe('delete', () => {
		beforeEach(async () => {
			await storage.initialize({ basePath: testBasePath });
		});

		it('should delete a file', async () => {
			const filePath = path.join(testBasePath, 'delete-me.txt');
			await fs.writeFile(filePath, 'content');
			
			await storage.delete('delete-me.txt');
			
			await expect(fs.access(filePath)).rejects.toThrow();
		});

		it('should delete a directory', async () => {
			const dirPath = path.join(testBasePath, 'delete-dir');
			await fs.mkdir(dirPath);
			await fs.writeFile(path.join(dirPath, 'file.txt'), 'content');
			
			await storage.delete('delete-dir');
			
			await expect(fs.access(dirPath)).rejects.toThrow();
		});

		it('should delete metadata file if exists', async () => {
			const filePath = path.join(testBasePath, 'with-meta.txt');
			const metaPath = `${filePath}.meta`;
			await fs.writeFile(filePath, 'content');
			await fs.writeFile(metaPath, '{"hash": "test"}');
			
			await storage.delete('with-meta.txt');
			
			await expect(fs.access(filePath)).rejects.toThrow();
			await expect(fs.access(metaPath)).rejects.toThrow();
		});

		it('should not throw error for non-existent file', async () => {
			await expect(storage.delete('non-existent.txt')).resolves.not.toThrow();
		});
	});

	describe('list', () => {
		beforeEach(async () => {
			await storage.initialize({ basePath: testBasePath });
		});

		it('should list files and directories', async () => {
			// Create test structure
			await fs.writeFile(path.join(testBasePath, 'file1.txt'), 'content1');
			await fs.writeFile(path.join(testBasePath, 'file2.txt'), 'content2');
			await fs.mkdir(path.join(testBasePath, 'dir1'));
			
			const entries = await storage.list('');
			
			expect(entries).toHaveLength(3);
			expect(entries.find(e => e.path === 'file1.txt')).toBeDefined();
			expect(entries.find(e => e.path === 'file2.txt')).toBeDefined();
			expect(entries.find(e => e.path === 'dir1')).toBeDefined();
			
			const dir = entries.find(e => e.path === 'dir1');
			expect(dir?.type).toBe('directory');
			
			const file = entries.find(e => e.path === 'file1.txt');
			expect(file?.type).toBe('file');
			expect(file?.size).toBeGreaterThan(0);
		});

		it('should exclude metadata files', async () => {
			await fs.writeFile(path.join(testBasePath, 'file.txt'), 'content');
			await fs.writeFile(path.join(testBasePath, 'file.txt.meta'), '{}');
			
			const entries = await storage.list('');
			
			expect(entries).toHaveLength(1);
			expect(entries[0].path).toBe('file.txt');
		});

		it('should return empty array for non-existent directory', async () => {
			const entries = await storage.list('non-existent');
			expect(entries).toEqual([]);
		});
	});

	describe('createDirectory', () => {
		beforeEach(async () => {
			await storage.initialize({ basePath: testBasePath });
		});

		it('should create a directory', async () => {
			await storage.createDirectory('new-dir');
			
			const dirPath = path.join(testBasePath, 'new-dir');
			const stats = await fs.stat(dirPath);
			expect(stats.isDirectory()).toBe(true);
		});

		it('should create nested directories', async () => {
			await storage.createDirectory('level1/level2/level3');
			
			const dirPath = path.join(testBasePath, 'level1/level2/level3');
			const stats = await fs.stat(dirPath);
			expect(stats.isDirectory()).toBe(true);
		});
	});

	describe('metadata operations', () => {
		beforeEach(async () => {
			await storage.initialize({ basePath: testBasePath });
		});

		it('should get metadata', async () => {
			const filePath = path.join(testBasePath, 'file.txt');
			const metaPath = `${filePath}.meta`;
			await fs.writeFile(filePath, 'content');
			await fs.writeFile(metaPath, JSON.stringify({ custom: 'value' }));
			
			const metadata = await storage.getMetadata('file.txt');
			
			expect(metadata.customMetadata).toEqual({ custom: 'value' });
		});

		it('should return empty metadata for file without metadata', async () => {
			await fs.writeFile(path.join(testBasePath, 'file.txt'), 'content');
			
			const metadata = await storage.getMetadata('file.txt');
			
			expect(metadata).toEqual({});
		});

		it('should set metadata', async () => {
			await fs.writeFile(path.join(testBasePath, 'file.txt'), 'content');
			
			await storage.setMetadata('file.txt', {
				contentType: 'text/plain',
				customMetadata: { key: 'value' },
			});
			
			const metaPath = path.join(testBasePath, 'file.txt.meta');
			const savedMeta = JSON.parse(await fs.readFile(metaPath, 'utf-8'));
			
			expect(savedMeta.contentType).toBe('text/plain');
			expect(savedMeta.customMetadata).toEqual({ key: 'value' });
		});

		it('should throw error when setting metadata for non-existent file', async () => {
			await expect(
				storage.setMetadata('non-existent.txt', {})
			).rejects.toThrow(StorageError);
		});
	});

	describe('getUsage', () => {
		beforeEach(async () => {
			await storage.initialize({ basePath: testBasePath });
		});

		it('should calculate storage usage', async () => {
			// Create test files
			await fs.writeFile(path.join(testBasePath, 'file1.txt'), 'content1');
			await fs.writeFile(path.join(testBasePath, 'file2.txt'), 'content2');
			await fs.mkdir(path.join(testBasePath, 'dir1'));
			await fs.writeFile(path.join(testBasePath, 'dir1/file3.txt'), 'content3');
			
			const usage = await storage.getUsage();
			
			expect(usage.fileCount).toBe(3);
			expect(usage.directoryCount).toBe(1);
			expect(usage.used).toBeGreaterThan(0);
		});

		it('should exclude metadata files from count', async () => {
			await fs.writeFile(path.join(testBasePath, 'file.txt'), 'content');
			await fs.writeFile(path.join(testBasePath, 'file.txt.meta'), '{}');
			
			const usage = await storage.getUsage();
			
			expect(usage.fileCount).toBe(1);
		});
	});

	describe('security', () => {
		beforeEach(async () => {
			await storage.initialize({ basePath: testBasePath });
		});

		it('should prevent path traversal attacks', async () => {
			const data = Buffer.from('test');
			
			await expect(
				storage.save('../outside.txt', data)
			).rejects.toThrow(StorageError);
			
			await expect(
				storage.read('../../etc/passwd')
			).rejects.toThrow(StorageError);
		});
	});

	describe('error handling', () => {
		it('should throw error when operations called before initialization', async () => {
			const uninitializedStorage = new LocalStorage();
			
			await expect(uninitializedStorage.save('test.txt', Buffer.from('test'))).rejects.toThrow(StorageError);
			await expect(uninitializedStorage.read('test.txt')).rejects.toThrow(StorageError);
			await expect(uninitializedStorage.readStream('test.txt')).rejects.toThrow(StorageError);
			await expect(uninitializedStorage.exists('test.txt')).rejects.toThrow(StorageError);
			await expect(uninitializedStorage.delete('test.txt')).rejects.toThrow(StorageError);
			await expect(uninitializedStorage.list('')).rejects.toThrow(StorageError);
			await expect(uninitializedStorage.createDirectory('dir')).rejects.toThrow(StorageError);
			await expect(uninitializedStorage.getMetadata('test.txt')).rejects.toThrow(StorageError);
			await expect(uninitializedStorage.setMetadata('test.txt', {})).rejects.toThrow(StorageError);
			await expect(uninitializedStorage.getUsage()).rejects.toThrow(StorageError);
		});
	});

	describe('capabilities', () => {
		it('should report correct capabilities', () => {
			expect(storage.capabilities.supportsStreaming).toBe(true);
			expect(storage.capabilities.supportsMetadata).toBe(true);
			expect(storage.capabilities.supportsVersioning).toBe(false);
			expect(storage.capabilities.supportsEncryption).toBe(false);
			expect(storage.capabilities.supportsConcurrentAccess).toBe(false);
			expect(storage.capabilities.supportsDirectoryListing).toBe(true);
		});
	});

	describe('status', () => {
		it('should report status correctly', async () => {
			let status = storage.getStatus();
			expect(status.initialized).toBe(false);
			expect(status.available).toBe(true);
			
			await storage.initialize({ basePath: testBasePath });
			
			status = storage.getStatus();
			expect(status.initialized).toBe(true);
			expect(status.available).toBe(true);
			expect(status.details?.basePath).toBe(testBasePath);
			
			await storage.shutdown();
			
			status = storage.getStatus();
			expect(status.initialized).toBe(false);
		});
	});
});