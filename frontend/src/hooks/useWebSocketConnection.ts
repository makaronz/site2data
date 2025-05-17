import { useCallback, useEffect, useRef } from 'react';

/**
 * Custom hook for managing WebSocket connections with automatic reconnection
 * @param url WebSocket URL to connect to
 * @param options Configuration options
 * @returns WebSocket instance and connection status
 */
export const useWebSocketConnection = (
  url: string,
  options: {
    reconnectInterval?: number;
    maxReconnectAttempts?: number;
    onOpen?: (event: Event) => void;
    onMessage?: (event: MessageEvent) => void;
    onClose?: (event: CloseEvent) => void;
    onError?: (event: Event) => void;
    protocols?: string | string[];
    autoConnect?: boolean;
    authToken?: string;
  } = {}
) => {
  const {
    reconnectInterval = 3000,
    maxReconnectAttempts = 5,
    onOpen,
    onMessage,
    onClose,
    onError,
    protocols,
    autoConnect = true,
    authToken
  } = options;

  const wsRef = useRef<WebSocket | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const connectedRef = useRef(false);

  const connect = useCallback(() => {
    // Clean up existing connection if any
    if (wsRef.current) {
      wsRef.current.close();
    }

    try {
      wsRef.current = new WebSocket(url, protocols);

      wsRef.current.onopen = (event) => {
        connectedRef.current = true;
        reconnectAttemptsRef.current = 0;
        
        // Send authentication if token is provided
        if (authToken) {
          wsRef.current?.send(JSON.stringify({
            type: 'AUTH',
            token: authToken
          }));
        }
        
        if (onOpen) onOpen(event);
      };

      wsRef.current.onmessage = (event) => {
        if (onMessage) onMessage(event);
      };

      wsRef.current.onclose = (event) => {
        connectedRef.current = false;
        
        if (onClose) onClose(event);

        // Attempt reconnection if not closed cleanly
        if (!event.wasClean && reconnectAttemptsRef.current < maxReconnectAttempts) {
          reconnectTimeoutRef.current = setTimeout(() => {
            reconnectAttemptsRef.current += 1;
            connect();
          }, reconnectInterval);
        }
      };

      wsRef.current.onerror = (event) => {
        if (onError) onError(event);
      };
    } catch (error) {
      console.error('WebSocket connection error:', error);
      if (onError) onError(new Event('error'));
    }
  }, [url, protocols, reconnectInterval, maxReconnectAttempts, onOpen, onMessage, onClose, onError, authToken]);

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    
    connectedRef.current = false;
  }, []);

  const send = useCallback((data: string | ArrayBufferLike | Blob | ArrayBufferView) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(data);
      return true;
    }
    return false;
  }, []);

  // Connect on mount if autoConnect is true
  useEffect(() => {
    if (autoConnect) {
      connect();
    }

    // Clean up on unmount
    return () => {
      disconnect();
    };
  }, [connect, disconnect, autoConnect]);

  return {
    socket: wsRef.current,
    connect,
    disconnect,
    send,
    isConnected: connectedRef.current,
    reconnectAttempts: reconnectAttemptsRef.current
  };
};
