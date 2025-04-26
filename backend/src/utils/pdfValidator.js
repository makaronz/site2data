import { parserConfig, errorMessages } from '../config/parserConfig.js';
import { PDFDocument } from 'pdf-lib';

export class PDFValidator {
  constructor() {
    this.config = parserConfig.pdf.validation;
  }

  async validate(buffer) {
    try {
      // Sprawdź rozmiar
      if (buffer.length > this.config.maxSize) {
        throw new Error(errorMessages.PDF_TOO_LARGE);
      }

      // Sprawdź nagłówek PDF
      const header = buffer.slice(0, 7).toString('utf-8');
      if (!this.config.allowedTypes.some(type => header.startsWith(type))) {
        throw new Error(errorMessages.PDF_INVALID);
      }

      // Sprawdź strukturę PDF
      const pdfDoc = await PDFDocument.load(buffer);
      const pageCount = pdfDoc.getPageCount();

      if (pageCount < this.config.minPages) {
        throw new Error(errorMessages.PDF_EMPTY);
      }

      if (pageCount > this.config.maxPages) {
        throw new Error(`Przekroczono maksymalną liczbę stron (${this.config.maxPages})`);
      }

      // Sprawdź czy PDF nie jest zaszyfrowany
      if (pdfDoc.isEncrypted) {
        throw new Error('PDF jest zaszyfrowany');
      }

      return {
        isValid: true,
        pageCount,
        metadata: {
          title: pdfDoc.getTitle(),
          author: pdfDoc.getAuthor(),
          creator: pdfDoc.getCreator(),
          producer: pdfDoc.getProducer(),
          creationDate: pdfDoc.getCreationDate(),
          modificationDate: pdfDoc.getModificationDate()
        }
      };
    } catch (error) {
      if (Object.values(errorMessages).includes(error.message)) {
        throw error;
      }
      throw new Error(errorMessages.PDF_CORRUPTED);
    }
  }

  async validateMetadata(metadata) {
    const requiredFields = ['title', 'pageCount'];
    const missingFields = requiredFields.filter(field => !metadata[field]);
    
    if (missingFields.length > 0) {
      throw new Error(`Brakujące wymagane pola: ${missingFields.join(', ')}`);
    }

    return true;
  }

  isTextContent(text) {
    if (!text || typeof text !== 'string') {
      return false;
    }

    // Sprawdź czy tekst zawiera sensowną zawartość
    const minLength = 100; // Minimalna długość tekstu
    const minWords = 20; // Minimalna liczba słów
    const minLines = 5; // Minimalna liczba linii

    const words = text.split(/\s+/).filter(word => word.length > 0);
    const lines = text.split('\n').filter(line => line.trim().length > 0);

    return (
      text.length >= minLength &&
      words.length >= minWords &&
      lines.length >= minLines
    );
  }
} 