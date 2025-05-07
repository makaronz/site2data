import { MongoClient, Db, Collection } from 'mongodb';
import dotenv from 'dotenv';
import { Job, Scene } from '../../packages/types/src'; // Adjust path
import { Logger } from 'pino';

dotenv.config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017';
// const DB_NAME = 'site2data'; // Hardcoded in audit, but recommendation was to use env var
// const JOBS_COLLECTION = 'jobs'; // Hardcoded in audit
// const SCENES_COLLECTION = 'scenes'; // Hardcoded in audit

// Using environment variables as per audit recommendations for flexibility
const DB_NAME = process.env.MONGO_DB_NAME || "site2data";
const JOBS_COLLECTION_NAME = process.env.MONGO_JOBS_COLLECTION || "jobs";
const SCENES_COLLECTION_NAME = process.env.MONGO_SCENES_COLLECTION || "scenes";

let dbInstance: Db;
let clientInstance: MongoClient;

// Function to initialize MongoDB (accepts logger)
export async function initializeMongo(logger: Logger): Promise<MongoClient> {
  if (clientInstance && clientInstance.topology && clientInstance.topology.isConnected()) {
    logger.debug('MongoDB client already connected.');
    return clientInstance;
  }

  logger.info('Connecting to MongoDB...');
  const client = new MongoClient(MONGO_URI);

  try {
    await client.connect();
    logger.info('Connected successfully to MongoDB');
    clientInstance = client;
    dbInstance = client.db(DB_NAME);

    // Ensure indexes
    logger.info('Ensuring MongoDB indexes...');
    await dbInstance.collection(JOBS_COLLECTION_NAME).createIndex({ jobId: 1 }, { unique: true });
    await dbInstance.collection(SCENES_COLLECTION_NAME).createIndex({ sceneId: 1 }, { unique: true });
    await dbInstance.collection(SCENES_COLLECTION_NAME).createIndex({ jobId: 1 });
    logger.info('MongoDB indexes ensured.');

    return clientInstance;

  } catch (error) {
    logger.error({ error }, 'Failed to connect to MongoDB');
    throw error; // Re-throw to handle upstream
  }
}

// Export functions to get collection references
export const getJobsCollection = (): Collection<Job> => {
  if (!dbInstance) throw new Error('MongoDB connection not established yet.');
  return dbInstance.collection<Job>(JOBS_COLLECTION_NAME);
};

export const getScenesCollection = (): Collection<Scene> => { // Use specific type
  if (!dbInstance) throw new Error('MongoDB connection not established yet.');
  return dbInstance.collection<Scene>(SCENES_COLLECTION_NAME);
};

// Function to close connection (for graceful shutdown)
export async function closeMongoConnection(logger: Logger) {
  if (clientInstance) {
    try {
      await clientInstance.close();
      logger.info('MongoDB connection closed.');
    } catch (error) {
      logger.error({ error }, 'Error closing MongoDB connection');
    }
  }
} 