const { parentPort } = require('worker_threads');
const { pipeline } = require('@xenova/transformers');
const { formatDetection } = require('./formatDetection');

class ScriptChunkProcessor {
  constructor() {
    this.initialize();
  }

  async initialize() {
    // Inicjalizacja modeli
    this.classifier = await pipeline('text-classification');
  }

  async processChunk(chunk) {
    // Wykryj format
    const format = formatDetection.detect(chunk);
    
    // Przetwórz w zależności od formatu
    switch (format) {
      case 'fountain':
        return this.processFountain(chunk);
      case 'fdx':
        return this.processFDX(chunk);
      case 'pdf':
        return this.processPDF(chunk);
      default:
        return this.processPlainText(chunk);
    }
  }

  async processFountain(chunk) {
    // Fountain format parsing
    const scenes = [];
    const lines = chunk.split('\n');
    let currentScene = null;

    for (const line of lines) {
      if (line.match(/^(INT|EXT|INT\/EXT|EXT\/INT)/)) {
        if (currentScene) {
          scenes.push(currentScene);
        }
        currentScene = {
          heading: line,
          content: [],
          characters: new Set(),
          dialogues: []
        };
      } else if (currentScene) {
        if (line.match(/^[A-Z\s]+$/)) {
          // Character line
          currentScene.characters.add(line.trim());
        } else if (line.startsWith('  ')) {
          // Dialogue
          currentScene.dialogues.push({
            character: Array.from(currentScene.characters).pop(),
            text: line.trim()
          });
        } else {
          // Action/description
          currentScene.content.push(line);
        }
      }
    }

    if (currentScene) {
      scenes.push(currentScene);
    }

    return {
      format: 'fountain',
      scenes: scenes.map(scene => ({
        ...scene,
        characters: Array.from(scene.characters)
      }))
    };
  }

  async processFDX(chunk) {
    // Final Draft XML parsing
    const parser = new DOMParser();
    const doc = parser.parseFromString(chunk, 'text/xml');
    const scenes = [];

    const paragraphs = doc.getElementsByTagName('Paragraph');
    let currentScene = null;

    for (const para of paragraphs) {
      const type = para.getAttribute('Type');
      const content = para.textContent;

      if (type === 'Scene Heading') {
        if (currentScene) {
          scenes.push(currentScene);
        }
        currentScene = {
          heading: content,
          content: [],
          characters: new Set(),
          dialogues: []
        };
      } else if (currentScene) {
        if (type === 'Character') {
          currentScene.characters.add(content);
        } else if (type === 'Dialogue') {
          currentScene.dialogues.push({
            character: Array.from(currentScene.characters).pop(),
            text: content
          });
        } else {
          currentScene.content.push(content);
        }
      }
    }

    if (currentScene) {
      scenes.push(currentScene);
    }

    return {
      format: 'fdx',
      scenes: scenes.map(scene => ({
        ...scene,
        characters: Array.from(scene.characters)
      }))
    };
  }

  async processPDF(chunk) {
    // Podstawowe przetwarzanie tekstu z PDF
    return this.processPlainText(chunk);
  }

  async processPlainText(chunk) {
    const scenes = [];
    const lines = chunk.split('\n');
    let currentScene = null;

    for (const line of lines) {
      const sceneMatch = line.match(/^(INT|EXT|INT\/EXT|EXT\/INT)/i);
      if (sceneMatch) {
        if (currentScene) {
          scenes.push(currentScene);
        }
        currentScene = {
          heading: line,
          content: [],
          characters: new Set(),
          dialogues: []
        };
      } else if (currentScene) {
        const characterMatch = line.match(/^([A-Z][A-Z\s]+)$/);
        if (characterMatch) {
          currentScene.characters.add(characterMatch[1].trim());
        } else if (line.startsWith('  ')) {
          currentScene.dialogues.push({
            character: Array.from(currentScene.characters).pop(),
            text: line.trim()
          });
        } else {
          currentScene.content.push(line);
        }
      }
    }

    if (currentScene) {
      scenes.push(currentScene);
    }

    return {
      format: 'text',
      scenes: scenes.map(scene => ({
        ...scene,
        characters: Array.from(scene.characters)
      }))
    };
  }
}

// Inicjalizacja procesora
const processor = new ScriptChunkProcessor();

// Nasłuchiwanie wiadomości
parentPort.on('message', async ({ chunks }) => {
  try {
    const results = await Promise.all(
      chunks.map(chunk => processor.processChunk(chunk))
    );

    parentPort.postMessage({
      success: true,
      results
    });
  } catch (error) {
    parentPort.postMessage({
      success: false,
      error: error.message
    });
  }
}); 