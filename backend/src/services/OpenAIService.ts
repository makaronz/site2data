import OpenAI from 'openai';
import { RateLimiter } from '../utils/RateLimiter';
import { RetryStrategy } from '../utils/RetryStrategy';
import { logger } from '../utils/logger';

interface OpenAIServiceConfig {
  apiKey: string;
  maxRetries?: number;
  initialRetryDelay?: number;
  maxRetryDelay?: number;
  requestsPerMinute?: number;
}

export class OpenAIService {
  private openai: OpenAI;
  private retryStrategy: RetryStrategy;
  private rateLimiter: RateLimiter;

  constructor(config: OpenAIServiceConfig) {
    this.openai = new OpenAI({
      apiKey: config.apiKey,
    });
    
    this.retryStrategy = new RetryStrategy({
      maxRetries: config.maxRetries || 3,
      initialDelay: config.initialRetryDelay || 1000,
      maxDelay: config.maxRetryDelay || 30000,
    });
    this.rateLimiter = new RateLimiter({
      requestsPerMinute: config.requestsPerMinute || 60,
    });
  }

  private async executeWithRetry<T>(
    operation: () => Promise<T>,
    context: string
  ): Promise<T> {
    let lastError: Error | null = null;
    let attempt = 0;

    while (attempt <= this.retryStrategy.maxRetries) {
      try {
        // Czekaj na dostępność w rate limiterze
        await this.rateLimiter.waitForAvailability();

        // Wykonaj operację
        const result = await operation();
        return result;
      } catch (error) {
        lastError = error as Error;
        attempt++;

        // Logowanie błędu
        logger.error(`Error in ${context} (attempt ${attempt}):`, {
          error: lastError.message,
          stack: lastError.stack,
        });

        // Sprawdź czy warto próbować ponownie
        if (!this.retryStrategy.shouldRetry(error as Error, attempt)) {
          break;
        }

        // Oblicz i czekaj przez delay
        const delay = this.retryStrategy.getDelay(attempt);
        logger.info(`Retrying ${context} in ${delay}ms (attempt ${attempt})`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }

    throw lastError || new Error(`Failed after ${attempt} attempts`);
  }

  public async generateCompletion(
    prompt: string,
    options: {
      temperature?: number;
      maxTokens?: number;
    } = {}
  ) {
    return this.executeWithRetry(
      async () => {
        const response = await this.openai.completions.create({
          model: 'gpt-4-turbo-2024-04-09',
          prompt,
          temperature: options.temperature ?? 0.7,
          max_tokens: options.maxTokens ?? 2048,
        });

        return response;
      },
      'generateCompletion'
    );
  }

  public async generateEmbedding(text: string) {
    return this.executeWithRetry(
      async () => {
        const response = await this.openai.embeddings.create({
          model: 'text-embedding-ada-002',
          input: text,
        });

        return response;
      },
      'generateEmbedding'
    );
  }

  public async analyzeScript(text: string) {
    return this.executeWithRetry(
      async () => {
        const response = await this.openai.chat.completions.create({
          model: 'gpt-4-turbo-2024-04-09',
          messages: [
            {
              role: 'system',
              content: 'You are a professional script analyzer. Analyze the following script and provide detailed insights.',
            },
            {
              role: 'user',
              content: text,
            },
          ],
          temperature: 0.7,
        });

        return response;
      },
      'analyzeScript'
    );
  }
} 