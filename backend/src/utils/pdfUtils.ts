import fs from 'fs';
import path from 'path';
import { FileProcessingError } from './errors';
import { mkdir } from 'fs/promises';

// Try to dynamically import pdf-parse (as it's likely an ESM module)
let pdfParse: (dataBuffer: Buffer, options?: any) => Promise<any>;

async function initPdfParse() {
  try {
    const pdfParseModule = await import('pdf-parse');
    pdfParse = pdfParseModule.default;
  } catch (error) {
    console.error('Failed to import pdf-parse. PDF functionality will be limited.', error);
  }
}

// Initialize PDF parser
initPdfParse();

/**
 * Extract text from a PDF file
 * @param filePath Path to the PDF file
 * @returns Extracted text content
 */
export async function extractTextFromPdf(filePath: string): Promise<string> {
  try {
    if (!pdfParse) {
      throw new FileProcessingError('PDF parsing library not available');
    }
    
    const dataBuffer = fs.readFileSync(filePath);
    const data = await pdfParse(dataBuffer);
    
    if (!data.text || data.text.length === 0) {
      throw new FileProcessingError('The PDF file contains no extractable text');
    }
    
    return data.text;
  } catch (error) {
    if (error instanceof FileProcessingError) {
      throw error;
    }
    throw new FileProcessingError(
      'Failed to process PDF file',
      { originalError: error instanceof Error ? error.message : String(error) }
    );
  }
}

/**
 * Ensure a directory exists
 * @param dirPath Path to the directory
 * @returns The directory path
 */
export async function ensureDirectory(dirPath: string): Promise<string> {
  try {
    await mkdir(dirPath, { recursive: true });
    return dirPath;
  } catch (error) {
    console.error('Failed to create directory:', dirPath, error);
    throw new FileProcessingError(
      `Failed to create directory: ${dirPath}`,
      { originalError: error instanceof Error ? error.message : String(error) }
    );
  }
}

/**
 * Create a secure path by sanitizing user input
 * @param basePath Base directory path
 * @param userPath User-provided path component
 * @returns Secured path
 */
export function securePath(basePath: string, userPath: string): string {
  const normalized = path.normalize(userPath).replace(/^(\.\.(\/|\\|$))+/, '');
  return path.join(basePath, normalized);
}

// Cache for analysis data to avoid repeated file reads
const analysisCache = new Map<string, any>();

/**
 * Get analysis data with caching
 * @param scriptId Script ID
 * @param basePath Base directory for files
 * @param fallbackPath Optional fallback path if primary file not found
 * @returns Analysis data
 */
export async function getAnalysisData(
  scriptId: string, 
  basePath: string = 'uploads',
  fallbackPath?: string
): Promise<any> {
  if (analysisCache.has(scriptId)) {
    return analysisCache.get(scriptId);
  }
  
  const filePath = securePath(path.join(process.cwd(), basePath), `${scriptId}_analysis.json`);
  
  if (!fs.existsSync(filePath) && fallbackPath) {
    const testPath = securePath(path.join(process.cwd(), basePath), fallbackPath);
    if (fs.existsSync(testPath)) {
      const analysis = JSON.parse(fs.readFileSync(testPath, 'utf-8'));
      analysisCache.set(scriptId, analysis);
      return analysis;
    }
    throw new FileProcessingError('Analysis file not found');
  }
  
  if (!fs.existsSync(filePath)) {
    throw new FileProcessingError('Analysis file not found');
  }
  
  const analysis = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  analysisCache.set(scriptId, analysis);
  return analysis;
}
