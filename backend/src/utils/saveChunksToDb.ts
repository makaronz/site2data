import { ScenarioChunk, splitBySceneOrTokens } from './chunker';
import { ScenarioChunkModel } from '../models/ScenarioChunk';

/**
 * Zapisuje chunk-i do MongoDB z domyślnym statusem "pending".
 * @param scriptText Pełny tekst scenariusza
 */
export const saveChunksToDb = async (scriptText: string) => {
  const chunks: ScenarioChunk[] = splitBySceneOrTokens(scriptText);

  // Mapowanie na dokumenty do bazy
  const docs = chunks.map(chunk => ({
    id: chunk.id,
    index: chunk.index,
    title: chunk.title,
    text: chunk.text,
    status: 'pending',
  }));

  // Upsert (unikalność po id)
  for (const doc of docs) {
    await ScenarioChunkModel.updateOne(
      { id: doc.id },
      { $set: doc },
      { upsert: true }
    );
  }
}; 