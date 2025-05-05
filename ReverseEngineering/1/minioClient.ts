import * as Minio from 'minio';
import dotenv from 'dotenv';

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

// Function to ensure bucket exists
async function ensureBucketExists(client: Minio.Client, bucketName: string) {
  try {
    const exists = await client.bucketExists(bucketName);
    if (!exists) {
      console.log(`Bucket ${bucketName} does not exist. Creating...`);
      await client.makeBucket(bucketName, 'us-east-1'); // Region is mandatory but ignored by MinIO server
      console.log(`Bucket ${bucketName} created successfully.`);
      // TODO: Optionally set bucket policy (e.g., for public read access if needed)
    }
  } catch (error) {
    console.error(`Error checking or creating bucket ${bucketName}:`, error);
    // Handle error appropriately, maybe exit or throw
  }
}

// Ensure the bucket exists when the module is loaded
ensureBucketExists(MinioClient, MINIO_BUCKET); 