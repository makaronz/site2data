import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { createServer } from 'http';
import { WebSocket, WebSocketServer } from 'ws';
import swaggerUi from 'swagger-ui-express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import config from './config/environments';
import scriptAnalysisRoutes from './routes/scriptAnalysis';
import pdfRoutes from './routes/pdfRoutes';
import apiTestRoutes from './routes/apiTest';
import { openaiAuth } from './middleware/openaiAuth';
import multer from 'multer';
import scriptAnalysisRouter, { handleWebSocket } from './routes/scriptAnalysis';
import { WebSocketClient } from './types/websocket';
import { apiLimiter, uploadLimiter, wsLimiter } from './middleware/rateLimiter';
import { validateUpload } from './middleware/validation';
import helmet from 'helmet';

dotenv.config();

const app = express();
const server = createServer(app);
const PORT = 5001;

// Inicjalizacja dokumentacji Swagger
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const swaggerPath = path.join(__dirname, 'swagger.json');
const swaggerContent = fs.readFileSync(swaggerPath, 'utf8');
const swaggerDocument = JSON.parse(swaggerContent);

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
app.use(cors());
app.use(helmet());

// Rate limiting
app.use('/api', apiLimiter);
app.use('/api/script/analyze', uploadLimiter);

// Swagger documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument, {
  explorer: true
}));

// Dodaj statyczny plik inicjalizujący swagger
app.get('/swagger-initializer.js', (req, res) => {
  res.setHeader('Content-Type', 'text/javascript');
  res.send(`window.onload = function() {
    setTimeout(function() {
      const apiKeyAuth = document.querySelector('.auth-wrapper .auth-btn-wrapper');
      if (apiKeyAuth) {
        apiKeyAuth.querySelector('button.authorize').click();
      }
    }, 1000);
  };`);
});

// Logowanie żądań
app.use((req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.log(`${req.method} ${req.path}`);
  next();
});

// Routes
app.use('/api', pdfRoutes);
app.use('/api/script', openaiAuth, scriptAnalysisRoutes);
app.use('/api/upload-pdf', pdfRoutes);
app.use('/api/test', openaiAuth, apiTestRoutes);

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

// Dodaj to po utworzeniu serwera HTTP
server.on('error', (err) => {
  console.error('Server error:', err);
  process.exit(1);
});

server.listen(PORT, () => {
  console.log(`Serwer działa na porcie ${PORT}`);
  console.log(`Frontend URL: http://localhost:3002`);
  console.log(`API URL: http://127.0.0.1:${PORT}`);
  console.log(`Swagger URL: http://127.0.0.1:${PORT}/api-docs`);
}); 