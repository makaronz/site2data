import { MinioClient, MINIO_BUCKET } from './minioClient'; // Add MINIO_BUCKET export
import { redisClient, STREAM_PDF_CHUNKS } from './redisClient'; // Add STREAM_PDF_CHUNKS export
import { mongoClient, jobsCollection, scenesCollection } from './mongoClient'; // Ensure scenesCollection is exported if needed later

// Export configured clients and constants for use in procedures
export {
  MinioClient,
  MINIO_BUCKET, // Export constant
  redisClient,
  STREAM_PDF_CHUNKS, // Export constant
  mongoClient,
  jobsCollection,
  scenesCollection,
}; 