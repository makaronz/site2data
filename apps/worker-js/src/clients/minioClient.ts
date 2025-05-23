import * as Minio from 'minio';
import dotenv from 'dotenv';
import { Logger } from 'pino'; // Import Logger type

dotenv.config();

const MINIO_ENDPOINT = process.env.MINIO_ENDPOINT || 'localhost';
const MINIO_PORT = parseInt(process.env.MINIO_PORT || '9000', 10);
const MINIO_ACCESS_KEY = process.env.MINIO_ACCESS_KEY || 'minioadmin';
const MINIO_SECRET_KEY = process.env.MINIO_SECRET_KEY || 'minioadmin';
const MINIO_USE_SSL = process.env.MINIO_USE_SSL === 'true';
export const MINIO_BUCKET = process.env.MINIO_BUCKET || 'scripts';

export const MinioClient = new Minio.Client({
  endPoint: MINIO_ENDPOINT,
  port: MINIO_PORT,
  useSSL: MINIO_USE_SSL,
  accessKey: MINIO_ACCESS_KEY,
  secretKey: MINIO_SECRET_KEY,
});

// Function to ensure bucket exists (accepts logger)
async function ensureBucketExists(client: Minio.Client, bucketName: string, logger: Logger) {
  try {
    const exists = await client.bucketExists(bucketName);
    if (!exists) {
      logger.info(`Bucket ${bucketName} does not exist. Creating...`);
      await client.makeBucket(bucketName, 'us-east-1');
      logger.info(`Bucket ${bucketName} created successfully.`);
    } else {
      logger.debug(`Bucket ${bucketName} already exists.`);
    }
  } catch (error) {
    logger.error({ error, bucketName }, `Error checking or creating bucket`);
    throw error; // Re-throw to handle upstream
  }
}

// Function to initialize MinIO (accepts logger)
export async function initializeMinio(logger: Logger) {
  await ensureBucketExists(MinioClient, MINIO_BUCKET, logger);
  logger.info('MinIO client initialized and bucket ensured.');
} 