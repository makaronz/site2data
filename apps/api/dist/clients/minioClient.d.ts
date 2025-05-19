import { Client as MinioClient } from 'minio';
export declare const MINIO_BUCKET = "scripts";
export declare const minioClient: MinioClient;
export declare const ensureMinioBucket: () => Promise<void>;
