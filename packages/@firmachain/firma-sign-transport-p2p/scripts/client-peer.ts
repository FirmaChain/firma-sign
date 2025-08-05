#!/usr/bin/env tsx

/**
 * P2P Client Peer Script
 * 
 * This script demonstrates how to create a P2P client peer that:
 * 1. Connects to other peers in the network
 * 2. Discovers available documents
 * 3. Requests and downloads files from server peers
 * 4. Sends documents to other peers
 * 
 * Usage:
 *   pnpm tsx scripts/client-peer.ts [port] [downloads-dir]
 * 
 * Example:
 *   pnpm tsx scripts/client-peer.ts 9091 ./downloads
 */

import { P2PTransport } from '../src/P2PTransport.js';
import { generateHash } from '@firmachain/firma-sign-core';
import type { IncomingTransfer, OutgoingTransfer } from '@firmachain/firma-sign-core';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface PeerInfo {
  peerId: string;
  connected: boolean;
  lastSeen: Date;
  documentsReceived: number;
}

interface DownloadedDocument {
  id: string;
  fileName: string;
  filePath: string;
  fileSize: number;
  hash: string;
  downloadedAt: Date;
  fromPeer: string;
}

class P2PClientPeer {
  private transport: P2PTransport;
  private downloadsDir: string;
  private knownPeers: Map<string, PeerInfo> = new Map();
  private downloadedDocs: Map<string, DownloadedDocument> = new Map();
  private stats = {
    documentsReceived: 0,
    documentsSent: 0,
    bytesReceived: 0,
    bytesSent: 0,
    peersConnected: 0,
    startTime: new Date()
  };

  constructor(private port: number, downloadsDir: string) {
    this.transport = new P2PTransport();
    this.downloadsDir = path.resolve(downloadsDir);
    
    // Ensure downloads directory exists
    if (!fs.existsSync(this.downloadsDir)) {
      fs.mkdirSync(this.downloadsDir, { recursive: true });
      console.log(`📁 Created downloads directory: ${this.downloadsDir}`);
    }
  }

  async start(): Promise<void> {
    console.log('🚀 Starting P2P Client Peer...');
    console.log(`📂 Downloads directory: ${this.downloadsDir}`);
    console.log(`🔌 Port: ${this.port}`);

    try {
      // Initialize transport
      await this.transport.initialize({
        port: this.port,
        enableDHT: true,
        enableMDNS: true,
        maxConnections: 50
      });

      // Set up transfer receiver
      this.transport.receive({
        onTransferReceived: this.handleIncomingTransfer.bind(this),
        onError: this.handleTransferError.bind(this)
      });

      // Start peer discovery monitoring
      this.startPeerMonitoring();

      const status = this.transport.getStatus();
      console.log('✅ Client peer started successfully!');
      console.log(`🆔 Peer ID: ${(this.transport as any).node?.peerId?.toString()}`);
      console.log('');
      
      this.printHelp();

      // Handle graceful shutdown
      process.on('SIGINT', this.shutdown.bind(this));
      process.on('SIGTERM', this.shutdown.bind(this));

    } catch (error) {
      console.error('❌ Failed to start client peer:', error);
      process.exit(1);
    }
  }

  private async handleIncomingTransfer(transfer: IncomingTransfer): Promise<void> {
    console.log('\n📥 INCOMING TRANSFER');
    console.log(`  Transfer ID: ${transfer.transferId}`);
    console.log(`  From: ${transfer.sender.name} (${transfer.sender.senderId})`);
    console.log(`  Transport: ${transfer.transport}`);
    console.log(`  Documents: ${transfer.documents.length}`);
    console.log(`  Status: ${transfer.status}`);

    // Update peer info
    const peerId = transfer.sender.senderId;
    const peerInfo = this.knownPeers.get(peerId) || {
      peerId,
      connected: true,
      lastSeen: new Date(),
      documentsReceived: 0
    };
    peerInfo.lastSeen = new Date();
    peerInfo.documentsReceived += transfer.documents.length;
    this.knownPeers.set(peerId, peerInfo);

    // Save received documents
    for (const doc of transfer.documents) {
      const timestamp = Date.now();
      const fileName = this.sanitizeFileName(`${timestamp}_${doc.fileName}`);
      const filePath = path.join(this.downloadsDir, fileName);
      
      try {
        fs.writeFileSync(filePath, doc.data);
        console.log(`  💾 Downloaded: ${fileName} (${doc.fileSize} bytes)`);
        
        // Record download
        const downloadedDoc: DownloadedDocument = {
          id: generateHash(Buffer.from(doc.data)).substring(0, 8),
          fileName,
          filePath,
          fileSize: doc.fileSize,
          hash: doc.hash || generateHash(Buffer.from(doc.data)),
          downloadedAt: new Date(),
          fromPeer: transfer.sender.name
        };
        
        this.downloadedDocs.set(downloadedDoc.id, downloadedDoc);
        this.stats.documentsReceived++;
        this.stats.bytesReceived += doc.fileSize;
        
      } catch (error) {
        console.error(`  ❌ Failed to save document ${doc.fileName}:`, error);
      }
    }

    console.log('  ✅ Transfer received successfully\n');
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

  private startPeerMonitoring(): void {
    // Monitor network status every 10 seconds
    setInterval(() => {
      this.updateNetworkStatus();
    }, 10000);

    // Print status every 60 seconds
    setInterval(() => {
      this.printStatus();
    }, 60000);
  }

  private updateNetworkStatus(): void {
    const status = this.transport.getStatus();
    this.stats.peersConnected = status.activeTransfers || 0;
  }

  private printStatus(): void {
    const status = this.transport.getStatus();
    const uptime = Date.now() - this.stats.startTime.getTime();
    const uptimeStr = this.formatDuration(uptime);

    console.log('\n📊 CLIENT STATUS');
    console.log(`  Uptime: ${uptimeStr}`);
    console.log(`  Connections: ${status.activeTransfers || 0}`);
    console.log(`  Known Peers: ${this.knownPeers.size}`);
    console.log(`  Documents Downloaded: ${this.stats.documentsReceived}`);
    console.log(`  Documents Sent: ${this.stats.documentsSent}`);
    console.log(`  Bytes Received: ${this.formatBytes(this.stats.bytesReceived)}`);
    console.log(`  Bytes Sent: ${this.formatBytes(this.stats.bytesSent)}`);
    console.log('');
  }

  private printPeers(): void {
    console.log('\n👥 KNOWN PEERS');
    if (this.knownPeers.size === 0) {
      console.log('  No peers discovered yet');
    } else {
      Array.from(this.knownPeers.values()).forEach(peer => {
        const lastSeenAgo = Date.now() - peer.lastSeen.getTime();
        console.log(`  ${peer.peerId.substring(0, 12)}... (${peer.documentsReceived} docs, ${this.formatDuration(lastSeenAgo)} ago)`);
      });
    }
    console.log('');
  }

  private printDownloads(): void {
    console.log('\n📥 DOWNLOADED DOCUMENTS');
    if (this.downloadedDocs.size === 0) {
      console.log('  No documents downloaded yet');
    } else {
      Array.from(this.downloadedDocs.values()).forEach(doc => {
        console.log(`  ${doc.id}: ${doc.fileName} (${this.formatBytes(doc.fileSize)}) from ${doc.fromPeer}`);
      });
    }
    console.log('');
  }

  async sendFile(filePath: string, recipientPeerId: string): Promise<void> {
    if (!fs.existsSync(filePath)) {
      console.error(`❌ File not found: ${filePath}`);
      return;
    }

    try {
      const fileName = path.basename(filePath);
      const content = fs.readFileSync(filePath);
      const hash = generateHash(content);
      
      console.log(`📤 Sending ${fileName} to ${recipientPeerId}...`);
      
      const transfer: OutgoingTransfer = {
        transferId: `client-send-${Date.now()}`,
        documents: [{
          id: hash.substring(0, 8),
          fileName,
          fileSize: content.length,
          mimeType: this.getMimeType(fileName),
          hash,
          data: content
        }],
        recipients: [{
          id: 'recipient',
          identifier: recipientPeerId,
          transport: 'p2p'
        }],
        createdAt: new Date(),
        status: 'pending'
      };

      const result = await this.transport.send(transfer);
      
      if (result.success) {
        console.log('✅ File sent successfully');
        this.stats.documentsSent++;
        this.stats.bytesSent += content.length;
      } else {
        console.log('❌ Failed to send file');
        result.recipientResults?.forEach(r => {
          if (r.error) {
            console.log(`  Error: ${r.error}`);
          }
        });
      }
    } catch (error) {
      console.error('❌ Send error:', error);
    }
  }

  async requestFile(peerId: string, requestMessage: string = 'File request'): Promise<void> {
    try {
      console.log(`📞 Requesting file from ${peerId}...`);
      
      const requestDoc = Buffer.from(JSON.stringify({
        type: 'file-request',
        message: requestMessage,
        timestamp: new Date().toISOString(),
        clientId: (this.transport as any).node?.peerId?.toString()
      }));

      const transfer: OutgoingTransfer = {
        transferId: `file-request-${Date.now()}`,
        documents: [{
          id: 'request',
          fileName: 'file-request.json',
          fileSize: requestDoc.length,
          mimeType: 'application/json',
          hash: generateHash(requestDoc),
          data: requestDoc
        }],
        recipients: [{
          id: 'server',
          identifier: peerId,
          transport: 'p2p'
        }],
        createdAt: new Date(),
        status: 'pending'
      };

      const result = await this.transport.send(transfer);
      
      if (result.success) {
        console.log('✅ File request sent successfully');
      } else {
        console.log('❌ Failed to send file request');
      }
    } catch (error) {
      console.error('❌ Request error:', error);
    }
  }

  async discoverPeers(): Promise<void> {
    console.log('🔍 Discovering peers...');
    
    // In a real implementation, this would use DHT queries
    // For now, we'll just show current connection status
    const status = this.transport.getStatus();
    console.log(`📡 Current connections: ${status.activeTransfers || 0}`);
    
    if (this.knownPeers.size > 0) {
      console.log('📋 Previously known peers:');
      this.printPeers();
    } else {
      console.log('💡 No peers discovered yet. Make sure other peers are running on the network.');
    }
  }

  private printHelp(): void {
    console.log('🔧 AVAILABLE COMMANDS:');
    console.log('  discover          - Discover available peers');
    console.log('  peers             - Show known peers');
    console.log('  downloads         - Show downloaded documents');
    console.log('  status            - Show current status');
    console.log('  send <file> <peer> - Send file to peer');
    console.log('  request <peer>    - Request files from peer');
    console.log('  help              - Show this help');
    console.log('  exit              - Shutdown client');
    console.log('');
    console.log('💡 TIP: Use short peer IDs (first 12 characters) for commands');
    console.log('');
  }

  private sanitizeFileName(fileName: string): string {
    return fileName.replace(/[^a-zA-Z0-9.-_]/g, '_');
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
      '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
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
      return `${hours}h ${minutes % 60}m`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    } else {
      return `${seconds}s`;
    }
  }

  async shutdown(): Promise<void> {
    console.log('\n🛑 Shutting down client peer...');
    
    try {
      this.printStatus();
      this.printDownloads();
      await this.transport.shutdown();
      console.log('✅ Client peer shutdown complete');
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
  const port = parseInt(args[0]) || 9091;
  const downloadsDir = args[1] || path.join(__dirname, '../downloads');

  console.log('📱 Firma-Sign P2P Client Peer');
  console.log('==============================');

  const client = new P2PClientPeer(port, downloadsDir);
  await client.start();

  // Simple command line interface
  const readline = require('readline');
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    prompt: 'p2p-client> '
  });

  rl.prompt();

  rl.on('line', (line: string) => {
    const [command, ...args] = line.trim().split(' ');
    
    switch (command) {
      case 'discover':
        client.discoverPeers();
        break;
      case 'peers':
        (client as any).printPeers();
        break;
      case 'downloads':
        (client as any).printDownloads();
        break;
      case 'status':
        (client as any).printStatus();
        break;
      case 'send':
        if (args.length >= 2) {
          client.sendFile(args[0], args[1]);
        } else {
          console.log('Usage: send <file-path> <peer-id>');
        }
        break;
      case 'request':
        if (args.length >= 1) {
          const message = args.slice(1).join(' ') || 'Please share available files';
          client.requestFile(args[0], message);
        } else {
          console.log('Usage: request <peer-id> [message]');
        }
        break;
      case 'help':
        (client as any).printHelp();
        break;
      case 'exit':
      case 'quit':
        client.shutdown();
        break;
      default:
        if (command) {
          console.log(`Unknown command: ${command}. Type 'help' for available commands.`);
        }
    }
    
    rl.prompt();
  });

  rl.on('close', () => {
    client.shutdown();
  });
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}