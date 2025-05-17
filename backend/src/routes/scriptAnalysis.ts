import { Router, Request } from 'express';
import multer from 'multer';
import type { FileFilterCallback } from 'multer';
import { scriptAnalysisService } from '../services/scriptAnalysis.js';
import fs from 'fs';
import path from 'path';
import { 
  WebSocketClient, 
  AllWebSocketMessages, 
  ProgressMessage, 
  ErrorMessage, 
  AnalysisResultMessage, 
  AnalyzeScriptMessage
} from '../types/websocket.js';
import { validateUpload } from '../middleware/validation.js';
import config from '../config/environments.js';
import { z } from 'zod';
import { exportNodesCSV, exportEdgesCSV, exportGEXF } from '../utils/graphExport.js';
import logger from '../utils/logger.js';
import { Script } from '../models/script.js';
import { extractTextFromPdf, ensureDirectory, getAnalysisData } from '../utils/pdfUtils';
import { FileProcessingError, logError } from '../utils/errors';

// Tworzymy własny interfejs dla plików Multer zamiast używać namespace
interface MulterFile {
  originalname: string;
  path: string;
  mimetype: string;
  size: number;
  filename: string;
  destination: string;
  buffer?: Buffer;
  encoding?: string;
  fieldname?: string;
}

const router: Router = Router();

// Schematy Zod dla wiadomości WebSocket
const analyzeScriptMessageSchema = z.object({
  type: z.literal('ANALYZE_SCRIPT'),
  script: z.instanceof(Buffer).or(z.string()),
});

const progressMessageSchema = z.object({
  type: z.literal('PROGRESS'),
  stage: z.enum(['uploading', 'processing', 'analyzing', 'complete']),
  progress: z.number(),
  message: z.string(),
});

const analysisResultMessageSchema = z.object({
  type: z.literal('ANALYSIS_RESULT'),
  result: z.object({
    analysis: z.object({
      metadata: z.object({
        title: z.string(),
        authors: z.array(z.string()),
        detected_language: z.string(),
        scene_count: z.number(),
        token_count: z.number(),
        analysis_timestamp: z.string()
      }),
      overall_summary: z.string(),
      characters: z.array(z.object({
        name: z.string(),
        role: z.string(),
        description: z.string().optional(),
        scenes: z.array(z.string()).optional()
      })).optional(),
      scenes: z.array(z.object({
        id: z.string(),
        location: z.string(),
        time: z.string(),
        characters: z.array(z.string()),
        description: z.string()
      })).optional(),
      relationships: z.array(z.object({
        character_a: z.string(),
        character_b: z.string(),
        strength: z.number(),
        overall_sentiment: z.number(),
        key_scenes: z.array(z.string())
      })).optional()
    })
  })
});

const errorMessageSchema = z.object({
  type: z.literal('ERROR'),
  message: z.string(),
});

// Konfiguracja multer dla przesyłania plików
const storage = multer.diskStorage({
  destination: (_req: Request, _file: MulterFile, cb: (error: Error | null, destination: string) => void) => {
    const uploadDir = path.join(process.cwd(), 'uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (_req: Request, file: MulterFile, cb: (error: Error | null, filename: string) => void) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: config.maxFileSize
  },
  fileFilter: (_req: Request, file: MulterFile, cb: FileFilterCallback) => {
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
      logger.warn(`Klient przekroczył limit wiadomości WebSocket.`);
      const errorMsg: ErrorMessage = {
        type: 'ERROR',
        message: 'Przekroczono limit wiadomości WebSocket na minutę. Połączenie zostanie zamknięte.'
      };
      ws.send(JSON.stringify(errorMessageSchema.parse(errorMsg)));
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
            validatedData = analyzeScriptMessageSchema.parse(data) as AnalyzeScriptMessage;
          } catch (error) {
            if (error instanceof z.ZodError) {
              const errorMessage: ErrorMessage = {
                type: 'ERROR',
                message: 'Nieprawidłowa wiadomość ANALYZE_SCRIPT',
              };
              ws.send(JSON.stringify(errorMessageSchema.parse(errorMessage)));
              return;
            }
            throw error;
          }
          break;
        case 'PROGRESS':
          try {
            validatedData = progressMessageSchema.parse(data) as ProgressMessage;
          } catch (error) {
            if (error instanceof z.ZodError) {
              const errorMessage: ErrorMessage = {
                type: 'ERROR',
                message: 'Nieprawidłowa wiadomość PROGRESS',
              };
              ws.send(JSON.stringify(errorMessageSchema.parse(errorMessage)));
              return;
            }
            throw error;
          }
          break;
        case 'ANALYSIS_RESULT':
          try {
            validatedData = analysisResultMessageSchema.parse(data) as AnalysisResultMessage;
          } catch (error) {
            if (error instanceof z.ZodError) {
              const errorMessage: ErrorMessage = {
                type: 'ERROR',
                message: 'Nieprawidłowa wiadomość ANALYSIS_RESULT',
              };
              ws.send(JSON.stringify(errorMessageSchema.parse(errorMessage)));
              return;
            }
            throw error;
          }
          break;
        case 'ERROR':
          try {
            validatedData = errorMessageSchema.parse(data) as ErrorMessage;
          } catch (error) {
            if (error instanceof z.ZodError) {
              const errorMessage: ErrorMessage = {
                type: 'ERROR',
                message: 'Nieprawidłowa wiadomość ERROR',
              };
              ws.send(JSON.stringify(errorMessageSchema.parse(errorMessage)));
              return;
            }
            throw error;
          }
          break;
        default: {
          const errorMessage: ErrorMessage = {
            type: 'ERROR',
            message: 'Nieznany typ wiadomości',
          };
          ws.send(JSON.stringify(errorMessageSchema.parse(errorMessage)));
          return;
        }
      }

      // Dalsza logika po walidacji
      switch (validatedData.type) {
        case 'ANALYZE_SCRIPT': {
          const analyzeData = validatedData as AnalyzeScriptMessage;
          
          if (!analyzeData.script) {
            logger.warn(`Otrzymano żądanie ANALYZE_SCRIPT bez danych skryptu.`);
            const errorMessage: ErrorMessage = {
              type: 'ERROR',
              message: 'Brak pliku do analizy'
            };
            ws.send(JSON.stringify(errorMessageSchema.parse(errorMessage)));
            return;
          }

          logger.info(`Otrzymano skrypt do analizy przez WebSocket. Długość: ${analyzeData.script.length} bajtów.`);

          const sendProgress = (stage: ProgressMessage['stage'], progress: number, message: string) => {
            try {
              const progressMsg: ProgressMessage = { type: 'PROGRESS', stage, progress, message };
              const validatedProgress = progressMessageSchema.parse(progressMsg);
              ws.send(JSON.stringify(validatedProgress));
            } catch (validationError) {
              logger.error(`Błąd walidacji wiadomości postępu:`, validationError);
            }
          };

          sendProgress('processing', 10, 'Rozpoczęto przetwarzanie skryptu...');

          try {
            const scriptContentString = Buffer.isBuffer(analyzeData.script) 
              ? analyzeData.script.toString('utf-8') 
              : analyzeData.script;

            const scriptToAnalyze: Script = {
              content: scriptContentString,
              type: 'pdf',
              filename: 'uploaded_script.pdf'
            };
            
            // Pobranie klucza API ze zmiennych środowiskowych
            const apiKey = process.env.OPENAI_API_KEY;

            if (!apiKey) {
              logger.error('Klucz API OpenAI (OPENAI_API_KEY) nie jest skonfigurowany w zmiennych środowiskowych.');
              const errorMessage: ErrorMessage = {
                type: 'ERROR',
                message: 'Błąd konfiguracji serwera: Brak klucza API.'
              };
              ws.send(JSON.stringify(errorMessageSchema.parse(errorMessage)));
              sendProgress('complete', 100, 'Analiza zakończona z błędem konfiguracji.');
              return;
            }

            sendProgress('analyzing', 30, 'Przekazano skrypt do analizy...');

            const analysisResult = await scriptAnalysisService.analyzeScript(
              scriptToAnalyze,
              apiKey
            );

            if (analysisResult) {
              // Sprawdzenie, czy analysisResult nie jest odpowiedzią błędu z samego serwisu
              if (analysisResult.analysis && analysisResult.analysis.metadata && analysisResult.analysis.metadata.title === 'Błąd analizy') {
                logger.warn('Analiza zakończona z błędem zwróconym przez ScriptAnalysisService.', analysisResult.analysis.overall_summary);
                const errorMessage: ErrorMessage = {
                  type: 'ERROR',
                  message: analysisResult.analysis.overall_summary || 'Wystąpił błąd podczas analizy skryptu.'
                };
                ws.send(JSON.stringify(errorMessageSchema.parse(errorMessage)));
                sendProgress('complete', 100, 'Analiza zakończona z błędem.');
              } else {
                sendProgress('analyzing', 90, 'Finalizowanie wyniku analizy...');
                const validatedResult = analysisResultMessageSchema.parse({
                  type: 'ANALYSIS_RESULT',
                  result: analysisResult,
                });
                ws.send(JSON.stringify(validatedResult));
                logger.info(`Analiza skryptu zakończona sukcesem.`);
                sendProgress('complete', 100, 'Analiza zakończona.');
              }
            } else {
              logger.error(`analyzeScript nie zwrócił wyniku (undefined), co jest nieoczekiwane.`);
              const errorMessage: ErrorMessage = {
                type: 'ERROR',
                message: 'Nie otrzymano wyniku analizy z serwisu.'
              };
              ws.send(JSON.stringify(errorMessageSchema.parse(errorMessage)));
              sendProgress('complete', 100, 'Analiza zakończona z błędem wewnętrznym.');
            }

          } catch (error: unknown) {
            logger.error(`Krytyczny błąd podczas analizy skryptu:`, error);
            const errorMessage: ErrorMessage = {
              type: 'ERROR',
              message: error instanceof Error ? error.message : 'Wystąpił nieoczekiwany błąd serwera podczas analizy.'
            };
            try {
              const validatedError = errorMessageSchema.parse(errorMessage);
              ws.send(JSON.stringify(validatedError));
            } catch (validationError) {
                logger.error(`Błąd walidacji wiadomości błędu (krytyczny):`, validationError);
                ws.send(JSON.stringify(errorMessageSchema.parse({ type: 'ERROR', message: 'Wystąpił wewnętrzny błąd serwera.' })));
            }
            sendProgress('complete', 100, 'Analiza zakończona z błędem krytycznym.');
          }
          break;
        }
        case 'PROGRESS':
          // ... existing code ...
          break;
        default: {
          // Pozostałe typy nie są obsługiwane w tym handlerze
        }
      }
    } catch (error) {
      console.error('Błąd podczas przetwarzania wiadomości WebSocket:', error);
      const errorMessage: ErrorMessage = {
        type: 'ERROR',
        message: 'Wystąpił błąd podczas przetwarzania wiadomości'
      };
      ws.send(JSON.stringify(errorMessageSchema.parse(errorMessage)));
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

    console.log('Plik otrzymany:', (req.file as MulterFile).originalname, 'typ:', req.body.type || 'pdf');

    // Pobierz token autoryzacyjny z nagłówka
    const authHeader = req.headers.authorization;
    
    // Odczytaj zawartość pliku
    const filePath = (req.file as MulterFile).path;
    
    try {
      let fileContent: string;
      
      if (req.body.type === 'pdf') {
        // Używamy centralnej funkcji do ekstrakcji tekstu z PDF
        fileContent = await extractTextFromPdf(filePath);
      } else {
        // Obsługa plików tekstowych
        fileContent = fs.readFileSync(filePath, 'utf-8');
      }
      
      // Prosty test czy plik jest czytelny
      if (!fileContent || fileContent.length === 0) {
        throw new FileProcessingError('Plik jest pusty lub nie może zostać odczytany');
      }

      console.log('Rozpoczynam analizę pliku...');
      const result = await scriptAnalysisService.analyzeScript({
        content: fileContent,
        type: req.body.type || 'pdf',
        filename: (req.file as MulterFile).originalname
      }, authHeader);

      console.log('Analiza zakończona pomyślnie');

      // Zwracamy pomyślną odpowiedź
      res.json({
        success: true,
        message: 'Plik został pomyślnie przesłany i przeanalizowany',
        id: Date.now().toString(), // Generujemy unikalne ID
        result: result
      });
    } catch (readError) {
      logError(readError, { path: filePath, operation: 'file_read' });
      
      // Użyj odpowiedniego kodu błędu i komunikatu zależnie od typu błędu
      if (readError instanceof FileProcessingError) {
        return res.status(400).json({
          success: false,
          message: readError.message,
          code: readError.code
        });
      } else {
        return res.status(500).json({
          success: false,
          message: 'Nie można odczytać przesłanego pliku'
        });
      }
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
    logError(error, { endpoint: '/api/script/analyze' });
    res.status(500).json({
      success: false,
      message: 'Wystąpił błąd podczas analizy skryptu'
    });
  }
});

// GET /api/script/:id/graph/nodes
router.get('/api/script/:id/graph/nodes', async (req, res) => {
  const scriptId = req.params.id;
  let analysisPath = path.join(process.cwd(), 'uploads', `${scriptId}_analysis.json`);
  if (!fs.existsSync(analysisPath)) {
    // Fallback do testowego pliku
    const testPath = path.join(process.cwd(), 'uploads', `test_analysis.json`);
    if (fs.existsSync(testPath)) {
      analysisPath = testPath;
    } else {
      return res.status(404).send('Analysis not found');
    }
  }
  const analysis = JSON.parse(fs.readFileSync(analysisPath, 'utf-8'));
  const outputPath = path.join(process.cwd(), 'cache', `${scriptId}_nodes.csv`);
  exportNodesCSV(analysis.analysis.characters, outputPath);
  res.download(outputPath, 'nodes.csv');
});

// GET /api/script/:id/graph/edges
router.get('/api/script/:id/graph/edges', async (req, res) => {
  const scriptId = req.params.id;
  let analysisPath = path.join(process.cwd(), 'uploads', `${scriptId}_analysis.json`);
  if (!fs.existsSync(analysisPath)) {
    // Fallback do testowego pliku
    const testPath = path.join(process.cwd(), 'uploads', `test_analysis.json`);
    if (fs.existsSync(testPath)) {
      analysisPath = testPath;
    } else {
      return res.status(404).send('Analysis not found');
    }
  }
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