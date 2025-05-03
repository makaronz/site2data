const fs = require('fs');
const pdfParse = require('pdf-parse');

const inputPath = 'uploads/Scenariusz filmu Projekt-Y_Final.pdf';
const outputPath = 'uploads/Scenariusz filmu Projekt-Y_Final.txt';

(async () => {
  try {
    const dataBuffer = fs.readFileSync(inputPath);
    const data = await pdfParse(dataBuffer);
    fs.writeFileSync(outputPath, data.text, 'utf8');
    console.log('Text extracted to', outputPath);
  } catch (err) {
    console.error('Extraction failed:', err);
  }
})();