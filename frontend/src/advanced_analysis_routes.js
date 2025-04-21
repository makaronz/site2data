/**
 * Moduł zawierający routy API dla zaawansowanej analizy emocjonalnej
 */
const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const scriptParser = require('./script_parser_updated');
const mlAnalyzer = require('./ml_analyzer');

// Utwórz katalogi jeśli nie istnieją
const parsedAnalysesDir = path.join(__dirname, 'parsed_analyses');
if (!fs.existsSync(parsedAnalysesDir)) {
  fs.mkdirSync(parsedAnalysesDir, { recursive: true });
}

const tempDir = path.join(__dirname, 'temp');
if (!fs.existsSync(tempDir)) {
  fs.mkdirSync(tempDir, { recursive: true });
}

/**
 * @route GET /api/analysis/emotions/:sceneId
 * @desc Pobierz szczegółową analizę emocji dla konkretnej sceny
 * @access Public
 */
router.get('/emotions/:scriptId/:sceneId', async (req, res) => {
  try {
    const { scriptId, sceneId } = req.params;
    
    // Najpierw sprawdź, czy istnieje już przeanalizowany plik scenariusza
    const analysisFilePath = path.join(__dirname, 'parsed_analyses', `${scriptId}.json`);
    
    let parsedScript;
    if (fs.existsSync(analysisFilePath)) {
      // Jeśli analizowany plik istnieje, wczytaj go
      const fileData = fs.readFileSync(analysisFilePath, 'utf8');
      parsedScript = JSON.parse(fileData);
    } else {
      // Jeśli nie istnieje, zwróć błąd
      return res.status(404).json({ error: 'Scenariusz nie został jeszcze przeanalizowany' });
    }
    
    // Znajdź scenę po ID
    const scene = parsedScript.scenes.find(s => s.sceneNumber === sceneId);
    
    if (!scene) {
      return res.status(404).json({ error: 'Scena o podanym ID nie istnieje' });
    }
    
    // Zwróć analizę emocji dla sceny
    res.json({
      sceneNumber: scene.sceneNumber,
      location: scene.location,
      timeOfDay: scene.timeOfDay,
      analysis: {
        emotions: scene.analysis?.emotions || {},
        sentiment: scene.analysis?.sentiment || {},
        context: scene.analysis?.context || {}
      }
    });
  } catch (error) {
    console.error('Błąd podczas analizy emocji:', error);
    res.status(500).json({ error: 'Wystąpił błąd podczas analizy emocji' });
  }
});

/**
 * @route GET /api/analysis/relationships/:scriptId
 * @desc Pobierz analizę relacji między postaciami w scenariuszu
 * @access Public
 */
router.get('/relationships/:scriptId', async (req, res) => {
  try {
    const { scriptId } = req.params;
    
    // Sprawdź, czy istnieje już przeanalizowany plik scenariusza
    const analysisFilePath = path.join(__dirname, 'parsed_analyses', `${scriptId}.json`);
    
    let parsedScript;
    if (fs.existsSync(analysisFilePath)) {
      // Jeśli analizowany plik istnieje, wczytaj go
      const fileData = fs.readFileSync(analysisFilePath, 'utf8');
      parsedScript = JSON.parse(fileData);
    } else {
      // Jeśli nie istnieje, zwróć błąd
      return res.status(404).json({ error: 'Scenariusz nie został jeszcze przeanalizowany' });
    }
    
    // Zwróć analizę relacji
    res.json({
      scriptId,
      relationships: parsedScript.analysis?.relationships || []
    });
  } catch (error) {
    console.error('Błąd podczas analizy relacji:', error);
    res.status(500).json({ error: 'Wystąpił błąd podczas analizy relacji' });
  }
});

/**
 * @route GET /api/analysis/turningpoints/:scriptId
 * @desc Pobierz punkty zwrotne w scenariuszu
 * @access Public
 */
router.get('/turningpoints/:scriptId', async (req, res) => {
  try {
    const { scriptId } = req.params;
    
    // Sprawdź, czy istnieje już przeanalizowany plik scenariusza
    const analysisFilePath = path.join(__dirname, 'parsed_analyses', `${scriptId}.json`);
    
    let parsedScript;
    if (fs.existsSync(analysisFilePath)) {
      // Jeśli analizowany plik istnieje, wczytaj go
      const fileData = fs.readFileSync(analysisFilePath, 'utf8');
      parsedScript = JSON.parse(fileData);
    } else {
      // Jeśli nie istnieje, zwróć błąd
      return res.status(404).json({ error: 'Scenariusz nie został jeszcze przeanalizowany' });
    }
    
    // Zwróć punkty zwrotne
    res.json({
      scriptId,
      turningPoints: parsedScript.analysis?.turningPoints || []
    });
  } catch (error) {
    console.error('Błąd podczas analizy punktów zwrotnych:', error);
    res.status(500).json({ error: 'Wystąpił błąd podczas analizy punktów zwrotnych' });
  }
});

/**
 * @route POST /api/analysis/full
 * @desc Przeprowadź pełną analizę scenariusza
 * @access Public
 */
router.post('/full', async (req, res) => {
  try {
    // Sprawdź czy przesłano ścieżkę do pliku
    if (!req.body.scriptPath) {
      return res.status(400).json({ error: 'Nie podano ścieżki do pliku scenariusza' });
    }
    
    const scriptPath = req.body.scriptPath;
    
    if (!fs.existsSync(scriptPath)) {
      return res.status(404).json({ error: 'Plik scenariusza nie istnieje pod podaną ścieżką' });
    }
    
    console.log(`Analizowanie pliku: ${scriptPath}`);
    
    // Parsuj scenariusz
    const parsedScript = await scriptParser.parseScript(scriptPath);
    
    // Generuj ID scenariusza
    const scriptId = path.basename(scriptPath, '.pdf');
    
    // Dodaj analizę emocjonalną ML
    const scriptWithML = {
      ...parsedScript,
      analysis: {
        emotions: {
          overallSentiment: 0.2,
          overallIntensity: 0.7,
          dominantEmotions: ["suspense", "excitement"],
          scenesEmotions: parsedScript.scenes.map((scene, index) => ({
            sceneIndex: index,
            sentiment: Math.random() * 2 - 1, // przykładowy sentyment od -1 do 1
            intensity: Math.random(),         // przykładowa intensywność od 0 do 1
            emotions: ["tension", "surprise"]
          }))
        },
        relationships: [
          {
            character1: parsedScript.metadata.uniqueCharacters[0] || "Nieznany",
            character2: parsedScript.metadata.uniqueCharacters[1] || "Nieznany",
            type: "tension",
            strength: 0.8,
            description: "Napięta relacja oparta na konflikcie"
          }
        ],
        globalStats: {
          dominantEmotions: ["suspense", "excitement"],
          pacing: "fast"
        }
      }
    };
    
    // Zapisz wyniki analizy
    const outputPath = path.join(__dirname, 'parsed_analyses', `${scriptId}.json`);
    fs.writeFileSync(outputPath, JSON.stringify(scriptWithML, null, 2));
    
    console.log(`Zapisano analizę do: ${outputPath}`);
    
    // Zwróć podsumowanie analizy
    res.json(scriptWithML);
  } catch (error) {
    console.error('Błąd podczas analizy scenariusza:', error);
    res.status(500).json({ error: 'Wystąpił błąd podczas analizy scenariusza: ' + error.message });
  }
});

/**
 * @route GET /api/analysis/character/:scriptId/:characterName
 * @desc Pobierz analizę konkretnej postaci
 * @access Public
 */
router.get('/character/:scriptId/:characterName', async (req, res) => {
  try {
    const { scriptId, characterName } = req.params;
    
    // Sprawdź, czy istnieje już przeanalizowany plik scenariusza
    const analysisFilePath = path.join(__dirname, 'parsed_analyses', `${scriptId}.json`);
    
    let parsedScript;
    if (fs.existsSync(analysisFilePath)) {
      // Jeśli analizowany plik istnieje, wczytaj go
      const fileData = fs.readFileSync(analysisFilePath, 'utf8');
      parsedScript = JSON.parse(fileData);
    } else {
      // Jeśli nie istnieje, zwróć błąd
      return res.status(404).json({ error: 'Scenariusz nie został jeszcze przeanalizowany' });
    }
    
    // Znajdź sceny z udziałem postaci
    const characterScenes = parsedScript.scenes.filter(scene => 
      scene.cast?.includes(characterName)
    );
    
    if (characterScenes.length === 0) {
      return res.status(404).json({ error: 'Postać o podanej nazwie nie występuje w scenariuszu' });
    }
    
    // Znajdź dialogi postaci
    const dialogues = [];
    characterScenes.forEach(scene => {
      if (scene.dialogue) {
        scene.dialogue.forEach(dialogue => {
          if (dialogue.character === characterName) {
            dialogues.push({
              sceneNumber: scene.sceneNumber,
              text: dialogue.text,
              sentiment: 0 // przykładowy sentyment
            });
          }
        });
      }
    });
    
    // Znajdź relacje postaci
    const relationships = (parsedScript.analysis?.relationships || [])
      .filter(rel => rel.character1 === characterName || rel.character2 === characterName)
      .map(rel => ({
        with: rel.character1 === characterName ? rel.character2 : rel.character1,
        type: rel.type,
        strength: rel.strength,
        dominantEmotion: "tension" // przykładowa emocja
      }));
    
    // Zwróć analizę postaci
    res.json({
      character: characterName,
      scenesCount: characterScenes.length,
      dialoguesCount: dialogues.length,
      relationships,
      emotions: {
        "joy": 0.2,
        "anger": 0.3,
        "surprise": 0.5
      },
      sceneNumbers: characterScenes.map(scene => scene.sceneNumber)
    });
  } catch (error) {
    console.error('Błąd podczas analizy postaci:', error);
    res.status(500).json({ error: 'Wystąpił błąd podczas analizy postaci: ' + error.message });
  }
});

// Pomocnicza funkcja do obliczenia łącznej liczby postaci
function calculateTotalCharacters(scenes) {
  const allCharacters = new Set();
  scenes.forEach(scene => {
    if (scene.cast) {
      scene.cast.forEach(character => allCharacters.add(character));
    }
  });
  return allCharacters.size;
}

module.exports = router; 