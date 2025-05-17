import { z } from 'zod';
import { fileUploadSchema } from 'shared-types';

/**
 * Frontend validation utilities using Zod
 */
export const validateFileUpload = (file: File): { valid: boolean; error?: string } => {
  // Check file type
  const fileType = file.type === 'application/pdf' ? 'pdf' : 
                  file.type === 'text/plain' ? 'txt' : null;
  
  if (!fileType) {
    return { 
      valid: false, 
      error: 'Only PDF or TXT files are allowed.' 
    };
  }
  
  // Check file size (10MB max)
  const maxSize = 10 * 1024 * 1024; // 10MB in bytes
  if (file.size > maxSize) {
    return { 
      valid: false, 
      error: 'File is too large (max 10MB).' 
    };
  }
  
  // Validate using shared schema
  try {
    fileUploadSchema.parse({ type: fileType });
    return { valid: true };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { 
        valid: false, 
        error: error.errors[0].message 
      };
    }
    return { 
      valid: false, 
      error: 'Invalid file.' 
    };
  }
};

/**
 * Validate API key format
 */
export const validateApiKey = (key: string): { valid: boolean; error?: string } => {
  if (!key || key.trim().length < 32) {
    return {
      valid: false,
      error: 'API key must be at least 32 characters long.'
    };
  }
  
  if (key.trim().length > 64) {
    return {
      valid: false,
      error: 'API key cannot be longer than 64 characters.'
    };
  }
  
  return { valid: true };
};
