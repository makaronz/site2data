const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { parseScript } = require('./script_parser_updated');

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

// Uruchomienie serwera
app.listen(port, () => {
  console.log(`Serwer uruchomiony na porcie ${port}`);
}); 