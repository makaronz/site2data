export type AnalysisSection =
  | 'Metadane produkcji'
  | 'Struktura scen'
  | 'Postaci'
  | 'Relacje'
  | 'Tematy i klastery'
  | 'Zasoby produkcyjne'
  | 'Pacing & statystyki techniczne'
  | 'Budżetowe czerwone flagi'
  | 'Ekstra'
  | 'Graf';

export interface WebSocketMessage {
  type: string;
  message?: string;
  result?: AnalysisResult;
  script?: File;
}

export interface AnalysisResult {
  metadata?: any;
  scenes?: any[];
  characters?: any[];
  relationships?: any[];
  topics?: any[];
  clusters?: any[];
  productionResources?: any[];
  technicalStats?: any;
  budgetFlags?: any[];
  extra?: any;
}

export interface AnalysisProgress {
  stage: 'uploading' | 'processing' | 'complete';
  progress: number;
  message: string;
} 