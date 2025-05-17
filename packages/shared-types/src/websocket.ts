/**
 * Shared WebSocket type definitions for frontend and backend
 */

export interface WebSocketMessage {
  type: 'ANALYZE_SCRIPT' | 'PROGRESS' | 'ANALYSIS_RESULT' | 'ERROR';
  message?: string;
  result?: AnalysisResult;
  script?: any; // File in frontend, Buffer in backend
}

export interface AnalysisProgress {
  stage: 'uploading' | 'processing' | 'analyzing' | 'complete' | 'error';
  progress: number;
  message: string;
  estimatedTimeRemaining?: number;
}

export interface AnalysisResult {
  metadata: {
    title: string;
    authors: string[];
    detected_language: string;
    scene_count: number;
    token_count: number;
    analysis_timestamp: string;
  };
  scenes?: any[];
  characters?: any[];
  relationships?: any[];
  topics?: any[];
  clusters?: any[];
  productionResources?: any[];
  technicalStats?: Record<string, any>;
  budgetFlags?: any[];
  overall_summary?: string;
  extra?: Record<string, any>;
}

export interface WebSocketAuthPayload {
  token: string;
  sessionId?: string;
}
