import { useEffect, useState, useCallback } from 'react';
import { useWebSocket } from '../contexts/WebSocketContext';
import { WebSocketMessage, AnalysisProgress, AnalysisResult } from 'shared-types';

interface UseScriptAnalysisProps {
  onProgress?: (progress: AnalysisProgress) => void;
  onResult?: (result: AnalysisResult) => void;
  onError?: (error: string) => void;
}

export const useScriptAnalysis = ({ onProgress, onResult, onError }: UseScriptAnalysisProps = {}) => {
  const { connected, sendMessage, lastMessage, connectionStatus } = useWebSocket();
  const [analyzing, setAnalyzing] = useState(false);
  const [progress, setProgress] = useState<AnalysisProgress>({
    stage: 'uploading',
    progress: 0,
    message: 'Preparing analysis...'
  });
  const [result, setResult] = useState<AnalysisResult | null>(null);
  
  // Handle incoming WebSocket messages
  useEffect(() => {
    if (!lastMessage) return;
    
    switch (lastMessage.type) {
      case 'PROGRESS':
        if (lastMessage.message) {
          const progressUpdate: AnalysisProgress = {
            stage: 'processing',
            progress: progress.progress + 0.1, // Simple increment for demo
            message: lastMessage.message
          };
          setProgress(progressUpdate);
          onProgress?.(progressUpdate);
        }
        break;
        
      case 'ANALYSIS_RESULT':
        if (lastMessage.result) {
          setAnalyzing(false);
          setResult(lastMessage.result);
          setProgress({
            stage: 'complete',
            progress: 100,
            message: 'Analysis complete'
          });
          onResult?.(lastMessage.result);
        }
        break;
        
      case 'ERROR':
        setAnalyzing(false);
        setProgress({
          stage: 'error',
          progress: 0,
          message: lastMessage.message || 'Unknown error'
        });
        onError?.(lastMessage.message || 'Unknown error');
        break;
    }
  }, [lastMessage, onProgress, onResult, onError, progress.progress]);
  
  // Function to start script analysis
  const analyzeScript = useCallback((script: File) => {
    if (!connected) {
      onError?.('WebSocket not connected');
      return;
    }
    
    setAnalyzing(true);
    setProgress({
      stage: 'uploading',
      progress: 0,
      message: 'Uploading script...'
    });
    
    // Create a message to send via WebSocket
    const message: WebSocketMessage = {
      type: 'ANALYZE_SCRIPT',
      script
    };
    
    sendMessage(message);
  }, [connected, sendMessage, onError]);
  
  return {
    analyzeScript,
    analyzing,
    progress,
    result,
    connected,
    connectionStatus
  };
};
