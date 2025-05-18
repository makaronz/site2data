import { describe, it, expect, vi } from 'vitest';
import { validateFileUpload, validateApiKey } from '../utils/validation';

describe('Frontend Validation Utilities', () => {
  describe('validateFileUpload', () => {
    it('should validate PDF files correctly', () => {
      const pdfFile = new File(['test content'], 'test.pdf', { type: 'application/pdf' });
      const result = validateFileUpload(pdfFile);
      
      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();
    });
    
    it('should validate TXT files correctly', () => {
      const txtFile = new File(['test content'], 'test.txt', { type: 'text/plain' });
      const result = validateFileUpload(txtFile);
      
      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();
    });
    
    it('should reject files with unsupported types', () => {
      const docFile = new File(['test content'], 'test.doc', { type: 'application/msword' });
      const result = validateFileUpload(docFile);
      
      expect(result.valid).toBe(false);
      expect(result.error).toBe('Only PDF or TXT files are allowed.');
    });
    
    it('should reject files that exceed size limit', () => {
      // Create a large file (11MB)
      const largeContent = new Array(11 * 1024 * 1024).fill('a').join('');
      const largeFile = new File([largeContent], 'large.pdf', { type: 'application/pdf' });
      
      // Mock file size since jsdom doesn't actually create the full content
      Object.defineProperty(largeFile, 'size', { value: 11 * 1024 * 1024 });
      
      const result = validateFileUpload(largeFile);
      
      expect(result.valid).toBe(false);
      expect(result.error).toBe('File is too large (max 10MB).');
    });
  });
  
  describe('validateApiKey', () => {
    it('should validate API keys with sufficient length', () => {
      const validKey = 'a'.repeat(32); // 32 characters
      const result = validateApiKey(validKey);
      
      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();
    });
    
    it('should reject API keys that are too short', () => {
      const shortKey = 'a'.repeat(31); // 31 characters
      const result = validateApiKey(shortKey);
      
      expect(result.valid).toBe(false);
      expect(result.error).toBe('API key must be at least 32 characters long.');
    });
    
    it('should reject API keys that are too long', () => {
      const longKey = 'a'.repeat(65); // 65 characters
      const result = validateApiKey(longKey);
      
      expect(result.valid).toBe(false);
      expect(result.error).toBe('API key cannot be longer than 64 characters.');
    });
    
    it('should reject empty API keys', () => {
      const result = validateApiKey('');
      
      expect(result.valid).toBe(false);
      expect(result.error).toBe('API key must be at least 32 characters long.');
    });
    
    it('should trim whitespace before validation', () => {
      const keyWithWhitespace = '  ' + 'a'.repeat(32) + '  ';
      const result = validateApiKey(keyWithWhitespace);
      
      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();
    });
  });
});
