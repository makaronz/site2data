import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import {
  WebSocketMessage,
  WebSocketMessageSchema,
} from '../schemas';

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
      const wsUrl = authToken ? `${url}?token=${authToken}` : url;
      wsRef.current = new WebSocket(wsUrl);
      
      wsRef.current.onopen = () => {
        setConnected(true);
        setConnectionStatus('connected');
        reconnectAttemptsRef.current = 0;
        
        // TODO: Po udanym połączeniu, można wysłać wiadomość subskrypcji dla konkretnego jobId, jeśli jest znany
        // np. sendMessage({ type: 'SUBSCRIBE_JOB', jobId: 'aktualnyJobId' } as any ); 
        // To wymaga zdefiniowania odpowiedniego schematu dla wiadomości SUBSCRIBE_JOB w lokalnych schematach
      };
      
      wsRef.current.onmessage = (event) => {
        try {
          const rawMessage = JSON.parse(event.data as string);
          const validationResult = WebSocketMessageSchema.safeParse(rawMessage);
          
          if (validationResult.success) {
            setLastMessage(validationResult.data);
          } else {
            console.error('Failed to parse or validate WebSocket message:', validationResult.error);
          }
        } catch (err) {
          console.error('Error processing WebSocket message data:', err);
        }
      };
      
      wsRef.current.onclose = () => {
        setConnected(false);
        setConnectionStatus('disconnected');
        
        if (reconnectAttemptsRef.current < maxReconnectAttempts) {
          reconnectTimeoutRef.current = setTimeout(() => {
            reconnectAttemptsRef.current += 1;
            connect();
          }, reconnectInterval);
        }
      };
      
      wsRef.current.onerror = (event: Event) => {
        console.error('WebSocket error:', event);
        const genericError = new Error('WebSocket connection error');
        setError(genericError);
        setConnectionStatus('error');
      };
    } catch (err) {
      const errorToSet = err instanceof Error ? err : new Error('Failed to connect WebSocket');
      setError(errorToSet);
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
    }
  };
  
  useEffect(() => {
    connect();
    
    return () => {
      disconnect();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [url, authToken]);
  
  return (
    <WebSocketContext.Provider value={{ connected, sendMessage, lastMessage, connectionStatus, error }}>
      {children}
    </WebSocketContext.Provider>
  );
};

export const useWebSocket = () => useContext(WebSocketContext);
