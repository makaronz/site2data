import express from 'express';
import { createServer } from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import cors from 'cors';
import path from 'path';
import dotenv from 'dotenv';
import multer from 'multer';
import fs from 'fs';
import pdfRoutes from './routes/pdfRoutes';
import scriptAnalysisRouter, { handleWebSocket } from './routes/scriptAnalysis';

dotenv.config();

const app = express();
const server = createServer(app);
const PORT = process.env.PORT || 3001;

// WebSocket setup
const wss = new WebSocketServer({ 
  server,
  path: '/ws/script-analysis'
});

// Middleware
app.use(cors({
  origin: ['http://localhost:3002', 'http://localhost:5173'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Logowanie żądań
app.use((req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.log(`${req.method} ${req.path}`);
  next();
});

// Routes
app.use('/api', pdfRoutes);
app.use('/api/script', scriptAnalysisRouter);

// WebSocket connection handling
wss.on('connection', (ws: WebSocket) => {
  console.log('Nowe połączenie WebSocket');
  
  ws.on('error', (error: Error) => {
    console.error('WebSocket error:', error);
  });

  handleWebSocket(ws);
});

// Error handling middleware
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error:', err);
  res.status(500).json({
    success: false,
    message: 'Wystąpił błąd na serwerze'
  });
});

// 404 handler
app.use((req: express.Request, res: express.Response) => {
  console.log(`404 Not Found: ${req.method} ${req.path}`);
  res.status(404).json({
    success: false,
    message: 'Nie znaleziono zasobu'
  });
});

server.listen(PORT, () => {
  console.log(`Serwer działa na porcie ${PORT}`);
  console.log(`Frontend URL: http://localhost:3002`);
  console.log(`API URL: http://127.0.0.1:${PORT}`);
}); 