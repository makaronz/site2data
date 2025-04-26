import { Cache } from './cache';

export class OfflineManager {
  private static instance: OfflineManager;
  private cache: Cache;
  private queue: Array<{
    url: string;
    method: string;
    data: any;
  }> = [];

  private constructor() {
    this.cache = Cache.getInstance();
    this.setupOfflineDetection();
  }

  public static getInstance(): OfflineManager {
    if (!OfflineManager.instance) {
      OfflineManager.instance = new OfflineManager();
    }
    return OfflineManager.instance;
  }

  private setupOfflineDetection(): void {
    window.addEventListener('online', () => this.handleOnline());
    window.addEventListener('offline', () => this.handleOffline());
  }

  private handleOnline(): void {
    console.log('Aplikacja jest online');
    this.processQueue();
  }

  private handleOffline(): void {
    console.log('Aplikacja jest offline');
  }

  public addToQueue(url: string, method: string, data: any): void {
    this.queue.push({ url, method, data });
    this.cache.set(`queue_${Date.now()}`, { url, method, data });
  }

  private async processQueue(): Promise<void> {
    while (this.queue.length > 0) {
      const item = this.queue.shift();
      if (item) {
        try {
          await fetch(item.url, {
            method: item.method,
            body: JSON.stringify(item.data),
            headers: {
              'Content-Type': 'application/json',
            },
          });
        } catch (error) {
          console.error('Błąd podczas przetwarzania kolejki:', error);
          this.queue.unshift(item);
          break;
        }
      }
    }
  }

  public isOnline(): boolean {
    return navigator.onLine;
  }

  public getCachedData<T>(key: string): T | null {
    return this.cache.get<T>(key);
  }

  public setCachedData<T>(key: string, data: T): void {
    this.cache.set<T>(key, data);
  }
} 