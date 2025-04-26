interface RateLimiterConfig {
  requestsPerMinute: number;
}

export class RateLimiter {
  private readonly requestsPerMinute: number;
  private readonly timeWindow: number = 60 * 1000; // 1 minuta w milisekundach
  private requests: number[] = [];

  constructor(config: RateLimiterConfig) {
    this.requestsPerMinute = config.requestsPerMinute;
  }

  public async waitForAvailability(): Promise<void> {
    const now = Date.now();
    
    // Usuń stare requesty (starsze niż timeWindow)
    this.requests = this.requests.filter(
      timestamp => now - timestamp < this.timeWindow
    );

    if (this.requests.length >= this.requestsPerMinute) {
      // Oblicz czas do zwolnienia slotu
      const oldestRequest = this.requests[0];
      const waitTime = this.timeWindow - (now - oldestRequest);
      
      // Czekaj na zwolnienie slotu
      await new Promise(resolve => setTimeout(resolve, waitTime));
      
      // Rekurencyjnie sprawdź ponownie (może być kolejka)
      return this.waitForAvailability();
    }

    // Dodaj nowy request
    this.requests.push(now);
  }

  public getAvailableSlots(): number {
    const now = Date.now();
    this.requests = this.requests.filter(
      timestamp => now - timestamp < this.timeWindow
    );
    return this.requestsPerMinute - this.requests.length;
  }

  public isAvailable(): boolean {
    return this.getAvailableSlots() > 0;
  }
} 