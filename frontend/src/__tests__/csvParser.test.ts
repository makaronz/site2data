import { parseScenesCSV, parseRelationsCSV } from '../utils/csvParser';

describe('parseScenesCSV', () => {
  it('parses scenes CSV correctly', () => {
    // Poprawny CSV: characters jako string, x i y jako liczby
    const csv = `id,title,description,characters,x,y\n1,Scene 1,Desc 1,Anna,Jan,100,200\n2,Scene 2,Desc 2,Marek,300,400`;
    // Ale parser oczekuje: characters jako "Anna,Jan" (jeden string, nie dwie kolumny)
    const csvFixed = `id,title,description,characters,x,y\n1,Scene 1,Desc 1,Anna,Jan,100,200\n2,Scene 2,Desc 2,Marek,300,400`;
    // Użyjemy poprawnego przykładu:
    const csvOk = `id,title,description,characters,x,y\n1,Scene 1,Desc 1,Anna,Jan,100,200\n2,Scene 2,Desc 2,Marek,300,400`;
    // Ale najlepiej przetestować parser na rzeczywistym formacie:
    const csvReal = `id,title,description,characters,x,y\n1,Scene 1,Desc 1,\"Anna,Jan\",100,200\n2,Scene 2,Desc 2,\"Marek\",300,400`;
    const scenes = parseScenesCSV(csvReal);
    expect(scenes[0].id).toBe('1');
    expect(scenes[0].title).toBe('Scene 1');
    expect(scenes[0].description).toBe('Desc 1');
    expect(Array.isArray(scenes[0].characters)).toBe(true);
    expect(scenes[0].characters).toContain('Anna');
    expect(scenes[0].characters).toContain('Jan');
    expect(scenes[0].x).toBe(100);
    expect(scenes[0].y).toBe(200);
  });
});

describe('parseRelationsCSV', () => {
  it('parses relations CSV correctly', () => {
    const csv = `id,source,target,type\ne1,1,2,conflict\ne2,2,3,resolution`;
    const relations = parseRelationsCSV(csv);
    expect(relations).toHaveLength(2);
    expect(relations[0]).toMatchObject({ id: 'e1', source: '1', target: '2', type: 'conflict' });
    expect(relations[1]).toMatchObject({ id: 'e2', source: '2', target: '3', type: 'resolution' });
  });
}); 