const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

// Initialize Express app
const app = express();
const port = process.env.PORT || 3000;

// Import extractors
const webExtractor = require('./extractors/webExtractor');
const pdfExtractor = require('./extractors/pdfExtractor');

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../public')));

// Routes
app.get('/', (req, res) => {
  res.json({ message: 'Site2Data API' });
});

// Extract data from a website
app.post('/api/extract/web', async (req, res) => {
  try {
    const { url, selectors } = req.body;
    
    if (!url) {
      return res.status(400).json({ error: 'URL is required' });
    }
    
    const data = await webExtractor.extract(url, selectors);
    
    res.json({
      success: true,
      data
    });
  } catch (error) {
    console.error('Error extracting web data:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to extract data'
    });
  }
});

// Extract data from a PDF
app.post('/api/extract/pdf', async (req, res) => {
  try {
    const { filePath, options } = req.body;
    
    if (!filePath) {
      return res.status(400).json({ error: 'File path is required' });
    }
    
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'File not found' });
    }
    
    const data = await pdfExtractor.extract(filePath, options);
    
    res.json({
      success: true,
      data
    });
  } catch (error) {
    console.error('Error extracting PDF data:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to extract data'
    });
  }
});

// Start server
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
}); 