import { redisClient, ensureRedisConsumerGroups } from './clients/redisClient';
import { minioClient, MINIO_BUCKET, ensureMinioBucket } from './clients/minioClient';
import { jobsCollection, initMongoDB, JOBS_COLLECTION } from './clients/mongoClient';

// Re-export all clients and constants
export {
  // Redis
  redisClient,
  ensureRedisConsumerGroups,
  
  // MinIO
  minioClient,
  MINIO_BUCKET,
  ensureMinioBucket,
  
  // MongoDB
  jobsCollection,
  JOBS_COLLECTION
};

// Stream names
export const STREAM_PDF_CHUNKS = 'pdf_chunks';
export const STREAM_SCRIPT_ANALYSIS = 'script_analysis';

// Initialize all clients
export const initClients = async () => {
  try {
    await redisClient.connect();
    console.log('Connected to Redis');
    await ensureRedisConsumerGroups();
  } catch (error) {
    console.error('Failed to connect to Redis:', error);
  }

  await ensureMinioBucket();
  await initMongoDB();
};
