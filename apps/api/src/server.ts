import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import WebSocket from 'ws';
import { initClients, redisClient } from './clients';
import router from './router';
import { 
  WebSocketMessageSchema, 
  JobStatusUpdateMessage,
  // Zaimportuj inne typy wiadomości i typeguardy, jeśli będą potrzebne
} from '@site2data/schemas'; // Importujemy schematy i typy WebSocket

// Create Express app
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Use router for API routes
app.use('/api', router);

// Create HTTP server
const server = createServer(app);

// Create WebSocket server
const wss = new WebSocket.Server({ server, path: '/ws/script-analysis' });

// Mapa do przechowywania subskrypcji Redis dla każdego klienta WebSocket
const clientSubscriptions = new Map<WebSocket, (channel: string, message: string) => void>();

wss.on('connection', (ws: WebSocket) => {
  console.log('WebSocket client connected');

  // Kopia klienta Redis dla subskrypcji (Redis wymaga osobnego klienta dla Pub/Sub w trybie subskrypcji)
  const subscriber = redisClient.duplicate();
  subscriber.connect().catch(err => console.error('Failed to connect subscriber Redis client', err));

  const handleRedisMessage = (channel: string, message: string) => {
    try {
      console.log(`Received message from Redis channel ${channel}: ${message}`);
      const parsedMessage = JSON.parse(message); // Zakładamy, że worker wysyła JSON
      
      // TODO: Tutaj powinna być logika mapowania wiadomości z workera na nasze zdefiniowane WebSocket DTOs
      // Na razie założymy, że worker wysyła już coś zgodnego z JobStatusUpdateMessage dla uproszczenia
      // W rzeczywistości potrzebna byłaby walidacja i transformacja, np. przy użyciu WebSocketMessageSchema.parse()
      // lub specyficznych schematów jak JobStatusUpdateMessageSchema.parse()

      // Przykład: Jeśli worker wysłałby bezpośrednio obiekt zgodny z payloadem JobStatusUpdateMessage
      // const jobStatusUpdate: JobStatusUpdateMessage = {
      //   type: 'JOB_STATUS_UPDATE',
      //   jobId: parsedMessage.jobId, // Worker musi dostarczyć jobId
      //   payload: {
      //     status: parsedMessage.status,
      //     progress: parsedMessage.progress,
      //     message: parsedMessage.message,
      //   }
      // };
      // const validationResult = JobStatusUpdateMessageSchema.safeParse(jobStatusUpdate);
      // if (validationResult.success) {
      //   ws.send(JSON.stringify(validationResult.data));
      // } else {
      //   console.error('Invalid message structure from worker for WebSocket:', validationResult.error);
      // }

      // Bezpośrednie przesłanie (zakładając, że worker wysyła pełną, zwalidowaną strukturę WebSocketMessage)
      // To wymagałoby, aby workerzy znali WebSocketMessageSchema
       ws.send(message); // Przesyłamy dalej wiadomość z Redis (zakładając że jest już sformatowana)

    } catch (error) {
      console.error('Error processing message from Redis or sending to WebSocket client:', error);
    }
  };

  subscriber.subscribe('job-updates', handleRedisMessage); // Subskrybujemy ogólny kanał, docelowo powinno być per jobId
  console.log(`WebSocket client subscribed to Redis channel: job-updates`);

  // Przechowujemy funkcję handlera, aby móc ją później odsubskrybować
  clientSubscriptions.set(ws, handleRedisMessage);

  ws.on('message', (message: WebSocket.Data) => {
    console.log('Received message from client:', message.toString());
    // TODO: Obsługa wiadomości od klienta, np. subskrypcja do konkretnego jobId
    // np. klient wysyła { type: 'SUBSCRIBE_JOB', jobId: 'some-job-id' }
    // Wtedy serwer mógłby subskrybować subscriber.subscribe(`job-status:${jobId}`, handleRedisMessage);
    // I przechowywać mapowanie ws -> jobId
  });
  
  ws.on('close', () => {
    console.log('WebSocket client disconnected');
    const subHandler = clientSubscriptions.get(ws);
    if (subHandler && subscriber.isOpen) {
      // Anulowanie subskrypcji konkretnego handlera, jeśli Redis to wspiera bezpośrednio, lub wszystkich dla kanału.
      // Dla uproszczenia odsubskrybujemy od ogólnego kanału.
      subscriber.unsubscribe('job-updates')
        .then(() => console.log('Unsubscribed from Redis channel: job-updates'))
        .catch(err => console.error('Error unsubscribing from Redis:', err));
      subscriber.quit(); // Zamykamy zduplikowanego klienta Redis
    }
    clientSubscriptions.delete(ws);
  });
  
  // Send initial connection confirmation
  ws.send(JSON.stringify({ type: 'CONNECTION_ACK', status: 'connected' })); // Zmieniono typ dla jasności
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
