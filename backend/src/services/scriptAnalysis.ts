import { Script } from '../models/script';
import { analyzeScript } from '../script_analysis/analyzer';

interface AnalysisResult {
  score: number;
  issues: string[];
  recommendations: string[];
}

export class ScriptAnalysisService {
  public async analyzeScript(script: Script, apiKey?: string): Promise<any> {
    try {
      // Używamy faktycznej funkcji analizy skryptu, przekazując opcjonalny klucz API
      const result = await analyzeScript(script.content, apiKey);
      
      // Zwracamy pełny wynik analizy
      return result;
    } catch (error) {
      console.error('Błąd podczas analizy skryptu:', error);
      
      // W przypadku błędu zwracamy podstawową odpowiedź
      return {
        analysis: {
          metadata: {
            title: 'Błąd analizy',
            authors: [],
            detected_language: 'pl',
            scene_count: 0,
            token_count: 0,
            analysis_timestamp: new Date().toISOString()
          },
          overall_summary: 'Wystąpił błąd podczas analizy scenariusza.'
        }
      };
    }
  }
}

export const scriptAnalysisService = new ScriptAnalysisService();

export { analyzeScript }; 