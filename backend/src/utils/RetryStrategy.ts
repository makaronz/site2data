interface RetryStrategyConfig {
  maxRetries: number;
  initialDelay: number;
  maxDelay: number;
}

export class RetryStrategy {
  public readonly maxRetries: number;
  private readonly initialDelay: number;
  private readonly maxDelay: number;

  constructor(config: RetryStrategyConfig) {
    this.maxRetries = config.maxRetries;
    this.initialDelay = config.initialDelay;
    this.maxDelay = config.maxDelay;
  }

  public shouldRetry(error: Error, attempt: number): boolean {
    // Nie próbuj ponownie, jeśli przekroczono limit prób
    if (attempt >= this.maxRetries) {
      return false;
    }

    // Sprawdź typ błędu
    if (error instanceof Error) {
      // Retry dla błędów sieciowych
      if (error.message.includes('network') || 
          error.message.includes('timeout') ||
          error.message.includes('rate limit') ||
          error.message.includes('429') ||
          error.message.includes('500') ||
          error.message.includes('503')) {
        return true;
      }

      // Nie retry dla błędów autoryzacji
      if (error.message.includes('401') ||
          error.message.includes('403') ||
          error.message.includes('authentication')) {
        return false;
      }
    }

    // Domyślnie próbuj ponownie
    return true;
  }

  public getDelay(attempt: number): number {
    // Implementacja exponential backoff z jitterem
    const exponentialDelay = this.initialDelay * Math.pow(2, attempt - 1);
    const jitter = Math.random() * 0.1 * exponentialDelay; // 10% jitter
    const delay = exponentialDelay + jitter;

    // Ogranicz maksymalny delay
    return Math.min(delay, this.maxDelay);
  }

  public async sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  public getMaxAttempts(): number {
    return this.maxRetries;
  }

  public getInitialDelay(): number {
    return this.initialDelay;
  }

  public getMaxDelay(): number {
    return this.maxDelay;
  }
} 