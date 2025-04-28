import Redis from 'ioredis';
import dotenv from 'dotenv';

dotenv.config();

const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';

export const redisClient = new Redis(REDIS_URL, {
  maxRetriesPerRequest: 3, // Example: configure retry strategy
  enableReadyCheck: true,
  // Add other options as needed (e.g., password, TLS)
});

redisClient.on('connect', () => {
  console.log('Connected to Redis');
});

redisClient.on('error', (err) => {
  console.error('Redis connection error:', err);
  // Handle connection errors appropriately (e.g., attempt reconnect, logging)
});

// Stream names (constants)
export const STREAM_PDF_CHUNKS = 'stream_pdf_chunks';
export const STREAM_SCENE_ANALYSIS = 'stream_scene_analysis';
export const STREAM_GRAPH_GENERATION = 'stream_graph_generation';
export const STREAM_PROGRESS_UPDATES = 'stream_progress_updates'; // For SSE

// Consumer group names
export const GROUP_CHUNK_WORKERS = 'group_chunk_workers';
export const GROUP_ANALYSIS_WORKERS = 'group_analysis_workers';
export const GROUP_GRAPH_WORKERS = 'group_graph_workers';

// Type definition for the groups object keys
type StreamName = typeof STREAM_PDF_CHUNKS | typeof STREAM_SCENE_ANALYSIS | typeof STREAM_GRAPH_GENERATION;

// Function to initialize streams and groups if they don't exist
async function initializeRedisStreams(client: Redis) {
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