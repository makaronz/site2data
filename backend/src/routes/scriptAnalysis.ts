import express from 'express';
import { Router } from 'express';
import multer from 'multer';
import fs from 'fs';
import path from 'path';
import { WebSocketClient } from '../types/websocket';
import { scriptAnalysisService } from '../services/scriptAnalysis';
import { exportNodesCSV, exportEdgesCSV, exportGEXF } from '../utils/graphExport';
import { z } from 'zod';
import { pdf } from 'pdf-parse';
import { validateRequest, validationSchemas, validateAuthToken } from '../middleware/validation';

// Definicje typów
interface MulterFile extends Express.Multer.File {
  path: string;
}

// Schemat walidacji dla wiadomości WebSocket
const messageSchema = z.object({
  type: z.enum(['ANALYZE_SCRIPT', 'PROGRESS', 'ANALYSIS_RESULT', 'ERROR']),
  message: z.string().optional(),
  script: z.any().optional(),
  result: z.any().optional()
});

const errorMessageSchema = z.object({
  type: z.literal('ERROR'),
  message: z.string(),
  code: z.string().optional()
});

// Konfiguracja multer dla przesyłania plików
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(process.cwd(), 'uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  }
});

// Filtr plików dla multer - akceptuje tylko PDF i TXT
const fileFilter = (req: express.Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  // Sprawdź mimetype pliku
  if (file.mimetype === 'application/pdf' || file.mimetype === 'text/plain') {
    // Akceptuj plik
    cb(null, true);
  } else {
    // Odrzuć plik
    cb(new Error('Tylko pliki PDF i TXT są dozwolone'));
  }
};

const upload = multer({ 
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  },
  fileFilter // Dodanie filtra plików
});

const router: Router = Router();

// Serwis do śledzenia postępu analizy
class AnalysisProgressTracker {
  private progressMap: Map<string, { 
    progress: number, 
    stage: string, 
    startTime: number,
    lastUpdate: number
  }> = new Map();
  
  startAnalysis(analysisId: string): void {
    this.progressMap.set(analysisId, {
      progress: 0,
      stage: 'initialization',
      startTime: Date.now(),
      lastUpdate: Date.now()
    });
  }
  
  updateProgress(analysisId: string, progress: number, stage: string): void {
    const currentProgress = this.progressMap.get(analysisId);
    if (currentProgress) {
      this.progressMap.set(analysisId, {
        ...currentProgress,
        progress,
        stage,
        lastUpdate: Date.now()
      });
    }
  }
  
  getProgress(analysisId: string): { 
    progress: number; 
    stage: string; 
    elapsedTime: number;
  } | null {
    const progressData = this.progressMap.get(analysisId);
    if (!progressData) return null;
    
    return {
      progress: progressData.progress,
      stage: progressData.stage,
      elapsedTime: Date.now() - progressData.startTime
    };
  }
  
  completeAnalysis(analysisId: string): void {
    this.progressMap.delete(analysisId);
  }
}

const progressTracker = new AnalysisProgressTracker();

// WebSocket handler
export const handleWebSocket = (ws: WebSocketClient) => {
  console.log('WebSocket client connected');
  
  // Autentykacja klienta WebSocket
  let authenticated = false;
  let analysisId: string | null = null;
  
  // Obsługa wiadomości
  ws.on('message', async (message: string) => {
    try {
      const data = JSON.parse(message);
      
      // Walidacja wiadomości
      messageSchema.parse(data);
      
      // Obsługa autentykacji
      if (data.type === 'AUTH') {
        try {
          const authPayload = validationSchemas.websocketAuth.parse(data);
          const tokenValidation = validateAuthToken(authPayload.token);
          
          if (tokenValidation.valid) {
            authenticated = true;
            ws.send(JSON.stringify({
              type: 'PROGRESS',
              message: 'Authentication successful',
              expiresAt: tokenValidation.expiresAt
            }));
          } else {
            ws.send(JSON.stringify({
              type: 'ERROR',
              message: `Authentication failed: ${tokenValidation.error || 'Invalid token'}`,
              code: 'AUTH_FAILED',
              expired: tokenValidation.expired
            }));
            ws.close();
          }
          return;
        } catch (validationError) {
          const errorMessage = validationError instanceof Error 
            ? validationError.message 
            : 'Schema validation failed';
            
          ws.send(JSON.stringify({
            type: 'ERROR',
            message: `Invalid authentication data: ${errorMessage}`,
            code: 'VALIDATION_ERROR'
          }));
          ws.close();
          return;
        }
      }
      
      // Sprawdź autentykację dla pozostałych typów wiadomości
      if (!authenticated) {
        ws.send(JSON.stringify({
          type: 'ERROR',
          message: 'Not authenticated',
          code: 'AUTHENTICATION_REQUIRED'
        }));
        ws.close();
        return;
      }
      
      if (data.type === 'ANALYZE_SCRIPT') {
        console.log('Otrzymano żądanie analizy skryptu przez WebSocket');
        
        // Generuj unikalne ID dla analizy
        analysisId = Date.now().toString();
        progressTracker.startAnalysis(analysisId);
        
        // Wyślij początkową aktualizację postępu
        ws.send(JSON.stringify({
          type: 'PROGRESS',
          message: 'Starting analysis...',
          stage: 'initialization',
          progress: 0,
          analysisId
        }));
        
        try {
          // Rozpocznij rzeczywistą analizę w tle
          const scriptData = data.script;
          
          // Ustaw interwał do raportowania rzeczywistego postępu
          const progressInterval = setInterval(() => {
            if (!analysisId) {
              clearInterval(progressInterval);
              return;
            }
            
            const progressData = progressTracker.getProgress(analysisId);
            if (progressData) {
              ws.send(JSON.stringify({
                type: 'PROGRESS',
                message: `Processing script: ${progressData.stage}`,
                stage: progressData.stage,
                progress: progressData.progress,
                elapsedTime: progressData.elapsedTime,
                analysisId
              }));
            }
          }, 1000);
          
          // Wykonaj rzeczywistą analizę
          const result = await scriptAnalysisService.analyzeScript({
            content: scriptData.content,
            type: scriptData.type || 'text',
            filename: scriptData.filename || 'uploaded-script'
          });
          
          // Zatrzymaj interwał aktualizacji postępu
          clearInterval(progressInterval);
          progressTracker.completeAnalysis(analysisId);
          
          // Wyślij wynik do klienta
          ws.send(JSON.stringify({
            type: 'ANALYSIS_RESULT',
            result,
            analysisId
          }));
        } catch (error) {
          console.error('Błąd podczas analizy skryptu:', error);
          
          // Wyślij informację o błędzie
          const errorMessage = error instanceof Error ? error.message : 'Unknown error during analysis';
          ws.send(JSON.stringify({
            type: 'ERROR',
            message: errorMessage,
            code: 'ANALYSIS_ERROR',
            analysisId
          }));
          
          if (analysisId) {
            progressTracker.completeAnalysis(analysisId);
          }
        }
      }
    } catch (error) {
      console.error('Błąd podczas przetwarzania wiadomości WebSocket:', error);
      const errorMessage = {
        type: 'ERROR',
        message: 'Wystąpił błąd podczas przetwarzania wiadomości',
        code: 'MESSAGE_PROCESSING_ERROR',
        details: error instanceof Error ? error.message : 'Unknown error'
      };
      ws.send(JSON.stringify(errorMessageSchema.parse(errorMessage)));
    }
  });
  
  ws.on('close', () => {
    console.log('Client disconnected');
    if (analysisId) {
      progressTracker.completeAnalysis(analysisId);
    }
  });
};

// REST endpoints
router.post('/analyze', upload.single('script'), validateRequest({ body: validationSchemas.fileUpload }), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Brak pliku w żądaniu',
        code: 'FILE_MISSING'
      });
    }
    console.log('Plik otrzymany:', (req.file as MulterFile).originalname, 'typ:', req.body.type || 'pdf');
    
    // Pobierz token autoryzacyjny z nagłówka
    const authHeader = req.headers.authorization;
    
    // Walidacja tokenu autoryzacyjnego
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      const tokenValidation = validateAuthToken(token);
      
      if (!tokenValidation.valid) {
        return res.status(401).json({
          success: false,
          message: `Authentication failed: ${tokenValidation.error || 'Invalid token'}`,
          code: 'AUTH_FAILED',
          expired: tokenValidation.expired
        });
      }
    }
    
    // Odczytaj zawartość pliku
    const filePath = (req.file as MulterFile).path;
    
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
          message: 'Plik jest pusty lub nie może zostać odczytany',
          code: 'EMPTY_FILE'
        });
      }
      
      // Generuj unikalne ID dla analizy
      const analysisId = Date.now().toString();
      progressTracker.startAnalysis(analysisId);
      
      console.log('Rozpoczynam analizę pliku...');
      const result = await scriptAnalysisService.analyzeScript({
        content: fileContent,
        type: req.body.type || 'pdf',
        filename: (req.file as MulterFile).originalname
      }, authHeader);
      
      progressTracker.completeAnalysis(analysisId);
      console.log('Analiza zakończona pomyślnie');
      
      // Zwracamy pomyślną odpowiedź
      res.json({
        success: true,
        message: 'Plik został pomyślnie przesłany i przeanalizowany',
        id: analysisId,
        result: result
      });
    } catch (readError) {
      console.error('Błąd podczas odczytu pliku:', readError);
      return res.status(500).json({
        success: false,
        message: 'Nie można odczytać przesłanego pliku',
        code: 'FILE_READ_ERROR',
        details: readError instanceof Error ? readError.message : 'Unknown error'
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
      message: 'Wystąpił błąd podczas analizy skryptu',
      code: 'ANALYSIS_ERROR',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// GET /api/script/:id/graph/nodes
router.get('/api/script/:id/graph/nodes', validateRequest({ params: validationSchemas.id }), async (req, res) => {
  try {
    const scriptId = req.params.id;
    let analysisPath = path.join(process.cwd(), 'uploads', `${scriptId}_analysis.json`);
    
    if (!fs.existsSync(analysisPath)) {
      // Fallback do testowego pliku
      const testPath = path.join(process.cwd(), 'uploads', `test_analysis.json`);
      if (fs.existsSync(testPath)) {
        analysisPath = testPath;
      } else {
        return res.status(404).json({
          success: false,
          message: 'Analysis not found',
          code: 'ANALYSIS_NOT_FOUND'
        });
      }
    }
    
    const analysis = JSON.parse(fs.readFileSync(analysisPath, 'utf-8'));
    const outputPath = path.join(process.cwd(), 'cache', `${scriptId}_nodes.csv`);
    exportNodesCSV(analysis.analysis.characters, outputPath);
    res.download(outputPath, 'nodes.csv');
  } catch (error) {
    console.error('Error generating nodes CSV:', error);
    res.status(500).json({
      success: false,
      message: 'Error generating nodes CSV',
      code: 'CSV_GENERATION_ERROR',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// GET /api/script/:id/graph/edges
router.get('/api/script/:id/graph/edges', validateRequest({ params: validationSchemas.id }), async (req, res) => {
  try {
    const scriptId = req.params.id;
    let analysisPath = path.join(process.cwd(), 'uploads', `${scriptId}_analysis.json`);
    
    if (!fs.existsSync(analysisPath)) {
      // Fallback do testowego pliku
      const testPath = path.join(process.cwd(), 'uploads', `test_analysis.json`);
      if (fs.existsSync(testPath)) {
        analysisPath = testPath;
      } else {
        return res.status(404).json({
          success: false,
          message: 'Analysis not found',
          code: 'ANALYSIS_NOT_FOUND'
        });
      }
    }
    
    const analysis = JSON.parse(fs.readFileSync(analysisPath, 'utf-8'));
    const outputPath = path.join(process.cwd(), 'cache', `${scriptId}_edges.csv`);
    exportEdgesCSV(analysis.analysis.relationships, outputPath);
    res.download(outputPath, 'edges.csv');
  } catch (error) {
    console.error('Error generating edges CSV:', error);
    res.status(500).json({
      success: false,
      message: 'Error generating edges CSV',
      code: 'CSV_GENERATION_ERROR',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// GET /api/script/:id/graph/gexf
router.get('/api/script/:id/graph/gexf', validateRequest({ params: validationSchemas.id }), async (req, res) => {
  try {
    const scriptId = req.params.id;
    const analysisPath = path.join(process.cwd(), 'uploads', `${scriptId}_analysis.json`);
    
    if (!fs.existsSync(analysisPath)) {
      return res.status(404).json({
        success: false,
        message: 'Analysis not found',
        code: 'ANALYSIS_NOT_FOUND'
      });
    }
    
    const analysis = JSON.parse(fs.readFileSync(analysisPath, 'utf-8'));
    const outputPath = path.join(process.cwd(), 'cache', `${scriptId}_network.gexf`);
    exportGEXF(analysis.analysis.characters, analysis.analysis.relationships, outputPath);
    res.download(outputPath, 'network.gexf');
  } catch (error) {
    console.error('Error generating GEXF file:', error);
    res.status(500).json({
      success: false,
      message: 'Error generating GEXF file',
      code: 'GEXF_GENERATION_ERROR',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;
