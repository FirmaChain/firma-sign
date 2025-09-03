import Database from 'better-sqlite3';
import {
  Transaction,
  Repository,
  createDatabaseError
} from '@firmachain/firma-sign-core';

export class SQLiteTransaction implements Transaction {
  private db: Database.Database;
  private repositories: Map<string, Repository<unknown>>;
  private isActive = true;

  constructor(db: Database.Database, repositories: Map<string, Repository<unknown>>) {
    this.db = db;
    this.repositories = repositories;
  }

  getRepository<T>(entityName: string): Repository<T> {
    if (!this.isActive) {
      throw createDatabaseError(
        'Transaction is no longer active',
        'TRANSACTION_INACTIVE',
        'sqlite'
      );
    }

    const repository = this.repositories.get(entityName);
    if (!repository) {
      throw createDatabaseError(
        `Repository for entity '${entityName}' not found`,
        'REPOSITORY_NOT_FOUND',
        'sqlite',
        { entityName }
      );
    }

    return repository as Repository<T>;
  }

  async commit(): Promise<void> {
    // In SQLite with better-sqlite3, transactions are handled differently
    // This is a no-op as the transaction is committed when the function completes
    this.isActive = false;
  }

  async rollback(): Promise<void> {
    // In SQLite with better-sqlite3, we would throw an error to trigger rollback
    this.isActive = false;
    throw createDatabaseError(
      'Transaction rolled back',
      'TRANSACTION_ROLLBACK',
      'sqlite'
    );
  }

  async execute<T>(fn: (tx: Transaction) => Promise<T>): Promise<T> {
    try {
      // better-sqlite3 transactions are synchronous, but we need to support async operations
      // We'll use the immediate mode to ensure atomicity
      this.db.exec('BEGIN IMMEDIATE');
      
      try {
        const result = await fn(this);
        this.db.exec('COMMIT');
        this.isActive = false;
        return result;
      } catch (error) {
        this.db.exec('ROLLBACK');
        throw error;
      }
    } catch (error) {
      this.isActive = false;
      
      // Re-throw if it's already a database error
      if (error instanceof Error && error.name === 'DatabaseError') {
        throw error;
      }
      
      // Wrap other errors
      throw createDatabaseError(
        'Transaction failed',
        'TRANSACTION_FAILED',
        'sqlite',
        error
      );
    }
  }
}