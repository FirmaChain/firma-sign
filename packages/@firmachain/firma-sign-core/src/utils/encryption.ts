/**
 * Encryption utilities for secure document transfer
 */

import { randomBytes, createCipheriv, createDecipheriv, pbkdf2Sync } from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const SALT_LENGTH = 32;
const IV_LENGTH = 16;
const KEY_LENGTH = 32;
const ITERATIONS = 100000;

export interface EncryptedData {
	encrypted: string;
	salt: string;
	iv: string;
	tag: string;
}

/**
 * Encrypt data with a password
 */
export function encrypt(data: string | Uint8Array, password: string): EncryptedData {
	const salt = randomBytes(SALT_LENGTH);
	const key = pbkdf2Sync(password, salt, ITERATIONS, KEY_LENGTH, 'sha256');
	const iv = randomBytes(IV_LENGTH);

	const cipher = createCipheriv(ALGORITHM, key, iv);

	let encrypted: Buffer;
	if (typeof data === 'string') {
		encrypted = Buffer.concat([cipher.update(data, 'utf8'), cipher.final()]);
	} else {
		encrypted = Buffer.concat([cipher.update(data), cipher.final()]);
	}

	const tag = cipher.getAuthTag();

	return {
		encrypted: encrypted.toString('base64'),
		salt: salt.toString('base64'),
		iv: iv.toString('base64'),
		tag: tag.toString('base64'),
	};
}

/**
 * Decrypt data with a password
 */
export function decrypt(encryptedData: EncryptedData, password: string): string {
	const salt = Buffer.from(encryptedData.salt, 'base64');
	const key = pbkdf2Sync(password, salt, ITERATIONS, KEY_LENGTH, 'sha256');
	const iv = Buffer.from(encryptedData.iv, 'base64');
	const tag = Buffer.from(encryptedData.tag, 'base64');
	const encrypted = Buffer.from(encryptedData.encrypted, 'base64');

	const decipher = createDecipheriv(ALGORITHM, key, iv);
	decipher.setAuthTag(tag);

	const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]);

	return decrypted.toString('utf8');
}

/**
 * Generate a secure random password
 */
export function generateSecurePassword(length: number = 16): string {
	const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
	const randomValues = randomBytes(length);
	let password = '';

	for (let i = 0; i < length; i++) {
		password += charset[randomValues[i] % charset.length];
	}

	return password;
}

/**
 * Generate a human-readable transfer code
 */
export function generateTransferCode(length: number = 6): string {
	const charset = '0123456789';
	const randomValues = randomBytes(length);
	let code = '';

	for (let i = 0; i < length; i++) {
		code += charset[randomValues[i] % charset.length];
	}

	return code;
}
