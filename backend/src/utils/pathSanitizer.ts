/**
 * Path Sanitizer Utility
 * 
 * This utility provides functions to sanitize file paths and prevent path traversal attacks.
 * It ensures that all file operations are restricted to allowed directories and prevents
 * directory traversal using "../" sequences.
 */

import path from 'path';
import fs from 'fs';

// Define allowed base directories for file operations
const ALLOWED_DIRECTORIES = [
  '/tmp',
  '/uploads',
  '/scripts',
  '/pdfs',
  '/exports',
  process.env.UPLOAD_DIR || '/uploads',
  process.env.SCRIPT_DIR || '/scripts',
  process.env.PDF_DIR || '/pdfs',
  process.env.EXPORT_DIR || '/exports'
];

/**
 * Sanitizes a file path to prevent path traversal attacks
 * 
 * @param filePath - The file path to sanitize
 * @param basePath - Optional base path to restrict file operations to
 * @returns Sanitized absolute file path
 * @throws Error if path is invalid or outside allowed directories
 */
export function sanitizePath(filePath: string, basePath?: string): string {
  if (!filePath) {
    throw new Error('File path cannot be empty');
  }

  // Normalize the path to resolve '..' and '.' segments
  const normalizedPath = path.normalize(filePath);
  
  // Check if the path contains any directory traversal attempts after normalization
  if (normalizedPath.includes('../') || normalizedPath.includes('..\\')) {
    throw new Error('Path traversal attempt detected');
  }

  // If basePath is provided, join with the normalized path
  const resolvedPath = basePath 
    ? path.resolve(basePath, normalizedPath)
    : path.resolve(normalizedPath);

  // Verify the resolved path is within allowed directories
  if (!isPathAllowed(resolvedPath)) {
    throw new Error('Path is outside of allowed directories');
  }

  return resolvedPath;
}

/**
 * Checks if a path is within allowed directories
 * 
 * @param checkPath - The path to check
 * @returns boolean indicating if path is allowed
 */
export function isPathAllowed(checkPath: string): boolean {
  return ALLOWED_DIRECTORIES.some(dir => {
    const allowedDir = path.resolve(dir);
    return checkPath.startsWith(allowedDir);
  });
}

/**
 * Safely reads a file after path sanitization
 * 
 * @param filePath - The file path to read
 * @param basePath - Optional base path to restrict file operations to
 * @returns Promise resolving to file contents
 */
export async function safeReadFile(filePath: string, basePath?: string): Promise<Buffer> {
  const sanitizedPath = sanitizePath(filePath, basePath);
  return fs.promises.readFile(sanitizedPath);
}

/**
 * Safely writes to a file after path sanitization
 * 
 * @param filePath - The file path to write to
 * @param data - The data to write
 * @param basePath - Optional base path to restrict file operations to
 * @returns Promise resolving when write is complete
 */
export async function safeWriteFile(filePath: string, data: string | Buffer, basePath?: string): Promise<void> {
  const sanitizedPath = sanitizePath(filePath, basePath);
  
  // Ensure the directory exists
  const dirPath = path.dirname(sanitizedPath);
  await fs.promises.mkdir(dirPath, { recursive: true });
  
  return fs.promises.writeFile(sanitizedPath, data);
}

/**
 * Safely checks if a file exists after path sanitization
 * 
 * @param filePath - The file path to check
 * @param basePath - Optional base path to restrict file operations to
 * @returns Promise resolving to boolean indicating if file exists
 */
export async function safeFileExists(filePath: string, basePath?: string): Promise<boolean> {
  try {
    const sanitizedPath = sanitizePath(filePath, basePath);
    await fs.promises.access(sanitizedPath, fs.constants.F_OK);
    return true;
  } catch {
    return false;
  }
}

/**
 * Safely deletes a file after path sanitization
 * 
 * @param filePath - The file path to delete
 * @param basePath - Optional base path to restrict file operations to
 * @returns Promise resolving when delete is complete
 */
export async function safeDeleteFile(filePath: string, basePath?: string): Promise<void> {
  const sanitizedPath = sanitizePath(filePath, basePath);
  return fs.promises.unlink(sanitizedPath);
}

/**
 * Validates a file extension against a list of allowed extensions
 * 
 * @param filePath - The file path to validate
 * @param allowedExtensions - Array of allowed file extensions
 * @returns boolean indicating if extension is allowed
 */
export function validateFileExtension(filePath: string, allowedExtensions: string[]): boolean {
  const ext = path.extname(filePath).toLowerCase();
  return allowedExtensions.includes(ext);
}

export default {
  sanitizePath,
  isPathAllowed,
  safeReadFile,
  safeWriteFile,
  safeFileExists,
  safeDeleteFile,
  validateFileExtension
};
