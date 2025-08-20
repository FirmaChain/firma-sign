// Re-export from the dedicated API client
import { PeerExplorerApiClient } from './api/client';

// Create a singleton instance
export const apiClient = new PeerExplorerApiClient();

// Utility functions
export function formatTransportName(transport: string): string {
	const names: Record<string, string> = {
		p2p: 'P2P',
		email: 'Email',
		discord: 'Discord',
		telegram: 'Telegram',
	};
	return names[transport] || transport.charAt(0).toUpperCase() + transport.slice(1);
}

export function getTrustLevelColor(trustLevel: string): string {
	const colors: Record<string, string> = {
		unverified: 'text-gray-500',
		email_verified: 'text-yellow-500',
		identity_verified: 'text-blue-500',
		trusted: 'text-green-500',
	};
	return colors[trustLevel] || 'text-gray-500';
}

export function getTrustLevelIcon(trustLevel: string): string {
	const icons: Record<string, string> = {
		unverified: '❓',
		email_verified: '📧',
		identity_verified: '🆔',
		trusted: '⭐',
	};
	return icons[trustLevel] || '❓';
}

export function getTransportIcon(transport: string): string {
	const icons: Record<string, string> = {
		p2p: '🌐',
		email: '📧',
		discord: '💬',
		telegram: '📱',
	};
	return icons[transport] || '📡';
}

export function getStatusColor(status: string): string {
	const colors: Record<string, string> = {
		online: 'text-green-500',
		partial: 'text-yellow-500',
		offline: 'text-red-500',
		connected: 'text-green-500',
		available: 'text-blue-500',
		error: 'text-red-500',
		active: 'text-green-500',
		inactive: 'text-gray-500',
		connecting: 'text-yellow-500',
	};
	return colors[status] || 'text-gray-500';
}

export function formatBytes(bytes: number): string {
	const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
	if (bytes === 0) return '0 Bytes';
	const i = Math.floor(Math.log(bytes) / Math.log(1024));
	return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
}

export function formatLatency(latency: number): string {
	if (latency < 1000) {
		return `${Math.round(latency)}ms`;
	}
	return `${Math.round(latency / 1000 * 10) / 10}s`;
}

export function getConnectionQuality(latency?: number): {
	quality: 'excellent' | 'good' | 'poor';
	color: string;
	icon: string;
} {
	if (!latency) {
		return { quality: 'poor', color: 'text-gray-500', icon: '📶' };
	}

	if (latency < 50) {
		return { quality: 'excellent', color: 'text-green-500', icon: '📶' };
	} else if (latency < 150) {
		return { quality: 'good', color: 'text-yellow-500', icon: '📶' };
	} else {
		return { quality: 'poor', color: 'text-red-500', icon: '📶' };
	}
}

export function truncatePeerId(peerId: string, length: number = 8): string {
	if (peerId.length <= length * 2) return peerId;
	return `${peerId.slice(0, length)}...${peerId.slice(-length)}`;
}

export function timeAgo(date: Date): string {
	const now = new Date();
	const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

	if (diffInSeconds < 60) {
		return 'just now';
	} else if (diffInSeconds < 3600) {
		const minutes = Math.floor(diffInSeconds / 60);
		return `${minutes}m ago`;
	} else if (diffInSeconds < 86400) {
		const hours = Math.floor(diffInSeconds / 3600);
		return `${hours}h ago`;
	} else {
		const days = Math.floor(diffInSeconds / 86400);
		return `${days}d ago`;
	}
}

export { APIError };