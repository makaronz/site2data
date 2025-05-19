/**
 * Path Sanitizer Tests
 * 
 * This file contains tests for the path sanitization utility to ensure
 * it properly prevents path traversal attacks and safely handles file operations.
 */

import { describe, it, expect, beforeAll, afterAll } from 'jest';
import fs from 'fs';
import path from 'path';
import pathSanitizer from '../utils/pathSanitizer';

describe('Path Sanitizer Utility', () => {
  const testDir = path.join(process.cwd(), 'test-files');
  const testFile = path.join(testDir, 'test.txt');
  
  beforeAll(() => {
    // Create test directory and file
    if (!fs.existsSync(testDir)) {
      fs.mkdirSync(testDir, { recursive: true });
    }
    fs.writeFileSync(testFile, 'Test content');
  });
  
  afterAll(() => {
    // Clean up test files
    if (fs.existsSync(testFile)) {
      fs.unlinkSync(testFile);
    }
    if (fs.existsSync(testDir)) {
      fs.rmdirSync(testDir);
    }
  });
  
  describe('sanitizePath', () => {
    it('should sanitize a valid path', () => {
      const result = pathSanitizer.sanitizePath('test.txt', testDir);
      expect(result).toBe(path.resolve(testDir, 'test.txt'));
    });
    
    it('should throw an error for path traversal attempts', () => {
      expect(() => {
        pathSanitizer.sanitizePath('../../../etc/passwd', testDir);
      }).toThrow('Path traversal attempt detected');
    });
    
    it('should throw an error for paths outside allowed directories', () => {
      expect(() => {
        pathSanitizer.sanitizePath('/etc/passwd');
      }).toThrow('Path is outside of allowed directories');
    });
    
    it('should throw an error for empty paths', () => {
      expect(() => {
        pathSanitizer.sanitizePath('');
      }).toThrow('File path cannot be empty');
    });
  });
  
  describe('isPathAllowed', () => {
    it('should return true for allowed paths', () => {
      const result = pathSanitizer.isPathAllowed(path.join(process.env.UPLOAD_DIR || '/uploads', 'test.txt'));
      expect(result).toBe(true);
    });
    
    it('should return false for disallowed paths', () => {
      const result = pathSanitizer.isPathAllowed('/etc/passwd');
      expect(result).toBe(false);
    });
  });
  
  describe('safeReadFile', () => {
    it('should safely read a file', async () => {
      const content = await pathSanitizer.safeReadFile('test.txt', testDir);
      expect(content.toString()).toBe('Test content');
    });
    
    it('should throw an error for invalid paths', async () => {
      await expect(pathSanitizer.safeReadFile('../../../etc/passwd', testDir))
        .rejects.toThrow('Path traversal attempt detected');
    });
  });
  
  describe('validateFileExtension', () => {
    it('should validate allowed extensions', () => {
      const result = pathSanitizer.validateFileExtension('test.txt', ['.txt', '.pdf']);
      expect(result).toBe(true);
    });
    
    it('should reject disallowed extensions', () => {
      const result = pathSanitizer.validateFileExtension('test.exe', ['.txt', '.pdf']);
      expect(result).toBe(false);
    });
    
    it('should handle case insensitivity', () => {
      const result = pathSanitizer.validateFileExtension('test.TXT', ['.txt', '.pdf']);
      expect(result).toBe(true);
    });
  });
});
