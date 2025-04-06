/**
 * Moduł zawierający routy API dla zaawansowanej analizy emocjonalnej
 */
const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const scriptParser = require('./script_parser_updated');
const mlAnalyzer = require('./ml_analyzer');

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
        emotions: scene.analysis.emotions,
        sentiment: scene.analysis.sentiment,
        context: scene.analysis.context || {}
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
      relationships: parsedScript.analysis.relationships || []
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
      turningPoints: parsedScript.analysis.turningPoints || []
    });
  } catch (error) {
    console.error('Błąd podczas analizy punktów zwrotnych:', error);
    res.status(500).json({ error: 'Wystąpił błąd podczas analizy punktów zwrotnych' });
  }
});

/**
 * @route POST /api/analysis/full/:scriptId
 * @desc Przeprowadź pełną analizę scenariusza
 * @access Public
 */
router.post('/full', async (req, res) => {
  try {
    // Sprawdź, czy przesłano plik
    if (!req.files || !req.files.script) {
      return res.status(400).json({ error: 'Nie przesłano pliku scenariusza' });
    }
    
    const scriptFile = req.files.script;
    const scriptId = path.basename(scriptFile.name, '.pdf');
    
    // Zapisz plik tymczasowo
    const tempPath = path.join(__dirname, 'temp', scriptFile.name);
    
    // Utwórz katalog temp, jeśli nie istnieje
    if (!fs.existsSync(path.join(__dirname, 'temp'))) {
      fs.mkdirSync(path.join(__dirname, 'temp'), { recursive: true });
    }
    
    // Zapisz plik
    await scriptFile.mv(tempPath);
    
    // Parsuj scenariusz
    const parsedScript = await scriptParser.parseScript(tempPath);
    
    // Utwórz katalog na analizy, jeśli nie istnieje
    if (!fs.existsSync(path.join(__dirname, 'parsed_analyses'))) {
      fs.mkdirSync(path.join(__dirname, 'parsed_analyses'), { recursive: true });
    }
    
    // Zapisz wyniki analizy
    const outputPath = path.join(__dirname, 'parsed_analyses', `${scriptId}.json`);
    fs.writeFileSync(outputPath, JSON.stringify(parsedScript, null, 2));
    
    // Usuń plik tymczasowy
    fs.unlinkSync(tempPath);
    
    // Zwróć podsumowanie analizy
    res.json({
      scriptId,
      title: parsedScript.title,
      scenesCount: parsedScript.scenes.length,
      charactersCount: calculateTotalCharacters(parsedScript.scenes),
      relationshipsCount: parsedScript.analysis.relationships ? parsedScript.analysis.relationships.length : 0,
      turningPointsCount: parsedScript.analysis.turningPoints ? parsedScript.analysis.turningPoints.length : 0,
      dominantEmotions: parsedScript.analysis.globalStats.dominantEmotions,
      pacing: parsedScript.analysis.globalStats.pacing
    });
  } catch (error) {
    console.error('Błąd podczas analizy scenariusza:', error);
    res.status(500).json({ error: 'Wystąpił błąd podczas analizy scenariusza' });
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
      scene.cast.includes(characterName)
    );
    
    if (characterScenes.length === 0) {
      return res.status(404).json({ error: 'Postać o podanej nazwie nie występuje w scenariuszu' });
    }
    
    // Znajdź dialogi postaci
    const dialogues = [];
    characterScenes.forEach(scene => {
      scene.dialogue.forEach(dialogue => {
        if (dialogue.character === characterName) {
          dialogues.push({
            sceneNumber: scene.sceneNumber,
            text: dialogue.text,
            sentiment: mlAnalyzer.analyzeSentiment(dialogue.text)
          });
        }
      });
    });
    
    // Znajdź relacje postaci
    const relationships = (parsedScript.analysis.relationships || [])
      .filter(rel => rel.characters.includes(characterName))
      .map(rel => ({
        with: rel.characters[0] === characterName ? rel.characters[1] : rel.characters[0],
        type: rel.type,
        strength: rel.strength,
        sentiment: rel.sentiment,
        dominantEmotion: rel.dominantEmotion
      }));
    
    // Przeanalizuj emocje postaci
    const emotions = {};
    dialogues.forEach(dialogue => {
      const dialogueEmotions = mlAnalyzer.analyzeEmotions(dialogue.text);
      
      // Sumuj emocje ze wszystkich dialogów
      for (const [emotion, value] of Object.entries(dialogueEmotions)) {
        emotions[emotion] = (emotions[emotion] || 0) + value;
      }
    });
    
    // Normalizuj emocje
    const totalDialogues = dialogues.length;
    if (totalDialogues > 0) {
      for (const emotion in emotions) {
        emotions[emotion] /= totalDialogues;
      }
    }
    
    // Zwróć analizę postaci
    res.json({
      character: characterName,
      scenesCount: characterScenes.length,
      dialoguesCount: dialogues.length,
      relationships,
      emotions,
      sceneNumbers: characterScenes.map(scene => scene.sceneNumber)
    });
  } catch (error) {
    console.error('Błąd podczas analizy postaci:', error);
    res.status(500).json({ error: 'Wystąpił błąd podczas analizy postaci' });
  }
});

// Pomocnicza funkcja do obliczenia łącznej liczby postaci
function calculateTotalCharacters(scenes) {
  const allCharacters = new Set();
  scenes.forEach(scene => {
    scene.cast.forEach(character => allCharacters.add(character));
  });
  return allCharacters.size;
}

module.exports = router; 