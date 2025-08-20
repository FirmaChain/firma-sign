import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
	WebSocketEvent,
	PeerStatusEvent,
	PeerDiscoveredEvent,
	MessageReceivedEvent,
	TransferReceivedEvent,
	TransportStatusEvent,
} from '../types';

interface WebSocketConnectionOptions {
	url?: string;
	reconnectInterval?: number;
	maxReconnectAttempts?: number;
	enableHeartbeat?: boolean;
	heartbeatInterval?: number;
}

interface WebSocketConnectionState {
	isConnected: boolean;
	isConnecting: boolean;
	error: string | null;
	reconnectAttempts: number;
	lastConnected: Date | null;
}

interface WebSocketEventHandlers {
	onPeerStatus?: (event: PeerStatusEvent) => void;
	onPeerDiscovered?: (event: PeerDiscoveredEvent) => void;
	onMessageReceived?: (event: MessageReceivedEvent) => void;
	onTransferReceived?: (event: TransferReceivedEvent) => void;
	onTransportStatus?: (event: TransportStatusEvent) => void;
	onConnect?: () => void;
	onDisconnect?: () => void;
	onError?: (error: Event) => void;
}

const DEFAULT_OPTIONS: Required<WebSocketConnectionOptions> = {
	url: 'ws://localhost:8080/explorer',
	reconnectInterval: 3000,
	maxReconnectAttempts: 10,
	enableHeartbeat: true,
	heartbeatInterval: 30000,
};

export const useWebSocketConnection = (
	options: WebSocketConnectionOptions = {},
	handlers: WebSocketEventHandlers = {},
) => {
	const config = useMemo(() => ({ ...DEFAULT_OPTIONS, ...options }), [options]);
	const wsRef = useRef<WebSocket | null>(null);
	const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
	const heartbeatTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
	const isManuallyClosedRef = useRef(false);

	const [state, setState] = useState<WebSocketConnectionState>({
		isConnected: false,
		isConnecting: false,
		error: null,
		reconnectAttempts: 0,
		lastConnected: null,
	});

	const cleanup = useCallback(() => {
		if (reconnectTimeoutRef.current) {
			clearTimeout(reconnectTimeoutRef.current);
			reconnectTimeoutRef.current = null;
		}
		if (heartbeatTimeoutRef.current) {
			clearTimeout(heartbeatTimeoutRef.current);
			heartbeatTimeoutRef.current = null;
		}
	}, []);

	const startHeartbeat = useCallback(() => {
		if (!config.enableHeartbeat) return;

		heartbeatTimeoutRef.current = setTimeout(() => {
			if (wsRef.current?.readyState === WebSocket.OPEN) {
				wsRef.current.send(JSON.stringify({ type: 'ping' }));
				startHeartbeat(); // Schedule next heartbeat
			}
		}, config.heartbeatInterval);
	}, [config.enableHeartbeat, config.heartbeatInterval]);

	const handleMessage = useCallback(
		(event: MessageEvent) => {
			try {
				const data: WebSocketEvent = JSON.parse(event.data as string) as WebSocketEvent;

				switch (data.type) {
					case 'peer:status':
						handlers.onPeerStatus?.(data as PeerStatusEvent);
						break;
					case 'peer:discovered':
						handlers.onPeerDiscovered?.(data as PeerDiscoveredEvent);
						break;
					case 'message:received':
						handlers.onMessageReceived?.(data as MessageReceivedEvent);
						break;
					case 'transfer:received':
						handlers.onTransferReceived?.(data as TransferReceivedEvent);
						break;
					case 'transport:status':
						handlers.onTransportStatus?.(data as TransportStatusEvent);
						break;
					case 'pong':
						// Heartbeat response, connection is alive
						break;
					default:
						console.warn('Unknown WebSocket event type:', data.type);
				}
			} catch (error) {
				console.error('Failed to parse WebSocket message:', error);
			}
		},
		[handlers],
	);

	const connect = useCallback(() => {
		if (wsRef.current?.readyState === WebSocket.OPEN || state.isConnecting) {
			return;
		}

		setState((prev) => ({
			...prev,
			isConnecting: true,
			error: null,
		}));

		try {
			const ws = new WebSocket(config.url);
			wsRef.current = ws;

			ws.onopen = () => {
				setState((prev) => ({
					...prev,
					isConnected: true,
					isConnecting: false,
					reconnectAttempts: 0,
					lastConnected: new Date(),
					error: null,
				}));

				startHeartbeat();
				handlers.onConnect?.();
			};

			ws.onmessage = handleMessage;

			ws.onclose = (event) => {
				setState((prev) => ({
					...prev,
					isConnected: false,
					isConnecting: false,
				}));

				cleanup();
				handlers.onDisconnect?.();

				// Attempt reconnection if not manually closed
				if (!isManuallyClosedRef.current && !event.wasClean) {
					setState((prev) => {
						const newAttempts = prev.reconnectAttempts + 1;
						if (newAttempts < config.maxReconnectAttempts) {
							reconnectTimeoutRef.current = setTimeout(
								() => connect(),
								config.reconnectInterval,
							);
						} else {
							return {
								...prev,
								error: 'Max reconnection attempts reached',
							};
						}
						return {
							...prev,
							reconnectAttempts: newAttempts,
						};
					});
				}
			};

			ws.onerror = (event) => {
				setState((prev) => ({
					...prev,
					isConnecting: false,
					error: 'WebSocket connection error',
				}));

				handlers.onError?.(event);
			};
		} catch (error) {
			setState((prev) => ({
				...prev,
				isConnecting: false,
				error: error instanceof Error ? error.message : 'Connection failed',
			}));
		}
	}, [config, handleMessage, startHeartbeat, cleanup, handlers, state.isConnecting]);

	const disconnect = useCallback(() => {
		isManuallyClosedRef.current = true;
		cleanup();

		if (wsRef.current) {
			wsRef.current.close(1000, 'Manual disconnect');
			wsRef.current = null;
		}

		setState((prev) => ({
			...prev,
			isConnected: false,
			isConnecting: false,
		}));
	}, [cleanup]);

	const send = useCallback((data: Record<string, unknown>) => {
		if (wsRef.current?.readyState === WebSocket.OPEN) {
			wsRef.current.send(JSON.stringify(data));
			return true;
		}
		return false;
	}, []);

	const subscribe = useCallback(
		(peerId: string) => {
			return send({
				type: 'subscribe',
				peerId,
			});
		},
		[send],
	);

	const unsubscribe = useCallback(
		(peerId: string) => {
			return send({
				type: 'unsubscribe',
				peerId,
			});
		},
		[send],
	);

	const joinGroup = useCallback(
		(groupId: string) => {
			return send({
				type: 'join_group',
				groupId,
			});
		},
		[send],
	);

	const sendMessage = useCallback(
		(peerId: string, content: string, transport?: string) => {
			return send({
				type: 'message',
				peerId,
				content,
				transport,
			});
		},
		[send],
	);

	// Auto-connect on mount
	useEffect(() => {
		isManuallyClosedRef.current = false;
		connect();

		return () => {
			isManuallyClosedRef.current = true;
			disconnect();
		};
	}, [connect, disconnect]);

	// Cleanup on unmount
	useEffect(() => {
		return cleanup;
	}, [cleanup]);

	return {
		// Connection state
		...state,

		// Connection methods
		connect,
		disconnect,
		send,

		// Convenience methods
		subscribe,
		unsubscribe,
		joinGroup,
		sendMessage,

		// WebSocket reference for advanced usage
		websocket: wsRef.current,
	};
};