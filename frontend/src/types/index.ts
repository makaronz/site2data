export type AnalysisSection =
  | 'METADANE PRODUKCJI'
  | 'STRUKTURA SCEN'
  | 'POSTACI'
  | 'RELACJE'
  | 'TEMATY I KLASTERY'
  | 'ZASOBY PRODUKCYJNE'
  | 'PACING & STATYSTYKI'
  | 'TECHNICZNE'
  | 'BUDŻETOWE CZERWONE FLAGI'
  | 'EKSTRA'
  | 'GRAF RELACJI';

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