import fs from 'fs';
import path from 'path';
import { ScenarioChunkModel } from '../models/ScenarioChunk';

/**
 * Eksportuje wszystkie poprawne chunk-i do pliku NDJSON.
 * @param outputPath Ścieżka do pliku wyjściowego NDJSON
 */
export const exportChunksToNDJSON = async (outputPath: string) => {
  const chunks = await ScenarioChunkModel.find({ status: 'done' }).sort({ index: 1 });

  const ndjsonLines = chunks.map(chunk => JSON.stringify({
    id: chunk.id,
    index: chunk.index,
    title: chunk.title,
    parsed: chunk.parsed,
  }));

  // Zapis do pliku
  fs.writeFileSync(outputPath, ndjsonLines.join('\n'), 'utf-8');
  // Możesz też zwrócić string, jeśli chcesz wysłać przez API
  return ndjsonLines.join('\n');
};

// Przykład użycia:
// await exportChunksToNDJSON(path.join(__dirname, '../../output/scenes.ndjson')); 