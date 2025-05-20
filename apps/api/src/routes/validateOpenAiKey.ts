import { Router } from 'express';
import axios from 'axios';

const router = Router();

router.post('/validate-openai-key', async (req, res) => {
  const { apiKey } = req.body;
  if (!apiKey) {
    return res.status(400).json({ valid: false, message: 'API key is required.' });
  }

  try {
    const response = await axios.get('https://api.openai.com/v1/models', {
      headers: { Authorization: `Bearer ${apiKey}` }
    });
    if (response.status === 200) {
      return res.json({ valid: true });
    }
    return res.status(401).json({ valid: false, message: 'Invalid API key.' });
  } catch (err) {
    console.error('OpenAI validation error:', err);
    const msg = (err instanceof Error) ? err.message : 'Invalid API key.';
    return res.status(401).json({ valid: false, message: msg });
  }
});

export default router; 