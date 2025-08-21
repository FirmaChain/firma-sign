import Database from 'better-sqlite3';
import { readFileSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { logger } from '../utils/logger';

let db: Database.Database | null = null;

export interface DatabaseConfig {
	path?: string;
	verbose?: boolean;
}

export function initializeDatabase(config: DatabaseConfig = {}): Database.Database {
	const dbPath = config.path || join(process.cwd(), 'firma-sign.db');
	
	try {
		// Ensure the database directory exists
		const dbDir = dirname(dbPath);
		mkdirSync(dbDir, { recursive: true });
		
		db = new Database(dbPath);
		
		if (config.verbose) {
			// Type assertion for verbose mode
			const dbWithVerbose = db as Database.Database & { verbose?: (fn: typeof console.log) => void };
			if (dbWithVerbose.verbose) {
				dbWithVerbose.verbose(console.log);
			}
		}
		
		// Enable foreign keys
		db.pragma('foreign_keys = ON');
		
		// Run schema
		const __dirname = dirname(fileURLToPath(import.meta.url));
		const schemaPath = join(__dirname, 'schema.sql');
		const schema = readFileSync(schemaPath, 'utf-8');
		db.exec(schema);
		
		logger.info('Database initialized', { path: dbPath });
		return db;
	} catch (error) {
		logger.error('Failed to initialize database', error);
		throw error;
	}
}

export function getDatabase(): Database.Database {
	if (!db) {
		throw new Error('Database not initialized. Call initializeDatabase() first.');
	}
	return db;
}

export function closeDatabase(): void {
	if (db) {
		db.close();
		db = null;
		logger.info('Database closed');
	}
}

// Database helper functions
export function generateId(prefix: string = ''): string {
	const timestamp = Date.now().toString(36);
	const random = Math.random().toString(36).substring(2, 9);
	return prefix ? `${prefix}-${timestamp}-${random}` : `${timestamp}-${random}`;
}

export function now(): number {
	return Date.now();
}