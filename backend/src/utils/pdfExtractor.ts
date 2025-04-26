import * as fs from 'fs';
import * as pdf from 'pdf-parse';

export async function extractTextFromPDF(filePath: string): Promise<string> {
  try {
    const dataBuffer = fs.readFileSync(filePath);
    const data = await pdf(dataBuffer);
    return data.text;
  } catch (error) {
    console.error('Błąd podczas ekstrakcji tekstu z PDF:', error);
    throw new Error('Nie udało się odczytać tekstu z pliku PDF');
  } finally {
    // Usuń plik tymczasowy
    try {
      fs.unlinkSync(filePath);
    } catch (error) {
      console.error('Błąd podczas usuwania pliku tymczasowego:', error);
    }
  }
} 