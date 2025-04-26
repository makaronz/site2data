/**
 * Uproszczony parser scenariuszy z obsługą PDF
 */
import { formatDetection } from './formatDetection.js';
import { Poppler } from 'node-poppler';
import { promises as fs } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';
import { parserConfig, errorMessages } from '../config/parserConfig.js';
import { CacheManager } from './cacheManager.js';
import { PDFValidator } from './pdfValidator.js';
import { Worker } from 'worker_threads';

export class ModernScriptParser {
  constructor(config = {}) {
    this.config = {
      ...parserConfig,
      ...config
    };
    this.poppler = new Poppler();
    this.cache = new CacheManager();
    this.validator = new PDFValidator();
  }

  async createOutputDirectories(title) {
    // Utwórz główny katalog parsed jeśli nie istnieje
    const baseDir = join(process.cwd(), this.config.outputDir);
    await fs.mkdir(baseDir, { recursive: true });

    // Utwórz katalog dla konkretnego filmu
    const movieDir = join(baseDir, this.sanitizeTitle(title));
    await fs.mkdir(movieDir, { recursive: true });

    return movieDir;
  }

  sanitizeTitle(title) {
    // Usuń rozszerzenie pliku i znaki specjalne
    return title
      .replace(/\.[^/.]+$/, '') // usuń rozszerzenie
      .replace(/[^a-zA-Z0-9\s-]/g, '') // usuń znaki specjalne
      .replace(/\s+/g, '_') // zamień spacje na podkreślenia
      .toLowerCase();
  }

  async saveAnalysis(result, title) {
    const outputDir = await this.createOutputDirectories(title);

    // Zapisz podstawowe informacje
    await fs.writeFile(
      join(outputDir, 'info.txt'),
      `Tytuł: ${title}
Format: ${result.format}
Data przetworzenia: ${result.metadata.processed_at}
Liczba scen: ${result.metadata.totalScenes}
Postacie: ${result.metadata.characters.join(', ')}
`
    );

    // Zapisz szczegółową analizę scen
    await fs.writeFile(
      join(outputDir, 'scenes.txt'),
      result.scenes.map((scene, index) => `
Scena ${index + 1}:
Nagłówek: ${scene.heading}
Postacie: ${Array.from(scene.characters).join(', ')}
Liczba dialogów: ${scene.dialogues.length}

Dialogi:
${scene.dialogues.map(dialogue => `
  Postać: ${dialogue.character}
  ${dialogue.parenthetical ? `Wskazówka: ${dialogue.parenthetical}\n` : ''}  Tekst: ${dialogue.text.trim()}
`).join('\n')}

Opis:
${scene.description.trim()}
-------------------
`).join('\n')
    );

    // Zapisz analizę postaci
    const characterAnalysis = this.analyzeCharacters(result.scenes);
    await fs.writeFile(
      join(outputDir, 'characters.txt'),
      Object.entries(characterAnalysis)
        .map(([character, stats]) => `
Postać: ${character}
Liczba scen: ${stats.sceneCount}
Liczba dialogów: ${stats.dialogueCount}
Pierwsze pojawienie się: Scena ${stats.firstAppearance}
Ostatnie pojawienie się: Scena ${stats.lastAppearance}
`).join('\n')
    );

    // Zapisz statystyki
    await fs.writeFile(
      join(outputDir, 'statistics.txt'),
      this.generateStatistics(result)
    );

    return outputDir;
  }

  analyzeCharacters(scenes) {
    const characters = {};

    scenes.forEach((scene, sceneIndex) => {
      scene.characters.forEach(character => {
        if (!characters[character]) {
          characters[character] = {
            sceneCount: 0,
            dialogueCount: 0,
            firstAppearance: sceneIndex + 1,
            lastAppearance: sceneIndex + 1
          };
        }

        characters[character].sceneCount++;
        characters[character].lastAppearance = sceneIndex + 1;
        characters[character].dialogueCount += scene.dialogues.filter(d => d.character === character).length;
      });
    });

    return characters;
  }

  generateStatistics(result) {
    const totalDialogues = result.scenes.reduce((sum, scene) => sum + scene.dialogues.length, 0);
    const avgDialoguesPerScene = totalDialogues / result.scenes.length;
    
    const sceneLengths = result.scenes.map(scene => scene.description.length);
    const avgSceneLength = sceneLengths.reduce((a, b) => a + b, 0) / sceneLengths.length;

    return `Statystyki scenariusza:
------------------------
Całkowita liczba scen: ${result.scenes.length}
Całkowita liczba dialogów: ${totalDialogues}
Średnia liczba dialogów na scenę: ${avgDialoguesPerScene.toFixed(2)}
Średnia długość opisu sceny: ${avgSceneLength.toFixed(2)} znaków
Liczba postaci: ${result.metadata.characters.length}
`;
  }

  async parse(scriptContent, options = {}) {
    try {
      // Konwertuj na buffer jeśli to string
      const content = Buffer.isBuffer(scriptContent) ? 
        scriptContent : 
        Buffer.from(scriptContent);

      // Sprawdź cache
      const cacheKey = this.cache.generateKey(content);
      const cached = await this.cache.get(cacheKey);
      if (cached) {
        console.log('Znaleziono w cache');
        return cached;
      }

      // Walidacja PDF
      const validationResult = await this.validator.validate(content);
      if (!validationResult.isValid) {
        throw new Error(errorMessages.PDF_INVALID);
      }

      // Wykryj format
      const format = await formatDetection.detect(content);
      
      // Konwertuj PDF na tekst jeśli potrzeba
      let textContent;
      if (format === 'pdf') {
        try {
          textContent = await this.parsePDF(content);
          if (!this.validator.isTextContent(textContent)) {
            throw new Error(errorMessages.OCR_FAILED);
          }
        } catch (error) {
          console.error('Błąd podczas parsowania PDF:', error);
          throw new Error(errorMessages.PDF_CORRUPTED);
        }
      } else {
        textContent = content.toString('utf-8');
      }
      
      // Przetwórz zawartość w osobnym wątku
      const scenes = await this.processInWorker(textContent);
      
      const result = {
        format,
        scenes,
        metadata: {
          ...validationResult.metadata,
          processed_at: new Date().toISOString(),
          characters: this.extractCharacters(scenes),
          totalScenes: scenes.length
        }
      };

      // Zapisz do cache
      await this.cache.set(cacheKey, result);

      // Zapisz wyniki analizy jeśli podano tytuł
      if (options.title) {
        await this.saveAnalysis(result, options.title);
      }

      return result;
    } catch (error) {
      console.error('Błąd podczas parsowania:', error);
      throw error;
    }
  }

  async processInWorker(content) {
    return new Promise((resolve, reject) => {
      const worker = new Worker('./scriptParserWorker.js');
      
      const timeout = setTimeout(() => {
        worker.terminate();
        reject(new Error(errorMessages.PROCESSING_TIMEOUT));
      }, this.config.processing.timeout);

      worker.on('message', (result) => {
        clearTimeout(timeout);
        if (result.success) {
          resolve(result.scenes);
        } else {
          reject(new Error(result.error));
        }
      });

      worker.on('error', (error) => {
        clearTimeout(timeout);
        reject(error);
      });

      worker.postMessage({ content });
    });
  }

  async parsePDF(pdfBuffer) {
    const tmpDir = tmpdir();
    const pdfPath = join(tmpDir, `temp-${Date.now()}.pdf`);
    const txtPath = join(tmpDir, `temp-${Date.now()}.txt`);
    
    try {
      await fs.writeFile(pdfPath, pdfBuffer);
      
      // Użyj konfiguracji Poppler
      await this.poppler.pdfToText(pdfPath, txtPath, this.config.pdf.poppler);
      
      const text = await fs.readFile(txtPath, 'utf-8');
      
      // Usuń pliki tymczasowe
      await Promise.all([
        fs.unlink(pdfPath).catch(() => {}),
        fs.unlink(txtPath).catch(() => {})
      ]);
      
      return text;
    } catch (error) {
      // Spróbuj usunąć pliki tymczasowe w przypadku błędu
      await Promise.all([
        fs.unlink(pdfPath).catch(() => {}),
        fs.unlink(txtPath).catch(() => {})
      ]);
      throw error;
    }
  }

  parseScenes(content) {
    const scenes = [];
    const lines = content.split('\n');
    let currentScene = null;
    let currentDialogue = null;
    
    for (const line of lines) {
      const trimmedLine = line.trim();
      if (!trimmedLine) continue;

      // Wykryj nagłówek sceny
      if (trimmedLine.match(/^(INT|EXT|INT\/EXT|EXT\/INT)/)) {
        if (currentScene) {
          scenes.push(currentScene);
        }
        currentScene = {
          heading: trimmedLine,
          description: '',
          characters: new Set(),
          dialogues: []
        };
        continue;
      }

      if (!currentScene) continue;

      // Wykryj postać
      if (trimmedLine.match(/^[A-Z][A-Z\s]+$/)) {
        const character = trimmedLine;
        currentScene.characters.add(character);
        currentDialogue = {
          character,
          text: '',
          parenthetical: null
        };
        continue;
      }

      // Wykryj wskazówki w nawiasach
      if (trimmedLine.match(/^\(.*\)$/)) {
        if (currentDialogue) {
          currentDialogue.parenthetical = trimmedLine;
        }
        continue;
      }

      // Dodaj tekst dialogu
      if (currentDialogue) {
        if (trimmedLine && !trimmedLine.match(/^[A-Z\s]+$/)) {
          currentDialogue.text += trimmedLine + ' ';
          if (!currentScene.dialogues.includes(currentDialogue)) {
            currentScene.dialogues.push(currentDialogue);
          }
        } else {
          currentDialogue = null;
        }
      }

      // Dodaj opis sceny
      if (!currentDialogue) {
        currentScene.description += trimmedLine + '\n';
      }
    }

    if (currentScene) {
      scenes.push(currentScene);
    }

    return scenes;
  }

  extractCharacters(scenes) {
    const characters = new Set();
    for (const scene of scenes) {
      for (const character of scene.characters) {
        characters.add(character);
      }
    }
    return Array.from(characters);
  }
} 