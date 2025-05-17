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

interface SceneData extends LLMAnalysisResult {
  _id: string;
  jobId: string;
  chunkIndex: number;
}

interface CheckpointData {
  lastProcessedIndex: number;
  processedScenes: SceneData[];
}

export async function processChunksWithCache(
  chunks: string[], 
  scenesCollection: Collection<SceneData>,
  publishProgress: (jobId: string, processed: number, total: number, message?: string) => void,
  jobId: string, 
  cacheDir: string,
  logger?: Logger
) {
  const log = logger || console;
  const cache = new FileSystemCache(cacheDir);
  const checkpointKey = `${jobId}:scene_analysis_langchain`;

  log.info?.({ jobId, checkpointKey }, 'Attempting to resume chunk processing from cache (Langchain).');
  let startIdx = 0;
  let processedScenesArray: SceneData[] = [];

  try {
    const checkpoint = await cache.get<CheckpointData>(checkpointKey);
    if (checkpoint) {
      startIdx = checkpoint.lastProcessedIndex + 1;
      processedScenesArray = checkpoint.processedScenes || [];
      log.info?.({ jobId, checkpointKey, lastProcessedIndex: checkpoint.lastProcessedIndex }, 'Resumed from checkpoint.');
    }
  } catch (cacheGetError) {
    log.warn?.({ jobId, checkpointKey, error: cacheGetError }, 'Failed to get checkpoint from cache (Langchain), starting from beginning.');
  }

  if (startIdx >= chunks.length && chunks.length > 0) {
    log.info?.({ jobId }, 'All chunks already processed according to checkpoint (Langchain).');
    return processedScenesArray;
  }

  log.info?.({ jobId, startIdx, totalChunks: chunks.length }, 'Starting chunk processing loop (Langchain).');
  for (let idx = startIdx; idx < chunks.length; idx++) {
    const chunk = chunks[idx];
    const sceneId = `S_langchain_${jobId}_${idx + 1}`;
    
    log.debug?.({ jobId, chunkIndex: idx, sceneId }, 'Processing chunk.');

    try {
      const existingScene: SceneData | null = await scenesCollection.findOne({ _id: sceneId, jobId: jobId });
      if (existingScene) {
        log.info?.({ jobId, sceneId }, 'Scene already processed and found in DB, skipping LLM call.');
        if (!processedScenesArray.find(ps => ps._id === sceneId)) {
          processedScenesArray.push(existingScene);
        }
        publishProgress(jobId, idx + 1, chunks.length, `Chunk ${idx+1} already processed.`);
        continue;
      }

      const analysisResult: LLMAnalysisResult = await callLLM(chunk);
      
      const sceneDataToInsert: SceneData = {
        _id: sceneId,
        jobId: jobId,
        chunkIndex: idx,
        ...analysisResult,
      };

      await scenesCollection.insertOne(sceneDataToInsert);
      log.info?.({ jobId, sceneId }, 'Successfully inserted scene analysis into DB.');
      
      processedScenesArray.push(sceneDataToInsert);

      await cache.set(checkpointKey, { lastProcessedIndex: idx, processedScenes: processedScenesArray });
      log.debug?.({ jobId, checkpointKey, lastProcessedIndex: idx }, 'Checkpoint saved.');

      publishProgress(jobId, idx + 1, chunks.length, `Chunk ${idx+1} analyzed.`);

    } catch (error) {
      log.error?.({ jobId, chunkIndex: idx, sceneId, error }, 'Error processing chunk or interacting with DB/cache.');
      try {
        await cache.set(checkpointKey, { lastProcessedIndex: idx -1, processedScenes: processedScenesArray });
        log.warn?.({ jobId, checkpointKey, lastProcessedIndex: idx -1 }, 'Saved checkpoint after error on current chunk.');
      } catch (checkpointError) {
        log.error?.({ jobId, checkpointKey, error: checkpointError }, 'Failed to save checkpoint after an error.');
      }
    }
  }
  log.info?.({ jobId, processedCount: processedScenesArray.length }, 'Finished processing all chunks (Langchain).');
  return processedScenesArray;
} 