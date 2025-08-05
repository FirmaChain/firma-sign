#!/usr/bin/env tsx

/**
 * P2P Server Peer Script
 *
 * This script demonstrates how to create a P2P server peer that:
 * 1. Hosts files for other peers to download
 * 2. Accepts incoming transfer requests
 * 3. Maintains a catalog of available documents
 * 4. Provides status information
 *
 * Usage:
 *   pnpm tsx scripts/server-peer.ts [port] [documents-dir]
 *
 * Example:
 *   pnpm tsx scripts/server-peer.ts 9090 ./test-documents
 */

import { P2PTransport } from '../src/P2PTransport.js';
import { generateHash } from '@firmachain/firma-sign-core';
import type { IncomingTransfer, OutgoingTransfer } from '@firmachain/firma-sign-core';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import * as readline from 'readline';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface DocumentCatalog {
	id: string;
	fileName: string;
	filePath: string;
	fileSize: number;
	hash: string;
	mimeType: string;
	addedAt: Date;
}

class P2PServerPeer {
	private transport: P2PTransport;
	private catalog: Map<string, DocumentCatalog> = new Map();
	private documentsDir: string;
	private receivedTransfers: Map<string, IncomingTransfer> = new Map();
	private stats = {
		transfersReceived: 0,
		transfersSent: 0,
		documentsServed: 0,
		bytesTransferred: 0,
		startTime: new Date(),
	};

	constructor(
		private port: number,
		documentsDir: string,
	) {
		this.transport = new P2PTransport();
		this.documentsDir = path.resolve(documentsDir);

		// Ensure documents directory exists
		if (!fs.existsSync(this.documentsDir)) {
			fs.mkdirSync(this.documentsDir, { recursive: true });
			console.log(`📁 Created documents directory: ${this.documentsDir}`);
		}
	}

	async start(): Promise<void> {
		console.log('🚀 Starting P2P Server Peer...');
		console.log(`📂 Documents directory: ${this.documentsDir}`);
		console.log(`🔌 Port: ${this.port}`);

		try {
			// Initialize transport
			await this.transport.initialize({
				port: this.port,
				enableDHT: true,
				enableMDNS: true,
				maxConnections: 100,
			});

			// Set up transfer receiver
			this.transport.receive({
				onTransferReceived: this.handleIncomingTransfer.bind(this),
				onError: this.handleTransferError.bind(this),
			});

			// Load existing documents
			await this.loadDocumentCatalog();

			// Start status monitoring
			this.startStatusMonitoring();

			const status = this.transport.getStatus();
			console.log('✅ Server peer started successfully!');
			console.log(`🆔 Peer ID: ${(this.transport as any).node?.peerId?.toString()}`);
			console.log(`📋 Documents in catalog: ${this.catalog.size}`);
			console.log('');

			this.printHelp();

			// Handle graceful shutdown
			process.on('SIGINT', this.shutdown.bind(this));
			process.on('SIGTERM', this.shutdown.bind(this));
		} catch (error) {
			console.error('❌ Failed to start server peer:', error);
			process.exit(1);
		}
	}

	private async loadDocumentCatalog(): Promise<void> {
		console.log('📚 Loading document catalog...');

		if (!fs.existsSync(this.documentsDir)) {
			console.log('📁 Documents directory not found, creating sample documents...');
			await this.createSampleDocuments();
		}

		const files = fs.readdirSync(this.documentsDir);

		for (const file of files) {
			const filePath = path.join(this.documentsDir, file);
			const stats = fs.statSync(filePath);

			if (stats.isFile()) {
				const content = fs.readFileSync(filePath);
				const hash = generateHash(content);
				const mimeType = this.getMimeType(file);

				const doc: DocumentCatalog = {
					id: hash.substring(0, 8),
					fileName: file,
					filePath,
					fileSize: stats.size,
					hash,
					mimeType,
					addedAt: stats.birthtime,
				};

				this.catalog.set(doc.id, doc);
				console.log(`📄 Added: ${file} (${doc.fileSize} bytes, ID: ${doc.id})`);
			}
		}

		console.log(`✅ Loaded ${this.catalog.size} documents into catalog`);
	}

	private async createSampleDocuments(): Promise<void> {
		const sampleDocs = [
			{
				name: 'sample-contract.pdf',
				content: `%PDF-1.4
1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj
2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj
3 0 obj<</Type/Page/Parent 2 0 R/MediaBox[0 0 612 792]>>endobj
xref
0 4
0000000000 65535 f 
0000000009 00000 n 
0000000074 00000 n 
0000000120 00000 n 
trailer<</Size 4/Root 1 0 R>>
startxref
173
%%EOF

Sample Contract Document
This is a sample PDF document for P2P testing.
Generated at: ${new Date().toISOString()}
`,
			},
			{
				name: 'agreement.txt',
				content: `SERVICE AGREEMENT

This Service Agreement ("Agreement") is entered into as of ${new Date().toLocaleDateString()}.

TERMS AND CONDITIONS:
1. Services to be provided as agreed upon by both parties
2. Payment terms: Net 30 days
3. Confidentiality requirements apply
4. Agreement governed by applicable law

This document is being used for P2P transport testing.

Document ID: ${Date.now()}
Generated: ${new Date().toISOString()}
`,
			},
			{
				name: 'technical-spec.md',
				content: `# Technical Specification

## Overview
This document outlines the technical specifications for the P2P document transfer system.

## Architecture
- **Transport Layer**: libp2p with multiple protocols
- **Discovery**: DHT and mDNS
- **Security**: Built-in encryption and peer authentication

## Features
- ✅ Peer-to-peer file transfer
- ✅ Multiple document support
- ✅ Connection management
- ✅ Error handling
- ✅ Status monitoring

## Testing
This document is part of the P2P transport test suite.

Generated: ${new Date().toISOString()}
Size: ${Buffer.byteLength('test content', 'utf8')} bytes
`,
			},
		];

		for (const doc of sampleDocs) {
			const filePath = path.join(this.documentsDir, doc.name);
			fs.writeFileSync(filePath, doc.content);
			console.log(`📝 Created sample document: ${doc.name}`);
		}
	}

	private async handleIncomingTransfer(transfer: IncomingTransfer): Promise<void> {
		console.log('\n📥 INCOMING TRANSFER');
		console.log(`  Transfer ID: ${transfer.transferId}`);
		console.log(`  From: ${transfer.sender.name} (${transfer.sender.senderId})`);
		console.log(`  Transport: ${transfer.transport}`);
		console.log(`  Documents: ${transfer.documents.length}`);
		console.log(`  Status: ${transfer.status}`);

		// Store the transfer
		this.receivedTransfers.set(transfer.transferId, transfer);
		this.stats.transfersReceived++;

		// Save received documents
		for (const doc of transfer.documents) {
			const fileName = `received_${Date.now()}_${doc.fileName}`;
			const filePath = path.join(this.documentsDir, fileName);

			try {
				fs.writeFileSync(filePath, doc.data);
				console.log(`  💾 Saved: ${fileName} (${doc.fileSize} bytes)`);

				// Add to catalog
				const catalogDoc: DocumentCatalog = {
					id: generateHash(Buffer.from(doc.data)).substring(0, 8),
					fileName,
					filePath,
					fileSize: doc.fileSize,
					hash: doc.hash || generateHash(Buffer.from(doc.data)),
					mimeType: doc.mimeType,
					addedAt: new Date(),
				};

				this.catalog.set(catalogDoc.id, catalogDoc);
				this.stats.bytesTransferred += doc.fileSize;
			} catch (error) {
				console.error(`  ❌ Failed to save document ${doc.fileName}:`, error);
			}
		}

		console.log('  ✅ Transfer processed successfully\n');
	}

	private handleTransferError(error: any): void {
		console.error('\n❌ TRANSFER ERROR');
		console.error(`  Code: ${error.code}`);
		console.error(`  Message: ${error.message}`);
		console.error(`  Transport: ${error.transport}`);
		if (error.details) {
			console.error(`  Details:`, error.details);
		}
		console.log('');
	}

	private startStatusMonitoring(): void {
		// Print status every 30 seconds
		setInterval(() => {
			this.printStatus();
		}, 30000);

		// Print catalog every 5 minutes
		setInterval(() => {
			this.printCatalog();
		}, 300000);
	}

	private printStatus(): void {
		const status = this.transport.getStatus();
		const uptime = Date.now() - this.stats.startTime.getTime();
		const uptimeStr = this.formatDuration(uptime);

		console.log('\n📊 SERVER STATUS');
		console.log(`  Uptime: ${uptimeStr}`);
		console.log(`  Connections: ${status.activeTransfers}`);
		console.log(`  Initialized: ${status.isInitialized}`);
		console.log(`  Receiving: ${status.isReceiving}`);
		console.log(`  Documents: ${this.catalog.size}`);
		console.log(`  Transfers Received: ${this.stats.transfersReceived}`);
		console.log(`  Transfers Sent: ${this.stats.transfersSent}`);
		console.log(`  Bytes Transferred: ${this.formatBytes(this.stats.bytesTransferred)}`);
		console.log('');
	}

	private printCatalog(): void {
		console.log('\n📋 DOCUMENT CATALOG');
		if (this.catalog.size === 0) {
			console.log('  No documents available');
		} else {
			Array.from(this.catalog.values()).forEach((doc) => {
				console.log(`  ${doc.id}: ${doc.fileName} (${this.formatBytes(doc.fileSize)})`);
			});
		}
		console.log('');
	}

	private printHelp(): void {
		console.log('🔧 AVAILABLE COMMANDS:');
		console.log('  Ctrl+C       - Shutdown server');
		console.log('  status       - Show current status (auto every 30s)');
		console.log('  catalog      - Show document catalog (auto every 5m)');
		console.log('  send <id>    - Send document to peer');
		console.log('  peers        - Show connected peers');
		console.log('  help         - Show this help');
		console.log('');
		console.log('💡 TIP: Copy your Peer ID to share with other peers');
		console.log('');
	}

	private getMimeType(fileName: string): string {
		const ext = path.extname(fileName).toLowerCase();
		const mimeTypes: Record<string, string> = {
			'.pdf': 'application/pdf',
			'.txt': 'text/plain',
			'.md': 'text/markdown',
			'.json': 'application/json',
			'.xml': 'application/xml',
			'.doc': 'application/msword',
			'.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
		};
		return mimeTypes[ext] || 'application/octet-stream';
	}

	private formatBytes(bytes: number): string {
		if (bytes === 0) return '0 B';
		const k = 1024;
		const sizes = ['B', 'KB', 'MB', 'GB'];
		const i = Math.floor(Math.log(bytes) / Math.log(k));
		return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
	}

	private formatDuration(ms: number): string {
		const seconds = Math.floor(ms / 1000);
		const minutes = Math.floor(seconds / 60);
		const hours = Math.floor(minutes / 60);

		if (hours > 0) {
			return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
		} else if (minutes > 0) {
			return `${minutes}m ${seconds % 60}s`;
		} else {
			return `${seconds}s`;
		}
	}

	async sendDocument(docId: string, recipientPeerId: string): Promise<void> {
		const doc = this.catalog.get(docId);
		if (!doc) {
			console.error(`❌ Document not found: ${docId}`);
			return;
		}

		try {
			console.log(`📤 Sending document ${doc.fileName} to ${recipientPeerId}...`);

			const content = fs.readFileSync(doc.filePath);
			const transfer: OutgoingTransfer = {
				transferId: `server-send-${Date.now()}`,
				documents: [
					{
						id: doc.id,
						fileName: doc.fileName,
						fileSize: doc.fileSize,
						mimeType: doc.mimeType,
						hash: doc.hash,
						data: content,
					},
				],
				recipients: [
					{
						id: 'recipient',
						identifier: recipientPeerId,
						transport: 'p2p',
					},
				],
				createdAt: new Date(),
				status: 'pending',
			};

			const result = await this.transport.send(transfer);

			if (result.success) {
				console.log('✅ Document sent successfully');
				this.stats.transfersSent++;
				this.stats.documentsServed++;
			} else {
				console.log('❌ Failed to send document');
				result.recipientResults?.forEach((r) => {
					if (r.error) {
						console.log(`  Error: ${r.error}`);
					}
				});
			}
		} catch (error) {
			console.error('❌ Send error:', error);
		}
	}

	async shutdown(): Promise<void> {
		console.log('\n🛑 Shutting down server peer...');

		try {
			this.printStatus();
			await this.transport.shutdown();
			console.log('✅ Server peer shutdown complete');
			process.exit(0);
		} catch (error) {
			console.error('❌ Error during shutdown:', error);
			process.exit(1);
		}
	}
}

// Main execution
async function main() {
	const args = process.argv.slice(2);
	const port = parseInt(args[0]) || 9090;
	const documentsDir = args[1] || path.join(__dirname, '../test-documents');

	console.log('🌐 Firma-Sign P2P Server Peer');
	console.log('===============================');

	const server = new P2PServerPeer(port, documentsDir);
	await server.start();

	// Simple command line interface
	const rl = readline.createInterface({
		input: process.stdin,
		output: process.stdout,
		prompt: 'p2p-server> ',
	});

	rl.prompt();

	rl.on('line', (line: string) => {
		const [command, ...args] = line.trim().split(' ');

		switch (command) {
			case 'status':
				(server as any).printStatus();
				break;
			case 'catalog':
				(server as any).printCatalog();
				break;
			case 'send':
				if (args.length >= 2) {
					server.sendDocument(args[0], args[1]);
				} else {
					console.log('Usage: send <document-id> <peer-id>');
				}
				break;
			case 'peers':
				const status = (server as any).transport.getStatus();
				console.log(`Connected peers: ${status.activeTransfers}`);
				break;
			case 'help':
				(server as any).printHelp();
				break;
			case 'exit':
			case 'quit':
				server.shutdown();
				break;
			default:
				if (command) {
					console.log(`Unknown command: ${command}. Type 'help' for available commands.`);
				}
		}

		rl.prompt();
	});

	rl.on('close', () => {
		server.shutdown();
	});
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
	main().catch(console.error);
}
