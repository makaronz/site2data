import express from 'express';
import { WebSocket } from 'ws';
import { ScriptAnalysisService } from '../services/scriptAnalysis';
import multer from 'multer';
import fs from 'fs';
import path from 'path';
import { WebSocketClient, AllWebSocketMessages, ProgressMessage, ErrorMessage, AnalysisResultMessage, AnalyzeScriptMessage } from '../types/websocket';
import { validateUpload } from '../middleware/validation';
import config from '../config/environments';
import { z } from 'zod';
import { exportNodesCSV, exportEdgesCSV, exportGEXF } from '../utils/graphExport';
import pdf from 'pdf-parse';

const router = express.Router();
const scriptAnalysisService = new ScriptAnalysisService();

// Schematy Zod dla wiadomości WebSocket
const analyzeScriptMessageSchema = z.object({
  type: z.literal('ANALYZE_SCRIPT'),
  script: z.instanceof(Buffer),
});

const progressMessageSchema = z.object({
  type: z.literal('PROGRESS'),
  stage: z.enum(['uploading', 'processing', 'analyzing', 'complete']),
  progress: z.number(),
  message: z.string(),
});

const analysisResultMessageSchema = z.object({
  type: z.literal('ANALYSIS_RESULT'),
  result: z.any() // Można doprecyzować jeśli potrzeba
});

const errorMessageSchema = z.object({
  type: z.literal('ERROR'),
  message: z.string(),
});

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
  limits: {
    fileSize: config.maxFileSize
  },
  fileFilter: (req, file, cb) => {
    if (config.allowedFileTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Nieprawidłowy format pliku'));
    }
  }
});

// WebSocket handler
export const handleWebSocket = (ws: WebSocketClient) => {
  console.log('New WebSocket connection established');

  // Limiter wiadomości na połączenie
  let messageCount = 0;
  const MESSAGE_LIMIT = 60;
  const WINDOW_MS = 60 * 1000; // 1 minuta

  const resetMessageCount = () => {
    messageCount = 0;
  };
  const interval = setInterval(resetMessageCount, WINDOW_MS);

  ws.on('message', async (message: string) => {
    messageCount++;
    if (messageCount > MESSAGE_LIMIT) {
      const errorMsg: ErrorMessage = {
        type: 'ERROR',
        message: 'Przekroczono limit wiadomości WebSocket na minutę. Połączenie zostanie zamknięte.'
      };
      ws.send(JSON.stringify(errorMsg));
      ws.close(1011, 'Rate limit exceeded');
      clearInterval(interval);
      return;
    }
    try {
      const data = JSON.parse(message);

      // Walidacja typu wiadomości
      let validatedData: AllWebSocketMessages;
      switch (data.type) {
        case 'ANALYZE_SCRIPT':
          try {
            validatedData = analyzeScriptMessageSchema.parse(data);
          } catch (error) {
            if (error instanceof z.ZodError) {
              const errorMsg: ErrorMessage = {
                type: 'ERROR',
                message: 'Nieprawidłowa wiadomość ANALYZE_SCRIPT',
              };
              ws.send(JSON.stringify(errorMsg));
              return;
            }
            throw error;
          }
          break;
        case 'PROGRESS':
          try {
            validatedData = progressMessageSchema.parse(data);
          } catch (error) {
            if (error instanceof z.ZodError) {
              const errorMsg: ErrorMessage = {
                type: 'ERROR',
                message: 'Nieprawidłowa wiadomość PROGRESS',
              };
              ws.send(JSON.stringify(errorMsg));
              return;
            }
            throw error;
          }
          break;
        case 'ANALYSIS_RESULT':
          try {
            validatedData = analysisResultMessageSchema.parse(data);
          } catch (error) {
            if (error instanceof z.ZodError) {
              const errorMsg: ErrorMessage = {
                type: 'ERROR',
                message: 'Nieprawidłowa wiadomość ANALYSIS_RESULT',
              };
              ws.send(JSON.stringify(errorMsg));
              return;
            }
            throw error;
          }
          break;
        case 'ERROR':
          try {
            validatedData = errorMessageSchema.parse(data);
          } catch (error) {
            if (error instanceof z.ZodError) {
              const errorMsg: ErrorMessage = {
                type: 'ERROR',
                message: 'Nieprawidłowa wiadomość ERROR',
              };
              ws.send(JSON.stringify(errorMsg));
              return;
            }
            throw error;
          }
          break;
        default:
          const errorMsg: ErrorMessage = {
            type: 'ERROR',
            message: 'Nieznany typ wiadomości',
          };
          ws.send(JSON.stringify(errorMsg));
          return;
      }

      // Dalsza logika po walidacji
      switch (validatedData.type) {
        case 'ANALYZE_SCRIPT': {
          const analyzeData = validatedData as AnalyzeScriptMessage;
          if (!analyzeData.script) {
            const errorMsg: ErrorMessage = {
              type: 'ERROR',
              message: 'Brak pliku do analizy'
            };
            ws.send(JSON.stringify(errorMsg));
            return;
          }

          // Symulacja postępu analizy
          const progress: ProgressMessage = {
            type: 'PROGRESS',
            stage: 'processing',
            progress: 0,
            message: 'Rozpoczynam analizę...'
          };

          ws.send(JSON.stringify(progress));

          // Przykładowa odpowiedź ANALYSIS_RESULT (z wymaganym result)
          // const analysisResult: AnalysisResultMessage = {
          //   type: 'ANALYSIS_RESULT',
          //   result: { analysis: { metadata: { title: '', authors: [], detected_language: '', scene_count: 0, token_count: 0, analysis_timestamp: '' }, overall_summary: '' } }
          // };
          // ws.send(JSON.stringify(analysisResult));

          // Tutaj logika analizy skryptu
          break;
        }
        default: {
          // Pozostałe typy nie są obsługiwane w tym handlerze
        }
      }
    } catch (error) {
      console.error('Błąd podczas przetwarzania wiadomości WebSocket:', error);
      const errorMsg: ErrorMessage = {
        type: 'ERROR',
        message: 'Wystąpił błąd podczas przetwarzania wiadomości'
      };
      ws.send(JSON.stringify(errorMsg));
    }
  });

  ws.on('close', () => {
    clearInterval(interval);
    console.log('Client disconnected');
  });
};

// REST endpoints
router.post('/analyze', upload.single('script'), validateUpload, async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Brak pliku w żądaniu'
      });
    }

    console.log('Plik otrzymany:', req.file.originalname, 'typ:', req.body.type || 'pdf');

    // Odczytaj zawartość pliku
    const filePath = req.file.path;
    
    try {
      let fileContent: string;
      
      if (req.body.type === 'pdf') {
        // Obsługa plików PDF
        const dataBuffer = fs.readFileSync(filePath);
        const data = await pdf(dataBuffer);
        fileContent = data.text;
      } else {
        // Obsługa plików tekstowych
        fileContent = fs.readFileSync(filePath, 'utf-8');
      }
      
      // Prosty test czy plik jest czytelny
      if (!fileContent || fileContent.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Plik jest pusty lub nie może zostać odczytany'
        });
      }

      console.log('Rozpoczynam analizę pliku...');
      const result = await scriptAnalysisService.analyzeScript({
        content: fileContent,
        type: req.body.type || 'pdf',
        filename: req.file.originalname
      });

      console.log('Analiza zakończona pomyślnie');

      // Zwracamy pomyślną odpowiedź
      res.json({
        success: true,
        message: 'Plik został pomyślnie przesłany i przeanalizowany',
        id: Date.now().toString(), // Generujemy unikalne ID
        result: result
      });
    } catch (readError) {
      console.error('Błąd podczas odczytu pliku:', readError);
      return res.status(500).json({
        success: false,
        message: 'Nie można odczytać przesłanego pliku'
      });
    } finally {
      // Usuń plik po analizie
      try {
        fs.unlinkSync(filePath);
        console.log('Plik usunięty:', filePath);
      } catch (unlinkError) {
        console.error('Błąd podczas usuwania pliku:', unlinkError);
      }
    }
  } catch (error) {
    console.error('Błąd podczas analizy skryptu:', error);
    res.status(500).json({
      success: false,
      message: 'Wystąpił błąd podczas analizy skryptu'
    });
  }
});

// GET /api/script/:id/graph/nodes
router.get('/api/script/:id/graph/nodes', async (req, res) => {
  const scriptId = req.params.id;
  const analysisPath = path.join(process.cwd(), 'uploads', `${scriptId}_analysis.json`);
  if (!fs.existsSync(analysisPath)) return res.status(404).send('Analysis not found');
  const analysis = JSON.parse(fs.readFileSync(analysisPath, 'utf-8'));
  const outputPath = path.join(process.cwd(), 'cache', `${scriptId}_nodes.csv`);
  exportNodesCSV(analysis.analysis.characters, outputPath);
  res.download(outputPath, 'nodes.csv');
});

// GET /api/script/:id/graph/edges
router.get('/api/script/:id/graph/edges', async (req, res) => {
  const scriptId = req.params.id;
  const analysisPath = path.join(process.cwd(), 'uploads', `${scriptId}_analysis.json`);
  if (!fs.existsSync(analysisPath)) return res.status(404).send('Analysis not found');
  const analysis = JSON.parse(fs.readFileSync(analysisPath, 'utf-8'));
  const outputPath = path.join(process.cwd(), 'cache', `${scriptId}_edges.csv`);
  exportEdgesCSV(analysis.analysis.relationships, outputPath);
  res.download(outputPath, 'edges.csv');
});

// GET /api/script/:id/graph/gexf
router.get('/api/script/:id/graph/gexf', async (req, res) => {
  const scriptId = req.params.id;
  const analysisPath = path.join(process.cwd(), 'uploads', `${scriptId}_analysis.json`);
  if (!fs.existsSync(analysisPath)) return res.status(404).send('Analysis not found');
  const analysis = JSON.parse(fs.readFileSync(analysisPath, 'utf-8'));
  const outputPath = path.join(process.cwd(), 'cache', `${scriptId}_network.gexf`);
  exportGEXF(analysis.analysis.characters, analysis.analysis.relationships, outputPath);
  res.download(outputPath, 'network.gexf');
});

export default router; 