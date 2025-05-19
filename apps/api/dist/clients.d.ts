import { redisClient, ensureRedisConsumerGroups } from './clients/redisClient';
import { minioClient, MINIO_BUCKET, ensureMinioBucket } from './clients/minioClient';
import { jobsCollection, JOBS_COLLECTION } from './clients/mongoClient';
export { redisClient, ensureRedisConsumerGroups, minioClient, MINIO_BUCKET, ensureMinioBucket, jobsCollection, JOBS_COLLECTION };
export declare const STREAM_PDF_CHUNKS = "pdf_chunks";
export declare const STREAM_SCRIPT_ANALYSIS = "script_analysis";
export declare const initClients: () => Promise<void>;
