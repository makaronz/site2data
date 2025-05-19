/**
 * WebSocket message types and interfaces
 * 
 * This file contains all the type definitions for WebSocket communication
 * between the frontend and backend.
 */

import { z } from 'zod';

/**
 * WebSocket message types
 */
export enum WebSocketMessageType {
  AUTH = 'AUTH',
  ANALYZE_SCRIPT = 'ANALYZE_SCRIPT',
  PROGRESS = 'PROGRESS',
  ANALYSIS_RESULT = 'ANALYSIS_RESULT',
  ERROR = 'ERROR'
}

/**
 * Base WebSocket message interface
 */
export interface WebSocketMessage {
  type: WebSocketMessageType;
}

/**
 * Authentication payload for WebSocket connections
 */
export interface WebSocketAuthPayload extends WebSocketMessage {
  type: WebSocketMessageType.AUTH;
  token: string;
  sessionId?: string;
  timestamp?: number;
  clientId?: string;
}

/**
 * Script analysis request message
 */
export interface AnalyzeScriptMessage extends WebSocketMessage {
  type: WebSocketMessageType.ANALYZE_SCRIPT;
  script: {
    content: string;
    type?: 'pdf' | 'txt';
    filename?: string;
  };
}

/**
 * Progress update message
 */
export interface ProgressMessage extends WebSocketMessage {
  type: WebSocketMessageType.PROGRESS;
  message: string;
  stage?: string;
  progress: number;
  analysisId?: string;
  elapsedTime?: number;
  expiresAt?: number;
}

/**
 * Analysis result message
 */
export interface AnalysisResultMessage extends WebSocketMessage {
  type: WebSocketMessageType.ANALYSIS_RESULT;
  result: any; // Will be typed more specifically in future versions
  analysisId: string;
}

/**
 * Error message
 */
export interface ErrorMessage extends WebSocketMessage {
  type: WebSocketMessageType.ERROR;
  message: string;
  code?: string;
  details?: string;
  analysisId?: string;
  expired?: boolean;
}

/**
 * Union type of all WebSocket messages
 */
export type WebSocketMessageUnion = 
  | WebSocketAuthPayload
  | AnalyzeScriptMessage
  | ProgressMessage
  | AnalysisResultMessage
  | ErrorMessage;

/**
 * WebSocket client interface with additional properties
 */
export interface WebSocketClient {
  id: string;
  isAlive: boolean;
  send: (data: string) => void;
  on: (event: string, listener: (...args: any[]) => void) => void;
  ping: () => void;
  terminate: () => void;
  close: (code?: number, reason?: string) => void;
  _socket: {
    remoteAddress: string;
  };
}

/**
 * Zod schema for WebSocket authentication payload
 */
export const websocketAuthSchema = z.object({
  type: z.literal(WebSocketMessageType.AUTH),
  token: z.string()
    .min(32, "Token must be at least 32 characters long")
    .max(256, "Token cannot exceed 256 characters")
    .regex(/^[A-Za-z0-9_\-\.]+$/, "Token must contain only alphanumeric characters, underscores, hyphens, and dots")
    .refine(
      (token) => !token.includes(".."), 
      "Token cannot contain consecutive dots"
    ),
  sessionId: z.string().uuid().optional(),
  timestamp: z.number().int().positive().optional(),
  clientId: z.string().optional()
});

/**
 * Zod schema for script analysis request
 */
export const analyzeScriptSchema = z.object({
  type: z.literal(WebSocketMessageType.ANALYZE_SCRIPT),
  script: z.object({
    content: z.string().min(1, "Script content cannot be empty"),
    type: z.enum(['pdf', 'txt']).optional().default('txt'),
    filename: z.string().optional()
  })
});

/**
 * Zod schema for progress message
 */
export const progressMessageSchema = z.object({
  type: z.literal(WebSocketMessageType.PROGRESS),
  message: z.string(),
  stage: z.string().optional(),
  progress: z.number().min(0).max(100),
  analysisId: z.string().optional(),
  elapsedTime: z.number().optional(),
  expiresAt: z.number().optional()
});

/**
 * Zod schema for analysis result message
 */
export const analysisResultSchema = z.object({
  type: z.literal(WebSocketMessageType.ANALYSIS_RESULT),
  result: z.any(), // Will be typed more specifically in future versions
  analysisId: z.string()
});

/**
 * Zod schema for error message
 */
export const errorMessageSchema = z.object({
  type: z.literal(WebSocketMessageType.ERROR),
  message: z.string(),
  code: z.string().optional(),
  details: z.string().optional(),
  analysisId: z.string().optional(),
  expired: z.boolean().optional()
});

/**
 * Union schema for all WebSocket messages
 */
export const websocketMessageSchema = z.discriminatedUnion('type', [
  websocketAuthSchema,
  analyzeScriptSchema,
  progressMessageSchema,
  analysisResultSchema,
  errorMessageSchema
]);
