import { callLLM } from './callLLM';
import { validateChunk } from './validateChunk';

/**
 * Przetwarza chunk przez LLM z walidacją, retry (max 2x) i fallback promptem do naprawy JSON-a.
 * @param chunkText Treść chunku do analizy
 * @param promptSystem Instrukcja systemowa do LLM
 * @param promptUser Prompt użytkownika do LLM
 * @param fixPromptSystem Instrukcja systemowa do naprawy JSON-a
 * @param maxRetries Maksymalna liczba prób (domyślnie 2)
 */
export const processChunkWithRetry = async (
  chunkText: string,
  promptSystem: string,
  promptUser: string,
  fixPromptSystem: string,
  maxRetries = 2
): Promise<{ success: boolean; data?: any; error?: string }> => {
  let lastError = '';
  let result;

  // Główna próba + retry
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    result = await callLLM(chunkText, promptSystem, promptUser);

    if (result.success) {
      const validation = validateChunk(result.data);
      if (validation.valid) {
        return { success: true, data: result.data };
      } else {
        lastError = 'Validation failed: ' + (validation.errors || []).join('; ');
      }
    } else {
      lastError = result.error || 'Unknown LLM error';
    }
  }

  // Fallback: naprawa JSON-a przez LLM
  if (result && result.data) {
    const fixPromptUser = `Otrzymałeś poniżej NIEPOPRAWNY JSON. Zwróć tylko poprawioną wersję bez zmiany wartości.\n\n${JSON.stringify(result.data)}`;
    const fixResult = await callLLM('', fixPromptSystem, fixPromptUser);

    if (fixResult.success) {
      const validation = validateChunk(fixResult.data);
      if (validation.valid) {
        return { success: true, data: fixResult.data };
      } else {
        lastError = 'Validation after fix failed: ' + (validation.errors || []).join('; ');
      }
    } else {
      lastError = 'Fix LLM error: ' + (fixResult.error || 'Unknown');
    }
  }

  return { success: false, error: lastError };
}; 