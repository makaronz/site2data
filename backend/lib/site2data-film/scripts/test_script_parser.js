const ScriptParser = require('./backend/src/utils/scriptParser');
const fs = require('fs');
const path = require('path');

async function testParser() {
  try {
    console.log('Rozpoczynam test parsera scenariusza...');
    
    const scriptPath = path.join(__dirname, 'XMPS', 'DRUGA-FURIOZA 050624.pdf');
    
    if (!fs.existsSync(scriptPath)) {
      console.error('Błąd: Plik scenariusza nie istnieje:', scriptPath);
      return;
    }

    console.log('Parsowanie scenariusza:', scriptPath);
    const parsedScript = await ScriptParser.parse(scriptPath);

    console.log('\nPodstawowe informacje:');
    console.log('Tytuł:', parsedScript.title);
    console.log('Wersja:', parsedScript.version);
    console.log('Liczba scen:', parsedScript.metadata.totalScenes);
    console.log('Liczba postaci:', parsedScript.metadata.uniqueCharacters.length);
    console.log('Liczba dialogów:', parsedScript.metadata.totalDialogues);

    console.log('\nPrzykładowe sceny:');
    parsedScript.scenes.slice(0, 5).forEach((scene, index) => {
      console.log(`\nScena ${scene.sceneNumber}:`);
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
      
      if (scene.props.length > 0) {
        console.log('Rekwizyty:', scene.props.map(p => p.name).join(', '));
      }
      
      if (scene.vehicles.length > 0) {
        console.log('Pojazdy:', scene.vehicles.map(v => v.type).join(', '));
      }
      
      if (scene.extras.length > 0) {
        console.log('Statyści:', scene.extras.map(e => `${e.quantity} ${e.type}`).join(', '));
      }
      
      if (scene.specialRequirements.length > 0) {
        console.log('Wymagania specjalne:', scene.specialRequirements.join(', '));
      }
    });

    // Zapisz pełne wyniki do pliku JSON dla dalszej analizy
    const outputPath = path.join(__dirname, 'parsed_script_output.json');
    fs.writeFileSync(outputPath, JSON.stringify(parsedScript, null, 2));
    console.log('\nPełne wyniki zostały zapisane do:', outputPath);

  } catch (error) {
    console.error('Błąd podczas testowania parsera:', error);
  }
}

testParser(); 