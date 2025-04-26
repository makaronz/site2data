import { promises as fs } from 'fs';
import { join } from 'path';
import crypto from 'crypto';
import { parserConfig } from '../config/parserConfig.js';

export class CacheManager {
  constructor() {
    this.cacheDir = parserConfig.pdf.cache.directory;
    this.ttl = parserConfig.pdf.cache.ttl;
    this.initialize();
  }

  async initialize() {
    try {
      await fs.mkdir(this.cacheDir, { recursive: true });
    } catch (error) {
      console.error('Błąd podczas inicjalizacji cache:', error);
    }
  }

  generateKey(content) {
    return crypto
      .createHash('sha256')
      .update(Buffer.isBuffer(content) ? content : Buffer.from(content))
      .digest('hex');
  }

  async get(key) {
    try {
      const cachePath = join(this.cacheDir, `${key}.json`);
      const stats = await fs.stat(cachePath);
      
      // Sprawdź czy cache nie wygasł
      if (Date.now() - stats.mtimeMs > this.ttl) {
        await this.delete(key);
        return null;
      }

      const data = await fs.readFile(cachePath, 'utf-8');
      return JSON.parse(data);
    } catch (error) {
      return null;
    }
  }

  async set(key, data) {
    try {
      const cachePath = join(this.cacheDir, `${key}.json`);
      await fs.writeFile(cachePath, JSON.stringify(data, null, 2));
      return true;
    } catch (error) {
      console.error('Błąd podczas zapisywania do cache:', error);
      return false;
    }
  }

  async delete(key) {
    try {
      const cachePath = join(this.cacheDir, `${key}.json`);
      await fs.unlink(cachePath);
      return true;
    } catch (error) {
      return false;
    }
  }

  async clear() {
    try {
      const files = await fs.readdir(this.cacheDir);
      await Promise.all(
        files.map(file => fs.unlink(join(this.cacheDir, file)))
      );
      return true;
    } catch (error) {
      console.error('Błąd podczas czyszczenia cache:', error);
      return false;
    }
  }

  async cleanup() {
    try {
      const files = await fs.readdir(this.cacheDir);
      const now = Date.now();

      await Promise.all(
        files.map(async file => {
          const filePath = join(this.cacheDir, file);
          const stats = await fs.stat(filePath);
          
          if (now - stats.mtimeMs > this.ttl) {
            await fs.unlink(filePath);
          }
        })
      );
    } catch (error) {
      console.error('Błąd podczas czyszczenia starych plików cache:', error);
    }
  }
} 