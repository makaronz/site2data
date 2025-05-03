import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import AdmZip from 'adm-zip';
import { generateZip, ZipFileEntry } from './generateZip.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const TEST_ZIP_PATH = path.join(__dirname, '../../../output/test_output.zip');

describe('generateZip', () => {
  afterAll(() => {
    if (fs.existsSync(TEST_ZIP_PATH)) {
      fs.unlinkSync(TEST_ZIP_PATH);
    }
  });

  it('tworzy archiwum ZIP z wymaganymi plikami', async () => {
    // Przygotuj pliki tymczasowe
    fs.writeFileSync('/tmp/test_analysis.json', '{"ok":1}');
    fs.writeFileSync('/tmp/test_scenes.ndjson', '{"ok":2}\n{"ok":3}');
    // ... analogicznie dla graf.html, network.gexf

    const files: ZipFileEntry[] = [
      { path: '/tmp/test_analysis.json', name: 'analysis.json' },
      { path: '/tmp/test_scenes.ndjson', name: 'scenes.ndjson' },
      // ...
    ];

    await generateZip({
      outputPath: TEST_ZIP_PATH,
      files
    });

    const zip = new AdmZip(TEST_ZIP_PATH);
    const entries = zip.getEntries().map(e => e.entryName);

    expect(entries).toContain('analysis.json');
    expect(entries).toContain('scenes.ndjson');
    // ... analogicznie dla innych plików

    // Sprawdź poprawność pliku w archiwum
    const analysisContent = zip.readAsText('analysis.json');
    expect(() => JSON.parse(analysisContent)).not.toThrow();

    // Cleanup
    fs.unlinkSync('/tmp/test_analysis.json');
    fs.unlinkSync('/tmp/test_scenes.ndjson');
  });
}); 