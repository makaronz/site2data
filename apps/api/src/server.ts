import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import WebSocket from 'ws';
import { initClients } from './clients';
import router from './router';

// Create Express app
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Use router for API routes
app.use(router);

// Create HTTP server
const server = createServer(app);

// Create WebSocket server
const wss = new WebSocket.Server({ server, path: '/ws/script-analysis' });

// WebSocket connection handler
wss.on('connection', (ws: WebSocket) => {
  console.log('WebSocket client connected');
  
  ws.on('message', (message: WebSocket.Data) => {
    console.log('Received message:', message);
    // Handle incoming messages
  });
  
  ws.on('close', () => {
    console.log('WebSocket client disconnected');
  });
  
  // Send initial connection confirmation
  ws.send(JSON.stringify({ type: 'connection', status: 'connected' }));
});

// Initialize clients and start server
async function startServer() {
  try {
    await initClients();
    
    // Fixed: Removed host string parameter to match TypeScript type definition
    server.listen(Number(PORT), () => {
      console.log(`API Gateway listening at http://0.0.0.0:${PORT}`);
      console.log(`WebSocket server listening at ws://0.0.0.0:${PORT}/ws/script-analysis`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();
