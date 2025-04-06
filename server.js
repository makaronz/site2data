const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const fileUpload = require('express-fileupload');
const { parseScript } = require('./script_parser_updated');

// Import routów do zaawansowanej analizy
const advancedAnalysisRoutes = require('./advanced_analysis_routes');

const app = express();
const port = process.env.PORT || 3000;

// Konfiguracja multer do obsługi uploadu plików
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = 'uploads';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir);
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});

const upload = multer({ storage: storage });

// Middleware
app.use(cors());
app.use(express.json());
app.use(fileUpload({
  limits: { fileSize: 50 * 1024 * 1024 }, // limit do 50MB
  useTempFiles: true,
  tempFileDir: '/tmp/'
}));

// Statyczna obsługa plików w katalogu 'public'
app.use(express.static('public'));

// Endpointy API
app.post('/api/parse-script', upload.single('script'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Brak pliku scenariusza' });
    }

    const result = await parseScript(req.file.path);
    res.json(result);
  } catch (error) {
    console.error('Błąd podczas parsowania:', error);
    res.status(500).json({ error: 'Błąd podczas parsowania scenariusza' });
  }
});

app.get('/api/scripts', (req, res) => {
  try {
    const uploadDir = 'uploads';
    if (!fs.existsSync(uploadDir)) {
      return res.json([]);
    }

    const files = fs.readdirSync(uploadDir)
      .filter(file => file.endsWith('.pdf'))
      .map(file => ({
        name: file,
        path: path.join(uploadDir, file),
        date: fs.statSync(path.join(uploadDir, file)).mtime
      }));

    res.json(files);
  } catch (error) {
    console.error('Błąd podczas pobierania listy scenariuszy:', error);
    res.status(500).json({ error: 'Błąd podczas pobierania listy scenariuszy' });
  }
});

// Podłączenie routów do zaawansowanej analizy
app.use('/api/analysis', advancedAnalysisRoutes);

// Zwracanie dokumentacji API
app.get('/api/docs', (req, res) => {
  res.json({
    endpoints: [
      {
        path: '/api/parse-script',
        method: 'POST',
        description: 'Parsuje scenariusz filmowy w formacie PDF',
        params: 'Plik PDF w formacie multipart/form-data'
      },
      {
        path: '/api/scripts',
        method: 'GET',
        description: 'Zwraca listę dostępnych scenariuszy'
      },
      {
        path: '/api/analysis/emotions/:scriptId/:sceneId',
        method: 'GET',
        description: 'Zwraca analizę emocji dla konkretnej sceny'
      },
      {
        path: '/api/analysis/relationships/:scriptId',
        method: 'GET',
        description: 'Zwraca analizę relacji między postaciami'
      },
      {
        path: '/api/analysis/turningpoints/:scriptId',
        method: 'GET',
        description: 'Zwraca punkty zwrotne w scenariuszu'
      },
      {
        path: '/api/analysis/full',
        method: 'POST',
        description: 'Przeprowadza pełną analizę scenariusza'
      },
      {
        path: '/api/analysis/character/:scriptId/:characterName',
        method: 'GET',
        description: 'Zwraca analizę konkretnej postaci'
      }
    ]
  });
});

// Uruchomienie serwera
app.listen(port, () => {
  console.log(`Serwer uruchomiony na porcie ${port}`);
  console.log(`Dokumentacja API dostępna pod adresem: http://localhost:${port}/api/docs`);
}); 