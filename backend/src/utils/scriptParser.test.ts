import { ModernScriptParser } from './scriptParser';
import PDFParser from 'pdf2json';

jest.mock('pdf2json');

const mockBuffer = Buffer.from('dummy');

describe('ModernScriptParser', () => {
  let parser: ModernScriptParser;

  beforeEach(() => {
    parser = new ModernScriptParser();
  });

  it('should parse PDF and return cleaned text', async () => {
    // Mock PDFParser
    (PDFParser as any).mockImplementation(function (this: any) {
      this.parseBuffer = () => {
        setTimeout(() => {
          this.emit('pdfParser_dataReady', {
            Pages: [
              {
                Texts: [
                  { R: [{ T: 'Hello' }], x: 0, y: 0, w: 0, sw: 0, A: '' },
                  { R: [{ T: '%20World' }], x: 0, y: 0, w: 0, sw: 0, A: '' },
                ],
                Width: 0, Height: 0, HLines: [], VLines: [], Fills: [], Fields: [], Boxsets: [],
              },
            ],
          });
        }, 0);
      };
      this.on = function (this: any, event: string, cb: Function) {
        this[`_${event}`] = cb;
      };
      this.emit = function (this: any, event: string, data: any) {
        if (this[`_${event}`]) this[`_${event}`](data);
      };
    });

    const result = await parser.parsePDF(mockBuffer);
    expect(result).toContain('Hello World');
  });

  it('should handle PDF parsing error', async () => {
    (PDFParser as any).mockImplementation(function (this: any) {
      this.parseBuffer = () => {
        setTimeout(() => {
          this.emit('pdfParser_dataError', { parserError: 'Parse error' });
        }, 0);
      };
      this.on = function (this: any, event: string, cb: Function) {
        this[`_${event}`] = cb;
      };
      this.emit = function (this: any, event: string, data: any) {
        if (this[`_${event}`]) this[`_${event}`](data);
      };
    });

    await expect(parser.parsePDF(mockBuffer)).rejects.toThrow('Nie udało się sparsować pliku PDF: Parse error');
  });

  it('should clean text correctly', () => {
    const dirty = 'Line1\r\nLine2\n\n\n   Line3';
    const cleaned = (parser as any).cleanText(dirty);
    expect(cleaned).toBe('Line1 Line2 Line3');
  });
}); 