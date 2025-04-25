# Ideal AI/ML-Driven Screenplay Parser – Architecture & Features

## 1. Input & Preprocessing
- **Supported formats:** PDF, TXT (auto-detect, extract text using `pdf-parse` if needed).
- **Batch processing:** All files in `uploads/` directory.
- **Text normalization:** Remove OCR artifacts, fix encoding, normalize whitespace.

## 2. Scene Segmentation
- **Regex-based initial split:** Detect scene headers (e.g. `^\d+\s+(INT\.|EXT\.)`).
- **Scene object:** 
  - `scene_number`
  - `location` (raw)
  - `time_of_day` (raw)
  - `raw_text` (all lines until next scene header)

## 3. Scene Analysis Pipeline (AI/ML)
For each scene:
- **NER (Named Entity Recognition):**
  - Model: Hugging Face Transformers (e.g. `XLM-RoBERTa`, `bert-base-multilingual-cased-ner-hrl`)
  - Extract: characters, locations, props, weather, time, organizations, background elements.
- **Sentiment & Mood Analysis:**
  - Model: Sentiment classifier (fine-tuned for Polish/English screenplays)
  - Output: mood (e.g. tense, comic, dramatic), emotional intensity, polarity.
- **Action/Pattern Classification:**
  - Model: Text classifier (detects action, dialogue, exposition, suspense, etc.)
  - Output: dominant action type, narrative pattern.
- **Character & Relationship Extraction:**
  - Model: LLM (e.g. `mistral`, `llama`, `gpt-4` via LangChain)
  - Output: character descriptions, relationships, background, evolution.
- **Location & Costume Suggestions:**
  - Model: LLM prompt (scene description → suggested real-world locations, costume ideas)
- **Equipment/Props/FX Needs:**
  - Model: LLM prompt + NER (detects all props, vehicles, SFX, VFX, special equipment)
  - Output: structured list of required equipment per scene.

## 4. Output Structure
- **Per scene:**
  - `scene_number`
  - `location` (structured)
  - `time_of_day`
  - `characters` (with background, relationships)
  - `dialogues` (speaker, text, sentiment)
  - `description` (action, mood, weather, sound, props)
  - `mood` (classified)
  - `climate` (weather, atmosphere)
  - `action_pattern` (classified)
  - `suggested_locations`
  - `suggested_costumes`
  - `suggested_equipment`
  - `background_notes`
- **Global:**
  - List of all unique props, costumes, locations, equipment
  - Character bible (background, arcs, relationships)
  - Scene-by-scene breakdown (for production)

## 5. Technology Stack
- **Node.js** for orchestration, file I/O, API.
- **Hugging Face Transformers** (via `@xenova/transformers` or Python microservice).
- **LangChain** for LLM orchestration, prompt engineering, RAG.
- **Optional:** Vector DB for semantic search (Chroma, Pinecone).
- **Optional:** Fine-tuned models for Polish/film domain.

## 6. Hardware/Software Requirements
- **RAM:** 8GB+ (16GB+ recommended for large scripts and local inference)
- **CPU:** Modern quad-core minimum; **GPU** (NVIDIA 6GB+ VRAM) recommended for fast inference
- **Disk:** SSD, 1GB+ free
- **Node.js:** v18+
- **Python (optional):** 3.10+ (if using Python-based models)
- **Internet:** Required for model downloads, LLM API calls

## 7. Example Pipeline (Pseudo-code)
```js
for (const file of uploads) {
  const text = extractText(file);
  const scenes = splitIntoScenes(text);
  for (const scene of scenes) {
    const ner = runNER(scene.raw_text);
    const mood = classifyMood(scene.raw_text);
    const actionType = classifyAction(scene.raw_text);
    const charInfo = extractCharacterInfo(scene.raw_text, ner);
    const rels = extractRelationships(scene.raw_text, ner);
    const locSuggest = suggestLocations(scene.raw_text);
    const costumeSuggest = suggestCostumes(scene.raw_text, charInfo);
    const equipSuggest = suggestEquipment(scene.raw_text, ner, actionType);
    output.push({
      ...scene,
      ner, mood, actionType, charInfo, rels, locSuggest, costumeSuggest, equipSuggest
    });
  }
}
```

## 8. Next Steps
- Implement modular pipeline (scene splitter, NER, classifiers, LLM prompts).
- Test on real scripts from `uploads/`.
- Fine-tune heuristics and prompts for Polish/film domain.
- Integrate with production planning tools (breakdown, scheduling, budgeting).

---
**This document is the technical and functional blueprint for the next-generation screenplay parser with deep AI/ML integration.**