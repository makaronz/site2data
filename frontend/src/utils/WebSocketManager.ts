import type { WebSocketMessage, AnalysisProgress, AnalysisResult } from '../types/websocket';

// Rozszerzamy typ WebSocketMessage o typ PING/PONG
type ExtendedWebSocketMessage = WebSocketMessage | { type: 'PING' } | { type: 'PONG' };

interface WebSocketManagerConfig {
  url: string;
  maxRetries?: number;
  retryDelay?: number;
  maxDelay?: number;
  onMessage?: (data: WebSocketMessage) => void;
  onError?: (error: Error) => void;
  onReconnect?: (attempt: number) => void;
  onClose?: () => void;
}

export class WebSocketManager {
  private ws: WebSocket | null = null;
  private readonly config: Required<WebSocketManagerConfig>;
  private retryCount = 0;
  private retryTimeout: NodeJS.Timeout | null = null;
  private isIntentionallyClosed = false;
  private messageQueue: ExtendedWebSocketMessage[] = [];
  private pingInterval: NodeJS.Timeout | null = null;
  private lastPongTime: number = Date.now();

  constructor(config: WebSocketManagerConfig) {
    this.config = {
      maxRetries: 5,
      retryDelay: 1000,
      maxDelay: 30000,
      onMessage: () => {},
      onError: () => {},
      onReconnect: () => {},
      onClose: () => {},
      ...config
    };
  }

  public connect(): void {
    try {
      this.ws = new WebSocket(this.config.url);
      this.setupEventListeners();
      this.startPingInterval();
    } catch (error) {
      this.handleError(error as Error);
    }
  }

  private setupEventListeners(): void {
    if (!this.ws) return;

    this.ws.onopen = () => {
      this.retryCount = 0;
      this.processMessageQueue();
    };

    this.ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data) as ExtendedWebSocketMessage;
        if (data.type === 'PONG') {
          this.lastPongTime = Date.now();
          return;
        }
        // Jeśli to nie PONG, to musi być standardowa wiadomość WebSocketMessage
        this.config.onMessage(data as WebSocketMessage);
      } catch (error) {
        this.handleError(new Error('Invalid message format'));
      }
    };

    this.ws.onerror = (event) => {
      this.handleError(new Error('WebSocket error'));
    };

    this.ws.onclose = () => {
      this.stopPingInterval();
      if (!this.isIntentionallyClosed) {
        this.attemptReconnect();
      }
      this.config.onClose();
    };
  }

  private handleError(error: Error): void {
    this.config.onError(error);
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.close();
    }
  }

  private attemptReconnect(): void {
    if (this.retryCount >= this.config.maxRetries) {
      this.handleError(new Error('Max reconnection attempts reached'));
      return;
    }

    const delay = Math.min(
      this.config.retryDelay * Math.pow(2, this.retryCount),
      this.config.maxDelay
    );

    this.retryTimeout = setTimeout(() => {
      this.retryCount++;
      this.config.onReconnect(this.retryCount);
      this.connect();
    }, delay);
  }

  private startPingInterval(): void {
    this.pingInterval = setInterval(() => {
      if (this.ws?.readyState === WebSocket.OPEN) {
        this.ws.send(JSON.stringify({ type: 'PING' }));
        
        // Sprawdź timeout dla ponga
        if (Date.now() - this.lastPongTime > 30000) {
          this.handleError(new Error('Ping timeout'));
          this.reconnect();
        }
      }
    }, 15000);
  }

  private stopPingInterval(): void {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }
  }

  public send(message: ExtendedWebSocketMessage): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    } else {
      this.messageQueue.push(message);
    }
  }

  private processMessageQueue(): void {
    while (this.messageQueue.length > 0) {
      const message = this.messageQueue.shift();
      if (message) {
        this.send(message);
      }
    }
  }

  public reconnect(): void {
    this.isIntentionallyClosed = false;
    if (this.ws) {
      this.ws.close();
    }
    this.connect();
  }

  public close(): void {
    this.isIntentionallyClosed = true;
    if (this.retryTimeout) {
      clearTimeout(this.retryTimeout);
    }
    this.stopPingInterval();
    if (this.ws) {
      this.ws.close();
    }
  }
} 