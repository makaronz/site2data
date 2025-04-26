import express from 'express';
import cors from 'cors';
import multer from 'multer';
import { createServer } from 'http';
import { WebSocketManager } from './websocket/server.js';
import { PDFValidator } from './utils/pdfValidator.js';
import { ModernScriptParser } from './utils/scriptParser.js';

const app = express();
const server = createServer(app);
const upload = multer({ dest: 'uploads/' });
const validator = new PDFValidator();
const parser = new ModernScriptParser();

// Inicjalizacja WebSocket
const wsManager = new WebSocketManager(server);

// Konfiguracja CORS
app.use(cors({
  origin: ['http://localhost:3001', 'http://localhost:5173', 'http://localhost:3002'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

// Endpoint do walidacji pliku
app.post('/api/validate', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Nie przesłano pliku' });
    }

    const validationResult = await validator.validate(req.file.buffer);
    res.json(validationResult);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Endpoint do ekstrakcji tekstu
app.post('/api/extract', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Nie przesłano pliku' });
    }

    const text = await parser.parsePDF(req.file.buffer);
    res.json({ text });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Endpoint do analizy scen
app.post('/api/analyze', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Nie przesłano pliku' });
    }

    const result = await parser.parse(req.file.buffer);
    res.json(result);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Endpoint do wykrywania postaci
app.post('/api/characters', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Nie przesłano pliku' });
    }

    const result = await parser.parse(req.file.buffer);
    res.json({ characters: result.metadata.characters });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Endpoint do zapisywania wyników
app.post('/api/save', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Nie przesłano pliku' });
    }

    const result = await parser.parse(req.file.buffer, {
      title: req.file.originalname
    });
    
    res.json({ 
      message: 'Wyniki zostały zapisane',
      outputPath: result.outputPath 
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Serwer działa na porcie ${PORT}`);
  console.log(`WebSocket dostępny na ścieżce /ws/script-analysis`);
}); 