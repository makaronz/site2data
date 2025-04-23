const fs = require('fs').promises;
const path = require('path');
const { NER } = require('@nlpjs/ner');
const { performance } = require('perf_hooks');
const { Worker } = require('worker_threads');
const mlAnalyzer = require('./ml_analyzer'); // Keep existing ML analysis integration

// Import necessary components from transformers and langchain
const { pipeline } = await import('@xenova/transformers'); // Use dynamic import for ESM module
const { RunnableSequence } = await import('@langchain/core/runnables'); // Example import - adjust based on actual LangChain usage
const { PromptTemplate } = await import("@langchain/core/prompts"); // Example import
// Add other necessary LangChain imports as needed

class ScriptParser {
  constructor() {
    this.ner = new NER({ language: 'pl' });
    this.modelLoaded = false;
    this.debugMode = process.env.DEBUG === 'true';
    this.maxFileSize = 50 * 1024 * 1024; // 50MB
    this.outputDir = path.join(__dirname, 'parsed_scripts');
    this.debugDir = path.join(__dirname, 'debug');
    this.pdfWorkerPath = path.join(__dirname, 'pdf_worker.js');
  }

  async initialize() {
    try {
      await this.loadNERModel();
      await this.ensureDirectories();
      this.modelLoaded = true;
      console.log('Parser zainicjalizowany pomyślnie');
    } catch (error) {
      console.error('Błąd podczas inicjalizacji parsera:', error);
      throw new Error('Nie udało się zainicjalizować parsera');
    }
  }

  async loadNERModel() {
    try {
      await this.ner.load();
      console.log('Model NER załadowany pomyślnie');
    } catch (error) {
      console.error('Błąd podczas ładowania modelu NER:', error);
      throw new Error('Nie udało się załadować modelu NER');
    }
  }

  async ensureDirectories() {
    try {
      await fs.mkdir(this.outputDir, { recursive: true });
      if (this.debugMode) {
        await fs.mkdir(this.debugDir, { recursive: true });
      }
    } catch (error) {
      console.error('Błąd podczas tworzenia katalogów:', error);
      throw new Error('Nie udało się utworzyć wymaganych katalogów');
    }
  }

  async parseScript(filePath) {
    if (!this.modelLoaded) {
      throw new Error('Parser nie został zainicjalizowany');
    }

    try {
      const stats = await fs.stat(filePath);
      if (stats.size > this.maxFileSize) {
        throw new Error(`Plik jest zbyt duży. Maksymalny rozmiar to ${this.maxFileSize / 1024 / 1024}MB`);
      }

      const startTime = performance.now();
      const content = await this.readPDFContent(filePath);
      const scenes = await this.parseScenes(content);
      const characters = await this.extractCharacters(scenes);
      const endTime = performance.now();

      const result = {
        scenes,
        characters,
        metadata: {
          processingTime: endTime - startTime,
          fileSize: stats.size,
          timestamp: new Date().toISOString()
        }
      };

      await this.saveResults(result, filePath);
      return result;
    } catch (error) {
      console.error('Błąd podczas parsowania scenariusza:', error);
      throw new Error(`Nie udało się sparsować scenariusza: ${error.message}`);
    }
  }

  async readPDFContent(filePath) {
    return new Promise((resolve, reject) => {
      try {
        const worker = new Worker(this.pdfWorkerPath);
        
        worker.on('message', (message) => {
          if (message.error) {
            worker.terminate();
            reject(new Error(`Błąd w workerze PDF: ${message.error}`));
            return;
          }
          
          if (message.text) {
            worker.terminate();
            resolve(message.text);
          }
        });

        worker.on('error', (error) => {
          worker.terminate();
          reject(new Error(`Błąd podczas przetwarzania PDF: ${error.message}`));
        });

        worker.on('exit', (code) => {
          if (code !== 0) {
            reject(new Error(`Worker zakończył działanie z kodem: ${code}`));
          }
        });

        worker.postMessage({ filePath });
      } catch (error) {
        reject(new Error(`Błąd podczas inicjalizacji workera PDF: ${error.message}`));
      }
    });
  }

  async parseScenes(content) {
    try {
      const scenes = [];
      const lines = content.split('\n');
      let currentScene = null;

      for (const line of lines) {
        if (this.isSceneHeader(line)) {
          if (currentScene) {
            scenes.push(currentScene);
          }
          currentScene = {
            header: line.trim(),
            content: [],
            dialogues: [],
            actions: []
          };
        } else if (currentScene && line.trim()) {
          currentScene.content.push(line.trim());
          if (this.isDialogue(line)) {
            currentScene.dialogues.push(line.trim());
          } else if (this.isAction(line)) {
            currentScene.actions.push(line.trim());
          }
        }
      }

      if (currentScene) {
        scenes.push(currentScene);
      }

      return scenes;
    } catch (error) {
      console.error('Błąd podczas parsowania scen:', error);
      throw new Error('Nie udało się sparsować scen');
    }
  }

  async extractCharacters(scenes) {
    try {
      const characters = new Set();
      
      for (const scene of scenes) {
        for (const dialogue of scene.dialogues) {
          const entities = await this.ner.process('pl', dialogue);
          entities.entities
            .filter(e => e.entity === 'person')
            .forEach(e => characters.add(e.utterance));
        }
      }

      return Array.from(characters);
    } catch (error) {
      console.error('Błąd podczas ekstrakcji postaci:', error);
      throw new Error('Nie udało się wyodrębnić postaci');
    }
  }

  async saveResults(result, originalFilePath) {
    try {
      const filename = path.basename(originalFilePath, '.pdf');
      const outputPath = path.join(this.outputDir, `${filename}_parsed.json`);
      
      await fs.writeFile(outputPath, JSON.stringify(result, null, 2));
      
      if (this.debugMode) {
        const debugPath = path.join(this.debugDir, `${filename}_debug.json`);
        await fs.writeFile(debugPath, JSON.stringify({
          ...result,
          debug: {
            nerEntities: await this.ner.process('pl', result.scenes.map(s => s.content.join(' ')).join(' '))
          }
        }, null, 2));
      }
    } catch (error) {
      console.error('Błąd podczas zapisywania wyników:', error);
      throw new Error('Nie udało się zapisać wyników parsowania');
    }
  }

  isSceneHeader(line) {
    return /^(INT\.|EXT\.|WNĘTRZE|ZEWNĘTRZE)/i.test(line.trim());
  }

  isDialogue(line) {
    return /^[A-ZĘÓĄŚŁŻŹĆŃ\s]+:/i.test(line.trim());
  }

  isAction(line) {
    return line.trim() && !this.isDialogue(line) && !this.isSceneHeader(line);
  }
}

module.exports = ScriptParser;