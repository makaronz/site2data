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
  | 'CHECKLISTA PRODUKCYJNA'
  | 'EKSTRA'
  | 'GRAF RELACJI';

export interface WebSocketMessage {
  type: string;
  message?: string;
  result?: AnalysisResult;
  script?: File;
}

// Typy strukturalne rozszerzonego modelu danych
export type SceneIntExtType = 'INT' | 'EXT' | null;
export type SceneDayTimeType = 'DAY' | 'NIGHT' | 'DUSK' | 'DAWN' | 'OTHER' | null;
export type SceneEstimatedLengthType = 'short' | 'medium' | 'long' | null;
export type SceneTagType = 'dramatic' | 'animals' | 'technical' | 'stunt' | 'vfx' | string;
export type RiskTagType = 'child' | 'animal' | 'weapon' | 'effect' | 'stunt' | string;

export interface ProductionChecklist {
  has_risk?: boolean;
  has_children?: boolean;
  needs_permit?: boolean;
  has_animals?: boolean;
  is_night_scene?: boolean;
}

export interface LightingInfo {
  variant?: 'day_natural' | 'evening_natural' | 'night_natural' | 'artificial' | 'mixed' | null;
  needs_extra_sources?: boolean;
  extra_sources_details?: string;
  emotional_note?: string;
}

export interface SceneStructure {
  scene_id: string;
  title?: string;
  description?: string;
  int_ext?: SceneIntExtType;
  location?: string;
  day_time?: SceneDayTimeType;
  characters?: string[];
  props?: string[];
  vehicles?: string[];
  weapons?: string[];
  estimated_length?: SceneEstimatedLengthType;
  scene_tags?: SceneTagType[];
  risk_tags?: RiskTagType[];
  lighting_info?: LightingInfo;
  production_checklist?: ProductionChecklist;
  page_number?: number;
}

export interface CharacterDetail {
  character: string;
  role: string;
  description?: string;
  character_arc_notes?: string;
  scenes_list?: string[]; // Lista ID scen, w których występuje postać
  relationships?: { character: string; relationship_type: string; description?: string }[];
  special_skills?: { skill: string; scene_id: string }[];
}

export interface LocationDetail {
  name: string;
  description?: string;
  type?: 'interior' | 'exterior' | 'interior_exterior' | 'other' | null;
  scenes_list?: string[]; // Lista ID scen, które odbywają się w tej lokacji
  address_details?: string;
  technical_requirements?: string;
  logistic_notes?: string;
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
    locations_details?: LocationDetail[]; // Rozszerzone informacje o lokacjach
  };
  roles?: {
    roles?: { character: string; role: string }[];
    characters_details?: CharacterDetail[]; // Rozszerzone informacje o postaciach
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
  production_checklist?: {
    scenes?: SceneStructure[]; // Lista scen z checklistami produkcyjnymi
    summary?: {
      total_scenes?: number;
      risk_scenes?: number;
      children_scenes?: number;
      animals_scenes?: number;
      permit_scenes?: number;
      night_scenes?: number;
    };
  };
  scenes_structure?: {
    scenes?: SceneStructure[]; // Struktura wszystkich scen z rozszerzonymi informacjami
  };
  relationships?: {
    character_relationships?: { source: string; target: string; relationship: string }[];
    location_scenes?: { location: string; scenes: string[] }[];
  };
}

export interface AnalysisProgress {
  stage: 'uploading' | 'processing' | 'complete' | 'queued';
  progress: number;
  message: string;
} 