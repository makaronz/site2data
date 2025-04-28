import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import path from "path";
import { FileSystemCache } from "./utils/FileSystemCache";

export async function loadChunksWithCache(pdfPath: string, jobId: string, cacheDir: string) {
  const cache = new FileSystemCache(cacheDir);
  const checkpointKey = `${jobId}:chunking`;
  // Spróbuj wznowić z checkpointu
  const cached = await cache.get<string[]>(checkpointKey);
  if (cached && cached.length > 0) {
    return cached;
  }
  // Chunking PDF
  const pages   = await new PDFLoader(pdfPath).load();
  const rawText = pages.map((p: { pageContent: string }) => p.pageContent).join("\n");
  const splitter = new RecursiveCharacterTextSplitter({
        chunkSize: 3000, chunkOverlap: 200, separators:["\n\nINT.","\n\nEXT."]
  });
  const chunks = await splitter.splitText(rawText);
  await cache.set(checkpointKey, chunks);
  return chunks;
} 