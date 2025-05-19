"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.initClients = exports.STREAM_SCRIPT_ANALYSIS = exports.STREAM_PDF_CHUNKS = exports.JOBS_COLLECTION = exports.jobsCollection = exports.ensureMinioBucket = exports.MINIO_BUCKET = exports.minioClient = exports.ensureRedisConsumerGroups = exports.redisClient = void 0;
const redisClient_1 = require("./clients/redisClient");
Object.defineProperty(exports, "redisClient", { enumerable: true, get: function () { return redisClient_1.redisClient; } });
Object.defineProperty(exports, "ensureRedisConsumerGroups", { enumerable: true, get: function () { return redisClient_1.ensureRedisConsumerGroups; } });
const minioClient_1 = require("./clients/minioClient");
Object.defineProperty(exports, "minioClient", { enumerable: true, get: function () { return minioClient_1.minioClient; } });
Object.defineProperty(exports, "MINIO_BUCKET", { enumerable: true, get: function () { return minioClient_1.MINIO_BUCKET; } });
Object.defineProperty(exports, "ensureMinioBucket", { enumerable: true, get: function () { return minioClient_1.ensureMinioBucket; } });
const mongoClient_1 = require("./clients/mongoClient");
Object.defineProperty(exports, "jobsCollection", { enumerable: true, get: function () { return mongoClient_1.jobsCollection; } });
Object.defineProperty(exports, "JOBS_COLLECTION", { enumerable: true, get: function () { return mongoClient_1.JOBS_COLLECTION; } });
// Stream names
exports.STREAM_PDF_CHUNKS = 'pdf_chunks';
exports.STREAM_SCRIPT_ANALYSIS = 'script_analysis';
// Initialize all clients
const initClients = async () => {
    try {
        await redisClient_1.redisClient.connect();
        console.log('Connected to Redis');
        await (0, redisClient_1.ensureRedisConsumerGroups)();
    }
    catch (error) {
        console.error('Failed to connect to Redis:', error);
    }
    await (0, minioClient_1.ensureMinioBucket)();
    await (0, mongoClient_1.initMongoDB)();
};
exports.initClients = initClients;
//# sourceMappingURL=clients.js.map