import { PeerExplorerApiClient } from '../api/client';

// Create a single API client instance to be used across components
export const apiClient = new PeerExplorerApiClient();

// Utility functions for transport and peer management
export const getTransportIcon = (transport: string): string => {
	switch (transport.toLowerCase()) {
		case 'p2p':
			return '🌐';
		case 'email':
			return '📧';
		case 'discord':
			return '💬';
		case 'telegram':
			return '📱';
		case 'web':
			return '🔗';
		default:
			return '❓';
	}
};

export const getStatusColor = (status: string): string => {
	switch (status.toLowerCase()) {
		case 'active':
		case 'connected':
		case 'online':
		case 'verified':
			return 'text-green-400';
		case 'partial':
		case 'connecting':
		case 'pending':
			return 'text-yellow-400';
		case 'inactive':
		case 'disconnected':
		case 'offline':
		case 'error':
		case 'failed':
			return 'text-red-400';
		default:
			return 'text-gray-400';
	}
};

export const formatLatency = (latency: number): string => {
	if (latency < 50) return 'Excellent';
	if (latency < 100) return 'Good';
	if (latency < 200) return 'Fair';
	return 'Poor';
};

export const formatBandwidth = (bytes: number): string => {
	if (bytes === 0) return '0 B/s';
	const k = 1024;
	const sizes = ['B/s', 'KB/s', 'MB/s', 'GB/s'];
	const i = Math.floor(Math.log(bytes) / Math.log(k));
	return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
};

export const formatFileSize = (bytes: number): string => {
	if (bytes === 0) return '0 B';
	const k = 1024;
	const sizes = ['B', 'KB', 'MB', 'GB'];
	const i = Math.floor(Math.log(bytes) / Math.log(k));
	return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
};

export const formatTimestamp = (timestamp: number): string => {
	const now = Date.now();
	const diff = now - timestamp;
	
	if (diff < 60000) return 'Just now';
	if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
	if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
	return `${Math.floor(diff / 86400000)}d ago`;
};

export const generatePeerId = (): string => {
	return `peer-${Math.random().toString(36).substr(2, 9)}`;
};

export const generateTransferId = (): string => {
	return `transfer-${Math.random().toString(36).substr(2, 9)}-${Date.now()}`;
};

export const validatePeerId = (peerId: string): boolean => {
	return /^[a-zA-Z0-9_-]+$/.test(peerId) && peerId.length > 5;
};

export const truncateId = (id: string, length: number = 8): string => {
	if (id.length <= length) return id;
	return `${id.substring(0, length)}...`;
};

export const getTransportPriority = (transportType: string): number => {
	switch (transportType.toLowerCase()) {
		case 'p2p': return 1;
		case 'email': return 2;
		case 'discord': return 3;
		case 'telegram': return 4;
		case 'web': return 5;
		default: return 10;
	}
};

export const isValidTransportConfig = (config: Record<string, unknown>): boolean => {
	return config && typeof config === 'object' && Object.keys(config).length > 0;
};