import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import { minioClient, STREAM_PDF_CHUNKS, STREAM_SCRIPT_ANALYSIS, MINIO_BUCKET, redisClient } from './clients';
import { jobsCollection } from './clients/mongoClient';
import axios from 'axios';
import { 
  PresignedUrlRequestSchema, 
  PresignedUrlResponse,
  NotifyUploadCompleteResponse,
  JobStatusSchema, 
  Job,
  PresignedUrlRequest,
} from '@site2data/schemas';

const router = express.Router();

// Health check endpoint
router.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

// Validate OpenAI API key endpoint
router.post('/api/validate-openai-key', async (req, res) => {
  try {
    const { apiKey } = req.body;
    
    if (!apiKey) {
      return res.status(400).json({ 
        valid: false, 
        message: 'API key is required' 
      });
    }
    
    // Validate the API key by making a simple request to OpenAI API
    try {
      await axios.get('https://api.openai.com/v1/models', {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        }
      });
      // If we get here, the API key is valid
      return res.status(200).json({ 
        valid: true,
        message: 'API key is valid'
      });
    } catch (error: unknown) {
      // Check if it's an authentication error
      if (
        typeof error === 'object' &&
        error !== null &&
        'name' in error &&
        (error as { name: string }).name === 'AxiosError' &&
        'response' in error &&
        (error as { response?: { status?: number } }).response?.status === 401
      ) {
        return res.status(200).json({
          valid: false,
          message: 'Invalid API key. Please check and try again.'
        });
      }
      // For other errors, assume it's a server or network issue
      throw error;
    }
  } catch (error) {
    console.error('Error validating OpenAI API key:', error);
    return res.status(500).json({ 
      valid: false, 
      message: 'Failed to validate API key. Please try again later.' 
    });
  }
});

// Get script analysis job status
router.get('/api/jobs/:jobId', async (req, res) => {
  try {
    const { jobId } = req.params;
    
    if (!jobId) {
      res.status(400).json({ error: 'Job ID is required' });
      return;
    }
    
    const job = await jobsCollection.findOne({ _id: jobId });
    
    if (!job) {
      res.status(404).json({ error: 'Job not found' });
      return;
    }
    
    res.status(200).json(job);
  } catch (error) {
    console.error('Error fetching job:', error);
    res.status(500).json({ error: 'Failed to fetch job details' });
  }
});

// Get all script analysis jobs
router.get('/api/jobs', async (req, res) => {
  try {
    const jobs = await jobsCollection.find().sort({ createdAt: -1 }).toArray();
    res.status(200).json(jobs);
  } catch (error) {
    console.error('Error fetching jobs:', error);
    res.status(500).json({ error: 'Failed to fetch jobs' });
  }
});

// Generate presigned URL for script upload
router.post('/api/jobs/presigned-url', async (req, res) => {
  try {
    const validationResult = PresignedUrlRequestSchema.safeParse(req.body);
    if (!validationResult.success) {
      return res.status(400).json({ error: 'Invalid request body', details: validationResult.error.format() });
    }

    const { filename }: PresignedUrlRequest = validationResult.data;
    const objectKey = `${uuidv4()}-${filename}`;

    const presignedUrl = await minioClient.presignedPutObject(
      MINIO_BUCKET,
      objectKey,
      60 * 60 // 1 hour expiry
    );
    
    const jobToInsert: Omit<Job, '_id'> = {
      filename: objectKey, 
      originalFilename: filename, 
      objectKey,
      status: JobStatusSchema.Enum.created,
      createdAt: new Date(),
      updatedAt: new Date(),
      progress: 0,
      statusMessage: 'Job created, awaiting upload.',
    };

    const result = await jobsCollection.insertOne(jobToInsert);
    const jobId = result.insertedId.toString();

    const responsePayload: PresignedUrlResponse = {
      uploadUrl: presignedUrl,
      jobId,
      objectKey,
    };
    res.status(200).json(responsePayload);
  } catch (error) {
    console.error('Error generating upload URL:', error);
    res.status(500).json({ error: 'Failed to generate upload URL' });
  }
});

// Notify upload complete and start script analysis
router.post('/api/jobs/:jobId/notify-upload-complete', async (req, res) => {
  try {
    const { jobId } = req.params;

    const jobDocument = await jobsCollection.findOne({ _id: jobId });
    if (!jobDocument) {
      return res.status(404).json({ error: `Job with ID ${jobId} not found` });
    }
    // Validate current job status before proceeding
    if (jobDocument.status !== JobStatusSchema.Enum.created && jobDocument.status !== JobStatusSchema.Enum.uploading) {
        return res.status(409).json({ error: `Job ${jobId} is not in a state to start analysis (current state: ${jobDocument.status})`});
    }

    await jobsCollection.updateOne(
      { _id: jobId },
      { 
        $set: { 
          status: JobStatusSchema.Enum.uploaded,
          updatedAt: new Date() 
        } 
      }
    );
    await jobsCollection.updateOne(
      { _id: jobId },
      { 
        $set: { 
          status: JobStatusSchema.Enum.queued_for_chunking,
          updatedAt: new Date() 
        } 
      }
    );

    const messageRecord = { jobId, objectKey: jobDocument.objectKey };
    await redisClient.xAdd(STREAM_PDF_CHUNKS, '*', messageRecord);
    console.log(`Published message to Redis stream ${STREAM_PDF_CHUNKS} for job: ${jobId}`);

    const responsePayload: NotifyUploadCompleteResponse = {
      status: JobStatusSchema.Enum.queued_for_chunking,
      jobId,
      message: 'Script queued for chunking and analysis.',
    };
    res.status(202).json(responsePayload);
  } catch (error) {
    console.error('Error starting script analysis:', error);
    res.status(500).json({ error: 'Failed to start script analysis' });
  }
});

// Get script analysis results
router.get('/api/analysis/:jobId', async (req, res) => {
  try {
    const { jobId } = req.params;
    
    if (!jobId) {
      res.status(400).json({ error: 'Job ID is required' });
      return;
    }
    
    const job = await jobsCollection.findOne({ _id: jobId });
    
    if (!job) {
      res.status(404).json({ error: 'Job not found' });
      return;
    }
    
    if (job.status !== JobStatusSchema.Enum.completed) {
      res.status(202).json({ 
        status: job.status,
        message: 'Analysis not yet complete'
      });
      return;
    }
    
    res.status(200).json({
      status: 'completed',
      results: job.results
    });
  } catch (error) {
    console.error('Error fetching analysis results:', error);
    res.status(500).json({ error: 'Failed to fetch analysis results' });
  }
});

// Process PDF chunks
router.post('/api/process/pdf-chunks', async (req, res) => {
  try {
    const { jobId, chunks } = req.body;
    
    if (!jobId || !chunks || !Array.isArray(chunks)) {
      res.status(400).json({ error: 'JobId and chunks array are required' });
      return;
    }
    
    // Update job with extracted chunks
    await jobsCollection.updateOne(
      { _id: jobId },
      { 
        $set: { 
          chunks,
          status: JobStatusSchema.Enum.chunks_extracted,
          updatedAt: new Date() 
        } 
      }
    );
    
    // Publish message to script analysis stream
    const messageRecord = { jobId, chunkCount: chunks.length.toString() };
    
    await redisClient.xAdd(STREAM_SCRIPT_ANALYSIS, '*', messageRecord);
    
    res.status(200).json({
      status: 'chunks_extracted',
      jobId
    });
  } catch (error) {
    console.error('Error processing PDF chunks:', error);
    res.status(500).json({ error: 'Failed to process PDF chunks' });
  }
});

// Helper functions
async function createJobRecord(filename: string, objectKey: string) {
  const job = {
    filename,
    objectKey,
    status: 'created',
    createdAt: new Date(),
    updatedAt: new Date()
  };
  
  const result = await jobsCollection.insertOne(job);
  return result.insertedId.toString();
}

async function updateJobStatus(jobId: string, status: string) {
  await jobsCollection.updateOne(
    { _id: jobId },
    { 
      $set: { 
        status, 
        updatedAt: new Date() 
      } 
    }
  );
}

export default router;
