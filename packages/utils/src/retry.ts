import { Logger } from 'pino';

/**
 * Utility function to introduce a delay.
 * @param ms Delay time in milliseconds.
 */
const delay = (ms: number): Promise<void> => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Options for the retryAsync function.
 */
interface RetryOptions {
  retries?: number; // Maximum number of retries
  delayMs?: number; // Initial delay in milliseconds
  backoffFactor?: number; // Factor to multiply delay by for each retry (e.g., 2 for exponential)
  shouldRetry?: (error: any) => boolean; // Function to check if an error is retryable
  logger?: Logger; // Optional logger for debugging
}

/**
 * Wraps an async function with retry logic.
 *
 * @param fn The async function to retry.
 * @param options Retry configuration.
 * @returns A new function that will retry the original function upon failure.
 */
export function retryAsync<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  options: RetryOptions = {}
): (...funcArgs: Parameters<T>) => Promise<Awaited<ReturnType<T>>> {

  const { 
    retries = 3, 
    delayMs = 1000, 
    backoffFactor = 2, 
    shouldRetry = (error: any) => true, // Default: retry on any error
    logger 
  } = options;

  return async (...args: Parameters<T>): Promise<Awaited<ReturnType<T>>> => {
    let lastError: any = null;
    let currentDelay = delayMs;

    for (let i = 0; i <= retries; i++) {
      try {
        if (i > 0) {
          logger?.warn(`Retrying operation (attempt ${i}/${retries}) after delay ${currentDelay}ms...`);
        }
        return await fn(...args);
      } catch (error: any) {
        lastError = error;
        logger?.error({ error: error?.message, attempt: i + 1, args }, `Operation failed on attempt ${i + 1}`);

        if (!shouldRetry(error) || i === retries) {
          logger?.error(`Maximum retries reached or error not retryable. Giving up.`);
          throw lastError; // Throw the last encountered error
        }

        // Wait before retrying
        await delay(currentDelay);
        currentDelay *= backoffFactor; // Apply backoff
      }
    }

    // This part should theoretically not be reached if retries >= 0
    // but included for type safety and logic completeness.
    logger?.error('Exited retry loop unexpectedly.');
    throw lastError || new Error('Retry loop finished without success or error.');
  };
}

// Example usage:
// const resilientFetch = retryAsync(fetch, { retries: 5, logger: myPinoLogger });
// try {
//   const response = await resilientFetch('https://example.com/api');
//   // ... process response
// } catch (error) {
//   // Handle final error after retries
// } 