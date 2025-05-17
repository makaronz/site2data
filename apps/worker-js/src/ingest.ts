// import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";
// import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import path from "path";
import { FileSystemCache } from "./utils/FileSystemCache";
import { Logger } from 'pino';
import fs from 'fs';

// Tymczasowa funkcja do podziału tekstu
function mockTextSplitter(text: string): string[] {
  // Prosty podział na kawałki o długości ~3000 znaków
  const chunks = [];
  const size = 3000;
  for (let i = 0; i < text.length; i += size) {
    chunks.push(text.slice(i, i + size));
  }
  return chunks;
}

export async function loadChunksWithCache(pdfPath: string, jobId: string, cacheDir: string, logger?: Logger) {
  const log = logger || console;
  const cache = new FileSystemCache(cacheDir);
  const checkpointKey = `${jobId}:chunking_langchain`;
  
  log.info?.({ jobId, pdfPath, cacheKey: checkpointKey }, 'Attempting to load chunks from cache (Langchain).');
  try {
    const cached = await cache.get<string[]>(checkpointKey);
    if (cached && cached.length > 0) {
      log.info?.({ jobId, cacheKey: checkpointKey, count: cached.length }, 'Successfully loaded chunks from cache (Langchain).');
      return cached;
    }
  } catch (cacheGetError) {
    log.warn?.({ jobId, cacheKey: checkpointKey, error: cacheGetError }, 'Failed to get chunks from cache (Langchain), proceeding with generation.');
  }

  log.info?.({ jobId, pdfPath }, 'No cache found or cache error, generating mock chunks (langchain imports zakomentowane).');
  try {
    // Zamiast używać PDFLoader, czytamy plik jako tekst (jeśli to tekstowy PDF)
    // To tymczasowe rozwiązanie, które może nie działać dla wszystkich PDF-ów
    let rawText = '';
    try {
      rawText = fs.readFileSync(pdfPath, 'utf-8');
    } catch (e) {
      rawText = 'Przykładowy tekst dla testów. To jest zawartość pliku PDF.';
      log.warn?.({ jobId, pdfPath, error: e }, 'Nie można odczytać pliku PDF, używam przykładowego tekstu.');
    }
    
    // Używamy tymczasowego podziału tekstu zamiast RecursiveCharacterTextSplitter
    const chunks = mockTextSplitter(rawText);
    log.info?.({ jobId, count: chunks.length }, 'Successfully generated mock chunks.');

    try {
      await cache.set(checkpointKey, chunks);
      log.info?.({ jobId, cacheKey: checkpointKey }, 'Successfully saved generated chunks to cache.');
    } catch (cacheSetError) {
      log.warn?.({ jobId, cacheKey: checkpointKey, error: cacheSetError }, 'Failed to save chunks to cache.');
    }
    return chunks;
  } catch (processingError) {
    log.error?.({ jobId, pdfPath, error: processingError }, 'Error during PDF chunking process.');
    throw processingError;
  }
} 