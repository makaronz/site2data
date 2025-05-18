import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { errorHandler, AppError, createErrorResponse, asyncHandler } from '../middleware/errorHandler';

describe('Error Handler Middleware', () => {
  let req: any;
  let res: any;
  let next: any;

  beforeEach(() => {
    req = {};
    res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn()
    };
    next = vi.fn();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('errorHandler', () => {
    it('should handle errors with status code', () => {
      const err = new Error('Test error');
      (err as any).status = 400;
      (err as any).code = 'TEST_ERROR';
      
      errorHandler(err as any, req, res, next);
      
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: {
          message: 'Test error',
          code: 'TEST_ERROR',
          status: 400
        }
      });
    });

    it('should use default status code and error code if not provided', () => {
      const err = new Error('Test error');
      
      errorHandler(err as any, req, res, next);
      
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        error: {
          message: 'Test error',
          code: 'INTERNAL_ERROR',
          status: 500
        }
      });
    });

    it('should include stack trace in development environment', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';
      
      const err = new Error('Test error');
      err.stack = 'Error stack trace';
      
      errorHandler(err as any, req, res, next);
      
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        error: expect.objectContaining({
          stack: 'Error stack trace'
        })
      }));
      
      process.env.NODE_ENV = originalEnv;
    });
  });

  describe('AppError', () => {
    it('should create an error with custom properties', () => {
      const error = new AppError('Custom error', 403, 'FORBIDDEN');
      
      expect(error.message).toBe('Custom error');
      expect(error.status).toBe(403);
      expect(error.code).toBe('FORBIDDEN');
      expect(error.stack).toBeDefined();
    });

    it('should use default values if not provided', () => {
      const error = new AppError('Default error');
      
      expect(error.message).toBe('Default error');
      expect(error.status).toBe(500);
      expect(error.code).toBe('INTERNAL_ERROR');
    });
  });

  describe('createErrorResponse', () => {
    it('should create a standardized error response object', () => {
      const response = createErrorResponse('Error message', 404, 'NOT_FOUND');
      
      expect(response).toEqual({
        error: {
          message: 'Error message',
          code: 'NOT_FOUND',
          status: 404
        }
      });
    });

    it('should use default values if not provided', () => {
      const response = createErrorResponse('Default error');
      
      expect(response).toEqual({
        error: {
          message: 'Default error',
          code: 'INTERNAL_ERROR',
          status: 500
        }
      });
    });
  });

  describe('asyncHandler', () => {
    it('should pass errors to next middleware', async () => {
      const error = new Error('Async error');
      const asyncFn = vi.fn().mockRejectedValue(error);
      const wrappedFn = asyncHandler(asyncFn);
      
      await wrappedFn(req, res, next);
      
      expect(asyncFn).toHaveBeenCalledWith(req, res, next);
      expect(next).toHaveBeenCalledWith(error);
    });

    it('should resolve normally when no error occurs', async () => {
      const asyncFn = vi.fn().mockResolvedValue('result');
      const wrappedFn = asyncHandler(asyncFn);
      
      await wrappedFn(req, res, next);
      
      expect(asyncFn).toHaveBeenCalledWith(req, res, next);
      expect(next).not.toHaveBeenCalled();
    });
  });
});
