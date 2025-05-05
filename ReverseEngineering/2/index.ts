import dotenv from 'dotenv';
import pino from 'pino';
import { randomUUID } from 'crypto';
import { JobStatus, ProgressUpdate } from '../../packages/types/src';
import {
  initializeMinio,
  initializeRedis,
  initializeMongo,
  closeMongoConnection,
  redisClient,
  MinioClient,
  MINIO_BUCKET,
  STREAM_PDF_CHUNKS,
  STREAM_SCENE_ANALYSIS,
  STREAM_PROGRESS_UPDATES,
  GROUP_CHUNK_WORKERS,
  GROUP_ANALYSIS_WORKERS,
  getJobsCollection,
  getScenesCollection,
  getWeaviateClient,
  initializeWeaviate,
  WEAVIATE_CLASS_NAME,
} from './clients';
import { parsePdfAndSplitScenes } from './utils/pdfParser';
import { OpenAI } from 'openai';
import Ajv from 'ajv';
import { SceneAnalysisResultSchema, SceneAnalysisResult } from '../../packages/types/src';
import { retryAsync } from '../../packages/utils/src';
import fs from 'fs';
import path from 'path';
import { loadChunksWithCache } from "./ingest";
import { processChunksWithCache } from "./processChunks";

dotenv.config();

const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  transport: {
    target: 'pino-pretty', // Make logs pretty for development
    options: {
      colorize: true,
      ignore: 'pid,hostname',
    },
  },
});

const CONSUMER_ID = `worker-js-${randomUUID()}`;
let isShuttingDown = false;

const CACHE_DIR = path.join(process.cwd(), 'cache');

/**
 * Publishes progress updates to Redis Pub/Sub for SSE.
 */
async function publishProgress(jobId: string, update: Omit<ProgressUpdate, 'jobId'>) {
  const channel = `progress:${jobId}`;
  const message: ProgressUpdate = { jobId, ...update };
  try {
    await redisClient.publish(channel, JSON.stringify(message));
    logger.debug({ jobId, status: update.status, progress: update.progress }, 'Published progress update');
  } catch (error) {
    logger.error({ error, jobId, channel }, 'Failed to publish progress update');
  }
}

/**
 * Processes a single message from the PDF chunking stream.
 */
async function processMessage(messageId: string, messageData: Record<string, string>) {
  const { jobId, objectKey } = messageData;
  if (!jobId || !objectKey) {
    logger.error({ messageId, messageData }, 'Invalid message received from stream');
    // Acknowledge invalid message to prevent reprocessing
    await redisClient.xack(STREAM_PDF_CHUNKS, GROUP_CHUNK_WORKERS, messageId);
    return;
  }

  const jobLogger = logger.child({ jobId, objectKey });
  jobLogger.info('Processing new job...');

  try {
    // 1. Update job status and publish progress
    jobLogger.info('Updating job status to CHUNKING');
    const jobs = getJobsCollection();
    await jobs.updateOne({ jobId }, { $set: { status: 'CHUNKING', updatedAt: new Date() } });
    await publishProgress(jobId, { status: 'CHUNKING', progress: 10, message: 'Pobieranie pliku...' });

    // 2. Download PDF from MinIO/S3
    jobLogger.info(`Downloading PDF from bucket: ${MINIO_BUCKET}, key: ${objectKey}`);
    const pdfStream = await MinioClient.getObject(MINIO_BUCKET, objectKey);
    const pdfBuffer = await new Promise<Buffer>((resolve, reject) => {
      const chunks: Buffer[] = [];
      pdfStream.on('data', (chunk: Buffer) => chunks.push(chunk));
      pdfStream.on('end', () => resolve(Buffer.concat(chunks)));
      pdfStream.on('error', reject);
    });
    jobLogger.info(`Downloaded PDF successfully (${(pdfBuffer.length / 1024).toFixed(1)} KB)`);
    await publishProgress(jobId, { status: 'CHUNKING', progress: 30, message: 'Parsowanie i dzielenie na sceny...' });

    // 3. Parse PDF and split into scenes
    const scenes = await parsePdfAndSplitScenes(pdfBuffer, jobLogger);
    jobLogger.info(`Split into ${scenes.length} scenes.`);

    // 4. Update job with scene count
    await jobs.updateOne({ jobId }, { $set: { sceneCount: scenes.length, updatedAt: new Date() } });

    // 5. Publish scenes to the next stream
    const scenesCol = getScenesCollection();
    let scenesPublished = 0;
    const scenePublishPromises = scenes.map(async (sceneSplit, index) => {
      const sceneId = `scene-${jobId}-${index + 1}`;
      const sceneMessage = [
        'jobId', jobId,
        'sceneId', sceneId,
        'sceneNumber', (index + 1).toString(),
        'sceneText', sceneSplit.content, // Send full content for now
        'sceneHeader', sceneSplit.header,
      ];
      // Optional: Create scene document in MongoDB immediately
      await scenesCol.insertOne({
          sceneId,
          jobId,
          sceneNumber: index + 1,
          sceneText: sceneSplit.content, // Store text here too?
          status: 'PENDING_ANALYSIS',
      });
      await redisClient.xadd(STREAM_SCENE_ANALYSIS, '*', ...sceneMessage);
      scenesPublished++;
      // Publish incremental progress during scene publishing
      if (scenes.length > 1) {
        await publishProgress(jobId, {
            status: 'CHUNKING',
            progress: 30 + Math.round((scenesPublished / scenes.length) * 60), // Progress from 30% to 90%
            message: `Publikowanie sceny ${scenesPublished}/${scenes.length}...`
        });
      }
    });
    await Promise.all(scenePublishPromises);
    jobLogger.info(`Published ${scenesPublished} scenes to ${STREAM_SCENE_ANALYSIS}`);

    // 6. Update final job status and publish progress
    await jobs.updateOne({ jobId }, { $set: { status: 'ANALYZING', processedScenes: 0, updatedAt: new Date() } });
    await publishProgress(jobId, { status: 'ANALYZING', progress: 0, message: 'Rozpoczęto analizę scen...' }); // Reset progress for next stage

    // 7. Acknowledge message in Redis Stream
    await redisClient.xack(STREAM_PDF_CHUNKS, GROUP_CHUNK_WORKERS, messageId);
    jobLogger.info(`Acknowledged message ${messageId}`);

  } catch (error: any) {
    jobLogger.error({ error: error.message, stack: error.stack, messageId }, 'Failed to process job');
    // Update job status to FAILED
    try {
      const jobs = getJobsCollection();
      await jobs.updateOne({ jobId }, { $set: { status: 'FAILED', errorMessage: error.message, updatedAt: new Date() } });
      await publishProgress(jobId, { status: 'FAILED', progress: 0, message: `Błąd: ${error.message}` });
      // Acknowledge message even on failure to prevent reprocessing loops for non-recoverable errors
      await redisClient.xack(STREAM_PDF_CHUNKS, GROUP_CHUNK_WORKERS, messageId);
      jobLogger.warn(`Acknowledged failed message ${messageId}`);
    } catch (ackError: any) {
      jobLogger.error({ error: ackError.message, stack: ackError.stack, messageId }, 'Failed to update status/ack failed job');
      // Potentially critical error, might need monitoring/alerting
    }
  }
}

// --- OpenAI Setup ---
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
if (!OPENAI_API_KEY) {
  logger.error('OPENAI_API_KEY environment variable is not set!');
  process.exit(1);
}
const openai = new OpenAI({ apiKey: OPENAI_API_KEY });
const SCENE_ANALYSIS_PROMPT_PATH = path.join(__dirname, '../../packages/prompts/templates/scene_analysis_v1.txt');
let sceneAnalysisPromptTemplate = '';
try {
    sceneAnalysisPromptTemplate = fs.readFileSync(SCENE_ANALYSIS_PROMPT_PATH, 'utf-8');
} catch (error) {
    logger.error({ error, path: SCENE_ANALYSIS_PROMPT_PATH }, 'Failed to load scene analysis prompt template');
    process.exit(1);
}

// --- AJV Setup ---
const ajv = new Ajv();
const validateSceneAnalysisResult = ajv.compile(SceneAnalysisResultSchema);

// Function to call OpenAI with retry logic
const callOpenAIWithRetry = retryAsync(
    async (prompt: string) => {
        logger.debug('Calling OpenAI API...');
        const completion = await openai.chat.completions.create({
            model: process.env.OPENAI_MODEL || "gpt-3.5-turbo", // Or gpt-4 etc.
            messages: [{ role: "user", content: prompt }],
            temperature: 0.5, // Adjust as needed
            max_tokens: 500, // Adjust based on expected output size
            response_format: { type: "json_object" }, // Request JSON output if supported
        });
        const content = completion.choices[0]?.message?.content;
        if (!content) {
            throw new Error('OpenAI response content is empty or null');
        }
        logger.debug('Received OpenAI response.');
        return content;
    },
    {
        retries: 3,
        delayMs: 1500,
        backoffFactor: 2,
        logger: logger.child({ service: 'OpenAI' }),
        shouldRetry: (error: any) => {
            // Retry on common transient errors like 429 (rate limit), 5xx server errors
            return error?.status === 429 || (error?.status >= 500 && error?.status < 600);
        }
    }
);

// Function to get embeddings from OpenAI with retry logic
const getOpenAIEmbeddingsWithRetry = retryAsync(
    async (inputText: string): Promise<number[]> => {
        logger.debug('Getting embeddings from OpenAI...');
        const embeddingResponse = await openai.embeddings.create({
            model: process.env.OPENAI_EMBEDDING_MODEL || "text-embedding-ada-002", // Or newer models
            input: inputText.replace(/\n/g, ' '), // OpenAI recommends replacing newlines
            encoding_format: "float", // Request float embeddings
        });

        if (!embeddingResponse?.data?.[0]?.embedding) {
            throw new Error('Invalid embedding response from OpenAI');
        }
        logger.debug('Received embeddings from OpenAI.');
        return embeddingResponse.data[0].embedding;
    },
    {
        retries: 3,
        delayMs: 1000,
        backoffFactor: 2,
        logger: logger.child({ service: 'OpenAIEmbeddings' }),
        shouldRetry: (error: any) => {
            // Retry on common transient errors
            return error?.status === 429 || (error?.status >= 500 && error?.status < 600);
        }
    }
);

/**
 * Processes a single scene analysis message.
 */
async function processSceneAnalysis(messageId: string, messageData: Record<string, string>) {
    const { jobId, sceneId, sceneNumber, sceneText, sceneHeader } = messageData;
    if (!jobId || !sceneId || !sceneNumber || !sceneText || !sceneHeader) {
        logger.error({ messageId, messageData }, 'Invalid scene analysis message received');
        await redisClient.xack(STREAM_SCENE_ANALYSIS, GROUP_ANALYSIS_WORKERS, messageId);
        return;
    }
    const sceneLogger = logger.child({ jobId, sceneId, sceneNumber });
    sceneLogger.info('Processing scene analysis...');

    try {
        // 1. Format Prompt
        const prompt = sceneAnalysisPromptTemplate
            .replace('{{SCENE_HEADER}}', sceneHeader) // Optional: include header in prompt?
            .replace('{{SCENE_TEXT}}', sceneText);

        // 2. Call OpenAI
        const jsonResponseString = await callOpenAIWithRetry(prompt);
        sceneLogger.info('Successfully received analysis from OpenAI.');

        // 3. Parse and Validate JSON Response
        let analysisResult: SceneAnalysisResult;
        try {
            analysisResult = JSON.parse(jsonResponseString);
        } catch (parseError) {
            sceneLogger.error({ parseError, jsonResponseString }, 'Failed to parse JSON response from OpenAI');
            throw new Error('Invalid JSON response from LLM');
        }

        if (!validateSceneAnalysisResult(analysisResult)) {
            sceneLogger.error({ errors: validateSceneAnalysisResult.errors, analysisResult }, 'OpenAI response failed JSON schema validation');
            throw new Error('LLM response failed schema validation');
        }
        sceneLogger.info('Validated analysis result.');

        // 4. Generate Embedding
        sceneLogger.info('Generating embedding for scene text/summary...');
        // Choose what to embed: full text, summary, or a combination?
        const textToEmbed = analysisResult.summary || sceneText; // Example: embed summary if available, else full text
        const embeddingVector = await getOpenAIEmbeddingsWithRetry(textToEmbed);
        sceneLogger.info('Generated embedding successfully.');

        // 5. Prepare data for Weaviate
        const weaviateProperties = {
            jobId,
            sceneId,
            sceneNumber: parseInt(sceneNumber, 10),
            sceneText, // Store full text for context if needed
            analysisTitle: analysisResult.title,
            analysisSummary: analysisResult.summary,
            characters: analysisResult.characters,
            locations: analysisResult.locations,
            // Add other relevant fields from analysisResult here
        };

        // 6. Add object to Weaviate Batcher
        const weaviateClient = getWeaviateClient();
        // Consider creating one batcher per worker instance or managing it globally
        let batcher: ObjectsBatcher = weaviateClient.batch.objectsBatcher();

        batcher = batcher.withObject({
            class: WEAVIATE_CLASS_NAME,
            properties: weaviateProperties,
            vector: embeddingVector,
            // Use sceneId as the UUID for idempotency if desired
            // id: weaviate. V4Store.uuid(sceneId),
        });

        // Flush batch periodically or based on size (e.g., every 100 objects or 10 seconds)
        // For simplicity here, we flush immediately. In a real worker, batching is crucial.
        const batchResult = await batcher.do();
        sceneLogger.info({ result: batchResult }, 'Added/updated scene object in Weaviate batch');
        // Check for batch errors
        batchResult.forEach(item => {
            if (item.result?.errors) {
                sceneLogger.error({ errors: item.result.errors, object: item }, 'Error adding object to Weaviate batch');
                // Decide how to handle batch errors - potentially retry individual objects?
            }
        });

        // 7. Update Scene Status in MongoDB to INDEXED
        const scenes = getScenesCollection();
        const updateResult = await scenes.updateOne(
            { sceneId },
            { $set: { status: 'INDEXED' } } // Update status to INDEXED
        );
        if (updateResult.matchedCount === 0) {
            sceneLogger.warn('Scene document not found for status update to INDEXED');
        }
        sceneLogger.info('Updated scene status to INDEXED in MongoDB.');

        // 8. Update Job Progress Counter in MongoDB (Atomically)
        const jobs = getJobsCollection();
        const jobUpdateResult = await jobs.findOneAndUpdate(
            { jobId },
            { $inc: { processedScenes: 1 }, $set: { updatedAt: new Date() } },
            { returnDocument: 'after' } // Return the updated document
        );

        if (jobUpdateResult?.value) {
            const updatedJob = jobUpdateResult.value;
            const progressPercent = updatedJob.sceneCount ? Math.round((updatedJob.processedScenes || 0) * 100 / updatedJob.sceneCount) : 0;
            sceneLogger.info(`Job progress: ${updatedJob.processedScenes}/${updatedJob.sceneCount} scenes analyzed.`);
            await publishProgress(jobId, {
                status: 'ANALYZING',
                progress: progressPercent,
                message: `Analizowanie sceny ${updatedJob.processedScenes}/${updatedJob.sceneCount}...`
            });

            // Check if all scenes are processed
            if (updatedJob.processedScenes === updatedJob.sceneCount) {
                sceneLogger.info('All scenes analyzed for job. Updating job status to GENERATING_GRAPH.');
                await jobs.updateOne({ jobId }, { $set: { status: 'GENERATING_GRAPH' } });
                await publishProgress(jobId, { status: 'GENERATING_GRAPH', progress: 0, message: 'Rozpoczęto generowanie grafu...' });
                // TODO: Trigger Python worker (e.g., publish to STREAM_GRAPH_GENERATION)
            }
        } else {
            sceneLogger.warn('Job document not found during progress update.');
        }

        // 9. Acknowledge message
        await redisClient.xack(STREAM_SCENE_ANALYSIS, GROUP_ANALYSIS_WORKERS, messageId);
        sceneLogger.info(`Acknowledged message ${messageId}`);

    } catch (error: any) {
        sceneLogger.error({ error: error.message, stack: error.stack, messageId }, 'Failed to process scene analysis or indexing');
        try {
            const scenes = getScenesCollection();
            await scenes.updateOne({ sceneId }, { $set: { status: 'FAILED_ANALYSIS', errorMessage: `Analysis/Indexing Error: ${error.message}` } });
            await redisClient.xack(STREAM_SCENE_ANALYSIS, GROUP_ANALYSIS_WORKERS, messageId);
            sceneLogger.warn(`Acknowledged failed message ${messageId} after analysis/indexing error`);
        } catch (ackError: any) {
            sceneLogger.error({ error: ackError.message, stack: ackError.stack, messageId }, 'Failed to update status/ack failed scene analysis message after error');
        }
    }
}

/**
 * Processes messages from the PDF chunking stream.
 */
async function processChunkingMessage(messageId: string, messageData: Record<string, string>) {
    const { jobId, objectKey } = messageData;
    if (!jobId || !objectKey) {
        logger.error({ messageId, messageData }, 'Invalid chunking message received from stream');
        await redisClient.xack(STREAM_PDF_CHUNKS, GROUP_CHUNK_WORKERS, messageId);
        return;
    }

    const jobLogger = logger.child({ jobId, objectKey });
    jobLogger.info('Processing new chunking job...');

    try {
        // 1. Update job status and publish progress
        jobLogger.info('Updating job status to CHUNKING');
        const jobs = getJobsCollection();
        await jobs.updateOne({ jobId }, { $set: { status: 'CHUNKING', updatedAt: new Date() } });
        await publishProgress(jobId, { status: 'CHUNKING', progress: 10, message: 'Pobieranie pliku...' });

        // 2. Download PDF from MinIO/S3
        jobLogger.info(`Downloading PDF from bucket: ${MINIO_BUCKET}, key: ${objectKey}`);
        const pdfStream = await MinioClient.getObject(MINIO_BUCKET, objectKey);
        const pdfBuffer = await new Promise<Buffer>((resolve, reject) => {
            const chunks: Buffer[] = [];
            pdfStream.on('data', (chunk: Buffer) => chunks.push(chunk));
            pdfStream.on('end', () => resolve(Buffer.concat(chunks)));
            pdfStream.on('error', reject);
        });
        jobLogger.info(`Downloaded PDF successfully (${(pdfBuffer.length / 1024).toFixed(1)} KB)`);
        await publishProgress(jobId, { status: 'CHUNKING', progress: 30, message: 'Parsowanie i dzielenie na sceny...' });

        // 3. Parse PDF and split into scenes
        const scenes = await parsePdfAndSplitScenes(pdfBuffer, jobLogger);
        jobLogger.info(`Split into ${scenes.length} scenes.`);

        // 4. Update job with scene count
        await jobs.updateOne({ jobId }, { $set: { sceneCount: scenes.length, updatedAt: new Date() } });

        // 5. Publish scenes to the next stream
        const scenesCol = getScenesCollection();
        let scenesPublished = 0;
        const scenePublishPromises = scenes.map(async (sceneSplit, index) => {
            const sceneId = `scene-${jobId}-${index + 1}`;
            const sceneMessage = [
                'jobId', jobId,
                'sceneId', sceneId,
                'sceneNumber', (index + 1).toString(),
                'sceneText', sceneSplit.content,
                'sceneHeader', sceneSplit.header,
            ];
            await scenesCol.insertOne({
                sceneId,
                jobId,
                sceneNumber: index + 1,
                sceneText: sceneSplit.content,
                status: 'PENDING_ANALYSIS',
            });
            await redisClient.xadd(STREAM_SCENE_ANALYSIS, '*', ...sceneMessage);
            scenesPublished++;
            if (scenes.length > 1) {
                await publishProgress(jobId, {
                    status: 'CHUNKING',
                    progress: 30 + Math.round((scenesPublished / scenes.length) * 60),
                    message: `Publikowanie sceny ${scenesPublished}/${scenes.length}...`
                });
            }
        });
        await Promise.all(scenePublishPromises);
        jobLogger.info(`Published ${scenesPublished} scenes to ${STREAM_SCENE_ANALYSIS}`);

        // 6. Update final job status and publish progress
        await jobs.updateOne({ jobId }, { $set: { status: 'ANALYZING', processedScenes: 0, updatedAt: new Date() } });
        await publishProgress(jobId, { status: 'ANALYZING', progress: 0, message: 'Rozpoczęto analizę scen...' });

        // 7. Acknowledge message in Redis Stream
        await redisClient.xack(STREAM_PDF_CHUNKS, GROUP_CHUNK_WORKERS, messageId);
        jobLogger.info(`Acknowledged chunking message ${messageId}`);

    } catch (error: any) {
        jobLogger.error({ error: error.message, stack: error.stack, messageId }, 'Failed to process chunking job');
        try {
            const jobs = getJobsCollection();
            await jobs.updateOne({ jobId }, { $set: { status: 'FAILED', errorMessage: error.message, updatedAt: new Date() } });
            await publishProgress(jobId, { status: 'FAILED', progress: 0, message: `Błąd podczas dzielenia: ${error.message}` });
            await redisClient.xack(STREAM_PDF_CHUNKS, GROUP_CHUNK_WORKERS, messageId);
            jobLogger.warn(`Acknowledged failed chunking message ${messageId}`);
        } catch (ackError: any) {
            jobLogger.error({ error: ackError.message, stack: ackError.stack, messageId }, 'Failed to update status/ack failed chunking job');
        }
    }
}

// --- Main Execution & Worker Loop ---

async function runWorkerLoop(stream: string, group: string, processFn: (id: string, data: Record<string, string>) => Promise<void>) {
    logger.info(`Starting worker loop for stream: ${stream}, group: ${group}`);
    while (!isShuttingDown) {
        try {
            const response: [string, [string, string[]][]][] | null = await redisClient.xreadgroup(
                'GROUP', group, CONSUMER_ID,
                'COUNT', 1,
                'BLOCK', 5000,
                'STREAMS', stream, '>'
            ) as any;

            if (response && response.length > 0) {
                const streamMessages = response[0];
                if (streamMessages && streamMessages.length === 2) {
                    const messages = streamMessages[1];
                    if (messages && messages.length > 0) {
                        const messageEntry = messages[0];
                        if (messageEntry && messageEntry.length === 2) {
                            const messageId = messageEntry[0];
                            const messageArray = messageEntry[1];
                            if (Array.isArray(messageArray)) {
                                const messageData: Record<string, string> = {};
                                for (let i = 0; i < messageArray.length; i += 2) {
                                    if (i + 1 < messageArray.length) {
                                        messageData[messageArray[i]] = messageArray[i + 1];
                                    }
                                }
                                logger.info({ messageId, stream }, 'Received new message');
                                await processFn(messageId, messageData); // Call specific processor
                            } else { logger.warn({ messageEntry }, 'Invalid msg array'); }
                        } else { logger.warn({ messages }, 'Invalid msg entry'); }
                    } else { /* logger.trace('No messages in stream data'); */ }
                } else { logger.warn({ response }, 'Invalid stream msg structure'); }
            } else { /* logger.trace('No new messages (timeout)'); */ }
        } catch (error: any) {
            logger.error({ stream, group, err: error.message, stack: error.stack }, 'Error in worker loop');
            await new Promise(resolve => setTimeout(resolve, 5000));
        }
    }
    logger.info(`Exiting worker loop for stream: ${stream}`);
}

async function main() {
    logger.info('Worker-JS starting initialization...');
    try {
        await Promise.all([
            initializeRedis(logger),
            initializeMongo(logger),
            initializeMinio(logger),
            initializeWeaviate(logger), // Initialize Weaviate
        ]);
        logger.info('All clients initialized successfully.');
    } catch (error) {
        logger.error({ error }, 'Worker-JS failed to initialize clients');
        process.exit(1);
    }

    logger.info(`Worker-JS ready. Consumer ID: ${CONSUMER_ID}.`);

    // Run loops concurrently (or sequentially if needed)
    const chunkingLoop = runWorkerLoop(STREAM_PDF_CHUNKS, GROUP_CHUNK_WORKERS, processChunkingMessage);
    const analysisLoop = runWorkerLoop(STREAM_SCENE_ANALYSIS, GROUP_ANALYSIS_WORKERS, processSceneAnalysis);

    // Wait for loops to finish (e.g., on shutdown signal)
    await Promise.all([chunkingLoop, analysisLoop]);

    logger.info('Worker loops finished.');
}

async function shutdown() {
  if (isShuttingDown) return;
  isShuttingDown = true;
  logger.info('Shutting down Worker-JS gracefully...');
  try {
    // Close MongoDB connection
    await closeMongoConnection(logger);

    // Close Redis connections (important for blocking commands like XREADGROUP)
    if (redisClient.status === 'ready') {
      await redisClient.quit();
      logger.info('Redis connection closed.');
    }
    // Add shutdown logic for other resources if needed

    logger.info('Graceful shutdown complete.');
    process.exit(0);
  } catch (error) {
    logger.error({ error }, 'Error during graceful shutdown');
    process.exit(1);
  }
}

// Handle termination signals
process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

// Start the main function
main().catch((error) => {
    logger.error({ error }, 'Worker-JS encountered a fatal error');
    shutdown().finally(() => process.exit(1));
});

export async function analyzePdfWithCache(jobId: string, pdfPath: string, scenes: any, publishProgress: any) {
  // 1. Chunking PDF z cache/checkpointem
  const chunks = await loadChunksWithCache(pdfPath, jobId, CACHE_DIR);
  // 2. Analiza scen z cache/checkpointem
  await processChunksWithCache(chunks, scenes, publishProgress, jobId, CACHE_DIR);
} 