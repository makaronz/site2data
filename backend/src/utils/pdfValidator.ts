import { PDFDocument } from 'pdf-lib';

interface ValidationResult {
  isValid: boolean;
  error?: string;
  pageCount?: number;
  metadata?: {
    title?: string;
    author?: string;
    creator?: string;
    producer?: string;
    creationDate?: Date;
    modificationDate?: Date;
  };
}

export class PDFValidator {
  private readonly maxSize: number = 10 * 1024 * 1024; // 10MB
  private readonly minPages: number = 1;
  private readonly maxPages: number = 500;
  private readonly allowedTypes: string[] = ['%PDF-1'];

  async validate(buffer: Buffer): Promise<ValidationResult> {
    try {
      // Sprawdź rozmiar
      if (buffer.length > this.maxSize) {
        return {
          isValid: false,
          error: 'Plik PDF jest zbyt duży (maksymalny rozmiar: 10MB)'
        };
      }

      // Sprawdź nagłówek PDF
      const header = buffer.slice(0, 7).toString('utf-8');
      if (!this.allowedTypes.some(type => header.startsWith(type))) {
        return {
          isValid: false,
          error: 'Nieprawidłowy format pliku PDF'
        };
      }

      // Sprawdź strukturę PDF
      const pdfDoc = await PDFDocument.load(buffer);
      const pageCount = pdfDoc.getPageCount();

      if (pageCount < this.minPages) {
        return {
          isValid: false,
          error: 'Plik PDF jest pusty'
        };
      }

      if (pageCount > this.maxPages) {
        return {
          isValid: false,
          error: `Przekroczono maksymalną liczbę stron (${this.maxPages})`
        };
      }

      // Sprawdź czy PDF nie jest zaszyfrowany
      if (pdfDoc.isEncrypted) {
        return {
          isValid: false,
          error: 'PDF jest zaszyfrowany'
        };
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
      return {
        isValid: false,
        error: 'Plik PDF jest uszkodzony'
      };
    }
  }
} 