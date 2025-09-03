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
	reconnectInterval: import.meta.env.DEV ? 1000 : 3000, // Faster reconnect in development
	maxReconnectAttempts: import.meta.env.DEV ? -1 : 10, // Infinite retries in development
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
	const isConnectingRef = useRef(false);
	const hasInitializedRef = useRef(false);

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
		isConnectingRef.current = false; // Reset connecting flag on cleanup
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
					case 'connected':
						// Server connection confirmation, ignore or handle if needed
						console.log('WebSocket connection confirmed by server');
						break;
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
					case 'error': {
						// Handle error events from the server
						const errorData = data as { type: string; message?: string; error?: string; code?: string };
						console.error('WebSocket server error:', errorData.message || errorData.error || 'Unknown error', errorData);
						break;
					}
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
		// Don't connect if manually closed
		if (isManuallyClosedRef.current) {
			return;
		}

		// Don't connect if already connected
		if (wsRef.current?.readyState === WebSocket.OPEN) {
			return;
		}

		// Use ref to check if already connecting without causing re-renders
		if (isConnectingRef.current) {
			return;
		}

		// Close any existing connection that might be in a connecting state
		if (wsRef.current && wsRef.current.readyState === WebSocket.CONNECTING) {
			wsRef.current.close();
		}

		isConnectingRef.current = true;
		setState((prev) => ({
			...prev,
			isConnecting: true,
			error: null,
		}));

		try {
			console.log('Attempting WebSocket connection to:', config.url);
			const ws = new WebSocket(config.url);
			wsRef.current = ws;

			ws.onopen = () => {
				console.log('WebSocket connection opened successfully');
				isConnectingRef.current = false; // Reset connecting flag
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
				console.log('WebSocket connection closed:', {
					code: event.code,
					reason: event.reason,
					wasClean: event.wasClean,
				});
				isConnectingRef.current = false; // Reset connecting flag
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
						const shouldRetry =
							config.maxReconnectAttempts < 0 || newAttempts < config.maxReconnectAttempts;

						if (shouldRetry) {
							reconnectTimeoutRef.current = setTimeout(() => connect(), config.reconnectInterval);
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
				console.log('WebSocket connection error:', event);
				isConnectingRef.current = false; // Reset connecting flag on error
				// Prevent infinite loops by checking if we're already in error state
				setState((prev) => {
					if (prev.error === 'WebSocket connection error' && !prev.isConnecting) {
						return prev; // No state change if already in error state
					}
					return {
						...prev,
						isConnecting: false,
						error: 'WebSocket connection error',
					};
				});

				// Only call error handler if provided
				if (handlers.onError) {
					handlers.onError(event);
				}
			};
		} catch (error) {
			isConnectingRef.current = false; // Reset connecting flag on error
			setState((prev) => ({
				...prev,
				isConnecting: false,
				error: error instanceof Error ? error.message : 'Connection failed',
			}));
		}
	}, [
		config.url,
		config.maxReconnectAttempts,
		config.reconnectInterval,
		handleMessage,
		startHeartbeat,
		cleanup,
		handlers,
	]);

	const disconnect = useCallback(() => {
		isManuallyClosedRef.current = true;
		cleanup();

		if (wsRef.current) {
			// Only close if the connection is not in CONNECTING state
			if (wsRef.current.readyState !== WebSocket.CONNECTING) {
				wsRef.current.close(1000, 'Manual disconnect');
			}
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

	// Store connect and disconnect in refs to avoid re-render issues
	const connectRef = useRef(connect);
	const disconnectRef = useRef(disconnect);

	useEffect(() => {
		connectRef.current = connect;
		disconnectRef.current = disconnect;
	});

	// Auto-connect on mount with delay to avoid React Strict Mode issues
	useEffect(() => {
		// Prevent multiple initializations in React Strict Mode
		if (hasInitializedRef.current) {
			return;
		}
		hasInitializedRef.current = true;

		isManuallyClosedRef.current = false;

		// Add a small delay to ensure the component is fully mounted
		const timeoutId = setTimeout(() => {
			connectRef.current();
		}, 100);

		return () => {
			clearTimeout(timeoutId);
			isManuallyClosedRef.current = true;
			disconnectRef.current();
		};
	}, []); // Empty dependencies to run only on mount/unmount

	// Cleanup is handled in the auto-connect useEffect's cleanup function

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
