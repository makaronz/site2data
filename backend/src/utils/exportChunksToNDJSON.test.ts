import fs from 'fs';
import path from 'path';
import { exportChunksToNDJSON } from './exportChunksToNDJSON';
import { ScenarioChunkModel } from '../models/ScenarioChunk';
import mongoose from 'mongoose';

const TEST_NDJSON_PATH = path.join(__dirname, '../../../output/test_scenes.ndjson');
const MONGODB_TEST_URI = process.env.MONGODB_TEST_URI || 'mongodb://localhost:27017/cinehub_test';

describe('exportChunksToNDJSON', () => {
  beforeAll(async () => {
    await mongoose.connect(MONGODB_TEST_URI);
    // Dodaj przykładowe chunk-i do bazy
    await ScenarioChunkModel.create([
      { id: 'S1', index: 0, title: 'INT. TEST', text: '...', status: 'done', parsed: { foo: 1 } },
      { id: 'S2', index: 1, title: 'EXT. TEST', text: '...', status: 'done', parsed: { bar: 2 } },
    ]);
  });

  afterAll(async () => {
    await mongoose.connection.db.dropDatabase();
    await mongoose.disconnect();
    if (fs.existsSync(TEST_NDJSON_PATH)) fs.unlinkSync(TEST_NDJSON_PATH);
  });

  it('generuje poprawny plik NDJSON', async () => {
    await exportChunksToNDJSON(TEST_NDJSON_PATH);

    const lines = fs.readFileSync(TEST_NDJSON_PATH, 'utf-8').trim().split('\n');
    expect(lines.length).toBe(2);

    for (const line of lines) {
      expect(() => JSON.parse(line)).not.toThrow();
    }
    const parsed = lines.map(line => JSON.parse(line));
    expect(parsed[0].id).toBe('S1');
    expect(parsed[1].id).toBe('S2');
  });
}); 