"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ensureRedisConsumerGroups = exports.redisClient = exports.STREAM_SCRIPT_ANALYSIS = exports.STREAM_PDF_CHUNKS = void 0;
const redis_1 = require("redis");
const dotenv_1 = require("dotenv");
// Load environment variables
(0, dotenv_1.config)();
// Redis configuration
const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';
exports.STREAM_PDF_CHUNKS = 'pdf_chunks';
exports.STREAM_SCRIPT_ANALYSIS = 'script_analysis';
// Initialize Redis client
exports.redisClient = (0, redis_1.createClient)({
    url: REDIS_URL
});
// Ensure Redis consumer groups exist
const ensureRedisConsumerGroups = async () => {
    try {
        await exports.redisClient.sendCommand(['XGROUP', 'CREATE', exports.STREAM_PDF_CHUNKS, 'pdf_processor', '$', 'MKSTREAM']);
        console.log('Created Redis consumer group for PDF chunks');
    }
    catch (error) {
        if (error.message.includes('BUSYGROUP')) {
            console.log('Redis consumer group for PDF chunks already exists');
        }
        else {
            console.error('Failed to create Redis consumer group for PDF chunks:', error);
        }
    }
    try {
        await exports.redisClient.sendCommand(['XGROUP', 'CREATE', exports.STREAM_SCRIPT_ANALYSIS, 'script_analyzer', '$', 'MKSTREAM']);
        console.log('Created Redis consumer group for script analysis');
    }
    catch (error) {
        if (error.message.includes('BUSYGROUP')) {
            console.log('Redis consumer group for script analysis already exists');
        }
        else {
            console.error('Failed to create Redis consumer group for script analysis:', error);
        }
    }
};
exports.ensureRedisConsumerGroups = ensureRedisConsumerGroups;
//# sourceMappingURL=redisClient.js.map