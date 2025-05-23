import weaviate, { WeaviateClient, ObjectsBatcher, WeaviateClass } from 'weaviate-ts-client';
import dotenv from 'dotenv';
import { Logger } from 'pino';
// import { Scene } from '../../packages/types/src'; // Tymczasowo zakomentowane

dotenv.config();

const WEAVIATE_URL = process.env.WEAVIATE_URL || 'http://localhost:8080';
const WEAVIATE_API_KEY = process.env.WEAVIATE_API_KEY; // Optional, for WCS or authenticated instances
const WEAVIATE_CLASS_NAME = 'Scene';

// Define the Weaviate schema for the Scene class
const sceneClassSchema: WeaviateClass = {
  class: WEAVIATE_CLASS_NAME,
  description: 'Stores information and analysis results about individual movie scenes',
  vectorizer: 'none', // Specify 'text2vec-openai' or others if using Weaviate vectorization modules
  // Consider module specific config like moduleConfig: { 'text2vec-openai': { vectorizer: 'text-embedding-ada-002' } }
  properties: [
    { name: 'jobId', dataType: ['text'], description: 'Identifier of the parent job' },
    { name: 'sceneId', dataType: ['text'], description: 'Unique identifier for the scene' },
    { name: 'sceneNumber', dataType: ['int'], description: 'Sequential number of the scene' },
    {
      name: 'sceneText',
      dataType: ['text'],
      description: 'Full text content of the scene',
      // Optional: skip indexing if text is very long and only used for retrieval via vector
      // indexFilterable: false,
      // indexSearchable: false,
    },
    {
      name: 'analysisTitle',
      dataType: ['text'],
      description: 'Title generated by LLM analysis',
      tokenization: 'word',
    },
    {
      name: 'analysisSummary',
      dataType: ['text'],
      description: 'Summary generated by LLM analysis',
      tokenization: 'word',
    },
    { name: 'characters', dataType: ['text[]'], description: 'Characters present in the scene' },
    { name: 'locations', dataType: ['text[]'], description: 'Locations mentioned in the scene' },
    // Add other searchable/filterable fields from analysisResult if needed
  ],
};

let weaviateClientInstance: WeaviateClient;
let connectionPromise: Promise<WeaviateClient> | null = null;

// Function to initialize Weaviate (accepts logger)
export function initializeWeaviate(logger: Logger): Promise<WeaviateClient> {
  if (connectionPromise) {
    logger.debug('Weaviate client initialization already in progress or completed.');
    return connectionPromise;
  }

  connectionPromise = new Promise(async (resolve, reject) => {
    logger.info(`Connecting to Weaviate at ${WEAVIATE_URL}...`);
    
    let scheme = 'http';
    let host = WEAVIATE_URL.replace(/^https?:\/\//, '');
    if (WEAVIATE_URL.startsWith('https')) {
        scheme = 'https';
    }

    const clientConfig: any = { scheme, host };
    if (WEAVIATE_API_KEY) {
      // Ensure weaviate.ApiKey is correctly referenced if it's a constructor
      clientConfig.authClientSecret = new weaviate.ApiKey(WEAVIATE_API_KEY);
    }

    const client = weaviate.client(clientConfig);

    try {
      // Check connection and schema
      const meta = await client.misc.metaGetter().do();
      logger.info(`Connected to Weaviate v${meta.version} at ${meta.hostname}`);

      // Ensure schema exists
      const schemas = await client.schema.getter().do();
      const sceneClassExists = schemas.classes?.some(c => c.class === WEAVIATE_CLASS_NAME);

      if (!sceneClassExists) {
        logger.info(`Weaviate class '${WEAVIATE_CLASS_NAME}' does not exist. Creating...`);
        await client.schema.classCreator().withClass(sceneClassSchema).do();
        logger.info(`Weaviate class '${WEAVIATE_CLASS_NAME}' created successfully.`);
      } else {
        logger.info(`Weaviate class '${WEAVIATE_CLASS_NAME}' already exists.`);
        // TODO: Optional: Compare existing schema with desired schema and update if necessary
      }

      weaviateClientInstance = client;
      logger.info('Weaviate client initialized and schema ensured.');
      resolve(client);

    } catch (error) {
      logger.error({ error }, 'Failed to connect to or initialize Weaviate');
      connectionPromise = null; // Reset promise on failure to allow retry
      reject(error); // Re-throw for handling during startup
    }
  });
  return connectionPromise;
}

// Export the client instance directly for use after initialization
export const getWeaviateClient = (): WeaviateClient => {
  if (!weaviateClientInstance) {
    throw new Error('Weaviate client has not been initialized. Call initializeWeaviate first.');
  }
  return weaviateClientInstance;
};

// Function to close connection (for graceful shutdown)
export async function closeWeaviateConnection(logger: Logger) {
  // Weaviate client does not have an explicit close method in weaviate-ts-client v1/v2
  // Connections are typically managed by the HTTP agent.
  // For now, just log and nullify the instance.
  if (weaviateClientInstance) {
    logger.info('Weaviate client instance is being cleared. No explicit close method available.');
    // weaviateClientInstance = null; // Or not, to allow re-use if initializeWeaviate is called again
    connectionPromise = null; // Allow re-initialization
  }
}

// Export class name constant
export { WEAVIATE_CLASS_NAME }; 