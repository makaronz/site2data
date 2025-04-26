import { ModernScriptParser } from '../utils/scriptParser.js';
import { promises as fs } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function runTest() {
  try {
    console.log('Inicjalizacja parsera...');
    const parser = new ModernScriptParser();
    
    // Ścieżka do scenariusza Fanatyka
    const scriptPath = join(__dirname, 'samples', 'Scenariusz filmu Fanatyk_Final.pdf');
    const scriptName = 'Scenariusz filmu Fanatyk_Final.pdf';
    
    console.log('Wczytywanie scenariusza...');
    const scriptContent = await fs.readFile(scriptPath);
    
    console.log('Parsowanie scenariusza...');
    const result = await parser.parse(scriptContent, {
      format: 'pdf',
      title: scriptName,
      options: {
        useAI: false,
        useCaching: false
      }
    });
    
    console.log('\nWyniki parsowania zostały zapisane w katalogu parsed/');
    console.log(`Format: ${result.format}`);
    console.log(`Liczba scen: ${result.scenes?.length || 0}`);
    console.log(`Liczba postaci: ${result.metadata.characters.length}`);
    
    if (result.scenes && result.scenes.length > 0) {
      console.log('\nSceny:');
      console.log('------------------');
      
      result.scenes.forEach((scene, index) => {
        console.log(`\nScena ${index + 1}:`);
        console.log(`Nagłówek: ${scene.heading}`);
        console.log(`Postacie: ${Array.from(scene.characters || []).join(', ')}`);
        console.log(`Liczba dialogów: ${scene.dialogues?.length || 0}`);
        
        if (scene.dialogues && scene.dialogues.length > 0) {
          console.log('\nDialogi:');
          scene.dialogues.forEach((dialogue, dIndex) => {
            console.log(`\n  Dialog ${dIndex + 1}:`);
            console.log(`  Postać: ${dialogue.character}`);
            if (dialogue.parenthetical) {
              console.log(`  Wskazówka: ${dialogue.parenthetical}`);
            }
            console.log(`  Tekst: ${dialogue.text.trim()}`);
          });
        }
        
        console.log('\nOpis:');
        console.log(scene.description.trim());
      });
    }
    
    console.log('\nMetadane:');
    console.log('------------------');
    console.log(result.metadata);
    
  } catch (error) {
    console.error('Błąd podczas testowania:', error);
    throw error;
  }
}

runTest(); 