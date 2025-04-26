import { Configuration, OpenAIApi } from 'openai';
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
  private openai: OpenAIApi;
  private retryStrategy: RetryStrategy;
  private rateLimiter: RateLimiter;

  constructor(config: OpenAIServiceConfig) {
    const configuration = new Configuration({
      apiKey: config.apiKey,
    });

    this.openai = new OpenAIApi(configuration);
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
      model?: string;
      temperature?: number;
      maxTokens?: number;
    } = {}
  ) {
    return this.executeWithRetry(
      async () => {
        const response = await this.openai.createCompletion({
          model: options.model || 'text-davinci-003',
          prompt,
          temperature: options.temperature ?? 0.7,
          max_tokens: options.maxTokens ?? 2048,
        });

        return response.data;
      },
      'generateCompletion'
    );
  }

  public async generateEmbedding(text: string) {
    return this.executeWithRetry(
      async () => {
        const response = await this.openai.createEmbedding({
          model: 'text-embedding-ada-002',
          input: text,
        });

        return response.data;
      },
      'generateEmbedding'
    );
  }

  public async analyzeScript(text: string) {
    return this.executeWithRetry(
      async () => {
        const response = await this.openai.createChatCompletion({
          model: 'gpt-4',
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

        return response.data;
      },
      'analyzeScript'
    );
  }
} 