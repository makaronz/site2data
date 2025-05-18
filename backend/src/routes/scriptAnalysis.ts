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
import { validateRequest, validationSchemas } from '../middleware/validation';

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
  message: z.string()
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

// WebSocket handler
export const handleWebSocket = (ws: WebSocketClient) => {
  console.log('WebSocket client connected');
  
  // Wysyłaj aktualizacje co 2 sekundy (symulacja postępu)
  const interval = setInterval(() => {
    const progress = {
      type: 'PROGRESS',
      message: `Przetwarzanie... ${Math.floor(Math.random() * 100)}%`
    };
    ws.send(JSON.stringify(progress));
  }, 2000);
  
  ws.on('message', async (message: string) => {
    try {
      const data = JSON.parse(message);
      
      // Walidacja wiadomości
      messageSchema.parse(data);
      
      if (data.type === 'ANALYZE_SCRIPT') {
        console.log('Otrzymano żądanie analizy skryptu przez WebSocket');
        
        // Symulacja analizy
        setTimeout(() => {
          clearInterval(interval);
          
          const result = {
            type: 'ANALYSIS_RESULT',
            result: {
              title: 'Przykładowy wynik analizy',
              characters: [
                { id: 1, name: 'Postać 1', scenes: [1, 2, 3] },
                { id: 2, name: 'Postać 2', scenes: [2, 4, 5] }
              ],
              scenes: [
                { id: 1, description: 'Scena 1' },
                { id: 2, description: 'Scena 2' }
              ]
            }
          };
          
          ws.send(JSON.stringify(result));
        }, 5000);
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
router.post('/analyze', upload.single('script'), validateRequest({ body: validationSchemas.fileUpload }), async (req, res) => {
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
