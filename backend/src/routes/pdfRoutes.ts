import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { extractTextFromPdf, securePath } from '../utils/pdfUtils';
import { FileProcessingError, logError } from '../utils/errors';

const router = express.Router();

// Konfiguracja multer dla przesyłania plików
const upload = multer({
  dest: 'uploads/',
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(null, false);
    }
  },
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
});

// Endpoint do przesyłania i analizy PDF
router.post('/upload-pdf', upload.single('pdf'), async (req, res) => {
  console.log('Otrzymano żądanie przesłania PDF');
  
  if (!req.file) {
    console.error('Nie przesłano pliku');
    return res.status(400).json({
      success: false,
      message: 'Nie przesłano pliku PDF',
    });
  }

  const filePath = req.file.path;
  console.log('Ścieżka pliku:', filePath);

  try {
    // Używamy centralnej funkcji do ekstrakcji tekstu z PDF
    const text = await extractTextFromPdf(filePath);
    console.log('Parsowanie zakończone, długość tekstu:', text.length);

    // Wyślij odpowiedź
    res.json({
      success: true,
      text: text,
    });
  } catch (error: any) {
    logError(error, { path: filePath });
    
    if (error instanceof FileProcessingError) {
      res.status(400).json({
        success: false,
        message: error.message,
        code: error.code
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Błąd podczas przetwarzania pliku PDF',
        error: error.message
      });
    }
  } finally {
    // Usuń plik po przetworzeniu
    try {
      fs.unlinkSync(filePath);
      console.log('Plik usunięty:', filePath);
    } catch (error) {
      console.error('Błąd podczas usuwania pliku:', error);
    }
  }
});

export default router; 