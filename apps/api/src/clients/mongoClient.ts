import { MongoClient } from 'mongodb';
import { config } from 'dotenv';

// Load environment variables
config();

// MongoDB configuration
const MONGO_URL = process.env.MONGO_URI || 'mongodb://localhost:27017/ai_cinehub';
const DB_NAME = 'ai_cinehub';
export const JOBS_COLLECTION = 'jobs';
export const SCENES_COLLECTION = 'scenes';

// Initialize MongoDB client
const mongoClient = new MongoClient(MONGO_URL);
let jobsCollection: any;
let scenesCollection: any;

// Initialize MongoDB connection
export const initMongo = async () => {
  try {
    await mongoClient.connect();
    console.log('Connected to MongoDB');
    const db = mongoClient.db(DB_NAME);
    jobsCollection = db.collection(JOBS_COLLECTION);
    scenesCollection = db.collection(SCENES_COLLECTION);
  } catch (error) {
    console.error('Failed to connect to MongoDB:', error);
  }
};

export { mongoClient, jobsCollection, scenesCollection };
