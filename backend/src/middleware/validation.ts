import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';

/**
 * Middleware for validating request data against Zod schemas
 */
export const validateRequest = (schema: {
  body?: z.ZodType<any>;
  query?: z.ZodType<any>;
  params?: z.ZodType<any>;
}) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      // Validate request body if schema provided
      if (schema.body) {
        req.body = schema.body.parse(req.body);
      }
      
      // Validate query parameters if schema provided
      if (schema.query) {
        req.query = schema.query.parse(req.query);
      }
      
      // Validate route parameters if schema provided
      if (schema.params) {
        req.params = schema.params.parse(req.params);
      }
      
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          error: {
            message: 'Validation error',
            code: 'VALIDATION_ERROR',
            status: 400,
            details: error.errors.map(err => ({
              path: err.path.join('.'),
              message: err.message
            }))
          }
        });
      }
      
      next(error);
    }
  };
};

/**
 * Common validation schemas
 */
export const validationSchemas = {
  // File upload validation
  fileUpload: z.object({
    type: z.enum(['pdf', 'txt']),
    model: z.string().optional()
  }),
  
  // API key validation
  apiKey: z.object({
    key: z.string().min(32).max(64)
  }),
  
  // Pagination parameters
  pagination: z.object({
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20)
  }),
  
  // ID parameter
  id: z.object({
    id: z.string().uuid()
  })
};
