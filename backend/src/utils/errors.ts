export class AppError extends Error {
  constructor(
    public code: string,
    message: string,
    public details?: Record<string, any>
  ) {
    super(message);
    this.name = this.constructor.name;
  }
}

export class OpenAIError extends AppError {
  constructor(message: string, details?: Record<string, any>) {
    super('OPENAI_ERROR', message, details);
  }
}

export class ValidationError extends AppError {
  constructor(message: string, details?: Record<string, any>) {
    super('VALIDATION_ERROR', message, details);
  }
}

export class FileProcessingError extends AppError {
  constructor(message: string, details?: Record<string, any>) {
    super('FILE_PROCESSING_ERROR', message, details);
  }
}

// Centralized error logging function
export function logError(error: Error, context?: Record<string, any>): void {
  if (error instanceof AppError) {
    console.error({
      code: error.code,
      message: error.message,
      details: error.details,
      ...context
    });
  } else {
    console.error({
      message: error.message,
      stack: error.stack,
      ...context
    });
  }
}

// Error handler middleware for Express
export const errorHandler = (err: Error, req: any, res: any, next: any) => {
  logError(err, { path: req.path, method: req.method });
  
  if (err instanceof AppError) {
    const statusCode = getStatusCodeForErrorCode(err.code);
    return res.status(statusCode).json({
      success: false,
      error: {
        code: err.code,
        message: err.message,
        ...(process.env.NODE_ENV === 'development' ? { details: err.details } : {})
      }
    });
  }
  
  // Generic error
  res.status(500).json({
    success: false,
    error: {
      code: 'INTERNAL_ERROR',
      message: 'An unexpected error occurred'
    }
  });
};

// Helper to map error codes to HTTP status codes
function getStatusCodeForErrorCode(code: string): number {
  const codeMap: Record<string, number> = {
    'VALIDATION_ERROR': 400,
    'OPENAI_ERROR': 400,
    'FILE_PROCESSING_ERROR': 400,
    'UNAUTHORIZED': 401,
    'FORBIDDEN': 403,
    'NOT_FOUND': 404,
    'RATE_LIMIT_EXCEEDED': 429
  };
  
  return codeMap[code] || 500;
}
