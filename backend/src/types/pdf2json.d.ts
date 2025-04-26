declare module 'pdf2json' {
  interface TextLine {
    T: string;
    S: number;
    TS: number[];
  }

  interface TextItem {
    R: TextLine[];
    x: number;
    y: number;
    w: number;
    sw: number;
    A: string;
    R: TextLine[];
  }

  interface Page {
    Width: number;
    Height: number;
    HLines: any[];
    VLines: any[];
    Fills: any[];
    Texts: TextItem[];
    Fields: any[];
    Boxsets: any[];
  }

  interface PDFData {
    Pages: Page[];
    Width: number;
    Height: number;
    Meta: any;
    Metadata: any;
    Version: string;
  }

  class PDFParser {
    constructor();
    on(event: string, callback: (data: any) => void): void;
    parseBuffer(buffer: Buffer): void;
    loadPDF(pdfFilePath: string): void;
    destroy(): void;
  }

  export = PDFParser;
} 