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
// Import the new rate limiter middleware
import { standardLimiter, authLimiter, intensiveLimiter } from './middleware/rateLimiter';
import helmet from 'helmet';
import validateOpenAiKey from './routes/validateOpenAiKey';

dotenv.config();
const app = express();
const server = createServer(app);
const PORT = process.env.PORT || 5001;

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

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:"],
      connectSrc: ["'self'"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
    },
  },
  xssFilter: true,
  noSniff: true,
  referrerPolicy: { policy: 'same-origin' }
}));

// Apply rate limiting to all API routes
app.use('/api', standardLimiter);

// Apply stricter rate limiting to authentication routes
app.use('/api/auth', authLimiter);

// Apply stricter rate limiting to resource-intensive operations
app.use('/api/script/analyze', intensiveLimiter);
app.use('/api/script/export', intensiveLimiter);
app.use('/api/upload-pdf', intensiveLimiter);

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
        setTimeout(function() {
          const authInput = document.querySelector('.auth-container input');
          if (authInput) {
            authInput.value = 'Bearer ${process.env.OPENAI_API_KEY}';
            document.querySelector('.auth-btn-wrapper .btn-done').click();
          }
        }, 500);
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
app.use('/api', validateOpenAiKey);
app.use('/api/script', openaiAuth, scriptAnalysisRoutes);
app.use('/api/upload-pdf', pdfRoutes);
app.use('/api/test', openaiAuth, apiTestRoutes);
app.use('/api/job', scriptAnalysisRoutes);

// WebSocket connection handling
wss.on('connection', (ws: WebSocketClient) => {
  console.log('Nowe połączenie WebSocket');
  
  // Rate limiting for WebSocket connections
  const clientIp = ws._socket.remoteAddress || '0.0.0.0';
  const wsConnections = Array.from(wss.clients).filter(
    client => (client as WebSocketClient)._socket.remoteAddress === clientIp
  ).length;
  
  // Limit to 5 concurrent connections per IP
  if (wsConnections > 5) {
    ws.close(1008, 'Too many WebSocket connections from this IP');
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
  console.error('Global error handler:', err);
  res.status(500).json({
    success: false,
    message: err.message || 'Internal server error'
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
