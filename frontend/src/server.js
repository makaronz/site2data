const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { parseScript } = require('./script_parser_updated');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3001;

// Konfiguracja CORS
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type']
}));

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// Konfiguracja multer do obsługi uploadu plików
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(__dirname, 'uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 50 * 1024 * 1024 } // limit do 50MB
});

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

app.get('/api/scripts', async (req, res) => {
  try {
    const uploadDir = path.join(__dirname, 'uploads');
    let files = [];
    
    if (fs.existsSync(uploadDir)) {
      files = fs.readdirSync(uploadDir)
        .filter(file => file.endsWith('.pdf'))
        .map(file => {
          const filePath = path.join(uploadDir, file);
          const stats = fs.statSync(filePath);
          return {
            name: file,
            path: filePath,
            date: stats.mtime
          };
        });
    }
    
    res.json(files);
  } catch (error) {
    console.error('Błąd podczas pobierania listy scenariuszy:', error);
    res.status(500).json({ error: 'Błąd podczas pobierania listy scenariuszy' });
  }
});

// Obsługa SPA
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(port, () => {
  console.log(`Serwer uruchomiony na porcie ${port}`);
}); 