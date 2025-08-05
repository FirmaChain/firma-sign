#!/usr/bin/env tsx

/**
 * Connection Test Script
 * 
 * This script helps diagnose P2P connection issues by testing connectivity
 * step by step.
 * 
 * Usage:
 *   pnpm tsx scripts/test-connection.ts <multiaddr>
 * 
 * Example:
 *   pnpm tsx scripts/test-connection.ts /ip4/127.0.0.1/tcp/9090/p2p/12D3KooW...
 */

import { createLibp2p } from 'libp2p';
import { tcp } from '@libp2p/tcp';
import { webSockets } from '@libp2p/websockets';
import { mplex } from '@libp2p/mplex';
import { yamux } from '@chainsafe/libp2p-yamux';
import { identify } from '@libp2p/identify';
import { multiaddr } from '@multiformats/multiaddr';
import { noise } from '@chainsafe/libp2p-noise';
import { tls } from '@libp2p/tls';

async function testConnection(multiaddrStr: string) {
  console.log('🔍 P2P Connection Test');
  console.log('======================\n');
  
  console.log(`📍 Target: ${multiaddrStr}`);
  
  // Parse multiaddr
  const parts = multiaddrStr.split('/');
  const ipIndex = parts.indexOf('ip4') + 1;
  const tcpIndex = parts.indexOf('tcp') + 1;
  const wsIndex = parts.indexOf('ws');
  const peerIdIndex = parts.indexOf('p2p') + 1;
  
  if (ipIndex > 0 && tcpIndex > 0) {
    const ip = parts[ipIndex];
    const port = parts[tcpIndex];
    console.log(`📊 Parsed: IP=${ip}, Port=${port}`);
    
    // Test network connectivity
    console.log('\n1️⃣ Testing network connectivity...');
    try {
      const net = await import('net');
      await new Promise<void>((resolve, reject) => {
        const socket = net.createConnection({ host: ip, port: parseInt(port) }, () => {
          console.log('✅ TCP connection successful');
          socket.end();
          resolve();
        });
        socket.on('error', (err) => {
          console.log('❌ TCP connection failed:', err.message);
          reject(err);
        });
        socket.setTimeout(5000, () => {
          socket.destroy();
          reject(new Error('Connection timeout'));
        });
      });
    } catch (error) {
      console.log('⚠️  Basic TCP connection failed. Server might not be running.');
      console.log('💡 Tips:');
      console.log('   - Check if server is running: Look for "P2P Transport listening on" in server output');
      console.log('   - Verify IP address: Use actual IP from server output, not 127.0.0.1');
      console.log('   - Check firewall: Temporarily disable to test');
      return;
    }
  }
  
  // Create test node
  console.log('\n2️⃣ Creating test P2P node...');
  const node = await createLibp2p({
    addresses: {
      listen: ['/ip4/0.0.0.0/tcp/0'] // Random port
    },
    transports: [tcp(), webSockets()],
    streamMuxers: [yamux(), mplex()],
    connectionEncrypters: [noise(), tls()],
    services: {
      identify: identify()
    }
  });
  
  await node.start();
  console.log('✅ Test node created');
  console.log(`📍 Our Peer ID: ${node.peerId.toString()}`);
  
  // Try to dial
  console.log('\n3️⃣ Attempting P2P connection...');
  try {
    console.log('🔄 Dialing peer...');
    
    // Parse the multiaddr string
    const ma = multiaddr(multiaddrStr);
    console.log('📍 Parsed multiaddr:', ma.toString());
    
    // Dial the peer
    const connection = await node.dial(ma);
    console.log('✅ P2P connection established!');
    console.log(`📡 Remote Peer: ${connection.remotePeer.toString()}`);
    console.log(`🔗 Connection ID: ${connection.id}`);
    console.log(`📊 Status: ${connection.status}`);
    
    // Get connection details
    const streams = connection.streams;
    console.log(`📊 Active streams: ${streams.length}`);
    
    // Close connection
    await connection.close();
    console.log('✅ Connection closed cleanly');
    
  } catch (error) {
    console.log('❌ P2P connection failed:', error);
    
    if (error instanceof Error) {
      if (error.message.includes('dial to self')) {
        console.log('\n❌ Error: Trying to connect to yourself');
        console.log('💡 You cannot connect a peer to itself. Use different ports for client and server.');
      } else if (error.message.includes('No transport')) {
        console.log('\n❌ Error: No compatible transport');
        console.log('💡 Check the multiaddr format. Use /tcp/ for TCP connections.');
      } else if (error.message.includes('ECONNREFUSED')) {
        console.log('\n❌ Error: Connection refused');
        console.log('💡 The server is not listening on this address/port.');
      }
    }
  }
  
  // Cleanup
  await node.stop();
  console.log('\n🏁 Test complete');
}

// Main execution
async function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.log('Usage: pnpm tsx scripts/test-connection.ts <multiaddr>');
    console.log('Example: pnpm tsx scripts/test-connection.ts /ip4/127.0.0.1/tcp/9090/p2p/12D3KooW...');
    process.exit(1);
  }
  
  const multiaddr = args[0];
  
  try {
    await testConnection(multiaddr);
  } catch (error) {
    console.error('Test failed:', error);
    process.exit(1);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}