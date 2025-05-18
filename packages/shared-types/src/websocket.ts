import { z } from 'zod';

/**
 * Shared WebSocket message types for frontend and backend
 */

// Base message interface with discriminated union type
export interface WebSocketMessage {
  type: 'AUTH' | 'ANALYZE_SCRIPT' | 'PROGRESS' | 'ANALYSIS_RESULT' | 'ERROR';
}

// Authentication payload with specific token format requirements
export interface WebSocketAuthPayload {
  token: string;
  sessionId?: string;
  timestamp?: number;
  clientId?: string;
}

// Progress update with detailed stage information
export interface AnalysisProgress {
  stage: 'initialization' | 'parsing' | 'processing' | 'analyzing' | 'finalizing' | 'complete' | 'error';
  progress: number; // 0-100
  message: string;
  elapsedTime?: number;
  analysisId?: string;
}

// Analysis result with strongly typed structure
export interface AnalysisResult {
  metadata: {
    title: string;
    authors: string[];
    detected_language: string;
    scene_count: number;
    token_count: number;
    analysis_timestamp: string;
  };
  analysis: {
    characters: Character[];
    scenes: Scene[];
    relationships: Relationship[];
    themes: Theme[];
    sentiment: SentimentAnalysis;
  };
}

// Detailed character information
export interface Character {
  id: number;
  name: string;
  description?: string;
  importance: 'main' | 'supporting' | 'minor';
  scenes: number[];
  traits?: string[];
  relationships?: number[];
}

// Scene structure with specific properties
export interface Scene {
  id: number;
  description: string;
  characters: number[];
  location?: string;
  time?: string;
  sentiment?: number; // -1 to 1
}

// Relationship between characters
export interface Relationship {
  id: number;
  source: number; // character id
  target: number; // character id
  type: 'family' | 'friend' | 'romantic' | 'professional' | 'adversarial' | 'other';
  strength: number; // 0-1
  description?: string;
}

// Theme analysis
export interface Theme {
  name: string;
  relevance: number; // 0-1
  scenes: number[];
}

// Sentiment analysis results
export interface SentimentAnalysis {
  overall: number; // -1 to 1
  by_scene: {
    scene_id: number;
    sentiment: number; // -1 to 1
  }[];
}

// Error message with code and details
export interface ErrorMessage extends WebSocketMessage {
  type: 'ERROR';
  message: string;
  code?: string;
  details?: string;
  expired?: boolean;
}

// Zod schemas for runtime validation
export const characterSchema = z.object({
  id: z.number().int().positive(),
  name: z.string().min(1),
  description: z.string().optional(),
  importance: z.enum(['main', 'supporting', 'minor']),
  scenes: z.array(z.number().int().nonnegative()),
  traits: z.array(z.string()).optional(),
  relationships: z.array(z.number().int().nonnegative()).optional()
});

export const sceneSchema = z.object({
  id: z.number().int().positive(),
  description: z.string().min(1),
  characters: z.array(z.number().int().nonnegative()),
  location: z.string().optional(),
  time: z.string().optional(),
  sentiment: z.number().min(-1).max(1).optional()
});

export const relationshipSchema = z.object({
  id: z.number().int().positive(),
  source: z.number().int().nonnegative(),
  target: z.number().int().nonnegative(),
  type: z.enum(['family', 'friend', 'romantic', 'professional', 'adversarial', 'other']),
  strength: z.number().min(0).max(1),
  description: z.string().optional()
});

export const themeSchema = z.object({
  name: z.string().min(1),
  relevance: z.number().min(0).max(1),
  scenes: z.array(z.number().int().nonnegative())
});

export const sentimentAnalysisSchema = z.object({
  overall: z.number().min(-1).max(1),
  by_scene: z.array(z.object({
    scene_id: z.number().int().positive(),
    sentiment: z.number().min(-1).max(1)
  }))
});

export const analysisResultSchema = z.object({
  metadata: z.object({
    title: z.string(),
    authors: z.array(z.string()),
    detected_language: z.string(),
    scene_count: z.number().int().nonnegative(),
    token_count: z.number().int().positive(),
    analysis_timestamp: z.string().datetime()
  }),
  analysis: z.object({
    characters: z.array(characterSchema),
    scenes: z.array(sceneSchema),
    relationships: z.array(relationshipSchema),
    themes: z.array(themeSchema),
    sentiment: sentimentAnalysisSchema
  })
});

export const analysisProgressSchema = z.object({
  stage: z.enum(['initialization', 'parsing', 'processing', 'analyzing', 'finalizing', 'complete', 'error']),
  progress: z.number().min(0).max(100),
  message: z.string(),
  elapsedTime: z.number().optional(),
  analysisId: z.string().optional()
});

export const errorMessageSchema = z.object({
  type: z.literal('ERROR'),
  message: z.string(),
  code: z.string().optional(),
  details: z.string().optional(),
  expired: z.boolean().optional()
});
