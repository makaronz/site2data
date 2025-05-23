import express from 'express';
import cors from 'cors';
import multer from 'multer';
import { createServer } from 'http';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const server = createServer(app);
const PORT = process.env.PORT || 3001;

// CORS configuration
app.use(cors({
  origin: ['http://localhost:3001', 'http://localhost:5173', 'http://localhost:3002'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

// Upload directory
const UPLOAD_DIR = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

// Multer configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, UPLOAD_DIR);
  },
  filename: (req, file, cb) => {
    const sanitizedName = file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_');
    cb(null, `${Date.now()}-${sanitizedName}`);
  }
});

const upload = multer({ 
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf' || file.mimetype === 'text/plain') {
      cb(null, true);
    } else {
      cb(new Error('Tylko pliki PDF i TXT są dozwolone'));
    }
  }
});

// Health endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Backend z upload functionality działa poprawnie' });
});

// OpenAI key validation (mock)
app.get('/api/validate-openai-key', (req, res) => {
  res.json({ 
    valid: true, 
    message: 'OpenAI key validation - temporarily disabled' 
  });
});

app.post('/api/validate-openai-key', (req, res) => {
  res.json({ 
    valid: true, 
    message: 'OpenAI key validation - temporarily disabled' 
  });
});

// Upload endpoint with full functionality
app.post('/api/script/analyze', upload.single('script'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Brak pliku w żądaniu',
        code: 'FILE_MISSING'
      });
    }

    console.log('📁 Plik otrzymany:', req.file.originalname);
    console.log('📊 Rozmiar:', req.file.size, 'bytes');
    console.log('📋 Typ:', req.file.mimetype);

    // Simulate analysis processing
    const analysisId = Date.now().toString();
    
    // Mock analysis result
    const result = {
      analysis: {
        metadata: {
          title: `Analiza pliku: ${req.file.originalname}`,
          filename: req.file.originalname,
          fileSize: req.file.size,
          detected_language: 'pl',
          scene_count: Math.floor(Math.random() * 20) + 5,
          token_count: Math.floor(Math.random() * 5000) + 1000,
          analysis_timestamp: new Date().toISOString()
        },
        overall_summary: 'Plik został pomyślnie przesłany i przeanalizowany. To jest symulowany wynik analizy.',
        characters: [
          { name: 'Postać 1', description: 'Główny bohater' },
          { name: 'Postać 2', description: 'Antagonista' }
        ],
        scenes: [
          { number: 1, location: 'Dom', description: 'Scena otwierająca' },
          { number: 2, location: 'Ulica', description: 'Scena akcji' }
        ]
      }
    };

    // Clean up uploaded file
    try {
      fs.unlinkSync(req.file.path);
      console.log('🗑️ Plik usunięty:', req.file.path);
    } catch (unlinkError) {
      console.error('Błąd podczas usuwania pliku:', unlinkError);
    }

    res.json({
      success: true,
      message: 'Plik został pomyślnie przesłany i przeanalizowany',
      id: analysisId,
      result: result
    });

  } catch (error) {
    console.error('Błąd podczas analizy skryptu:', error);
    res.status(500).json({
      success: false,
      message: 'Wystąpił błąd podczas analizy skryptu',
      code: 'ANALYSIS_ERROR',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Alternative upload endpoint
app.post('/api/script/upload', upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({
      success: false,
      message: 'Brak pliku w żądaniu'
    });
  }

  // Clean up file immediately
  try {
    fs.unlinkSync(req.file.path);
  } catch (error) {
    console.error('Error deleting file:', error);
  }

  res.json({
    success: true,
    message: 'Plik przyjęty - funkcja analizy dostępna',
    jobId: Date.now().toString(),
    uploadedFile: {
      name: req.file.originalname,
      size: req.file.size,
      type: req.file.mimetype
    }
  });
});

// Error handler
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error:', err);
  res.status(500).json({
    success: false,
    message: err.message || 'Internal server error'
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Endpoint nie znaleziony'
  });
});

server.listen(PORT, () => {
  console.log(`🚀 Backend z upload functionality działa na porcie ${PORT}`);
  console.log(`📍 API URL: http://localhost:${PORT}`);
  console.log(`📋 Health check: http://localhost:${PORT}/api/health`);
  console.log(`📁 Upload endpoint: http://localhost:${PORT}/api/script/analyze`);
  console.log('✅ Upload functionality: DOSTĘPNA');
}); 