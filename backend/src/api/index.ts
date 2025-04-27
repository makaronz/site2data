import express, { Request, Response } from 'express';
import mongoose from 'mongoose';
import multer from 'multer';
import { saveChunksToDb } from '../utils/saveChunksToDb';
import Redis from 'ioredis';
import { v4 as uuidv4 } from 'uuid';

const app = express();
const PORT = process.env.API_PORT || 3001;

// Konfiguracja Multer do uploadu plików (max 10MB, PDF/TXT)
const upload = multer({
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf' || file.mimetype === 'text/plain') {
      cb(null, true);
    } else {
      cb(new Error('Only PDF and TXT files are allowed!'));
    }
  },
});

// Połączenie z MongoDB
mongoose.connect(process.env.MONGODB_URI || '', {});

// Połączenie z Redis
const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');

// Endpoint testowy
app.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'ok' });
});

// Endpoint do uploadu pliku i chunkowania
app.post('/api/upload-script', upload.single('file'), async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    // Odczytaj tekst z pliku (dla PDF wymagana będzie ekstrakcja tekstu)
    let scriptText = '';
    if (req.file.mimetype === 'text/plain') {
      scriptText = req.file.buffer.toString('utf-8');
    } else if (req.file.mimetype === 'application/pdf') {
      // TODO: Dodaj ekstrakcję tekstu z PDF (np. pdf-parse)
      return res.status(501).json({ error: 'PDF parsing not implemented yet' });
    }

    // Chunkowanie i zapis do bazy
    await saveChunksToDb(scriptText);

    res.status(202).json({ message: 'Script uploaded and chunked successfully' });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Internal server error' });
  }
});

// Nowy endpoint POST /job
app.post('/api/job', upload.single('file'), async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    // Odczytaj tekst z pliku (dla PDF wymagana będzie ekstrakcja tekstu)
    let scriptText = '';
    if (req.file.mimetype === 'text/plain') {
      scriptText = req.file.buffer.toString('utf-8');
    } else if (req.file.mimetype === 'application/pdf') {
      // TODO: Dodaj ekstrakcję tekstu z PDF (np. pdf-parse)
      return res.status(501).json({ error: 'PDF parsing not implemented yet' });
    }

    // Chunkowanie i zapis do bazy
    await saveChunksToDb(scriptText);

    // Generowanie unikalnego jobId
    const jobId = uuidv4();

    // Wrzucenie joba do kolejki Redis (np. lista "jobs")
    await redis.lpush('jobs', JSON.stringify({ jobId, status: 'pending' }));

    // Odpowiedź z jobId
    res.status(202).json({ jobId, message: 'Job accepted and queued for processing' });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Internal server error' });
  }
});

// Obsługa błędów
app.use((err: any, req: Request, res: Response, next: Function) => {
  res.status(500).json({ error: err.message || 'Internal server error' });
});

// Start serwera
app.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`API Gateway listening on port ${PORT}`);
}); 