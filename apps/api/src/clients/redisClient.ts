import { createClient, RedisClientType, RedisFunctions, RedisModules, RedisScripts } from 'redis';
import pino from 'pino';
import dotenv from 'dotenv';

dotenv.config();

const logger = pino({ level: process.env.LOG_LEVEL || 'info' });

const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';

// Stream and Group Names (centralized for consistency)
export const STREAM_PDF_CHUNKS = 'stream_pdf_chunks';
export const STREAM_SCENE_ANALYSIS = 'stream_scene_analysis';
export const STREAM_GRAPH_GENERATION = 'stream_graph_generation'; // For Python worker
export const STREAM_PROGRESS_UPDATES = 'stream_progress_updates'; // For SSE

export const GROUP_CHUNK_WORKERS = 'group_chunk_workers';
export const GROUP_ANALYSIS_WORKERS = 'group_analysis_workers';
export const GROUP_GRAPH_WORKERS = 'group_graph_workers'; // For Python worker

let client: RedisClientType<RedisModules, RedisFunctions, RedisScripts>;
let isConnected = false;
let connectPromise: Promise<void> | null = null;

async function connectToRedis(): Promise<void> {
  if (isConnected && client) {
    logger.info('Redis client is already connected.');
    return;
  }
  if (connectPromise) {
    logger.info('Redis connection already in progress, awaiting completion...');
    return connectPromise;
  }

  logger.info(`Connecting to Redis at ${REDIS_URL}...`);
  client = createClient({
    url: REDIS_URL,
    socket: {
      reconnectStrategy: (retries) => {
        if (retries > 10) {
          logger.error('Too many Redis connection retries, failing.');
          return new Error('Too many retries.');
        }
        return Math.min(retries * 50, 500);
      },
    },
  });

  client.on('error', (err) => logger.error('Redis Client Error', err));
  client.on('connect', () => logger.info('Redis client is connecting...'));
  client.on('ready', () => {
    logger.info('Redis client ready.');
    isConnected = true;
  });
  client.on('end', () => {
    logger.info('Redis client connection closed.');
    isConnected = false;
    connectPromise = null; // Reset promise on disconnect
  });

  connectPromise = client.connect().then(() => {
    logger.info('Redis client connected successfully.');
    isConnected = true;
  }).catch((err) => {
    logger.error('Failed to connect to Redis:', err);
    connectPromise = null; // Reset promise on failure
    throw err; // Re-throw to indicate connection failure
  });

  return connectPromise;
}

export async function ensureStreamAndGroup(stream: string, group: string, consumerId: string) {
  if (!client || !isConnected) {
    await connectToRedis();
  }
  logger.info(`Ensuring stream '${stream}' and group '${group}' exist... Consumer ID: ${consumerId}`);
  try {
    await client.xgroup('CREATE', stream, group, '0', 'MKSTREAM');
    logger.info(`Group '${group}' created for stream '${stream}' (or already existed).`);
  } catch (err: any) {
    if (err.message.includes('BUSYGROUP')) {
      logger.warn(`Group '${group}' already exists on stream '${stream}'.`);
    } else {
      logger.error({ err, stream, group }, `Error creating group '${group}' for stream '${stream}'.`);
      throw err;
    }
  }
}

export async function initializeRedis(consumerId: string): Promise<RedisClientType<RedisModules, RedisFunctions, RedisScripts>> {
  if (!client || !isConnected) {
    await connectToRedis();
  }
  logger.info('Initializing Redis streams and groups...');
  // Ensure all streams and groups are created if they don't exist
  await ensureStreamAndGroup(STREAM_PDF_CHUNKS, GROUP_CHUNK_WORKERS, consumerId);
  await ensureStreamAndGroup(STREAM_SCENE_ANALYSIS, GROUP_ANALYSIS_WORKERS, consumerId);
  // Add other streams/groups as needed, e.g., for Python worker
  // await ensureStreamAndGroup(STREAM_GRAPH_GENERATION, GROUP_GRAPH_WORKERS, consumerId);
  logger.info('Redis streams and groups initialized successfully.');
  return client;
}

export async function closeRedisConnection(): Promise<void> {
  if (client && isConnected) {
    logger.info('Closing Redis connection...');
    try {
      await client.quit();
      logger.info('Redis connection closed successfully.');
    } catch (err) {
      logger.error('Error closing Redis connection:', err);
    }
    isConnected = false;
    connectPromise = null;
  }
}

// Export the raw client for direct use if necessary, but prefer initialized version
export { client as redisClient };

// Type definition for the groups object keys
type StreamName = typeof STREAM_PDF_CHUNKS | typeof STREAM_SCENE_ANALYSIS | typeof STREAM_GRAPH_GENERATION;

// Function to initialize streams and groups if they don't exist
async function initializeRedisStreams(client: RedisClientType<RedisModules, RedisFunctions, RedisScripts>) {
  const streams: StreamName[] = [
    STREAM_PDF_CHUNKS,
    STREAM_SCENE_ANALYSIS,
    STREAM_GRAPH_GENERATION,
    // STREAM_PROGRESS_UPDATES - treated separately or no group needed
  ];
  const groups: Record<StreamName, string> = {
    [STREAM_PDF_CHUNKS]: GROUP_CHUNK_WORKERS,
    [STREAM_SCENE_ANALYSIS]: GROUP_ANALYSIS_WORKERS,
    [STREAM_GRAPH_GENERATION]: GROUP_GRAPH_WORKERS,
  };

  // Also ensure the progress stream exists
  const allStreamsToEnsure = [...streams, STREAM_PROGRESS_UPDATES];

  try {
    for (const stream of allStreamsToEnsure) {
      try {
        await client.xinfo('STREAM', stream);
        console.log(`Stream ${stream} already exists.`);
      } catch (error: any) {
        if (error.message.includes('ERR no such key')) {
          console.log(`Stream ${stream} does not exist. Creating...`);
          await client.xadd(stream, '*', 'init', '1');
          console.log(`Stream ${stream} created.`);
        } else {
          // Log other errors but continue trying to create groups if applicable
          console.error(`Error checking stream ${stream}:`, error);
        }
      }
    }

    // Now iterate through streams that need groups
    for (const stream of streams) { // Iterate only streams needing groups
      const groupName = groups[stream];
      if (groupName) {
        try {
          // Use MKSTREAM to create the stream if it doesn't exist during group creation
          await client.xgroup('CREATE', stream, groupName, '0', 'MKSTREAM');
          console.log(`Consumer group ${groupName} created for stream ${stream}.`);
        } catch (error: any) {
          if (error.message.includes('BUSYGROUP')) {
            console.log(`Consumer group ${groupName} already exists for stream ${stream}.`);
          } else {
            // Log other group creation errors
            console.error(`Error creating group ${groupName} for stream ${stream}:`, error);
          }
        }
      }
    }
  } catch (error) {
    console.error('Unhandled error during Redis Streams initialization:', error);
  }
}

initializeRedisStreams(redisClient); 