import React, { useState, useEffect } from 'react';
import { TransportStatus } from './types';
import { formatTransportName, getTransportIcon, getStatusColor, formatBytes, formatLatency } from './utils';

interface TransportStatusBarProps {
	transports: TransportStatus[];
	compact?: boolean;
	showMetrics?: boolean;
	onTransportClick?: (transport: TransportStatus) => void;
	className?: string;
}

const TransportStatusBar: React.FC<TransportStatusBarProps> = ({
	transports,
	compact = false,
	showMetrics = true,
	onTransportClick,
	className = '',
}) => {
	const [selectedTransport, setSelectedTransport] = useState<string | null>(null);
	const [animatingTransports, setAnimatingTransports] = useState<Set<string>>(new Set());

	// Animate status changes
	useEffect(() => {
		const newAnimating = new Set<string>();
		transports.forEach((transport) => {
			if (transport.status === 'connecting' || transport.status === 'active') {
				newAnimating.add(transport.type);
			}
		});
		setAnimatingTransports(newAnimating);
	}, [transports]);

	const handleTransportClick = (transport: TransportStatus) => {
		setSelectedTransport(selectedTransport === transport.type ? null : transport.type);
		onTransportClick?.(transport);
	};

	const getTransportPriority = (transport: TransportStatus): number => {
		// Priority order for display
		const priorities = {
			p2p: 1,
			email: 2,
			discord: 3,
			telegram: 4,
		};
		return priorities[transport.type as keyof typeof priorities] || 99;
	};

	const sortedTransports = [...transports].sort(
		(a, b) => getTransportPriority(a) - getTransportPriority(b),
	);

	if (compact) {
		return (
			<div className={`flex items-center gap-1 ${className}`}>
				{sortedTransports.map((transport) => (
					<button
						key={transport.type}
						onClick={() => handleTransportClick(transport)}
						className={`flex items-center gap-1 px-2 py-1 rounded text-xs transition-all duration-200 ${
							transport.status === 'active'
								? 'bg-green-900 hover:bg-green-800 text-green-200'
								: transport.status === 'error'
									? 'bg-red-900 hover:bg-red-800 text-red-200'
									: transport.status === 'connecting'
										? 'bg-yellow-900 hover:bg-yellow-800 text-yellow-200'
										: 'bg-gray-700 hover:bg-gray-600 text-gray-300'
						} ${animatingTransports.has(transport.type) ? 'animate-pulse' : ''}`}
						title={`${formatTransportName(transport.type)}: ${transport.status.toUpperCase()}`}
					>
						<span className="text-sm">{getTransportIcon(transport.type)}</span>
						<div className={`w-2 h-2 rounded-full ${getStatusColor(transport.status)}`} />
						{transport.connections > 0 && (
							<span className="text-xs font-medium">{transport.connections}</span>
						)}
					</button>
				))}
			</div>
		);
	}

	return (
		<div className={`space-y-2 ${className}`}>
			{/* Transport Overview */}
			<div className="flex items-center justify-between">
				<span className="text-xs font-medium text-gray-300">Transport Status</span>
				<span className="text-xs text-gray-500">
					{transports.filter((t) => t.status === 'active').length} of {transports.length}{' '}
					active
				</span>
			</div>

			{/* Transport Cards */}
			<div className="space-y-2">
				{sortedTransports.map((transport) => (
					<div key={transport.type} className="space-y-1">
						<button
							onClick={() => handleTransportClick(transport)}
							className={`w-full flex items-center justify-between p-2 rounded transition-all duration-200 ${
								selectedTransport === transport.type
									? 'bg-gray-700 border border-blue-500'
									: 'bg-gray-800 hover:bg-gray-750 border border-transparent'
							} ${animatingTransports.has(transport.type) ? 'animate-pulse' : ''}`}
						>
							<div className="flex items-center gap-2">
								<span className="text-sm">{getTransportIcon(transport.type)}</span>
								<span className="text-xs font-medium text-gray-200">
									{formatTransportName(transport.type)}
								</span>
								<div
									className={`w-2 h-2 rounded-full ${getStatusColor(transport.status)}`}
								/>
								<span
									className={`px-2 py-0.5 rounded text-xs font-medium ${
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

							<div className="flex items-center gap-2 text-xs text-gray-400">
								{transport.connections > 0 && (
									<span>
										{transport.connections} conn
										{transport.connections !== 1 ? 's' : ''}
									</span>
								)}
								{selectedTransport === transport.type ? '▼' : '▶'}
							</div>
						</button>

						{/* Detailed Metrics */}
						{selectedTransport === transport.type && showMetrics && (
							<div className="ml-4 p-2 bg-gray-850 rounded border border-gray-600">
								<div className="grid grid-cols-2 gap-2 text-xs">
									{transport.metrics?.latency !== undefined && (
										<div>
											<span className="text-gray-400">Latency:</span>
											<span className="ml-1 text-gray-200">
												{formatLatency(transport.metrics.latency)}
											</span>
										</div>
									)}

									{transport.metrics?.bandwidth && (
										<>
											<div>
												<span className="text-gray-400">↓ In:</span>
												<span className="ml-1 text-green-400">
													{formatBytes(transport.metrics.bandwidth.in)}/s
												</span>
											</div>
											<div>
												<span className="text-gray-400">↑ Out:</span>
												<span className="ml-1 text-blue-400">
													{formatBytes(transport.metrics.bandwidth.out)}/s
												</span>
											</div>
										</>
									)}

									{transport.metrics?.queue && (
										<>
											<div>
												<span className="text-gray-400">Pending:</span>
												<span className="ml-1 text-yellow-400">
													{transport.metrics.queue.pending}
												</span>
											</div>
											<div>
												<span className="text-gray-400">Processing:</span>
												<span className="ml-1 text-blue-400">
													{transport.metrics.queue.processing}
												</span>
											</div>
										</>
									)}

									{transport.metrics?.uptime !== undefined && (
										<div className="col-span-2">
											<span className="text-gray-400">Uptime:</span>
											<span className="ml-1 text-gray-200">
												{Math.floor(transport.metrics.uptime / 3600)}h{' '}
												{Math.floor((transport.metrics.uptime % 3600) / 60)}m
											</span>
										</div>
									)}
								</div>

								{transport.error && (
									<div className="mt-2 pt-2 border-t border-gray-600">
										<div className="text-xs text-red-400 font-medium mb-1">
											Error:
										</div>
										<div
											className="text-xs text-red-300 bg-red-900/20 p-1 rounded"
											title={transport.error}
										>
											{transport.error}
										</div>
									</div>
								)}

								{transport.config && (
									<div className="mt-2 pt-2 border-t border-gray-600">
										<div className="text-xs text-gray-400 font-medium mb-1">
											Config:
										</div>
										<div className="text-xs text-gray-300 space-y-1">
											{Object.entries(transport.config).map(([key, value]) => (
												<div key={key} className="flex justify-between">
													<span className="text-gray-400">
														{key}:
													</span>
													<span className="text-gray-200 ml-2 truncate max-w-24">
														{typeof value === 'object' && value !== null
															? JSON.stringify(value)
															: String(value)}
													</span>
												</div>
											))}
										</div>
									</div>
								)}
							</div>
						)}
					</div>
				))}
			</div>

			{/* Health Summary */}
			{transports.length > 0 && (
				<div className="pt-2 border-t border-gray-700">
					<div className="flex justify-between items-center text-xs">
						<span className="text-gray-400">Network Health:</span>
						<div className="flex items-center gap-1">
							{transports.every((t) => t.status === 'active') ? (
								<>
									<span className="w-2 h-2 bg-green-500 rounded-full" />
									<span className="text-green-400">Excellent</span>
								</>
							) : transports.some((t) => t.status === 'active') ? (
								<>
									<span className="w-2 h-2 bg-yellow-500 rounded-full" />
									<span className="text-yellow-400">Partial</span>
								</>
							) : (
								<>
									<span className="w-2 h-2 bg-red-500 rounded-full" />
									<span className="text-red-400">Offline</span>
								</>
							)}
						</div>
					</div>
				</div>
			)}
		</div>
	);
};

export default TransportStatusBar;