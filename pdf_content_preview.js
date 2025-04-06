const fs = require('fs');
const path = require('path');
const pdfParse = require('pdf-parse');

const scriptPath = path.join(__dirname, 'XMPS', 'DRUGA-FURIOZA 050624.pdf');

async function showPdfContent() {
  try {
    console.log(`Wczytywanie pliku: ${scriptPath}`);
    
    const dataBuffer = fs.readFileSync(scriptPath);
    const data = await pdfParse(dataBuffer);
    
    console.log('Fragment zawartości pliku PDF:');
    console.log('-----------------------------------');
    console.log(data.text.substring(0, 3000));
    console.log('-----------------------------------');
    
    // Zapisz tekst do pliku dla łatwiejszej analizy
    const textFilePath = path.join(__dirname, 'pdf_content.txt');
    fs.writeFileSync(textFilePath, data.text);
    console.log(`Pełna zawartość zapisana w pliku: ${textFilePath}`);
    
    // Wyświetl pierwsze 50 linii
    const lines = data.text.split('\n').filter(line => line.trim().length > 0);
    console.log('\nPierwsze 50 linii:');
    for (let i = 0; i < Math.min(50, lines.length); i++) {
      console.log(`${i+1}: ${lines[i]}`);
    }
  } catch (error) {
    console.error('Błąd:', error);
  }
}

showPdfContent(); 