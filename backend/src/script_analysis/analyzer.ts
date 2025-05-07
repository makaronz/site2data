import OpenAI from 'openai';
import { z } from 'zod';

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

// Schematy Zod dla odpowiedzi OpenAI
const analysisMetadataSchema = z.object({
  title: z.string(),
  authors: z.array(z.string()),
  detected_language: z.string(),
  scene_count: z.number(),
  token_count: z.number(),
  analysis_timestamp: z.string(),
});

const sceneSchema = z.object({
  id: z.string(),
  location: z.string(),
  time: z.string(),
  characters: z.array(z.string()),
  summary: z.string(), // Uwaga: W AnalysisResult jest 'description'. Dostosować w razie potrzeby.
  dominant_emotions: z.object({
    joy: z.number(),
    trust: z.number(),
    fear: z.number(),
    surprise: z.number(),
    sadness: z.number(),
    disgust: z.number(),
    anger: z.number(),
    anticipation: z.number(),
  }),
  narrative_importance: z.number(),
});

const characterSchema = z.object({
  name: z.string(),
  role: z.enum(['protagonist', 'antagonist', 'supporting', 'other']),
  description: z.string(),
  emotional_profile: z.object({
    joy: z.number(),
    trust: z.number(),
    fear: z.number(),
    surprise: z.number(),
    sadness: z.number(),
    disgust: z.number(),
    anger: z.number(),
    anticipation: z.number(),
  }),
  centrality_score: z.number(),
  arc_type: z.string(),
});

const relationshipSchema = z.object({
  character_a: z.string(),
  character_b: z.string(),
  strength: z.number(),
  overall_sentiment: z.number(),
  key_scenes: z.array(z.string()),
});

const turningPointSchema = z.object({
  scene_id: z.string(),
  type: z.enum(['inciting', 'midpoint', 'climax', 'resolution', 'other']),
  intensity: z.number(),
  impact_summary: z.string(),
});

const themeSchema = z.object({
  theme: z.string(),
  relevance: z.number(),
});

const topicClusterSchema = z.object({
  topic: z.string(),
  keywords: z.array(z.string()),
  frequency: z.number(),
});

const emotionalTimelineSchema = z.object({
  scene_id: z.string(),
  valence: z.number(),
  arousal: z.number(),
});

const mainAnalysisSchema = z.object({
  metadata: analysisMetadataSchema,
  scenes: z.array(sceneSchema),
  characters: z.array(characterSchema).optional(), // Opcjonalne, bo AnalysisResult tak ma
  relationships: z.array(relationshipSchema).optional(), // Opcjonalne
  turning_points: z.array(turningPointSchema).optional(), // Opcjonalne
  themes: z.array(themeSchema).optional(), // Opcjonalne
  topic_clusters: z.array(topicClusterSchema).optional(), // Opcjonalne
  emotional_timeline: z.array(emotionalTimelineSchema).optional(), // Opcjonalne
  overall_summary: z.string(),
});

const locationsSchema = z.object({ 
  locations: z.array(z.string()) 
});

const rolesSchema = z.object({
  roles: z.array(
    z.object({
      character: z.string(),
      role: z.string(),
    })
  ),
});

const propsSchema = z.object({
  global_props: z.array(z.string()),
  scene_props: z.record(z.array(z.string())), 
});

const vehiclesSchema = z.object({
  global_vehicles: z.array(z.string()),
  scene_vehicles: z.record(z.array(z.string())),
});

const weaponsSchema = z.object({
  global_weapons: z.array(z.string()),
  scene_weapons: z.record(z.array(z.string())), 
});

const fxSchema = z.object({
  special_effects: z.array(z.string()),
});

const difficultSceneItemSchema = z.object({
  scene_id: z.string(), 
  reason: z.string(),
  gear_needed: z.array(z.string()),
});

const difficultScenesSchema = z.object({
  difficult_scenes: z.array(difficultSceneItemSchema),
});

const permitNeededItemSchema = z.object({
  scene_id: z.string(),
  permit_type: z.string(),
  reason: z.string(),
});

const permitsSchema = z.object({
  permits_needed: z.array(permitNeededItemSchema),
});

const specialGearItemSchema = z.object({ 
  scene_id: z.string(),
  gear: z.array(z.string()),
});

const specialGearSchema = z.object({ 
  special_gear: z.array(specialGearItemSchema), // Klucz ujednolicony do special_gear
});

const lightingSchemeItemSchema = z.object({
  scene_id: z.string(),
  style: z.string(),
});

const lightingSchemesSchema = z.object({
  lighting: z.array(lightingSchemeItemSchema),
});

const castSkillItemSchema = z.object({
  character: z.string(),
  skill: z.string(),
  scene_id: z.string(),
});

const castSkillsSchema = z.object({
  special_skills: z.array(castSkillItemSchema),
});

const productionRiskItemSchema = z.object({
  scene_id: z.string(),
  risk_type: z.string(),
  mitigation: z.string(),
});

const productionRisksSchema = z.object({
  risks: z.array(productionRiskItemSchema),
});

const finalResultSchema = z.object({
  analysis: mainAnalysisSchema,
  locations: z.array(z.string()), 
  roles: z.array(z.object({ character: z.string(), role: z.string() })), 
  global_props: z.array(z.string()),
  scene_props: z.record(z.array(z.string())),
  global_vehicles: z.array(z.string()),
  scene_vehicles: z.record(z.array(z.string())),
  global_weapons: z.array(z.string()),
  scene_weapons: z.record(z.array(z.string())),
  special_effects: z.array(z.string()), 
  difficult_scenes: z.array(difficultSceneItemSchema),
  permits_needed: z.array(permitNeededItemSchema),   
  camera_gear: z.array(specialGearItemSchema),     
  lighting: z.array(lightingSchemeItemSchema),       
  special_skills: z.array(castSkillItemSchema),      
  risks: z.array(productionRiskItemSchema),          
});

// Definicje typów callbacków na górze pliku lub w odpowiednim miejscu
type ProgressCallback = (stage: string, percentage: number, message: string) => void;
type ErrorCallback = (errorMessage: string, details?: unknown) => void;

// Funkcja pomocnicza do ponawiania prób
async function executeWithRetry<T>(
  action: () => Promise<T>,
  maxRetries: number = 3,
  delayMs: number = 1000,
  shouldRetry: (error: any) => boolean = (error) => {
    if (error && typeof error === 'object') {
      if ('status' in error) {
        const status = error.status as number;
        return status === 429 || status >= 500 && status <= 599;
      }
    }
    return false;
  },
  progressCallback?: ProgressCallback
): Promise<T> {
  let retries = 0;
  while (true) {
    try {
      return await action();
    } catch (error) {
      retries++;
      if (retries > maxRetries || !shouldRetry(error)) {
        throw error;
      }
      const err = error instanceof Error ? error : new Error(String(error));
      const attemptMessage = `Błąd komunikacji z OpenAI (próba ${retries}/${maxRetries}): ${err.message}. Ponawianie za ${delayMs / 1000}s...`;
      console.warn(attemptMessage);
      if (progressCallback) {
        progressCallback('retry_attempt', 0, attemptMessage);
      }
      await new Promise(resolve => setTimeout(resolve, delayMs));
      delayMs *= 2; 
    }
  }
}

export async function analyzeScript(
  text: string, 
  customApiKey?: string,
  progressCallback?: ProgressCallback,
  errorCallback?: ErrorCallback
): Promise<AnalysisResult | null> {

  const reportProgress = (stage: string, percentage: number, message: string) => {
    if (progressCallback) {
      progressCallback(stage, percentage, message);
    } else {
      console.log(`Progress Update: ${stage} - ${percentage}% - ${message}`);
    }
  };

  const reportError = (message: string, details?: unknown) => {
    console.error(`Analysis Error: ${message}`, details || '');
    if (errorCallback) {
      errorCallback(message, details);
    }
  };
  
  try {
    reportProgress('initialization', 5, 'Inicjalizacja analizy...');

    // Sprawdzamy, czy klucz API jest dostępny
    // console.log('Sprawdzanie klucza API OpenAI...'); // Mniej szczegółowe logowanie tutaj
    let apiKey = customApiKey || process.env.OPENAI_API_KEY;
    
    if (!apiKey) {
      reportError('Brak klucza API OpenAI. Upewnij się, że zmienna środowiskowa OPENAI_API_KEY jest ustawiona.', { internalCode: 'API_KEY_MISSING' });
      // console.error('BŁĄD: Klucz API OpenAI nie został znaleziony w zmiennych środowiskowych'); // Już obsłużone przez reportError
      // throw new Error('Brak klucza API OpenAI'); // Zamiast rzucać, zwracamy null
      return null;
    }
    
    // Sprawdzenie czy token zawiera prefix "Bearer"
    if (apiKey.startsWith('Bearer ')) {
      apiKey = apiKey.substring(7);
    }
    
    // console.log('Klucz API OpenAI znaleziony: ', apiKey.substring(0, 10) + '...' + apiKey.substring(apiKey.length - 5)); // Mniej szczegółowe logowanie tutaj
    
    const openai = new OpenAI({
      apiKey: apiKey,
    });

    reportProgress('preprocessing', 10, 'Przygotowywanie tekstu do analizy...');

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

    reportProgress('analysis_start', 30, 'Rozpoczynanie komunikacji z OpenAI...');

    // Użycie executeWithRetry
    const completion = await executeWithRetry(
      () => openai.chat.completions.create({
        model: "gpt-4-turbo-2024-04-09",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.7,
      }),
      3, // maxRetries
      1000, // initialDelayMs
      (error: any) => { // Custom shouldRetry, any jest tutaj akceptowalne
        if (error && typeof error === 'object' && 'status' in error) {
          const status = error.status as number;
          return status === 429 || (status >= 500 && status <= 599);
        }
        return false;
      },
      progressCallback
    );

    reportProgress('processing_response', 70, 'Przetwarzanie odpowiedzi od OpenAI...');

    let response = completion.choices[0].message?.content || '';
    
    // Wstępne oczyszczanie odpowiedzi
    response = response.trim(); // Usuń białe znaki z początku i końca
    const markdownJsonRegex = /^```json\s*([\s\S]*?)\s*```$/; // Regex do wykrycia ```json ... ```
    const markdownMatch = response.match(markdownJsonRegex);
    if (markdownMatch && markdownMatch[1]) {
      response = markdownMatch[1].trim(); // Użyj zawartości bloku markdown
      reportProgress('processing_response', 72, 'Oczyszczono odpowiedź OpenAI z bloku markdown.');
    }

    // console.log('Cleaned OpenAI Response:', response); // Do debugowania
    
    // Log the entire response from OpenAI for debugging
    // console.log('Full OpenAI Response:', response); // Można to włączyć w razie potrzeby debugowania

    // Parse the response into separate JSON files
    const result: Record<string, unknown> = {};
    const regex = /--- filename: ([^\\n]+)\\n([\\s\\S]*?)(?=(--- filename:|$))/g;
    let match;
    let allFilesParsedSuccessfully = true;

    while ((match = regex.exec(response)) !== null) {
      const filename = match[1].trim();
      const content = match[2].trim();
      let jsonContent;
      let isValid = true; // Flaga do śledzenia poprawności bloku
      try {
        jsonContent = JSON.parse(content);

        // Walidacja schematem Zod w zależności od nazwy pliku
        if (filename === 'analysis.json') {
          const validationResult = mainAnalysisSchema.safeParse(jsonContent);
          if (!validationResult.success) {
            reportError(`Błąd walidacji schematu dla pliku '${filename}'.`, { filename, errors: validationResult.error.flatten() });
            jsonContent = null;
            isValid = false;
          } else {
            jsonContent = validationResult.data; 
          }
        } else if (filename === 'locations.json') {
          const validationResult = locationsSchema.safeParse(jsonContent);
          if (!validationResult.success) {
            reportError(`Błąd walidacji schematu dla pliku '${filename}'.`, { filename, errors: validationResult.error.flatten() });
            jsonContent = null;
            isValid = false;
          } else {
            jsonContent = validationResult.data;
          }
        } else if (filename === 'roles.json') {
          const validationResult = rolesSchema.safeParse(jsonContent);
          if (!validationResult.success) {
            reportError(`Błąd walidacji schematu dla pliku '${filename}'.`, { filename, errors: validationResult.error.flatten() });
            jsonContent = null;
            isValid = false;
          } else {
            jsonContent = validationResult.data;
          }
        } else if (filename === 'props.json') {
          const validationResult = propsSchema.safeParse(jsonContent);
          if (!validationResult.success) {
            reportError(`Błąd walidacji schematu dla pliku '${filename}'.`, { filename, errors: validationResult.error.flatten() });
            jsonContent = null;
            isValid = false;
          } else {
            jsonContent = validationResult.data;
          }
        } else if (filename === 'vehicles.json') {
          const validationResult = vehiclesSchema.safeParse(jsonContent);
          if (!validationResult.success) {
            reportError(`Błąd walidacji schematu dla pliku '${filename}'.`, { filename, errors: validationResult.error.flatten() });
            jsonContent = null;
            isValid = false;
          } else {
            jsonContent = validationResult.data;
          }
        } else if (filename === 'weapons.json') {
          const validationResult = weaponsSchema.safeParse(jsonContent);
          if (!validationResult.success) {
            reportError(`Błąd walidacji schematu dla pliku '${filename}'.`, { filename, errors: validationResult.error.flatten() });
            jsonContent = null;
            isValid = false;
          } else {
            jsonContent = validationResult.data;
          }
        } else if (filename === 'fx.json') {
          const validationResult = fxSchema.safeParse(jsonContent);
          if (!validationResult.success) {
            reportError(`Błąd walidacji schematu dla pliku '${filename}'.`, { filename, errors: validationResult.error.flatten() });
            jsonContent = null;
            isValid = false;
          } else {
            jsonContent = validationResult.data;
          }
        } else if (filename === 'difficult_scenes.json') {
          const validationResult = difficultScenesSchema.safeParse(jsonContent);
          if (!validationResult.success) {
            reportError(`Błąd walidacji schematu dla pliku '${filename}'.`, { filename, errors: validationResult.error.flatten() });
            jsonContent = null;
            isValid = false;
          } else {
            jsonContent = validationResult.data;
          }
        } else if (filename === 'permits.json') {
          const validationResult = permitsSchema.safeParse(jsonContent);
          if (!validationResult.success) {
            reportError(`Błąd walidacji schematu dla pliku '${filename}'.`, { filename, errors: validationResult.error.flatten() });
            jsonContent = null;
            isValid = false;
          } else {
            jsonContent = validationResult.data;
          }
        } else if (filename === 'special_gear.json') { 
          const validationResult = specialGearSchema.safeParse(jsonContent);
          if (!validationResult.success) {
            reportError(`Błąd walidacji schematu dla pliku '${filename}'.`, { filename, errors: validationResult.error.flatten() });
            jsonContent = null;
            isValid = false;
          } else {
            jsonContent = validationResult.data;
          }
        } else if (filename === 'lighting_schemes.json') {
          const validationResult = lightingSchemesSchema.safeParse(jsonContent);
          if (!validationResult.success) {
            reportError(`Błąd walidacji schematu dla pliku '${filename}'.`, { filename, errors: validationResult.error.flatten() });
            jsonContent = null;
            isValid = false;
          } else {
            jsonContent = validationResult.data;
          }
        } else if (filename === 'cast_skills.json') {
          const validationResult = castSkillsSchema.safeParse(jsonContent);
          if (!validationResult.success) {
            reportError(`Błąd walidacji schematu dla pliku '${filename}'.`, { filename, errors: validationResult.error.flatten() });
            jsonContent = null;
            isValid = false;
          } else {
            jsonContent = validationResult.data;
          }
        } else if (filename === 'production_risks.json') {
          const validationResult = productionRisksSchema.safeParse(jsonContent);
          if (!validationResult.success) {
            reportError(`Błąd walidacji schematu dla pliku '${filename}'.`, { filename, errors: validationResult.error.flatten() });
            jsonContent = null;
            isValid = false;
          } else {
            jsonContent = validationResult.data;
          }
        }

      } catch (parseError) {
        const err = parseError as Error;
        // console.error(`JSON parse error in file '${filename}':`, err, '\\nContent:', content, '\\nThis file will be skipped and its content set to null.');
        reportError(`Błąd parsowania JSON w pliku '${filename}' z odpowiedzi OpenAI.`, { filename, originalError: err.message, contentSnippet: content.substring(0, 100) });
        // Instead of throwing, log the error and set content to null or an error object
        jsonContent = null; 
        allFilesParsedSuccessfully = false;
        // If you want to completely skip adding this key to the result, you could use:
        // continue; 
      }
      const key = filename.replace('.json', '');
      result[key] = jsonContent;
    }

    if (!allFilesParsedSuccessfully) {
      reportProgress('parsing_issues', 85, 'Niektóre części odpowiedzi OpenAI nie mogły zostać poprawnie sparsowane.');
      // Można zdecydować, czy w tym momencie zwracać błąd, czy kontynuować z częściowymi danymi
      // Na razie kontynuujemy, ale informacja została wysłana przez reportError i progressCallback
    }

    reportProgress('finalizing', 90, 'Finalizacja i walidacja kompletnej analizy...');
    
    // Tutaj powinna nastąpić walidacja schematu 'result' (np. za pomocą Zod)
    // Jeśli walidacja się nie powiedzie, należy użyć reportError i zwrócić null

    if (Object.keys(result).length === 0 && response.length > 0) {
        reportError('Nie udało się wyodrębnić żadnych plików z odpowiedzi OpenAI, pomimo otrzymania treści.', { responseSnippet: response.substring(0, 200) });
        return null;
    }
    
    if (Object.keys(result).length === 0 && response.length === 0 && completion.choices[0].finish_reason === 'length') {
        reportError('Odpowiedź OpenAI została obcięta z powodu limitu długości. Analiza jest niekompletna.', { finish_reason: completion.choices[0].finish_reason });
        return null;
    }

    // Upewnij się, że 'result' pasuje do typu AnalysisResult
    // return result as unknown as AnalysisResult; // Poprzednie rzutowanie

    reportProgress('finalizing', 90, 'Finalizacja i walidacja kompletnej analizy...');
    
    const mappedResultForFinalValidation: any = { // Używamy any na razie, potem Zod nada typ
      analysis: result.analysis,
      locations: result.locations ? (result.locations as { locations: string[] }).locations : [],
      roles: result.roles ? (result.roles as { roles: Array<{ character: string; role: string }> }).roles : [],
      global_props: result.props ? (result.props as { global_props: string[] }).global_props : [],
      scene_props: result.props ? (result.props as { scene_props: Record<string, string[]> }).scene_props : {},
      global_vehicles: result.vehicles ? (result.vehicles as { global_vehicles: string[] }).global_vehicles : [],
      scene_vehicles: result.vehicles ? (result.vehicles as { scene_vehicles: Record<string, string[]> }).scene_vehicles : {},
      global_weapons: result.weapons ? (result.weapons as { global_weapons: string[] }).global_weapons : [],
      scene_weapons: result.weapons ? (result.weapons as { scene_weapons: Record<string, string[]> }).scene_weapons : {},
      special_effects: result.fx ? (result.fx as { special_effects: string[] }).special_effects : [],
      difficult_scenes: result.difficult_scenes ? (result.difficult_scenes as { difficult_scenes: unknown[] }).difficult_scenes : [], // unknown[] zamiast any[]
      permits_needed: result.permits_needed ? (result.permits_needed as { permits_needed: unknown[] }).permits_needed : [], // unknown[]
      camera_gear: result.special_gear ? (result.special_gear as { special_gear: unknown[] }).special_gear : [], 
      lighting: result.lighting_schemes ? (result.lighting_schemes as { lighting: unknown[] }).lighting : [],       
      special_skills: result.cast_skills ? (result.cast_skills as { special_skills: unknown[] }).special_skills : [], 
      risks: result.production_risks ? (result.production_risks as { risks: unknown[] }).risks : [],             
    };

    const finalValidation = finalResultSchema.safeParse(mappedResultForFinalValidation);

    if (!finalValidation.success) {
      reportError("Ostateczny wynik analizy nie pasuje do oczekiwanego schematu AnalysisResult.", { errors: finalValidation.error.flatten(), dataAttempted: mappedResultForFinalValidation });
      return null;
    }

    reportProgress('complete', 100, 'Analiza zakończona i zwalidowana.');
    return finalValidation.data as AnalysisResult; 

  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    let errorMessage = `Nieoczekiwany błąd podczas analizy: ${err.message}`;
    if (error && typeof error === 'object' && 'status' in error && error.status === 401) {
        errorMessage = 'Błąd autoryzacji OpenAI: Nieprawidłowy klucz API lub brak uprawnień.';
    } else if (error && typeof error === 'object' && 'status' in error && error.status === 429) {
        errorMessage = 'Błąd OpenAI: Przekroczono limit zapytań (Rate limit). Spróbuj ponownie później.';
    }
    // Inne specyficzne kody błędów OpenAI można tutaj dodać

    reportError(errorMessage, err);
    return null;
  }
} 