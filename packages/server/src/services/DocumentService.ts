import path from 'path';
import { promises as fs } from 'fs';
import crypto from 'crypto';
import { 
  Storage,
  Database,
  Repository,
  DocumentEntity
} from '@firmachain/firma-sign-core';
import { logger } from '../utils/logger.js';
import type { ConfigManager } from '../config/ConfigManager.js';

/**
 * Document types for categorization
 */
export enum DocumentCategory {
  UPLOADED = 'uploaded',    // Documents uploaded by the user
  RECEIVED = 'received',    // Documents received from others
  SENT = 'sent',           // Documents sent to others
  SIGNED = 'signed',       // Documents that have been signed
  ARCHIVED = 'archived'    // Archived documents
}

/**
 * Document status tracking
 */
export enum DocumentStatus {
  DRAFT = 'draft',
  PENDING = 'pending',
  IN_PROGRESS = 'in_progress',
  SIGNED = 'signed',
  COMPLETED = 'completed',
  ARCHIVED = 'archived',
  DELETED = 'deleted'
}

/**
 * Document metadata structure
 */
export interface DocumentMetadata {
  id: string;
  originalName: string;
  storedName: string;
  category: DocumentCategory;
  status: DocumentStatus;
  hash: string;
  size: number;
  mimeType: string;
  transferId?: string;
  uploadedBy?: string;
  uploadedAt: Date;
  lastModified: Date;
  signedBy?: string[];
  signedAt?: Date;
  archivedAt?: Date;
  tags?: string[];
  version: number;
  previousVersionId?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Document search filters
 */
export interface DocumentFilter {
  category?: DocumentCategory;
  status?: DocumentStatus;
  transferId?: string;
  uploadedBy?: string;
  signedBy?: string;
  tags?: string[];
  fromDate?: Date;
  toDate?: Date;
  searchText?: string;
  limit?: number;
  offset?: number;
}

/**
 * Document organization structure:
 * ~/.firma-sign/docs/
 * ├── uploaded/        # User uploaded documents
 * │   ├── {year}/
 * │   │   └── {month}/
 * │   │       └── {documentId}/
 * │   │           ├── document.pdf
 * │   │           └── metadata.json
 * ├── received/        # Documents received from others
 * │   ├── {year}/
 * │   │   └── {month}/
 * │   │       └── {documentId}/
 * ├── sent/           # Documents sent to others
 * │   ├── {year}/
 * │   │   └── {month}/
 * │   │       └── {documentId}/
 * ├── signed/         # Signed documents
 * │   ├── {year}/
 * │   │   └── {month}/
 * │   │       └── {documentId}/
 * └── archived/       # Archived documents
 *     └── {year}/
 *         └── {documentId}/
 */
export class DocumentService {
  private readonly basePath: string;
  private readonly storage: Storage;
  private readonly database: Database;
  private documentRepo!: Repository<DocumentEntity>;
  private isInitialized = false;

  constructor(
    configManager: ConfigManager,
    storage: Storage,
    database: Database
  ) {
    const config = configManager.getStorage();
    this.basePath = path.join(config.basePath, 'docs');
    this.storage = storage;
    this.database = database;
  }

  /**
   * Initialize the document service
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    // Initialize storage
    await this.storage.initialize({
      basePath: this.basePath,
      maxFileSize: 500 * 1024 * 1024, // 500MB
      ensureDirectories: true,
      useChecksum: true
    });

    // Create directory structure
    const categories = Object.values(DocumentCategory);
    for (const category of categories) {
      const categoryPath = path.join(this.basePath, category);
      await this.ensureDirectory(categoryPath);
    }

    // Get document repository
    this.documentRepo = this.database.getRepository<DocumentEntity>('Document');

    this.isInitialized = true;
    logger.info(`DocumentService initialized at: ${this.basePath}`);
  }

  /**
   * Store a new document
   */
  async storeDocument(
    data: Buffer,
    originalName: string,
    category: DocumentCategory,
    options?: {
      transferId?: string;
      uploadedBy?: string;
      tags?: string[];
      metadata?: Record<string, unknown>;
    }
  ): Promise<DocumentMetadata> {
    this.ensureInitialized();

    // Generate document ID and hash
    const documentId = this.generateDocumentId();
    const hash = this.calculateHash(data);
    const mimeType = this.detectMimeType(originalName);

    // Create storage path with date organization
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const storagePath = path.join(
      category,
      year.toString(),
      month,
      documentId
    );

    // Store the document
    const documentPath = path.join(storagePath, this.sanitizeFileName(originalName));
    await this.storage.save(documentPath, data);

    // Create and store metadata
    const metadata: DocumentMetadata = {
      id: documentId,
      originalName,
      storedName: documentPath,
      category,
      status: DocumentStatus.DRAFT,
      hash,
      size: data.length,
      mimeType,
      transferId: options?.transferId,
      uploadedBy: options?.uploadedBy,
      uploadedAt: now,
      lastModified: now,
      tags: options?.tags || [],
      version: 1,
      metadata: options?.metadata
    };

    // Save metadata
    await this.saveMetadata(storagePath, metadata);

    // Store in database
    await this.documentRepo.create({
      id: documentId,
      transferId: options?.transferId || '',
      fileName: originalName,
      fileSize: data.length,
      fileHash: hash,
      status: DocumentStatus.DRAFT,
      signedBy: options?.uploadedBy,
      createdAt: now
    });

    logger.info(`Document stored: ${documentId} in category: ${category}`);
    return metadata;
  }

  /**
   * Retrieve a document by ID
   */
  async getDocument(documentId: string): Promise<{ data: Buffer; metadata: DocumentMetadata }> {
    this.ensureInitialized();

    // Find document in database
    const entity = await this.documentRepo.findById(documentId);
    if (!entity) {
      throw new Error(`Document not found: ${documentId}`);
    }

    // Reconstruct storage path from document info
    const storagePath = await this.findDocumentStoragePath(documentId);
    const metadata = await this.loadMetadata(storagePath);

    // Load document data
    const data = await this.storage.read(metadata.storedName);

    return { data, metadata };
  }

  /**
   * Update document status
   */
  async updateDocumentStatus(
    documentId: string,
    status: DocumentStatus,
    options?: {
      signedBy?: string;
      signedAt?: Date;
    }
  ): Promise<void> {
    this.ensureInitialized();

    const entity = await this.documentRepo.findById(documentId);
    if (!entity) {
      throw new Error(`Document not found: ${documentId}`);
    }

    // Update database
    await this.documentRepo.update(documentId, {
      status,
      signedBy: options?.signedBy,
      signedAt: options?.signedAt
    });

    // Update metadata file
    const storagePath = await this.findDocumentStoragePath(documentId);
    const metadata = await this.loadMetadata(storagePath);
    metadata.status = status;
    if (options?.signedBy) {
      metadata.signedBy = metadata.signedBy || [];
      metadata.signedBy.push(options.signedBy);
    }
    if (options?.signedAt) {
      metadata.signedAt = options.signedAt;
    }
    metadata.lastModified = new Date();

    await this.saveMetadata(storagePath, metadata);

    // Move to appropriate category if needed
    if (status === DocumentStatus.SIGNED && metadata.category !== DocumentCategory.SIGNED) {
      await this.moveDocument(documentId, DocumentCategory.SIGNED);
    } else if (status === DocumentStatus.ARCHIVED && metadata.category !== DocumentCategory.ARCHIVED) {
      await this.moveDocument(documentId, DocumentCategory.ARCHIVED);
    }
  }

  /**
   * Move document to a different category
   */
  async moveDocument(documentId: string, newCategory: DocumentCategory): Promise<void> {
    this.ensureInitialized();

    const { data, metadata } = await this.getDocument(documentId);
    
    // Save old path before updating metadata
    const oldStoredName = metadata.storedName;
    const oldMetadataPath = path.dirname(oldStoredName);
    
    // Create new storage path
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const newStoragePath = path.join(
      newCategory,
      year.toString(),
      month,
      documentId
    );

    // Store in new location
    const newDocumentPath = path.join(newStoragePath, path.basename(metadata.originalName));
    await this.storage.save(newDocumentPath, data);

    // Update metadata
    metadata.category = newCategory;
    metadata.storedName = newDocumentPath;
    metadata.lastModified = now;
    if (newCategory === DocumentCategory.ARCHIVED) {
      metadata.archivedAt = now;
    }

    await this.saveMetadata(newStoragePath, metadata);

    // Delete from old location (using the saved old path)
    await this.storage.delete(oldStoredName);
    await this.storage.delete(path.join(oldMetadataPath, 'metadata.json'));

    // Update database - just update the status since we track location in metadata files
    await this.documentRepo.update(documentId, {
      status: metadata.status
    });

    logger.info(`Document ${documentId} moved to category: ${newCategory}`);
  }

  /**
   * Search documents with filters
   */
  async searchDocuments(filter: DocumentFilter): Promise<DocumentMetadata[]> {
    this.ensureInitialized();

    const results: DocumentMetadata[] = [];
    const categories = filter.category ? [filter.category] : Object.values(DocumentCategory);

    for (const category of categories) {
      const categoryPath = path.join(this.basePath, category);
      const documents = await this.scanCategory(categoryPath);

      for (const doc of documents) {
        // Apply filters
        if (filter.status && doc.status !== filter.status) continue;
        if (filter.transferId && doc.transferId !== filter.transferId) continue;
        if (filter.uploadedBy && doc.uploadedBy !== filter.uploadedBy) continue;
        if (filter.signedBy && !doc.signedBy?.includes(filter.signedBy)) continue;
        if (filter.tags && filter.tags.length > 0) {
          const hasAllTags = filter.tags.every(tag => doc.tags?.includes(tag));
          if (!hasAllTags) continue;
        }
        if (filter.fromDate && doc.uploadedAt < filter.fromDate) continue;
        if (filter.toDate && doc.uploadedAt > filter.toDate) continue;
        if (filter.searchText) {
          const searchLower = filter.searchText.toLowerCase();
          const matchesText = doc.originalName.toLowerCase().includes(searchLower) ||
                            doc.tags?.some(tag => tag.toLowerCase().includes(searchLower));
          if (!matchesText) continue;
        }

        results.push(doc);
      }
    }

    // Sort by date (newest first)
    results.sort((a, b) => b.uploadedAt.getTime() - a.uploadedAt.getTime());

    // Apply pagination
    const offset = filter.offset || 0;
    const limit = filter.limit || 100;
    return results.slice(offset, offset + limit);
  }

  /**
   * Create a new version of a document
   */
  async createVersion(
    documentId: string,
    newData: Buffer,
    options?: {
      uploadedBy?: string;
      metadata?: Record<string, unknown>;
    }
  ): Promise<DocumentMetadata> {
    this.ensureInitialized();

    const { metadata: oldMetadata } = await this.getDocument(documentId);

    // Store new version with link to previous
    const newMetadata = await this.storeDocument(
      newData,
      oldMetadata.originalName,
      oldMetadata.category,
      {
        transferId: oldMetadata.transferId,
        uploadedBy: options?.uploadedBy || oldMetadata.uploadedBy,
        tags: oldMetadata.tags,
        metadata: {
          ...oldMetadata.metadata,
          ...options?.metadata,
          previousVersionId: documentId,
          version: oldMetadata.version + 1
        }
      }
    );

    logger.info(`Created version ${newMetadata.version} of document ${documentId}`);
    return newMetadata;
  }

  /**
   * Get document versions
   */
  async getDocumentVersions(documentId: string): Promise<DocumentMetadata[]> {
    this.ensureInitialized();

    const versions: DocumentMetadata[] = [];
    let currentId: string | undefined = documentId;

    // Walk back through version chain
    while (currentId) {
      try {
        const { metadata } = await this.getDocument(currentId);
        versions.push(metadata);
        currentId = metadata.previousVersionId;
      } catch {
        break;
      }
    }

    return versions;
  }

  /**
   * Delete a document (soft delete by default)
   */
  async deleteDocument(documentId: string, permanent = false): Promise<void> {
    this.ensureInitialized();

    if (permanent) {
      // Permanent deletion
      const entity = await this.documentRepo.findById(documentId);
      if (!entity) {
        throw new Error(`Document not found: ${documentId}`);
      }

      const storagePath = await this.findDocumentStoragePath(documentId);
      const metadata = await this.loadMetadata(storagePath);

      // Delete files
      await this.storage.delete(metadata.storedName);
      await this.storage.delete(path.join(storagePath, 'metadata.json'));

      // Delete from database
      await this.documentRepo.delete(documentId);

      logger.info(`Document ${documentId} permanently deleted`);
    } else {
      // Soft delete - just update status
      await this.updateDocumentStatus(documentId, DocumentStatus.DELETED);
      logger.info(`Document ${documentId} marked as deleted`);
    }
  }

  /**
   * Archive old documents
   */
  async archiveOldDocuments(olderThanDays: number): Promise<number> {
    this.ensureInitialized();

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);

    const filter: DocumentFilter = {
      toDate: cutoffDate,
      status: DocumentStatus.COMPLETED
    };

    const documents = await this.searchDocuments(filter);
    let archivedCount = 0;

    for (const doc of documents) {
      if (doc.category !== DocumentCategory.ARCHIVED) {
        await this.moveDocument(doc.id, DocumentCategory.ARCHIVED);
        archivedCount++;
      }
    }

    logger.info(`Archived ${archivedCount} documents older than ${olderThanDays} days`);
    return archivedCount;
  }

  /**
   * Get storage statistics
   */
  async getStorageStats(): Promise<{
    totalDocuments: number;
    totalSize: number;
    byCategory: Record<DocumentCategory, { count: number; size: number }>;
    byStatus: Record<DocumentStatus, number>;
  }> {
    this.ensureInitialized();

    const stats = {
      totalDocuments: 0,
      totalSize: 0,
      byCategory: {} as Record<DocumentCategory, { count: number; size: number }>,
      byStatus: {} as Record<DocumentStatus, number>
    };

    // Initialize category stats
    for (const category of Object.values(DocumentCategory)) {
      stats.byCategory[category] = { count: 0, size: 0 };
    }

    // Initialize status stats
    for (const status of Object.values(DocumentStatus)) {
      stats.byStatus[status] = 0;
    }

    // Scan all categories
    for (const category of Object.values(DocumentCategory)) {
      const categoryPath = path.join(this.basePath, category);
      const documents = await this.scanCategory(categoryPath);

      for (const doc of documents) {
        stats.totalDocuments++;
        stats.totalSize += doc.size;
        stats.byCategory[category].count++;
        stats.byCategory[category].size += doc.size;
        stats.byStatus[doc.status]++;
      }
    }

    return stats;
  }

  // Private helper methods

  private async findDocumentStoragePath(documentId: string): Promise<string> {
    // Search for document in all categories
    for (const category of Object.values(DocumentCategory)) {
      const categoryPath = path.join(this.basePath, category);
      try {
        const entries = await this.storage.list(categoryPath);
        for (const entry of entries) {
          if (entry.type === 'directory' && entry.path.includes(documentId)) {
            return entry.path;
          }
        }
      } catch {
        // Continue searching other categories
      }
    }
    throw new Error(`Storage path not found for document: ${documentId}`);
  }

  private ensureInitialized(): void {
    if (!this.isInitialized) {
      throw new Error('DocumentService is not initialized. Call initialize() first.');
    }
  }

  private async ensureDirectory(dirPath: string): Promise<void> {
    const storage = this.storage as Storage & { createDirectory?: (path: string) => Promise<void> };
    if (storage.createDirectory) {
      await storage.createDirectory(dirPath);
    } else {
      await fs.mkdir(dirPath, { recursive: true });
    }
  }

  private generateDocumentId(): string {
    return `doc-${Date.now()}-${crypto.randomBytes(8).toString('hex')}`;
  }

  private calculateHash(data: Buffer): string {
    return crypto.createHash('sha256').update(data).digest('hex');
  }

  private detectMimeType(fileName: string): string {
    const ext = path.extname(fileName).toLowerCase();
    const mimeTypes: Record<string, string> = {
      '.pdf': 'application/pdf',
      '.doc': 'application/msword',
      '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      '.txt': 'text/plain',
      '.png': 'image/png',
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg'
    };
    return mimeTypes[ext] || 'application/octet-stream';
  }

  private sanitizeFileName(fileName: string): string {
    // Remove special characters and spaces
    return fileName.replace(/[^a-zA-Z0-9.-]/g, '_');
  }

  private async saveMetadata(storagePath: string, metadata: DocumentMetadata): Promise<void> {
    const metadataPath = path.join(storagePath, 'metadata.json');
    const metadataJson = JSON.stringify(metadata, null, 2);
    await this.storage.save(metadataPath, Buffer.from(metadataJson, 'utf-8'));
  }

  private async loadMetadata(storagePath: string): Promise<DocumentMetadata> {
    const metadataPath = path.join(storagePath, 'metadata.json');
    const data = await this.storage.read(metadataPath);
    return JSON.parse(data.toString('utf-8')) as DocumentMetadata;
  }

  private async scanCategory(categoryPath: string): Promise<DocumentMetadata[]> {
    const documents: DocumentMetadata[] = [];
    
    try {
      // Recursively scan for metadata files
      const entries = await this.storage.list(categoryPath);
      
      for (const entry of entries) {
        if (entry.type === 'directory') {
          // Recursively scan subdirectories
          const subDocs = await this.scanCategory(entry.path);
          documents.push(...subDocs);
        } else if (entry.path.endsWith('metadata.json')) {
          // Load metadata
          const metadata = await this.loadMetadata(path.dirname(entry.path));
          documents.push(metadata);
        }
      }
    } catch (error) {
      logger.debug(`Error scanning category ${categoryPath}:`, error);
    }

    return documents;
  }

  async close(): Promise<void> {
    if (this.isInitialized) {
      await this.storage.shutdown();
      this.isInitialized = false;
      logger.info('DocumentService closed');
    }
  }
}