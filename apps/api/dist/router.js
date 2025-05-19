"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const uuid_1 = require("uuid");
const clients_1 = require("./clients");
const router = express_1.default.Router();
// Health check endpoint
router.get('/health', (req, res) => {
    res.status(200).json({ status: 'ok' });
});
// Get script analysis job status
router.get('/api/jobs/:jobId', async (req, res) => {
    try {
        const { jobId } = req.params;
        if (!jobId) {
            return res.status(400).json({ error: 'Job ID is required' });
        }
        const job = await clients_1.jobsCollection.findOne({ _id: jobId });
        if (!job) {
            return res.status(404).json({ error: 'Job not found' });
        }
        res.status(200).json(job);
    }
    catch (error) {
        console.error('Error fetching job:', error);
        res.status(500).json({ error: 'Failed to fetch job details' });
    }
});
// Get all script analysis jobs
router.get('/api/jobs', async (req, res) => {
    try {
        const jobs = await clients_1.jobsCollection.find().sort({ createdAt: -1 }).toArray();
        res.status(200).json(jobs);
    }
    catch (error) {
        console.error('Error fetching jobs:', error);
        res.status(500).json({ error: 'Failed to fetch jobs' });
    }
});
// Generate presigned URL for script upload
router.post('/api/upload/script', async (req, res) => {
    try {
        const { filename } = req.body;
        if (!filename) {
            return res.status(400).json({ error: 'Filename is required' });
        }
        const objectKey = `${(0, uuid_1.v4)()}-${filename}`;
        // Generate presigned URL for file upload
        const presignedUrl = await clients_1.minioClient.presignedPutObject(clients_1.MINIO_BUCKET, objectKey, 60 * 60 // 1 hour expiry
        );
        // Create job record in MongoDB
        const jobId = await createJobRecord(filename, objectKey);
        res.status(200).json({
            uploadUrl: presignedUrl,
            jobId,
            objectKey
        });
    }
    catch (error) {
        console.error('Error generating upload URL:', error);
        res.status(500).json({ error: 'Failed to generate upload URL' });
    }
});
// Start script analysis process
router.post('/api/analyze/script', async (req, res) => {
    try {
        const { jobId, objectKey } = req.body;
        if (!jobId || !objectKey) {
            return res.status(400).json({ error: 'JobId and objectKey are required' });
        }
        // 1. Update job status
        await updateJobStatus(jobId, 'processing');
        // 2. Publish message to Redis stream for processing
        // Fixed: Using proper Record object format for Redis v4 compatibility
        const messageRecord = {
            jobId,
            objectKey
        };
        await clients_1.redisClient.xAdd(clients_1.STREAM_PDF_CHUNKS, '*', messageRecord);
        console.log(`Published message to Redis stream for job: ${jobId}`);
        res.status(202).json({
            status: 'processing',
            jobId
        });
    }
    catch (error) {
        console.error('Error starting script analysis:', error);
        res.status(500).json({ error: 'Failed to start script analysis' });
    }
});
// Get script analysis results
router.get('/api/analysis/:jobId', async (req, res) => {
    try {
        const { jobId } = req.params;
        if (!jobId) {
            return res.status(400).json({ error: 'Job ID is required' });
        }
        const job = await clients_1.jobsCollection.findOne({ _id: jobId });
        if (!job) {
            return res.status(404).json({ error: 'Job not found' });
        }
        if (job.status !== 'completed') {
            return res.status(202).json({
                status: job.status,
                message: 'Analysis not yet complete'
            });
        }
        res.status(200).json({
            status: 'completed',
            results: job.results
        });
    }
    catch (error) {
        console.error('Error fetching analysis results:', error);
        res.status(500).json({ error: 'Failed to fetch analysis results' });
    }
});
// Process PDF chunks
router.post('/api/process/pdf-chunks', async (req, res) => {
    try {
        const { jobId, chunks } = req.body;
        if (!jobId || !chunks || !Array.isArray(chunks)) {
            return res.status(400).json({ error: 'JobId and chunks array are required' });
        }
        // Update job with extracted chunks
        await clients_1.jobsCollection.updateOne({ _id: jobId }, {
            $set: {
                chunks,
                status: 'chunks_extracted',
                updatedAt: new Date()
            }
        });
        // Publish message to script analysis stream
        // Fixed: Using proper Record object format for Redis v4 compatibility
        const messageRecord = {
            jobId,
            chunkCount: chunks.length.toString()
        };
        await clients_1.redisClient.xAdd(clients_1.STREAM_SCRIPT_ANALYSIS, '*', messageRecord);
        res.status(200).json({
            status: 'chunks_extracted',
            jobId
        });
    }
    catch (error) {
        console.error('Error processing PDF chunks:', error);
        res.status(500).json({ error: 'Failed to process PDF chunks' });
    }
});
// Helper functions
async function createJobRecord(filename, objectKey) {
    const job = {
        filename,
        objectKey,
        status: 'created',
        createdAt: new Date(),
        updatedAt: new Date()
    };
    const result = await clients_1.jobsCollection.insertOne(job);
    return result.insertedId.toString();
}
async function updateJobStatus(jobId, status) {
    await clients_1.jobsCollection.updateOne({ _id: jobId }, {
        $set: {
            status,
            updatedAt: new Date()
        }
    });
}
exports.default = router;
//# sourceMappingURL=router.js.map