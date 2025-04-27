import fs from 'fs';
import path from 'path';
import AdmZip from 'adm-zip';
import { generateZip } from './generateZip'; // Twoja funkcja generująca ZIP

const TEST_ZIP_PATH = path.join(__dirname, '../../../output/test_output.zip');

describe('generateZip', () => {
  afterAll(() => {
    if (fs.existsSync(TEST_ZIP_PATH)) fs.unlinkSync(TEST_ZIP_PATH);
  });

  it('tworzy archiwum ZIP z wymaganymi plikami', async () => {
    // Przygotuj pliki tymczasowe
    fs.writeFileSync('/tmp/test_analysis.json', '{"ok":1}');
    fs.writeFileSync('/tmp/test_scenes.ndjson', '{"ok":2}\n{"ok":3}');
    // ... analogicznie dla graf.html, network.gexf

    await generateZip({
      outputPath: TEST_ZIP_PATH,
      files: [
        { path: '/tmp/test_analysis.json', name: 'analysis.json' },
        { path: '/tmp/test_scenes.ndjson', name: 'scenes.ndjson' },
        // ...
      ],
    });

    const zip = new AdmZip(TEST_ZIP_PATH);
    const entries = zip.getEntries().map(e => e.entryName);

    expect(entries).toContain('analysis.json');
    expect(entries).toContain('scenes.ndjson');
    // ... analogicznie dla innych plików

    // Sprawdź poprawność pliku w archiwum
    const analysisContent = zip.readAsText('analysis.json');
    expect(() => JSON.parse(analysisContent)).not.toThrow();
  });
}); 