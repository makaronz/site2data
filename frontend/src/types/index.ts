export type AnalysisSection =
  | 'METADANE PRODUKCJI'
  | 'STRUKTURA SCEN'
  | 'POSTACI'
  | 'LOKACJE'
  | 'REKWIZYTY'
  | 'POJAZDY'
  | 'BROŃ'
  | 'OŚWIETLENIE'
  | 'TRUDNE SCENY'
  | 'POZWOLENIA'
  | 'SPRZĘT SPECJALNY'
  | 'RYZYKA PRODUKCYJNE'
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
  analysis?: {
    script_name?: string;
    author?: string;
    number_of_scenes?: number;
    number_of_characters?: number;
    locations?: string[];
    time_periods?: string[];
    major_themes?: string[];
    critical_scenes?: { scene_id: string; description: string }[];
  };
  locations?: {
    locations?: string[];
  };
  roles?: {
    roles?: { character: string; role: string }[];
  };
  props?: {
    global_props?: string[];
    scene_props?: Record<string, string[]>;
  };
  vehicles?: {
    global_vehicles?: string[];
    scene_vehicles?: Record<string, string[]>;
  };
  weapons?: {
    global_weapons?: string[];
    scene_weapons?: Record<string, string[]>;
  };
  fx?: {
    special_effects?: string[];
  };
  difficult_scenes?: {
    difficult_scenes?: { scene_id: string; reason: string; gear_needed?: string[] }[];
  };
  permits?: {
    permits_needed?: { scene_id: string; permit_type: string; reason: string }[];
  };
  special_gear?: {
    camera_gear?: { scene_id: string; gear: string[] }[];
  };
  lighting_schemes?: {
    lighting?: { scene_id: string; style: string }[];
  };
  cast_skills?: {
    special_skills?: { character: string; skill: string; scene_id: string }[];
  };
  production_risks?: {
    risks?: { scene_id: string; risk_type: string; mitigation: string }[];
  };
}

export interface AnalysisProgress {
  stage: 'uploading' | 'processing' | 'complete' | 'queued';
  progress: number;
  message: string;
} 