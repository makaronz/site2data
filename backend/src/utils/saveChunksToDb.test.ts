import mongoose from 'mongoose';
import { saveChunksToDb } from './saveChunksToDb';
import { ScenarioChunkModel } from '../models/ScenarioChunk';

const MONGODB_TEST_URI = process.env.MONGODB_TEST_URI || 'mongodb://localhost:27017/cinehub_test';

describe('saveChunksToDb', () => {
  beforeAll(async () => {
    await mongoose.connect(MONGODB_TEST_URI);
  });

  afterAll(async () => {
    await mongoose.connection.db.dropDatabase();
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
}); 