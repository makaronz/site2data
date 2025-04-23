const { parentPort } = require('worker_threads');
const fs = require('fs').promises;
const pdfParse = require('pdf-parse');

// Konfiguracja optymalizacji pamięci
const CHUNK_SIZE = 1024 * 1024; // 1MB chunks
const MAX_MEMORY_USAGE = 1024 * 1024 * 512; // 512MB limit

// Funkcja do monitorowania użycia pamięci
function checkMemoryUsage() {
  const memoryUsage = process.memoryUsage();
  if (memoryUsage.heapUsed > MAX_MEMORY_USAGE) {
    throw new Error('Przekroczono limit pamięci');
  }
}

// Konfiguracja parsowania PDF
const PDF_OPTIONS = {
  pagerender: function(pageData) {
    checkMemoryUsage();
    return pageData.getTextContent({
      normalizeWhitespace: true,
      disableCombineTextItems: false
    }).then(function(textContent) {
      let lastY, text = [];
      for (let item of textContent.items) {
        if (lastY == item.transform[5] || !lastY) {
          text.push(item.str);
        } else {
          text.push('\n' + item.str);
        }
        lastY = item.transform[5];
      }
      return text.join('');
    });
  },
  max: 0, // Brak limitu stron
};

async function processPDF(filePath) {
  try {
    // Sprawdzenie czy plik istnieje
    await fs.access(filePath);
    
    // Odczyt pliku w trybie strumieniowym
    const dataBuffer = await fs.readFile(filePath);
    
    // Parsowanie PDF z obsługą pamięci
    const data = await pdfParse(dataBuffer, PDF_OPTIONS);
    
    // Czyszczenie pamięci
    dataBuffer = null;
    global.gc && global.gc();
    
    return { text: data.text };
  } catch (error) {
    let errorMessage;
    
    switch(error.code) {
      case 'ENOENT':
        errorMessage = 'Plik PDF nie istnieje';
        break;
      case 'EACCES':
        errorMessage = 'Brak dostępu do pliku PDF';
        break;
      default:
        errorMessage = `Błąd podczas przetwarzania PDF: ${error.message}`;
    }
    
    throw new Error(errorMessage);
  }
}

// Nasłuchiwanie wiadomości od głównego wątku
parentPort.on('message', async (message) => {
  try {
    if (!message.filePath) {
      throw new Error('Nie podano ścieżki do pliku PDF');
    }

    const result = await processPDF(message.filePath);
    parentPort.postMessage(result);
  } catch (error) {
    parentPort.postMessage({ error: error.message });
  } finally {
    // Czyszczenie pamięci po zakończeniu
    global.gc && global.gc();
  }
}); 