import { MinioClient, MINIO_BUCKET, initializeMinio } from './minioClient';
import {
  redisClient,
  STREAM_PDF_CHUNKS,
  STREAM_SCENE_ANALYSIS,
  STREAM_GRAPH_GENERATION,
  STREAM_PROGRESS_UPDATES,
  GROUP_CHUNK_WORKERS,
  GROUP_ANALYSIS_WORKERS,
  GROUP_GRAPH_WORKERS,
  initializeRedis,
} from './redisClient';
import {
  getJobsCollection,
  getScenesCollection,
  initializeMongo,
  closeMongoConnection,
} from './mongoClient';
import {
    getWeaviateClient,
    initializeWeaviate,
    WEAVIATE_CLASS_NAME,
} from './weaviateClient';

export {
  // MinIO
  MinioClient,
  MINIO_BUCKET,
  initializeMinio,
  // Redis
  redisClient,
  STREAM_PDF_CHUNKS,
  STREAM_SCENE_ANALYSIS,
  STREAM_GRAPH_GENERATION,
  STREAM_PROGRESS_UPDATES,
  GROUP_CHUNK_WORKERS,
  GROUP_ANALYSIS_WORKERS,
  GROUP_GRAPH_WORKERS,
  initializeRedis,
  // MongoDB
  getJobsCollection,
  getScenesCollection,
  initializeMongo,
  closeMongoConnection,
  // Weaviate
  getWeaviateClient,
  initializeWeaviate,
  WEAVIATE_CLASS_NAME,
}; 