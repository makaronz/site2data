"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.initMongoDB = exports.jobsCollection = exports.JOBS_COLLECTION = void 0;
const mongodb_1 = require("mongodb");
const dotenv_1 = require("dotenv");
// Load environment variables
(0, dotenv_1.config)();
// MongoDB configuration
const MONGO_URL = process.env.MONGO_URL || 'mongodb://localhost:27017/ai_cinehub';
const DB_NAME = 'ai_cinehub';
exports.JOBS_COLLECTION = 'jobs';
// Initialize MongoDB client
const mongoClient = new mongodb_1.MongoClient(MONGO_URL);
// Initialize MongoDB connection
const initMongoDB = async () => {
    try {
        await mongoClient.connect();
        console.log('Connected to MongoDB');
        const db = mongoClient.db(DB_NAME);
        exports.jobsCollection = db.collection(exports.JOBS_COLLECTION);
    }
    catch (error) {
        console.error('Failed to connect to MongoDB:', error);
    }
};
exports.initMongoDB = initMongoDB;
//# sourceMappingURL=mongoClient.js.map