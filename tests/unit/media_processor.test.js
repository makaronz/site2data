const MediaProcessor = require('../../backend/src/media_processor');
const fs = require('fs');
const path = require('path');

describe('MediaProcessor', () => {
  let mediaProcessor;
  const testConfig = {
    outputDir: 'test_output',
    debugDir: 'test_debug',
    cleanup_temp_files: true
  };

  beforeEach(() => {
    mediaProcessor = new MediaProcessor(testConfig);
  });

  afterEach(() => {
    // Cleanup test directories
    if (fs.existsSync(testConfig.outputDir)) {
      fs.rmdirSync(testConfig.outputDir, { recursive: true });
    }
    if (fs.existsSync(testConfig.debugDir)) {
      fs.rmdirSync(testConfig.debugDir, { recursive: true });
    }
  });

  describe('initialization', () => {
    test('should create output directories', () => {
      expect(fs.existsSync(testConfig.outputDir)).toBe(true);
      expect(fs.existsSync(testConfig.debugDir)).toBe(true);
    });

    test('should use default config when not provided', () => {
      const defaultProcessor = new MediaProcessor();
      expect(defaultProcessor.config).toBeDefined();
    });
  });

  describe('video processing', () => {
    test('should extract metadata from video file', async () => {
      const testVideoPath = path.join(__dirname, '../fixtures/test_video.mp4');
      const metadata = await mediaProcessor.extract_video_metadata(testVideoPath);
      
      expect(metadata).toHaveProperty('codec');
      expect(metadata).toHaveProperty('width');
      expect(metadata).toHaveProperty('height');
      expect(metadata).toHaveProperty('frame_rate');
      expect(metadata).toHaveProperty('duration');
    });

    test('should detect scene changes', async () => {
      const testVideoPath = path.join(__dirname, '../fixtures/test_video.mp4');
      const scenes = await mediaProcessor.detect_scene_changes(testVideoPath);
      
      expect(Array.isArray(scenes)).toBe(true);
      expect(scenes.length).toBeGreaterThan(0);
      scenes.forEach(scene => {
        expect(typeof scene).toBe('number');
      });
    });
  });

  describe('image processing', () => {
    test('should analyze frame content', async () => {
      const testImagePath = path.join(__dirname, '../fixtures/test_frame.jpg');
      const analysis = await mediaProcessor.analyze_frame(testImagePath);
      
      expect(analysis).toHaveProperty('brightness');
      expect(analysis).toHaveProperty('contrast');
      expect(analysis).toHaveProperty('edges_density');
      expect(analysis).toHaveProperty('text_content');
    });

    test('should detect objects in frame', async () => {
      const testImagePath = path.join(__dirname, '../fixtures/test_frame.jpg');
      const objects = await mediaProcessor.detect_objects(testImagePath);
      
      expect(Array.isArray(objects)).toBe(true);
      objects.forEach(obj => {
        expect(obj).toHaveProperty('position');
        expect(obj).toHaveProperty('area');
        expect(obj).toHaveProperty('type');
      });
    });
  });

  describe('error handling', () => {
    test('should handle non-existent files', async () => {
      await expect(
        mediaProcessor.extract_video_metadata('non_existent.mp4')
      ).rejects.toThrow();
    });

    test('should handle invalid video files', async () => {
      const invalidFilePath = path.join(__dirname, '../fixtures/invalid.mp4');
      await expect(
        mediaProcessor.extract_video_metadata(invalidFilePath)
      ).rejects.toThrow();
    });
  });
}); 