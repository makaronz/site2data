import { MongoClient, Db, Collection } from 'mongodb';
import dotenv from 'dotenv';
// import { Job } from '../../packages/types/src'; // Tymczasowo zakomentowane

dotenv.config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017';
const DB_NAME = 'ai-cinehub'; // Or get from env
const JOBS_COLLECTION = 'jobs';
const SCENES_COLLECTION = 'scenes';

let dbInstance: Db;

export const mongoClient = new MongoClient(MONGO_URI, {
  // Add connection options if needed (e.g., replicaSet, authSource)
});

async function connectToMongo() {
  if (dbInstance) return; // Already connected
  try {
    await mongoClient.connect();
    console.log('Connected successfully to MongoDB');
    dbInstance = mongoClient.db(DB_NAME);
    // Optionally create indexes here
    await dbInstance.collection(JOBS_COLLECTION).createIndex({ jobId: 1 }, { unique: true });
    await dbInstance.collection(SCENES_COLLECTION).createIndex({ sceneId: 1 }, { unique: true });
    await dbInstance.collection(SCENES_COLLECTION).createIndex({ jobId: 1 });
    console.log('MongoDB indexes ensured.');

  } catch (error) {
    console.error('Failed to connect to MongoDB:', error);
    // Handle connection error (e.g., retry, exit)
    process.exit(1); // Exit if DB connection fails on startup
  }
}

// Call connect function when module is loaded
connectToMongo();

// Export function to get collection references after connection is established
export const jobsCollection = (): Collection<any> => {
  if (!dbInstance) {
    throw new Error('MongoDB is not connected yet.');
  }
  return dbInstance.collection<any>(JOBS_COLLECTION);
};

export const scenesCollection = (): Collection<any> => { // Use specific type later
  if (!dbInstance) {
    throw new Error('MongoDB is not connected yet.');
  }
  return dbInstance.collection(SCENES_COLLECTION);
}; 