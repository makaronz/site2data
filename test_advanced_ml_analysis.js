const fs = require('fs');
const path = require('path');
const scriptParser = require('./script_parser_updated');
const mlAnalyzer = require('./ml_analyzer');

async function testAdvancedMLAnalysis() {
  try {
    console.log('Testowanie zaawansowanej analizy emocjonalnej...');
    
    // Ścieżka do pliku scenariusza - poprawiona ścieżka
    const scriptPath = path.join(__dirname, 'XMPS', 'DRUGA-FURIOZA 050624.pdf');
    
    if (!fs.existsSync(scriptPath)) {
      console.error(`Plik nie istnieje: ${scriptPath}`);
      return;
    }
    
    console.log(`Parsowanie scenariusza: ${path.basename(scriptPath)}`);
    
    // Parsuj scenariusz
    const parsedScript = await scriptParser.parseScript(scriptPath);
    
    // Wyświetl podstawowe informacje
    console.log(`\nTytuł: ${parsedScript.title}`);
    console.log(`Liczba scen: ${parsedScript.scenes.length}`);
    console.log(`Całkowita liczba postaci: ${calculateTotalCharacters(parsedScript.scenes)}`);
    
    // Wyświetl szczegóły analizy kontekstu scen
    console.log('\n=== ANALIZA KONTEKSTU SCEN ===');
    const selectedScenes = parsedScript.scenes.slice(5, 8); // Wybierz kilka scen do szczegółowej analizy
    
    selectedScenes.forEach(scene => {
      console.log(`\nScena ${scene.sceneNumber}:`);
      console.log(`Lokacja: ${scene.location.name}`);
      console.log(`Trend emocjonalny: ${scene.analysis.context.emotionalTrend}`);
      console.log(`Dominujący temat: ${scene.analysis.context.thematicAnalysis.dominantTheme}`);
      console.log(`Znaczenie narracyjne: ${scene.analysis.context.narrativeImportance.level} (${scene.analysis.context.narrativeImportance.score.toFixed(2)})`);
      console.log(`Przepływ scen: Z ${scene.analysis.context.sceneFlow.buildsFrom || 'początek'} do ${scene.analysis.context.sceneFlow.leadsTo || 'koniec'}`);
    });
    
    // Wyświetl szczegóły analizy emocji
    console.log('\n=== ANALIZA EMOCJI ===');
    selectedScenes.forEach(scene => {
      console.log(`\nScena ${scene.sceneNumber} - emocje:`);
      Object.entries(scene.analysis.emotions).forEach(([emotion, value]) => {
        console.log(`  ${emotion}: ${value.toFixed(2)}`);
      });
    });
    
    // Wyświetl relacje między postaciami
    console.log('\n=== RELACJE MIĘDZY POSTACIAMI ===');
    const significantRelationships = parsedScript.analysis.relationships
      .filter(rel => rel.strength > 0.3)
      .sort((a, b) => b.strength - a.strength);
    
    significantRelationships.slice(0, 10).forEach(rel => {
      console.log(`\n${rel.characters[0]} <-> ${rel.characters[1]}`);
      console.log(`  Typ relacji: ${rel.type}`);
      console.log(`  Siła: ${rel.strength.toFixed(2)}`);
      console.log(`  Sentyment: ${rel.sentiment.toFixed(2)}`);
      console.log(`  Dominująca emocja: ${rel.dominantEmotion}`);
      console.log(`  Wspólne sceny: ${rel.scenes.join(', ')}`);
    });
    
    // Wyświetl punkty zwrotne
    console.log('\n=== PUNKTY ZWROTNE ===');
    parsedScript.analysis.turningPoints.forEach(point => {
      console.log(`\nScena ${point.sceneNumber}: ${point.description}`);
      console.log(`  Typ: ${point.type}`);
      console.log(`  Intensywność: ${point.intensity.toFixed(2)}`);
    });
    
    // Zapisz wyniki analizy do pliku
    const outputFile = path.join(__dirname, 'advanced_ml_analysis.json');
    fs.writeFileSync(outputFile, JSON.stringify(parsedScript, null, 2));
    console.log(`\nWyniki zostały zapisane do pliku: ${outputFile}`);
    
  } catch (error) {
    console.error('Błąd podczas testowania analizy:', error);
  }
}

// Pomocnicza funkcja do obliczenia łącznej liczby postaci
function calculateTotalCharacters(scenes) {
  const allCharacters = new Set();
  scenes.forEach(scene => {
    scene.cast.forEach(character => allCharacters.add(character));
  });
  return allCharacters.size;
}

// Uruchom test
testAdvancedMLAnalysis(); 