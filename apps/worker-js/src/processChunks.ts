import { callLLM } from "./sceneChain";
import { FileSystemCache } from "./utils/FileSystemCache";
import { Logger } from 'pino';
import { Collection } from 'mongodb';
// import { scenes, publishProgress } from "./db"; // Załóżmy, że masz te funkcje

interface LLMAnalysisResult {
  title?: string;
  summary?: string;
  characters?: string[];
}

interface ProcessedSceneData extends LLMAnalysisResult {
  _id: string;
  jobId: string;
  chunkIndex: number;
}

interface CheckpointData {
  lastProcessedIndex: number;
  processedScenes: ProcessedSceneData[];
}

export async function processChunksWithCache(
  chunks: string[], 
  scenesCollection: Collection,
  publishProgress: (jobId: string, processed: number, total: number, message?: string) => void,
  jobId: string, 
  cacheDir: string,
  logger: Logger
) {
  const cache = new FileSystemCache(cacheDir);
  const checkpointKey = `${jobId}:scene_analysis_langchain`;

  logger.info({ jobId, checkpointKey }, 'Attempting to resume chunk processing from cache (Langchain).');
  let startIdx = 0;
  let processedScenesArray: ProcessedSceneData[] = [];

  try {
    const checkpoint = await cache.get<CheckpointData>(checkpointKey);
    if (checkpoint) {
      startIdx = checkpoint.lastProcessedIndex + 1;
      processedScenesArray = checkpoint.processedScenes || [];
      logger.info({ jobId, checkpointKey, lastProcessedIndex: checkpoint.lastProcessedIndex }, 'Resumed from checkpoint.');
    }
  } catch (cacheGetError) {
    logger.warn({ jobId, checkpointKey, error: cacheGetError }, 'Failed to get checkpoint from cache (Langchain), starting from beginning.');
  }

  if (startIdx >= chunks.length && chunks.length > 0) {
    logger.info({ jobId }, 'All chunks already processed according to checkpoint (Langchain).');
    return processedScenesArray;
  }

  logger.info({ jobId, startIdx, totalChunks: chunks.length }, 'Starting chunk processing loop (Langchain).');
  for (let idx = startIdx; idx < chunks.length; idx++) {
    const chunk = chunks[idx];
    const sceneId = `S_langchain_${jobId}_${idx + 1}`;
    
    logger.debug({ jobId, chunkIndex: idx, sceneId }, 'Processing chunk.');

    try {
      const existingScene = await scenesCollection.findOne({ _id: sceneId, jobId: jobId });
      if (existingScene) {
        logger.info({ jobId, sceneId }, 'Scene already processed and found in DB, skipping LLM call.');
        if (!processedScenesArray.find(ps => ps._id === sceneId)) {
          processedScenesArray.push(existingScene as ProcessedSceneData); 
        }
        publishProgress(jobId, idx + 1, chunks.length, `Chunk ${idx+1} already processed.`);
        continue;
      }

      const analysisResult: LLMAnalysisResult = await callLLM(chunk);
      
      const sceneDataToInsert: ProcessedSceneData = {
        _id: sceneId,
        jobId: jobId,
        chunkIndex: idx,
        ...analysisResult,
      };

      await scenesCollection.insertOne(sceneDataToInsert);
      logger.info({ jobId, sceneId }, 'Successfully inserted scene analysis into DB.');
      
      processedScenesArray.push(sceneDataToInsert);

      await cache.set(checkpointKey, { lastProcessedIndex: idx, processedScenes: processedScenesArray });
      logger.debug({ jobId, checkpointKey, lastProcessedIndex: idx }, 'Checkpoint saved.');

      publishProgress(jobId, idx + 1, chunks.length, `Chunk ${idx+1} analyzed.`);

    } catch (error) {
      logger.error({ jobId, chunkIndex: idx, sceneId, error }, 'Error processing chunk or interacting with DB/cache.');
      try {
        await cache.set(checkpointKey, { lastProcessedIndex: idx -1, processedScenes: processedScenesArray });
        logger.warn({ jobId, checkpointKey, lastProcessedIndex: idx -1 }, 'Saved checkpoint after error on current chunk.');
      } catch (checkpointError) {
        logger.error({ jobId, checkpointKey, error: checkpointError }, 'Failed to save checkpoint after an error.');
      }
    }
  }
  logger.info({ jobId, processedCount: processedScenesArray.length }, 'Finished processing all chunks (Langchain).');
  return processedScenesArray;
} 