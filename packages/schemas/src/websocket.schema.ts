import { z } from 'zod';
import { JobStatusSchema } from './job.schema'; // Zakładając, że JobStatusSchema jest w job.schema.ts

// --- Typy zdarzeń WebSocket ---
export const WebSocketEventTypeSchema = z.enum([
  'JOB_STATUS_UPDATE',
  'SCENE_ANALYSIS_UPDATE',
  'ERROR_EVENT',
  // Można dodać więcej typów w przyszłości, np. CHUNKING_PROGRESS
]);
export type WebSocketEventType = z.infer<typeof WebSocketEventTypeSchema>;

// --- Ogólna struktura wiadomości WebSocket ---
export const BaseWebSocketMessageSchema = z.object({
  type: WebSocketEventTypeSchema,
  jobId: z.string(),
});
export type BaseWebSocketMessage = z.infer<typeof BaseWebSocketMessageSchema>;

// --- Schematy dla konkretnych typów zdarzeń ---

// Aktualizacja statusu całego zadania
export const JobStatusUpdatePayloadSchema = z.object({
  status: JobStatusSchema,
  progress: z.number().min(0).max(100).optional(),
  message: z.string().optional(),
});
export type JobStatusUpdatePayload = z.infer<typeof JobStatusUpdatePayloadSchema>;

export const JobStatusUpdateMessageSchema = BaseWebSocketMessageSchema.extend({
  type: z.literal(WebSocketEventTypeSchema.enum.JOB_STATUS_UPDATE),
  payload: JobStatusUpdatePayloadSchema,
});
export type JobStatusUpdateMessage = z.infer<typeof JobStatusUpdateMessageSchema>;

// Aktualizacja dotycząca analizy konkretnej sceny (przykładowa)
export const SceneAnalysisUpdatePayloadSchema = z.object({
  sceneId: z.string(), // Identyfikator analizowanej sceny
  status: z.string(), // Np. 'processing', 'completed', 'failed'
  data: z.any().optional(), // Opcjonalne dodatkowe dane, np. wstępne wyniki
  message: z.string().optional(),
});
export type SceneAnalysisUpdatePayload = z.infer<typeof SceneAnalysisUpdatePayloadSchema>;

export const SceneAnalysisUpdateMessageSchema = BaseWebSocketMessageSchema.extend({
  type: z.literal(WebSocketEventTypeSchema.enum.SCENE_ANALYSIS_UPDATE),
  payload: SceneAnalysisUpdatePayloadSchema,
});
export type SceneAnalysisUpdateMessage = z.infer<typeof SceneAnalysisUpdateMessageSchema>;

// Zdarzenie błędu
export const ErrorEventPayloadSchema = z.object({
  message: z.string(),
  errorCode: z.string().optional(), // Opcjonalny kod błędu
});
export type ErrorEventPayload = z.infer<typeof ErrorEventPayloadSchema>;

export const ErrorEventMessageSchema = BaseWebSocketMessageSchema.extend({
  type: z.literal(WebSocketEventTypeSchema.enum.ERROR_EVENT),
  payload: ErrorEventPayloadSchema,
});
export type ErrorEventMessage = z.infer<typeof ErrorEventMessageSchema>;

// --- Unia wszystkich możliwych wiadomości --- 
export const WebSocketMessageSchema = z.discriminatedUnion("type", [
  JobStatusUpdateMessageSchema,
  SceneAnalysisUpdateMessageSchema,
  ErrorEventMessageSchema,
]);
export type WebSocketMessage = z.infer<typeof WebSocketMessageSchema>;

// Helper do sprawdzania typów w kodzie
export const isJobStatusUpdate = (msg: WebSocketMessage): msg is JobStatusUpdateMessage => msg.type === WebSocketEventTypeSchema.enum.JOB_STATUS_UPDATE;
export const isSceneAnalysisUpdate = (msg: WebSocketMessage): msg is SceneAnalysisUpdateMessage => msg.type === WebSocketEventTypeSchema.enum.SCENE_ANALYSIS_UPDATE;
export const isErrorEvent = (msg: WebSocketMessage): msg is ErrorEventMessage => msg.type === WebSocketEventTypeSchema.enum.ERROR_EVENT; 