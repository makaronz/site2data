import express from 'express';
import { Router } from 'express';
import multer from 'multer';
import fs from 'fs';
import path from 'path';
import { WebSocketClient } from '../types/websocket';
import { scriptAnalysisService } from '../services/scriptAnalysis';
import { exportNodesCSV, exportEdgesCSV, exportGEXF } from '../utils/graphExport';
import { z } from 'zod';
import pdf from 'pdf-parse';
import { validateRequest, validationSchemas, validateAuthToken } from '../middleware/validation';
// Import the path sanitizer utility
import pathSanitizer from '../utils/pathSanitizer';
// Import rate limiters
import { intensiveLimiter } from '../middleware/rateLimiter';

// Definicje typów
interface MulterFile extends multer.File {
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

// Define allowed upload directory
const UPLOAD_DIR = path.join(process.cwd(), 'uploads');
const CACHE_DIR = path.join(process.cwd(), 'cache');

// Ensure directories exist
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}
if (!fs.existsSync(CACHE_DIR)) {
  fs.mkdirSync(CACHE_DIR, { recursive: true });
}

// Konfiguracja multer dla przesyłania plików
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, UPLOAD_DIR);
  },
  filename: (req, file, cb) => {
    // Sanitize filename to prevent path traversal
    const sanitizedName = file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_');
    cb(null, `${Date.now()}-${sanitizedName}`);
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

// Apply rate limiting to resource-intensive endpoints
router.use('/analyze', intensiveLimiter);
router.use('/api/script/:id/graph', intensiveLimiter);

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
    
    // Odczytaj zawartość pliku - use path sanitization
    try {
      // Sanitize the file path to prevent path traversal
      const filePath = pathSanitizer.sanitizePath((req.file as MulterFile).path, UPLOAD_DIR);
      
      let fileContent: string;
      
      if (req.body.type === 'pdf') {
        // Obsługa plików PDF
        const dataBuffer = await pathSanitizer.safeReadFile(filePath);
        const data = await pdf(dataBuffer);
        fileContent = data.text;
      } else {
        // Obsługa plików tekstowych
        fileContent = (await pathSanitizer.safeReadFile(filePath)).toString('utf-8');
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
      // Usuń plik po analizie - safely using path sanitizer
      try {
        const filePath = pathSanitizer.sanitizePath((req.file as MulterFile).path, UPLOAD_DIR);
        await pathSanitizer.safeDeleteFile(filePath);
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

// Nowy endpoint dla /api/job
router.post('/job', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Brak pliku w żądaniu',
        error: 'FILE_MISSING'
      });
    }
    console.log('Plik otrzymany w /api/job:', (req.file as MulterFile).originalname);
    
    try {
      // Sanitize the file path to prevent path traversal
      const filePath = pathSanitizer.sanitizePath((req.file as MulterFile).path, UPLOAD_DIR);
      
      let fileContent: string;
      const fileType = req.file.mimetype.includes('pdf') ? 'pdf' : 'text';
      
      if (fileType === 'pdf') {
        // Obsługa plików PDF
        const dataBuffer = await pathSanitizer.safeReadFile(filePath);
        const data = await pdf(dataBuffer);
        fileContent = data.text;
      } else {
        // Obsługa plików tekstowych
        fileContent = (await pathSanitizer.safeReadFile(filePath)).toString('utf-8');
      }
      
      // Prosty test czy plik jest czytelny
      if (!fileContent || fileContent.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Plik jest pusty lub nie może zostać odczytany',
          error: 'EMPTY_FILE'
        });
      }
      
      // Generuj unikalne ID dla zadania
      const jobId = Date.now().toString();
      
      console.log('Rozpoczynam analizę pliku w /api/job...');
      const result = await scriptAnalysisService.analyzeScript({
        content: fileContent,
        type: fileType,
        filename: (req.file as MulterFile).originalname
      });
      
      console.log('Analiza w /api/job zakończona pomyślnie');
      
      // Zwracamy pomyślną odpowiedź z ID zadania
      res.json({
        success: true,
        message: 'Plik został pomyślnie przesłany i przeanalizowany',
        jobId: jobId
      });
    } catch (readError) {
      console.error('Błąd podczas odczytu pliku w /api/job:', readError);
      return res.status(500).json({
        success: false,
        message: 'Nie można odczytać przesłanego pliku',
        error: 'FILE_READ_ERROR'
      });
    } finally {
      // Usuń plik po analizie - safely using path sanitizer
      try {
        const filePath = pathSanitizer.sanitizePath((req.file as MulterFile).path, UPLOAD_DIR);
        await pathSanitizer.safeDeleteFile(filePath);
        console.log('Plik usunięty:', filePath);
      } catch (unlinkError) {
        console.error('Błąd podczas usuwania pliku:', unlinkError);
      }
    }
  } catch (error) {
    console.error('Błąd podczas analizy skryptu w /api/job:', error);
    res.status(500).json({
      success: false,
      message: 'Wystąpił błąd podczas analizy skryptu',
      error: 'ANALYSIS_ERROR'
    });
  }
});

// GET /api/script/:id/graph/nodes
router.get('/api/script/:id/graph/nodes', validateRequest({ params: validationSchemas.id }), async (req, res) => {
  try {
    const scriptId = req.params.id;
    // Sanitize script ID to prevent injection
    const sanitizedScriptId = scriptId.replace(/[^a-zA-Z0-9_-]/g, '');
    
    // Use path sanitizer to safely construct file paths
    const analysisPath = pathSanitizer.sanitizePath(
      path.join(UPLOAD_DIR, `${sanitizedScriptId}_analysis.json`),
      UPLOAD_DIR
    );
    
    if (!await pathSanitizer.safeFileExists(analysisPath)) {
      // Fallback to test file with safe path handling
      const testPath = pathSanitizer.sanitizePath(
        path.join(UPLOAD_DIR, 'test_analysis.json'),
        UPLOAD_DIR
      );
      
      if (await pathSanitizer.safeFileExists(testPath)) {
        // Use the test file instead
        const analysisData = JSON.parse((await pathSanitizer.safeReadFile(testPath)).toString('utf-8'));
        const outputPath = pathSanitizer.sanitizePath(
          path.join(CACHE_DIR, `${sanitizedScriptId}_nodes.csv`),
          CACHE_DIR
        );
        
        exportNodesCSV(analysisData.analysis.characters, outputPath);
        return res.download(outputPath, 'nodes.csv');
      } else {
        return res.status(404).json({
          success: false,
          message: 'Analysis not found',
          code: 'ANALYSIS_NOT_FOUND'
        });
      }
    }
    
    const analysisData = JSON.parse((await pathSanitizer.safeReadFile(analysisPath)).toString('utf-8'));
    const outputPath = pathSanitizer.sanitizePath(
      path.join(CACHE_DIR, `${sanitizedScriptId}_nodes.csv`),
      CACHE_DIR
    );
    
    exportNodesCSV(analysisData.analysis.characters, outputPath);
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
    // Sanitize script ID to prevent injection
    const sanitizedScriptId = scriptId.replace(/[^a-zA-Z0-9_-]/g, '');
    
    // Use path sanitizer to safely construct file paths
    const analysisPath = pathSanitizer.sanitizePath(
      path.join(UPLOAD_DIR, `${sanitizedScriptId}_analysis.json`),
      UPLOAD_DIR
    );
    
    if (!await pathSanitizer.safeFileExists(analysisPath)) {
      // Fallback to test file with safe path handling
      const testPath = pathSanitizer.sanitizePath(
        path.join(UPLOAD_DIR, 'test_analysis.json'),
        UPLOAD_DIR
      );
      
      if (await pathSanitizer.safeFileExists(testPath)) {
        // Use the test file instead
        const analysisData = JSON.parse((await pathSanitizer.safeReadFile(testPath)).toString('utf-8'));
        const outputPath = pathSanitizer.sanitizePath(
          path.join(CACHE_DIR, `${sanitizedScriptId}_edges.csv`),
          CACHE_DIR
        );
        
        exportEdgesCSV(analysisData.analysis.relationships, outputPath);
        return res.download(outputPath, 'edges.csv');
      } else {
        return res.status(404).json({
          success: false,
          message: 'Analysis not found',
          code: 'ANALYSIS_NOT_FOUND'
        });
      }
    }
    
    const analysisData = JSON.parse((await pathSanitizer.safeReadFile(analysisPath)).toString('utf-8'));
    const outputPath = pathSanitizer.sanitizePath(
      path.join(CACHE_DIR, `${sanitizedScriptId}_edges.csv`),
      CACHE_DIR
    );
    
    exportEdgesCSV(analysisData.analysis.relationships, outputPath);
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
    // Sanitize script ID to prevent injection
    const sanitizedScriptId = scriptId.replace(/[^a-zA-Z0-9_-]/g, '');
    
    // Use path sanitizer to safely construct file paths
    const analysisPath = pathSanitizer.sanitizePath(
      path.join(UPLOAD_DIR, `${sanitizedScriptId}_analysis.json`),
      UPLOAD_DIR
    );
    
    if (!await pathSanitizer.safeFileExists(analysisPath)) {
      return res.status(404).json({
        success: false,
        message: 'Analysis not found',
        code: 'ANALYSIS_NOT_FOUND'
      });
    }
    
    const analysisData = JSON.parse((await pathSanitizer.safeReadFile(analysisPath)).toString('utf-8'));
    const outputPath = pathSanitizer.sanitizePath(
      path.join(CACHE_DIR, `${sanitizedScriptId}_network.gexf`),
      CACHE_DIR
    );
    
    exportGEXF(analysisData.analysis.characters, analysisData.analysis.relationships, outputPath);
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
