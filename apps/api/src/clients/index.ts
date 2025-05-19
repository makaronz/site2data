import { minioClient, MINIO_BUCKET } from './minioClient';
import { redisClient, STREAM_PDF_CHUNKS } from './redisClient';
import { mongoClient, jobsCollection, scenesCollection } from './mongoClient';

// Export configured clients and constants for use in procedures
export {
  minioClient,
  MINIO_BUCKET,
  redisClient,
  STREAM_PDF_CHUNKS,
  mongoClient,
  jobsCollection,
  scenesCollection,
}; 