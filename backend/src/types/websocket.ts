import { WebSocket } from 'ws';

export interface WebSocketClient extends WebSocket {
  id: string;
  isAlive: boolean;
  _socket: {
    remoteAddress: string;
  };
  ping(): void;
  pong(): void;
  terminate(): void;
  close(code?: number, reason?: string): void;
  on(event: string, listener: (...args: any[]) => void): this;
  send(data: string): void;
}

// Osobne typy wiadomości
export interface AnalyzeScriptMessage {
  type: 'ANALYZE_SCRIPT';
  script: Buffer;
}

export interface ProgressMessage {
  type: 'PROGRESS';
  stage: 'uploading' | 'processing' | 'analyzing' | 'complete';
  progress: number;
  message: string;
}

export interface AnalysisResultMessage {
  type: 'ANALYSIS_RESULT';
  result?: AnalysisResult;
}

export interface ErrorMessage {
  type: 'ERROR';
  message: string;
}

// Union wszystkich typów wiadomości
export type AllWebSocketMessages =
  | AnalyzeScriptMessage
  | ProgressMessage
  | AnalysisResultMessage
  | ErrorMessage;

// Stare typy (dla kompatybilności)
export interface WebSocketMessage {
  type: 'ANALYZE_SCRIPT' | 'PROGRESS' | 'ANALYSIS_RESULT' | 'ERROR';
  message?: string;
  result?: any;
  script?: Buffer;
}

export interface AnalysisProgress {
  stage: 'uploading' | 'processing' | 'analyzing' | 'complete';
  progress: number;
  message: string;
}

export interface AnalysisResult {
  analysis: {
    metadata: {
      title: string;
      authors: string[];
      detected_language: string;
      scene_count: number;
      token_count: number;
      analysis_timestamp: string;
    };
    overall_summary: string;
  };
} 