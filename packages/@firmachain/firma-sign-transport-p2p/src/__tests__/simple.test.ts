import { describe, it, expect } from 'vitest';
import { P2PTransport } from '../P2PTransport.js';

/**
 * Simple P2P Transport Tests
 * Tests basic functionality without WebRTC to avoid native binary dependencies
 */
describe('P2P Transport - Simple Tests', () => {
  let transport: P2PTransport;

  describe('Basic Transport Functions', () => {
    it('should create transport instance', () => {
      transport = new P2PTransport();
      expect(transport).toBeDefined();
      expect(transport.name).toBe('p2p');
      expect(transport.version).toBe('1.0.0');
    });

    it('should have correct capabilities', () => {
      transport = new P2PTransport();
      const caps = transport.capabilities;
      
      expect(caps.maxFileSize).toBe(500 * 1024 * 1024); // 500MB
      expect(caps.supportsBatch).toBe(true);
      expect(caps.supportsEncryption).toBe(true);
      expect(caps.supportsNotifications).toBe(true);
      expect(caps.supportsResume).toBe(true);
      expect(caps.requiredConfig).toContain('port');
    });

    it('should validate configuration correctly', () => {
      transport = new P2PTransport();
      
      // Valid configs
      expect(transport.validateConfig({ port: 9090 })).toBe(true);
      expect(transport.validateConfig({ port: 9090, enableDHT: true })).toBe(true);
      expect(transport.validateConfig({ port: 9090, enableMDNS: false })).toBe(true);
      
      // Invalid configs
      expect(transport.validateConfig(null)).toBe(false);
      expect(transport.validateConfig({})).toBe(false); // Missing required port
      expect(transport.validateConfig({ port: 'invalid' })).toBe(false);
      expect(transport.validateConfig({ port: -1 })).toBe(false);
      expect(transport.validateConfig({ port: 70000 })).toBe(false); // Port too high
    });

    it('should report uninitialized status', () => {
      transport = new P2PTransport();
      const status = transport.getStatus();
      
      expect(status.isInitialized).toBe(false);
      expect(status.isReceiving).toBe(false);
      expect(status.lastError).toBe('Not initialized');
      expect(status.activeTransfers).toBe(0);
    });

    it('should handle shutdown gracefully when not initialized', async () => {
      transport = new P2PTransport();
      
      // Should not throw when shutting down uninitialized transport
      await expect(transport.shutdown()).resolves.not.toThrow();
    });
  });

  describe('Transport Interface Compliance', () => {
    it('should implement all required Transport methods', () => {
      transport = new P2PTransport();
      
      // Check all required methods exist
      expect(typeof transport.initialize).toBe('function');
      expect(typeof transport.shutdown).toBe('function');
      expect(typeof transport.send).toBe('function');
      expect(typeof transport.receive).toBe('function');
      expect(typeof transport.getStatus).toBe('function');
      expect(typeof transport.validateConfig).toBe('function');
    });

    it('should have required properties', () => {
      transport = new P2PTransport();
      
      expect(typeof transport.name).toBe('string');
      expect(typeof transport.version).toBe('string');
      expect(typeof transport.capabilities).toBe('object');
      
      // Capabilities should have required properties
      const caps = transport.capabilities;
      expect(typeof caps.maxFileSize).toBe('number');
      expect(typeof caps.supportsBatch).toBe('boolean');
      expect(typeof caps.supportsEncryption).toBe('boolean');
      expect(typeof caps.supportsNotifications).toBe('boolean');
      expect(Array.isArray(caps.requiredConfig)).toBe(true);
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid send attempts when not initialized', async () => {
      transport = new P2PTransport();
      
      const mockTransfer = {
        transferId: 'test-transfer',
        documents: [{
          id: 'doc1',
          fileName: 'test.pdf',
          fileSize: 1000,
          mimeType: 'application/pdf',
          hash: 'test-hash',
          data: Buffer.from('test content')
        }],
        recipients: [{
          id: 'recipient1',
          identifier: 'test-peer-id'
        }],
        sender: {
          senderId: 'test-sender',
          name: 'Test Sender',
          transport: 'p2p',
          timestamp: new Date(),
          verificationStatus: 'verified' as const
        },
        createdAt: new Date(),
        status: 'pending' as const,
        transport: 'p2p'
      };

      const result = await transport.send(mockTransfer);
      expect(result.success).toBe(false);
      expect(result.transferId).toBe('test-transfer');
    });

    it('should handle receive handler registration when not initialized', () => {
      transport = new P2PTransport();
      
      const mockHandler = {
        onTransferReceived: async () => {},
        onError: () => {}
      };

      // Should not throw when registering handler
      expect(() => transport.receive(mockHandler)).not.toThrow();
    });
  });
});