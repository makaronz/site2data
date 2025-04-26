import { ModernScriptParser } from '../utils/scriptParser.js';
import { PDFValidator } from '../utils/pdfValidator.js';
import { CacheManager } from '../utils/cacheManager.js';
import { promises as fs } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

describe('ModernScriptParser', () => {
  let parser;
  let validator;
  let cache;
  let samplePDFPath;

  beforeAll(async () => {
    parser = new ModernScriptParser();
    validator = new PDFValidator();
    cache = new CacheManager();
    samplePDFPath = join(__dirname, 'samples', 'sample_script.pdf');
  });

  afterAll(async () => {
    await cache.clear();
  });

  describe('PDF Validation', () => {
    test('should validate correct PDF', async () => {
      const content = await fs.readFile(samplePDFPath);
      const result = await validator.validate(content);
      expect(result.isValid).toBe(true);
      expect(result.pageCount).toBeGreaterThan(0);
    });

    test('should reject invalid PDF', async () => {
      const invalidContent = Buffer.from('not a pdf');
      await expect(validator.validate(invalidContent)).rejects.toThrow();
    });

    test('should validate text content', () => {
      const validText = 'This is a valid text content\nwith multiple lines\nand enough words to pass validation.\nIt should contain some meaningful content.\nAnd have proper structure.';
      expect(validator.isTextContent(validText)).toBe(true);
    });

    test('should reject invalid text content', () => {
      const invalidText = 'Too short';
      expect(validator.isTextContent(invalidText)).toBe(false);
    });
  });

  describe('Cache Management', () => {
    test('should cache parsing results', async () => {
      const content = await fs.readFile(samplePDFPath);
      const key = cache.generateKey(content);
      
      // Pierwszy parse
      const result1 = await parser.parse(content);
      expect(result1).toBeTruthy();
      
      // Powinno być w cache
      const cached = await cache.get(key);
      expect(cached).toBeTruthy();
      expect(cached).toEqual(result1);
    });

    test('should use cached results when available', async () => {
      const content = await fs.readFile(samplePDFPath);
      const key = cache.generateKey(content);
      
      const mockResult = {
        format: 'pdf',
        scenes: [],
        metadata: { processed_at: new Date().toISOString() }
      };
      
      await cache.set(key, mockResult);
      const result = await parser.parse(content);
      expect(result).toEqual(mockResult);
    });
  });

  describe('PDF Processing', () => {
    test('should process PDF with correct configuration', async () => {
      const content = await fs.readFile(samplePDFPath);
      const result = await parser.parse(content);
      
      expect(result.format).toBe('pdf');
      expect(result.scenes).toBeDefined();
      expect(result.metadata).toBeDefined();
      expect(result.metadata.characters).toBeDefined();
      expect(result.metadata.totalScenes).toBeGreaterThan(0);
    });

    test('should handle large PDFs correctly', async () => {
      const largePDFPath = join(__dirname, 'samples', 'large_script.pdf');
      const content = await fs.readFile(largePDFPath);
      
      const result = await parser.parse(content);
      expect(result.scenes.length).toBeGreaterThan(10);
    });

    test('should extract characters correctly', async () => {
      const content = await fs.readFile(samplePDFPath);
      const result = await parser.parse(content);
      
      expect(result.metadata.characters).toBeInstanceOf(Array);
      expect(result.metadata.characters.length).toBeGreaterThan(0);
      
      // Sprawdź czy postacie są unikalne
      const uniqueCharacters = new Set(result.metadata.characters);
      expect(uniqueCharacters.size).toBe(result.metadata.characters.length);
    });
  });

  describe('Error Handling', () => {
    test('should handle corrupted PDF', async () => {
      const corruptedPDF = Buffer.from('PDF-1.7\0corrupted content');
      await expect(parser.parse(corruptedPDF)).rejects.toThrow();
    });

    test('should handle timeout', async () => {
      // Utwórz bardzo duży PDF który przekroczy timeout
      const largePDFPath = join(__dirname, 'samples', 'very_large_script.pdf');
      const content = await fs.readFile(largePDFPath);
      
      const parserWithShortTimeout = new ModernScriptParser({
        processing: { timeout: 1 } // 1ms timeout
      });
      
      await expect(parserWithShortTimeout.parse(content)).rejects.toThrow();
    });
  });
}); 