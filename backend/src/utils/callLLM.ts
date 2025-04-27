import { OpenAI } from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export interface LLMResult {
  success: boolean;
  data?: any;
  error?: string;
}

/**
 * Wywołuje LLM (OpenAI GPT-4o) na danym chunku z wymuszeniem odpowiedzi JSON.
 * @param chunkText Treść chunku do analizy
 * @param promptSystem Instrukcja systemowa (np. "Parsuj scenę do JSON wg schematu...")
 * @param promptUser Prompt użytkownika (np. "Oto scena: ...")
 */
export const callLLM = async (
  chunkText: string,
  promptSystem: string,
  promptUser: string
): Promise<LLMResult> => {
  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: promptSystem },
        { role: 'user', content: `${promptUser}\n\n${chunkText}` },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.2,
      max_tokens: 2048,
    });

    // Odpowiedź modelu powinna być już poprawnym JSON-em
    const content = completion.choices[0].message.content;
    if (!content) {
      return { success: false, error: 'Brak odpowiedzi od modelu' };
    }

    try {
      const data = JSON.parse(content);
      return { success: true, data };
    } catch (err: any) {
      return { success: false, error: 'Niepoprawny JSON: ' + err.message };
    }
  } catch (err: any) {
    return { success: false, error: err.message || 'Błąd wywołania LLM' };
  }
}; 