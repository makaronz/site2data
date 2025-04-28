import fs from 'fs/promises';
import path from 'path';

export class FileSystemCache {
  private readonly basePath: string;

  constructor(basePath: string) {
    this.basePath = basePath;
  }

  async set(key: string, value: any): Promise<void> {
    const filePath = this.getFilePath(key);
    await fs.mkdir(path.dirname(filePath), { recursive: true });
    await fs.writeFile(filePath, JSON.stringify(value));
  }

  async get<T>(key: string): Promise<T | null> {
    const filePath = this.getFilePath(key);
    try {
      const data = await fs.readFile(filePath, 'utf8');
      return JSON.parse(data) as T;
    } catch (error) {
      return null;
    }
  }

  private getFilePath(key: string): string {
    // Tworzymy strukturę katalogów, aby uniknąć zbyt wielu plików w jednym folderze
    const hash = Buffer.from(key).toString('hex');
    return path.join(this.basePath, hash.substring(0, 2), hash.substring(2, 4), `${hash}.json`);
  }
} 