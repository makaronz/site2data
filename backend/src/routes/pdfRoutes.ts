import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import pdf from 'pdf-parse';

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
    // Odczytaj plik PDF
    const dataBuffer = fs.readFileSync(filePath);
    console.log('Plik odczytany, rozpoczynam parsowanie');

    // Parsuj PDF
    const data = await pdf(dataBuffer);
    console.log('Parsowanie zakończone, długość tekstu:', data.text.length);

    // Wyślij odpowiedź
    res.json({
      success: true,
      text: data.text,
    });
  } catch (error: any) {
    console.error('Błąd podczas przetwarzania PDF:', error);
    console.error('Szczegóły błędu:', {
      message: error.message,
      stack: error.stack,
      name: error.name
    });
    res.status(500).json({
      success: false,
      message: 'Błąd podczas przetwarzania pliku PDF',
      error: error.message
    });
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