/**
 * Rate Limiter Middleware
 * 
 * This middleware implements rate limiting for API endpoints to prevent abuse and DoS attacks.
 * It provides configurable rate limits based on endpoint type and user authentication status.
 */

import rateLimit from 'express-rate-limit';
import { Request, Response, NextFunction } from 'express';

// Define rate limit configurations
const RATE_LIMITS = {
  // Standard API endpoints
  standard: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // 100 requests per window
    message: 'Too many requests from this IP, please try again after 15 minutes'
  },
  // Authentication endpoints (login, register, etc.)
  auth: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10, // 10 requests per window
    message: 'Too many authentication attempts, please try again after 15 minutes'
  },
  // Resource-intensive endpoints (script analysis, etc.)
  intensive: {
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 20, // 20 requests per window
    message: 'Rate limit exceeded for resource-intensive operations, please try again after 1 hour'
  }
};

/**
 * Creates a standard rate limiter middleware
 * @returns Express middleware for standard rate limiting
 */
export const standardLimiter = rateLimit({
  windowMs: RATE_LIMITS.standard.windowMs,
  max: RATE_LIMITS.standard.max,
  message: {
    status: 429,
    error: 'Too Many Requests',
    message: RATE_LIMITS.standard.message
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  handler: (req: Request, res: Response) => {
    res.status(429).json({
      status: 429,
      error: 'Too Many Requests',
      message: RATE_LIMITS.standard.message,
      retryAfter: Math.ceil(RATE_LIMITS.standard.windowMs / 1000)
    });
  }
});

/**
 * Creates an authentication rate limiter middleware
 * @returns Express middleware for authentication rate limiting
 */
export const authLimiter = rateLimit({
  windowMs: RATE_LIMITS.auth.windowMs,
  max: RATE_LIMITS.auth.max,
  message: {
    status: 429,
    error: 'Too Many Requests',
    message: RATE_LIMITS.auth.message
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req: Request, res: Response) => {
    res.status(429).json({
      status: 429,
      error: 'Too Many Requests',
      message: RATE_LIMITS.auth.message,
      retryAfter: Math.ceil(RATE_LIMITS.auth.windowMs / 1000)
    });
  }
});

/**
 * Creates a resource-intensive rate limiter middleware
 * @returns Express middleware for resource-intensive operation rate limiting
 */
export const intensiveLimiter = rateLimit({
  windowMs: RATE_LIMITS.intensive.windowMs,
  max: RATE_LIMITS.intensive.max,
  message: {
    status: 429,
    error: 'Too Many Requests',
    message: RATE_LIMITS.intensive.message
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req: Request, res: Response) => {
    res.status(429).json({
      status: 429,
      error: 'Too Many Requests',
      message: RATE_LIMITS.intensive.message,
      retryAfter: Math.ceil(RATE_LIMITS.intensive.windowMs / 1000)
    });
  }
});

/**
 * Creates a custom rate limiter middleware with specified parameters
 * @param windowMs - Time window in milliseconds
 * @param maxRequests - Maximum number of requests per window
 * @param message - Custom message for rate limit exceeded
 * @returns Express middleware for custom rate limiting
 */
export const createCustomLimiter = (windowMs: number, maxRequests: number, message: string) => {
  return rateLimit({
    windowMs,
    max: maxRequests,
    message: {
      status: 429,
      error: 'Too Many Requests',
      message
    },
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req: Request, res: Response) => {
      res.status(429).json({
        status: 429,
        error: 'Too Many Requests',
        message,
        retryAfter: Math.ceil(windowMs / 1000)
      });
    }
  });
};

export default {
  standardLimiter,
  authLimiter,
  intensiveLimiter,
  createCustomLimiter
};
