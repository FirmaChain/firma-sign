import Database from 'better-sqlite3';
import { DatabaseConnection } from './Database';

export interface Repository<T> {
  findById(id: string): T | null;
  findAll(): T[];
  create(data: Partial<T>): T;
  update(id: string, data: Partial<T>): T | null;
  delete(id: string): boolean;
}

export abstract class BaseRepository<T> implements Repository<T> {
  protected db: Database.Database;
  protected tableName: string;
  
  constructor(dbConnection: DatabaseConnection, tableName: string) {
    this.db = dbConnection.getDatabase();
    this.tableName = tableName;
  }
  
  findById(id: string): T | null {
    const stmt = this.db.prepare(`SELECT * FROM ${this.tableName} WHERE id = ?`);
    const result = stmt.get(id);
    return result ? this.mapRowToEntity(result as Record<string, unknown>) : null;
  }
  
  findAll(): T[] {
    const stmt = this.db.prepare(`SELECT * FROM ${this.tableName}`);
    const results = stmt.all();
    return results.map(row => this.mapRowToEntity(row as Record<string, unknown>));
  }
  
  abstract create(data: Partial<T>): T;
  
  abstract update(id: string, data: Partial<T>): T | null;
  
  delete(id: string): boolean {
    const stmt = this.db.prepare(`DELETE FROM ${this.tableName} WHERE id = ?`);
    const result = stmt.run(id);
    return result.changes > 0;
  }
  
  protected abstract mapRowToEntity(row: Record<string, unknown>): T;
  
  protected abstract mapEntityToRow(entity: Partial<T>): Record<string, unknown>;
  
  protected runInTransaction<R>(fn: () => R): R {
    const transaction = this.db.transaction(() => fn());
    return transaction();
  }
}