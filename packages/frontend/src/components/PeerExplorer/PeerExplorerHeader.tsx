import React, { useState } from 'react';
import { TransportStatus, TRANSPORT_TYPES } from './types';
import { formatTransportName, getTransportIcon, getStatusColor } from './utils';

interface PeerExplorerHeaderProps {
	transports: TransportStatus[];
	initialized: boolean;
	networkStatus: 'disconnected' | 'connecting' | 'connected' | 'partial';
	onInitialize: () => void;
	onSettings: () => void;
	onRefresh: () => void;
	isInitializing?: boolean;
	className?: string;
}

const PeerExplorerHeader: React.FC<PeerExplorerHeaderProps> = ({
	transports,
	initialized,
	networkStatus,
	onInitialize,
	onSettings,
	onRefresh,
	isInitializing = false,
	className = '',
}) => {
	const [showTransportDetails, setShowTransportDetails] = useState(false);

	const getNetworkStatusIcon = (): string => {
		switch (networkStatus) {
			case 'connected':
				return '🟢';
			case 'partial':
				return '🟡';
			case 'connecting':
				return '🔄';
			case 'disconnected':
			default:
				return '🔴';
		}
	};

	const getNetworkStatusText = (): string => {
		switch (networkStatus) {
			case 'connected':
				return 'Connected';
			case 'partial':
				return 'Partial';
			case 'connecting':
				return 'Connecting';
			case 'disconnected':
			default:
				return 'Disconnected';
		}
	};

	const activeTransports = transports.filter((t) => t.status === 'active');
	const errorTransports = transports.filter((t) => t.status === 'error');
	const totalConnections = transports.reduce((sum, t) => sum + (t.connections || 0), 0);

	return (
		<div className={`flex flex-col ${className}`}>
			{/* Main Header Row */}
			<div className="flex items-center justify-between p-3 border-b border-gray-700">
				<div className="flex items-center gap-3">
					<h2 className="text-sm font-semibold text-[#cccccc]">Network Peers</h2>
					<div className="flex items-center gap-1 text-xs">
						<span className="text-lg">{getNetworkStatusIcon()}</span>
						<span className={`${getStatusColor(networkStatus)} font-medium`}>
							{getNetworkStatusText()}
						</span>
					</div>
				</div>

				<div className="flex items-center gap-1">
					{!initialized && (
						<button
							onClick={onInitialize}
							disabled={isInitializing}
							className="px-2 py-1 text-xs bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed rounded transition-colors"
							title="Initialize Network"
						>
							{isInitializing ? '⏳' : '🚀'}
						</button>
					)}
					{initialized && (
						<button
							onClick={onRefresh}
							className="px-2 py-1 text-xs bg-green-600 hover:bg-green-700 rounded transition-colors"
							title="Refresh Network"
						>
							🔄
						</button>
					)}
					<button
						onClick={onSettings}
						className="px-2 py-1 text-xs bg-gray-600 hover:bg-gray-700 rounded transition-colors"
						title="Network Settings"
					>
						⚙️
					</button>
					<button
						onClick={() => setShowTransportDetails(!showTransportDetails)}
						className="px-2 py-1 text-xs bg-purple-600 hover:bg-purple-700 rounded transition-colors"
						title="Transport Details"
					>
						{showTransportDetails ? '📊' : '📈'}
					</button>
				</div>
			</div>

			{/* Network Summary */}
			{initialized && (
				<div className="px-3 py-2 bg-gray-800 border-b border-gray-700">
					<div className="flex items-center justify-between text-xs text-gray-300">
						<div className="flex items-center gap-4">
							<span>
								{activeTransports.length}/{transports.length} Transports Active
							</span>
							{totalConnections > 0 && <span>{totalConnections} Connections</span>}
							{errorTransports.length > 0 && (
								<span className="text-red-400">{errorTransports.length} Errors</span>
							)}
						</div>
						<div className="flex items-center gap-1">
							{Object.values(TRANSPORT_TYPES).map((transportType) => {
								const transport = transports.find((t) => t.type === transportType);
								if (!transport) return null;

								return (
									<div
										key={transportType}
										className="flex items-center gap-1 px-2 py-1 bg-gray-700 rounded"
										title={`${formatTransportName(
											transportType,
										)}: ${transport.status.toUpperCase()}`}
									>
										<span className="text-xs">
											{getTransportIcon(transportType)}
										</span>
										<span className={`w-2 h-2 rounded-full ${getStatusColor(transport.status)}`} />
									</div>
								);
							})}
						</div>
					</div>
				</div>
			)}

			{/* Detailed Transport Status */}
			{showTransportDetails && initialized && (
				<div className="px-3 py-2 bg-gray-850 border-b border-gray-700">
					<div className="space-y-2">
						{transports.map((transport) => (
							<div
								key={transport.type}
								className="flex items-center justify-between text-xs"
							>
								<div className="flex items-center gap-2">
									<span className="text-sm">
										{getTransportIcon(transport.type)}
									</span>
									<span className="font-medium text-gray-200">
										{formatTransportName(transport.type)}
									</span>
									<span
										className={`px-2 py-1 rounded text-xs font-medium ${
											transport.status === 'active'
												? 'bg-green-900 text-green-200'
												: transport.status === 'error'
													? 'bg-red-900 text-red-200'
													: transport.status === 'connecting'
														? 'bg-yellow-900 text-yellow-200'
														: 'bg-gray-700 text-gray-300'
										}`}
									>
										{transport.status.toUpperCase()}
									</span>
								</div>

								<div className="flex items-center gap-3 text-gray-400">
									{transport.connections !== undefined && (
										<span>
											{transport.connections} conn
											{transport.connections !== 1 ? 's' : ''}
										</span>
									)}
									{transport.metrics?.latency !== undefined && (
										<span>{Math.round(transport.metrics.latency)}ms</span>
									)}
									{transport.metrics?.bandwidth && (
										<span>
											{Math.round(transport.metrics.bandwidth.in / 1024)}↓/
											{Math.round(transport.metrics.bandwidth.out / 1024)}↑ KB/s
										</span>
									)}
									{transport.metrics?.queue && (
										<span>
											Q:{transport.metrics.queue.pending}/
											{transport.metrics.queue.processing}
										</span>
									)}
								</div>
							</div>
						))}
					</div>

					{transports.some((t) => t.error) && (
						<div className="mt-2 pt-2 border-t border-gray-600">
							<div className="text-xs text-red-400 font-medium mb-1">Errors:</div>
							{transports
								.filter((t) => t.error)
								.map((transport) => (
									<div
										key={transport.type}
										className="text-xs text-red-300 truncate"
										title={transport.error}
									>
										{formatTransportName(transport.type)}: {transport.error}
									</div>
								))}
						</div>
					)}
				</div>
			)}

			{/* Initialization Prompt */}
			{!initialized && (
				<div className="px-3 py-4 text-center text-gray-400 border-b border-gray-700">
					<div className="text-xs mb-2">Network not initialized</div>
					<button
						onClick={onInitialize}
						disabled={isInitializing}
						className="px-3 py-1 text-xs bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed text-white rounded transition-colors"
					>
						{isInitializing ? 'Initializing...' : 'Initialize Network'}
					</button>
				</div>
			)}
		</div>
	);
};

export default PeerExplorerHeader;