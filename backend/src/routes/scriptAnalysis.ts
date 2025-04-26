import express from 'express';
import { WebSocket } from 'ws';
import { ScriptAnalysisService } from '../services/scriptAnalysis';
import multer from 'multer';
import fs from 'fs';
import path from 'path';

const router = express.Router();
const scriptAnalysisService = new ScriptAnalysisService();

interface ScriptAnalysisMessage {
  type: string;
  script?: string;
}

// Konfiguracja multer dla przesyłania plików
const storage = multer.diskStorage({
  destination: (req: express.Request, file: Express.Multer.File, cb: (error: Error | null, destination: string) => void) => {
    const uploadDir = path.join(process.cwd(), 'uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req: express.Request, file: Express.Multer.File, cb: (error: Error | null, filename: string) => void) => {
    cb(null, Date.now() + '-' + file.originalname);
  }
});

const upload = multer({
  storage: storage,
  fileFilter: (req: express.Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Tylko pliki PDF są dozwolone!'));
    }
  }
});

// WebSocket handler
export const handleWebSocket = (ws: WebSocket) => {
  console.log('New WebSocket connection established');

  ws.on('message', async (message: Buffer) => {
    try {
      const data = JSON.parse(message.toString()) as ScriptAnalysisMessage;
      // Handle different message types
      switch (data.type) {
        case 'ANALYZE_SCRIPT':
          if (!data.script) {
            throw new Error('No script provided');
          }
          const result = await scriptAnalysisService.analyzeScript({
            content: data.script,
            type: 'text'
          });
          ws.send(JSON.stringify({
            type: 'ANALYSIS_RESULT',
            result
          }));
          break;
        default:
          ws.send(JSON.stringify({
            type: 'ERROR',
            error: 'Unknown message type'
          }));
      }
    } catch (error) {
      ws.send(JSON.stringify({
        type: 'ERROR',
        error: error instanceof Error ? error.message : 'Failed to process message'
      }));
    }
  });

  ws.on('close', () => {
    console.log('Client disconnected');
  });
};

// REST endpoints
router.post('/analyze', upload.single('script'), async (req: express.Request, res: express.Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No script provided' });
    }

    // Odczytaj zawartość pliku
    const filePath = req.file.path;
    const fileContent = fs.readFileSync(filePath, 'utf-8');

    const result = await scriptAnalysisService.analyzeScript({
      content: fileContent,
      type: req.body.type || 'pdf'
    });

    // Usuń plik po analizie
    fs.unlinkSync(filePath);

    res.json({ result });
  } catch (error) {
    console.error('Error during script analysis:', error);
    res.status(500).json({ 
      error: error instanceof Error ? error.message : 'Failed to analyze script' 
    });
  }
});

export default router; 