import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import path from "path";
import { FileSystemCache } from "./utils/FileSystemCache";
import { Logger } from 'pino';

export async function loadChunksWithCache(pdfPath: string, jobId: string, cacheDir: string, logger: Logger) {
  const cache = new FileSystemCache(cacheDir);
  const checkpointKey = `${jobId}:chunking_langchain`;
  
  logger.info({ jobId, pdfPath, cacheKey: checkpointKey }, 'Attempting to load chunks from cache (Langchain).');
  try {
    const cached = await cache.get<string[]>(checkpointKey);
    if (cached && cached.length > 0) {
      logger.info({ jobId, cacheKey: checkpointKey, count: cached.length }, 'Successfully loaded chunks from cache (Langchain).');
      return cached;
    }
  } catch (cacheGetError) {
    logger.warn({ jobId, cacheKey: checkpointKey, error: cacheGetError }, 'Failed to get chunks from cache (Langchain), proceeding with generation.');
  }

  logger.info({ jobId, pdfPath }, 'No cache found or cache error, generating chunks using Langchain PDFLoader.');
  try {
    const pages = await new PDFLoader(pdfPath).load();
    const rawText = pages.map((p: { pageContent: string }) => p.pageContent).join("\n");
    
    const splitter = new RecursiveCharacterTextSplitter({
          chunkSize: 3000, 
          chunkOverlap: 200, 
          separators:["\n\nINT.","\n\nEXT.", "\nINT.", "\nEXT.", "\n\n", "\n", " "]
    });
    const chunks = await splitter.splitText(rawText);
    logger.info({ jobId, count: chunks.length }, 'Successfully generated chunks using Langchain.');

    try {
      await cache.set(checkpointKey, chunks);
      logger.info({ jobId, cacheKey: checkpointKey }, 'Successfully saved generated chunks to cache (Langchain).');
    } catch (cacheSetError) {
      logger.warn({ jobId, cacheKey: checkpointKey, error: cacheSetError }, 'Failed to save chunks to cache (Langchain).');
    }
    return chunks;
  } catch (processingError) {
    logger.error({ jobId, pdfPath, error: processingError }, 'Error during Langchain PDF chunking process.');
    throw processingError;
  }
} 