import Redis from 'ioredis';
import dotenv from 'dotenv';
import { Logger } from 'pino';

dotenv.config();

const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';

// Export redis client instance directly
export const redisClient = new Redis(REDIS_URL, {
  maxRetriesPerRequest: 3,
  enableReadyCheck: true,
});

// Stream names (constants) - Re-export or define here
export const STREAM_PDF_CHUNKS = 'stream_pdf_chunks';
export const STREAM_SCENE_ANALYSIS = 'stream_scene_analysis';
export const STREAM_GRAPH_GENERATION = 'stream_graph_generation';
export const STREAM_PROGRESS_UPDATES = 'stream_progress_updates'; // For publishing progress

// Consumer group names (constants)
export const GROUP_CHUNK_WORKERS = 'group_chunk_workers';
export const GROUP_ANALYSIS_WORKERS = 'group_analysis_workers';
export const GROUP_GRAPH_WORKERS = 'group_graph_workers';

// Type definition for the groups object keys
type StreamWithGroup = typeof STREAM_PDF_CHUNKS | typeof STREAM_SCENE_ANALYSIS | typeof STREAM_GRAPH_GENERATION;

// Function to initialize streams and groups (accepts logger)
async function initializeRedisStreams(client: Redis, logger: Logger) {
  const streamsToEnsure: string[] = [
    STREAM_PDF_CHUNKS,
    STREAM_SCENE_ANALYSIS,
    STREAM_GRAPH_GENERATION,
    STREAM_PROGRESS_UPDATES,
  ];
  const groupsToEnsure: Record<StreamWithGroup, string> = {
    [STREAM_PDF_CHUNKS]: GROUP_CHUNK_WORKERS,
    [STREAM_SCENE_ANALYSIS]: GROUP_ANALYSIS_WORKERS,
    [STREAM_GRAPH_GENERATION]: GROUP_GRAPH_WORKERS,
  };

  logger.info('Initializing Redis streams and groups...');

  try {
    // Ensure streams exist
    for (const stream of streamsToEnsure) {
      try {
        await client.xinfo('STREAM', stream);
        logger.debug(`Stream ${stream} already exists.`);
      } catch (error: any) {
        if (error.message.includes('ERR no such key')) {
          logger.info(`Stream ${stream} does not exist. Creating...`);
          await client.xadd(stream, '*', 'init', '1');
          logger.info(`Stream ${stream} created.`);
        } else {
          logger.warn({ error, stream }, `Error checking stream, proceeding cautiously`);
        }
      }
    }

    // Ensure consumer groups exist
    for (const streamName in groupsToEnsure) {
        const groupName = groupsToEnsure[streamName as StreamWithGroup];
        try {
            // Use MKSTREAM to create the stream if it doesn't exist during group creation
            await client.xgroup('CREATE', streamName, groupName, '0', 'MKSTREAM');
            logger.info(`Consumer group ${groupName} created for stream ${streamName}.`);
        } catch (error: any) {
            if (error.message.includes('BUSYGROUP')) {
                logger.debug(`Consumer group ${groupName} already exists for stream ${streamName}.`);
            } else {
                logger.warn({ error, streamName, groupName }, `Error creating consumer group`);
            }
        }
    }
    logger.info('Redis streams and groups initialized successfully.');

  } catch (error) {
    logger.error({ error }, 'Unhandled error during Redis Streams initialization');
    throw error; // Re-throw to handle upstream
  }
}

// Function to initialize Redis (accepts logger)
export async function initializeRedis(logger: Logger) {
  return new Promise<void>((resolve, reject) => {
    redisClient.on('connect', () => {
      logger.info('Redis client connected');
      initializeRedisStreams(redisClient, logger).then(resolve).catch(reject);
    });

    redisClient.on('error', (err) => {
      logger.error({ err }, 'Redis client connection error');
      reject(err); // Reject promise on connection error
    });

    // Handle initial connection errors if Redis is not available on startup
    redisClient.connect().catch(err => {
        logger.error({ err }, 'Initial Redis connection failed');
        reject(err);
    });
  });
} 