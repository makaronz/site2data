import { z } from 'zod';

/**
 * Shared validation schemas for frontend and backend
 */

// File upload validation
export const fileUploadSchema = z.object({
  type: z.enum(['pdf', 'txt']),
  model: z.string().optional(),
  maxSize: z.number().int().positive().default(10 * 1024 * 1024) // 10MB default
});

// API key validation
export const apiKeySchema = z.object({
  key: z.string().min(32).max(64)
});

// Analysis request validation
export const analysisRequestSchema = z.object({
  fileId: z.string().uuid(),
  options: z.object({
    detailed: z.boolean().default(true),
    language: z.enum(['en', 'pl']).default('en'),
    includeMetadata: z.boolean().default(true)
  }).optional()
});

// Pagination parameters
export const paginationSchema = z.object({
  page: z.number().int().positive().default(1),
  limit: z.number().int().min(1).max(100).default(20)
});

// ID parameter
export const idSchema = z.object({
  id: z.string().uuid()
});

// Export validation types
export type FileUploadValidation = z.infer<typeof fileUploadSchema>;
export type ApiKeyValidation = z.infer<typeof apiKeySchema>;
export type AnalysisRequestValidation = z.infer<typeof analysisRequestSchema>;
export type PaginationValidation = z.infer<typeof paginationSchema>;
export type IdValidation = z.infer<typeof idSchema>;
