import express, { Request, Response } from 'express';
import cors from 'cors';
import * as trpcExpress from '@trpc/server/adapters/express';
import { appRouter } from './router';
import { createContext } from './context';
import dotenv from 'dotenv';
import { redisClient } from './clients'; // Import Redis client
import { v4 as uuidv4 } from 'uuid';
import { ProgressUpdate } from '../../packages/types/src'; // Import shared type

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

app.use(cors()); // Configure CORS properly for production
app.use(express.json());

// --- SSE Setup ---
interface Client {
  id: string;
  res: Response;
}
// Store connected clients in memory (consider a more robust solution for production)
const clients = new Map<string, Client[]>(); // Map<jobId, Client[]>

// Function to send SSE data
const sendSseData = (clientId: string, jobId: string, data: ProgressUpdate) => {
  const jobClients = clients.get(jobId);
  if (jobClients) {
    const client = jobClients.find(c => c.id === clientId);
    if (client) {
      client.res.write(`event: progress\n`);
      client.res.write(`data: ${JSON.stringify(data)}\n\n`);
    }
  }
};

// Create a dedicated Redis client for subscriptions
const subscriber = redisClient.duplicate();
subscriber.on('connect', () => console.log('Redis subscriber connected'));
subscriber.on('error', (err: Error) => console.error('Redis subscriber error:', err));

subscriber.on('message', (channel: string, message: string) => {
  console.log(`Received message from ${channel}: ${message}`);
  const jobId = channel.split(':')[1]; // Extract jobId from channel name (e.g., progress:job-123)
  if (jobId) {
    try {
      const progressUpdate: ProgressUpdate = JSON.parse(message);
      const jobClients = clients.get(jobId);
      if (jobClients) {
        console.log(`Sending update to ${jobClients.length} clients for job ${jobId}`);
        jobClients.forEach(client => {
          sendSseData(client.id, jobId, progressUpdate);
          // If job is completed or failed, remove the client connection
          if (progressUpdate.status === 'COMPLETED' || progressUpdate.status === 'FAILED') {
            client.res.end(); // Close the connection from server-side
            // We'll remove the client in the 'close' event handler
          }
        });
      }
    } catch (error) {
      console.error('Error parsing progress update or sending SSE:', error);
    }
  }
});

// SSE Endpoint
app.get('/sse/progress/:jobId', (req: Request, res: Response) => {
  const jobId = req.params.jobId;
  if (!jobId) {
    return res.status(400).send('Missing jobId parameter');
  }

  // Set headers for SSE
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders(); // Flush headers to establish connection

  const clientId = uuidv4();
  const newClient: Client = { id: clientId, res };

  // Add client to the map
  if (!clients.has(jobId)) {
    clients.set(jobId, []);
  }
  clients.get(jobId)?.push(newClient);
  console.log(`Client ${clientId} connected for job ${jobId}. Total clients for job: ${clients.get(jobId)?.length}`);

  // Subscribe to Redis channel for this job if not already subscribed by another client for this job
  const channelName = `progress:${jobId}`;
  subscriber.subscribe(channelName, (err: Error | null, count?: number) => {
    if (err) {
      console.error(`Failed to subscribe to ${channelName}:`, err);
      return res.status(500).end();
    }
    console.log(`Subscribed to ${channelName}. Total subscriptions: ${count}`);
    // Send a confirmation message (optional)
    res.write(`event: connected\ndata: ${JSON.stringify({ clientId })}\n\n`);
  });

  // Handle client disconnection
  req.on('close', () => {
    console.log(`Client ${clientId} disconnected for job ${jobId}`);
    const jobClients = clients.get(jobId);
    if (jobClients) {
      const index = jobClients.findIndex(c => c.id === clientId);
      if (index !== -1) {
        jobClients.splice(index, 1);
        console.log(`Removed client ${clientId}. Remaining clients for job ${jobId}: ${jobClients.length}`);
        // If no clients left for this job, unsubscribe from Redis channel
        if (jobClients.length === 0) {
          console.log(`No clients left for job ${jobId}. Unsubscribing from ${channelName}...`);
          subscriber.unsubscribe(channelName);
          clients.delete(jobId); // Clean up map entry
        }
      }
    }
  });
});

// --- tRPC Middleware ---
app.use(
  '/trpc',
  trpcExpress.createExpressMiddleware({
    router: appRouter,
    createContext,
    // Optional: Handle tRPC errors globally
    onError: ({ path, error }) => {
      console.error(`tRPC Error on '${path}':`, error);
    },
  })
);

// --- Start Server ---
app.listen(port, () => {
  console.log(`API Gateway listening at http://localhost:${port}`);
}); 