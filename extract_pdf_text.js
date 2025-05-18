// @deprecated This file appears to be unused and should be removed or refactored
// FIXME: This module contains outdated code patterns and should be updated
// during the ai_CineHub migration

import fs from 'fs';
import path from 'path';

// This is a simple script to extract text from PDF files
// It's being replaced by more robust processing in the worker-js service

const extractText = async (pdfPath) => {
  console.log('Extracting text from PDF:', pdfPath);
  // Implementation removed as it's no longer used
  return 'Extracted text would appear here';
};

// TODO: Remove this file once the worker-js PDF extraction is fully tested
export default extractText;
