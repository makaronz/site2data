import { EventEmitter } from 'events';
import OpenAI from 'openai';

interface AnalysisResult {
  analysis: {
    metadata: {
      title: string;
      authors: string[];
      detected_language: string;
      scene_count: number;
      token_count: number;
      analysis_timestamp: string;
    };
    scenes: Array<{
      id: string;
      location: string;
      time: string;
      characters: string[];
      summary: string;
      dominant_emotions: {
        joy: number;
        trust: number;
        fear: number;
        surprise: number;
        sadness: number;
        disgust: number;
        anger: number;
        anticipation: number;
      };
      narrative_importance: number;
    }>;
    characters: Array<{
      name: string;
      role: 'protagonist' | 'antagonist' | 'supporting' | 'other';
      description: string;
      emotional_profile: {
        joy: number;
        trust: number;
        fear: number;
        surprise: number;
        sadness: number;
        disgust: number;
        anger: number;
        anticipation: number;
      };
      centrality_score: number;
      arc_type: string;
    }>;
    relationships: Array<{
      character_a: string;
      character_b: string;
      strength: number;
      overall_sentiment: number;
      key_scenes: string[];
    }>;
    turning_points: Array<{
      scene_id: string;
      type: 'inciting' | 'midpoint' | 'climax' | 'resolution' | 'other';
      intensity: number;
      impact_summary: string;
    }>;
    themes: Array<{
      theme: string;
      relevance: number;
    }>;
    topic_clusters: Array<{
      topic: string;
      keywords: string[];
      frequency: number;
    }>;
    emotional_timeline: Array<{
      scene_id: string;
      valence: number;
      arousal: number;
    }>;
    overall_summary: string;
  };
  locations: string[];
  roles: Array<{
    character: string;
    role: string;
  }>;
  global_props: string[];
  scene_props: { [key: string]: string[] };
  global_vehicles: string[];
  scene_vehicles: { [key: string]: string[] };
  global_weapons: string[];
  scene_weapons: { [key: string]: string[] };
  special_effects: string[];
  difficult_scenes: Array<{
    scene_id: string;
    reason: string;
    gear_needed: string[];
  }>;
  permits_needed: Array<{
    scene_id: string;
    permit_type: string;
    reason: string;
  }>;
  camera_gear: Array<{
    scene_id: string;
    gear: string[];
  }>;
  lighting: Array<{
    scene_id: string;
    style: string;
  }>;
  special_skills: Array<{
    character: string;
    skill: string;
    scene_id: string;
  }>;
  risks: Array<{
    scene_id: string;
    risk_type: string;
    mitigation: string;
  }>;
}

class AnalysisEmitter extends EventEmitter {
  private progress: number = 0;

  constructor() {
    super();
  }

  updateProgress(stage: string, percentage: number, message: string) {
    this.progress = percentage;
    this.emit('progress', { stage, percentage, message });
  }
}

export async function analyzeScript(text: string): Promise<AnalysisResult & AnalysisEmitter> {
  const emitter = new AnalysisEmitter();
  
  try {
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    emitter.updateProgress('preprocessing', 10, 'Przygotowywanie tekstu do analizy...');

    const prompt = `You are an **Ultimate Narrative-Production Analysis Engine**.  
Your mission is to completely break down a screenplay into **separate structured files** needed for full production planning.  
Be exhaustive and precise.

PRE-STEP (handled externally): receive a PDF, extract plain UTF-8 text, and insert it below.

OUTPUT CONTRACT – return **exactly** these file blocks (no extra text):

--- filename: analysis.json
<JSON-conforming-to-MAIN-SCHEMA>

--- filename: locations.json
{ "locations": [string …] }

--- filename: roles.json
{ "roles": [ { "character": string, "role": string } … ] }

--- filename: props.json
{ "global_props": [string …], "scene_props": { "S#": [string …] } }

--- filename: vehicles.json
{ "global_vehicles": [string …], "scene_vehicles": { "S#": [string …] } }

--- filename: weapons.json
{ "global_weapons": [string …], "scene_weapons": { "S#": [string …] } }

--- filename: fx.json
{ "special_effects": [string …] }

--- filename: difficult_scenes.json
{ "difficult_scenes": [
    { "scene_id": "S#", "reason": string, "gear_needed": [string …] } … ] }

--- filename: permits.json
{ "permits_needed": [ { "scene_id": "S#", "permit_type": string, "reason": string } … ] }

--- filename: special_gear.json
{ "camera_gear": [ { "scene_id": "S#", "gear": [string …] } … ] }

--- filename: lighting_schemes.json
{ "lighting": [ { "scene_id": "S#", "style": string } … ] }

--- filename: cast_skills.json
{ "special_skills": [ { "character": string, "skill": string, "scene_id": "S#" } … ] }

--- filename: production_risks.json
{ "risks": [ { "scene_id": "S#", "risk_type": string, "mitigation": string } … ] }

<SCENARIO>
${text}
</SCENARIO>`;

    emitter.updateProgress('analysis', 30, 'Analizuję tekst...');

    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7,
    });

    emitter.updateProgress('processing', 70, 'Przetwarzanie wyników...');

    const response = completion.choices[0].message?.content || '';
    
    // Parse the response into separate JSON files
    const result: any = {};
    const regex = /--- filename: ([^\n]+)\n([\s\S]*?)(?=(--- filename:|$))/g;
    let match;

    while ((match = regex.exec(response)) !== null) {
      const filename = match[1].trim();
      const content = match[2].trim();
      const jsonContent = JSON.parse(content);
      const key = filename.replace('.json', '');
      result[key] = jsonContent;
    }

    emitter.updateProgress('finalizing', 90, 'Finalizacja analizy...');

    // Return the combined result
    return {
      ...result,
      ...emitter
    } as AnalysisResult & AnalysisEmitter;

  } catch (error) {
    console.error('Błąd podczas analizy:', error);
    throw error;
  }
} 