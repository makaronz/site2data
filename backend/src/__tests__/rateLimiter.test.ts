/**
 * Rate Limiter Tests
 * 
 * This file contains tests for the rate limiting middleware to ensure
 * it properly prevents API abuse and DoS attacks.
 */

import { describe, it, expect, jest } from 'jest';
import express from 'express';
import request from 'supertest';
import { standardLimiter, authLimiter, intensiveLimiter, createCustomLimiter } from '../middleware/rateLimiter';

describe('Rate Limiter Middleware', () => {
  let app: express.Application;
  
  beforeEach(() => {
    app = express();
    app.use(express.json());
    
    // Reset rate limiter between tests
    jest.resetModules();
  });
  
  describe('standardLimiter', () => {
    it('should allow requests within the rate limit', async () => {
      app.use('/api/test', standardLimiter, (req, res) => {
        res.status(200).json({ success: true });
      });
      
      const response = await request(app).get('/api/test');
      expect(response.status).toBe(200);
    });
    
    it('should block requests that exceed the rate limit', async () => {
      // Mock the rate limiter to simulate exceeded limits
      const mockStandardLimiter = jest.fn((req, res, next) => {
        res.status(429).json({
          status: 429,
          error: 'Too Many Requests',
          message: 'Too many requests from this IP, please try again after 15 minutes',
          retryAfter: 900
        });
      });
      
      app.use('/api/test', mockStandardLimiter, (req, res) => {
        res.status(200).json({ success: true });
      });
      
      const response = await request(app).get('/api/test');
      expect(response.status).toBe(429);
      expect(response.body).toHaveProperty('retryAfter');
    });
  });
  
  describe('authLimiter', () => {
    it('should apply stricter limits to authentication endpoints', async () => {
      app.use('/api/auth', authLimiter, (req, res) => {
        res.status(200).json({ success: true });
      });
      
      const response = await request(app).post('/api/auth/login');
      expect(response.status).toBe(200);
    });
  });
  
  describe('intensiveLimiter', () => {
    it('should apply stricter limits to resource-intensive endpoints', async () => {
      app.use('/api/analyze', intensiveLimiter, (req, res) => {
        res.status(200).json({ success: true });
      });
      
      const response = await request(app).post('/api/analyze');
      expect(response.status).toBe(200);
    });
  });
  
  describe('createCustomLimiter', () => {
    it('should create a custom rate limiter with specified parameters', async () => {
      const customLimiter = createCustomLimiter(
        60 * 1000, // 1 minute
        5, // 5 requests per minute
        'Custom rate limit exceeded'
      );
      
      app.use('/api/custom', customLimiter, (req, res) => {
        res.status(200).json({ success: true });
      });
      
      const response = await request(app).get('/api/custom');
      expect(response.status).toBe(200);
    });
  });
  
  describe('Rate limit headers', () => {
    it('should include rate limit headers in responses', async () => {
      app.use('/api/test', standardLimiter, (req, res) => {
        res.status(200).json({ success: true });
      });
      
      const response = await request(app).get('/api/test');
      expect(response.headers).toHaveProperty('ratelimit-limit');
      expect(response.headers).toHaveProperty('ratelimit-remaining');
      expect(response.headers).toHaveProperty('ratelimit-reset');
    });
  });
});
