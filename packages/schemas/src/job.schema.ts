import { z } from 'zod';

export const JobStatusSchema = z.enum([
  'created',
  'uploading',
  'uploaded',
  'queued_for_chunking',
  'chunking',
  'chunking_failed',
  'chunking_complete',
  'queued_for_analysis',
  'analyzing',
  'analysis_failed',
  'analysis_complete',
  'generating_graph',
  'graph_generation_failed',
  'graph_generation_complete',
  'completed',
  'failed',
]);
export type JobStatus = z.infer<typeof JobStatusSchema>;

export const JobSchema = z.object({
  _id: z.string(), // MongoDB ObjectId
  filename: z.string(),
  originalFilename: z.string().optional(), // If different from stored filename
  objectKey: z.string(), // Key in MinIO
  status: JobStatusSchema,
  progress: z.number().min(0).max(100).optional(), // Overall progress percentage
  statusMessage: z.string().optional(), // User-friendly status message
  createdAt: z.date(),
  updatedAt: z.date(),
  analysisResults: z.any().optional(), // To be replaced with specific result schemas later
  userId: z.string().optional(), // If multi-user support is added
});
export type Job = z.infer<typeof JobSchema>;

export const PresignedUrlRequestSchema = z.object({
  filename: z.string().min(1, { message: "Filename is required" }),
});
export type PresignedUrlRequest = z.infer<typeof PresignedUrlRequestSchema>;

export const PresignedUrlResponseSchema = z.object({
  uploadUrl: z.string().url(),
  jobId: z.string(),
  objectKey: z.string(),
});
export type PresignedUrlResponse = z.infer<typeof PresignedUrlResponseSchema>;

export const NotifyUploadCompleteRequestSchema = z.object({
  // No specific body needed if jobId is in URL, or could include objectKey if necessary
  // objectKey: z.string().optional(), 
});
export type NotifyUploadCompleteRequest = z.infer<typeof NotifyUploadCompleteRequestSchema>;

export const NotifyUploadCompleteResponseSchema = z.object({
  status: JobStatusSchema, // or a more specific status like 'queued_for_chunking'
  jobId: z.string(),
  message: z.string().optional(),
});
export type NotifyUploadCompleteResponse = z.infer<typeof NotifyUploadCompleteResponseSchema>; 