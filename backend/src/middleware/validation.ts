import { z } from 'zod';
import { WebSocketAuthPayload } from 'shared-types';

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
  }),
  
  // WebSocket authentication validation with improved token validation
  websocketAuth: z.object({
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
  }) satisfies z.ZodType<WebSocketAuthPayload>
};

/**
 * Validates a token against the token store or authentication service
 * @param token The authentication token to validate
 * @returns Object containing validation result and optional expiration time
 */
export const validateAuthToken = (token: string): { 
  valid: boolean; 
  expired?: boolean; 
  expiresAt?: number;
  error?: string;
} => {
  // In a real implementation, this would validate against a token store or auth service
  
  // Basic validation
  if (!token || token.length < 32) {
    return { valid: false, error: 'Invalid token format' };
  }
  
  // Check for token expiration (example implementation)
  const now = Date.now();
  const tokenParts = token.split('.');
  
  if (tokenParts.length >= 3) {
    try {
      // Simulate JWT-like token validation
      const expiresAt = parseInt(tokenParts[1], 10) * 1000; // Convert to milliseconds
      
      if (expiresAt && expiresAt < now) {
        return { valid: false, expired: true, expiresAt, error: 'Token has expired' };
      }
      
      return { valid: true, expiresAt };
    } catch (error) {
      // If parsing fails, continue with basic validation
    }
  }
  
  // For demo purposes, accept tokens that meet basic criteria
  // In production, this would verify signature, check against revocation list, etc.
  return { valid: true };
};
