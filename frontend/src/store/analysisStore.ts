import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { AnalysisResult, AnalysisProgress } from 'shared-types';

interface AnalysisState {
  // Analysis status
  isAnalyzing: boolean;
  progress: AnalysisProgress | null;
  result: AnalysisResult | null;
  error: string | null;
  
  // Actions
  setAnalyzing: (isAnalyzing: boolean) => void;
  setProgress: (progress: AnalysisProgress) => void;
  setResult: (result: AnalysisResult) => void;
  setError: (error: string | null) => void;
  reset: () => void;
}

export const useAnalysisStore = create<AnalysisState>()(
  devtools(
    (set) => ({
      // Initial state
      isAnalyzing: false,
      progress: null,
      result: null,
      error: null,
      
      // Actions
      setAnalyzing: (isAnalyzing) => set({ isAnalyzing }),
      setProgress: (progress) => set({ progress }),
      setResult: (result) => set({ 
        result,
        isAnalyzing: false,
        progress: {
          stage: 'complete',
          progress: 100,
          message: 'Analysis complete'
        }
      }),
      setError: (error) => set({ 
        error,
        isAnalyzing: false,
        progress: error ? {
          stage: 'error',
          progress: 0,
          message: error
        } : null
      }),
      reset: () => set({
        isAnalyzing: false,
        progress: null,
        result: null,
        error: null
      })
    }),
    { name: 'analysis-store' }
  )
);
