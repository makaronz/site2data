import PDFParser from 'pdf2json';

export class ModernScriptParser {
  async parsePDF(buffer: Buffer): Promise<string> {
    return new Promise((resolve, reject) => {
      const pdfParser = new PDFParser();

      pdfParser.on('pdfParser_dataReady', (pdfData) => {
        try {
          const text = decodeURIComponent(pdfData.Pages.reduce((acc, page) => {
            return acc + page.Texts.reduce((textAcc, textItem) => {
              return textAcc + textItem.R.reduce((lineAcc, textLine) => {
                return lineAcc + textLine.T;
              }, '') + ' ';
            }, '') + '\n';
          }, ''));

          resolve(this.cleanText(text));
        } catch (error) {
          reject(new Error('Błąd podczas przetwarzania tekstu z PDF'));
        }
      });

      pdfParser.on('pdfParser_dataError', (errData) => {
        reject(new Error('Nie udało się sparsować pliku PDF: ' + errData.parserError));
      });

      try {
        pdfParser.parseBuffer(buffer);
      } catch (error: unknown) {
        if (error instanceof Error) {
          reject(new Error('Nie udało się sparsować pliku PDF: ' + error.message));
        } else {
          reject(new Error('Nie udało się sparsować pliku PDF'));
        }
      }
    });
  }

  private cleanText(text: string): string {
    return text
      .replace(/\r\n/g, '\n') // Ujednolicenie znaków nowej linii
      .replace(/\s+/g, ' ') // Usunięcie nadmiarowych białych znaków
      .replace(/\n{3,}/g, '\n\n') // Usunięcie nadmiarowych pustych linii
      .trim(); // Usunięcie białych znaków z początku i końca
  }
} 