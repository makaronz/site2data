import { WebSocket } from 'ws';

// WebSocket client type with additional properties
export interface WebSocketClient extends WebSocket {
  id?: string;
  isAlive?: boolean;
  _socket: any;
}

// Local type definitions for WebSocket messages
export interface WebSocketMessage {
  type: string;
  message?: string;
  [key: string]: any;
}

export interface AnalysisProgress {
  progress: number;
  stage: string;
  elapsedTime?: number;
}

export interface AnalysisResult {
  [key: string]: any;
}

export interface WebSocketAuthPayload {
  token: string;
}
