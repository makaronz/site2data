const fs = require('fs');
const path = require('path');
const pdfParse = require('pdf-parse');
const mlAnalyzer = require('./ml_analyzer');

async function parseScript(filePath) {
  try {
    console.log(`Parsowanie pliku: ${filePath}`);
    
    // Sprawdź czy plik istnieje
    if (!fs.existsSync(filePath)) {
      throw new Error(`Plik nie istnieje: ${filePath}`);
    }
    
    const dataBuffer = fs.readFileSync(filePath);
    console.log(`Wczytano ${dataBuffer.length} bajtów`);
    
    const data = await pdfParse(dataBuffer);
    console.log(`Pomyślnie sparsowano PDF, tekst: ${data.text.length} znaków`);
    
    // Podziel tekst na linie i usuń puste
    const lines = data.text
      .replace(/\r\n/g, '\n')
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0);
    
    console.log(`Liczba linii: ${lines.length}`);

    // Wzorce do rozpoznawania elementów scenariusza
    // Format nagłówka sceny: "PL. AUTOSTRADA - DZIEŃ." (lokacja - pora dnia) a następnie numer sceny w nowej linii
    const patterns = {
      // Ta wersja pasuje do "PL. AUTOSTRADA - DZIEŃ."
      locationTime: /^([A-ZĘÓĄŚŁŻŹĆŃPL\.\s]+)\s*-\s*(DZIEŃ|NOC|ŚWIT|ZMIERZCH|WSCHÓD|ZACHÓD)\.*$/i,
      // Pasuje do samego numeru sceny (np. "1" lub "1A")
      sceneNumber: /^(\d+[A-Z]?)$/,
      // Pasuje do postaci mówiącej
      character: /^([A-ZĘÓĄŚŁŻŹĆŃ][A-ZĘÓĄŚŁŻŹĆŃ\s\-]+)(?:\(([^\)]+)\))?:?\s*$/,
      // Pasuje do dialogu postaci
      dialogue: /^([A-ZĘÓĄŚŁŻŹĆŃ][A-ZĘÓĄŚŁŻŹĆŃ\s\-]+):\s*(.+)/,
      // Pasuje do rekwizytów (np. "REKWIZYT: telefon")
      prop: /^REKWIZYT:\s*(.+)/i,
      // Pasuje do tonacji emocjonalnej (np. "TONACJA: napięta")
      mood: /^TONACJA:\s*(.+)/i,
      // Pasuje do punktów zwrotnych (np. "PUNKT ZWROTNY: konfrontacja")
      turningPoint: /^PUNKT ZWROTNY:\s*(.+)/i
    };

    const scenes = [];
    let currentScene = null;
    let potentialLocation = null;
    let potentialTimeOfDay = null;
    let waitingForSceneNumber = false;
    let sceneCount = 0;
    let description = [];
    let props = [];
    let mood = null;
    let scenePoints = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      // Sprawdź czy linia zawiera lokację i porę dnia
      const locationTimeMatch = line.match(patterns.locationTime);
      if (locationTimeMatch) {
        potentialLocation = locationTimeMatch[1].trim();
        potentialTimeOfDay = locationTimeMatch[2].trim();
        waitingForSceneNumber = true;
        continue;
      }
      
      // Jeśli oczekujemy numeru sceny, sprawdź czy następna linia to numer
      if (waitingForSceneNumber) {
        const sceneNumberMatch = line.match(patterns.sceneNumber);
        if (sceneNumberMatch) {
          const sceneNumber = sceneNumberMatch[1];
          
          // Jeśli mamy poprzednią scenę, zapisz ją
          if (currentScene) {
            currentScene.description = description.join('\n');
            currentScene.props = props;
            currentScene.mood = mood;
            currentScene.turningPoints = scenePoints;
            scenes.push(currentScene);
          }
          
          // Utwórz nową scenę
          currentScene = {
            sceneNumber: sceneNumber,
            location: {
              type: "NIEOKREŚLONY",
              name: potentialLocation || "NIEZNANA"
            },
            timeOfDay: potentialTimeOfDay || "NIEZNANA",
            cast: new Set(),
            dialogue: [],
            description: "",
            props: [],
            mood: null,
            turningPoints: []
          };
          
          // Resetuj zmienne
          description = [];
          props = [];
          mood = null;
          scenePoints = [];
          potentialLocation = null;
          potentialTimeOfDay = null;
          waitingForSceneNumber = false;
          sceneCount++;
          continue;
        }
      }

      if (!currentScene) {
        waitingForSceneNumber = false;
        continue;
      }

      // Sprawdź postacie i dialogi
      const characterMatch = line.match(patterns.character);
      const dialogueMatch = line.match(patterns.dialogue);

      if (characterMatch && !line.includes(':')) {
        const character = characterMatch[1].trim();
        currentScene.cast.add(character);
        
        // Sprawdź czy następna linia to dialog tej postaci
        if (i + 1 < lines.length && !lines[i + 1].match(patterns.character)) {
          currentScene.dialogue.push({
            character: character,
            text: lines[i + 1].trim()
          });
          i++; // Przeskocz następną linię, bo już ją przetworzyliśmy
        }
      } else if (dialogueMatch) {
        const character = dialogueMatch[1].trim();
        const text = dialogueMatch[2].trim();
        currentScene.cast.add(character);
        currentScene.dialogue.push({
          character: character,
          text: text
        });
      } else {
        // Jeśli nie jest to postać ani dialog, to pewnie opis sceny
        description.push(line);
      }

      // Sprawdź rekwizyty
      const propMatch = line.match(patterns.prop);
      if (propMatch) {
        const prop = propMatch[1].trim();
        currentScene.props.push(prop);
      }

      // Sprawdź tonację emocjonalną
      const moodMatch = line.match(patterns.mood);
      if (moodMatch) {
        mood = moodMatch[1].trim();
      }

      // Sprawdź punkt zwrotny
      const turningPointMatch = line.match(patterns.turningPoint);
      if (turningPointMatch) {
        const turningPoint = turningPointMatch[1].trim();
        scenePoints.push(turningPoint);
      }
    }

    // Dodaj ostatnią scenę
    if (currentScene) {
      currentScene.description = description.join('\n');
      currentScene.props = props;
      currentScene.mood = mood;
      currentScene.turningPoints = scenePoints;
      scenes.push(currentScene);
    }

    // Konwertuj Set na Array dla każdej sceny
    scenes.forEach(scene => {
      scene.cast = Array.from(scene.cast);
    });

    console.log(`Parsowanie zakończone. Znaleziono ${scenes.length} scen.`);
    
    // Przygotuj metadane
    const uniqueCharacters = new Set();
    let totalDialogues = 0;

    scenes.forEach(scene => {
      scene.cast.forEach(character => uniqueCharacters.add(character));
      totalDialogues += scene.dialogue.length;
    });

    // Dodaj analizę ML dla każdej sceny
    for (let scene of scenes) {
      // Analiza sentymentu i emocji
      const sentiment = mlAnalyzer.analyzeSentiment(scene.description);
      const emotions = await mlAnalyzer.analyzeEmotions(scene.description);
      
      // Klasyfikacja sceny
      const classification = await mlAnalyzer.classifyScene(scene);
      
      // Dodaj wyniki analizy do sceny
      scene.analysis = {
        sentiment,
        emotions,
        classification
      };
    }

    // Znajdź punkty zwrotne w całym scenariuszu
    const storyTurningPoints = await mlAnalyzer.analyzeTurningPoints(scenes);

    // Zwróć wyniki w formacie JSON
    const result = {
      title: path.basename(filePath, '.pdf'),
      version: "1.0",
      date: new Date().toISOString(),
      scenes: scenes.map(scene => ({
        sceneNumber: scene.sceneNumber,
        location: scene.location,
        timeOfDay: scene.timeOfDay,
        cast: Array.from(scene.cast),
        dialogue: scene.dialogue,
        description: scene.description,
        props: scene.props,
        mood: scene.mood,
        turningPoints: scene.turningPoints,
        analysis: scene.analysis
      })),
      analysis: {
        turningPoints: storyTurningPoints,
        globalStats: {
          totalScenes: scenes.length,
          averageIntensity: scenes.reduce((sum, scene) => sum + scene.analysis.sentiment.intensity, 0) / scenes.length,
          dominantEmotions: calculateDominantEmotions(scenes),
          pacing: calculateOverallPacing(scenes)
        }
      }
    };

    return result;
  } catch (error) {
    console.error('Błąd podczas parsowania:', error);
    throw error;
  }
}

// Funkcje pomocnicze do analizy globalnej
function calculateDominantEmotions(scenes) {
  const emotionCounts = scenes.reduce((counts, scene) => {
    Object.entries(scene.analysis.emotions).forEach(([emotion, value]) => {
      counts[emotion] = (counts[emotion] || 0) + value;
    });
    return counts;
  }, {});

  return Object.entries(emotionCounts)
    .sort(([, a], [, b]) => b - a)
    .reduce((obj, [emotion, count]) => {
      obj[emotion] = count / scenes.length; // średnia na scenę
      return obj;
    }, {});
}

function calculateOverallPacing(scenes) {
  const pacingScores = {
    'szybkie': 3,
    'umiarkowane': 2,
    'wolne': 1
  };

  const averagePacing = scenes.reduce((sum, scene) => {
    return sum + pacingScores[scene.analysis.classification.pacing];
  }, 0) / scenes.length;

  if (averagePacing > 2.5) return 'szybkie';
  if (averagePacing > 1.5) return 'umiarkowane';
  return 'wolne';
}

// Ścieżka do pliku scenariusza
const scriptPath = path.join(__dirname, 'XMPS', 'DRUGA-FURIOZA 050624.pdf');
console.log(`Ścieżka do pliku: ${scriptPath}`);

// Parsuj scenariusz i wyświetl wyniki
parseScript(scriptPath)
  .then(result => {
    console.log('Liczba scen:', result.scenes.length);
    console.log('Tytuł:', result.title);
    console.log('Wersja:', result.version);
    
    console.log('\nPrzykładowe sceny:');
    result.scenes.slice(0, 5).forEach(scene => {
      console.log('\nScena:', scene.sceneNumber);
      console.log('Lokacja:', scene.location.name);
      console.log('Pora dnia:', scene.timeOfDay);
      console.log('Obsada:', scene.cast.join(', '));
      console.log('Liczba dialogów:', scene.dialogue.length);
      
      if (scene.dialogue.length > 0) {
        console.log('\nPrzykładowe dialogi:');
        scene.dialogue.slice(0, 3).forEach(d => {
          console.log(`${d.character}: ${d.text}`);
        });
      }
    });
    
    // Zapisz wyniki do pliku
    const outputFile = path.join(__dirname, 'parsed_script.json');
    fs.writeFileSync(outputFile, JSON.stringify(result, null, 2));
    console.log(`\nWyniki zostały zapisane do pliku: ${outputFile}`);
  })
  .catch(error => {
    console.error('Błąd:', error);
  });

module.exports = {
  parseScript
}; 