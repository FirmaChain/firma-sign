/**
 * Example: Using P2P Transport in Different Network Scenarios
 * 
 * This file demonstrates how to configure and use the P2P transport
 * for various network environments as described in CONNECTION-SCENARIOS.md
 */

import { P2PTransport } from '../src/P2PTransport';
import type { OutgoingTransfer } from '@firmachain/firma-sign-core';

// ============================================
// 1. SAME WIFI NETWORK
// ============================================
async function sameWifiExample() {
  console.log('📱 Same WiFi Network Example');
  
  const transport = new P2PTransport();
  
  await transport.initialize({
    mode: 'auto',
    enableLocalDiscovery: true,  // Enable mDNS for local discovery
    preferLocal: true,           // Prefer local connections
    enableDHT: false,           // Not needed for local network
  });
  
  // Generate connection key for local transfer
  const key = await transport.generateConnectionKey({
    transferId: 'local-transfer-123',
    preferLocal: true,
  });
  
  console.log(`Share this key on local network: ${key}`);
  
  // The recipient on same network will connect instantly
  // Data never leaves the local network
}

// ============================================
// 2. DIFFERENT LOCATIONS/NETWORKS
// ============================================
async function differentLocationsExample() {
  console.log('🌍 Different Locations Example');
  
  const transport = new P2PTransport();
  
  await transport.initialize({
    mode: 'auto',
    enableDHT: true,
    enableLocalDiscovery: true,
    stunServers: [
      'stun:stun.l.google.com:19302',
      'stun:stun1.l.google.com:19302',
    ],
    relayServers: [
      'turn:relay.example.com:3478',  // Your relay server
    ],
    fallbackToRelay: true,  // Use relay if direct P2P fails
  });
  
  // Diagnose connection capabilities
  const diagnosis = await transport.diagnoseConnection();
  console.log('Connection diagnosis:', diagnosis);
  
  // Generate key for remote transfer
  const key = await transport.generateConnectionKey({
    transferId: 'remote-transfer-456',
  });
  
  console.log(`Share this key with remote recipient: ${key}`);
}

// ============================================
// 3. BEHIND CORPORATE FIREWALL
// ============================================
async function corporateFirewallExample() {
  console.log('🏢 Corporate Firewall Example');
  
  const transport = new P2PTransport();
  
  await transport.initialize({
    mode: 'relay',  // Force relay mode for strict firewalls
    fallbackToRelay: true,
    relayProtocol: 'https',  // Use HTTPS for firewall compatibility
    websocketFallback: true,  // Use WebSocket if needed
    relayServers: [
      'https://relay.company.com:443',  // HTTPS port
    ],
  });
  
  // All traffic will go through relay server
  // Appears as normal HTTPS traffic to firewall
  
  const key = await transport.generateConnectionKey({
    transferId: 'corporate-transfer-789',
  });
  
  console.log(`Connection key for corporate network: ${key}`);
}

// ============================================
// 4. MOBILE NETWORKS (4G/5G)
// ============================================
async function mobileNetworkExample() {
  console.log('📱 Mobile Network Example');
  
  const transport = new P2PTransport();
  
  await transport.initialize({
    mode: 'auto',
    mobileOptimization: true,    // Optimize for mobile
    adaptiveBitrate: true,       // Adjust to network speed
    resumable: true,             // Handle network switches
    quickFallback: true,         // Quickly switch to relay if needed
  });
  
  // Listen for network changes
  transport.on('networkChange', () => {
    console.log('Network changed, reconnecting...');
  });
  
  const key = await transport.generateConnectionKey({
    transferId: 'mobile-transfer-abc',
  });
  
  console.log(`Mobile-optimized connection key: ${key}`);
}

// ============================================
// 5. UNIVERSAL CONFIGURATION
// ============================================
async function universalConfigExample() {
  console.log('🌐 Universal Configuration Example');
  
  const transport = new P2PTransport();
  
  // This configuration handles all scenarios
  await transport.initialize({
    mode: 'auto',  // Automatically choose best method
    
    // Local discovery
    enableLocalDiscovery: true,
    
    // Public STUN servers for NAT traversal
    stunServers: [
      'stun:stun.l.google.com:19302',
      'stun:stun2.l.google.com:19302',
      'stun:stun3.l.google.com:19302',
    ],
    
    // Relay servers for fallback
    relayServers: [
      'turns:relay1.firma-sign.com:443',  // HTTPS relay
      'turn:relay2.firma-sign.com:3478',  // Standard TURN
    ],
    
    // Optimizations
    adaptiveBitrate: true,
    resumable: true,
    mobileOptimization: true,
    
    // Timeouts
    connectionTimeout: 30000,  // 30 seconds to establish
    
    // Debug
    debug: true,
    logLevel: 'info',
  });
  
  // Monitor connection events
  transport.on('connectionEstablished', (info) => {
    console.log(`Connected via ${info.method}`);
  });
  
  transport.on('fallbackToRelay', () => {
    console.log('Direct P2P failed, using relay server');
  });
  
  // Test connection before sending
  const testResult = await transport.testConnection('peer-id-or-key');
  console.log('Connection test:', testResult);
  
  // Send document
  const transfer: OutgoingTransfer = {
    transferId: 'universal-transfer-xyz',
    documents: [{
      id: 'doc1',
      fileName: 'contract.pdf',
      fileSize: 1024000,
      mimeType: 'application/pdf',
      hash: 'sha256...',
      data: Buffer.from('PDF content here'),
    }],
    recipients: [{
      id: 'recipient1',
      identifier: 'recipient-peer-id',
      transport: 'p2p',
    }],
  };
  
  const result = await transport.send(transfer);
  console.log('Transfer result:', result);
}

// ============================================
// 6. DIAGNOSTIC AND MONITORING
// ============================================
async function diagnosticExample() {
  console.log('🔍 Diagnostic Example');
  
  const transport = new P2PTransport();
  
  await transport.initialize({
    mode: 'auto',
    healthCheck: {
      enabled: true,
      interval: 30000,  // Check every 30 seconds
    },
    metrics: {
      enabled: true,
      port: 9091,
      endpoint: '/metrics',
    },
  });
  
  // Run connection diagnosis
  const diagnosis = await transport.diagnoseConnection();
  console.log('NAT Type:', diagnosis.natType);
  console.log('Can do direct P2P:', diagnosis.canDirectP2P);
  console.log('Needs relay:', diagnosis.needsRelay);
  console.log('Suggested mode:', diagnosis.suggestedMode);
  
  // Test connection to specific peer
  const connectionKey = 'ABC-123';
  const testResult = await transport.testConnection(connectionKey);
  console.log('Reachable:', testResult.reachable);
  console.log('Method:', testResult.method);
  console.log('Latency:', testResult.latency, 'ms');
  console.log('Bandwidth:', testResult.bandwidth, 'MB/s');
  
  // Monitor health checks
  transport.on('healthCheck', (status) => {
    console.log('Health check:', status);
  });
  
  // Get current status
  const status = transport.getStatus();
  console.log('Transport status:', status);
}

// ============================================
// RUN EXAMPLES
// ============================================
async function runExamples() {
  try {
    // Uncomment the example you want to run:
    
    // await sameWifiExample();
    // await differentLocationsExample();
    // await corporateFirewallExample();
    // await mobileNetworkExample();
    await universalConfigExample();
    // await diagnosticExample();
    
  } catch (error) {
    console.error('Error:', error);
  }
}

// Run if this file is executed directly
if (require.main === module) {
  runExamples().catch(console.error);
}

export {
  sameWifiExample,
  differentLocationsExample,
  corporateFirewallExample,
  mobileNetworkExample,
  universalConfigExample,
  diagnosticExample,
};