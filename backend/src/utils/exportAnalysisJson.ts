import fs from 'fs';
import path from 'path';
import { ScenarioChunkModel } from '../models/ScenarioChunk';

/**
 * Eksportuje wszystkie poprawne chunk-i do jednego pliku analysis.json (tablica obiektów parsed).
 * @param outputPath Ścieżka do pliku wyjściowego analysis.json
 */
export const exportAnalysisJson = async (outputPath: string) => {
  const chunks = await ScenarioChunkModel.find({ status: 'done' }).sort({ index: 1 });

  // Zbierz tylko pole parsed z każdego chunku
  const analysisArray = chunks.map(chunk => chunk.parsed);

  fs.writeFileSync(outputPath, JSON.stringify(analysisArray, null, 2), 'utf-8');
  return analysisArray;
};

// Przykład użycia:
// await exportAnalysisJson(path.join(__dirname, '../../output/analysis.json')); 