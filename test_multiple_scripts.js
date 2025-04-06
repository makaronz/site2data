const ScriptParser = require('./backend/src/utils/scriptParser');
const fs = require('fs');
const path = require('path');

async function testMultipleScripts() {
  try {
    console.log('Test parsowania scenariuszy...');
    
    const scriptsDir = path.join(__dirname, 'XMPS');
    const files = fs.readdirSync(scriptsDir);
    
    // Filtruj pliki PDF, które prawdopodobnie są scenariuszami
    // Uwzględniamy tylko pliki, które prawdopodobnie są faktycznymi scenariuszami
    const scriptFiles = files.filter(file => 
      file.toLowerCase().endsWith('.pdf') && 
      !file.toLowerCase().includes('karta') && 
      !file.toLowerCase().includes('call sheet') && 
      !file.toLowerCase().includes('list') &&
      !file.toLowerCase().includes('kalendar') &&
      !file.toLowerCase().includes('request')
    );
    
    console.log(`Znaleziono ${scriptFiles.length} potencjalnych plików scenariuszy.`);
    
    // Ręcznie ustalamy ścieżki do znanych scenariuszy
    const knownScripts = [
      'DRUGA-FURIOZA 050624.pdf',
      'ZNACHOR - PP nr 9 - 23.03.2022 środa_FRETA WYPADEK + WILLA WILCZURA.pdf'
    ];
    
    const results = [];
    
    for (const file of knownScripts) {
      if (!fs.existsSync(path.join(scriptsDir, file))) {
        console.log(`Plik ${file} nie istnieje, pomijam.`);
        continue;
      }
      
      const scriptPath = path.join(scriptsDir, file);
      console.log(`\nParsowanie: ${file}`);
      
      try {
        const parsedScript = await ScriptParser.parse(scriptPath);
        
        console.log(`Tytuł: ${parsedScript.title}`);
        console.log(`Wersja: ${parsedScript.version}`);
        console.log(`Liczba scen: ${parsedScript.metadata.totalScenes}`);
        console.log(`Liczba postaci: ${parsedScript.metadata.uniqueCharacters.length}`);
        console.log(`Liczba dialogów: ${parsedScript.metadata.totalDialogues}`);
        
        if (parsedScript.scenes.length > 0) {
          console.log('\nPrzykładowe sceny:');
          parsedScript.scenes.slice(0, 2).forEach(scene => {
            console.log(`\nScena ${scene.sceneNumber}:`);
            console.log(`Lokacja: ${scene.location.name}`);
            console.log(`Pora dnia: ${scene.timeOfDay}`);
            console.log(`Obsada: ${scene.cast.slice(0, 3).join(', ')}${scene.cast.length > 3 ? '...' : ''}`);
            console.log(`Liczba dialogów: ${scene.dialogue.length}`);
          });
        }
        
        results.push({
          fileName: file,
          title: parsedScript.title,
          version: parsedScript.version,
          scenesCount: parsedScript.metadata.totalScenes,
          charactersCount: parsedScript.metadata.uniqueCharacters.length,
          dialoguesCount: parsedScript.metadata.totalDialogues
        });
      } catch (error) {
        console.error(`Błąd podczas parsowania ${file}:`, error.message);
        results.push({
          fileName: file,
          error: error.message
        });
      }
    }
    
    // Zapisz podsumowanie do pliku JSON
    const outputPath = path.join(__dirname, 'scripts_parsing_results.json');
    fs.writeFileSync(outputPath, JSON.stringify(results, null, 2));
    console.log(`\nWyniki zostały zapisane do: ${outputPath}`);
    
  } catch (error) {
    console.error('Błąd podczas testowania parsera:', error);
  }
}

testMultipleScripts(); 