import React, { useState, useEffect, useCallback } from 'react';
import PeerExplorerHeader from './PeerExplorerHeader';
import TransportStatusBar from './TransportStatusBar';
import { useWebSocketConnection } from './hooks/useWebSocketConnection';
import { PeerExplorerState, TransportStatus, EnhancedPeer } from './types';
import { apiClient, getTransportIcon, getStatusColor } from './utils';

interface PeerExplorerProps {
	className?: string;
}

const PeerExplorer: React.FC<PeerExplorerProps> = ({ className }) => {
	const [state, setState] = useState<PeerExplorerState>({
		transports: {
			initialized: false,
			available: [],
			selected: ['p2p'],
		},
		networkStatus: 'disconnected',
		peers: {
			connected: [],
			discovered: [],
			recent: [],
			blocked: [],
			favorites: [],
		},
		groups: [],
		transfers: {
			active: [],
			history: [],
		},
		messages: {},
		searchQuery: '',
		filters: {
			status: 'all',
			transports: [],
			trustLevel: 'all',
			groups: [],
		},
		sortBy: 'quality',
		selectedPeers: [],
		selectedGroups: [],
	});

	const [activeTab, setActiveTab] = useState<'connected' | 'discovered' | 'recent' | 'groups'>(
		'connected',
	);
	const [isInitializing, setIsInitializing] = useState(false);
	const [showDetails, setShowDetails] = useState(false);

	// API client is now imported from utils

	// WebSocket connection for real-time updates
	const { isConnected: wsConnected } = useWebSocketConnection(
		{ url: 'ws://localhost:8080/explorer' },
		{
			onPeerStatus: (event) => {
				setState((prev) => ({
					...prev,
					peers: {
						...prev.peers,
						connected: prev.peers.connected.map((peer) =>
							peer.peerId === event.peerId
								? {
										...peer,
										status: event.status,
										transferHistory: { ...peer.transferHistory, lastTransfer: new Date() },
									}
								: peer,
						),
					},
				}));
			},
			onPeerDiscovered: (event) => {
				setState((prev) => ({
					...prev,
					peers: {
						...prev.peers,
						discovered: [
							...prev.peers.discovered.filter((p) => p.peerId !== event.peer.peerId),
							event.peer,
						],
					},
				}));
			},
			onTransportStatus: (event) => {
				const details = event.details as Record<string, unknown>;
				setState((prev) => ({
					...prev,
					transports: {
						...prev.transports,
						available: prev.transports.available.map((transport) =>
							transport.type === event.transport
								? {
										...transport,
										status: event.status,
										connections: (details?.connections as number) || 0,
									}
								: transport,
						),
					},
				}));
			},
		},
	);

	const checkTransportStatus = useCallback(async () => {
		try {
			// Check server's transport status instead of initializing our own
			const result = await apiClient.getConnectionStatus();
			const transportStatuses: TransportStatus[] = Object.entries(
				result.transports as Record<string, unknown>,
			).map(([type, info]) => {
				const transportInfo = info as Record<string, unknown>;
				return {
					type: type as 'p2p' | 'email' | 'discord' | 'telegram' | 'web',
					status: transportInfo.status as 'active' | 'inactive' | 'error' | 'connecting',
					connections: (transportInfo.connections as number) || 0,
					config: transportInfo.config as Record<string, unknown>,
					metrics: transportInfo.metrics as Record<string, unknown>,
					error: transportInfo.error as string,
				};
			});

			const hasActiveTransports = transportStatuses.some(t => t.status === 'active');

			setState((prev) => ({
				...prev,
				transports: {
					...prev.transports,
					initialized: hasActiveTransports,
					available: transportStatuses,
				},
				networkStatus: hasActiveTransports ? 'connected' : 'disconnected',
			}));
		} catch (error) {
			console.error('Failed to check transport status:', error);
			setState((prev) => ({
				...prev,
				networkStatus: 'disconnected',
			}));
		}
	}, []);
	
	const handleInitialize = useCallback(async () => {
		setIsInitializing(true);
		try {
			// Initialize the transports with default configuration
			const config = {
				p2p: {
					enableDHT: false,
					enableMDNS: true, // cspell:ignore MDNS
				},
			};
			
			const result = await apiClient.initializeTransports({
				transports: ['p2p'],
				config,
			});
			
			if (result.initialized) {
				// After initialization, check the status
				await checkTransportStatus();
			}
		} catch (error) {
			console.error('Failed to initialize transports:', error);
			setState((prev) => ({
				...prev,
				networkStatus: 'disconnected',
			}));
		} finally {
			setIsInitializing(false);
		}
	}, [checkTransportStatus]);

	// Check transport status on component mount
	useEffect(() => {
		void checkTransportStatus();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []); // Empty dependency array - only run once on mount

	const discoverPeers = useCallback(async () => {
		try {
			const result = await apiClient.discoverPeers({
				transports: state.transports.selected,
				query: state.searchQuery,
				filters: {
					online: state.filters.status === 'connected',
					verified: state.filters.trustLevel === 'verified',
				},
			});

			setState((prev) => ({
				...prev,
				peers: {
					...prev.peers,
					discovered: result.peers,
				},
			}));
		} catch (error) {
			console.error('Failed to discover peers:', error);
		}
	}, [state.transports.selected, state.searchQuery, state.filters]);

	const handleSettings = useCallback(() => {
		console.log('Open network settings');
		// TODO: Implement settings modal
	}, []);

	const handleRefresh = useCallback(async () => {
		await discoverPeers();
	}, [discoverPeers]);

	const handleTransportClick = useCallback(
		(transport: TransportStatus) => {
			console.log('Transport clicked:', transport);
			// TODO: Show transport details
			setShowDetails(!showDetails);
		},
		[showDetails],
	);

	const filteredPeers = (): EnhancedPeer[] => {
		const peers = state.peers[activeTab as keyof typeof state.peers] as EnhancedPeer[];
		if (!Array.isArray(peers)) return [];

		return peers.filter((peer) => {
			if (state.searchQuery) {
				const query = state.searchQuery.toLowerCase();
				const displayName = peer.displayName || '';
				const identifiers = peer.identifiers || {};
				return (
					displayName.toLowerCase().includes(query) ||
					Object.values(identifiers).some(
						(id) => typeof id === 'string' && id.toLowerCase().includes(query),
					)
				);
			}
			return true;
		});
	};

	return (
		<div className={`flex flex-col h-full text-[#cccccc] ${className || ''}`}>
			{/* Header with Transport Status */}
			<PeerExplorerHeader
				transports={state.transports.available}
				initialized={state.transports.initialized}
				networkStatus={state.networkStatus}
				onInitialize={() => void handleInitialize()}
				onSettings={handleSettings}
				onRefresh={() => void handleRefresh()}
				isInitializing={isInitializing}
			/>

			{/* Transport Status Details */}
			{state.transports.available.length > 0 && showDetails && (
				<div className="flex-shrink-0 border-b border-gray-700">
					<TransportStatusBar
						transports={state.transports.available}
						compact={false}
						showMetrics={true}
						onTransportClick={handleTransportClick}
						className="p-3"
					/>
				</div>
			)}

			{/* Search and Discovery */}
			<div className="flex-shrink-0 p-3 border-b border-gray-700">
				<div className="flex gap-2 mb-2">
					<input
						type="text"
						placeholder="Search peers..."
						value={state.searchQuery}
						onChange={(e) => setState((prev) => ({ ...prev, searchQuery: e.target.value }))}
						className="flex-1 px-2 py-1 text-xs bg-gray-800 border border-gray-600 rounded focus:border-blue-500 focus:outline-none"
					/>
					<button
						onClick={() => void discoverPeers()}
						disabled={!state.transports.initialized}
						className="px-3 py-1 text-xs bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed rounded"
						title="Discover Peers"
					>
						🔍
					</button>
				</div>

				{/* Filters */}
				<div className="flex gap-2 text-xs">
					<select
						value={state.filters.status}
						onChange={(e) =>
							setState((prev) => ({
								...prev,
								filters: {
									...prev.filters,
									status: e.target.value as
										| 'all'
										| 'connected'
										| 'discovered'
										| 'offline'
										| 'verified',
								},
							}))
						}
						className="px-2 py-1 bg-gray-800 border border-gray-600 rounded"
					>
						<option value="all">All</option>
						<option value="connected">Connected</option>
						<option value="discovered">Discovered</option>
						<option value="verified">Verified</option>
					</select>
					<select
						value={state.sortBy}
						onChange={(e) =>
							setState((prev) => ({
								...prev,
								sortBy: e.target.value as 'quality' | 'activity' | 'trust' | 'transfers' | 'name',
							}))
						}
						className="px-2 py-1 bg-gray-800 border border-gray-600 rounded"
					>
						<option value="quality">Quality</option>
						<option value="activity">Activity</option>
						<option value="trust">Trust</option>
						<option value="name">Name</option>
					</select>
				</div>
			</div>

			{/* Peer List Tabs */}
			<div className="flex-shrink-0 flex border-b border-gray-700">
				{(['connected', 'discovered', 'recent', 'groups'] as const).map((tab) => (
					<button
						key={tab}
						onClick={() => setActiveTab(tab)}
						className={`flex-1 px-3 py-2 text-xs capitalize transition-colors ${
							activeTab === tab
								? 'bg-[#094771] text-white border-b-2 border-blue-500'
								: 'hover:bg-gray-800'
						}`}
					>
						{tab}
						{tab !== 'groups' && (
							<span className="ml-1 text-gray-400">({state.peers[tab]?.length || 0})</span>
						)}
						{tab === 'groups' && (
							<span className="ml-1 text-gray-400">({state.groups.length})</span>
						)}
					</button>
				))}
			</div>

			{/* Peer List Content */}
			<div className="flex-1 overflow-y-auto">
				{filteredPeers().length === 0 ? (
					<div className="flex flex-col items-center justify-center h-full text-gray-500 text-xs">
						{activeTab === 'connected' && (
							<>
								<div className="text-2xl mb-2">🌐</div>
								<div>No connected peers</div>
								<div className="mt-1">
									{!state.transports.initialized
										? 'Initialize network to connect'
										: 'Click Discover to find peers'}
								</div>
								{!state.transports.initialized && (
									<button
										onClick={() => void checkTransportStatus()}
										disabled={isInitializing}
										className="mt-2 px-3 py-1 text-xs bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed text-white rounded transition-colors"
									>
										{isInitializing ? 'Initializing...' : 'Initialize Network'}
									</button>
								)}
							</>
						)}
						{activeTab === 'discovered' && (
							<>
								<div className="text-2xl mb-2">🔍</div>
								<div>No discovered peers</div>
								<div className="mt-1">
									{!state.transports.initialized
										? 'Initialize network first'
										: 'Try discovering peers'}
								</div>
								{state.transports.initialized && (
									<button
										onClick={() => void discoverPeers()}
										className="mt-2 px-3 py-1 text-xs bg-green-600 hover:bg-green-700 text-white rounded transition-colors"
									>
										Discover Peers
									</button>
								)}
							</>
						)}
						{activeTab === 'recent' && (
							<>
								<div className="text-2xl mb-2">🕒</div>
								<div>No recent peers</div>
								<div className="mt-1">Peers you connect to will appear here</div>
							</>
						)}
						{activeTab === 'groups' && (
							<>
								<div className="text-2xl mb-2">👥</div>
								<div>No groups</div>
								<div className="mt-1">Create groups for multi-party transfers</div>
							</>
						)}
					</div>
				) : (
					<div className="p-2 space-y-2">
						{filteredPeers().map((peer) => {
							const displayName = peer.displayName || 'Unknown Peer';
							const avatar = peer.avatar;
							const status = peer.status || 'offline';
							const availableTransports = peer.availableTransports || [];
							const identifiers = peer.identifiers || {};
							const transferHistory = peer.transferHistory || { sent: 0, received: 0 };
							const trustLevel = peer.trustLevel || 'unknown';

							return (
								<div
									key={peer.peerId}
									className="p-3 bg-[#2a2d2e] hover:bg-[#3c3c3c] rounded border border-gray-700 cursor-pointer transition-colors"
								>
									<div className="flex items-center justify-between">
										<div className="flex items-center gap-2 min-w-0">
											<div className="flex-shrink-0">
												{avatar ? (
													<img src={avatar} alt={displayName} className="w-8 h-8 rounded-full" />
												) : (
													<div className="w-8 h-8 bg-gray-600 rounded-full flex items-center justify-center text-xs">
														{displayName.charAt(0).toUpperCase()}
													</div>
												)}
											</div>
											<div className="min-w-0 flex-1">
												<div className="text-sm font-medium truncate">{displayName}</div>
												<div className="flex items-center gap-1 text-xs text-gray-400">
													<span className={getStatusColor(status)}>●</span>
													<span className="capitalize">{status}</span>
													{availableTransports.map((transport) => (
														<span key={transport} className="ml-1">
															{getTransportIcon(transport)}
														</span>
													))}
												</div>
											</div>
										</div>
										<div className="flex items-center gap-1">
											{activeTab === 'discovered' && (
												<button
													className="px-2 py-1 text-xs bg-blue-600 hover:bg-blue-700 rounded"
													title="Connect"
												>
													🔗
												</button>
											)}
											{activeTab === 'connected' && (
												<>
													<button
														className="px-2 py-1 text-xs bg-green-600 hover:bg-green-700 rounded"
														title="Send Document"
													>
														📄
													</button>
													<button
														className="px-2 py-1 text-xs bg-purple-600 hover:bg-purple-700 rounded"
														title="Send Message"
													>
														💬
													</button>
												</>
											)}
										</div>
									</div>
									{showDetails && (
										<div className="mt-2 pt-2 border-t border-gray-600 text-xs text-gray-400">
											<div>
												Trust: {trustLevel} • Transfers:{' '}
												{transferHistory.sent + transferHistory.received}
											</div>
											{Object.entries(identifiers).map(([type, id]) => (
												<div key={type} className="truncate">
													{type}: {id}
												</div>
											))}
										</div>
									)}
								</div>
							);
						})}
					</div>
				)}
			</div>

			{/* Active Transfers Status */}
			{state.transfers.active.length > 0 && (
				<div className="flex-shrink-0 border-t border-gray-700 p-3">
					<div className="flex items-center justify-between mb-2">
						<div className="text-xs font-semibold">Active Transfers</div>
						<div className="text-xs text-gray-400">{state.transfers.active.length} active</div>
					</div>
					<div className="space-y-1 max-h-20 overflow-y-auto">
						{state.transfers.active.slice(0, 3).map((transfer) => (
							<div key={transfer.transferId} className="flex items-center gap-2 text-xs">
								<div className={`w-2 h-2 rounded-full ${getStatusColor(transfer.status)}`} />
								<span className="flex-1 truncate">{transfer.peerId}</span>
								<span className="text-gray-400">{transfer.progress}%</span>
							</div>
						))}
						{state.transfers.active.length > 3 && (
							<div className="text-xs text-gray-500 text-center">
								+{state.transfers.active.length - 3} more
							</div>
						)}
					</div>
				</div>
			)}

			{/* WebSocket Status Indicator */}
			{wsConnected && (
				<div
					className="absolute top-2 right-2 w-2 h-2 bg-green-500 rounded-full animate-pulse"
					title="Real-time connection active"
				/>
			)}
		</div>
	);
};

export default PeerExplorer;
