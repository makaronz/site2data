import { Script } from '../models/script';
import { analyzeScript } from '../script_analysis/analyzer';

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
    if (script.content.length < 10) {
      issues.push('Script is too short');
      recommendations.push('Add more content to the script');
      score -= 20;
    }

    // Check for basic formatting
    if (!script.content.includes('\n')) {
      issues.push('Script lacks proper formatting');
      recommendations.push('Add line breaks to improve readability');
      score -= 10;
    }

    // Check for comments
    if (!script.content.includes('//') && !script.content.includes('/*')) {
      issues.push('Script lacks comments');
      recommendations.push('Add comments to explain the code');
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

export { analyzeScript }; 