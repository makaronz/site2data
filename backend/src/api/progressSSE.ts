import express from 'express';
import Redis from 'ioredis';

const router = express.Router();
const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');

router.get('/api/progress/:jobId', (req, res) => {
  res.set({
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    Connection: 'keep-alive',
  });
  res.flushHeaders();

  const jobId = req.params.jobId;
  const subscriber = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');

  subscriber.subscribe('progress');

  subscriber.on('message', (channel, message) => {
    const data = JSON.parse(message);
    if (data.jobId === jobId) {
      res.write(`data: ${JSON.stringify(data)}\n\n`);
    }
  });

  req.on('close', () => {
    subscriber.disconnect();
    res.end();
  });
});

export default router; 