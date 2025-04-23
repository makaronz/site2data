const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { parseScript } = require('./script_parser_updated');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

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

// Tworzenie katalogów jeśli nie istnieją
const UPLOAD_DIR = path.join(__dirname, 'uploads');
const PUBLIC_DIR = path.join(__dirname, 'public');

try {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
  fs.mkdirSync(PUBLIC_DIR, { recursive: true });
} catch (error) {
  console.error('Błąd podczas tworzenia katalogów:', error);
}

// Konfiguracja multer z walidacją
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, UPLOAD_DIR);
  },
  filename: (req, file, cb) => {
    // Dodaj timestamp do nazwy pliku aby uniknąć konfliktów
    const timestamp = Date.now();
    cb(null, `${timestamp}-${file.originalname}`);
  }
});

const fileFilter = (req, file, cb) => {
  // Sprawdź typ MIME i rozszerzenie
  const allowedTypes = ['application/pdf'];
  const allowedExtensions = ['.pdf'];
  
  const mimeOk = allowedTypes.includes(file.mimetype);
  const extOk = allowedExtensions.includes(path.extname(file.originalname).toLowerCase());
  
  if (mimeOk && extOk) {
    cb(null, true);
  } else {
    cb(new Error('Niedozwolony typ pliku. Akceptowane są tylko pliki PDF.'), false);
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024 // Limit 10MB
  }
});

// Czyszczenie starych plików (starszych niż 24h)
const cleanupUploads = () => {
  const files = fs.readdirSync(UPLOAD_DIR);
  const now = Date.now();
  const ONE_DAY = 24 * 60 * 60 * 1000;
  
  files.forEach(file => {
    const filePath = path.join(UPLOAD_DIR, file);
    const stats = fs.statSync(filePath);
    if (now - stats.mtimeMs > ONE_DAY) {
      fs.unlinkSync(filePath);
      console.log(`Usunięto stary plik: ${file}`);
    }
  });
};

// Uruchom czyszczenie co 6 godzin
setInterval(cleanupUploads, 6 * 60 * 60 * 1000);

// Middleware do obsługi błędów multer
const handleMulterError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ error: 'Plik jest zbyt duży. Maksymalny rozmiar to 10MB.' });
    }
    return res.status(400).json({ error: `Błąd przesyłania pliku: ${err.message}` });
  }
  next(err);
};

// Endpoint do przesyłania plików
app.post('/api/upload', upload.single('script'), handleMulterError, (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Nie przesłano pliku' });
    }
    
    res.json({
      message: 'Plik został przesłany pomyślnie',
      filename: req.file.filename,
      path: req.file.path
    });
  } catch (error) {
    console.error('Błąd podczas przesyłania pliku:', error);
    res.status(500).json({ error: 'Wystąpił błąd podczas przesyłania pliku' });
  }
});

// Endpoint do listowania przesłanych plików
app.get('/api/scripts', (req, res) => {
  try {
    const files = fs.readdirSync(UPLOAD_DIR)
      .filter(file => path.extname(file).toLowerCase() === '.pdf')
      .map(file => ({
        name: file,
        path: path.join(UPLOAD_DIR, file),
        uploadTime: fs.statSync(path.join(UPLOAD_DIR, file)).mtime
      }));
    
    res.json(files);
  } catch (error) {
    console.error('Błąd podczas listowania plików:', error);
    res.status(500).json({ error: 'Wystąpił błąd podczas listowania plików' });
  }
});

// Obsługa błędów
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Wystąpił błąd serwera' });
});

// Obsługa SPA
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Serwer działa na porcie ${PORT}`);
  console.log(`Katalog uploadów: ${UPLOAD_DIR}`);
  console.log(`Katalog publiczny: ${PUBLIC_DIR}`);
}); 