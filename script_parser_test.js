const fs = require('fs');
const path = require('path');
const pdfParse = require('pdf-parse');

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
    const patterns = {
      sceneHeader: [
        /^(?:SCENA\s+)?([\d]+[A-Z]?)\.\s*((?:INT|EXT|INT\/EXT|EXT\/INT)[\.|\s|-]+)([^-\n]+?)(?:[-|\s]+)((?:DZIEŃ|NOC|ŚWIT|ZMIERZCH|WSCHÓD|ZACHÓD))/i,
        /^([\d]+[A-Z]?)[\.\s]+((?:WNĘTRZE|PLENER|WNĘTRZE\/PLENER|PLENER\/WNĘTRZE)[\.|\s|-]+)([^-\n]+?)(?:[-|\s]+)((?:DZIEŃ|NOC|ŚWIT|ZMIERZCH|WSCHÓD|ZACHÓD))/i
      ],
      character: /^([A-ZĘÓĄŚŁŻŹĆŃ][A-ZĘÓĄŚŁŻŹĆŃ\s\-]+)(?:\(([^\)]+)\))?\s*$/,
      dialogue: /^([A-ZĘÓĄŚŁŻŹĆŃ][A-ZĘÓĄŚŁŻŹĆŃ\s\-]+):\s*(.+)/
    };

    const scenes = [];
    let currentScene = null;
    let sceneCount = 0;

    for (const line of lines) {
      // Sprawdź nagłówek sceny
      let sceneMatch = null;
      for (const pattern of patterns.sceneHeader) {
        const match = line.match(pattern);
        if (match) {
          sceneMatch = match;
          sceneCount++;
          console.log(`Znaleziono scenę #${sceneCount}: ${line}`);
          break;
        }
      }

      if (sceneMatch) {
        if (currentScene) {
          scenes.push(currentScene);
        }
        
        currentScene = {
          sceneNumber: sceneMatch[1],
          location: {
            type: sceneMatch[2].trim(),
            name: sceneMatch[3].trim()
          },
          timeOfDay: sceneMatch[4],
          cast: new Set(),
          dialogue: []
        };
        continue;
      }

      if (!currentScene) continue;

      // Sprawdź postacie i dialogi
      const characterMatch = line.match(patterns.character);
      const dialogueMatch = line.match(patterns.dialogue);

      if (characterMatch) {
        currentScene.cast.add(characterMatch[1].trim());
      } else if (dialogueMatch) {
        currentScene.cast.add(dialogueMatch[1].trim());
        currentScene.dialogue.push({
          character: dialogueMatch[1].trim(),
          text: dialogueMatch[2].trim()
        });
      }
    }

    // Dodaj ostatnią scenę
    if (currentScene) {
      scenes.push(currentScene);
    }

    // Konwertuj Set na Array dla każdej sceny
    scenes.forEach(scene => {
      scene.cast = Array.from(scene.cast);
    });

    console.log(`Parsowanie zakończone. Znaleziono ${scenes.length} scen.`);
    return scenes;
  } catch (error) {
    console.error('Błąd podczas parsowania:', error);
    throw error;
  }
}

// Ścieżka do pliku scenariusza
const scriptPath = path.join(__dirname, 'XMPS', 'DRUGA-FURIOZA 050624.pdf');
console.log(`Ścieżka do pliku: ${scriptPath}`);

// Parsuj scenariusz i wyświetl wyniki
parseScript(scriptPath)
  .then(scenes => {
    console.log('Liczba scen:', scenes.length);
    console.log('\nPrzykładowe sceny:');
    scenes.slice(0, 3).forEach(scene => {
      console.log('\nScena:', scene.sceneNumber);
      console.log('Lokacja:', scene.location.type, '-', scene.location.name);
      console.log('Pora dnia:', scene.timeOfDay);
      console.log('Obsada:', scene.cast.join(', '));
      console.log('Liczba dialogów:', scene.dialogue.length);
    });
    
    // Zapisz wyniki do pliku
    const outputFile = path.join(__dirname, 'parsed_scenes.json');
    fs.writeFileSync(outputFile, JSON.stringify(scenes, null, 2));
    console.log(`\nWyniki zostały zapisane do pliku: ${outputFile}`);
  })
  .catch(error => {
    console.error('Błąd:', error);
  }); 