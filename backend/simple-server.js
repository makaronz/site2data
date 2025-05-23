// simple-server.js
import express from 'express';
import cors from 'cors';
import multer from 'multer';
import { createServer } from 'http';

const app = express();
const server = createServer(app);
const PORT = process.env.PORT || 5001;

// Konfiguracja CORS
app.use(cors({
  origin: ['http://localhost:3001', 'http://localhost:5173', 'http://localhost:3002'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

// Podstawowe endpointy
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Backend działa poprawnie' });
});

app.get('/api/validate-openai-key', (req, res) => {
  res.json({ 
    valid: true, 
    message: 'OpenAI key validation - temporarily disabled in simple server' 
  });
});

app.post('/api/validate-openai-key', (req, res) => {
  res.json({ 
    valid: true, 
    message: 'OpenAI key validation - temporarily disabled in simple server' 
  });
});

app.get('/api/scenes', (req, res) => {
  res.json({ scenes: [] });
});

app.get('/api/progress/:jobId', (req, res) => {
  const { jobId } = req.params;
  res.json({
    jobId,
    progress: 0,
    stage: 'initialization',
    message: 'Backend uruchomiony - brak aktywnej analizy'
  });
});

// Mockowy endpoint dla presigned URL żeby uniknąć błędów w konsoli
app.post('/api/jobs/presigned-url', (req, res) => {
  res.status(501).json({
    success: false,
    message: 'Presigned URL endpoint nie jest dostępny w simple server. Użyj pełnej implementacji API z apps/api.',
    error: 'NOT_IMPLEMENTED'
  });
});

// Mockowy endpoint dla notify upload complete
app.post('/api/jobs/:jobId/notify-upload-complete', (req, res) => {
  const { jobId } = req.params;
  res.status(501).json({
    success: false,
    message: 'Upload notification endpoint nie jest dostępny w simple server. Użyj pełnej implementacji API z apps/api.',
    jobId,
    error: 'NOT_IMPLEMENTED'
  });
});

app.post('/api/script/upload', (req, res) => {
  res.json({
    success: true,
    message: 'Plik przyjęty - funkcja analizy w trakcie implementacji',
    jobId: Date.now().toString()
  });
});

// Error handler
app.use((err, req, res, next) => {
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
  console.log(`🚀 Prosty backend działa na porcie ${PORT}`);
  console.log(`📍 API URL: http://localhost:${PORT}`);
  console.log(`📋 Health check: http://localhost:${PORT}/api/health`);
  console.log('⚠️  UWAGA: To jest uproszczony serwer. Dla pełnej funkcjonalności uruchom apps/api');
}); 