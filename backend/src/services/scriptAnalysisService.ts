interface Script {
  content: string;
  filename: string;
}

interface AnalysisResult {
  score: number;
  issues: string[];
  recommendations: string[];
}

export class ScriptAnalysisService {
  public async analyzeScript(script: Script): Promise<AnalysisResult> {
    // Basic implementation of script analysis
    const issues: string[] = [];
    const recommendations: string[] = [];
    let score = 100;

    // Check script length
    if (script.content.length < 100) {
      issues.push('Skrypt jest zbyt krótki');
      recommendations.push('Dodaj więcej treści do skryptu');
      score -= 20;
    }

    // Check for scene headers
    const sceneHeaders = script.content.match(/INT\.|EXT\./g);
    if (!sceneHeaders || sceneHeaders.length < 3) {
      issues.push('Brak lub za mało nagłówków scen');
      recommendations.push('Dodaj więcej scen z prawidłowymi nagłówkami (INT./EXT.)');
      score -= 15;
    }

    // Check for character names
    const characterNames = script.content.match(/^[A-Z\s]+$/gm);
    if (!characterNames || characterNames.length < 2) {
      issues.push('Brak lub za mało nazwisk postaci');
      recommendations.push('Dodaj więcej postaci z nazwiskami zapisanymi WIELKIMI LITERAMI');
      score -= 15;
    }

    // Check for dialogue
    const dialogueLines = script.content.match(/^\s{20,}[a-zA-Z]/gm);
    if (!dialogueLines || dialogueLines.length < 5) {
      issues.push('Brak lub za mało dialogów');
      recommendations.push('Dodaj więcej dialogów (wcięte o co najmniej 20 spacji)');
      score -= 15;
    }

    // Check for action descriptions
    const actionBlocks = script.content.match(/^[a-z]/gim);
    if (!actionBlocks || actionBlocks.length < 5) {
      issues.push('Brak lub za mało opisów akcji');
      recommendations.push('Dodaj więcej opisów akcji');
      score -= 15;
    }

    // Ensure score doesn't go below 0
    score = Math.max(0, score);

    return {
      score,
      issues,
      recommendations,
    };
  }
}

export const scriptAnalysisService = new ScriptAnalysisService(); 