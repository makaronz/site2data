import mongoose from 'mongoose';
import Redis from 'ioredis';
import { ScenarioChunkModel } from '../models/ScenarioChunk';

// Połączenie z MongoDB
mongoose.connect(process.env.MONGODB_URI || '', {});

// Połączenie z Redis
const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');

const WORKER_ID = process.env.WORKER_ID || `worker-${Math.floor(Math.random() * 10000)}`;

const processJob = async (job: any) => {
  const { jobId } = job;
  console.log(`[${WORKER_ID}] Processing job: ${jobId}`);

  // Pobierz chunk-i do przetworzenia
  const chunks = await ScenarioChunkModel.find({ status: 'pending' }).sort({ index: 1 });

  for (const chunk of chunks) {
    try {
      // Oznacz chunk jako "processing"
      chunk.status = 'processing';
      await chunk.save();

      // TODO: Wywołaj LLM, waliduj, retry, naprawiaj JSON, itp.
      // const result = await callLLM(chunk.text);

      // Oznacz chunk jako "done" (na razie tylko symulacja)
      chunk.status = 'done';
      await chunk.save();

      console.log(`[${WORKER_ID}] Chunk ${chunk.id} processed`);
    } catch (err: any) {
      chunk.status = 'error';
      chunk.errorMessage = err.message || 'Unknown error';
      await chunk.save();
      console.error(`[${WORKER_ID}] Error processing chunk ${chunk.id}: ${err.message}`);
    }
  }

  console.log(`[${WORKER_ID}] Job ${jobId} finished`);
};

const main = async () => {
  console.log(`[${WORKER_ID}] Worker started`);

  while (true) {
    // Blokujące pobranie joba z kolejki Redis
    const jobData = await redis.brpop('jobs', 0);
    if (!jobData || !jobData[1]) continue;

    const job = JSON.parse(jobData[1]);
    await processJob(job);
  }
};

main().catch(err => {
  // eslint-disable-next-line no-console
  console.error(`[${WORKER_ID}] Worker crashed:`, err);
  process.exit(1);
}); 