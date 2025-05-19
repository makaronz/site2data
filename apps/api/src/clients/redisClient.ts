import { createClient } from 'redis';
import { config } from 'dotenv';

// Load environment variables
config();

// Redis configuration
const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';
export const STREAM_PDF_CHUNKS = 'pdf_chunks';
export const STREAM_SCRIPT_ANALYSIS = 'script_analysis';

// Initialize Redis client
export const redisClient = createClient({
  url: REDIS_URL
});

// Ensure Redis consumer groups exist
export const ensureRedisConsumerGroups = async () => {
  try {
    await redisClient.sendCommand(['XGROUP', 'CREATE', STREAM_PDF_CHUNKS, 'pdf_processor', '$', 'MKSTREAM']);
    console.log('Created Redis consumer group for PDF chunks');
  } catch (error: any) {
    if (error.message.includes('BUSYGROUP')) {
      console.log('Redis consumer group for PDF chunks already exists');
    } else {
      console.error('Failed to create Redis consumer group for PDF chunks:', error);
    }
  }

  try {
    await redisClient.sendCommand(['XGROUP', 'CREATE', STREAM_SCRIPT_ANALYSIS, 'script_analyzer', '$', 'MKSTREAM']);
    console.log('Created Redis consumer group for script analysis');
  } catch (error: any) {
    if (error.message.includes('BUSYGROUP')) {
      console.log('Redis consumer group for script analysis already exists');
    } else {
      console.error('Failed to create Redis consumer group for script analysis:', error);
    }
  }
};
