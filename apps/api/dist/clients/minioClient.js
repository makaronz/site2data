"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ensureMinioBucket = exports.minioClient = exports.MINIO_BUCKET = void 0;
const minio_1 = require("minio");
const dotenv_1 = require("dotenv");
// Load environment variables
(0, dotenv_1.config)();
// MinIO configuration
const MINIO_ENDPOINT = process.env.MINIO_ENDPOINT || 'localhost';
const MINIO_PORT = parseInt(process.env.MINIO_PORT || '9000', 10);
const MINIO_ACCESS_KEY = process.env.MINIO_ACCESS_KEY || 'minioadmin';
const MINIO_SECRET_KEY = process.env.MINIO_SECRET_KEY || 'minioadmin';
const MINIO_USE_SSL = process.env.MINIO_USE_SSL === 'true';
exports.MINIO_BUCKET = 'scripts';
// Initialize MinIO client
exports.minioClient = new minio_1.Client({
    endPoint: MINIO_ENDPOINT,
    port: MINIO_PORT,
    useSSL: MINIO_USE_SSL,
    accessKey: MINIO_ACCESS_KEY,
    secretKey: MINIO_SECRET_KEY
});
// Ensure MinIO bucket exists
const ensureMinioBucket = async () => {
    try {
        const bucketExists = await exports.minioClient.bucketExists(exports.MINIO_BUCKET);
        if (!bucketExists) {
            await exports.minioClient.makeBucket(exports.MINIO_BUCKET);
            console.log(`Created MinIO bucket: ${exports.MINIO_BUCKET}`);
        }
        else {
            console.log(`MinIO bucket ${exports.MINIO_BUCKET} already exists`);
        }
    }
    catch (error) {
        console.error('Failed to check/create MinIO bucket:', error);
    }
};
exports.ensureMinioBucket = ensureMinioBucket;
//# sourceMappingURL=minioClient.js.map