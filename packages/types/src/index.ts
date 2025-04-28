// Example shared types

export type JobStatus = 'PENDING' | 'CHUNKING' | 'ANALYZING' | 'GENERATING_GRAPH' | 'COMPLETED' | 'FAILED';

export interface Job {
  jobId: string;
  status: JobStatus;
  objectKey: string; // Key in S3/MinIO
  createdAt: Date;
  updatedAt: Date;
  sceneCount?: number;
  processedScenes?: number;
  finalResultUrl?: string; // URL to the final ZIP in S3/MinIO
  errorMessage?: string;
}

export interface SceneAnalysisResult {
  title: string; // Concise title
  summary: string; // 2-3 sentence summary
  characters: string[]; // List of character names
  locations: string[]; // List of locations
  emotions: { // Dictionary of emotions and scores (0.0-1.0)
    joy?: number;
    sadness?: number;
    anger?: number;
    fear?: number;
    surprise?: number;
    anticipation?: number;
    trust?: number;
    disgust?: number;
  };
}

// JSON Schema for SceneAnalysisResult (for Ajv validation)
// Consider making this more robust, adding descriptions, examples etc.
export const SceneAnalysisResultSchema = {
  type: 'object',
  properties: {
    title: { type: 'string', maxLength: 100 }, // Example constraint
    summary: { type: 'string', minLength: 10 }, // Example constraint
    characters: { type: 'array', items: { type: 'string' } },
    locations: { type: 'array', items: { type: 'string' } },
    emotions: {
      type: 'object',
      properties: {
        joy: { type: 'number', minimum: 0, maximum: 1 },
        sadness: { type: 'number', minimum: 0, maximum: 1 },
        anger: { type: 'number', minimum: 0, maximum: 1 },
        fear: { type: 'number', minimum: 0, maximum: 1 },
        surprise: { type: 'number', minimum: 0, maximum: 1 },
        anticipation: { type: 'number', minimum: 0, maximum: 1 },
        trust: { type: 'number', minimum: 0, maximum: 1 },
        disgust: { type: 'number', minimum: 0, maximum: 1 },
      },
      additionalProperties: false, // Disallow other emotion properties
    },
  },
  required: ['title', 'summary', 'characters', 'locations', 'emotions'],
  additionalProperties: false, // Disallow any properties not listed above
} as const; // Use 'as const' for better type inference with Ajv

export interface Scene {
  sceneId: string;
  jobId: string;
  sceneNumber: number;
  sceneText: string;
  status: 'PENDING_ANALYSIS' | 'ANALYZED' | 'INDEXED' | 'FAILED_ANALYSIS';
  analysisResult?: SceneAnalysisResult;
  embedding?: number[]; // Optional, might be stored only in Weaviate
  errorMessage?: string;
}

// Type for SSE progress messages
export interface ProgressUpdate {
  jobId: string;
  status: JobStatus;
  progress: number; // e.g., 0-100 or processedScenes/sceneCount
  message?: string;
  finalResultUrl?: string; // Sent when completed
} 