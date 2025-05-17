import { Request, Response, NextFunction } from 'express';

/**
 * Centralized error handling middleware for Express
 */
export const errorHandler = (
  err: Error & { status?: number; code?: string },
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // Set default status code if not provided
  const statusCode = err.status || 500;
  
  // Log the error (in production, you might want to use a proper logging service)
  console.error(`[ERROR] ${statusCode} - ${err.message}`);
  if (statusCode === 500) {
    console.error(err.stack);
  }
  
  // Prepare error response
  const errorResponse = {
    error: {
      message: err.message || 'Internal Server Error',
      code: err.code || 'INTERNAL_ERROR',
      status: statusCode
    }
  };
  
  // Add stack trace in development environment
  if (process.env.NODE_ENV !== 'production' && err.stack) {
    errorResponse.error.stack = err.stack;
  }
  
  // Send error response
  res.status(statusCode).json(errorResponse);
};

/**
 * Custom error class with status code and error code
 */
export class AppError extends Error {
  status: number;
  code: string;
  
  constructor(message: string, status = 500, code = 'INTERNAL_ERROR') {
    super(message);
    this.name = this.constructor.name;
    this.status = status;
    this.code = code;
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Utility function to create standardized error responses
 */
export const createErrorResponse = (
  message: string,
  status = 500,
  code = 'INTERNAL_ERROR'
) => {
  return {
    error: {
      message,
      code,
      status
    }
  };
};

/**
 * Async handler to catch errors in async route handlers
 */
export const asyncHandler = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};
