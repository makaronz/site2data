import Papa from 'papaparse';
import type { Scene, SceneRelation } from '../components/GraphView';

export function parseScenesCSV(csv: string): Scene[] {
  const { data } = Papa.parse(csv, { header: true, skipEmptyLines: true });
  return (data as any[]).map(row => ({
    id: String(row.id),
    title: row.title || '',
    description: row.description || '',
    characters: row.characters ? String(row.characters).split(',').map((c: string) => c.trim()) : [],
    x: row.x ? Number(row.x) : undefined,
    y: row.y ? Number(row.y) : undefined,
  }));
}

export function parseRelationsCSV(csv: string): SceneRelation[] {
  const { data } = Papa.parse(csv, { header: true, skipEmptyLines: true });
  return (data as any[]).map(row => ({
    id: String(row.id),
    source: String(row.source),
    target: String(row.target),
    type: row.type || undefined,
  }));
} 