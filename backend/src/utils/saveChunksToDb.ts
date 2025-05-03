import { ScenarioChunk, splitBySceneOrTokens } from './chunker';
import { ScenarioChunkModel } from '../models/ScenarioChunk';

/**
 * Zapisuje chunk-i do MongoDB z domyślnym statusem "pending".
 * @param scriptText Pełny tekst scenariusza
 * @param status Status chunków, domyślnie "pending"
 */
export const saveChunksToDb = async (scriptText: string, status: string = 'pending') => {
  if (!scriptText) {
    throw new Error('Script is empty');
  }

  const chunks: ScenarioChunk[] = splitBySceneOrTokens(scriptText);
  
  if (chunks.length === 0) {
    throw new Error('Script does not contain any chunks');
  }

  // Mapowanie na dokumenty do bazy
  const docs = chunks.map(chunk => ({
    id: chunk.id,
    index: chunk.index,
    title: chunk.title,
    text: chunk.text,
    status: status,
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