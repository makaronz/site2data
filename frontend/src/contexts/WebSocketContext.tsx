import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { WebSocketMessage } from 'shared-types';

interface WebSocketContextType {
  connected: boolean;
  sendMessage: (message: WebSocketMessage) => void;
  lastMessage: WebSocketMessage | null;
  connectionStatus: 'connecting' | 'connected' | 'disconnected' | 'error';
  error: Error | null;
}

const WebSocketContext = createContext<WebSocketContextType>({
  connected: false,
  sendMessage: () => {},
  lastMessage: null,
  connectionStatus: 'disconnected',
  error: null
});

interface WebSocketProviderProps {
  url: string;
  reconnectInterval?: number;
  maxReconnectAttempts?: number;
  children: React.ReactNode;
  authToken?: string;
}

export const WebSocketProvider: React.FC<WebSocketProviderProps> = ({
  url,
  reconnectInterval = 3000,
  maxReconnectAttempts = 5,
  children,
  authToken
}) => {
  const [connected, setConnected] = useState(false);
  const [lastMessage, setLastMessage] = useState<WebSocketMessage | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected' | 'error'>('disconnected');
  const [error, setError] = useState<Error | null>(null);
  
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const connect = () => {
    if (wsRef.current?.readyState === WebSocket.OPEN) return;
    
    try {
      setConnectionStatus('connecting');
      wsRef.current = new WebSocket(url);
      
      wsRef.current.onopen = () => {
        setConnected(true);
        setConnectionStatus('connected');
        reconnectAttemptsRef.current = 0;
        
        // Send authentication if token is provided
        if (authToken) {
          wsRef.current?.send(JSON.stringify({
            type: 'AUTH',
            token: authToken
          }));
        }
      };
      
      wsRef.current.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data) as WebSocketMessage;
          setLastMessage(message);
        } catch (err) {
          console.error('Failed to parse WebSocket message:', err);
        }
      };
      
      wsRef.current.onclose = () => {
        setConnected(false);
        setConnectionStatus('disconnected');
        
        // Attempt reconnection
        if (reconnectAttemptsRef.current < maxReconnectAttempts) {
          reconnectTimeoutRef.current = setTimeout(() => {
            reconnectAttemptsRef.current += 1;
            connect();
          }, reconnectInterval);
        }
      };
      
      wsRef.current.onerror = (err) => {
        setError(err as Error);
        setConnectionStatus('error');
      };
    } catch (err) {
      setError(err as Error);
      setConnectionStatus('error');
    }
  };
  
  const disconnect = () => {
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    
    setConnected(false);
    setConnectionStatus('disconnected');
  };
  
  const sendMessage = (message: WebSocketMessage) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(message));
    } else {
      console.error('WebSocket is not connected');
      // Optionally queue messages for when connection is established
    }
  };
  
  useEffect(() => {
    connect();
    
    return () => {
      disconnect();
    };
  }, [url, authToken]); // Reconnect if URL or auth token changes
  
  return (
    <WebSocketContext.Provider value={{ connected, sendMessage, lastMessage, connectionStatus, error }}>
      {children}
    </WebSocketContext.Provider>
  );
};

export const useWebSocket = () => useContext(WebSocketContext);
