import { v4 as uuidv4 } from 'uuid';

/**
 * Typ pojedynczego chunku scenariusza.
 */
export interface ScenarioChunk {
  id: string; // Unikalny identyfikator chunku (np. S1, S2, ... lub UUID)
  index: number; // Kolejność chunku
  title: string; // Nagłówek sceny lub opis chunku
  text: string; // Treść chunku
}

/**
 * Dzieli scenariusz na sceny na podstawie nagłówków (np. INT./EXT.).
 * Jeśli nie znajdzie nagłówków, fallback na chunkowanie po liczbie tokenów.
 * @param scriptText Pełny tekst scenariusza
 * @param maxTokens Maksymalna liczba tokenów na chunk (domyślnie 3000)
 */
export const splitBySceneOrTokens = (
  scriptText: string,
  maxTokens: number = 3000
): ScenarioChunk[] => {
  // Regex do wykrywania nagłówków scen (INT. lub EXT. na początku linii)
  const sceneRegex = /^(INT\.|EXT\.|INT\/EXT\.|EXT\/INT\.)[^\n]*$/gim;
  const matches = [...scriptText.matchAll(sceneRegex)];

  if (matches.length > 0) {
    // Chunkowanie po scenach
    const chunks: ScenarioChunk[] = [];
    for (let i = 0; i < matches.length; i++) {
      const start = matches[i].index!;
      const end = i < matches.length - 1 ? matches[i + 1].index! : scriptText.length;
      const title = matches[i][0].trim();
      const text = scriptText.slice(start, end).trim();
      chunks.push({
        id: `S${i + 1}`,
        index: i,
        title,
        text,
      });
    }
    return chunks;
  }

  // Fallback: chunkowanie po liczbie tokenów (przybliżenie: 1 token ≈ 4 znaki)
  const approxTokenLength = maxTokens * 4;
  const chunks: ScenarioChunk[] = [];
  let i = 0;
  for (let pos = 0; pos < scriptText.length; pos += approxTokenLength) {
    const text = scriptText.slice(pos, pos + approxTokenLength).trim();
    chunks.push({
      id: uuidv4(),
      index: i,
      title: `Chunk ${i + 1}`,
      text,
    });
    i++;
  }
  return chunks;
}; 