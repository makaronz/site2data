const ScriptParser = require('../../../../backend/src/utils/ScriptParser');
const path = require('path');

describe('ScriptParser', () => {
  describe('parse', () => {
    it('should parse a valid script file', async () => {
      const scriptPath = path.join(__dirname, '../../../../XMPS/DRUGA-FURIOZA 050624.pdf');
      const result = await ScriptParser.parse(scriptPath);
      
      expect(result).toBeDefined();
      expect(result.title).toBeDefined();
      expect(result.version).toBeDefined();
      expect(result.metadata).toBeDefined();
      expect(result.scenes).toBeInstanceOf(Array);
    });

    it('should throw an error for non-existent file', async () => {
      const scriptPath = 'nonexistent.pdf';
      await expect(ScriptParser.parse(scriptPath)).rejects.toThrow();
    });

    it('should correctly parse scene metadata', async () => {
      const scriptPath = path.join(__dirname, '../../../../XMPS/DRUGA-FURIOZA 050624.pdf');
      const result = await ScriptParser.parse(scriptPath);
      
      const firstScene = result.scenes[0];
      expect(firstScene).toBeDefined();
      expect(firstScene.sceneNumber).toBeDefined();
      expect(firstScene.location).toHaveProperty('name');
      expect(firstScene.timeOfDay).toBeDefined();
      expect(firstScene.cast).toBeInstanceOf(Array);
    });

    it('should correctly count total scenes and dialogues', async () => {
      const scriptPath = path.join(__dirname, '../../../../XMPS/DRUGA-FURIOZA 050624.pdf');
      const result = await ScriptParser.parse(scriptPath);
      
      expect(result.metadata.totalScenes).toBeGreaterThan(0);
      expect(result.metadata.totalDialogues).toBeGreaterThan(0);
      expect(result.metadata.totalScenes).toBe(result.scenes.length);
    });
  });
}); 