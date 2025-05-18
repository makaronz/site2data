import { describe, it, expect, vi, beforeEach } from 'vitest';
import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

// Import the router module to test
import router, { handleWebSocket } from '../routes/scriptAnalysis';

// Mock dependencies
vi.mock('multer', () => {
  const originalModule = vi.importActual('multer');
  
  // Create a mock implementation that exposes the fileFilter for testing
  const mockMulter = function(options: any) {
    // Store the fileFilter for testing
    mockMulter.lastOptions = options;
    
    // Return a mock middleware
    return {
      single: () => (req: any, res: any, next: any) => next()
    };
  };
  
  // Add storage property to match the original module
  mockMulter.diskStorage = originalModule.diskStorage;
  
  // Add a property to store the last options for testing
  mockMulter.lastOptions = null;
  
  return mockMulter;
});

vi.mock('fs', () => ({
  existsSync: vi.fn(),
  mkdirSync: vi.fn(),
  readFileSync: vi.fn(),
  unlinkSync: vi.fn(),
  writeFileSync: vi.fn()
}));

vi.mock('../services/scriptAnalysis', () => ({
  scriptAnalysisService: {
    analyzeScript: vi.fn().mockResolvedValue({ result: 'mock analysis' })
  }
}));

vi.mock('pdf-parse', () => ({
  pdf: vi.fn().mockResolvedValue({ text: 'mock pdf content' })
}));

describe('Script Analysis Router', () => {
  describe('Multer File Filter', () => {
    it('should accept PDF files', () => {
      // Get the fileFilter function from the multer configuration
      const fileFilter = (multer as any).lastOptions.fileFilter;
      
      // Create mock request, file, and callback
      const req = {} as express.Request;
      const file = { mimetype: 'application/pdf' } as Express.Multer.File;
      const cb = vi.fn();
      
      // Call the fileFilter function
      fileFilter(req, file, cb);
      
      // Verify the callback was called with the correct arguments
      expect(cb).toHaveBeenCalledWith(null, true);
    });
    
    it('should accept text files', () => {
      // Get the fileFilter function from the multer configuration
      const fileFilter = (multer as any).lastOptions.fileFilter;
      
      // Create mock request, file, and callback
      const req = {} as express.Request;
      const file = { mimetype: 'text/plain' } as Express.Multer.File;
      const cb = vi.fn();
      
      // Call the fileFilter function
      fileFilter(req, file, cb);
      
      // Verify the callback was called with the correct arguments
      expect(cb).toHaveBeenCalledWith(null, true);
    });
    
    it('should reject files with unsupported mimetypes', () => {
      // Get the fileFilter function from the multer configuration
      const fileFilter = (multer as any).lastOptions.fileFilter;
      
      // Create mock request, file, and callback
      const req = {} as express.Request;
      const file = { mimetype: 'application/javascript' } as Express.Multer.File;
      const cb = vi.fn();
      
      // Call the fileFilter function
      fileFilter(req, file, cb);
      
      // Verify the callback was called with an error
      expect(cb).toHaveBeenCalledWith(expect.any(Error));
      expect(cb.mock.calls[0][0].message).toBe('Tylko pliki PDF i TXT są dozwolone');
    });
    
    it('should reject files with spoofed mimetypes', () => {
      // Get the fileFilter function from the multer configuration
      const fileFilter = (multer as any).lastOptions.fileFilter;
      
      // Create mock request with type in body, file with different mimetype
      const req = { body: { type: 'pdf' } } as express.Request;
      const file = { 
        mimetype: 'application/javascript',
        originalname: 'malicious.pdf' // File with PDF extension but JS mimetype
      } as Express.Multer.File;
      const cb = vi.fn();
      
      // Call the fileFilter function
      fileFilter(req, file, cb);
      
      // Verify the callback rejected the file based on mimetype, not extension or body
      expect(cb).toHaveBeenCalledWith(expect.any(Error));
    });
  });
});
