import { splitBySceneOrTokens, ScenarioChunk } from './chunker';

describe('splitBySceneOrTokens', () => {
  it('dzieli scenariusz na sceny po nagłówkach INT./EXT.', () => {
    const script = `
INT. KITCHEN - DAY
John wchodzi do kuchni.

EXT. STREET - NIGHT
Samochód odjeżdża.
    `.trim();

    const chunks: ScenarioChunk[] = splitBySceneOrTokens(script, 3000);

    expect(chunks.length).toBe(2);
    expect(chunks[0].id).toBe('S1');
    expect(chunks[0].title).toBe('INT. KITCHEN - DAY');
    expect(chunks[0].text).toContain('John wchodzi do kuchni');
    expect(chunks[1].id).toBe('S2');
    expect(chunks[1].title).toBe('EXT. STREET - NIGHT');
    expect(chunks[1].text).toContain('Samochód odjeżdża');
  });

  it('dzieli tekst na chunk-i po tokenach, jeśli nie ma nagłówków scen', () => {
    const script = 'Ala ma kota. '.repeat(1000); // długi tekst bez nagłówków
    const chunks: ScenarioChunk[] = splitBySceneOrTokens(script, 100);

    expect(chunks.length).toBeGreaterThan(1);
    expect(chunks[0].id).toMatch(/[0-9a-fA-F-]{36}/); // UUID
    expect(chunks[0].title).toMatch(/Chunk/);
  });
}); 