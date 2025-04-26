export interface WebSocketMessage {
  type: 'ANALYZE_SCRIPT' | 'PROGRESS' | 'ANALYSIS_RESULT' | 'ERROR';
  message?: string;
  result?: AnalysisResult;
  script?: File;
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