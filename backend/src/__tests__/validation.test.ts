import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { validateRequest, validationSchemas } from '../middleware/validation';
import { z } from 'zod';

describe('Validation Middleware', () => {
  let req: any;
  let res: any;
  let next: any;

  beforeEach(() => {
    req = {
      body: {},
      query: {},
      params: {}
    };
    res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn()
    };
    next = vi.fn();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('validateRequest', () => {
    it('should call next() when validation passes', () => {
      const schema = {
        body: z.object({
          name: z.string()
        })
      };
      req.body = { name: 'Test' };
      
      validateRequest(schema)(req, res, next);
      
      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    it('should return 400 when body validation fails', () => {
      const schema = {
        body: z.object({
          name: z.string()
        })
      };
      req.body = { name: 123 }; // Invalid type
      
      validateRequest(schema)(req, res, next);
      
      expect(next).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        error: expect.objectContaining({
          message: 'Validation error',
          code: 'VALIDATION_ERROR'
        })
      }));
    });

    it('should validate query parameters correctly', () => {
      const schema = {
        query: z.object({
          page: z.string().transform(val => parseInt(val, 10))
        })
      };
      req.query = { page: '5' };
      
      validateRequest(schema)(req, res, next);
      
      expect(next).toHaveBeenCalled();
      expect(req.query.page).toBe(5); // Transformed to number
    });

    it('should validate route parameters correctly', () => {
      const schema = {
        params: z.object({
          id: z.string().uuid()
        })
      };
      req.params = { id: '123e4567-e89b-12d3-a456-426614174000' };
      
      validateRequest(schema)(req, res, next);
      
      expect(next).toHaveBeenCalled();
    });

    it('should pass error to next() if not a ZodError', () => {
      const schema = {
        body: {
          parse: () => { throw new Error('Not a ZodError'); }
        }
      };
      
      validateRequest(schema as any)(req, res, next);
      
      expect(next).toHaveBeenCalledWith(expect.any(Error));
      expect(res.status).not.toHaveBeenCalled();
    });
  });

  describe('validationSchemas', () => {
    it('should validate fileUpload schema correctly', () => {
      const valid = { type: 'pdf' };
      const invalid = { type: 'doc' };
      
      expect(() => validationSchemas.fileUpload.parse(valid)).not.toThrow();
      expect(() => validationSchemas.fileUpload.parse(invalid)).toThrow();
    });

    it('should validate apiKey schema correctly', () => {
      const valid = { key: '12345678901234567890123456789012' }; // 32 chars
      const invalid = { key: '123' };
      
      expect(() => validationSchemas.apiKey.parse(valid)).not.toThrow();
      expect(() => validationSchemas.apiKey.parse(invalid)).toThrow();
    });

    it('should validate pagination schema with defaults', () => {
      const result = validationSchemas.pagination.parse({});
      
      expect(result).toEqual({ page: 1, limit: 20 });
    });

    it('should validate websocketAuth schema correctly', () => {
      const valid = { token: '12345678901234567890' };
      const invalid = { token: '123' };
      
      expect(() => validationSchemas.websocketAuth.parse(valid)).not.toThrow();
      expect(() => validationSchemas.websocketAuth.parse(invalid)).toThrow();
    });
  });
});
