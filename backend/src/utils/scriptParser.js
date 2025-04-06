const pdfParse = require('pdf-parse');
const fs = require('fs');

class ScriptParser {
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

  async parse(filePath) {
    try {
      const dataBuffer = fs.readFileSync(filePath);
      const data = await pdfParse(dataBuffer);
      
      const lines = data.text
        .replace(/\r\n/g, '\n')
        .split('\n')
        .map(line => line.trim())
        .filter(line => line.length > 0);

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
      throw error;
    }
  }

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
        
        currentScene = {
          sceneNumber: sceneMatch[1],
          location: {
            type: sceneMatch[2].trim(),
            name: sceneMatch[3].trim()
          },
          timeOfDay: sceneMatch[4],
          cast: new Set(),
          dialogue: [],
          props: [],
          vehicles: [],
          extras: [],
          specialRequirements: []
        };
        continue;
      }

      if (!currentScene) continue;

      // Sprawdź postacie i dialogi
      const characterMatch = line.match(this.patterns.character);
      const dialogueMatch = line.match(this.patterns.dialogue);
      const propMatch = line.match(this.patterns.prop);
      const vehicleMatch = line.match(this.patterns.vehicle);
      const extrasMatch = line.match(this.patterns.extras);
      const specialMatch = line.match(this.patterns.special);

      if (characterMatch && !line.includes(':')) {
        currentScene.cast.add(characterMatch[1].trim());
      } else if (dialogueMatch) {
        currentScene.cast.add(dialogueMatch[1].trim());
        currentScene.dialogue.push({
          character: dialogueMatch[1].trim(),
          text: dialogueMatch[2].trim()
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
          
          currentScene = {
            sceneNumber: sceneNumber,
            location: {
              type: 'NIEOKREŚLONY',  // W tym formacie nie mamy wyraźnie określonego typu (INT/EXT)
              name: potentialLocation
            },
            timeOfDay: potentialTimeOfDay,
            cast: new Set(),
            dialogue: [],
            props: [],
            vehicles: [],
            extras: [],
            specialRequirements: []
          };
          
          waitingForSceneNumber = false;
          continue;
        }
      }

      if (!currentScene) {
        waitingForSceneNumber = false;
        continue;
      }

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
        
        // Sprawdź czy następna linia to dialog tej postaci
        if (i + 1 < lines.length && !lines[i + 1].match(this.patterns.character)) {
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

  extractTitle(lines) {
    // Próba znalezienia tytułu w pierwszych liniach
    for (let i = 0; i < Math.min(10, lines.length); i++) {
      if (lines[i].toUpperCase() === lines[i] && lines[i].length > 3) {
        return lines[i];
      }
    }
    return 'Untitled Script';
  }

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

module.exports = new ScriptParser(); 