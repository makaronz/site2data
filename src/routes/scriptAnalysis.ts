import express, { Request, Response } from 'express';
import path from 'path';
import fs from 'fs';
// Jeśli AdmZip i graphExport są dostępne statycznie, odkomentuj poniższe:
// import AdmZip from 'adm-zip';
// import { exportNodesCSV, exportEdgesCSV } from '../utils/graphExport';

const router = express.Router();

// Uniwersalny endpoint eksportu wyników analizy
router.get('/api/script/:id/export', async (req: Request, res: Response) => {
  const scriptId = req.params.id;
  const format = (req.query.format as string)?.toLowerCase() || 'json';
  const uploadsDir = path.join(process.cwd(), 'uploads');
  const cacheDir = path.join(process.cwd(), 'cache');
  const analysisPath = path.join(uploadsDir, `${scriptId}_analysis.json`);

  if (!fs.existsSync(analysisPath)) {
    return res.status(404).json({ success: false, message: 'Analysis not found' });
  }
  const analysis = JSON.parse(fs.readFileSync(analysisPath, 'utf-8'));

  try {
    if (format === 'pdf') {
      const pdfPath = path.join(cacheDir, `${scriptId}_analysis.pdf`);
      const { exportAnalysisPdf } = await import('../utils/exportAnalysisPdf');
      await exportAnalysisPdf(pdfPath, analysis.analysis || analysis);
      res.download(pdfPath, 'analysis.pdf');
    } else if (format === 'json') {
      res.download(analysisPath, 'analysis.json');
    } else if (format === 'csv') {
      // Eksportuj nodes i edges do CSV, spakuj do ZIP
      const nodesPath = path.join(cacheDir, `${scriptId}_nodes.csv`);
      const edgesPath = path.join(cacheDir, `${scriptId}_edges.csv`);
      const { exportNodesCSV, exportEdgesCSV } = await import('../utils/graphExport' as any);
      exportNodesCSV(analysis.analysis.characters, nodesPath);
      exportEdgesCSV(analysis.analysis.relationships, edgesPath);
      const AdmZip = (await import('adm-zip' as any)).default;
      const zip = new AdmZip();
      zip.addLocalFile(nodesPath, '', 'nodes.csv');
      zip.addLocalFile(edgesPath, '', 'edges.csv');
      const zipPath = path.join(cacheDir, `${scriptId}_csv_export.zip`);
      zip.writeZip(zipPath);
      res.download(zipPath, 'analysis_csv.zip');
    } else if (format === 'zip') {
      // Pełny ZIP: analysis.json, nodes.csv, edges.csv, analysis.pdf
      const nodesPath = path.join(cacheDir, `${scriptId}_nodes.csv`);
      const edgesPath = path.join(cacheDir, `${scriptId}_edges.csv`);
      const pdfPath = path.join(cacheDir, `${scriptId}_analysis.pdf`);
      const { exportNodesCSV, exportEdgesCSV } = await import('../utils/graphExport' as any);
      const { exportAnalysisPdf } = await import('../utils/exportAnalysisPdf');
      exportNodesCSV(analysis.analysis.characters, nodesPath);
      exportEdgesCSV(analysis.analysis.relationships, edgesPath);
      await exportAnalysisPdf(pdfPath, analysis.analysis || analysis);
      const AdmZip = (await import('adm-zip' as any)).default;
      const zip = new AdmZip();
      zip.addLocalFile(analysisPath, '', 'analysis.json');
      zip.addLocalFile(nodesPath, '', 'nodes.csv');
      zip.addLocalFile(edgesPath, '', 'edges.csv');
      zip.addLocalFile(pdfPath, '', 'analysis.pdf');
      const zipPath = path.join(cacheDir, `${scriptId}_full_export.zip`);
      zip.writeZip(zipPath);
      res.download(zipPath, 'analysis_full.zip');
    } else {
      res.status(400).json({ success: false, message: 'Unsupported export format' });
    }
  } catch (err: any) {
    res.status(500).json({ success: false, message: 'Export failed', error: err.message });
  }
}); 