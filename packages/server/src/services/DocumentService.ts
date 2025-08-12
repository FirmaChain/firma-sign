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
      version: (typeof options?.metadata?.version === 'number') ? options.metadata.version : 1,
      metadata: options?.metadata
    };

    // No separate metadata file needed - using database as source of truth

    // Store in database - create a dummy transfer if none provided
    let transferId = options?.transferId;
    if (!transferId) {
      transferId = `doc-transfer-${documentId}`;
      // Create a dummy transfer for standalone documents
      const transferRepo = this.database.getRepository('Transfer');
      await transferRepo.create({
        id: transferId,
        type: 'outgoing',
        status: 'pending',
        transportType: 'local',
        createdAt: now
      });
    }

    await this.documentRepo.create({
      id: documentId,
      transferId: transferId,
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

    // Reconstruct the storage path based on when the document was created
    const createdAt = new Date(entity.createdAt);
    const year = createdAt.getFullYear();
    const month = String(createdAt.getMonth() + 1).padStart(2, '0');
    
    // Try to find the document in the expected location
    let documentPath: string | null = null;
    let category = DocumentCategory.UPLOADED; // Default category
    
    // Try each category to find where the document is stored
    for (const cat of Object.values(DocumentCategory)) {
      const expectedPath = path.join(cat, year.toString(), month, documentId, this.sanitizeFileName(entity.fileName));
      try {
        if (await this.storage.exists(expectedPath)) {
          documentPath = expectedPath;
          category = cat;
          break;
        }
      } catch {
        // Continue searching
      }
    }

    if (!documentPath) {
      throw new Error(`Document file not found: ${documentId}`);
    }

    // Load document data
    const data = await this.storage.read(documentPath);

    // Reconstruct metadata from database entity
    const metadata: DocumentMetadata = {
      id: entity.id,
      originalName: entity.fileName,
      storedName: documentPath,
      category: category,
      status: entity.status as DocumentStatus,
      hash: entity.fileHash,
      size: entity.fileSize,
      mimeType: this.detectMimeType(entity.fileName),
      uploadedAt: new Date(entity.createdAt),
      lastModified: new Date(entity.createdAt),
      tags: [],
      version: 1, // TODO: Store version in database
      signedBy: entity.signedBy ? [entity.signedBy] : undefined,
      signedAt: entity.signedAt ? new Date(entity.signedAt) : undefined,
      transferId: entity.transferId,
      // TODO: Add support for previousVersionId in database schema
      previousVersionId: undefined
    };

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

    // Move to appropriate category if needed
    if (status === DocumentStatus.SIGNED) {
      await this.moveDocument(documentId, DocumentCategory.SIGNED);
    } else if (status === DocumentStatus.ARCHIVED) {
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
    const newDocumentPath = path.join(newStoragePath, this.sanitizeFileName(metadata.originalName));
    await this.storage.save(newDocumentPath, data);

    // Delete from old location
    await this.storage.delete(oldStoredName);

    logger.info(`Document ${documentId} moved to category: ${newCategory}`);
  }

  /**
   * Search documents with filters
   */
  async searchDocuments(filter: DocumentFilter): Promise<DocumentMetadata[]> {
    this.ensureInitialized();

    // Build database query criteria
    const criteria: Partial<DocumentEntity> = {};
    if (filter.transferId) criteria.transferId = filter.transferId;
    if (filter.uploadedBy) criteria.signedBy = filter.uploadedBy;
    
    // Get documents from database
    const entities = await this.documentRepo.find(criteria);
    const results: DocumentMetadata[] = [];

    for (const entity of entities) {
      // Convert database entity to DocumentMetadata
      const metadata: DocumentMetadata = {
        id: entity.id,
        originalName: entity.fileName,
        storedName: '', // We'll determine this if needed
        category: DocumentCategory.UPLOADED, // Default, we'd need to track this better
        status: entity.status as DocumentStatus,
        hash: entity.fileHash,
        size: entity.fileSize,
        mimeType: this.detectMimeType(entity.fileName),
        uploadedAt: new Date(entity.createdAt),
        lastModified: new Date(entity.createdAt),
        tags: [], // TODO: Add tags support to database
        version: 1,
        transferId: entity.transferId,
        signedBy: entity.signedBy ? [entity.signedBy] : undefined,
        signedAt: entity.signedAt
      };

      // Apply filters
      if (filter.status && metadata.status !== filter.status) continue;
      if (filter.signedBy && !metadata.signedBy?.includes(filter.signedBy)) continue;
      if (filter.tags && filter.tags.length > 0) {
        const hasAllTags = filter.tags.every(tag => metadata.tags?.includes(tag));
        if (!hasAllTags) continue;
      }
      if (filter.fromDate && metadata.uploadedAt.getTime() < filter.fromDate.getTime()) continue;
      if (filter.toDate && metadata.uploadedAt.getTime() > filter.toDate.getTime()) continue;
      if (filter.searchText) {
        const searchLower = filter.searchText.toLowerCase();
        const matchesText = metadata.originalName.toLowerCase().includes(searchLower);
        if (!matchesText) continue;
      }

      results.push(metadata);
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

      // Find the actual document file
      const { metadata } = await this.getDocument(documentId);

      // Delete the document file
      await this.storage.delete(metadata.storedName);

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

    // Find documents to archive from database
    const allDocuments = await this.documentRepo.findAll();
    let archivedCount = 0;

    for (const entity of allDocuments) {
      // Archive documents older than cutoff date and completed
      const entityDate = new Date(entity.createdAt);
      if (entityDate < cutoffDate && entity.status === 'completed') {
        await this.updateDocumentStatus(entity.id, DocumentStatus.ARCHIVED);
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

    // Get all documents from database
    const allDocuments = await this.documentRepo.findAll();

    const stats = {
      totalDocuments: allDocuments.length,
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

    // Calculate stats from database entities
    for (const doc of allDocuments) {
      stats.totalSize += doc.fileSize;
      
      // For now, assume all documents are uploaded category
      // TODO: Add category tracking to database
      const category = DocumentCategory.UPLOADED;
      stats.byCategory[category].count++;
      stats.byCategory[category].size += doc.fileSize;
      
      const status = doc.status as DocumentStatus;
      if (stats.byStatus[status] !== undefined) {
        stats.byStatus[status]++;
      }
    }

    return stats;
  }

  // Private helper methods

  private async findDocumentStoragePath(documentId: string): Promise<string> {
    // Get document from database to get creation date
    const entity = await this.documentRepo.findById(documentId);
    if (!entity) {
      throw new Error(`Document not found in database: ${documentId}`);
    }
    
    // Reconstruct the expected path based on creation date
    const createdAt = new Date(entity.createdAt);
    const year = createdAt.getFullYear();
    const month = String(createdAt.getMonth() + 1).padStart(2, '0');

    // Try each category to find where the document was stored
    for (const category of Object.values(DocumentCategory)) {
      const expectedPath = path.join(category, year.toString(), month, documentId);
      
      try {
        // Check if this path exists by trying to list it
        if (await this.storage.exists(expectedPath)) {
          return expectedPath;
        }
      } catch {
        // Continue to next category
        logger.debug(`Path ${expectedPath} does not exist, trying next category`);
      }
    }

    // Fallback: Search for document in all categories by scanning
    logger.debug(`Direct path lookup failed for document ${documentId}, scanning directories`);
    for (const category of Object.values(DocumentCategory)) {
      try {
        const categoryPath = category; // Use relative path
        const entries = await this.storage.list(categoryPath);
        
        for (const entry of entries) {
          if (entry.type === 'directory') {
            // Look for the document ID in year directories
            const yearEntries = await this.storage.list(entry.path);
            for (const yearEntry of yearEntries) {
              if (yearEntry.type === 'directory') {
                const monthEntries = await this.storage.list(yearEntry.path);
                for (const monthEntry of monthEntries) {
                  if (monthEntry.type === 'directory' && monthEntry.path.includes(documentId)) {
                    return monthEntry.path;
                  }
                }
              }
            }
          }
        }
      } catch (error) {
        // Continue searching other categories
        logger.debug(`Error scanning category ${category}:`, error);
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

  // Metadata methods removed - now using database as source of truth

  async close(): Promise<void> {
    if (this.isInitialized) {
      await this.storage.shutdown();
      this.isInitialized = false;
      logger.info('DocumentService closed');
    }
  }
}