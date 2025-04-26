export interface ProgressUpdate {
  stage: 'uploading' | 'processing' | 'analyzing' | 'complete' | 'error';
  progress: number;
  message: string;
  estimatedTimeRemaining?: number;
  startTime?: number;
  endTime?: number;
} 