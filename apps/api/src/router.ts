import { initTRPC, TRPCError } from '@trpc/server';
import { z } from 'zod';
import { Context } from './context';
import { MinioClient, MINIO_BUCKET, redisClient, STREAM_PDF_CHUNKS, jobsCollection } from './clients'; // Import clients
import { Job, JobStatus } from '../../packages/types/src'; // Import shared types
import { randomUUID } from 'crypto'; // For generating job IDs

// Avoid exporting the entire t object
// since it's not very descriptive.创
// Instead, export reusable procedures and adapters.
const t = initTRPC.context<Context>().create();

export const router = t.router;
export const publicProcedure = t.procedure;

// Define procedures here
export const appRouter = router({
  healthcheck: publicProcedure.query(() => {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }),

  requestPresignedUrl: publicProcedure
    .input(
      z.object({
        filename: z.string().refine(name => name.toLowerCase().endsWith('.pdf'), {
          message: 'Dozwolony jest tylko format PDF.',
        }),
        // Add size validation if possible/needed, though typically done client-side first
      })
    )
    .mutation(async ({ input }: { input: z.infer<typeof z.object({ filename: z.string() })> }) => {
      const objectKey = `uploads/${randomUUID()}-${input.filename}`;
      const expirySeconds = 60 * 5; // 5 minutes validity

      try {
        const presignedUrl = await MinioClient.presignedPutObject(
          MINIO_BUCKET,
          objectKey,
          expirySeconds
        );
        console.log(`Generated presigned URL for: ${objectKey}`);
        return { success: true, url: presignedUrl, objectKey };
      } catch (error) {
        console.error('Failed to generate presigned URL:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Nie udało się wygenerować adresu do uploadu.',
          cause: error,
        });
      }
    }),

  notifyUploadComplete: publicProcedure
    .input(z.object({ objectKey: z.string() }))
    .mutation(async ({ input }: { input: z.infer<typeof z.object({ objectKey: z.string() })> }) => {
      const jobId = `job-${randomUUID()}`;
      const now = new Date();

      const newJob: Job = {
        jobId,
        status: 'PENDING' as JobStatus,
        objectKey: input.objectKey,
        createdAt: now,
        updatedAt: now,
        // sceneCount and processedScenes will be updated by workers
      };

      try {
        // 1. Insert job into MongoDB
        const collection = jobsCollection();
        const insertResult = await collection.insertOne(newJob);
        if (!insertResult.acknowledged) {
          // This case should ideally not happen if MongoDB is running correctly
          // but good to have a specific error for it.
          console.error(`Failed to insert job ${jobId} into database, insert not acknowledged.`);
          throw new Error('Failed to insert job into database, operation not acknowledged.');
        }
        console.log(`Created job ${jobId} in MongoDB.`);

        try {
          // 2. Publish message to Redis Stream to trigger chunking
          const streamMessage = [
            'jobId', jobId,
            'objectKey', input.objectKey,
          ];
          await redisClient.xadd(STREAM_PDF_CHUNKS, '*', ...streamMessage);
          console.log(`Published job ${jobId} to stream ${STREAM_PDF_CHUNKS}.`);
        } catch (redisError) {
          // If Redis publish fails after successful DB insert, attempt to clean up the job document
          console.error(`Failed to publish job ${jobId} to Redis stream after DB insert. Attempting cleanup.`, redisError);
          try {
            await collection.deleteOne({ jobId });
            console.log(`Successfully deleted job ${jobId} from MongoDB after Redis publish failure.`);
          } catch (cleanupError) {
            console.error(`CRITICAL: Failed to delete job ${jobId} from MongoDB after Redis publish failure. Manual cleanup required.`, cleanupError);
            // Log critical error, as we now have an orphaned job that won't be processed
          }
          // Re-throw the original Redis error or a new error indicating publish failure
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Nie udało się opublikować zadania do przetworzenia po zapisie do bazy danych.',
            cause: redisError,
          });
        }

        return { success: true, jobId };

      } catch (error: any) {
        // Catch errors from DB insert, Redis publish (if not caught by inner try-catch), or other unexpected errors
        console.error(`Failed to process upload notification for ${input.objectKey}:`, error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: error.message || 'Nie udało się rozpocząć przetwarzania pliku.',
          cause: error,
        });
      }
    }),

  // TODO: Add getJobDetails procedure
  // getJobDetails: publicProcedure
  //   .input(z.object({ jobId: z.string() }))
  //   .query(async ({ input }) => {
  //     // Logic to fetch job details from MongoDB
  //     console.log('Fetching details for job:', input.jobId);
  //     // Replace with actual DB logic
  //     return { jobId: input.jobId, status: 'COMPLETED', /* other details */ };
  //   }),

    // TODO: Add searchScenes procedure
  // searchScenes: publicProcedure
  //   .input(z.object({ query: z.string() }))
  //   .query(async ({ input }) => {
  //     // Logic to search Weaviate
  //     console.log('Searching scenes for query:', input.query);
  //     // Replace with actual Weaviate logic
  //     return { results: [{ sceneId: 'scene1', text: 'Example scene...' }] };
  //   }),
});

// Export type definition of API
export type AppRouter = typeof appRouter; 