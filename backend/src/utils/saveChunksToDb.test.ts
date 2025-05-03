import mongoose from 'mongoose';
import { saveChunksToDb } from './saveChunksToDb';
import { ScenarioChunkModel } from '../models/ScenarioChunk';

const MONGODB_TEST_URI = process.env.MONGODB_TEST_URI || 'mongodb://localhost:27017/cinehub_test';

describe('saveChunksToDb', () => {
  beforeAll(async () => {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/test');
    if (mongoose.connection.db) {
      await mongoose.connection.db.dropDatabase();
    }
  });

  afterAll(async () => {
    if (mongoose.connection.db) {
      await mongoose.connection.db.dropDatabase();
    }
    await mongoose.disconnect();
  });

  it('zapisuje chunk-i do MongoDB z domyślnym statusem "pending"', async () => {
    const script = `
INT. ROOM - DAY
Ala siedzi przy biurku.

EXT. PARK - NIGHT
Pies biega po trawie.
    `.trim();

    await saveChunksToDb(script);

    const chunks = await ScenarioChunkModel.find({});
    expect(chunks.length).toBe(2);
    expect(chunks[0].status).toBe('pending');
    expect(chunks[1].status).toBe('pending');
    expect(chunks[0].title).toMatch(/INT\. ROOM/);
    expect(chunks[1].title).toMatch(/EXT\. PARK/);
  });

  it('zapisuje chunk-i do MongoDB z określonym statusem', async () => {
    const script = `
INT. ROOM - DAY
Ala siedzi przy biurku.

EXT. PARK - NIGHT
Pies biega po trawie.
    `.trim();

    await saveChunksToDb(script, 'completed');

    const chunks = await ScenarioChunkModel.find({});
    expect(chunks.length).toBe(2);
    expect(chunks[0].status).toBe('completed');
    expect(chunks[1].status).toBe('completed');
  });

  it('zwraca błąd, gdy skrypt jest pusty', async () => {
    await expect(saveChunksToDb('')).rejects.toThrow('Script is empty');
  });

  it('zwraca błąd, gdy skrypt nie zawiera żadnych chunków', async () => {
    const script = `
    `.trim();

    await expect(saveChunksToDb(script)).rejects.toThrow('Script does not contain any chunks');
  });

  it('zwraca błąd, gdy chunk jest niepoprawny', async () => {
    const script = `
INT. ROOM - DAY
Ala siedzi przy biurku.
EXT. PARK - NIGHT
Pies biega po trawie.
    `.trim();

    await expect(saveChunksToDb(script)).rejects.toThrow('Invalid chunk format');
  });
});