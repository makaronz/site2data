import { MongoClient, Db, Collection } from 'mongodb';
import dotenv from 'dotenv';
// import { Job, Scene } from '../../packages/types/src'; // Tymczasowo zakomentowane
import { Logger } from 'pino';

dotenv.config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017';
// const DB_NAME = 'ai-cinehub'; // Hardcoded in audit, but recommendation was to use env var
// const JOBS_COLLECTION = 'jobs'; // Hardcoded in audit
// const SCENES_COLLECTION = 'scenes'; // Hardcoded in audit

// Using environment variables as per audit recommendations for flexibility
const DB_NAME = process.env.MONGO_DB_NAME || "ai-cinehub";
const JOBS_COLLECTION_NAME = process.env.MONGO_JOBS_COLLECTION || "jobs";
const SCENES_COLLECTION_NAME = process.env.MONGO_SCENES_COLLECTION || "scenes";

let dbInstance: Db;
let clientInstance: MongoClient;

// Function to initialize MongoDB (accepts logger)
export async function initializeMongo(logger: Logger): Promise<MongoClient> {
  if (clientInstance && dbInstance) { // Check if already initialized
    logger.debug('MongoDB client already initialized. Returning existing instance.');
    return clientInstance;
  }

  logger.info(`Connecting to MongoDB at ${MONGO_URI} for database ${DB_NAME}...`);
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
export const getJobsCollection = (): Collection<any> => {
  if (!dbInstance) throw new Error('MongoDB connection not established yet.');
  return dbInstance.collection<any>(JOBS_COLLECTION_NAME);
};

export const getScenesCollection = (): Collection<any> => {
  if (!dbInstance) throw new Error('MongoDB connection not established yet.');
  return dbInstance.collection<any>(SCENES_COLLECTION_NAME);
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