import { callLLM } from "./sceneChain";
import { FileSystemCache } from "./utils/FileSystemCache";
// import { scenes, publishProgress } from "./db"; // Załóżmy, że masz te funkcje

export async function processChunksWithCache(chunks: string[], scenes: any, publishProgress: any, jobId: string, cacheDir: string) {
  const cache = new FileSystemCache(cacheDir);
  const checkpointKey = `${jobId}:scene_analysis`;
  // Spróbuj wznowić z checkpointu
  const checkpoint = await cache.get<{ lastProcessedIndex: number, scenes: any[] }>(checkpointKey);
  let startIdx = 0;
  let processedScenes: any[] = [];
  if (checkpoint) {
    startIdx = checkpoint.lastProcessedIndex + 1;
    processedScenes = checkpoint.scenes || [];
  }
  for (let idx = startIdx; idx < chunks.length; idx++) {
    const chunk = chunks[idx];
    const id = `S${idx+1}`;
    if (await scenes.findOne({_id:id})) continue;
    const parsed = await callLLM(chunk);
    await scenes.insertOne({_id:id, ...parsed});
    processedScenes.push({_id:id, ...parsed});
    await cache.set(checkpointKey, { lastProcessedIndex: idx, scenes: processedScenes });
    publishProgress(jobId, idx+1, chunks.length);
  }
} 