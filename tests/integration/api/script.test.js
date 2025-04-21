const request = require('supertest');
const app = require('../../../backend/src/app');
const path = require('path');
const fs = require('fs');

describe('Script API Endpoints', () => {
  describe('POST /api/script/upload', () => {
    it('should upload a script file successfully', async () => {
      const scriptPath = path.join(__dirname, '../../../XMPS/DRUGA-FURIOZA 050624.pdf');
      const response = await request(app)
        .post('/api/script/upload')
        .attach('script', scriptPath);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('title');
      expect(response.body).toHaveProperty('uploadDate');
    });

    it('should return 400 for invalid file type', async () => {
      const response = await request(app)
        .post('/api/script/upload')
        .attach('script', Buffer.from('fake file'), 'test.txt');

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });
  });

  describe('GET /api/script/:id', () => {
    let scriptId;

    beforeEach(async () => {
      const scriptPath = path.join(__dirname, '../../../XMPS/DRUGA-FURIOZA 050624.pdf');
      const uploadResponse = await request(app)
        .post('/api/script/upload')
        .attach('script', scriptPath);
      scriptId = uploadResponse.body.id;
    });

    it('should retrieve script details', async () => {
      const response = await request(app)
        .get(`/api/script/${scriptId}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('id', scriptId);
      expect(response.body).toHaveProperty('title');
      expect(response.body).toHaveProperty('scenes');
    });

    it('should return 404 for non-existent script', async () => {
      const response = await request(app)
        .get('/api/script/nonexistent-id');

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('error');
    });
  });

  describe('GET /api/script/analysis/:id', () => {
    let scriptId;

    beforeEach(async () => {
      const scriptPath = path.join(__dirname, '../../../XMPS/DRUGA-FURIOZA 050624.pdf');
      const uploadResponse = await request(app)
        .post('/api/script/upload')
        .attach('script', scriptPath);
      scriptId = uploadResponse.body.id;
    });

    it('should return script analysis', async () => {
      const response = await request(app)
        .get(`/api/script/analysis/${scriptId}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('metadata');
      expect(response.body.metadata).toHaveProperty('totalScenes');
      expect(response.body.metadata).toHaveProperty('totalDialogues');
      expect(response.body.metadata).toHaveProperty('uniqueCharacters');
    });
  });
}); 