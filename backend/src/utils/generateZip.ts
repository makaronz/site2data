import fs from 'fs';
import archiver from 'archiver';

export interface ZipFileEntry {
  path: string; // ścieżka do pliku na dysku
  name: string; // nazwa pliku w archiwum
}

/**
 * Tworzy archiwum ZIP z podanych plików.
 * @param outputPath Ścieżka do pliku wyjściowego ZIP
 * @param files Tablica plików do dodania do archiwum
 */
export const generateZip = async ({
  outputPath,
  files,
}: {
  outputPath: string;
  files: ZipFileEntry[];
}): Promise<void> => {
  return new Promise((resolve, reject) => {
    const output = fs.createWriteStream(outputPath);
    const archive = archiver('zip', { zlib: { level: 9 } });

    output.on('close', () => resolve());
    archive.on('error', err => reject(err));

    archive.pipe(output);

    for (const file of files) {
      archive.file(file.path, { name: file.name });
    }

    archive.finalize();
  });
};

// Przykład użycia:
// await generateZip({
//   outputPath: '/tmp/film_output.zip',
//   files: [
//     { path: '/tmp/analysis.json', name: 'analysis.json' },
//     { path: '/tmp/scenes.ndjson', name: 'scenes.ndjson' },
//     { path: '/tmp/graf.html', name: 'graf.html' },
//     { path: '/tmp/network.gexf', name: 'network.gexf' },
//   ],
// }); 