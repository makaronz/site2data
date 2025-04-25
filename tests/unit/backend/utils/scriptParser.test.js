const ScriptParser = require('../../../../backend/src/utils/scriptParser');
const path = require('path');

describe('ScriptParser', () => {
  let scriptParser;

  beforeEach(() => {
    scriptParser = new ScriptParser();
  });

  describe('parse', () => {
    it('should parse a valid script file', async () => {
      const scriptPath = path.join(__dirname, '../../../../XMPS/DRUGA-FURIOZA 050624.pdf');
      const result = await scriptParser.parse(scriptPath);
      
      expect(result).toBeDefined();
      expect(result.title).toBeDefined();
      expect(result.version).toBeDefined();
      expect(result.metadata).toBeDefined();
      expect(result.scenes).toBeInstanceOf(Array);
    });

    it('should throw an error for non-existent file', async () => {
      const scriptPath = 'nonexistent.pdf';
      await expect(scriptParser.parse(scriptPath)).rejects.toThrow();
    });

    it('should correctly parse scene metadata', async () => {
      const scriptPath = path.join(__dirname, '../../../../XMPS/DRUGA-FURIOZA 050624.pdf');
      const result = await scriptParser.parse(scriptPath);
      
      const firstScene = result.scenes[0];
      expect(firstScene).toBeDefined();
      expect(firstScene.sceneNumber).toBeDefined();
      expect(firstScene.location).toHaveProperty('name');
      expect(firstScene.timeOfDay).toBeDefined();
      expect(firstScene.cast).toBeInstanceOf(Array);
    });

    it('should correctly count total scenes and dialogues', async () => {
      const scriptPath = path.join(__dirname, '../../../../XMPS/DRUGA-FURIOZA 050624.pdf');
      const result = await scriptParser.parse(scriptPath);
      
      expect(result.metadata.totalScenes).toBeGreaterThan(0);
      expect(result.metadata.totalDialogues).toBeGreaterThan(0);
      expect(result.metadata.totalScenes).toBe(result.scenes.length);
    });

    it('should throw an error when no file path is provided', async () => {
      await expect(scriptParser.parse()).rejects.toThrow('Nie podano ścieżki do pliku scenariusza');
    });
  });

  describe('_detectScriptFormat', () => {
    it('should detect standard format', () => {
      const lines = [
        '1. INT. MIESZKANIE ANNY - DZIEŃ',
        'Anna siedzi przy stole.',
        'ANNA:',
        'Dzień dobry!'
      ];
      
      const format = scriptParser._detectScriptFormat(lines);
      expect(format).toBe('standard');
    });

    it('should detect location-time-number format', () => {
      const lines = [
        'MIESZKANIE ANNY - DZIEŃ',
        '1',
        'Anna siedzi przy stole.',
        'ANNA',
        'Dzień dobry!'
      ];
      
      const format = scriptParser._detectScriptFormat(lines);
      expect(format).toBe('location-time-number');
    });
  });

  describe('_createNewScene', () => {
    it('should create a new scene object with correct properties', () => {
      const scene = scriptParser._createNewScene({
        sceneNumber: '1',
        locationType: 'INT.',
        locationName: 'MIESZKANIE ANNY',
        timeOfDay: 'DZIEŃ'
      });
      
      expect(scene).toHaveProperty('sceneNumber', '1');
      expect(scene.location).toHaveProperty('type', 'INT.');
      expect(scene.location).toHaveProperty('name', 'MIESZKANIE ANNY');
      expect(scene).toHaveProperty('timeOfDay', 'DZIEŃ');
      expect(scene).toHaveProperty('cast');
      expect(scene).toHaveProperty('dialogue');
      expect(scene).toHaveProperty('props');
      expect(scene).toHaveProperty('vehicles');
      expect(scene).toHaveProperty('extras');
      expect(scene).toHaveProperty('specialRequirements');
    });
  });

  describe('extractTitle', () => {
    it('should extract title from all uppercase line', () => {
      const lines = [
        'TYTUŁ SCENARIUSZA',
        'Autor: Jan Kowalski',
        'Wersja: 1.0'
      ];
      
      const title = scriptParser.extractTitle(lines);
      expect(title).toBe('TYTUŁ SCENARIUSZA');
    });

    it('should return default title when no title is found', () => {
      const lines = [
        'autor: Jan Kowalski',
        'wersja: 1.0'
      ];
      
      const title = scriptParser.extractTitle(lines);
      expect(title).toBe('Untitled Script');
    });
  });

  describe('extractVersion', () => {
    it('should extract version from line containing version info', () => {
      const lines = [
        'TYTUŁ SCENARIUSZA',
        'Autor: Jan Kowalski',
        'Wersja: 2.5'
      ];
      
      const version = scriptParser.extractVersion(lines);
      expect(version).toBe('2.5');
    });

    it('should return default version when no version is found', () => {
      const lines = [
        'TYTUŁ SCENARIUSZA',
        'Autor: Jan Kowalski'
      ];
      
      const version = scriptParser.extractVersion(lines);
      expect(version).toBe('1.0');
    });
  });
});