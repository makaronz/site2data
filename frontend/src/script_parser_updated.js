const fs = require('fs');
const path = require('path');
const pdfParse = require('pdf-parse');
const mlAnalyzer = require('./ml_analyzer'); // Keep existing ML analysis integration

// Import necessary components from transformers and langchain
const { pipeline } = await import('@xenova/transformers'); // Use dynamic import for ESM module
const { RunnableSequence } = await import('@langchain/core/runnables'); // Example import - adjust based on actual LangChain usage
const { PromptTemplate } = await import("@langchain/core/prompts"); // Example import
// Add other necessary LangChain imports as needed

// --- NER Pipeline Initialization ---
// Load the NER pipeline. This might take time on first run as the model downloads.
// Use a singleton pattern or lazy loading in a real app to avoid reloading.
let nerPipeline;
try {
  console.log('Loading NER pipeline...');
  // Using a multilingual model suitable for various languages including Polish
// DEBUG: Save all NER entities to file for inspection
fs.writeFileSync(path.join(__dirname, 'ner_entities_debug.json'), JSON.stringify(entities, null, 2));
  nerPipeline = await pipeline('token-classification', 'Xenova/bert-base-multilingual-cased-ner-hrl');
  console.log('NER pipeline loaded successfully.');
} catch (error) {
  console.error('Failed to load NER pipeline:', error);
  // Handle pipeline loading error appropriately
  // Maybe fall back to regex or throw an error
}

// --- Helper function to process NER results ---
function structureEntities(entities) {
  // This function needs significant logic to interpret NER tags
  // and structure them into screenplay elements (scenes, characters, dialogue, actions).
  // This is a placeholder for the complex logic required.
  console.log("Raw NER Entities:", JSON.stringify(entities, null, 2)); // Log raw entities for debugging

  const scenes = [];
  let currentScene = null;
  let currentSpeaker = null;
  let currentDialogue = [];
  let currentAction = [];

  // Example simplified logic (needs refinement based on model output and screenplay structure)
  entities.forEach(entity => {
    // Heuristic: Scene headers often contain LOC and maybe MISC/ORG for time of day
    // This requires more robust pattern matching on the text associated with LOC entities.
    if (entity.entity_group === 'LOC' && entity.word.toUpperCase().includes('PL.')) { // Very basic heuristic for scene start
      if (currentScene) {
        currentScene.description = currentAction.join(' ').trim();
        currentScene.dialogue.push({ character: currentSpeaker, text: currentDialogue.join(' ').trim() }); // Add last dialogue
        scenes.push(currentScene);
      }
      currentScene = {
        sceneNumber: `SCENE_${scenes.length + 1}`, // Placeholder scene number
        location: { type: "EXT./INT.", name: entity.word }, // Placeholder type
        timeOfDay: "UNKNOWN", // Needs extraction logic
        cast: new Set(),
        dialogue: [],
        description: "",
        props: [], // Prop extraction needs specific logic or model
        mood: null, // Mood extraction needs specific logic or model
        turningPoints: [] // Turning point extraction needs specific logic or model
      };
      currentAction = [];
      currentDialogue = [];
      currentSpeaker = null;
    } else if (entity.entity_group === 'PER' && currentScene) {
      // Potential character name - check context (e.g., if it's all caps, followed by dialogue)
      // This needs context analysis (e.g., position in line, capitalization)
      if (currentSpeaker && currentDialogue.length > 0) {
         currentScene.dialogue.push({ character: currentSpeaker, text: currentDialogue.join(' ').trim() });
      }
      currentSpeaker = entity.word;
      currentScene.cast.add(currentSpeaker);
      currentDialogue = [];
    } else if (currentScene) {
      // Assume other words are part of action description or dialogue
// DEBUG: Save allEntities to file for inspection
fs.writeFileSync(path.join(__dirname, 'ner_entities_debug.json'), JSON.stringify(allEntities, null, 2));
      if (currentSpeaker) {
        currentDialogue.push(entity.word);
      } else {
        currentAction.push(entity.word);
      }
    }
  });

   // Add the last scene
  if (currentScene) {
     if (currentSpeaker && currentDialogue.length > 0) {
       currentScene.dialogue.push({ character: currentSpeaker, text: currentDialogue.join(' ').trim() });
     }
     currentScene.description = currentAction.join(' ').trim();
     scenes.push(currentScene);
  }

  // Convert cast Set to Array
  scenes.forEach(scene => {
    scene.cast = Array.from(scene.cast);
  });

  console.log(`Structured ${scenes.length} scenes from NER (basic logic).`);
  return scenes; // Return the structured scenes
}


async function parseScript(filePath) {
  try {
    console.log(`Parsowanie pliku (NER): ${filePath}`);

    if (!fs.existsSync(filePath)) {
      throw new Error(`Plik nie istnieje: ${filePath}`);
    }

    const dataBuffer = fs.readFileSync(filePath);
    console.log(`Wczytano ${dataBuffer.length} bajtów`);

    const data = await pdfParse(dataBuffer);
    console.log(`Pomyślnie sparsowano PDF, tekst: ${data.text.length} znaków`);

    // --- NER Processing ---
    let scenes = [];
    if (nerPipeline) {
      console.log('Running NER analysis...');
      // Process text in chunks if it's very long to avoid memory issues
      const chunkSize = 1000; // Adjust chunk size as needed
      const textChunks = [];
      for (let i = 0; i < data.text.length; i += chunkSize) {
          textChunks.push(data.text.substring(i, i + chunkSize));
      }

      let allEntities = [];
      for (const chunk of textChunks) {
          const chunkEntities = await nerPipeline(chunk, { ignore_labels: [] }); // Get all labels
          // Adjust entity indices based on chunk position if needed (complex)
          // For simplicity here, we process chunks independently, which might split entities
          allEntities = allEntities.concat(chunkEntities);
      }

      console.log(`NER analysis complete. Found ${allEntities.length} potential entities.`);

      // --- Structure NER results ---
      // This is where the complex logic to interpret NER output goes.
      // The `structureEntities` function is a placeholder for this.
      scenes = structureEntities(allEntities);

    } else {
      console.warn('NER pipeline not available. Skipping NER-based parsing.');
      // Optionally fall back to regex or return an error
      // For now, return empty scenes if NER fails
      scenes = [];
    }

    // --- End of NER Processing ---


    // --- Existing ML Analysis Integration (Remains the same) ---
    console.log(`Parsowanie zakończone (NER). Znaleziono ${scenes.length} scen (może wymagać dopracowania logiki strukturyzacji).`);

    // Prepare metadata (can be adapted based on NER results)
    const uniqueCharacters = new Set();
    let totalDialogues = 0;
    scenes.forEach(scene => {
      scene.cast.forEach(character => uniqueCharacters.add(character));
      totalDialogues += scene.dialogue.length;
    });

    // Add ML analysis for each scene (using the existing mlAnalyzer)
    for (let scene of scenes) {
      // Ensure scene has description and dialogue properties, even if empty
      scene.description = scene.description || "";
      scene.dialogue = scene.dialogue || [];

      const sentiment = mlAnalyzer.analyzeSentiment(scene.description);
      // Assuming analyzeEmotions etc. are adapted if scene structure changes
      const emotions = await mlAnalyzer.analyzeEmotions(scene.description);
      const classification = await mlAnalyzer.classifyScene(scene); // Might need adjustment

      scene.analysis = {
        sentiment,
        emotions,
        classification
      };
    }

    // Analyze scene context (using the existing mlAnalyzer)
    for (let scene of scenes) {
       if (!scene.analysis) scene.analysis = {}; // Ensure analysis object exists
       const sceneContext = await mlAnalyzer.analyzeSceneContext(scene, scenes); // Might need adjustment
       scene.analysis.context = sceneContext;
    }

    // Find turning points (using the existing mlAnalyzer)
    const storyTurningPoints = await mlAnalyzer.analyzeTurningPoints(scenes); // Might need adjustment

    // Analyze character relationships (using the existing mlAnalyzer)
    const characterRelationships = await mlAnalyzer.analyzeCharacterRelationships(scenes); // Might need adjustment
    // --- End of Existing ML Analysis Integration ---


    // Format final result
    const result = {
      title: path.basename(filePath, '.pdf'),
      version: "2.0-NER", // Indicate new version
      date: new Date().toISOString(),
      scenes: scenes.map(scene => ({ // Ensure mapping matches expected output
        sceneNumber: scene.sceneNumber || "N/A",
        location: scene.location || { type: "UNKNOWN", name: "UNKNOWN" },
        timeOfDay: scene.timeOfDay || "UNKNOWN",
        cast: scene.cast || [],
        dialogue: scene.dialogue || [],
        description: scene.description || "",
        props: scene.props || [],
        mood: scene.mood || null,
        turningPoints: scene.turningPoints || [],
        analysis: scene.analysis || {} // Include analysis results
      })),
      analysis: { // Include global analysis if available
        turningPoints: storyTurningPoints || [],
        relationships: characterRelationships || [],
        globalStats: scenes.length > 0 ? { // Add check for empty scenes
          totalScenes: scenes.length,
          // Ensure analysis exists before accessing properties
          averageIntensity: scenes.reduce((sum, scene) => sum + (scene.analysis?.sentiment?.intensity || 0), 0) / scenes.length,
          dominantEmotions: calculateDominantEmotions(scenes), // Keep helper functions
          pacing: calculateOverallPacing(scenes) // Keep helper functions
        } : {} // Return empty object if no scenes
      }
    };

    return result;

  } catch (error) {
    console.error('Błąd podczas parsowania (NER):', error);
    throw error; // Re-throw the error for the caller
  }
}

// --- Helper functions from original file (kept for global analysis) ---
function calculateDominantEmotions(scenes) {
  const emotionCounts = scenes.reduce((counts, scene) => {
    // Check if analysis and emotions exist
    if (scene.analysis && scene.analysis.emotions) {
      Object.entries(scene.analysis.emotions).forEach(([emotion, value]) => {
        counts[emotion] = (counts[emotion] || 0) + (value || 0); // Handle potential null/undefined values
      });
    }
    return counts;
  }, {});

  const totalScenes = scenes.length;
  if (totalScenes === 0) return {}; // Handle empty scenes case

  return Object.entries(emotionCounts)
    .sort(([, a], [, b]) => b - a)
    .reduce((obj, [emotion, count]) => {
      obj[emotion] = count / totalScenes; // average per scene
      return obj;
    }, {});
}

function calculateOverallPacing(scenes) {
  const pacingScores = {
    'szybkie': 3,
    'umiarkowane': 2,
    'wolne': 1,
    'undefined': 2 // Default pacing if classification fails
  };

  const totalScenes = scenes.length;
   if (totalScenes === 0) return 'nieokreślone'; // Handle empty scenes case

  const averagePacing = scenes.reduce((sum, scene) => {
     // Check if analysis and classification exist
    const pacing = scene.analysis?.classification?.pacing || 'undefined';
    return sum + (pacingScores[pacing] || 2); // Use default score if pacing is unknown
  }, 0) / totalScenes;

  if (averagePacing > 2.5) return 'szybkie';
  if (averagePacing > 1.5) return 'umiarkowane';
  return 'wolne';
}
// --- End of Helper functions ---


// Remove or comment out the direct execution part if this is meant to be only a module
/*
const scriptPath = path.join(__dirname, 'XMPS', 'DRUGA-FURIOZA 050624.pdf');
console.log(`Ścieżka do pliku: ${scriptPath}`);

parseScript(scriptPath)
  .then(result => {
    console.log('--- NER PARSING RESULTS ---');
    console.log('Liczba scen:', result.scenes.length);
    console.log('Tytuł:', result.title);
    console.log('Wersja:', result.version);

    console.log('\nPrzykładowe sceny (NER):');
     result.scenes.slice(0, 2).forEach(scene => { // Show fewer examples initially
       console.log('\nScena:', scene.sceneNumber);
       console.log('Lokacja:', scene.location.name);
       console.log('Pora dnia:', scene.timeOfDay);
       console.log('Obsada:', scene.cast.join(', '));
       console.log('Liczba dialogów:', scene.dialogue.length);
       console.log('Opis (początek):', scene.description.substring(0, 100) + '...');
       console.log('Analiza (sentyment):', scene.analysis?.sentiment);
     });

    const outputFile = path.join(__dirname, 'parsed_script_ner.json'); // Save to a different file
    fs.writeFileSync(outputFile, JSON.stringify(result, null, 2));
    console.log(`\nWyniki (NER) zostały zapisane do pliku: ${outputFile}`);
  })
  .catch(error => {
    console.error('Błąd (NER):', error);
  });
*/

module.exports = {
  parseScript
};