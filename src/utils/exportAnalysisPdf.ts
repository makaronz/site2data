import PDFDocument from 'pdfkit';
import fs from 'fs';

/**
 * Eksportuje wyniki analizy do pliku PDF.
 * @param outputPath Ścieżka do pliku wyjściowego PDF
 * @param analysis Obiekt analizy (np. z analysis.json)
 */
export async function exportAnalysisPdf(outputPath: string, analysis: any) {
  return new Promise<void>((resolve, reject) => {
    const doc = new PDFDocument({ margin: 40 });
    const stream = fs.createWriteStream(outputPath);
    doc.pipe(stream);

    // Tytuł
    doc.fontSize(20).text(analysis.title || 'Script Analysis', { align: 'center' });
    doc.moveDown();

    // Metadane
    if (analysis.metadata) {
      doc.fontSize(12).text('Metadata:', { underline: true });
      Object.entries(analysis.metadata).forEach(([key, value]) => {
        doc.text(`${key}: ${value}`);
      });
      doc.moveDown();
    }

    // Postacie
    if (Array.isArray(analysis.characters)) {
      doc.fontSize(14).text('Characters:', { underline: true });
      analysis.characters.forEach((char: any) => {
        doc.fontSize(12).text(`- ${char.name || char}`);
      });
      doc.moveDown();
    }

    // Relacje
    if (Array.isArray(analysis.relationships)) {
      doc.fontSize(14).text('Relationships:', { underline: true });
      analysis.relationships.slice(0, 10).forEach((rel: any) => {
        doc.fontSize(12).text(`- ${rel.characters?.join(' <-> ') || ''} (${rel.type || ''}, strength: ${rel.strength ?? ''})`);
      });
      doc.moveDown();
    }

    // Statystyki
    if (analysis.statistics) {
      doc.fontSize(14).text('Statistics:', { underline: true });
      Object.entries(analysis.statistics).forEach(([key, value]) => {
        doc.fontSize(12).text(`${key}: ${value}`);
      });
      doc.moveDown();
    }

    // Sceny (opcjonalnie, tylko pierwsze 3)
    if (Array.isArray(analysis.scenes)) {
      doc.fontSize(14).text('Sample Scenes:', { underline: true });
      analysis.scenes.slice(0, 3).forEach((scene: any, idx: number) => {
        doc.fontSize(12).text(`Scene ${idx + 1}: ${scene.heading || ''}`);
        if (scene.description) doc.text(scene.description, { indent: 20 });
        doc.moveDown();
      });
    }

    doc.end();
    stream.on('finish', () => resolve());
    stream.on('error', reject);
  });
} 