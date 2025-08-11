import Database from 'better-sqlite3';
import { nanoid } from 'nanoid';
import {
  Repository,
  QueryOptions,
  createDatabaseError
} from '@firmachain/firma-sign-core';

export abstract class SQLiteRepository<T> implements Repository<T> {
  protected db: Database.Database;
  protected tableName: string;

  constructor(db: Database.Database, tableName: string) {
    this.db = db;
    this.tableName = tableName;
  }

  async findById(id: string): Promise<T | null> {
    const stmt = this.db.prepare(`SELECT * FROM ${this.tableName} WHERE id = ?`);
    const result = stmt.get(id);
    return result ? this.mapRowToEntity(result as Record<string, unknown>) : null;
  }

  async findAll(options?: QueryOptions): Promise<T[]> {
    let query = `SELECT * FROM ${this.tableName}`;
    const params: any[] = [];

    // Apply ordering
    if (options?.orderBy) {
      const orderClauses = Object.entries(options.orderBy)
        .map(([field, direction]) => `${this.toSnakeCase(field)} ${direction.toUpperCase()}`);
      query += ` ORDER BY ${orderClauses.join(', ')}`;
    }

    // Apply limit and offset
    if (options?.limit) {
      query += ` LIMIT ?`;
      params.push(options.limit);
    }
    if (options?.offset) {
      query += ` OFFSET ?`;
      params.push(options.offset);
    }

    const stmt = this.db.prepare(query);
    const results = params.length > 0 ? stmt.all(...params) : stmt.all();
    return results.map(row => this.mapRowToEntity(row as Record<string, unknown>));
  }

  async findOne(criteria: Partial<T>): Promise<T | null> {
    const results = await this.find(criteria, { limit: 1 });
    return results[0] || null;
  }

  async find(criteria: Partial<T>, options?: QueryOptions): Promise<T[]> {
    const whereClauses: string[] = [];
    const params: any[] = [];

    // Build WHERE clause from criteria
    for (const [key, value] of Object.entries(criteria)) {
      if (value !== undefined) {
        whereClauses.push(`${this.toSnakeCase(key)} = ?`);
        params.push(this.serializeValue(value));
      }
    }

    let query = `SELECT * FROM ${this.tableName}`;
    if (whereClauses.length > 0) {
      query += ` WHERE ${whereClauses.join(' AND ')}`;
    }

    // Apply ordering
    if (options?.orderBy) {
      const orderClauses = Object.entries(options.orderBy)
        .map(([field, direction]) => `${this.toSnakeCase(field)} ${direction.toUpperCase()}`);
      query += ` ORDER BY ${orderClauses.join(', ')}`;
    }

    // Apply limit and offset
    if (options?.limit) {
      query += ` LIMIT ?`;
      params.push(options.limit);
    }
    if (options?.offset) {
      query += ` OFFSET ?`;
      params.push(options.offset);
    }

    const stmt = this.db.prepare(query);
    const results = params.length > 0 ? stmt.all(...params) : stmt.all();
    return results.map(row => this.mapRowToEntity(row as Record<string, unknown>));
  }

  async create(data: Partial<T>): Promise<T> {
    const now = new Date();
    const entity = {
      ...data,
      id: (data as any).id || nanoid(),
      createdAt: (data as any).createdAt || now,
      updatedAt: (data as any).updatedAt || now
    };

    const row = this.mapEntityToRow(entity);
    const fields = Object.keys(row);
    const placeholders = fields.map(() => '?').join(', ');
    const values = Object.values(row);

    const query = `INSERT INTO ${this.tableName} (${fields.join(', ')}) VALUES (${placeholders})`;
    const stmt = this.db.prepare(query);
    
    try {
      stmt.run(...values);
      // Fetch the created entity from the database to ensure proper data types
      return await this.findById(entity.id as string) as T;
    } catch (error) {
      throw createDatabaseError(
        `Failed to create entity in ${this.tableName}`,
        'CREATE_FAILED',
        'sqlite',
        error
      );
    }
  }

  async update(id: string, data: Partial<T>): Promise<T | null> {
    const existing = await this.findById(id);
    if (!existing) {
      return null;
    }

    const updated = {
      ...existing,
      ...data,
      id, // Ensure ID doesn't change
      updatedAt: (data as any).updatedAt || new Date()
    };

    const row = this.mapEntityToRow(updated);
    const setClauses = Object.keys(row)
      .filter(key => key !== 'id')
      .map(key => `${key} = ?`);
    const values = Object.entries(row)
      .filter(([key]) => key !== 'id')
      .map(([_, value]) => value);
    values.push(id);

    const query = `UPDATE ${this.tableName} SET ${setClauses.join(', ')} WHERE id = ?`;
    const stmt = this.db.prepare(query);
    
    try {
      const result = stmt.run(...values);
      if (result.changes > 0) {
        // Fetch the updated entity from the database to ensure proper data types
        return await this.findById(id);
      }
      return null;
    } catch (error) {
      throw createDatabaseError(
        `Failed to update entity in ${this.tableName}`,
        'UPDATE_FAILED',
        'sqlite',
        error
      );
    }
  }

  async delete(id: string): Promise<boolean> {
    const stmt = this.db.prepare(`DELETE FROM ${this.tableName} WHERE id = ?`);
    const result = stmt.run(id);
    return result.changes > 0;
  }

  async createMany(data: Partial<T>[]): Promise<T[]> {
    const transaction = this.db.transaction(() => {
      const created: T[] = [];
      for (const item of data) {
        created.push(this.createSync(item));
      }
      return created;
    });
    
    return transaction();
  }

  async updateMany(criteria: Partial<T>, data: Partial<T>): Promise<number> {
    const whereClauses: string[] = [];
    const whereParams: any[] = [];

    for (const [key, value] of Object.entries(criteria)) {
      if (value !== undefined) {
        whereClauses.push(`${this.toSnakeCase(key)} = ?`);
        whereParams.push(this.serializeValue(value));
      }
    }

    const row = this.mapEntityToRow(data);
    const setClauses = Object.keys(row).map(key => `${key} = ?`);
    const setValues = Object.values(row);
    const allParams = [...setValues, ...whereParams];

    let query = `UPDATE ${this.tableName} SET ${setClauses.join(', ')}`;
    if (whereClauses.length > 0) {
      query += ` WHERE ${whereClauses.join(' AND ')}`;
    }

    const stmt = this.db.prepare(query);
    const result = stmt.run(...allParams);
    return result.changes;
  }

  async deleteMany(criteria: Partial<T>): Promise<number> {
    const whereClauses: string[] = [];
    const params: any[] = [];

    for (const [key, value] of Object.entries(criteria)) {
      if (value !== undefined) {
        whereClauses.push(`${this.toSnakeCase(key)} = ?`);
        params.push(this.serializeValue(value));
      }
    }

    let query = `DELETE FROM ${this.tableName}`;
    if (whereClauses.length > 0) {
      query += ` WHERE ${whereClauses.join(' AND ')}`;
    }

    const stmt = this.db.prepare(query);
    const result = params.length > 0 ? stmt.run(...params) : stmt.run();
    return result.changes;
  }

  async count(criteria?: Partial<T>): Promise<number> {
    let query = `SELECT COUNT(*) as count FROM ${this.tableName}`;
    const params: any[] = [];

    if (criteria) {
      const whereClauses: string[] = [];
      for (const [key, value] of Object.entries(criteria)) {
        if (value !== undefined) {
          whereClauses.push(`${this.toSnakeCase(key)} = ?`);
          params.push(this.serializeValue(value));
        }
      }
      if (whereClauses.length > 0) {
        query += ` WHERE ${whereClauses.join(' AND ')}`;
      }
    }

    const stmt = this.db.prepare(query);
    const result = params.length > 0 ? stmt.get(...params) : stmt.get();
    return (result as any).count || 0;
  }

  async exists(criteria: Partial<T>): Promise<boolean> {
    const count = await this.count(criteria);
    return count > 0;
  }

  // Helper method for synchronous creation (used in transactions)
  protected createSync(data: Partial<T>): T {
    const now = new Date();
    const entity = {
      ...data,
      id: (data as any).id || nanoid(),
      createdAt: (data as any).createdAt || now,
      updatedAt: (data as any).updatedAt || now
    };

    const row = this.mapEntityToRow(entity);
    const fields = Object.keys(row);
    const placeholders = fields.map(() => '?').join(', ');
    const values = Object.values(row);

    const query = `INSERT INTO ${this.tableName} (${fields.join(', ')}) VALUES (${placeholders})`;
    const stmt = this.db.prepare(query);
    stmt.run(...values);
    
    // Fetch the created entity from the database to ensure proper data types
    const getStmt = this.db.prepare(`SELECT * FROM ${this.tableName} WHERE id = ?`);
    const result = getStmt.get(entity.id);
    return this.mapRowToEntity(result as Record<string, unknown>);
  }

  // Abstract methods to be implemented by specific repositories
  protected abstract mapRowToEntity(row: Record<string, unknown>): T;
  protected abstract mapEntityToRow(entity: Partial<T>): Record<string, unknown>;

  // Utility methods
  protected toSnakeCase(str: string): string {
    return str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
  }

  protected serializeValue(value: any): any {
    if (value instanceof Date) {
      return Math.floor(value.getTime() / 1000);
    }
    if (typeof value === 'object' && value !== null) {
      return JSON.stringify(value);
    }
    return value;
  }

  protected deserializeValue(value: any, type?: string): any {
    if (value === null) {
      return undefined;
    }
    if (type === 'date' && typeof value === 'number') {
      return new Date(value * 1000);
    }
    if (type === 'json' && typeof value === 'string') {
      try {
        return JSON.parse(value);
      } catch {
        return undefined;
      }
    }
    return value;
  }
}