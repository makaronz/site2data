import { Client as MinioClient } from 'minio';
import { config } from 'dotenv';

// Load environment variables
config();

// MinIO configuration
const MINIO_ENDPOINT = process.env.MINIO_ENDPOINT || 'localhost';
const MINIO_PORT = parseInt(process.env.MINIO_PORT || '9000', 10);
const MINIO_ACCESS_KEY = process.env.MINIO_ACCESS_KEY || 'minioadmin';
const MINIO_SECRET_KEY = process.env.MINIO_SECRET_KEY || 'minioadmin';
const MINIO_USE_SSL = process.env.MINIO_USE_SSL === 'true';
export const MINIO_BUCKET = 'scripts';

// Initialize MinIO client
export const minioClient = new MinioClient({
  endPoint: MINIO_ENDPOINT,
  port: MINIO_PORT,
  useSSL: MINIO_USE_SSL,
  accessKey: MINIO_ACCESS_KEY,
  secretKey: MINIO_SECRET_KEY
});

// Ensure MinIO bucket exists
export const ensureMinioBucket = async () => {
  try {
    const bucketExists = await minioClient.bucketExists(MINIO_BUCKET);
    if (!bucketExists) {
      await minioClient.makeBucket(MINIO_BUCKET);
      console.log(`Created MinIO bucket: ${MINIO_BUCKET}`);
    } else {
      console.log(`MinIO bucket ${MINIO_BUCKET} already exists`);
    }
  } catch (error) {
    console.error('Failed to check/create MinIO bucket:', error);
  }
};
