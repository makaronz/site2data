import express from 'express';
import { createServer } from 'http';
import { WebSocketServer } from 'ws';
import cors from 'cors';
import path from 'path';
import dotenv from 'dotenv';
import multer from 'multer';
import fs from 'fs';
import pdfRoutes from './routes/pdfRoutes';
import scriptAnalysisRouter, { handleWebSocket } from './routes/scriptAnalysis';
import { WebSocketClient } from './types/websocket';
import { apiLimiter, uploadLimiter, wsLimiter } from './middleware/rateLimiter';
import { validateUpload } from './middleware/validation';
import swaggerUi from 'swagger-ui-express';
import swaggerDocument from './swagger.json';
import config from './config/environments';

dotenv.config();

const app = express();
const server = createServer(app);
const PORT = config.port;

// WebSocket setup
const wss = new WebSocketServer({ 
  server,
  path: '/ws/script-analysis'
});

// Middleware
app.use(cors({
  origin: config.corsOrigin,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rate limiting
app.use('/api', apiLimiter);
app.use('/api/script/analyze', uploadLimiter);

// Swagger documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// Logowanie żądań
app.use((req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.log(`${req.method} ${req.path}`);
  next();
});

// Routes
app.use('/api', pdfRoutes);
app.use('/api/script', scriptAnalysisRouter);

// WebSocket connection handling
wss.on('connection', (ws: WebSocketClient) => {
  console.log('Nowe połączenie WebSocket');
  
  // Rate limiting dla WebSocket
  if (!wsLimiter.check(ws._socket.remoteAddress)) {
    ws.close(1008, 'Zbyt wiele połączeń WebSocket');
    return;
  }

  ws.id = Math.random().toString(36).substring(7);
  ws.isAlive = true;

  ws.on('pong', () => {
    ws.isAlive = true;
  });

  ws.on('error', (error: Error) => {
    console.error('WebSocket error:', error);
  });

  handleWebSocket(ws);
});

// Ping WebSocket connections
const interval = setInterval(() => {
  wss.clients.forEach((ws) => {
    const client = ws as WebSocketClient;
    if (client.isAlive === false) {
      return client.terminate();
    }
    client.isAlive = false;
    client.ping();
  });
}, 30000);

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
  console.log(`Swagger URL: http://127.0.0.1:${PORT}/api-docs`);
}); 