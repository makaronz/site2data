# Raport: Refaktoryzacja ScriptParser

- **Czas:** 2025-04-25T13:53:00+02:00

- **Pliki dotknięte:** 
  - `backend/src/utils/scriptParser.js`
  - `backend/src/controllers/scriptController.js`

- **Podsumowanie:**
  - Przeprowadzono analizę i refaktoryzację modułu scriptParser.js, który jest odpowiedzialny za parsowanie scenariuszy filmowych z plików PDF.
  - Dodano dokumentację JSDoc do wszystkich metod.
  - Poprawiono obsługę błędów.
  - Zrefaktoryzowano duplikację kodu poprzez wyodrębnienie wspólnej logiki.
  - Zmieniono eksport na eksport klasy zamiast instancji, co ułatwi testowanie.
  - Dodano walidację danych wejściowych.
  - Usunięto zbędną funkcję testParse z scriptController.js.

- **Zmiany w scriptParser.js:**

```javascript
const pdfParse = require('pdf-parse');
const fs = require('fs');

/**
 * Klasa odpowiedzialna za parsowanie scenariuszy filmowych z plików PDF.
 * Obsługuje różne formaty scenariuszy i ekstrahuje sceny, postacie, dialogi, rekwizyty, pojazdy, statystów i specjalne wymagania.
 */
class ScriptParser {
  /**
   * Inicjalizuje parser z wzorcami do rozpoznawania różnych elementów scenariusza.
   */
  constructor() {
    // Wzorce do rozpoznawania różnych formatów scenariuszy
    this.patterns = {
      // Format 1: INT/EXT. LOCATION - TIME OF DAY
      standardSceneHeader: [
        /^(?:SCENA\s+)?([\d]+[A-Z]?)\.\s*((?:INT|EXT|INT\/EXT|EXT\/INT)[\.|\s|-]+)([^-\n]+?)(?:[-|\s]+)((?:DZIEŃ|NOC|ŚWIT|ZMIERZCH|WSCHÓD|ZACHÓD))/i,
        /^([\d]+[A-Z]?)[\.\s]+((?:WNĘTRZE|PLENER|WNĘTRZE\/PLENER|PLENER\/WNĘTRZE)[\.|\s|-]+)([^-\n]+?)(?:[-|\s]+)((?:DZIEŃ|NOC|ŚWIT|ZMIERZCH|WSCHÓD|ZACHÓD))/i
      ],
      // Format 2: LOCATION - TIME OF DAY (następnie numer sceny w kolejnej linii)
      locationTime: /^([A-ZĘÓĄŚŁŻŹĆŃPL\.\s]+)\s*-\s*(DZIEŃ|NOC|ŚWIT|ZMIERZCH|WSCHÓD|ZACHÓD)\.*$/i,
      // Pasuje do samego numeru sceny (np. "1" lub "1A")
      sceneNumber: /^(\d+[A-Z]?)$/,
      // Pasuje do postaci mówiącej
      character: /^([A-ZĘÓĄŚŁŻŹĆŃ][A-ZĘÓĄŚŁŻŹĆŃ\s\-]+)(?:\(([^\)]+)\))?:?\s*$/,
      // Pasuje do dialogu postaci
      dialogue: /^([A-ZĘÓĄŚŁŻŹĆŃ][A-ZĘÓĄŚŁŻŹĆŃ\s\-]+):\s*(.+)/,
      // Dodatkowe wzorce dla innych elementów
      prop: /REKWIZYT(?:Y)?:\s*(.+)/i,
      vehicle: /POJAZD(?:Y)?:\s*(.+)/i,
      extras: /STATYST(?:A|CI|ÓW)?:\s*(.+)/i,
      special: /UWAG(?:A|I):\s*(.+)/i
    };
  }

  /**
   * Parsuje plik scenariusza i zwraca strukturę danych reprezentującą scenariusz.
   * @param {string} filePath - Ścieżka do pliku PDF ze scenariuszem.
   * @returns {Promise<Object>} - Obiekt reprezentujący sparsowany scenariusz.
   * @throws {Error} - Błąd, jeśli plik nie istnieje lub nie może być sparsowany.
   */
  async parse(filePath) {
    if (!filePath) {
      throw new Error('Nie podano ścieżki do pliku scenariusza');
    }

    if (!fs.existsSync(filePath)) {
      throw new Error('Plik scenariusza nie istnieje');
    }

    try {
      const dataBuffer = fs.readFileSync(filePath);
      const data = await pdfParse(dataBuffer);
      
      const lines = data.text
        .replace(/\r\n/g, '\n')
        .split('\n')
        .map(line => line.trim())
        .filter(line => line.length > 0);

      if (lines.length === 0) {
        throw new Error('Plik scenariusza jest pusty');
      }

      // Wykrywanie formatu scenariusza na podstawie pierwszych 100 linii
      const format = this._detectScriptFormat(lines.slice(0, 100));
      console.log(`Wykryty format scenariusza: ${format}`);
      
      // Wybór metody parsowania
      let scenes = [];
      if (format === 'standard') {
        scenes = this._parseStandardFormat(lines);
      } else if (format === 'location-time-number') {
        scenes = this._parseLocationTimeNumberFormat(lines);
      } else {
        console.warn('Nieznany format scenariusza, próbuję parsować w standardowym formacie');
        scenes = this._parseStandardFormat(lines);
      }

      // Metadane
      const uniqueCharacters = new Set();
      let totalDialogues = 0;

      scenes.forEach(scene => {
        scene.cast.forEach(character => uniqueCharacters.add(character));
        totalDialogues += scene.dialogue.length;
      });

      return {
        title: this.extractTitle(lines),
        version: this.extractVersion(lines),
        date: new Date(),
        scenes: scenes,
        metadata: {
          totalScenes: scenes.length,
          uniqueCharacters: Array.from(uniqueCharacters),
          totalDialogues: totalDialogues
        }
      };
    } catch (error) {
      console.error('Błąd podczas parsowania:', error);
      throw new Error(`Błąd podczas parsowania scenariusza: ${error.message}`);
    }
  }

  /**
   * Wykrywa format scenariusza na podstawie próbki linii.
   * @param {string[]} lines - Próbka linii ze scenariusza.
   * @returns {string} - Wykryty format scenariusza ('standard' lub 'location-time-number').
   * @private
   */
  _detectScriptFormat(lines) {
    // Sprawdza format na podstawie próbki linii
    let standardFormatCount = 0;
    let locationTimeFormatCount = 0;
    
    for (let i = 0; i < lines.length; i++) {
      // Sprawdź format standardowy (numer sceny + INT/EXT + lokacja + pora dnia)
      for (const pattern of this.patterns.standardSceneHeader) {
        if (pattern.test(lines[i])) {
          standardFormatCount++;
          break;
        }
      }
      
      // Sprawdź format "lokacja - pora dnia" + numer sceny
      if (this.patterns.locationTime.test(lines[i]) && 
          i+1 < lines.length && 
          this.patterns.sceneNumber.test(lines[i+1])) {
        locationTimeFormatCount++;
      }
    }
    
    if (standardFormatCount > locationTimeFormatCount) {
      return 'standard';
    } else if (locationTimeFormatCount > 0) {
      return 'location-time-number';
    }
    
    return 'standard'; // Domyślnie zwróć standardowy format
  }

  /**
   * Parsuje scenariusz w standardowym formacie (numer sceny + INT/EXT + lokacja + pora dnia).
   * @param {string[]} lines - Linie ze scenariusza.
   * @returns {Object[]} - Tablica obiektów reprezentujących sceny.
   * @private
   */
  _parseStandardFormat(lines) {
    const scenes = [];
    let currentScene = null;
    let description = [];

    for (const line of lines) {
      let sceneMatch = null;
      
      // Sprawdź nagłówek sceny
      for (const pattern of this.patterns.standardSceneHeader) {
        const match = line.match(pattern);
        if (match) {
          sceneMatch = match;
          break;
        }
      }

      if (sceneMatch) {
        if (currentScene) {
          currentScene.description = description.join(' ');
          scenes.push(currentScene);
          description = [];
        }
        
        currentScene = this._createNewScene({
          sceneNumber: sceneMatch[1],
          locationType: sceneMatch[2].trim(),
          locationName: sceneMatch[3].trim(),
          timeOfDay: sceneMatch[4]
        });
        continue;
      }

      if (!currentScene) continue;

      // Przetwarzanie linii w kontekście bieżącej sceny
      this._processSceneLine(line, currentScene, description);
    }

    // Dodaj ostatnią scenę
    if (currentScene) {
      currentScene.description = description.join(' ');
      scenes.push(currentScene);
    }

    // Konwertuj Set na Array dla każdej sceny
    scenes.forEach(scene => {
      scene.cast = Array.from(scene.cast);
    });

    return scenes;
  }

  /**
   * Parsuje scenariusz w formacie "lokacja - pora dnia" + numer sceny.
   * @param {string[]} lines - Linie ze scenariusza.
   * @returns {Object[]} - Tablica obiektów reprezentujących sceny.
   * @private
   */
  _parseLocationTimeNumberFormat(lines) {
    const scenes = [];
    let currentScene = null;
    let potentialLocation = null;
    let potentialTimeOfDay = null;
    let waitingForSceneNumber = false;
    let description = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      // Sprawdź czy linia zawiera lokację i porę dnia
      const locationTimeMatch = line.match(this.patterns.locationTime);
      if (locationTimeMatch) {
        potentialLocation = locationTimeMatch[1].trim();
        potentialTimeOfDay = locationTimeMatch[2].trim();
        waitingForSceneNumber = true;
        continue;
      }
      
      // Jeśli oczekujemy numeru sceny, sprawdź czy następna linia to numer
      if (waitingForSceneNumber) {
        const sceneNumberMatch = line.match(this.patterns.sceneNumber);
        if (sceneNumberMatch) {
          // Znaleźliśmy nagłówek sceny (lokacja + pora dnia + numer)
          if (currentScene) {
            currentScene.description = description.join(' ');
            scenes.push(currentScene);
            description = [];
          }
          
          const sceneNumber = sceneNumberMatch[1];
          
          currentScene = this._createNewScene({
            sceneNumber: sceneNumber,
            locationType: 'NIEOKREŚLONY',
            locationName: potentialLocation,
            timeOfDay: potentialTimeOfDay
          });
          
          waitingForSceneNumber = false;
          continue;
        }
      }

      if (!currentScene) {
        waitingForSceneNumber = false;
        continue;
      }

      // Przetwarzanie linii w kontekście bieżącej sceny
      const result = this._processSceneLine(line, currentScene, description);
      
      // Specjalna obsługa dla formatu location-time-number
      if (result.isCharacter && i + 1 < lines.length && !this._isCharacterLine(lines[i + 1])) {
        currentScene.dialogue.push({
          character: result.character,
          text: lines[i + 1].trim()
        });
        i++; // Przeskocz następną linię, bo już ją przetworzyliśmy
      }
    }

    // Dodaj ostatnią scenę
    if (currentScene) {
      currentScene.description = description.join(' ');
      scenes.push(currentScene);
    }

    // Konwertuj Set na Array dla każdej sceny
    scenes.forEach(scene => {
      scene.cast = Array.from(scene.cast);
    });

    return scenes;
  }

  /**
   * Tworzy nowy obiekt sceny.
   * @param {Object} params - Parametry sceny.
   * @param {string} params.sceneNumber - Numer sceny.
   * @param {string} params.locationType - Typ lokacji (INT/EXT).
   * @param {string} params.locationName - Nazwa lokacji.
   * @param {string} params.timeOfDay - Pora dnia.
   * @returns {Object} - Nowy obiekt sceny.
   * @private
   */
  _createNewScene({ sceneNumber, locationType, locationName, timeOfDay }) {
    return {
      sceneNumber: sceneNumber,
      location: {
        type: locationType,
        name: locationName
      },
      timeOfDay: timeOfDay,
      cast: new Set(),
      dialogue: [],
      props: [],
      vehicles: [],
      extras: [],
      specialRequirements: []
    };
  }

  /**
   * Sprawdza, czy linia zawiera postać.
   * @param {string} line - Linia do sprawdzenia.
   * @returns {boolean} - Czy linia zawiera postać.
   * @private
   */
  _isCharacterLine(line) {
    return this.patterns.character.test(line) || this.patterns.dialogue.test(line);
  }

  /**
   * Przetwarza linię w kontekście bieżącej sceny.
   * @param {string} line - Linia do przetworzenia.
   * @param {Object} currentScene - Bieżąca scena.
   * @param {string[]} description - Tablica linii opisu.
   * @returns {Object} - Obiekt z informacją, czy linia zawiera postać i jaka to postać.
   * @private
   */
  _processSceneLine(line, currentScene, description) {
    const result = { isCharacter: false, character: null };
    
    // Sprawdź postacie i dialogi
    const characterMatch = line.match(this.patterns.character);
    const dialogueMatch = line.match(this.patterns.dialogue);
    const propMatch = line.match(this.patterns.prop);
    const vehicleMatch = line.match(this.patterns.vehicle);
    const extrasMatch = line.match(this.patterns.extras);
    const specialMatch = line.match(this.patterns.special);

    if (characterMatch && !line.includes(':')) {
      const character = characterMatch[1].trim();
      currentScene.cast.add(character);
      result.isCharacter = true;
      result.character = character;
    } else if (dialogueMatch) {
      const character = dialogueMatch[1].trim();
      const text = dialogueMatch[2].trim();
      currentScene.cast.add(character);
      currentScene.dialogue.push({
        character: character,
        text: text
      });
    } else if (propMatch) {
      const props = propMatch[1].split(',').map(prop => {
        const [name, ...desc] = prop.trim().split(/\s+/);
        return {
          name: name,
          description: desc.join(' '),
          quantity: 1
        };
      });
      currentScene.props.push(...props);
    } else if (vehicleMatch) {
      const vehicles = vehicleMatch[1].split(',').map(vehicle => {
        const [type, ...desc] = vehicle.trim().split(/\s+/);
        return {
          type: type,
          description: desc.join(' '),
          quantity: 1
        };
      });
      currentScene.vehicles.push(...vehicles);
    } else if (extrasMatch) {
      const extras = extrasMatch[1].split(',').map(extra => {
        const parts = extra.trim().match(/(\d+)?\s*(.+)/);
        return {
          type: parts[2],
          quantity: parts[1] ? parseInt(parts[1]) : 1,
          description: ''
        };
      });
      currentScene.extras.push(...extras);
    } else if (specialMatch) {
      currentScene.specialRequirements.push(specialMatch[1].trim());
    } else {
      description.push(line);
    }

    return result;
  }

  /**
   * Ekstrahuje tytuł scenariusza z pierwszych linii.
   * @param {string[]} lines - Linie ze scenariusza.
   * @returns {string} - Tytuł scenariusza.
   */
  extractTitle(lines) {
    // Próba znalezienia tytułu w pierwszych liniach
    for (let i = 0; i < Math.min(10, lines.length); i++) {
      if (lines[i].toUpperCase() === lines[i] && lines[i].length > 3) {
        return lines[i];
      }
    }
    return 'Untitled Script';
  }

  /**
   * Ekstrahuje wersję scenariusza z pierwszych linii.
   * @param {string[]} lines - Linie ze scenariusza.
   * @returns {string} - Wersja scenariusza.
   */
  extractVersion(lines) {
    // Próba znalezienia wersji w pierwszych liniach
    const versionPattern = /(?:wersja|version|v\.?)\s*[:.]?\s*([\d\.]+)/i;
    for (let i = 0; i < Math.min(20, lines.length); i++) {
      const match = lines[i].match(versionPattern);
      if (match) {
        return match[1];
      }
    }
    return '1.0';
  }
}

module.exports = ScriptParser;
```

- **Zmiany w scriptController.js:**

```javascript
const ScriptParser = require('../utils/scriptParser');
const Script = require('../models/ScriptModel');
const fs = require('fs');
const path = require('path');

class ScriptController {
  async parseScript(req, res) {
    try {
      const { filePath } = req.body;

      if (!filePath) {
        return res.status(400).json({
          success: false,
          message: 'Nie podano ścieżki do pliku scenariusza'
        });
      }

      if (!fs.existsSync(filePath)) {
        return res.status(404).json({
          success: false,
          message: 'Plik scenariusza nie istnieje'
        });
      }

      const scriptParser = new ScriptParser();
      const parsedScript = await scriptParser.parse(filePath);
      
      // Zapisz sparsowany scenariusz w bazie danych
      const script = new Script(parsedScript);
      await script.save();

      res.status(200).json({
        success: true,
        message: 'Scenariusz został pomyślnie sparsowany i zapisany',
        data: script
      });
    } catch (error) {
      console.error('Błąd podczas parsowania scenariusza:', error);
      res.status(500).json({
        success: false,
        message: 'Wystąpił błąd podczas parsowania scenariusza',
        error: error.message
      });
    }
  }

  async getScripts(req, res) {
    try {
      const scripts = await Script.find()
        .select('title version date metadata')
        .sort('-date');

      res.status(200).json({
        success: true,
        data: scripts
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Błąd podczas pobierania listy scenariuszy',
        error: error.message
      });
    }
  }

  async getScriptById(req, res) {
    try {
      const { id } = req.params;
      const script = await Script.findById(id);

      if (!script) {
        return res.status(404).json({
          success: false,
          message: 'Scenariusz nie został znaleziony'
        });
      }

      res.status(200).json({
        success: true,
        data: script
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Błąd podczas pobierania scenariusza',
        error: error.message
      });
    }
  }

  async updateScript(req, res) {
    try {
      const { id } = req.params;
      const updates = req.body;

      const script = await Script.findByIdAndUpdate(id, updates, {
        new: true,
        runValidators: true
      });

      if (!script) {
        return res.status(404).json({
          success: false,
          message: 'Scenariusz nie został znaleziony'
        });
      }

      res.status(200).json({
        success: true,
        message: 'Scenariusz został zaktualizowany',
        data: script
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Błąd podczas aktualizacji scenariusza',
        error: error.message
      });
    }
  }

  async deleteScript(req, res) {
    try {
      const { id } = req.params;
      const script = await Script.findByIdAndDelete(id);

      if (!script) {
        return res.status(404).json({
          success: false,
          message: 'Scenariusz nie został znaleziony'
        });
      }

      res.status(200).json({
        success: true,
        message: 'Scenariusz został usunięty',
        data: script
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Błąd podczas usuwania scenariusza',
        error: error.message
      });
    }
  }

  async getScriptStatistics(req, res) {
    try {
      const { id } = req.params;
      const script = await Script.findById(id);

      if (!script) {
        return res.status(404).json({
          success: false,
          message: 'Scenariusz nie został znaleziony'
        });
      }

      const statistics = {
        totalScenes: script.metadata.totalScenes,
        totalCharacters: script.metadata.uniqueCharacters.length,
        totalDialogues: script.metadata.totalDialogues,
        scenesByTimeOfDay: {},
        scenesByLocationType: {},
        charactersWithMostDialogues: []
      };

      // Oblicz statystyki dla pory dnia
      script.scenes.forEach(scene => {
        statistics.scenesByTimeOfDay[scene.timeOfDay] = 
          (statistics.scenesByTimeOfDay[scene.timeOfDay] || 0) + 1;
        
        statistics.scenesByLocationType[scene.location.type] = 
          (statistics.scenesByLocationType[scene.location.type] || 0) + 1;
      });

      // Oblicz statystyki dialogów dla postaci
      const characterDialogues = {};
      script.scenes.forEach(scene => {
        scene.dialogue.forEach(d => {
          characterDialogues[d.character] = 
            (characterDialogues[d.character] || 0) + 1;
        });
      });

      statistics.charactersWithMostDialogues = Object.entries(characterDialogues)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 10)
        .map(([character, count]) => ({ character, dialogueCount: count }));

      res.status(200).json({
        success: true,
        data: statistics
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Błąd podczas pobierania statystyk',
        error: error.message
      });
    }
  }
}

module.exports = new ScriptController();
```

- **Uzasadnienie zmian:**

1. **Dodanie dokumentacji JSDoc:**
   - Dodano dokumentację do wszystkich metod, co ułatwi zrozumienie kodu i jego utrzymanie.
   - Opisano parametry, zwracane wartości i potencjalne błędy.

2. **Poprawa obsługi błędów:**
   - Dodano walidację danych wejściowych w metodzie parse().
   - Dodano bardziej szczegółowe komunikaty błędów.
   - Dodano obsługę przypadku, gdy plik jest pusty.

3. **Refaktoryzacja duplikacji kodu:**
   - Wyodrębniono wspólną logikę do metod _createNewScene() i _processSceneLine().
   - Poprawiono czytelność kodu przez wyodrębnienie złożonych operacji do osobnych metod.

4. **Zmiana eksportu:**
   - Zmieniono eksport z instancji na eksport klasy, co ułatwi testowanie.
   - Zaktualizowano scriptController.js, aby tworzył instancję ScriptParser.

5. **Usunięcie zbędnej funkcji testParse:**
   - Usunięto funkcję testParse z scriptController.js, która była zbędna.
   - Uproszczono eksport kontrolera.

- **Następne kroki:**

1. Aktualizacja testów jednostkowych, aby uwzględniały nowe API.
2. Rozważenie dodania bardziej zaawansowanych technik NLP do analizy scenariuszy.
3. Optymalizacja wydajności dla dużych plików PDF.
4. Dodanie obsługi większej liczby formatów scenariuszy.